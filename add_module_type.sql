-- ============================================================
-- EXAMSTITCH: Add module_type and worksheet_url columns
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE resources ADD COLUMN IF NOT EXISTS module_type TEXT DEFAULT 'video_topical';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS worksheet_url TEXT;

NOTIFY pgrst, 'reload schema';
