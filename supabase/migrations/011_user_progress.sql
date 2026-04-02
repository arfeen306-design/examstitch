-- ============================================================
-- Migration 011: User Progress Tracking
-- Tracks video completion and watch time for students.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_progress (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES student_accounts(id) ON DELETE CASCADE,
  resource_id    UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  is_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  watch_time     INTEGER NOT NULL DEFAULT 0, -- in seconds
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One entry per user per resource
  UNIQUE(user_id, resource_id)
);

-- RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Students can read/write their own progress
CREATE POLICY "user_progress_self_all" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Admin can read all
CREATE POLICY "user_progress_admin_read" ON user_progress
  FOR SELECT USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for dashboard lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_resource ON user_progress(resource_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_viewed ON user_progress(last_viewed_at DESC);
