-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add sort_order column to resources table
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT NULL;

-- Create an index for fast ordering queries
CREATE INDEX IF NOT EXISTS idx_resources_sort_order
  ON resources (category_id, sort_order ASC NULLS LAST);

-- Optional: backfill sort_order based on existing created_at order per category
-- (run this only once to give existing rows a sensible starting order)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY category_id
           ORDER BY created_at ASC
         ) - 1 AS rn
  FROM resources
)
UPDATE resources
SET sort_order = ranked.rn
FROM ranked
WHERE resources.id = ranked.id
  AND resources.sort_order IS NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
