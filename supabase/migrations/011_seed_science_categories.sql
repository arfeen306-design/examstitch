-- ============================================================================
-- Migration 011: Seed category slugs for Physics, Chemistry, Biology
--
-- Creates hierarchical categories matching the taxonomy.ts structure:
--   O-Level: grade-9, grade-10, grade-11 per subject
--   A-Level: paper-1 through paper-5 per subject
--
-- Idempotent: uses ON CONFLICT DO NOTHING on (subject_id, slug).
-- ============================================================================

-- Helper: resolve subject_id from slug
CREATE OR REPLACE FUNCTION _resolve_subject(p_slug TEXT) RETURNS UUID AS $$
  SELECT id FROM subjects WHERE slug = p_slug LIMIT 1;
$$ LANGUAGE sql STABLE;

-- ── Physics (5054 / 9702) ───────────────────────────────────────────────────

-- O-Level Physics grades
INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('physics'), 'Grade 9', 'grade-9', 1
WHERE _resolve_subject('physics') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('physics'), 'Grade 10', 'grade-10', 2
WHERE _resolve_subject('physics') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('physics'), 'Grade 11', 'grade-11', 3
WHERE _resolve_subject('physics') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

-- A-Level Physics papers (if A-Level Physics subject exists)
INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 1 — Multiple Choice', 'paper-1', 10
FROM subjects s WHERE s.slug = 'physics-9702'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 2 — AS Structured Questions', 'paper-2', 11
FROM subjects s WHERE s.slug = 'physics-9702'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 3 — Advanced Practical Skills', 'paper-3', 12
FROM subjects s WHERE s.slug = 'physics-9702'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 4 — A2 Structured Questions', 'paper-4', 13
FROM subjects s WHERE s.slug = 'physics-9702'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 5 — Planning, Analysis & Evaluation', 'paper-5', 14
FROM subjects s WHERE s.slug = 'physics-9702'
ON CONFLICT (subject_id, slug) DO NOTHING;

-- ── Chemistry (5070 / 9701) ─────────────────────────────────────────────────

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('chemistry'), 'Grade 9', 'grade-9', 1
WHERE _resolve_subject('chemistry') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('chemistry'), 'Grade 10', 'grade-10', 2
WHERE _resolve_subject('chemistry') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('chemistry'), 'Grade 11', 'grade-11', 3
WHERE _resolve_subject('chemistry') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 1 — Multiple Choice', 'paper-1', 10
FROM subjects s WHERE s.slug = 'chemistry-9701'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 2 — AS Structured Questions', 'paper-2', 11
FROM subjects s WHERE s.slug = 'chemistry-9701'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 3 — Advanced Practical Skills', 'paper-3', 12
FROM subjects s WHERE s.slug = 'chemistry-9701'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 4 — A2 Structured Questions', 'paper-4', 13
FROM subjects s WHERE s.slug = 'chemistry-9701'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 5 — Planning, Analysis & Evaluation', 'paper-5', 14
FROM subjects s WHERE s.slug = 'chemistry-9701'
ON CONFLICT (subject_id, slug) DO NOTHING;

-- ── Biology (5090 / 9700) ───────────────────────────────────────────────────

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('biology'), 'Grade 9', 'grade-9', 1
WHERE _resolve_subject('biology') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('biology'), 'Grade 10', 'grade-10', 2
WHERE _resolve_subject('biology') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('biology'), 'Grade 11', 'grade-11', 3
WHERE _resolve_subject('biology') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 1 — Multiple Choice', 'paper-1', 10
FROM subjects s WHERE s.slug = 'biology-9700'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 2 — AS Structured Questions', 'paper-2', 11
FROM subjects s WHERE s.slug = 'biology-9700'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 3 — Advanced Practical Skills', 'paper-3', 12
FROM subjects s WHERE s.slug = 'biology-9700'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 4 — A2 Structured Questions', 'paper-4', 13
FROM subjects s WHERE s.slug = 'biology-9700'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 5 — Planning, Analysis & Evaluation', 'paper-5', 14
FROM subjects s WHERE s.slug = 'biology-9700'
ON CONFLICT (subject_id, slug) DO NOTHING;

-- ── Mathematics (ensure O-Level grades exist) ───────────────────────────────

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('mathematics'), 'Grade 9', 'grade-9', 1
WHERE _resolve_subject('mathematics') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('mathematics'), 'Grade 10', 'grade-10', 2
WHERE _resolve_subject('mathematics') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('mathematics'), 'Grade 11', 'grade-11', 3
WHERE _resolve_subject('mathematics') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

-- A-Level Maths papers
INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 1 — Pure Mathematics', 'paper-1', 10
FROM subjects s WHERE s.slug = 'mathematics-9709'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 3 — Pure Mathematics', 'paper-3', 11
FROM subjects s WHERE s.slug = 'mathematics-9709'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 4 — Mechanics', 'paper-4', 12
FROM subjects s WHERE s.slug = 'mathematics-9709'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 5 — Probability & Statistics', 'paper-5', 13
FROM subjects s WHERE s.slug = 'mathematics-9709'
ON CONFLICT (subject_id, slug) DO NOTHING;

-- ── Computer Science (ensure O-Level grades exist) ──────────────────────────

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('computer-science'), 'Grade 9', 'grade-9', 1
WHERE _resolve_subject('computer-science') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('computer-science'), 'Grade 10', 'grade-10', 2
WHERE _resolve_subject('computer-science') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), _resolve_subject('computer-science'), 'Grade 11', 'grade-11', 3
WHERE _resolve_subject('computer-science') IS NOT NULL
ON CONFLICT (subject_id, slug) DO NOTHING;

-- A-Level CS papers
INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 1 — Theory Fundamentals', 'paper-1', 10
FROM subjects s WHERE s.slug = 'computer-science-9618'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 2 — Problem-solving & Programming', 'paper-2', 11
FROM subjects s WHERE s.slug = 'computer-science-9618'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 3 — Advanced Theory', 'paper-3', 12
FROM subjects s WHERE s.slug = 'computer-science-9618'
ON CONFLICT (subject_id, slug) DO NOTHING;

INSERT INTO categories (id, subject_id, name, slug, sort_order)
SELECT gen_random_uuid(), s.id, 'Paper 4 — Practical', 'paper-4', 13
FROM subjects s WHERE s.slug = 'computer-science-9618'
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Clean up helper function
DROP FUNCTION IF EXISTS _resolve_subject(TEXT);
