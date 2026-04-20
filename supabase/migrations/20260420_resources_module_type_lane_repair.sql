-- ============================================================================
-- One-time / optional repair: align legacy resources with dual-lane portals
--
-- Context: Public routes filter strictly on module_type (see PORTAL_RESOURCE_STREAMS
-- in application code). Rows left as video_topical but representing past papers
-- (PDF-only, exam series, or paper-like titles) will appear under Video Lectures
-- or feel "missing" under Past Papers until repaired.
--
-- Safe to re-run: predicates only promote clearly paper-like rows to
-- solved_past_paper; remaining NULLs (pre-010 databases only) get video_topical.
-- ============================================================================

-- 1) Promote likely past papers currently stuck in the video_topical lane
UPDATE resources
SET
  module_type = 'solved_past_paper',
  updated_at = NOW()
WHERE
  module_type = 'video_topical'
  AND (
    content_type = 'pdf'
    OR exam_series_id IS NOT NULL
    OR title ILIKE '%Paper%'
    OR title ILIKE '%mj20%'
    OR title ILIKE '%on20%'
    OR title ILIKE '%fm20%'
  );

-- 2) Legacy NULLs (should be none after migration 010; kept for older forks)
UPDATE resources
SET
  module_type = 'video_topical',
  updated_at = NOW()
WHERE module_type IS NULL;

-- 3) Safety check — expect zero rows
-- Run manually in SQL Editor if desired:
-- SELECT id, title, content_type, module_type FROM resources WHERE module_type IS NULL;
