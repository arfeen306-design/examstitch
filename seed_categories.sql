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
  -- CAMBRIDGE O-LEVEL MATHEMATICS (4024) CATEGORIES
  -- -----------------------------------------------------------------------------------
  INSERT INTO categories (subject_id, name, slug, sort_order) VALUES
    (olevel_id, 'Numbers', 'numbers', 10),
    (olevel_id, 'Set Language and Notation', 'set-language', 20),
    (olevel_id, 'Algebra (Expressions & Formulae)', 'algebra', 30),
    (olevel_id, 'Indices and Standard Form', 'indices-standard-form', 40),
    (olevel_id, 'Matrices', 'matrices', 50),
    (olevel_id, 'Coordinate Geometry', 'coordinate-geometry', 60),
    (olevel_id, 'Geometry (Angles & Polygons)', 'geometry', 70),
    (olevel_id, 'Mensuration (Area & Volume)', 'mensuration', 80),
    (olevel_id, 'Trigonometry', 'trigonometry', 90),
    (olevel_id, 'Vectors in Two Dimensions', 'vectors', 100),
    (olevel_id, 'Kinematics (Distance-Time)', 'kinematics', 110),
    (olevel_id, 'Statistics', 'statistics', 120),
    (olevel_id, 'Probability', 'probability', 130),
    (olevel_id, 'Transformations', 'transformations', 140);


  -- -----------------------------------------------------------------------------------
  -- CAMBRIDGE A-LEVEL MATHEMATICS (9709) CATEGORIES
  -- -----------------------------------------------------------------------------------
  
  -- PAPER 1 (PURE MATH 1)
  INSERT INTO categories (subject_id, name, slug, sort_order) VALUES
    (alevel_id, '[P1] Quadratics', 'p1-quadratics', 101),
    (alevel_id, '[P1] Functions', 'p1-functions', 102),
    (alevel_id, '[P1] Coordinate Geometry', 'p1-coordinate-geometry', 103),
    (alevel_id, '[P1] Circular Measure', 'p1-circular-measure', 104),
    (alevel_id, '[P1] Trigonometry', 'p1-trigonometry', 105),
    (alevel_id, '[P1] Series', 'p1-series', 106),
    (alevel_id, '[P1] Differentiation', 'p1-differentiation', 107),
    (alevel_id, '[P1] Integration', 'p1-integration', 108);

  -- PAPER 3 (PURE MATH 3)
  INSERT INTO categories (subject_id, name, slug, sort_order) VALUES
    (alevel_id, '[P3] Algebra', 'p3-algebra', 301),
    (alevel_id, '[P3] Logarithmic & Exponential Functions', 'p3-log-exp', 302),
    (alevel_id, '[P3] Trigonometry', 'p3-trigonometry', 303),
    (alevel_id, '[P3] Differentiation', 'p3-differentiation', 304),
    (alevel_id, '[P3] Integration', 'p3-integration', 305),
    (alevel_id, '[P3] Numerical Solution of Equations', 'p3-numerical-solutions', 306),
    (alevel_id, '[P3] Vectors', 'p3-vectors', 307),
    (alevel_id, '[P3] Differential Equations', 'p3-differential-equations', 308),
    (alevel_id, '[P3] Complex Numbers', 'p3-complex-numbers', 309);

  -- PAPER 4 (MECHANICS 1)
  INSERT INTO categories (subject_id, name, slug, sort_order) VALUES
    (alevel_id, '[M1] Forces and Equilibrium', 'm1-forces-equilibrium', 401),
    (alevel_id, '[M1] Kinematics of Motion', 'm1-kinematics', 402),
    (alevel_id, '[M1] Newton''s Laws of Motion', 'm1-newtons-laws', 403),
    (alevel_id, '[M1] Energy, Work and Power', 'm1-energy-work-power', 404);

  -- PAPER 5 (PROBABILITY & STATISTICS 1)
  INSERT INTO categories (subject_id, name, slug, sort_order) VALUES
    (alevel_id, '[S1] Representation of Data', 's1-representation-data', 501),
    (alevel_id, '[S1] Permutations and Combinations', 's1-permutations', 502),
    (alevel_id, '[S1] Probability', 's1-probability', 503),
    (alevel_id, '[S1] Discrete Random Variables', 's1-discrete-random', 504),
    (alevel_id, '[S1] The Normal Distribution', 's1-normal-distribution', 505);

  -- PAPER 6 (PROBABILITY & STATISTICS 2)
  INSERT INTO categories (subject_id, name, slug, sort_order) VALUES
    (alevel_id, '[S2] The Poisson Distribution', 's2-poisson', 601),
    (alevel_id, '[S2] Linear Combinations of Random Variables', 's2-linear-combinations', 602),
    (alevel_id, '[S2] Continuous Random Variables', 's2-continuous-random', 603),
    (alevel_id, '[S2] Sampling and Estimation', 's2-sampling-estimation', 604),
    (alevel_id, '[S2] Hypothesis Testing', 's2-hypothesis-testing', 605);

END $$;
