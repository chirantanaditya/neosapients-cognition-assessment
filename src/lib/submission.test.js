import assert from 'node:assert/strict';
import test from 'node:test';
import {validateAndScoreSubmission} from './submission.js';

function submission(overrides = {}) {
  return {
    id: '88c4208f-64ad-4d4d-b6de-09ddfe4ad625',
    lead: {
      firstName: 'Priya',
      lastName: 'Shah',
      email: 'priya@example.com',
      company: 'Example Bank',
      role: 'Head of AI or Data',
      consent: true,
      ...overrides,
    },
    answers: {B1: 0},
    ranking: [0, 1, 2],
  };
}

test('stores first and last names separately and derives the full name', () => {
  const record = validateAndScoreSubmission(submission());
  assert.equal(record.firstName, 'Priya');
  assert.equal(record.lastName, 'Shah');
  assert.equal(record.name, 'Priya Shah');
});

test('requires both first and last name', () => {
  assert.throws(() => validateAndScoreSubmission(submission({lastName: ''})), /INVALID_LAST_NAME/);
});
