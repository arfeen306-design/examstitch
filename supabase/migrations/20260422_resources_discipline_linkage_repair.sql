-- ============================================================================
-- Repair: resources.subject_id + resources.syllabus_id (discipline dashboards)
--
-- Context: Subject admin lists resources with .eq('subject_id', parent_subjects.id).
-- Legacy forks may have rows where subject_id drifted from categories.subject_id,
-- or syllabus_id was never denormalised from the category row.
--
-- Idempotent: re-running yields 0-row UPDATEs once aligned.
-- Safe with resources_enforce_subject_category_match: subject_id is always set
-- to match categories.subject_id after the category-alignment pass.
-- ============================================================================

-- 1) Pre-FK / restored DBs only: resources.subject_id accidentally equals subject_papers.id
UPDATE public.resources r
SET
  subject_id = sp.parent_subject_id,
  updated_at = NOW()
FROM public.subject_papers sp
WHERE r.subject_id = sp.id
  AND sp.parent_subject_id IS NOT NULL;

-- 2) Canonical alignment — category.subject_id is source of truth (see migration 20260417)
UPDATE public.resources r
SET
  subject_id = c.subject_id,
  updated_at = NOW()
FROM public.categories c
WHERE r.category_id = c.id
  AND r.subject_id IS DISTINCT FROM c.subject_id;

-- 3) Denormalised syllabus paper for admin grouping / guards
UPDATE public.resources r
SET
  syllabus_id = c.syllabus_id,
  updated_at = NOW()
FROM public.categories c
WHERE r.category_id = c.id
  AND c.syllabus_id IS NOT NULL
  AND r.syllabus_id IS DISTINCT FROM c.syllabus_id;

-- ============================================================================
-- RPC: same repairs scoped to one discipline (parent subjects.id), for admin UI
-- ============================================================================

CREATE OR REPLACE FUNCTION public.repair_discipline_resource_linkage(p_subject_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  n_from_papers int := 0;
  n_from_category_subject int := 0;
  n_syllabus int := 0;
BEGIN
  IF p_subject_id IS NULL THEN
    RETURN jsonb_build_object('error', 'p_subject_id is required');
  END IF;

  UPDATE public.resources r
  SET
    subject_id = sp.parent_subject_id,
    updated_at = NOW()
  FROM public.subject_papers sp
  WHERE r.subject_id = sp.id
    AND sp.parent_subject_id = p_subject_id;
  GET DIAGNOSTICS n_from_papers = ROW_COUNT;

  UPDATE public.resources r
  SET
    subject_id = c.subject_id,
    updated_at = NOW()
  FROM public.categories c
  WHERE r.category_id = c.id
    AND (r.subject_id = p_subject_id OR c.subject_id = p_subject_id)
    AND r.subject_id IS DISTINCT FROM c.subject_id;
  GET DIAGNOSTICS n_from_category_subject = ROW_COUNT;

  UPDATE public.resources r
  SET
    syllabus_id = c.syllabus_id,
    updated_at = NOW()
  FROM public.categories c
  WHERE r.category_id = c.id
    AND r.subject_id = p_subject_id
    AND c.syllabus_id IS NOT NULL
    AND r.syllabus_id IS DISTINCT FROM c.syllabus_id;
  GET DIAGNOSTICS n_syllabus = ROW_COUNT;

  RETURN jsonb_build_object(
    'rehomed_from_subject_papers_id', n_from_papers,
    'aligned_subject_from_category', n_from_category_subject,
    'synced_syllabus_from_category', n_syllabus
  );
END;
$$;

COMMENT ON FUNCTION public.repair_discipline_resource_linkage(uuid) IS
  'Subject-admin repair: re-home subject_id via subject_papers parent, align to categories.subject_id, copy categories.syllabus_id.';

GRANT EXECUTE ON FUNCTION public.repair_discipline_resource_linkage(uuid) TO service_role;
