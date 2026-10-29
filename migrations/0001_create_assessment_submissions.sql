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
  callback_requested INTEGER CHECK (callback_requested IN (0, 1)),
  callback_requested_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assessment_submitted_at
  ON assessment_submissions(submitted_at);

CREATE INDEX IF NOT EXISTS idx_assessment_company
  ON assessment_submissions(company);
