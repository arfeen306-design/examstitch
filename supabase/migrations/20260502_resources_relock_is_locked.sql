-- ──────────────────────────────────────────────────────────────────────────────
-- 20260502_resources_relock_is_locked.sql
--
-- Restores the lock-wall on public resource reads. Migration 010 originally
-- gated locked resources behind an authenticated session, but that clause was
-- dropped in 20260407_rls_ensure_public_reads.sql:46-48, leaving paid/locked
-- content (Drive/YouTube IDs, source URLs) anon-readable via PostgREST.
--
-- AUDIT_REPORT.md → Finding C-13.
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Drop every prior incarnation so we land on a single, deterministic policy.
DROP POLICY IF EXISTS "resources_public_read"     ON public.resources;
DROP POLICY IF EXISTS "Public read access"        ON public.resources;
DROP POLICY IF EXISTS "resources_auth_read_locked" ON public.resources;

-- Anonymous: only published AND not locked.
CREATE POLICY "resources_anon_read_unlocked" ON public.resources
  FOR SELECT
  TO anon
  USING (is_published = true AND is_locked = false);

-- Authenticated: any published row (locked OR unlocked). Locked rows still
-- require an authenticated session to read; the application layer enforces
-- subject/subscription scoping for paid content beyond that.
CREATE POLICY "resources_auth_read_published" ON public.resources
  FOR SELECT
  TO authenticated
  USING (is_published = true);
