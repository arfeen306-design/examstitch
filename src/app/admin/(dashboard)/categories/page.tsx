import { createAdminClient } from '@/lib/supabase/admin';
import CategoryManagerClient from './CategoryManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient();

  const [{ data: categories, error: catError }, { data: subjects, error: subError }] = await Promise.all([
    supabase.from('categories').select(`*, subject:subjects(name)`).order('sort_order', { ascending: true }),
    supabase.from('subjects').select('id, name, code').order('sort_order', { ascending: true })
  ]);

  if (catError || subError) {
    console.error('Failed to fetch categories/subjects', catError || subError);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-navy-900 tracking-tight">Category Taxonomy</h2>
        <p className="text-sm text-navy-500">Structural hierarchy for Mathematics routing.</p>
      </div>

      <CategoryManagerClient subjects={subjects || []} />

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-navy-50 overflow-hidden">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Current Topics</h3>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-navy-50 rounded-lg">
          <table className="w-full text-sm text-left align-middle">
            <thead className="text-xs uppercase bg-navy-50 text-navy-500 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 border-b border-navy-100/50">Subject</th>
                <th className="px-4 py-3 border-b border-navy-100/50">Category Name</th>
                <th className="px-4 py-3 border-b border-navy-100/50">Slug (URL)</th>
                <th className="px-4 py-3 border-b border-navy-100/50">UUID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50 bg-white">
              {categories?.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-navy-600">
                    {(cat.subject as any)?.name || '-'}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-navy-900">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-navy-500/80">
                    /{cat.slug}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[10px] text-gray-400">
                    {cat.id}
                  </td>
                </tr>
              ))}
              {!categories?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-navy-400">
                    No categories generated. Have you run the seed data script?
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
