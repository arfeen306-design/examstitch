-- ═══════════════════════════════════════════════════════════════════
-- Migration 013 — Digital Skills (skills → playlists → lessons)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Skills -------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT NOT NULL DEFAULT 'Code2',      -- Lucide icon name
  description TEXT,
  gradient    TEXT DEFAULT 'from-violet-600 to-indigo-700',
  glow_color  TEXT DEFAULT 'rgba(124,58,237,0.35)',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Playlists (modules / sections within a skill) ----------------
CREATE TABLE IF NOT EXISTS skill_playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_playlists_skill
  ON skill_playlists(skill_id);

-- 3. Lessons (individual videos / content items) ------------------
CREATE TABLE IF NOT EXISTS skill_lessons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id  UUID NOT NULL REFERENCES skill_playlists(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  video_url    TEXT,                     -- YouTube / Vimeo embed URL
  resource_url TEXT,                     -- PDF / external link
  duration     TEXT,                     -- display string e.g. "12:30"
  sort_order   INT NOT NULL DEFAULT 0,
  is_free      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_lessons_playlist
  ON skill_lessons(playlist_id);

-- 4. Student → Skill access (unlocked skills per student) ---------
CREATE TABLE IF NOT EXISTS student_skill_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES student_accounts(id) ON DELETE CASCADE,
  skill_id    UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by  UUID,                      -- admin who granted access
  UNIQUE(student_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_student_skill_access_student
  ON student_skill_access(student_id);

-- 5. Updated_at trigger (reuse if exists) -------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_skills_updated_at') THEN
    CREATE TRIGGER set_skills_updated_at
      BEFORE UPDATE ON skills
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_skill_playlists_updated_at') THEN
    CREATE TRIGGER set_skill_playlists_updated_at
      BEFORE UPDATE ON skill_playlists
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_skill_lessons_updated_at') THEN
    CREATE TRIGGER set_skill_lessons_updated_at
      BEFORE UPDATE ON skill_lessons
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- 6. RLS policies ------------------------------------------------
ALTER TABLE skills                ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_playlists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skill_access  ENABLE ROW LEVEL SECURITY;

-- Public read for active skills (used by landing page)
CREATE POLICY "Public can read active skills"
  ON skills FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can read playlists"
  ON skill_playlists FOR SELECT USING (TRUE);

CREATE POLICY "Public can read lessons"
  ON skill_lessons FOR SELECT USING (TRUE);

-- Student access: students can see their own unlocked skills
CREATE POLICY "Students see own access"
  ON student_skill_access FOR SELECT
  USING (auth.uid() = student_id);

-- Service-role (admin client) bypasses RLS, so no admin INSERT/UPDATE
-- policies needed — all admin writes go through createAdminClient().
