-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Ensure RLS policies allow anon reads on all public tables
--
-- Background: queries.ts switched from service_role to anon key for public
-- reads. This migration ensures every public table has a SELECT policy for
-- the anon role. Existing policies are preserved (DROP IF EXISTS + re-create).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── subject_papers (renamed from subjects in migration 012) ────────────────
-- The original RLS policy from migration 002 may still reference the old name.
ALTER TABLE subject_papers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subject_papers_public_read" ON subject_papers;
DROP POLICY IF EXISTS "Public read access" ON subject_papers;
CREATE POLICY "subject_papers_public_read" ON subject_papers
  FOR SELECT TO anon, authenticated
  USING (true);

-- ── subjects (new parent table from migration 012) ─────────────────────────
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subjects_public_read" ON subjects;
DROP POLICY IF EXISTS "Public read access" ON subjects;
CREATE POLICY "subjects_public_read" ON subjects
  FOR SELECT TO anon, authenticated
  USING (true);

-- ── levels ─────────────────────────────────────────────────────────────────
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "levels_public_read" ON levels;
DROP POLICY IF EXISTS "Public read access" ON levels;
CREATE POLICY "levels_public_read" ON levels
  FOR SELECT TO anon, authenticated
  USING (true);

-- ── categories ─────────────────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "Public read access" ON categories;
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT TO anon, authenticated
  USING (true);

-- ── resources (only published) ─────────────────────────────────────────────
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resources_public_read" ON resources;
DROP POLICY IF EXISTS "Public read access" ON resources;
CREATE POLICY "resources_public_read" ON resources
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- ── resource_solutions ─────────────────────────────────────────────────────
ALTER TABLE resource_solutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resource_solutions_public_read" ON resource_solutions;
DROP POLICY IF EXISTS "Public read access" ON resource_solutions;
CREATE POLICY "resource_solutions_public_read" ON resource_solutions
  FOR SELECT TO anon, authenticated
  USING (true);

-- ── blog_posts (only published) ────────────────────────────────────────────
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blog_posts_public_read" ON blog_posts;
DROP POLICY IF EXISTS "Public read access" ON blog_posts;
CREATE POLICY "blog_posts_public_read" ON blog_posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- ── exam_series ────────────────────────────────────────────────────────────
ALTER TABLE exam_series ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exam_series_public_read" ON exam_series;
DROP POLICY IF EXISTS "Public read access" ON exam_series;
CREATE POLICY "exam_series_public_read" ON exam_series
  FOR SELECT TO anon, authenticated
  USING (true);

-- ── resource_views (new table for analytics) ───────────────────────────────
CREATE TABLE IF NOT EXISTS resource_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE,
  subject_id uuid,
  viewed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resource_views_resource ON resource_views(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_views_subject ON resource_views(subject_id);
CREATE INDEX IF NOT EXISTS idx_resource_views_viewed_at ON resource_views(viewed_at);

ALTER TABLE resource_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resource_views_public_insert" ON resource_views;
CREATE POLICY "resource_views_public_insert" ON resource_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "resource_views_admin_read" ON resource_views;
CREATE POLICY "resource_views_admin_read" ON resource_views
  FOR SELECT TO authenticated
  USING (true);
