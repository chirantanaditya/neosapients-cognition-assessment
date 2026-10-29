import assert from 'node:assert/strict';
import test from 'node:test';
import {deliverAssessment, deliverCallbackPreference} from './integrations.js';

const record = {
  id: '88c4208f-64ad-4d4d-b6de-09ddfe4ad625',
  submittedAt: '2026-10-29T06:00:00.000Z',
  name: 'Priya Shah',
  email: 'priya@example.com',
  company: 'Example Bank',
  role: 'Head of AI or Data',
  consent: true,
  path: 'full',
  baseline: 'We have several AI initiatives',
  score: 74,
  tier: 'Governed',
  tierDescription: 'Controls are taking shape.',
  ranking: ['Governance', 'Knowledge', 'Memory'],
  actions: [{title: 'Map controls', body: 'Make ownership explicit.'}],
};

test('delivers an assessment independently to all configured providers', async () => {
  const requests = [];
  const fakeFetch = async (url, options) => {
    requests.push({url, options});
    return new Response(url.includes('resend.com') ? JSON.stringify({id: 'email_123'}) : '{}', {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });
  };
  const result = await deliverAssessment(record, {
    RESEND_API_KEY: 'test_key',
    RESEND_FROM_EMAIL: 'NeoSapients <reports@example.com>',
    ZAPIER_WEBHOOK_URL: 'https://hooks.zapier.test/catch',
    GOOGLE_SHEETS_WEBHOOK_URL: 'https://script.google.test/exec',
  }, fakeFetch);

  assert.deepEqual(result, {
    resend: {status: 'sent', id: 'email_123'},
    zapier: {status: 'delivered'},
    googleSheets: {status: 'delivered'},
  });
  assert.equal(requests.length, 3);
  assert.equal(requests[0].options.headers['Idempotency-Key'], `assessment-result/${record.id}`);
});

test('leaves Google Sheets pending without blocking configured providers', async () => {
  const result = await deliverAssessment(record, {
    RESEND_API_KEY: 'test_key',
    ZAPIER_WEBHOOK_URL: 'https://hooks.zapier.test/catch',
  }, async (url) => new Response(url.includes('resend.com') ? JSON.stringify({id: 'email_456'}) : '{}', {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  }));

  assert.equal(result.resend.status, 'sent');
  assert.equal(result.zapier.status, 'delivered');
  assert.deepEqual(result.googleSheets, {status: 'skipped', reason: 'not_configured'});
});

test('reports one provider failure without rejecting the other deliveries', async () => {
  const result = await deliverAssessment(record, {
    RESEND_API_KEY: 'test_key',
    ZAPIER_WEBHOOK_URL: 'https://hooks.zapier.test/catch',
  }, async (url) => new Response(url.includes('resend.com') ? '{}' : 'failed', {
    status: url.includes('resend.com') ? 200 : 500,
    headers: {'Content-Type': 'application/json'},
  }));

  assert.equal(result.resend.status, 'sent');
  assert.equal(result.zapier.status, 'failed');
});

test('sends callback updates only to configured webhooks', async () => {
  const requests = [];
  const result = await deliverCallbackPreference(record.id, true, {
    ZAPIER_WEBHOOK_URL: 'https://hooks.zapier.test/catch',
  }, async (url, options) => {
    requests.push({url, body: JSON.parse(options.body)});
    return new Response('{}', {status: 200});
  });

  assert.equal(result.zapier.status, 'delivered');
  assert.equal(result.googleSheets.status, 'skipped');
  assert.equal(requests[0].body.event, 'assessment.callback.updated');
  assert.equal(requests[0].body.requested, true);
});
