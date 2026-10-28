import {isLocalAdminRequest} from '../../../lib/admin.js';
import {getAssessmentsForExport} from '../../../lib/database.js';

export const prerender = false;

const HEADERS = [
  'submission_id', 'submitted_at', 'name', 'email', 'company', 'role', 'marketing_consent',
  'assessment_path', 'baseline', 'score', 'tier', 'tier_description',
  'knowledge_score', 'memory_score', 'governance_score',
  'priorities_json', 'answers_json', 'recommendations_json',
  'follow_up_requested', 'follow_up_requested_at',
];

function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function GET({request, clientAddress}) {
  if (!isLocalAdminRequest(request, clientAddress)) {
    return new Response('Local access only.', {status: 403});
  }

  const rows = getAssessmentsForExport();
  const csv = [
    HEADERS.map(csvCell).join(','),
    ...rows.map((row) => [
      row.id, row.submitted_at, row.name, row.email, row.company, row.role,
      row.marketing_consent, row.assessment_path, row.baseline, row.score, row.tier,
      row.tier_description, row.knowledge_score, row.memory_score, row.governance_score,
      row.ranking_json, row.answers_json, row.recommendations_json,
      row.callback_requested, row.callback_requested_at,
    ].map(csvCell).join(',')),
  ].join('\r\n');
  const date = new Date().toISOString().slice(0, 10);

  return new Response(`\uFEFF${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="neosapients-assessments-${date}.csv"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
