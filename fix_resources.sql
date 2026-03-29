ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
