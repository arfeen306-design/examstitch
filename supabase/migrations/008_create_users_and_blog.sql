-- ============================================================
-- Migration 008: Users, Tutor Applications, Blog Posts
-- Built now, activated in Phase 2 when auth is enabled.
-- ============================================================

-- User roles enum
CREATE TYPE IF NOT EXISTS user_role_enum AS ENUM (
  'admin', 'tutor_verified', 'tutor_pending', 'student', 'public'
);

CREATE TYPE IF NOT EXISTS application_status_enum AS ENUM (
  'pending', 'approved', 'rejected'
);

-- ── Users (extends Supabase auth.users) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        user_role_enum NOT NULL DEFAULT 'student',
  avatar_url  TEXT,
  bio         TEXT,
  subjects    TEXT[] NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Users can read their own profile
CREATE POLICY "users_self_read" ON users FOR SELECT USING (auth.uid() = id);
-- Admin can read all
CREATE POLICY "users_admin_read" ON users FOR SELECT USING (auth.role() = 'service_role');

-- ── Tutor Applications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tutor_applications (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name      TEXT        NOT NULL,
  email          TEXT        NOT NULL,
  phone          TEXT,
  subjects       TEXT[]      NOT NULL DEFAULT '{}',
  qualifications TEXT,
  experience     TEXT,
  status         application_status_enum NOT NULL DEFAULT 'pending',
  reviewed_by    UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tutor_applications ENABLE ROW LEVEL SECURITY;
-- Anyone can submit an application (Phase 2 form)
CREATE POLICY "applications_public_insert" ON tutor_applications
  FOR INSERT WITH CHECK (true);
-- Only admin reads applications
CREATE POLICY "applications_admin_read" ON tutor_applications
  FOR SELECT USING (auth.role() = 'service_role');

-- ── Blog Posts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  content     TEXT        NOT NULL DEFAULT '',
  author_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_published BOOLEAN    NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_public_read" ON blog_posts
  FOR SELECT USING (is_published = TRUE);
