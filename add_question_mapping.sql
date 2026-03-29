-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add question_mapping JSONB column to resources table
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS question_mapping JSONB DEFAULT NULL;

COMMENT ON COLUMN resources.question_mapping IS
  'JSON array mapping question numbers to video timestamps (seconds) and PDF pages.
   Structure: [{ question: 1, label: "Q1", start_time: 45, parts: [{ part: "a", start_time: 45, pdf_page: 2 }] }]';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
