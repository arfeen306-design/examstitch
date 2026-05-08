-- Remove all O-Level subject_papers, syllabi, categories, and resources for
-- every subject except Mathematics (mathematics-4024).
--
-- Paste into Supabase SQL Editor and run.

BEGIN;

-- 1. Delete resources linked to non-math O-Level categories
DELETE FROM resources
WHERE category_id IN (
  SELECT c.id FROM categories c
  JOIN subject_papers sp ON c.subject_id = sp.id
  WHERE sp.slug IN (
    'computer-science-0478',
    'physics-5054',
    'chemistry-5070',
    'biology-5090',
    'english-1123',
    'urdu-3248',
    'pakistan-studies-2059'
  )
);

-- 2. Delete categories belonging to those subject_papers
DELETE FROM categories
WHERE subject_id IN (
  SELECT id FROM subject_papers
  WHERE slug IN (
    'computer-science-0478',
    'physics-5054',
    'chemistry-5070',
    'biology-5090',
    'english-1123',
    'urdu-3248',
    'pakistan-studies-2059'
  )
);

-- 3. Delete O-Level syllabi for those subjects
DELETE FROM syllabi
WHERE tier = 'olevel'
AND subject_id IN (
  SELECT DISTINCT parent_subject_id FROM subject_papers
  WHERE slug IN (
    'computer-science-0478',
    'physics-5054',
    'chemistry-5070',
    'biology-5090',
    'english-1123',
    'urdu-3248',
    'pakistan-studies-2059'
  )
  AND parent_subject_id IS NOT NULL
);

-- 4. Delete the subject_papers rows themselves
DELETE FROM subject_papers
WHERE slug IN (
  'computer-science-0478',
  'physics-5054',
  'chemistry-5070',
  'biology-5090',
  'english-1123',
  'urdu-3248',
  'pakistan-studies-2059'
);

COMMIT;
