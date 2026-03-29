-- ============================================================
-- Migration 001: Levels
-- Run this first — everything else references levels.id
-- ============================================================

CREATE TABLE IF NOT EXISTS levels (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  sort_order INT  NOT NULL DEFAULT 0
);

-- Seed the three core levels
INSERT INTO levels (name, slug, sort_order) VALUES
  ('Pre O-Level', 'pre-olevel', 1),
  ('O-Level',     'olevel',     2),
  ('A-Level',     'alevel',     3)
ON CONFLICT (slug) DO NOTHING;

-- Public read access (no login required)
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levels_public_read" ON levels FOR SELECT USING (true);
