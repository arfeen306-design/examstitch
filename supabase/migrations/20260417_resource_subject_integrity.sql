-- ============================================================================
-- Resource integrity hardening:
-- 1) Enforce mandatory subject/category linkage on resources
-- 2) Enforce category.subject_id = resource.subject_id at DB level
-- 3) Repair topic lineage where parent/child syllabus drifted
-- ============================================================================

BEGIN;

-- Backfill any legacy rows that lost subject_id from category linkage.
UPDATE public.resources r
SET subject_id = c.subject_id
FROM public.categories c
WHERE r.category_id = c.id
  AND r.subject_id IS NULL;

-- Strict NOT NULL guarantees.
ALTER TABLE public.resources
  ALTER COLUMN subject_id SET NOT NULL,
  ALTER COLUMN category_id SET NOT NULL;

-- Align FK delete behavior with NOT NULL semantics.
ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_subject_id_fkey;

ALTER TABLE public.resources
  ADD CONSTRAINT resources_subject_id_fkey
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE RESTRICT;

-- DB-level relationship enforcement:
-- Every resource must use a category that belongs to the same subject.
CREATE OR REPLACE FUNCTION public.enforce_resource_subject_category_match()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  category_subject_id uuid;
BEGIN
  SELECT c.subject_id INTO category_subject_id
  FROM public.categories c
  WHERE c.id = NEW.category_id;

  IF category_subject_id IS NULL THEN
    RAISE EXCEPTION 'Invalid category_id % for resource', NEW.category_id;
  END IF;

  IF NEW.subject_id IS DISTINCT FROM category_subject_id THEN
    RAISE EXCEPTION 'resource.subject_id % does not match categories.subject_id %',
      NEW.subject_id, category_subject_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS resources_enforce_subject_category ON public.resources;
CREATE TRIGGER resources_enforce_subject_category
BEFORE INSERT OR UPDATE OF subject_id, category_id
ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.enforce_resource_subject_category_match();

-- Topic repair: if a child topic diverged from parent syllabus, inherit parent syllabus.
UPDATE public.topics child
SET syllabus_id = parent.syllabus_id
FROM public.topics parent
WHERE child.parent_topic_id = parent.id
  AND child.syllabus_id IS DISTINCT FROM parent.syllabus_id;

COMMIT;
