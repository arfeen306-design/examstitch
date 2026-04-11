-- Seed parent discipline rows in public.subjects for every admin portal.
-- Idempotent: safe to re-run (ON CONFLICT DO NOTHING on slug).
-- After this, /admin/physics etc. resolve subjects.slug = 'physics', …

BEGIN;

INSERT INTO public.subjects (name, slug, levels) VALUES
  ('Physics', 'physics', ARRAY['O Level', 'A Level', 'AS Level', 'A2 Level']),
  ('Chemistry', 'chemistry', ARRAY['O Level', 'A Level', 'AS Level', 'A2 Level']),
  ('Biology', 'biology', ARRAY['O Level', 'A Level', 'AS Level', 'A2 Level']),
  ('English', 'english', ARRAY['O Level', 'A Level', 'AS Level', 'A2 Level']),
  ('Urdu', 'urdu', ARRAY['O Level', 'A Level', 'AS Level', 'A2 Level']),
  ('Pakistan Studies', 'pakistan-studies', ARRAY['O Level', 'A Level'])
ON CONFLICT (slug) DO NOTHING;

-- Keep super-admins’ managed_subjects in sync with the full subjects list
UPDATE public.student_accounts sa
SET managed_subjects = subj.ids
FROM (
  SELECT ARRAY_AGG(id ORDER BY slug) AS ids FROM public.subjects
) subj
WHERE sa.is_super_admin = TRUE
  AND subj.ids IS NOT NULL;

COMMIT;
