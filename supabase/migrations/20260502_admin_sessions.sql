-- ──────────────────────────────────────────────────────────────────────────────
-- 20260502_admin_sessions.sql
--
-- Opaque session-token table for admin authentication. Replaces the previous
-- model where the admin_session cookie value was the literal user UUID
-- (forgeable in any context that could already plant cookies, and impossible
-- to revoke before its 7-day expiry).
--
-- Design:
--   • admin_sessions.token is a 256-bit random opaque string.
--   • One row per active session. Logout / role-revoke deletes the row →
--     instant invalidation, regardless of cookie expiry.
--   • Service-role-only: RLS enabled with no public policies. Only the
--     server-side admin client (createAdminClient) can read or mutate it.
--
-- AUDIT_REPORT.md → Finding C-10 (cookie staleness, no session revocation).
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  token        text PRIMARY KEY,
  user_id      uuid NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent   text,
  ip_hash      text  -- optional: store sha256(ip) for forensics, never raw IP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id      ON public.admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at   ON public.admin_sessions(expires_at);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for anon or authenticated. Only
-- service-role (which bypasses RLS) can touch this table.
DROP POLICY IF EXISTS "admin_sessions_no_anon" ON public.admin_sessions;
CREATE POLICY "admin_sessions_no_anon" ON public.admin_sessions
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Convenience cleanup function — call from cron or an edge job.
CREATE OR REPLACE FUNCTION public.purge_expired_admin_sessions()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  WITH d AS (
    DELETE FROM public.admin_sessions WHERE expires_at < now() RETURNING 1
  )
  SELECT count(*) FROM d;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_expired_admin_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_admin_sessions() TO service_role;
