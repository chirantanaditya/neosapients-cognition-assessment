import {COGNITION_CONTENT} from './content.js';
import * as engine from './engine.js';

const ROLES = new Set([
  '',
  'CIO / CTO',
  'Head of AI or Data',
  'Risk & Compliance',
  'Business line leader',
  'Other',
]);

function cleanText(value, max, field, required = true) {
  if (typeof value !== 'string' || value.length > max) throw new Error(`INVALID_${field}`);
  const cleaned = value.trim();
  if (required && !cleaned) throw new Error(`INVALID_${field}`);
  return cleaned;
}

export function validateAndScoreSubmission(input) {
  if (!input || typeof input !== 'object') throw new Error('INVALID_REQUEST');
  if (typeof input.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id)) {
    throw new Error('INVALID_ID');
  }

  const submittedAt = new Date().toISOString();
  const rawLead = input.lead || {};
  const lead = {
    name: cleanText(rawLead.name, 140, 'NAME'),
    email: cleanText(rawLead.email || '', 254, 'EMAIL', false).toLowerCase(),
    company: cleanText(rawLead.company, 140, 'COMPANY'),
    role: cleanText(rawLead.role || '', 60, 'ROLE', false),
    consent: rawLead.consent === true,
  };

  if (lead.email && (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email) || /[\r\n,;]/.test(lead.email))) {
    throw new Error('INVALID_EMAIL');
  }
  if (!ROLES.has(lead.role)) throw new Error('INVALID_ROLE');

  const answers = input.answers || {};
  const baselineAnswer = answers.B1;
  if (!Number.isInteger(baselineAnswer) || baselineAnswer < 0 || baselineAnswer >= engine.baseline[0].opts.length) {
    throw new Error('INVALID_ROUTE');
  }

  const ranking = input.ranking;
  if (
    !Array.isArray(ranking) ||
    ranking.length < 3 ||
    ranking.length > engine.priorities.length ||
    new Set(ranking).size !== ranking.length ||
    ranking.some((item) => !Number.isInteger(item) || item < 0 || item >= engine.priorities.length)
  ) {
    throw new Error('INVALID_RANKING');
  }

  const assessmentPath = engine.path(baselineAnswer);
  const priorityActions = engine.priorityActions(ranking);
  const record = {
    id: input.id,
    submittedAt,
    ...lead,
    path: assessmentPath,
    baseline: engine.baseline[0].opts[baselineAnswer],
    ranking: ranking.map((index) => engine.priorities[index][0]),
    priorityActions,
    actions: priorityActions,
  };

  if (assessmentPath === 'full') {
    const score = engine.score(answers, COGNITION_CONTENT.QUESTIONS, COGNITION_CONTENT.TIERS);
    Object.assign(record, {
      score: score.total,
      tier: score.tier.name,
      tierDescription: score.tier.desc,
      pillars: score.pillars,
      answers: COGNITION_CONTENT.QUESTIONS.map((question) => ({
        id: question.id,
        topic: question.topic,
        result: answers[question.id] === question.strong ? 'strong' : 'gap',
      })),
      actions: score.actions,
    });
  }

  return record;
}
