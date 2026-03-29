-- ============================================================
-- Migration 002: Subjects
-- Depends on: levels
-- ============================================================

CREATE TABLE IF NOT EXISTS subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT NOT NULL,          -- Cambridge code, e.g. "4024"
  level_id   UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  slug       TEXT NOT NULL UNIQUE,   -- e.g. "mathematics-4024"
  sort_order INT  NOT NULL DEFAULT 0
);

-- Seed Mathematics for both levels
INSERT INTO subjects (name, code, level_id, slug, sort_order)
SELECT 'Mathematics', '4024', id, 'mathematics-4024', 1
FROM levels WHERE slug = 'olevel'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subjects (name, code, level_id, slug, sort_order)
SELECT 'Mathematics', '9709', id, 'mathematics-9709', 1
FROM levels WHERE slug = 'alevel'
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_public_read" ON subjects FOR SELECT USING (true);
