-- ============================================================
-- Migration 009: Add generated FTS column to resources
--
-- Replaces the expression index on to_tsvector(...) with a
-- STORED generated column so PostgREST / Supabase JS can
-- target it directly via .textSearch('fts', query).
--
-- Also expands coverage to include 'topic' which was missing
-- from the original idx_resources_fts index.
-- ============================================================

-- Add the generated tsvector column (STORED = persisted, indexed efficiently)
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(topic, '')
    )
  ) STORED;

-- GIN index on the new column (replaces the old expression index)
CREATE INDEX IF NOT EXISTS idx_resources_fts_col ON resources USING GIN (fts);

-- Drop the old expression index — superseded by the column index above
DROP INDEX IF EXISTS idx_resources_fts;
