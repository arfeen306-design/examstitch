-- ============================================================
-- Migration 006: Resource Solutions
-- The "Killer Feature" table.
-- Maps a past paper PDF → YouTube video + exact timestamp per question.
--
-- HOW TO USE:
--   1. Upload a past paper PDF → get its resources.id (the paper_id).
--   2. Upload the video solution → get its resources.id (the video_id).
--   3. For each question, insert one row with timestamp_seconds.
--   4. The frontend sidebar reads these rows to show clickable timestamps.
-- ============================================================

CREATE TABLE IF NOT EXISTS resource_solutions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id          UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  video_id          UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  question_number   INT  NOT NULL,
  timestamp_seconds INT  NOT NULL DEFAULT 0,  -- raw seconds, e.g. 125 = 2:05
  label             TEXT NOT NULL,            -- e.g. "Q3 — Differentiation"
  sort_order        INT  NOT NULL DEFAULT 0,
  UNIQUE (paper_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_solutions_paper ON resource_solutions(paper_id);

ALTER TABLE resource_solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "solutions_public_read" ON resource_solutions FOR SELECT USING (true);
