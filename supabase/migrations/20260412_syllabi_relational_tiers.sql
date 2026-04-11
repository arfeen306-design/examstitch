-- ============================================================================
-- Syllabi tiers (O-Level vs A-Level) as first-class relations per subject.
-- categories.syllabus_tier_id → syllabi — filters dropdowns without string hacks.
-- Existing categories.syllabus_id → subject_papers remains for Cambridge line.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('olevel', 'alevel')),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (subject_id, tier)
);

CREATE INDEX IF NOT EXISTS idx_syllabi_subject_id ON public.syllabi(subject_id);

ALTER TABLE public.syllabi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS syllabi_public_read ON public.syllabi;
CREATE POLICY syllabi_public_read ON public.syllabi FOR SELECT USING (true);

-- Two tier rows per discipline
INSERT INTO public.syllabi (subject_id, tier, name, sort_order)
SELECT id, 'olevel', 'O-Level', 1 FROM public.subjects
ON CONFLICT (subject_id, tier) DO NOTHING;

INSERT INTO public.syllabi (subject_id, tier, name, sort_order)
SELECT id, 'alevel', 'A-Level', 2 FROM public.subjects
ON CONFLICT (subject_id, tier) DO NOTHING;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS syllabus_tier_id UUID REFERENCES public.syllabi(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_syllabus_tier_id ON public.categories(syllabus_tier_id);

-- Backfill from subject_papers → levels
UPDATE public.categories c
SET syllabus_tier_id = sy.id
FROM public.subject_papers sp
JOIN public.levels lev ON lev.id = sp.level_id
JOIN public.syllabi sy ON sy.subject_id = c.subject_id
  AND sy.tier = CASE
    WHEN lev.slug IN ('olevel', 'pre-olevel') THEN 'olevel'
    WHEN lev.slug = 'alevel' THEN 'alevel'
    ELSE 'olevel'
  END
WHERE c.syllabus_id IS NOT NULL
  AND c.syllabus_id = sp.id
  AND sp.level_id IS NOT NULL
  AND c.syllabus_tier_id IS NULL;

-- Legacy rows without syllabus_id (slug heuristics)
UPDATE public.categories c
SET syllabus_tier_id = (
  SELECT sy.id FROM public.syllabi sy WHERE sy.subject_id = c.subject_id AND sy.tier = 'olevel' LIMIT 1
)
WHERE c.syllabus_tier_id IS NULL
  AND c.slug IN ('grade-9', 'grade-10', 'grade-11', 'cs-olevel');

UPDATE public.categories c
SET syllabus_tier_id = (
  SELECT sy.id FROM public.syllabi sy WHERE sy.subject_id = c.subject_id AND sy.tier = 'alevel' LIMIT 1
)
WHERE c.syllabus_tier_id IS NULL
  AND c.slug IN ('as-level', 'a2-level', 'cs-alevel');

UPDATE public.categories c
SET syllabus_tier_id = (
  SELECT sy.id FROM public.syllabi sy WHERE sy.subject_id = c.subject_id AND sy.tier = 'alevel' LIMIT 1
)
WHERE c.syllabus_tier_id IS NULL
  AND c.parent_id IN (
    SELECT id FROM public.categories p WHERE p.slug IN ('as-level', 'a2-level', 'cs-alevel')
  );

UPDATE public.categories c
SET syllabus_tier_id = (
  SELECT sy.id FROM public.syllabi sy WHERE sy.subject_id = c.subject_id AND sy.tier = 'olevel' LIMIT 1
)
WHERE c.syllabus_tier_id IS NULL
  AND c.parent_id IN (
    SELECT id FROM public.categories p WHERE p.slug = 'cs-olevel'
  );

UPDATE public.categories c
SET syllabus_tier_id = (
  SELECT sy.id FROM public.syllabi sy WHERE sy.subject_id = c.subject_id AND sy.tier = 'alevel' LIMIT 1
)
WHERE c.syllabus_tier_id IS NULL
  AND c.slug LIKE 'paper-%'
  AND c.subject_id IN (SELECT id FROM public.subjects WHERE slug IN ('physics', 'chemistry', 'biology'));

COMMIT;
