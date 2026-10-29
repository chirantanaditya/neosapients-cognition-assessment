import {Capacitor, registerPlugin} from '@capacitor/core';
import {validateAndScoreSubmission} from './submission.js';

const AssessmentStore = registerPlugin('AssessmentStore');
const FALLBACK_KEY = 'neosapients.assessments.v1';

export const isNativeApp = Capacitor.isNativePlatform();

function readBrowserRecords() {
  try {
    const value = JSON.parse(localStorage.getItem(FALLBACK_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeBrowserRecords(records) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(records));
}

export async function saveAssessment(input) {
  const record = validateAndScoreSubmission(input);
  if (isNativeApp) return AssessmentStore.saveAssessment({record});

  const records = readBrowserRecords();
  const duplicatePrevented = records.some((item) => item.id === record.id);
  if (!duplicatePrevented) {
    records.unshift(record);
    writeBrowserRecords(records);
  }
  return {ok: true, id: record.id, status: 'SAVED', storage: 'BROWSER', duplicatePrevented};
}

export async function setCallbackPreference(id, requested) {
  if (isNativeApp) return AssessmentStore.setCallbackPreference({id, requested});

  const records = readBrowserRecords();
  const record = records.find((item) => item.id === id);
  if (!record) throw new Error('ASSESSMENT_NOT_FOUND');
  record.callbackRequested = requested;
  record.callbackRequestedAt = new Date().toISOString();
  writeBrowserRecords(records);
  return {ok: true, requested};
}

export async function listAssessments() {
  if (isNativeApp) {
    const result = await AssessmentStore.listAssessments();
    return Array.isArray(result.records) ? result.records : [];
  }
  return readBrowserRecords().sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
}

const CSV_HEADERS = [
  'submission_id', 'submitted_at', 'name', 'email', 'company', 'role', 'marketing_consent',
  'assessment_path', 'baseline', 'score', 'tier', 'tier_description',
  'knowledge_score', 'memory_score', 'governance_score', 'priorities_json',
  'answers_json', 'recommendations_json', 'follow_up_requested', 'follow_up_requested_at',
];

function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function pillar(record, name) {
  return record.pillars?.find((item) => item.name === name)?.pct ?? '';
}

export function assessmentsToCsv(records) {
  const rows = records.map((record) => [
    record.id, record.submittedAt, record.name, record.email, record.company, record.role,
    record.consent ? 1 : 0, record.path, record.baseline, record.score ?? '', record.tier ?? '',
    record.tierDescription ?? '', pillar(record, 'Knowledge'), pillar(record, 'Memory'),
    pillar(record, 'Governance'), JSON.stringify(record.ranking || []),
    JSON.stringify(record.answers || []), JSON.stringify(record.actions || []),
    record.callbackRequested == null ? '' : record.callbackRequested ? 1 : 0,
    record.callbackRequestedAt || '',
  ]);
  return `\uFEFF${[CSV_HEADERS, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
}

export async function exportAssessments(records) {
  const date = new Date().toISOString().slice(0, 10);
  const filename = `neosapients-assessments-${date}.csv`;
  const content = assessmentsToCsv(records);
  if (isNativeApp) return AssessmentStore.exportCsv({filename, content});

  const url = URL.createObjectURL(new Blob([content], {type: 'text/csv;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return {ok: true, filename};
}
