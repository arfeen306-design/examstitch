-- ============================================================
-- Migration 005: Resources
-- The main content table. Stores PDFs, videos, worksheets.
-- ============================================================

CREATE TYPE IF NOT EXISTS content_type_enum   AS ENUM ('video', 'pdf', 'worksheet');
CREATE TYPE IF NOT EXISTS source_type_enum    AS ENUM ('youtube', 'google_drive', 'external_link');

CREATE TABLE IF NOT EXISTS resources (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  exam_series_id UUID REFERENCES exam_series(id) ON DELETE SET NULL,

  title          TEXT NOT NULL,
  description    TEXT,

  content_type   content_type_enum  NOT NULL,
  source_type    source_type_enum   NOT NULL,
  -- For YouTube:      store the video ID (e.g. "dQw4w9WgXcQ")
  -- For Google Drive: store the file ID (e.g. "1BxiMVs0XRA5n...")
  source_url     TEXT NOT NULL,

  topic          TEXT,       -- for topical worksheets (e.g. "Trigonometry")
  subject        TEXT NOT NULL DEFAULT 'Mathematics',

  is_watermarked BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked      BOOLEAN NOT NULL DEFAULT FALSE,  -- future: require login
  is_published   BOOLEAN NOT NULL DEFAULT TRUE,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_resources_category     ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_content_type ON resources(content_type);
CREATE INDEX IF NOT EXISTS idx_resources_topic        ON resources(topic);
CREATE INDEX IF NOT EXISTS idx_resources_published    ON resources(is_published);
CREATE INDEX IF NOT EXISTS idx_resources_created      ON resources(created_at DESC);

-- Full-text search index on title + description
CREATE INDEX IF NOT EXISTS idx_resources_fts ON resources
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

-- RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Public can read any non-locked, published resource
CREATE POLICY "resources_public_read" ON resources
  FOR SELECT USING (is_published = TRUE AND is_locked = FALSE);

-- Authenticated users can read locked resources (future use)
CREATE POLICY "resources_auth_read_locked" ON resources
  FOR SELECT USING (is_published = TRUE AND auth.role() = 'authenticated');
