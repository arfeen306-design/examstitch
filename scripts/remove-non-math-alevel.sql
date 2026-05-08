-- Remove all A-Level subject_papers, syllabi, and categories for
-- Computer Science (9618), Physics (9702), Chemistry (9701), Biology (9700).
-- Mathematics A-Level (9709) is kept.

BEGIN;

-- 1. Delete resources linked to non-math A-Level categories
DELETE FROM resources
WHERE category_id IN (
  SELECT c.id FROM categories c
  JOIN subject_papers sp ON c.subject_id = sp.id
  WHERE sp.slug IN (
    'computer-science-9618',
    'physics-9702',
    'chemistry-9701',
    'biology-9700'
  )
);

-- 2. Delete categories belonging to non-math A-Level subject_papers
DELETE FROM categories
WHERE subject_id IN (
  SELECT id FROM subject_papers
  WHERE slug IN (
    'computer-science-9618',
    'physics-9702',
    'chemistry-9701',
    'biology-9700'
  )
);

-- 3. Delete the non-math A-Level syllabi
DELETE FROM syllabi
WHERE tier = 'alevel'
AND subject_id IN (
  SELECT DISTINCT parent_subject_id FROM subject_papers
  WHERE slug IN (
    'computer-science-9618',
    'physics-9702',
    'chemistry-9701',
    'biology-9700'
  )
  AND parent_subject_id IS NOT NULL
);

-- 4. Delete the non-math A-Level subject_papers rows
DELETE FROM subject_papers
WHERE slug IN (
  'computer-science-9618',
  'physics-9702',
  'chemistry-9701',
  'biology-9700'
);

COMMIT;
