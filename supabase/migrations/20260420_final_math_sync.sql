-- ============================================================================
-- Final Math Sync: lane backfill for legacy paper rows
--
-- Purpose:
-- Promote obvious past-paper records into solved_past_paper so they render in
-- the correct public/admin lane after taxonomy repairs.
--
-- Idempotent:
-- Re-running is safe; only updates rows not already solved_past_paper.
-- ============================================================================

UPDATE public.resources
SET
  module_type = 'solved_past_paper',
  updated_at = NOW()
WHERE module_type IS DISTINCT FROM 'solved_past_paper'
  AND (
    title ILIKE '%paper%'
    OR title ILIKE '%mj20%'
    OR title ILIKE '%on20%'
  );
