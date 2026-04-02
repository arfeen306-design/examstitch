-- ============================================================================
-- Migration 016: Fix categories.subject_id FK + Seed CS categories
--
-- Problem: Migration 012 renamed `subjects` → `subject_papers` and created
-- a new `subjects` table. But categories.subject_id still references the old
-- subject_papers table, so queries filtering by the new subjects UUID return
-- nothing ("Select mapping..." dropdown is empty).
--
-- Fix: Remap categories.subject_id to the new subjects table using the
-- parent_subject_id bridge column, then seed CS categories.
--
-- NOTE: This migration was applied with manual cleanup for orphaned categories
-- that had been created through the admin UI before the FK was fixed.
-- ============================================================================

BEGIN;

-- ─── Step 1: Drop the old FK (now pointing to subject_papers) ───────────────
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_subject_id_fkey;

-- ─── Step 2: Remap existing category subject_ids ────────────────────────────
UPDATE categories c
SET subject_id = sp.parent_subject_id
FROM subject_papers sp
WHERE c.subject_id = sp.id
  AND sp.parent_subject_id IS NOT NULL;

-- ─── Step 3: Restore unique constraint + new FK ─────────────────────────────
ALTER TABLE categories ADD CONSTRAINT categories_subject_id_slug_key UNIQUE (subject_id, slug);
ALTER TABLE categories
  ADD CONSTRAINT categories_subject_id_fkey
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

-- ─── Step 4: Seed Computer Science categories ───────────────────────────────

-- CS O-Level (Cambridge 0478) parent
INSERT INTO categories (subject_id, name, slug, sort_order)
SELECT id, 'O Level', 'cs-olevel', 1
FROM subjects WHERE slug = 'computer-science'
ON CONFLICT (subject_id, slug) DO NOTHING;

-- CS O-Level papers
INSERT INTO categories (subject_id, name, slug, parent_id, sort_order)
SELECT s.id, 'Paper 1 — Theory', 'cs-paper-1-theory', c.id, 1
FROM subjects s
JOIN categories c ON c.subject_id = s.id AND c.slug = 'cs-olevel'
WHERE s.slug = 'computer-science'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (subject_id, name, slug, parent_id, sort_order)
SELECT s.id, 'Paper 2 — Problem Solving & Programming', 'cs-paper-2-problem-solving', c.id, 2
FROM subjects s
JOIN categories c ON c.subject_id = s.id AND c.slug = 'cs-olevel'
WHERE s.slug = 'computer-science'
ON CONFLICT (subject_id, slug) DO NOTHING;

-- CS A-Level (Cambridge 9618) parent
INSERT INTO categories (subject_id, name, slug, sort_order)
SELECT id, 'A Level', 'cs-alevel', 2
FROM subjects WHERE slug = 'computer-science'
ON CONFLICT (subject_id, slug) DO NOTHING;

-- CS A-Level papers
INSERT INTO categories (subject_id, name, slug, parent_id, sort_order)
SELECT s.id, 'Paper 1 — Theory Fundamentals', 'cs-a-paper-1-theory', c.id, 1
FROM subjects s
JOIN categories c ON c.subject_id = s.id AND c.slug = 'cs-alevel'
WHERE s.slug = 'computer-science'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (subject_id, name, slug, parent_id, sort_order)
SELECT s.id, 'Paper 2 — Fundamental Problem-solving', 'cs-a-paper-2-problem-solving', c.id, 2
FROM subjects s
JOIN categories c ON c.subject_id = s.id AND c.slug = 'cs-alevel'
WHERE s.slug = 'computer-science'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (subject_id, name, slug, parent_id, sort_order)
SELECT s.id, 'Paper 3 — Advanced Theory', 'cs-a-paper-3-advanced-theory', c.id, 3
FROM subjects s
JOIN categories c ON c.subject_id = s.id AND c.slug = 'cs-alevel'
WHERE s.slug = 'computer-science'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (subject_id, name, slug, parent_id, sort_order)
SELECT s.id, 'Paper 4 — Practical', 'cs-a-paper-4-practical', c.id, 4
FROM subjects s
JOIN categories c ON c.subject_id = s.id AND c.slug = 'cs-alevel'
WHERE s.slug = 'computer-science'
ON CONFLICT (subject_id, slug) DO NOTHING;

-- ─── Step 5: Restore Maths parent categories (AS Level / A2 Level) ──────────
INSERT INTO categories (subject_id, name, slug, sort_order)
SELECT id, 'AS Level', 'as-level', 4 FROM subjects WHERE slug = 'maths'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (subject_id, name, slug, sort_order)
SELECT id, 'A2 Level', 'a2-level', 5 FROM subjects WHERE slug = 'maths'
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Re-parent AS-Level papers
UPDATE categories SET parent_id = (
  SELECT id FROM categories WHERE slug = 'as-level' AND subject_id = (SELECT id FROM subjects WHERE slug = 'maths')
)
WHERE slug IN ('paper-1-pure-mathematics', 'paper-5-probability-statistics')
AND subject_id = (SELECT id FROM subjects WHERE slug = 'maths');

-- Re-parent A2-Level papers
UPDATE categories SET parent_id = (
  SELECT id FROM categories WHERE slug = 'a2-level' AND subject_id = (SELECT id FROM subjects WHERE slug = 'maths')
)
WHERE slug IN ('paper-3-pure-mathematics', 'paper-4-mechanics')
AND subject_id = (SELECT id FROM subjects WHERE slug = 'maths');

COMMIT;
