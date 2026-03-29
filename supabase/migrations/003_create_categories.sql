-- ============================================================
-- Migration 003: Categories
-- Depends on: subjects
-- A category is a grade (Grade 9) or a paper (AS Paper 1).
-- parent_id allows nesting: AS Level → Paper 1 Pure Mathematics
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INT  NOT NULL DEFAULT 0,
  UNIQUE (subject_id, slug)
);

-- ── O-Level Mathematics (4024) grades ────────────────────────────────────────
INSERT INTO categories (subject_id, name, slug, sort_order)
SELECT id, 'Grade 9',  'grade-9',  1 FROM subjects WHERE slug = 'mathematics-4024'
ON CONFLICT DO NOTHING;

INSERT INTO categories (subject_id, name, slug, sort_order)
SELECT id, 'Grade 10', 'grade-10', 2 FROM subjects WHERE slug = 'mathematics-4024'
ON CONFLICT DO NOTHING;

INSERT INTO categories (subject_id, name, slug, sort_order)
SELECT id, 'Grade 11', 'grade-11', 3 FROM subjects WHERE slug = 'mathematics-4024'
ON CONFLICT DO NOTHING;

-- ── A-Level Mathematics (9709) — AS Level ────────────────────────────────────
INSERT INTO categories (subject_id, name, slug, sort_order)
SELECT id, 'AS Level', 'as-level', 1 FROM subjects WHERE slug = 'mathematics-9709'
ON CONFLICT DO NOTHING;

INSERT INTO categories (subject_id, name, slug, parent_id, sort_order)
SELECT
  s.id,
  'Paper 1 — Pure Mathematics',
  'paper-1-pure-mathematics',
  c.id,
  1
FROM subjects s
JOIN categories c ON c.subject_id = s.id AND c.slug = 'as-level'
WHERE s.slug = 'mathematics-9709'
ON CONFLICT DO NOTHING;

INSERT INTO categories (subject_id, name, slug, parent_id, sort_order)
SELECT
  s.id,
  'Paper 5 — Probability & Statistics',
  'paper-5-probability-statistics',
  c.id,
  2
FROM subjects s
JOIN categories c ON c.subject_id = s.id AND c.slug = 'as-level'
WHERE s.slug = 'mathematics-9709'
ON CONFLICT DO NOTHING;

-- ── A-Level Mathematics (9709) — A2 Level ────────────────────────────────────
INSERT INTO categories (subject_id, name, slug, sort_order)
SELECT id, 'A2 Level', 'a2-level', 2 FROM subjects WHERE slug = 'mathematics-9709'
ON CONFLICT DO NOTHING;

INSERT INTO categories (subject_id, name, slug, parent_id, sort_order)
SELECT
  s.id,
  'Paper 3 — Pure Mathematics',
  'paper-3-pure-mathematics',
  c.id,
  1
FROM subjects s
JOIN categories c ON c.subject_id = s.id AND c.slug = 'a2-level'
WHERE s.slug = 'mathematics-9709'
ON CONFLICT DO NOTHING;

INSERT INTO categories (subject_id, name, slug, parent_id, sort_order)
SELECT
  s.id,
  'Paper 4 — Mechanics',
  'paper-4-mechanics',
  c.id,
  2
FROM subjects s
JOIN categories c ON c.subject_id = s.id AND c.slug = 'a2-level'
WHERE s.slug = 'mathematics-9709'
ON CONFLICT DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
