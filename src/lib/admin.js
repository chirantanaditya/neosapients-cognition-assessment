export function isLocalAdminRequest(request, clientAddress) {
  const hostname = new URL(request.url).hostname.toLowerCase();
  const localHostname = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  const address = String(clientAddress || '').toLowerCase();
  const localClient = address === '::1' || address === '127.0.0.1' || address.endsWith('127.0.0.1');
  return localHostname && localClient;
}

export const ADMIN_COOKIE_NAME = 'neosapients_admin_session';
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

const encoder = new TextEncoder();

async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(left, right) {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export async function verifyAdminPassword(candidate, configuredPassword) {
  if (!candidate || !configuredPassword) return false;
  const [candidateDigest, passwordDigest] = await Promise.all([
    digest(`password:${candidate}`),
    digest(`password:${configuredPassword}`),
  ]);
  return constantTimeEqual(candidateDigest, passwordDigest);
}

export async function createAdminSessionToken(configuredPassword) {
  if (!configuredPassword) return '';
  return digest(`session:${configuredPassword}`);
}

export async function hasAdminSession(cookies, configuredPassword) {
  const supplied = cookies.get(ADMIN_COOKIE_NAME)?.value || '';
  const expected = await createAdminSessionToken(configuredPassword);
  return Boolean(supplied && expected && constantTimeEqual(supplied, expected));
}
