-- ============================================================
-- Migration 004: Exam Series
-- Normalises Cambridge exam metadata (year, session, variant).
-- Each row = one specific exam sitting.
-- ============================================================

CREATE TABLE IF NOT EXISTS exam_series (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id   UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,   -- Cambridge subject code, e.g. "4024"
  year         INT  NOT NULL,
  session      TEXT NOT NULL,   -- "May/June" | "Oct/Nov" | "Feb/Mar"
  variant      INT  NOT NULL DEFAULT 1,
  paper_number INT  NOT NULL DEFAULT 1,
  UNIQUE (subject_id, year, session, variant, paper_number)
);

ALTER TABLE exam_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exam_series_public_read" ON exam_series FOR SELECT USING (true);
