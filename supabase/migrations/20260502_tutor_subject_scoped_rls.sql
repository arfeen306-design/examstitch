-- ──────────────────────────────────────────────────────────────────────────────
-- 20260502_tutor_subject_scoped_rls.sql
--
-- Multi-tutor / multi-admin subject isolation at the RLS layer.
--
-- Phase 4 Task 3: a tutor (or scoped admin) assigned to one subject must have
-- full CRUD on that subject's resources and categories, and must not be able
-- to even SELECT another subject's metadata via the admin client.
--
-- Until this migration the application enforced subject scope at the
-- Server-Action layer (Phase 1.5). That is sufficient for "no cross-tenant
-- writes", but a misconfigured route or a bypassed action would still allow
-- cross-tenant reads through the anon/cookie client. Pinning the constraint
-- in the database closes that gap.
--
-- AUDIT_REPORT.md → Findings C-06, H-11.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Helper: is the caller an admin authorised for THIS subject? ─────────────
-- Returns true when the caller's student_accounts row has either:
--   • is_super_admin = true (always permitted), or
--   • the supplied subject_id in their managed_subjects array.
-- SECURITY DEFINER + locked search_path so a shadowed table can't spoof it.
CREATE OR REPLACE FUNCTION public.is_admin_for_subject(p_subject_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_accounts sa
    WHERE sa.id = auth.uid()
      AND sa.is_active = true
      AND sa.role = 'admin'
      AND (sa.is_super_admin = true OR p_subject_id = ANY(sa.managed_subjects))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin_for_subject(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin_for_subject(uuid) TO authenticated, service_role;

-- ── resources: subject-scoped admin write policy ────────────────────────────
-- Replaces the broad `is_admin()` write policy with a per-subject check. The
-- public read policy from 20260502_resources_relock_is_locked.sql is unchanged.
DROP POLICY IF EXISTS "resources_admin_write"          ON public.resources;
DROP POLICY IF EXISTS "resources_admin_subject_write"  ON public.resources;
CREATE POLICY "resources_admin_subject_write" ON public.resources
  FOR ALL
  TO authenticated
  USING (public.is_admin_for_subject(subject_id))
  WITH CHECK (public.is_admin_for_subject(subject_id));

-- ── categories: tighten H-11 — replace the old subject-agnostic admin write
-- with a subject-scoped check.
DROP POLICY IF EXISTS "categories_admin_write"          ON public.categories;
DROP POLICY IF EXISTS "categories_admin_subject_write"  ON public.categories;
CREATE POLICY "categories_admin_subject_write" ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin_for_subject(subject_id))
  WITH CHECK (public.is_admin_for_subject(subject_id));

-- ── resource_solutions: scope writes via the parent paper's subject ─────────
-- Reads stay public (existing policy unchanged); only writes are tightened.
DROP POLICY IF EXISTS "resource_solutions_admin_write"          ON public.resource_solutions;
DROP POLICY IF EXISTS "resource_solutions_admin_subject_write"  ON public.resource_solutions;
CREATE POLICY "resource_solutions_admin_subject_write" ON public.resource_solutions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.id = resource_solutions.paper_id
        AND public.is_admin_for_subject(r.subject_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.id = resource_solutions.paper_id
        AND public.is_admin_for_subject(r.subject_id)
    )
  );

-- ── Indexes for the join in is_admin_for_subject ────────────────────────────
-- managed_subjects is a uuid[]; a GIN index makes ANY(...) fast on the
-- student_accounts row count we currently expect. Already created in
-- 20260501_create_student_accounts_demo_bookings_media_widgets.sql but
-- guarded here for clarity.
CREATE INDEX IF NOT EXISTS idx_student_accounts_managed_gin
  ON public.student_accounts USING gin (managed_subjects);

-- The subject-scoped policies above call is_admin_for_subject(subject_id)
-- for every row scanned. resources.subject_id and categories.subject_id are
-- already individually indexed; flag a composite for the most common admin
-- query (subject + published) to keep dashboards snappy.
CREATE INDEX IF NOT EXISTS idx_resources_subject_published
  ON public.resources(subject_id, is_published)
  WHERE is_published = true;

-- ── Verification queries (run manually after applying) ──────────────────────
--   -- As a non-super admin who manages only Physics:
--   SELECT count(*) FROM resources WHERE subject_id = '<chemistry-uuid>';
--     -- expected: 0 rows visible (RLS hides), or ROW SECURITY error on write
--
--   -- Same admin, on their assigned subject:
--   SELECT count(*) FROM resources WHERE subject_id = '<physics-uuid>';
--     -- expected: full count
