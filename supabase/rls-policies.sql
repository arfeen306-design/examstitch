-- ═══════════════════════════════════════════════════════════════════════════
-- ExamStitch — Row Level Security Policies
-- Run this in the Supabase SQL Editor to enforce access control.
--
-- Policy Summary:
--   • Anyone can SELECT (read) published resources
--   • Only admins (role='admin') can INSERT, UPDATE, DELETE
--   • Super admins bypass all subject restrictions
--   • Subject admins can only modify resources within their managed_subjects
--   • Students cannot see unpublished (is_published=false) resources
--   • Admins CAN see unpublished resources (for testing/preview)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enable RLS on core tables ────────────────────────────────────────────

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- ── Helper: Check if current user is an admin ────────────────────────────
-- Uses the student_accounts table which stores role and permissions.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_accounts
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_accounts
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_super_admin = true
      AND is_active = true
  );
$$;

-- Check if admin manages a specific subject
CREATE OR REPLACE FUNCTION public.admin_manages_subject(subject_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_accounts
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
      AND (
        is_super_admin = true
        OR subject_uuid::text = ANY(managed_subjects)
      )
  );
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- RESOURCES TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "resources_public_read" ON resources;
DROP POLICY IF EXISTS "resources_admin_read_all" ON resources;
DROP POLICY IF EXISTS "resources_admin_insert" ON resources;
DROP POLICY IF EXISTS "resources_admin_update" ON resources;
DROP POLICY IF EXISTS "resources_admin_delete" ON resources;

-- 1. Public read: anyone can see PUBLISHED resources (no auth required)
CREATE POLICY "resources_public_read"
  ON resources FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- 2. Admin read: admins can see ALL resources (including unpublished)
--    Super admins see everything; subject admins see their subjects only
CREATE POLICY "resources_admin_read_all"
  ON resources FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR public.admin_manages_subject(subject_id)
    )
  );

-- 3. Admin insert: only admins can create resources
CREATE POLICY "resources_admin_insert"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR public.admin_manages_subject(subject_id)
    )
  );

-- 4. Admin update: only admins can modify resources
CREATE POLICY "resources_admin_update"
  ON resources FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR public.admin_manages_subject(subject_id)
    )
  )
  WITH CHECK (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR public.admin_manages_subject(subject_id)
    )
  );

-- 5. Admin delete: only admins can delete resources
CREATE POLICY "resources_admin_delete"
  ON resources FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR public.admin_manages_subject(subject_id)
    )
  );


-- ═══════════════════════════════════════════════════════════════════════════
-- CATEGORIES TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "categories_public_read" ON categories;
DROP POLICY IF EXISTS "categories_admin_write" ON categories;

-- Anyone can read categories (needed for navigation)
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can modify categories
CREATE POLICY "categories_admin_write"
  ON categories FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- SUBJECTS TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "subjects_public_read" ON subjects;
DROP POLICY IF EXISTS "subjects_admin_write" ON subjects;

-- Anyone can read subjects
CREATE POLICY "subjects_public_read"
  ON subjects FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only super admins can modify subjects
CREATE POLICY "subjects_admin_write"
  ON subjects FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKET POLICIES (for file uploads)
-- ═══════════════════════════════════════════════════════════════════════════
-- These apply to the 'resources' storage bucket.
-- Run these only if you have a 'resources' bucket created.

-- Allow public read access to uploaded files
INSERT INTO storage.policies (name, bucket_id, definition, check_expression)
SELECT
  'Public read access for resources',
  'resources',
  '(true)',
  NULL
WHERE EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'resources')
ON CONFLICT DO NOTHING;

-- Note: The application uses the service_role key (admin client) for uploads,
-- which bypasses RLS. These storage policies are a safety net for direct
-- client-side access attempts.


-- ═══════════════════════════════════════════════════════════════════════════
-- STUDENT ACCOUNTS — protect sensitive data
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE student_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_read_own" ON student_accounts;
DROP POLICY IF EXISTS "students_admin_read" ON student_accounts;
DROP POLICY IF EXISTS "students_admin_write" ON student_accounts;

-- Students can read their own profile
CREATE POLICY "students_read_own"
  ON student_accounts FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all student accounts
CREATE POLICY "students_admin_read"
  ON student_accounts FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only super admins can modify student accounts
CREATE POLICY "students_admin_write"
  ON student_accounts FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
