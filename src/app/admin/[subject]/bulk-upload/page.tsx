'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ROUTE_TO_PORTAL, getPortalDbSubjectSlug } from '@/config/admin-portals';
import { createClient } from '@/lib/supabase/client';
import { listMergedCategoriesForSubjectAdmin } from '@/app/admin/actions';
import BulkResourceUploader, { type ValidRow } from '@/components/admin/BulkResourceUploader';
import { bulkCreateResources } from './actions';
import { Upload, Loader2 } from 'lucide-react';

export default function BulkUploadPage() {
  const params = useParams();
  const portal = ROUTE_TO_PORTAL[params.subject as string];
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!portal) return;
    const supabase = createClient();

    async function load() {
      const { data: subject } = await supabase
        .from('subjects')
        .select('id')
        .eq('slug', getPortalDbSubjectSlug(portal))
        .single();

      if (!subject) { setLoading(false); return; }
      setSubjectId(subject.id);

      const res = await listMergedCategoriesForSubjectAdmin(subject.id);
      if (!res.ok) {
        setCategories([]);
      } else {
        setCategories(res.categories.map((c) => ({ slug: c.slug, name: c.name })));
      }
      setLoading(false);
    }
    load();
  }, [portal]);

  async function handleUpload(rows: ValidRow[]) {
    if (!subjectId) return { inserted: 0, errors: [{ row: 0, message: 'Subject not resolved' }] };
    return bulkCreateResources(rows, subjectId);
  }

  if (!portal) {
    return <p className="text-[var(--text-muted)] py-10 text-center">Unknown subject portal.</p>;
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
          <Upload className="w-6 h-6" style={{ color: portal.accentColor }} />
          Bulk Upload
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Upload multiple resources at once via CSV for {portal.label.replace(' Resources', '')}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p>No categories found. Create categories first before bulk uploading.</p>
        </div>
      ) : (
        <BulkResourceUploader
          subjectId={subjectId!}
          categories={categories}
          accentColor={portal.accentColor}
          onUpload={handleUpload}
        />
      )}

      {/* CSV Format Guide */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">CSV Format</h3>
        <pre className="text-xs font-mono text-[var(--text-muted)] overflow-x-auto whitespace-pre">
{`title,source_url,content_type,module_type,category_slug,sort_order
"Algebra Basics",https://www.youtube.com/watch?v=abc123,video,video_topical,grade-9,1
"2024 Paper 1",https://drive.google.com/file/d/xyz,pdf,solved_past_paper,grade-10,2`}
        </pre>
        <div className="mt-3 space-y-1">
          <p className="text-xs text-[var(--text-muted)]"><strong>content_type</strong>: video | pdf</p>
          <p className="text-xs text-[var(--text-muted)]"><strong>module_type</strong>: video_topical | solved_past_paper</p>
          <p className="text-xs text-[var(--text-muted)]"><strong>category_slug</strong>: Must match an existing category ({categories.map(c => c.slug).join(', ') || 'none yet'})</p>
          <p className="text-xs text-[var(--text-muted)]"><strong>sort_order</strong>: Optional, defaults to 0</p>
        </div>
      </div>
    </div>
  );
}
