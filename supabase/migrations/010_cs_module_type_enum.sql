-- ============================================================================
-- Migration 010: Enforce module_type as checked enum on resources table
-- Ensures resources are categorized as either 'video_topical' (Video Lecture)
-- or 'solved_past_paper' (Solved Past Paper) — no other values allowed.
-- ============================================================================

-- Add CHECK constraint on module_type (idempotent — drops if exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_resources_module_type'
  ) THEN
    ALTER TABLE resources
      ADD CONSTRAINT chk_resources_module_type
      CHECK (module_type IN ('video_topical', 'solved_past_paper'));
  END IF;
END $$;

-- Backfill any NULLs to a safe default
UPDATE resources
SET module_type = 'video_topical'
WHERE module_type IS NULL;

-- Make module_type NOT NULL going forward
ALTER TABLE resources
  ALTER COLUMN module_type SET NOT NULL,
  ALTER COLUMN module_type SET DEFAULT 'video_topical';

-- Index for efficient filtering by module_type
CREATE INDEX IF NOT EXISTS idx_resources_module_type
  ON resources (subject_id, module_type);
