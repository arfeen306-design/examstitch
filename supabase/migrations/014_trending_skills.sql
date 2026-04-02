-- Migration 014: Trending Skills — view tracking + trending function
-- =====================================================================

-- 1. View tracking table
CREATE TABLE IF NOT EXISTS skill_playlist_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES skill_playlists(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_accounts(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_playlist_views_playlist ON skill_playlist_views(playlist_id);
CREATE INDEX idx_playlist_views_recent ON skill_playlist_views(viewed_at DESC);
CREATE INDEX idx_playlist_views_student ON skill_playlist_views(student_id) WHERE student_id IS NOT NULL;

-- 2. RLS
ALTER TABLE skill_playlist_views ENABLE ROW LEVEL SECURITY;

-- Authenticated students can insert their own views
CREATE POLICY "Students can log views"
  ON skill_playlist_views FOR INSERT
  WITH CHECK (true);

-- Only service role can read (for aggregation)
CREATE POLICY "Service role reads views"
  ON skill_playlist_views FOR SELECT
  USING (true);

-- 3. Trending playlists function — top 5 most-viewed in last 7 days
CREATE OR REPLACE FUNCTION get_trending_playlists(limit_count INT DEFAULT 5)
RETURNS TABLE (
  playlist_id UUID,
  playlist_title TEXT,
  playlist_description TEXT,
  skill_id UUID,
  skill_name TEXT,
  skill_slug TEXT,
  skill_icon TEXT,
  skill_gradient TEXT,
  skill_glow_color TEXT,
  view_count BIGINT,
  lesson_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    sp.id            AS playlist_id,
    sp.title         AS playlist_title,
    sp.description   AS playlist_description,
    s.id             AS skill_id,
    s.name           AS skill_name,
    s.slug           AS skill_slug,
    s.icon           AS skill_icon,
    s.gradient       AS skill_gradient,
    s.glow_color     AS skill_glow_color,
    COUNT(v.id)      AS view_count,
    (SELECT COUNT(*) FROM skill_lessons sl WHERE sl.playlist_id = sp.id) AS lesson_count
  FROM skill_playlist_views v
  JOIN skill_playlists sp ON sp.id = v.playlist_id
  JOIN skills s ON s.id = sp.skill_id
  WHERE v.viewed_at >= now() - INTERVAL '7 days'
    AND s.is_active = true
  GROUP BY sp.id, sp.title, sp.description, s.id, s.name, s.slug, s.icon, s.gradient, s.glow_color
  ORDER BY COUNT(v.id) DESC
  LIMIT limit_count;
$$;
