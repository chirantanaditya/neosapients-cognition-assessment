function pillar(record, name) {
  return record.pillars?.find((item) => item.name === name)?.pct ?? null;
}

function requireDatabase(db) {
  if (!db?.prepare) throw new Error('D1_DATABASE_BINDING_MISSING');
  return db;
}

export async function saveAssessment(dbBinding, record, source) {
  const result = await requireDatabase(dbBinding).prepare(`
    INSERT INTO assessment_submissions (
      id, submitted_at, name, first_name, last_name, email, company, role, marketing_consent,
      assessment_path, baseline, score, tier, tier_description,
      knowledge_score, memory_score, governance_score,
      ranking_json, answers_json, recommendations_json, record_json, source
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)
    ON CONFLICT(id) DO NOTHING
  `).bind(
    record.id, record.submittedAt, record.name, record.firstName, record.lastName,
    record.email, record.company, record.role, record.consent ? 1 : 0, record.path,
    record.baseline, record.score ?? null, record.tier ?? null, record.tierDescription ?? null,
    pillar(record, 'Knowledge'), pillar(record, 'Memory'), pillar(record, 'Governance'),
    JSON.stringify(record.ranking), JSON.stringify(record.answers || []),
    JSON.stringify(record.actions || []), JSON.stringify(record), source,
  ).run();

  return {
    ok: true,
    id: record.id,
    status: 'SAVED',
    storage: 'D1',
    duplicatePrevented: result.meta?.changes === 0,
  };
}

export async function setCallbackPreference(dbBinding, id, requested) {
  const result = await requireDatabase(dbBinding).prepare(`
    UPDATE assessment_submissions
    SET callback_requested = ?1, callback_requested_at = ?2
    WHERE id = ?3
  `).bind(requested ? 1 : 0, new Date().toISOString(), id).run();
  return result.meta?.changes === 1;
}

function searchPattern(value) {
  return `%${String(value).replace(/[\\%_]/g, '\\$&')}%`;
}

export async function listAssessments(dbBinding, {search = '', limit = 50, offset = 0} = {}) {
  const db = requireDatabase(dbBinding);
  const cleanedSearch = String(search).trim().slice(0, 100);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const where = cleanedSearch
    ? `WHERE first_name LIKE ?1 ESCAPE '\\'
        OR last_name LIKE ?1 ESCAPE '\\'
        OR name LIKE ?1 ESCAPE '\\'
        OR email LIKE ?1 ESCAPE '\\'
        OR company LIKE ?1 ESCAPE '\\'
        OR role LIKE ?1 ESCAPE '\\'
        OR tier LIKE ?1 ESCAPE '\\'`
    : '';
  const pattern = cleanedSearch ? searchPattern(cleanedSearch) : null;
  const count = cleanedSearch
    ? db.prepare(`SELECT COUNT(*) AS count FROM assessment_submissions ${where}`).bind(pattern)
    : db.prepare('SELECT COUNT(*) AS count FROM assessment_submissions');
  const rows = cleanedSearch
    ? db.prepare(`
        SELECT id, submitted_at, name, first_name, last_name, email, company, role, marketing_consent,
          assessment_path, baseline, score, tier, tier_description,
          knowledge_score, memory_score, governance_score,
          ranking_json, answers_json, recommendations_json,
          callback_requested, callback_requested_at
        FROM assessment_submissions ${where}
        ORDER BY submitted_at DESC LIMIT ?2 OFFSET ?3
      `).bind(pattern, safeLimit, safeOffset)
    : db.prepare(`
        SELECT id, submitted_at, name, first_name, last_name, email, company, role, marketing_consent,
          assessment_path, baseline, score, tier, tier_description,
          knowledge_score, memory_score, governance_score,
          ranking_json, answers_json, recommendations_json,
          callback_requested, callback_requested_at
        FROM assessment_submissions
        ORDER BY submitted_at DESC LIMIT ?1 OFFSET ?2
      `).bind(safeLimit, safeOffset);
  const [countResult, rowsResult] = await db.batch([count, rows]);
  return {
    rows: rowsResult.results || [],
    total: Number(countResult.results?.[0]?.count || 0),
    search: cleanedSearch,
    limit: safeLimit,
    offset: safeOffset,
  };
}

export async function getAssessmentStats(dbBinding) {
  return requireDatabase(dbBinding).prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN assessment_path = 'full' THEN 1 ELSE 0 END) AS scored,
      SUM(CASE WHEN assessment_path = 'none' THEN 1 ELSE 0 END) AS priority_only,
      SUM(CASE WHEN callback_requested = 1 THEN 1 ELSE 0 END) AS callback_requests,
      ROUND(AVG(CASE WHEN assessment_path = 'full' THEN score END), 1) AS average_score,
      MAX(submitted_at) AS latest_submission
    FROM assessment_submissions
  `).first();
}

export async function getAssessmentsForExport(dbBinding) {
  const result = await requireDatabase(dbBinding).prepare(`
    SELECT id, submitted_at, name, first_name, last_name, email, company, role, marketing_consent,
      assessment_path, baseline, score, tier, tier_description,
      knowledge_score, memory_score, governance_score,
      ranking_json, answers_json, recommendations_json,
      callback_requested, callback_requested_at
    FROM assessment_submissions
    ORDER BY submitted_at DESC
  `).all();
  return result.results || [];
}
