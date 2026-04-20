-- ============================================================================
-- Diagnostic: "Ghost rows" / empty subject dashboard (Supabase SQL Editor)
--
-- Edit the slug in `disc` CTE: 'maths' | 'physics' | 'chemistry' | 'computer-science'
-- ============================================================================

WITH disc AS (
  SELECT id AS subject_id, name, slug
  FROM public.subjects
  WHERE slug = 'maths'
),
papers AS (
  SELECT sp.id, sp.slug, sp.parent_subject_id
  FROM public.subject_papers sp
  JOIN disc ON sp.parent_subject_id = disc.subject_id
)
SELECT 'resources_eq_parent_subject' AS check_id, count(*)::bigint AS n
FROM public.resources r
JOIN disc ON r.subject_id = disc.subject_id

UNION ALL
SELECT 'resources_via_category_subject_id', count(DISTINCT r.id)::bigint
FROM public.resources r
JOIN public.categories c ON c.id = r.category_id
JOIN disc ON c.subject_id = disc.subject_id

UNION ALL
SELECT 'resources_subject_id_eq_paper_row', count(*)::bigint
FROM public.resources r
JOIN papers p ON r.subject_id = p.id

UNION ALL
SELECT 'resources_subject_neq_category_subject', count(*)::bigint
FROM public.resources r
JOIN public.categories c ON c.id = r.category_id
JOIN disc ON c.subject_id = disc.subject_id
WHERE r.subject_id IS DISTINCT FROM c.subject_id

UNION ALL
SELECT 'resources_missing_syllabus_but_category_has', count(*)::bigint
FROM public.resources r
JOIN public.categories c ON c.id = r.category_id
JOIN disc ON c.subject_id = disc.subject_id
WHERE (r.syllabus_id IS NULL OR r.syllabus_id IS DISTINCT FROM c.syllabus_id)
  AND c.syllabus_id IS NOT NULL;
