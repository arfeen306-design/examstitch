-- ============================================================
-- ExamStitch: FTS Index Refresh
-- Run this in your Supabase SQL Editor whenever new resources
-- are uploaded and search results look stale.
-- ============================================================

-- 1. Force-update the tsvector column on ALL rows so the GIN
--    index picks up every title and description change.
UPDATE resources
SET fts = to_tsvector(
  'english',
  coalesce(title, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(subject, '') || ' ' ||
  coalesce(topic, '')
);

-- 2. Re-index the GIN index to compact fragmentation.
REINDEX INDEX CONCURRENTLY resources_fts_idx;

-- 3. Verify: run a quick sanity check — should return 1 row
--    for any title you recently uploaded.
-- SELECT id, title, fts
-- FROM resources
-- WHERE fts @@ to_tsquery('english', 'Quadratics')
-- LIMIT 5;
