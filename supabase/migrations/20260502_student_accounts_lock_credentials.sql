-- ──────────────────────────────────────────────────────────────────────────────
-- 20260502_student_accounts_lock_credentials.sql
--
-- Revokes column-level SELECT on credential and authorization columns of
-- public.student_accounts so that even authenticated students cannot read
-- their own password_hash, salt, role, is_super_admin, or managed_subjects
-- through PostgREST. Service-role retains full read access.
--
-- AUDIT_REPORT.md → Finding C-11 (password hash leak via students_read_own
-- policy) and C-12 (table not version-controlled).
--
-- IMPORTANT: public.student_accounts is created and maintained out-of-band
-- in production (see audit C-12). This migration is intentionally written to
-- be applied to the live database. The revokes are idempotent and safe to
-- re-apply. A dedicated migration to materialise the full table schema in
-- this repository is tracked separately and is NOT part of this fix.
-- ──────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'student_accounts'
  ) THEN
    RAISE NOTICE 'public.student_accounts does not exist in this database — skipping credential revoke. Apply this migration against the live DB where the table was provisioned out-of-band.';
    RETURN;
  END IF;

  -- Revoke broad SELECT first (idempotent — Postgres permits revoking
  -- privileges that may or may not be currently granted).
  EXECUTE 'REVOKE SELECT (password_hash, salt) ON public.student_accounts FROM anon, authenticated';

  -- Authorization-relevant columns: keep them out of any client read so a
  -- compromised JWT cannot enumerate role/super-admin status.
  EXECUTE 'REVOKE SELECT (role, is_super_admin, managed_subjects) ON public.student_accounts FROM anon, authenticated';

  -- Service-role bypasses RLS and column grants, but be explicit for clarity.
  EXECUTE 'GRANT SELECT (password_hash, salt, role, is_super_admin, managed_subjects) ON public.student_accounts TO service_role';
END $$;

-- Verification queries (run manually after applying):
--   SELECT has_column_privilege('authenticated', 'public.student_accounts', 'password_hash', 'SELECT');
--     -- expected: false
--   SELECT has_column_privilege('service_role', 'public.student_accounts', 'password_hash', 'SELECT');
--     -- expected: true
