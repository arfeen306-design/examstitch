-- ============================================================
-- Migration 007: Subscribers (Silent Lead Generation)
-- Stores emails from the "Notify Me" box.
-- No auth required to insert — anyone can subscribe.
-- ============================================================

CREATE TABLE IF NOT EXISTS subscribers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL UNIQUE,
  source_page TEXT        NOT NULL DEFAULT '/',
  level       TEXT        NOT NULL DEFAULT 'general',
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email  ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_level  ON subscribers(level);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(is_active);

-- RLS: public can insert, only admin can read
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (no login required)
CREATE POLICY "subscribers_public_insert" ON subscribers
  FOR INSERT WITH CHECK (true);

-- Only service_role (admin client) can read — never expose emails to browser
CREATE POLICY "subscribers_admin_read" ON subscribers
  FOR SELECT USING (auth.role() = 'service_role');
