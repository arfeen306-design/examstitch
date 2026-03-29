-- -------------------------------------------------------------------------------------
-- EXAMSTITCH: FULL DATABASE INIT & MATHEMATICS TAXONOMY SCRIPT
-- -------------------------------------------------------------------------------------

-- ==========================================
-- STEP 1: CREATE CORE ARCHITECTURE TABLES
-- ==========================================

-- 1. Levels
CREATE TABLE IF NOT EXISTS levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0
);

-- 2. Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0
);

-- 3. Categories (Taxonomy)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0
);

-- 4. Resources
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT NOT NULL,
  topic TEXT,
  subject TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_watermarked BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Subscribers (Lead List)
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  level TEXT,
  source_page TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- STEP 2: GENERATE THE SYLLABUS TAXONOMY
-- ==========================================

DO $$
DECLARE
  level_olevel_id UUID;
  level_alevel_id UUID;
  olevel_id UUID;
  alevel_id UUID;
BEGIN

  -- -----------------------------------------------------------------------------------
  -- ENSURE LEVELS EXIST (O-Level & A-Level)
  -- -----------------------------------------------------------------------------------
  SELECT id INTO level_olevel_id FROM levels WHERE slug = 'olevel' LIMIT 1;
  IF level_olevel_id IS NULL THEN
    INSERT INTO levels (id, name, slug) 
    VALUES (gen_random_uuid(), 'O-Level', 'olevel') 
    RETURNING id INTO level_olevel_id;
  END IF;

  SELECT id INTO level_alevel_id FROM levels WHERE slug = 'alevel' LIMIT 1;
  IF level_alevel_id IS NULL THEN
    INSERT INTO levels (id, name, slug) 
    VALUES (gen_random_uuid(), 'A-Level', 'alevel') 
    RETURNING id INTO level_alevel_id;
  END IF;

  -- -----------------------------------------------------------------------------------
  -- ENSURE SUBJECTS EXIST (4024 & 9709)
  -- -----------------------------------------------------------------------------------
  SELECT id INTO olevel_id FROM subjects WHERE code = '4024' LIMIT 1;
  IF olevel_id IS NULL THEN
    INSERT INTO subjects (id, name, code, level_id, slug)
    VALUES (gen_random_uuid(), 'Mathematics', '4024', level_olevel_id, 'mathematics-4024')
    RETURNING id INTO olevel_id;
  END IF;

  SELECT id INTO alevel_id FROM subjects WHERE code = '9709' LIMIT 1;
  IF alevel_id IS NULL THEN
    INSERT INTO subjects (id, name, code, level_id, slug)
    VALUES (gen_random_uuid(), 'Mathematics', '9709', level_alevel_id, 'mathematics-9709')
    RETURNING id INTO alevel_id;
  END IF;

  -- -----------------------------------------------------------------------------------
  -- RESET CATEGORIES (Cleans up previous incorrect topic insertions)
  -- -----------------------------------------------------------------------------------
  DELETE FROM categories;

  -- -----------------------------------------------------------------------------------
  -- CAMBRIDGE O-LEVEL MATHEMATICS (4024) STRATA (GRADES)
  -- -----------------------------------------------------------------------------------
  INSERT INTO categories (subject_id, name, slug, sort_order) VALUES
    (olevel_id, 'Grade 9', 'grade-9', 10),
    (olevel_id, 'Grade 10', 'grade-10', 20),
    (olevel_id, 'Grade 11', 'grade-11', 30);

  -- -----------------------------------------------------------------------------------
  -- CAMBRIDGE A-LEVEL MATHEMATICS (9709) STRATA (PAPERS)
  -- -----------------------------------------------------------------------------------
  INSERT INTO categories (subject_id, name, slug, sort_order) VALUES
    (alevel_id, 'Paper 1 — Pure Mathematics', 'paper-1-pure-mathematics', 10),
    (alevel_id, 'Paper 2 — Probability & Statistics', 'paper-2-probability-statistics', 20),
    (alevel_id, 'Paper 3 — Pure Mathematics', 'paper-3-pure-mathematics', 30),
    (alevel_id, 'Paper 4 — Mechanics', 'paper-4-mechanics', 40);

END $$;
