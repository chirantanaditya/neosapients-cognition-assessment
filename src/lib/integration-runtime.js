const NAMES = [
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'ZAPIER_WEBHOOK_URL',
  'GOOGLE_SHEETS_WEBHOOK_URL',
  'INTEGRATION_TIMEOUT_MS',
];

export function integrationRuntimeEnv(runtimeEnv = {}) {
  return Object.fromEntries(NAMES.map((name) => [name, runtimeEnv[name] || '']));
}
