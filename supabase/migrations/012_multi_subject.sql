-- ============================================================================
-- Migration 012: Multi-Subject Architecture (Phase 1)
--
-- Migrates ExamStitch from flat Maths-only to relational multi-subject.
-- 1. Renames old `subjects` (Cambridge paper codes) → `subject_papers`
-- 2. Creates new parent-level `subjects` table (discipline grouping)
-- 3. Links resources to the new subjects table
-- 4. Adds subject-admin columns to student_accounts
-- ============================================================================

BEGIN;

-- ─── Phase 1.0: Rename existing subjects → subject_papers ──────────────────
ALTER TABLE subjects RENAME TO subject_papers;

-- ─── Phase 1.1: Create new subjects table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  levels     TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY subjects_public_read ON public.subjects FOR SELECT USING (true);

-- Seed subjects
INSERT INTO public.subjects (name, slug, levels) VALUES
  ('Mathematics',      'maths',            ARRAY['Pre-O', 'O Level', 'A Level']),
  ('Computer Science', 'computer-science', ARRAY['O Level', 'A Level']);

-- Link old subject_papers to new parent subjects
ALTER TABLE public.subject_papers
  ADD COLUMN IF NOT EXISTS parent_subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;

UPDATE public.subject_papers
  SET parent_subject_id = (SELECT id FROM public.subjects WHERE slug = 'maths');

-- ─── Phase 1.2a: Add subject_id FK to resources ────────────────────────────
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS subject_id UUID;

-- Backfill existing resources → Mathematics
UPDATE public.resources
  SET subject_id = (SELECT id FROM public.subjects WHERE slug = 'maths')
  WHERE subject_id IS NULL;

-- Enforce NOT NULL + FK
ALTER TABLE public.resources ALTER COLUMN subject_id SET NOT NULL;
ALTER TABLE public.resources
  ADD CONSTRAINT resources_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resources_subject_id ON public.resources(subject_id);

-- ─── Phase 1.2b: Add subject-admin columns to student_accounts ─────────────
ALTER TABLE public.student_accounts
  ADD COLUMN IF NOT EXISTS managed_subjects UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Set arfeen306@gmail.com as super_admin with all subjects
UPDATE public.student_accounts
  SET
    is_super_admin = TRUE,
    managed_subjects = (SELECT ARRAY_AGG(id) FROM public.subjects)
  WHERE email = 'arfeen306@gmail.com';

COMMIT;
