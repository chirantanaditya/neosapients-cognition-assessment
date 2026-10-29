const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RESEND_FROM = 'NeoSapients Cognition <cognition@neosapients.ai>';

function envValue(runtimeEnv, name) {
  const runtimeValue = runtimeEnv?.[name];
  if (typeof runtimeValue === 'string' && runtimeValue.trim()) return runtimeValue.trim();
  const processValue = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  return typeof processValue === 'string' ? processValue.trim() : '';
}

function integrationConfig(runtimeEnv = {}) {
  const configuredTimeout = Number(envValue(runtimeEnv, 'INTEGRATION_TIMEOUT_MS'));
  return {
    resendApiKey: envValue(runtimeEnv, 'RESEND_API_KEY'),
    resendFrom: envValue(runtimeEnv, 'RESEND_FROM_EMAIL') || DEFAULT_RESEND_FROM,
    googleSheetsWebhookUrl: envValue(runtimeEnv, 'GOOGLE_SHEETS_WEBHOOK_URL'),
    zapierWebhookUrl: envValue(runtimeEnv, 'ZAPIER_WEBHOOK_URL'),
    timeoutMs: Number.isFinite(configuredTimeout) && configuredTimeout >= 1000
      ? Math.min(configuredTimeout, 15000)
      : DEFAULT_TIMEOUT_MS,
  };
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function assessmentEmail(record) {
  const firstName = escapeHtml(record.name.split(/\s+/)[0] || 'there');
  const score = record.path === 'full'
    ? `<div style="margin:22px 0;padding:20px;border-radius:12px;background:#f4eef9"><div style="font-size:12px;letter-spacing:2px;color:#85659a">YOUR COGNITION SCORE</div><div style="font-size:38px;color:#190636"><strong>${record.score}</strong><span style="font-size:16px"> / 100 · ${escapeHtml(record.tier)}</span></div><p style="margin-bottom:0;color:#644f70">${escapeHtml(record.tierDescription)}</p></div>`
    : '<p style="padding:18px;border-radius:12px;background:#f4eef9;color:#392170">Your priorities are the starting point for a practical Enterprise Cognition roadmap.</p>';
  const priorities = record.ranking.map((priority) => `<li style="margin:6px 0">${escapeHtml(priority)}</li>`).join('');
  const actions = record.actions.slice(0, 3).map((action) => (
    `<li style="margin:12px 0"><strong>${escapeHtml(action.title)}</strong><br><span style="color:#644f70">${escapeHtml(action.body)}</span></li>`
  )).join('');
  const subject = record.path === 'full'
    ? `Your Enterprise AI Cognition Score: ${record.score}/100`
    : 'Your Enterprise AI priorities';
  const text = [
    `Hi ${record.name.split(/\s+/)[0] || 'there'},`,
    '',
    record.path === 'full' ? `Your Enterprise AI Cognition Score is ${record.score}/100 (${record.tier}).` : 'Your Enterprise AI priorities are ready.',
    '',
    'Your priorities:',
    ...record.ranking.map((priority) => `- ${priority}`),
    '',
    'Recommended next moves:',
    ...record.actions.slice(0, 3).map((action) => `- ${action.title}: ${action.body}`),
    '',
    'This is a directional self-assessment based on your answers, not an independent audit or industry benchmark.',
    'https://neosapients.ai',
  ].join('\n');
  const html = `<div style="background:#f6f1fa;padding:30px 12px;font:15px/1.7 Arial,sans-serif;color:#392170"><div style="max-width:620px;margin:auto;background:#fff;border:1px solid #e5d8ed;border-radius:14px;overflow:hidden"><div style="background:#190636;color:#d7b7ff;padding:28px 32px"><div style="letter-spacing:3px;font-size:12px">NEOSAPIENTS</div><h1 style="font-size:27px;line-height:1.3;font-weight:400;margin:18px 0 0">Your Enterprise Cognition starting point</h1></div><div style="padding:26px 32px"><p>Hi ${firstName},</p><p>Thank you for completing the Enterprise AI Cognition assessment.</p>${score}<h2 style="font-size:18px;color:#190636">Your priorities</h2><ol>${priorities}</ol><h2 style="font-size:18px;color:#190636">Recommended next moves</h2><ol>${actions}</ol><p><a href="https://neosapients.ai" style="display:inline-block;padding:11px 20px;border-radius:7px;background:#392170;color:#fff;text-decoration:none">Explore Enterprise Cognition →</a></p><p style="font-size:11px;color:#947ba3">Directional self-assessment based on your answers, not an independent audit or industry benchmark. <a href="https://neosapients.ai/privacy-policy">Privacy policy</a></p></div></div></div>`;
  return {subject, text, html};
}

async function requestWithTimeout(url, options, timeoutMs, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {...options, signal: controller.signal});
  } finally {
    clearTimeout(timer);
  }
}

function skipped(reason) {
  return {status: 'skipped', reason};
}

async function sendResend(record, config, fetchImpl) {
  if (!config.resendApiKey) return skipped('not_configured');
  if (!record.email) return skipped('no_recipient');
  const message = assessmentEmail(record);
  const response = await requestWithTimeout('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `assessment-result/${record.id}`,
    },
    body: JSON.stringify({
      from: config.resendFrom,
      to: [record.email],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  }, config.timeoutMs, fetchImpl);
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const body = await response.json().catch(() => ({}));
  return {status: 'sent', id: body.id || null};
}

async function postWebhook(url, event, config, fetchImpl) {
  if (!url) return skipped('not_configured');
  const response = await requestWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': event.eventId,
    },
    body: JSON.stringify(event),
  }, config.timeoutMs, fetchImpl);
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return {status: 'delivered'};
}

async function safeDelivery(provider, operation) {
  try {
    return [provider, await operation()];
  } catch (error) {
    console.error(`${provider} delivery failed:`, error instanceof Error ? error.message : 'UNKNOWN_ERROR');
    return [provider, {status: 'failed'}];
  }
}

export async function deliverAssessment(record, runtimeEnv = {}, fetchImpl = fetch) {
  const config = integrationConfig(runtimeEnv);
  const event = {
    event: 'assessment.completed',
    eventId: `assessment.completed/${record.id}`,
    version: 1,
    occurredAt: record.submittedAt,
    assessment: record,
  };
  const deliveries = await Promise.all([
    safeDelivery('resend', () => sendResend(record, config, fetchImpl)),
    safeDelivery('zapier', () => postWebhook(config.zapierWebhookUrl, event, config, fetchImpl)),
    safeDelivery('googleSheets', () => postWebhook(config.googleSheetsWebhookUrl, event, config, fetchImpl)),
  ]);
  return Object.fromEntries(deliveries);
}

export async function deliverCallbackPreference(id, requested, runtimeEnv = {}, fetchImpl = fetch) {
  const config = integrationConfig(runtimeEnv);
  const occurredAt = new Date().toISOString();
  const event = {
    event: 'assessment.callback.updated',
    eventId: `assessment.callback.updated/${id}/${requested}`,
    version: 1,
    occurredAt,
    submissionId: id,
    requested,
  };
  const deliveries = await Promise.all([
    safeDelivery('zapier', () => postWebhook(config.zapierWebhookUrl, event, config, fetchImpl)),
    safeDelivery('googleSheets', () => postWebhook(config.googleSheetsWebhookUrl, event, config, fetchImpl)),
  ]);
  return Object.fromEntries(deliveries);
}
