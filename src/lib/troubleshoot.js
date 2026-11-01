const TROUBLESHOOT_PASSWORD_SHA256 = '41594e1b7426e48e022ce78da901d9f6432caea86b33f07d06c1bb6875b52d14';

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyTroubleshootPassword(password) {
  if (typeof password !== 'string' || !globalThis.crypto?.subtle) return false;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return bytesToHex(new Uint8Array(digest)) === TROUBLESHOOT_PASSWORD_SHA256;
}
