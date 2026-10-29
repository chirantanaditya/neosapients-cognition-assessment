import {exportAssessments, isNativeApp, listAssessments} from '../lib/storage.js';

if (isNativeApp) document.documentElement.classList.add('native-tv');

const elements = {
  total: document.getElementById('stat-total'),
  scored: document.getElementById('stat-scored'),
  priority: document.getElementById('stat-priority'),
  followup: document.getElementById('stat-followup'),
  average: document.getElementById('stat-average'),
  search: document.getElementById('search'),
  searchForm: document.getElementById('search-form'),
  count: document.getElementById('count'),
  tbody: document.getElementById('responses'),
  table: document.getElementById('table-wrap'),
  empty: document.getElementById('empty'),
  exportButton: document.getElementById('export'),
  exportStatus: document.getElementById('export-status'),
};

let records = [];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function pillar(record, name) {
  return record.pillars?.find((item) => item.name === name)?.pct ?? '—';
}

function recordMatches(record, query) {
  if (!query) return true;
  return [record.name, record.email, record.company, record.role, record.tier]
    .some((value) => String(value || '').toLocaleLowerCase().includes(query));
}

function list(items, renderItem) {
  return items?.length ? `<ul>${items.map(renderItem).join('')}</ul>` : '<span class="muted">None recorded</span>';
}

function rowMarkup(record) {
  const callback = record.callbackRequested === true
    ? '<span class="followup yes">Requested</span>'
    : record.callbackRequested === false
      ? '<span class="followup no">Not now</span>'
      : '—';
  return `<tr>
    <td class="person" data-label="Participant"><strong>${escapeHtml(record.name)}</strong><span>${escapeHtml(record.email || 'No email')}</span></td>
    <td data-label="Company">${escapeHtml(record.company)}<span class="muted">${escapeHtml(record.role || 'Role not provided')}</span></td>
    <td data-label="Submitted">${escapeHtml(formatDate(record.submittedAt))}</td>
    <td data-label="Path">${record.path === 'full' ? 'Full score' : 'Priorities'}</td>
    <td data-label="Score"><span class="score">${record.score ?? '—'}</span></td>
    <td data-label="Tier">${record.tier ? `<span class="tier">${escapeHtml(record.tier)}</span>` : '—'}</td>
    <td data-label="Follow-up">${callback}</td>
    <td data-label="Response">
      <details class="details">
        <summary>View details</summary>
        <div class="detail-panel">
          <div class="detail-grid">
            <div><small>Knowledge</small><b>${pillar(record, 'Knowledge')}</b></div>
            <div><small>Memory</small><b>${pillar(record, 'Memory')}</b></div>
            <div><small>Governance</small><b>${pillar(record, 'Governance')}</b></div>
          </div>
          <h3>Baseline</h3><div>${escapeHtml(record.baseline)}</div>
          <h3>Priorities</h3>${list(record.ranking, (item) => `<li>${escapeHtml(item)}</li>`)}
          ${record.answers?.length ? `<h3>Answers</h3>${list(record.answers, (item) => `<li>${escapeHtml(item.topic)}: ${escapeHtml(item.result)}</li>`)}` : ''}
          <h3>Recommendations</h3>${list(record.actions, (item) => `<li><strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.body)}</li>`)}
        </div>
      </details>
    </td>
  </tr>`;
}

function renderStats() {
  const scored = records.filter((record) => record.path === 'full');
  const totalScore = scored.reduce((sum, record) => sum + (Number(record.score) || 0), 0);
  elements.total.textContent = records.length;
  elements.scored.textContent = scored.length;
  elements.priority.textContent = records.length - scored.length;
  elements.followup.textContent = records.filter((record) => record.callbackRequested === true).length;
  elements.average.textContent = scored.length ? (totalScore / scored.length).toFixed(1).replace(/\.0$/, '') : '—';
}

function renderRows() {
  const query = elements.search.value.trim().toLocaleLowerCase();
  const filtered = records.filter((record) => recordMatches(record, query));
  elements.count.textContent = `${filtered.length} matching ${filtered.length === 1 ? 'response' : 'responses'}`;
  elements.tbody.innerHTML = filtered.map(rowMarkup).join('');
  elements.table.hidden = filtered.length === 0;
  elements.empty.hidden = filtered.length > 0;
  elements.empty.textContent = query ? 'No matching assessment responses.' : 'No assessment responses have been saved on this TV.';
}

elements.searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  renderRows();
});
elements.search.addEventListener('input', renderRows);

elements.exportButton.addEventListener('click', async () => {
  elements.exportButton.disabled = true;
  elements.exportStatus.textContent = 'Preparing CSV export…';
  try {
    const result = await exportAssessments(records);
    elements.exportStatus.textContent = result.path ? `CSV saved to ${result.path}` : 'CSV export created.';
  } catch {
    elements.exportStatus.textContent = 'The CSV could not be exported. Please try again.';
  } finally {
    elements.exportButton.disabled = false;
  }
});

window.addEventListener('tv-back', () => location.replace('/index.html'));

try {
  records = await listAssessments();
  renderStats();
  renderRows();
  if (isNativeApp) elements.search.focus({preventScroll: true});
} catch {
  elements.count.textContent = 'Storage unavailable';
  elements.empty.textContent = 'Assessment records could not be opened on this device.';
}
