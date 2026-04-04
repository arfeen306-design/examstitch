-- ═══════════════════════════════════════════════════════════════════════════
-- STEM Simulations Table
-- Stores live HTML/Canvas simulation code managed by Super Admins
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS stem_simulations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  subject       TEXT NOT NULL CHECK (subject IN ('mathematics', 'science')),
  category      TEXT NOT NULL,          -- e.g. 'Geometry', 'Atomic Structure'
  description   TEXT DEFAULT '',
  instructions  TEXT DEFAULT '',
  icon          TEXT DEFAULT 'Sparkles', -- Lucide icon name
  gradient      TEXT DEFAULT 'from-blue-500 to-indigo-600',
  glow_color    TEXT DEFAULT 'rgba(99,102,241,0.35)',
  difficulty    TEXT DEFAULT 'Beginner' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  tags          TEXT[] DEFAULT '{}',
  html_code     TEXT DEFAULT '',        -- Full HTML document for sandbox iframe
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Index for public queries (published simulations by subject)
CREATE INDEX IF NOT EXISTS idx_stem_simulations_subject_status
  ON stem_simulations (subject, status);

CREATE INDEX IF NOT EXISTS idx_stem_simulations_slug
  ON stem_simulations (slug);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_stem_simulations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stem_simulations_updated_at
  BEFORE UPDATE ON stem_simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_stem_simulations_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- Row-Level Security
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE stem_simulations ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read published simulations (no html_code in public queries
-- is handled at the application layer — RLS allows the read)
CREATE POLICY "Public can read published simulations"
  ON stem_simulations FOR SELECT
  USING (status = 'published');

-- Service role (admin client) bypasses RLS, so no explicit admin policy needed.
-- The admin client uses the service_role key which has full access.
