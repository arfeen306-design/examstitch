-- ──────────────────────────────────────────────────────────────────────────────
-- 20260501_create_student_accounts_demo_bookings_media_widgets.sql
--
-- Materialises three tables that have lived in production but were never
-- captured in a migration file:
--   • public.student_accounts  — credentials + role + managed_subjects
--   • public.demo_bookings     — public demo-booking submissions
--   • public.media_widgets     — admin-managed embedded media (YT / PDF)
--
-- Schema is reverse-engineered from src/lib/supabase/types.ts and the code
-- that reads/writes these tables (RLS policies in supabase/rls-policies.sql,
-- API routes under src/app/api/admin/*).
--
-- Apply order matters:
--   • Must run BEFORE 20260502_admin_sessions.sql (which references user_id).
--   • Must run BEFORE 20260502_student_accounts_lock_credentials.sql (which
--     revokes column-level SELECTs on this table).
-- The 20260501 date prefix is deliberately chosen to sort first.
--
-- Idempotency: every CREATE uses IF NOT EXISTS / DO blocks. Running this
-- against a database that already has these tables is a no-op.
--
-- AUDIT_REPORT.md → Finding C-12.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── student_accounts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_accounts (
  id               uuid PRIMARY KEY,
  email            text NOT NULL UNIQUE,
  full_name        text NOT NULL,
  password_hash    text NOT NULL,
  salt             text NOT NULL,
  level            text NOT NULL DEFAULT '',
  role             text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_active        boolean NOT NULL DEFAULT true,
  is_super_admin   boolean NOT NULL DEFAULT false,
  managed_subjects uuid[] NOT NULL DEFAULT '{}',
  tutor_id         uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_login       timestamptz
);

-- Best-effort FK to auth.users — only added when the auth schema is reachable.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'student_accounts'
      AND constraint_name = 'student_accounts_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE public.student_accounts
      ADD CONSTRAINT student_accounts_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_student_accounts_email          ON public.student_accounts(email);
CREATE INDEX IF NOT EXISTS idx_student_accounts_role           ON public.student_accounts(role);
CREATE INDEX IF NOT EXISTS idx_student_accounts_super_admin    ON public.student_accounts(is_super_admin) WHERE is_super_admin;
CREATE INDEX IF NOT EXISTS idx_student_accounts_managed_gin    ON public.student_accounts USING gin (managed_subjects);

ALTER TABLE public.student_accounts ENABLE ROW LEVEL SECURITY;

-- A student can read their own row (column-level SELECT on credential
-- columns is revoked by 20260502_student_accounts_lock_credentials.sql).
DROP POLICY IF EXISTS "students_read_own" ON public.student_accounts;
CREATE POLICY "students_read_own" ON public.student_accounts
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- All admin writes go through service-role; no public INSERT/UPDATE/DELETE.

-- ── demo_bookings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.demo_bookings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref text NOT NULL UNIQUE,
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  email       text NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  whatsapp    text NOT NULL CHECK (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  level       text NOT NULL,
  subject     text NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'booked', 'cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_bookings_status     ON public.demo_bookings(status);
CREATE INDEX IF NOT EXISTS idx_demo_bookings_created_at ON public.demo_bookings(created_at DESC);

ALTER TABLE public.demo_bookings ENABLE ROW LEVEL SECURITY;

-- Anonymous users may submit a booking. They cannot read any rows back —
-- the API responds with the booking_ref directly.
DROP POLICY IF EXISTS "demo_bookings_anon_insert" ON public.demo_bookings;
CREATE POLICY "demo_bookings_anon_insert" ON public.demo_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- All reads / status mutations go through service-role only.

-- ── media_widgets ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media_widgets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug      text NOT NULL,
  section_order  integer NOT NULL DEFAULT 0,
  media_type     text NOT NULL CHECK (media_type IN ('youtube', 'pdf')),
  title          text NOT NULL,
  url            text NOT NULL,
  permissions    jsonb NOT NULL DEFAULT '{"allow_print": false, "allow_download": false}'::jsonb,
  is_active      boolean NOT NULL DEFAULT true,
  view_count     bigint NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_widgets_page_slug ON public.media_widgets(page_slug);
CREATE INDEX IF NOT EXISTS idx_media_widgets_active    ON public.media_widgets(is_active) WHERE is_active;

ALTER TABLE public.media_widgets ENABLE ROW LEVEL SECURITY;

-- Anonymous users see only active widgets — title/url/permissions are public
-- by design for the embed flow.
DROP POLICY IF EXISTS "media_widgets_public_read" ON public.media_widgets;
CREATE POLICY "media_widgets_public_read" ON public.media_widgets
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ── increment_media_view RPC (used by /api/media/view) ───────────────────────
-- SECURITY DEFINER + locked search_path so the bump can't be spoofed by a
-- shadowed table. Runs as service-role internally.
CREATE OR REPLACE FUNCTION public.increment_media_view(p_widget_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  UPDATE public.media_widgets
  SET view_count = view_count + 1
  WHERE id = p_widget_id AND is_active = true;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_media_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_media_view(uuid) TO anon, authenticated, service_role;

-- ── Verification queries (run manually after applying) ──────────────────────
--   SELECT count(*) FROM public.student_accounts;
--   SELECT relrowsecurity FROM pg_class WHERE relname = 'student_accounts';
--     -- expected: t
--   \d public.demo_bookings
--   SELECT public.increment_media_view(NULL); -- should no-op (no widget id)
