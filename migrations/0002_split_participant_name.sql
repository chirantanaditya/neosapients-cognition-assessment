ALTER TABLE assessment_submissions ADD COLUMN first_name TEXT NOT NULL DEFAULT '';
ALTER TABLE assessment_submissions ADD COLUMN last_name TEXT NOT NULL DEFAULT '';

UPDATE assessment_submissions
SET
  first_name = CASE
    WHEN instr(trim(name), ' ') > 0 THEN substr(trim(name), 1, instr(trim(name), ' ') - 1)
    ELSE trim(name)
  END,
  last_name = CASE
    WHEN instr(trim(name), ' ') > 0 THEN substr(trim(name), instr(trim(name), ' ') + 1)
    ELSE ''
  END;
