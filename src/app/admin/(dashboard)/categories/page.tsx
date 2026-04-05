import { createAdminClient } from '@/lib/supabase/admin';
import CategoryManagerClient from './CategoryManagerClient';
import CategoryTableClient from './CategoryTableClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient();

  const [{ data: categories, error: catError }, { data: subjects, error: subError }] = await Promise.all([
    supabase.from('categories').select(`*, subject:subjects(name), resources(count)`).order('sort_order', { ascending: true }),
    supabase.from('subjects').select('id, name, slug').order('name')
  ]);

  if (catError || subError) {
    console.error('Failed to fetch categories/subjects', catError || subError);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Category Taxonomy</h2>
        <p className="text-sm text-[var(--text-muted)]">Structural hierarchy for Mathematics routing.</p>
      </div>

      <CategoryManagerClient subjects={subjects || []} />

      <CategoryTableClient categories={categories || []} />
    </div>
  );
}
