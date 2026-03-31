-- Migration: 010_add_is_locked_to_resources
-- Adds is_locked to resources if it does not already exist (idempotent).
-- This column lets admins gate individual resources behind a login wall
-- without unpublishing them.

ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN resources.is_locked IS
  'When TRUE the resource is visible in listings but requires an authenticated session to view. Set from the Admin Panel.';

-- Drop the old anonymous read policy and replace it with one that respects is_locked.
DROP POLICY IF EXISTS "resources_public_read" ON resources;

CREATE POLICY "resources_public_read" ON resources
  FOR SELECT
  USING (is_published = TRUE AND is_locked = FALSE);

-- Authenticated users may always read published resources regardless of is_locked.
DROP POLICY IF EXISTS "resources_auth_read_locked" ON resources;

CREATE POLICY "resources_auth_read_locked" ON resources
  FOR SELECT
  USING (is_published = TRUE AND auth.role() = 'authenticated');
