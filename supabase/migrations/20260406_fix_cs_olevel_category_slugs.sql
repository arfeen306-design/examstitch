-- Fix CS O-Level category slugs to match frontend grade-based routing.
--
-- The O-Level frontend routes use /olevel/[subject]/[grade]/ where grade
-- is grade-9, grade-10, or grade-11 (shared across all subjects via oLevelGrades).
-- CS O-Level categories used a paper-based hierarchy (cs-olevel → cs-paper-1-theory,
-- cs-paper-2-problem-solving) that didn't match. This renames and flattens them
-- to match the grade convention used by Maths and all other O-Level subjects.
--
-- Mapping:
--   cs-paper-1-theory        → grade-9  (flattened, parent_id set to null)
--   cs-paper-2-problem-solving → grade-10 (flattened, parent_id set to null)
--   cs-olevel                → grade-11 (keeps existing resources)

UPDATE categories
SET slug = 'grade-9', name = 'Grade 9', parent_id = NULL, sort_order = 1
WHERE id = '13361cd2-f65a-4f3b-8b52-2df9f8ceb7e1'
  AND slug = 'cs-paper-1-theory';

UPDATE categories
SET slug = 'grade-10', name = 'Grade 10', parent_id = NULL, sort_order = 2
WHERE id = '020442e1-5eea-4c61-a216-07f2fa1cccdb'
  AND slug = 'cs-paper-2-problem-solving';

UPDATE categories
SET slug = 'grade-11', name = 'Grade 11', parent_id = NULL, sort_order = 3
WHERE id = 'f15bb472-35eb-4bf1-9613-4e9732a15404'
  AND slug = 'cs-olevel';

-- Also fix the A-Level section parent: cs-alevel → as-level
-- This was the last remaining cs-prefixed slug in the database.
UPDATE categories
SET slug = 'as-level', name = 'AS Level'
WHERE id = '2fb8ce0f-058e-4e80-a967-c8f09230635b'
  AND slug = 'cs-alevel';
