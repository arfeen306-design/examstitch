-- ============================================================
-- ExamStitch: FTS Index Refresh
-- Run in Supabase SQL Editor after bulk uploads to sync search.
-- 'fts' is a GENERATED column — Postgres recomputes it
-- automatically when the source columns change.
-- ============================================================

-- 1. Force recompute: no-op UPDATE on source columns causes
--    Postgres to re-evaluate the generated 'fts' expression.
UPDATE resources
SET title = title
WHERE is_published = true;

-- 2. Compact / rebuild the GIN index after the update.
REINDEX INDEX CONCURRENTLY resources_fts_idx;

-- 3. Sanity check (uncomment to verify a specific title):
-- SELECT id, title
-- FROM resources
-- WHERE fts @@ websearch_to_tsquery('english', 'Quadratics')
-- LIMIT 5;
