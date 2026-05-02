-- ──────────────────────────────────────────────────────────────────────────────
-- 20260502_categories_enable_rls.sql
--
-- Repair: ENABLE ROW LEVEL SECURITY on public.categories.
--
-- The previous migration (20260502_tutor_subject_scoped_rls) added a
-- `categories_admin_subject_write` policy but did not toggle RLS on. As a
-- result the policy sat dormant and every admin write to categories went
-- through unfiltered — exactly the opposite of the intent.
--
-- This migration is idempotent: it enables RLS, drops any prior public-read
-- policy aliases, and ensures both an anon-read and an admin-subject-scoped
-- write policy are in place.
--
-- AUDIT_REPORT.md → Findings C-06, H-11 (subject-scoped write enforcement).
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public read (categories are taxonomy metadata; intentional public access).
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
DROP POLICY IF EXISTS "Public read access"     ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin write must be subject-scoped. The policy was created in
-- 20260502_tutor_subject_scoped_rls but RLS being off rendered it dormant —
-- recreate it here defensively so a fresh DB rebuild produces a coherent
-- final state regardless of migration replay order.
DROP POLICY IF EXISTS "categories_admin_subject_write" ON public.categories;
CREATE POLICY "categories_admin_subject_write" ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin_for_subject(subject_id))
  WITH CHECK (public.is_admin_for_subject(subject_id));

-- Verification (run after applying):
--   SELECT relrowsecurity FROM pg_class
--   WHERE relname='categories' AND relnamespace=(SELECT oid FROM pg_namespace WHERE nspname='public');
--   -- expected: t
