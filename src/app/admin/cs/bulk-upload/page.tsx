'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import BulkResourceUploader, { type ValidRow } from '@/components/admin/BulkResourceUploader';
import { bulkCreateResources } from '@/app/admin/[subject]/bulk-upload/actions';
import { Upload, Loader2 } from 'lucide-react';

export default function CSBulkUploadPage() {
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: subject } = await supabase
        .from('subjects')
        .select('id')
        .eq('slug', 'computer-science')
        .single();

      if (!subject) { setLoading(false); return; }
      setSubjectId(subject.id);

      const { data: cats } = await supabase
        .from('categories')
        .select('slug, name')
        .eq('subject_id', subject.id)
        .order('sort_order');

      setCategories(cats ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleUpload(rows: ValidRow[]) {
    if (!subjectId) return { inserted: 0, errors: [{ row: 0, message: 'Subject not resolved' }] };
    return bulkCreateResources(rows, subjectId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
          <Upload className="w-6 h-6 text-indigo-400" />
          CS Bulk Upload
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Upload multiple Computer Science resources at once via CSV
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p>No categories found. Create categories first.</p>
        </div>
      ) : (
        <BulkResourceUploader
          subjectId={subjectId!}
          categories={categories}
          accentColor="#6366F1"
          onUpload={handleUpload}
        />
      )}

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">CSV Format</h3>
        <pre className="text-xs font-mono text-[var(--text-muted)] overflow-x-auto whitespace-pre">
{`title,source_url,content_type,module_type,category_slug,sort_order
"Binary Search",https://www.youtube.com/watch?v=abc,video,video_topical,algorithms,1
"2024 P1 Solution",https://drive.google.com/file/d/xyz,pdf,solved_past_paper,paper-1,2`}
        </pre>
      </div>
    </div>
  );
}
