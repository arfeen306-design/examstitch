-- ═══════════════════════════════════════════════════════════════════════════
-- 015: Digital Skills Upgrade
-- Adds resource columns to skill_lessons, tagline to skills, seeds 8 tracks
-- ═══════════════════════════════════════════════════════════════════════════

-- ── New columns on skill_lessons ─────────────────────────────────────────
ALTER TABLE public.skill_lessons
  ADD COLUMN IF NOT EXISTS notes_url       TEXT,
  ADD COLUMN IF NOT EXISTS exercises_url   TEXT,
  ADD COLUMN IF NOT EXISTS cheatsheet_url  TEXT,
  ADD COLUMN IF NOT EXISTS quiz_url        TEXT;

COMMENT ON COLUMN public.skill_lessons.notes_url      IS 'PDF link for lesson notes';
COMMENT ON COLUMN public.skill_lessons.exercises_url   IS 'PDF link for practice exercises';
COMMENT ON COLUMN public.skill_lessons.cheatsheet_url  IS 'Image/PDF link for cheat sheet';
COMMENT ON COLUMN public.skill_lessons.quiz_url        IS 'Link or ID for interactive quiz';

-- ── Tagline column on skills ─────────────────────────────────────────────
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS tagline TEXT;

COMMENT ON COLUMN public.skills.tagline IS 'Short tagline shown on public landing page';

-- ── Seed the 8 default skill tracks ─────────────────────────────────────
INSERT INTO public.skills (name, slug, icon, tagline, description, gradient, glow_color, sort_order, is_active)
VALUES
  ('Coding',            'coding',            'Code2',      'Build the future, one line at a time',    'Learn programming fundamentals and advanced techniques.',       'from-violet-600 to-indigo-700',  'rgba(124,58,237,0.35)',  1, true),
  ('Design',            'design',            'Palette',    'Where pixels meet imagination',           'Master UI/UX design, color theory, and visual storytelling.',   'from-pink-500 to-rose-600',      'rgba(236,72,153,0.35)',  2, true),
  ('AI',                'ai',                'Brain',      'Intelligence, amplified',                 'Explore artificial intelligence, machine learning, and beyond.', 'from-cyan-500 to-blue-600',      'rgba(6,182,212,0.35)',   3, true),
  ('Web Development',   'web-development',   'Globe',      'Craft the web, shape the world',          'Full-stack web development from HTML to deployment.',           'from-emerald-500 to-teal-600',   'rgba(16,185,129,0.35)',  4, true),
  ('Cybersecurity',     'cybersecurity',     'Shield',     'Defend what matters most',                'Learn ethical hacking, network security, and threat analysis.',  'from-amber-500 to-orange-600',   'rgba(245,158,11,0.35)',  5, true),
  ('Data Science',      'data-science',      'Database',   'Turn data into decisions',                'Data analysis, visualization, and predictive modeling.',         'from-fuchsia-500 to-purple-600', 'rgba(192,38,211,0.35)',  6, true),
  ('Mobile Apps',       'mobile-apps',       'Smartphone', 'Apps that move with you',                 'Build native and cross-platform mobile applications.',          'from-sky-500 to-blue-600',       'rgba(14,165,233,0.35)',  7, true),
  ('Digital Analytics', 'digital-analytics', 'BarChart3',  'Measure everything, improve anything',    'Web analytics, SEO, marketing metrics, and growth hacking.',    'from-lime-500 to-green-600',     'rgba(132,204,22,0.35)',  8, true)
ON CONFLICT (slug) DO UPDATE SET
  tagline     = EXCLUDED.tagline,
  description = EXCLUDED.description,
  gradient    = EXCLUDED.gradient,
  glow_color  = EXCLUDED.glow_color,
  icon        = EXCLUDED.icon;

-- ── Notify PostgREST to reload schema cache ──────────────────────────────
NOTIFY pgrst, 'reload schema';
