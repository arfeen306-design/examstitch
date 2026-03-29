-- ============================================================
-- EXAMSTITCH: ONE-TIME SCHEMA REPAIR SCRIPT
-- Run this ONCE in a NEW Supabase SQL Editor window.
-- It adds every missing column to your live 'resources' table.
-- ============================================================

-- 1. Add missing columns (IF NOT EXISTS prevents errors if you already added some)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS description      TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS source_type      TEXT NOT NULL DEFAULT 'google_drive';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS topic            TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS subject          TEXT NOT NULL DEFAULT 'Mathematics';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS category_id      UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_watermarked   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_published     BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW();

-- 2. Fix the Paper 5 slug while we're here
UPDATE categories 
SET name = 'Paper 5 — Probability & Statistics', 
    slug = 'paper-5-probability-statistics' 
WHERE slug = 'paper-2-probability-statistics';

-- 3. Force Supabase to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
