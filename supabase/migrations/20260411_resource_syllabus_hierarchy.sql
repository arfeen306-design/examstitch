-- ============================================================================
-- Migration: Resource syllabus lineage, parent-child links, topics scaffold
--
-- 1. categories.syllabus_id → subject_papers (Cambridge paper / syllabus)
-- 2. resources.syllabus_id (denormalised from category for fast admin filters)
-- 3. resources.parent_resource_id → explicit sub-topic / part linkage
-- 4. topics table (syllabus-scoped, optional future resource.topic_id)
-- ============================================================================

BEGIN;

-- ─── categories.syllabus_id ────────────────────────────────────────────────
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS syllabus_id UUID REFERENCES public.subject_papers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_syllabus_id ON public.categories(syllabus_id);

-- Mathematics (parent subject slug = maths)
UPDATE public.categories c
SET syllabus_id = (SELECT id FROM public.subject_papers WHERE slug = 'mathematics-4024' LIMIT 1)
WHERE c.subject_id = (SELECT id FROM public.subjects WHERE slug = 'maths' LIMIT 1)
  AND c.slug IN ('grade-9', 'grade-10', 'grade-11');

UPDATE public.categories c
SET syllabus_id = (SELECT id FROM public.subject_papers WHERE slug = 'mathematics-9709' LIMIT 1)
WHERE c.subject_id = (SELECT id FROM public.subjects WHERE slug = 'maths' LIMIT 1)
  AND (
    c.slug IN ('as-level', 'a2-level')
    OR c.parent_id IN (
      SELECT id FROM public.categories
      WHERE subject_id = (SELECT id FROM public.subjects WHERE slug = 'maths' LIMIT 1)
        AND slug IN ('as-level', 'a2-level')
    )
  );

-- Computer Science (parent slug = computer-science)
UPDATE public.categories c
SET syllabus_id = (SELECT id FROM public.subject_papers WHERE slug = 'computer-science-0478' LIMIT 1)
WHERE c.subject_id = (SELECT id FROM public.subjects WHERE slug = 'computer-science' LIMIT 1)
  AND (
    c.slug = 'cs-olevel'
    OR c.parent_id IN (
      SELECT id FROM public.categories
      WHERE subject_id = c.subject_id AND slug = 'cs-olevel'
    )
  );

UPDATE public.categories c
SET syllabus_id = (SELECT id FROM public.subject_papers WHERE slug = 'computer-science-9618' LIMIT 1)
WHERE c.subject_id = (SELECT id FROM public.subjects WHERE slug = 'computer-science' LIMIT 1)
  AND (
    c.slug = 'cs-alevel'
    OR c.parent_id IN (
      SELECT id FROM public.categories
      WHERE subject_id = c.subject_id AND slug = 'cs-alevel'
    )
  );

-- Physics O-Level / A-Level (parent slug = physics)
UPDATE public.categories c
SET syllabus_id = (SELECT id FROM public.subject_papers WHERE slug = 'physics-5054' LIMIT 1)
WHERE c.subject_id = (SELECT id FROM public.subjects WHERE slug = 'physics' LIMIT 1)
  AND c.slug IN ('grade-9', 'grade-10', 'grade-11');

-- A-Level paper rows live under the discipline parent (physics / chemistry / biology)
UPDATE public.categories c
SET syllabus_id = (SELECT id FROM public.subject_papers WHERE slug = 'physics-9702' LIMIT 1)
WHERE c.subject_id = (SELECT id FROM public.subjects WHERE slug = 'physics' LIMIT 1)
  AND c.slug LIKE 'paper-%';

UPDATE public.categories c
SET syllabus_id = (SELECT id FROM public.subject_papers WHERE slug = 'chemistry-5070' LIMIT 1)
WHERE c.subject_id = (SELECT id FROM public.subjects WHERE slug = 'chemistry' LIMIT 1)
  AND c.slug IN ('grade-9', 'grade-10', 'grade-11');

UPDATE public.categories c
SET syllabus_id = (SELECT id FROM public.subject_papers WHERE slug = 'chemistry-9701' LIMIT 1)
WHERE c.subject_id = (SELECT id FROM public.subjects WHERE slug = 'chemistry' LIMIT 1)
  AND c.slug LIKE 'paper-%';

UPDATE public.categories c
SET syllabus_id = (SELECT id FROM public.subject_papers WHERE slug = 'biology-5090' LIMIT 1)
WHERE c.subject_id = (SELECT id FROM public.subjects WHERE slug = 'biology' LIMIT 1)
  AND c.slug IN ('grade-9', 'grade-10', 'grade-11');

UPDATE public.categories c
SET syllabus_id = (SELECT id FROM public.subject_papers WHERE slug = 'biology-9700' LIMIT 1)
WHERE c.subject_id = (SELECT id FROM public.subjects WHERE slug = 'biology' LIMIT 1)
  AND c.slug LIKE 'paper-%';

-- ─── resources columns ───────────────────────────────────────────────────────
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS syllabus_id UUID REFERENCES public.subject_papers(id) ON DELETE SET NULL;

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS parent_resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resources_syllabus_id ON public.resources(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_resources_parent_resource_id ON public.resources(parent_resource_id);

-- Denormalise syllabus from category
UPDATE public.resources r
SET syllabus_id = c.syllabus_id
FROM public.categories c
WHERE r.category_id = c.id
  AND c.syllabus_id IS NOT NULL
  AND r.syllabus_id IS NULL;

-- ─── topics (scaffold for future topic_id on resources) ─────────────────────
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES public.subject_papers(id) ON DELETE CASCADE,
  parent_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_syllabus_id ON public.topics(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent_topic_id ON public.topics(parent_topic_id);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS topics_public_read ON public.topics;
CREATE POLICY topics_public_read ON public.topics FOR SELECT USING (true);

COMMIT;
