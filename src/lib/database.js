import {mkdirSync} from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

let database;

function databaseFile() {
  const configured = process.env.ASSESSMENT_DB_PATH?.trim();
  return path.resolve(configured || path.join(process.cwd(), 'data', 'assessments.sqlite'));
}

function openDatabase() {
  if (database) return database;

  const file = databaseFile();
  mkdirSync(path.dirname(file), {recursive: true});
  database = new Database(file);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS assessment_submissions (
      id TEXT PRIMARY KEY,
      submitted_at TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      marketing_consent INTEGER NOT NULL DEFAULT 0 CHECK (marketing_consent IN (0, 1)),
      assessment_path TEXT NOT NULL CHECK (assessment_path IN ('full', 'none')),
      baseline TEXT NOT NULL,
      score INTEGER,
      tier TEXT,
      tier_description TEXT,
      knowledge_score INTEGER,
      memory_score INTEGER,
      governance_score INTEGER,
      ranking_json TEXT NOT NULL,
      answers_json TEXT NOT NULL,
      recommendations_json TEXT NOT NULL,
      record_json TEXT NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_assessment_submitted_at
      ON assessment_submissions(submitted_at);
    CREATE INDEX IF NOT EXISTS idx_assessment_company
      ON assessment_submissions(company);
  `);
  const columns = new Set(database.prepare('PRAGMA table_info(assessment_submissions)').all().map((column) => column.name));
  if (!columns.has('callback_requested')) {
    database.exec('ALTER TABLE assessment_submissions ADD COLUMN callback_requested INTEGER CHECK (callback_requested IN (0, 1))');
  }
  if (!columns.has('callback_requested_at')) {
    database.exec('ALTER TABLE assessment_submissions ADD COLUMN callback_requested_at TEXT');
  }
  return database;
}

function pillar(record, name) {
  return record.pillars?.find((item) => item.name === name)?.pct ?? null;
}

export function saveAssessment(record, source) {
  const db = openDatabase();
  const result = db.prepare(`
    INSERT INTO assessment_submissions (
      id, submitted_at, name, email, company, role, marketing_consent,
      assessment_path, baseline, score, tier, tier_description,
      knowledge_score, memory_score, governance_score,
      ranking_json, answers_json, recommendations_json, record_json, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `).run(
    record.id,
    record.submittedAt,
    record.name,
    record.email,
    record.company,
    record.role,
    record.consent ? 1 : 0,
    record.path,
    record.baseline,
    record.score ?? null,
    record.tier ?? null,
    record.tierDescription ?? null,
    pillar(record, 'Knowledge'),
    pillar(record, 'Memory'),
    pillar(record, 'Governance'),
    JSON.stringify(record.ranking),
    JSON.stringify(record.answers || []),
    JSON.stringify(record.actions || []),
    JSON.stringify(record),
    source,
  );

  return {
    ok: true,
    id: record.id,
    status: 'SAVED',
    storage: 'SQLITE',
    duplicatePrevented: result.changes === 0,
  };
}

export function getDatabasePath() {
  return databaseFile();
}

export function setCallbackPreference(id, requested) {
  const result = openDatabase().prepare(`
    UPDATE assessment_submissions
    SET callback_requested = ?, callback_requested_at = ?
    WHERE id = ?
  `).run(requested ? 1 : 0, new Date().toISOString(), id);
  return result.changes === 1;
}

function searchPattern(value) {
  return `%${String(value).replace(/[\\%_]/g, '\\$&')}%`;
}

export function listAssessments({search = '', limit = 50, offset = 0} = {}) {
  const db = openDatabase();
  const cleanedSearch = String(search).trim().slice(0, 100);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const where = cleanedSearch
    ? `WHERE name LIKE @search ESCAPE '\\'
        OR email LIKE @search ESCAPE '\\'
        OR company LIKE @search ESCAPE '\\'
        OR role LIKE @search ESCAPE '\\'
        OR tier LIKE @search ESCAPE '\\'`
    : '';
  const params = cleanedSearch ? {search: searchPattern(cleanedSearch)} : {};
  const countStatement = db.prepare(`SELECT COUNT(*) AS count FROM assessment_submissions ${where}`);
  const total = (cleanedSearch ? countStatement.get(params) : countStatement.get()).count;
  const rows = db.prepare(`
    SELECT id, submitted_at, name, email, company, role, marketing_consent,
      assessment_path, baseline, score, tier, tier_description,
      knowledge_score, memory_score, governance_score,
      ranking_json, answers_json, recommendations_json,
      callback_requested, callback_requested_at
    FROM assessment_submissions
    ${where}
    ORDER BY submitted_at DESC
    LIMIT @limit OFFSET @offset
  `).all({...params, limit: safeLimit, offset: safeOffset});
  return {rows, total, search: cleanedSearch, limit: safeLimit, offset: safeOffset};
}

export function getAssessmentStats() {
  return openDatabase().prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN assessment_path = 'full' THEN 1 ELSE 0 END) AS scored,
      SUM(CASE WHEN assessment_path = 'none' THEN 1 ELSE 0 END) AS priority_only,
      SUM(CASE WHEN callback_requested = 1 THEN 1 ELSE 0 END) AS callback_requests,
      ROUND(AVG(CASE WHEN assessment_path = 'full' THEN score END), 1) AS average_score,
      MAX(submitted_at) AS latest_submission
    FROM assessment_submissions
  `).get();
}

export function getAssessmentsForExport() {
  return openDatabase().prepare(`
    SELECT id, submitted_at, name, email, company, role, marketing_consent,
      assessment_path, baseline, score, tier, tier_description,
      knowledge_score, memory_score, governance_score,
      ranking_json, answers_json, recommendations_json,
      callback_requested, callback_requested_at
    FROM assessment_submissions
    ORDER BY submitted_at DESC
  `).all();
}
