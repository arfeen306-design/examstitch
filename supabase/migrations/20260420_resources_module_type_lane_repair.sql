-- ============================================================================
-- One-time / optional repair: align legacy resources with dual-lane portals
--
-- Context: Public routes filter strictly on module_type (see PORTAL_RESOURCE_STREAMS
-- in src/lib/init-subject.ts). Rows stuck in video_topical appear under Video Lectures;
-- promote them to solved_past_paper when they are clearly past-paper content.
--
-- Safe to re-run: only upgrades video_topical → solved_past_paper; never demotes.
-- ============================================================================

-- --- Pre-flight checks (run in SQL Editor, adjust, then run UPDATEs below) ---

-- "Paper" test — expect count to drop after migration (legacy PDFs mis-tagged as video lane):
-- SELECT count(*) FROM resources
-- WHERE module_type = 'video_topical' AND content_type = 'pdf';

-- False-positive review — titles matching %Paper% may include topical lectures
-- (e.g. "Tips for Paper 1"); inspect before committing to production:
-- SELECT id, title, content_type, module_type FROM resources
-- WHERE module_type = 'video_topical' AND title ILIKE '%Paper%';

-- ============================================================================
-- 1) Surgical: Cambridge session shorthands in the title (mj / on / fm + year)
--    Always promotes these rows from video_topical → solved_past_paper when matched.
-- ============================================================================

UPDATE resources
SET
  module_type = 'solved_past_paper',
  updated_at = NOW()
WHERE
  module_type = 'video_topical'
  AND (
    title ILIKE '%mj20%'
    OR title ILIKE '%on20%'
    OR title ILIKE '%fm20%'
  );
-- %mj20% / %on20% / %fm20% match common shorthands (e.g. mj2024, on2023, fm2022).

-- ============================================================================
-- 2) Broader heuristics: PDF body, linked exam series, or "Paper" in title
-- ============================================================================

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
  );

-- ============================================================================
-- 3) Legacy NULLs (should be none after migration 010; kept for older forks)
-- ============================================================================

UPDATE resources
SET
  module_type = 'video_topical',
  updated_at = NOW()
WHERE module_type IS NULL;

-- ============================================================================
-- 4) Post-check — expect zero rows
-- ============================================================================

-- SELECT id, title, content_type, module_type FROM resources WHERE module_type IS NULL;
