-- ============================================================================
-- Zero-drift enforcement for resources identity
--
-- 1) Backfill legacy drift from category ground truth
-- 2) Enforce INSERT/UPDATE invariants via trigger:
--    - resources.subject_id := categories.subject_id
--    - resources.syllabus_id := categories.syllabus_id
--    - category_id must exist
-- ============================================================================

-- One-time corrective sweep
UPDATE public.resources r
SET
  subject_id = c.subject_id,
  syllabus_id = c.syllabus_id,
  updated_at = NOW()
FROM public.categories c
WHERE r.category_id = c.id
  AND (
    r.subject_id IS DISTINCT FROM c.subject_id
    OR r.syllabus_id IS DISTINCT FROM c.syllabus_id
  );

CREATE OR REPLACE FUNCTION public.enforce_resource_category_identity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  category_subject_id uuid;
  category_syllabus_id uuid;
BEGIN
  IF NEW.category_id IS NULL THEN
    RAISE EXCEPTION 'resources.category_id is required';
  END IF;

  SELECT c.subject_id, c.syllabus_id
  INTO category_subject_id, category_syllabus_id
  FROM public.categories c
  WHERE c.id = NEW.category_id;

  IF category_subject_id IS NULL THEN
    RAISE EXCEPTION 'Invalid category_id % for resource', NEW.category_id;
  END IF;

  -- Canonical identity always comes from category taxonomy.
  NEW.subject_id := category_subject_id;
  NEW.syllabus_id := category_syllabus_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS resources_enforce_subject_category ON public.resources;
CREATE TRIGGER resources_enforce_subject_category
BEFORE INSERT OR UPDATE OF category_id, subject_id, syllabus_id
ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.enforce_resource_category_identity();
