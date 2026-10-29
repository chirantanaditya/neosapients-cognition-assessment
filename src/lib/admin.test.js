import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  hasAdminSession,
  verifyAdminPassword,
} from './admin.js';

test('accepts only the configured admin password', async () => {
  assert.equal(await verifyAdminPassword('correct-password', 'correct-password'), true);
  assert.equal(await verifyAdminPassword('wrong-password', 'correct-password'), false);
  assert.equal(await verifyAdminPassword('', 'correct-password'), false);
});

test('recognizes only a valid admin session cookie', async () => {
  const password = 'correct-password';
  const token = await createAdminSessionToken(password);
  const validCookies = {get: (name) => name === ADMIN_COOKIE_NAME ? {value: token} : undefined};
  const invalidCookies = {get: () => ({value: 'invalid'})};

  assert.equal(await hasAdminSession(validCookies, password), true);
  assert.equal(await hasAdminSession(invalidCookies, password), false);
});
