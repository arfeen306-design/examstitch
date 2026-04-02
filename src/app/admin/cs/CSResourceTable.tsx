'use client';

import { useState, useTransition } from 'react';
import { Trash2, ExternalLink, Plus, FileText, Video, FileSpreadsheet, Search, X } from 'lucide-react';
import { deleteCSResource, createCSResource } from './actions';
import { useToast } from '@/components/ui/Toast';

interface Resource {
  id: string;
  title: string;
  content_type: string;
  source_type: string;
  source_url: string;
  topic: string | null;
  is_published: boolean;
  created_at: string;
  category: { id: string; name: string; slug: string } | null;
}

const CONTENT_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  worksheet: FileSpreadsheet,
};

export default function CSResourceTable({
  initialResources,
  subjectId,
}: {
  initialResources: Resource[];
  subjectId: string;
}) {
  const [resources, setResources] = useState(initialResources);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const filtered = resources.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.category?.name.toLowerCase().includes(search.toLowerCase()) ||
    r.topic?.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteCSResource(id);
      if (result.success) {
        setResources(prev => prev.filter(r => r.id !== id));
        showToast({ message: 'Resource deleted.', type: 'success' });
      } else {
        showToast({ message: result.error || 'Delete failed.', type: 'error' });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, category, or topic…"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {/* Stats bar */}
      <p className="text-xs text-gray-500">
        Showing {filtered.length} of {resources.length} resources
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No CS resources found.</p>
          <p className="text-xs mt-1">Upload your first resource to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => {
                const Icon = CONTENT_ICONS[r.content_type] || FileText;
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 pr-4">
                      <Icon className="w-4 h-4 text-indigo-500" />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900 truncate max-w-xs">{r.title}</div>
                      {r.topic && <div className="text-xs text-gray-400">{r.topic}</div>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {r.category?.name || '—'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-indigo-600 transition"
                          title="Open source"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(r.id, r.title)}
                          disabled={isPending}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <CSUploadModal
          subjectId={subjectId}
          onClose={() => setShowUpload(false)}
          onSuccess={(newResource) => {
            setResources(prev => [newResource, ...prev]);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}

// ── Inline Upload Modal ────────────────────────────────────────────────────────

function CSUploadModal({
  subjectId,
  onClose,
  onSuccess,
}: {
  subjectId: string;
  onClose: () => void;
  onSuccess: (r: Resource) => void;
}) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content_type: 'pdf',
    source_type: 'google_drive',
    source_url: '',
    topic: '',
    category_id: '',
  });

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Load CS categories on mount
  useState(() => {
    fetch(`/api/admin/cs/resources`)
      .then(res => res.json())
      .then(() => {
        // Fetch categories separately
        import('@supabase/ssr').then(({ createBrowserClient }) => {
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          );
          supabase.from('categories').select('id, name').then(({ data }) => {
            if (data) setCategories(data);
          });
        });
      })
      .catch(() => {});
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.source_url.trim() || !form.category_id) {
      showToast({ message: 'Please fill all required fields.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const result = await createCSResource(form);
      if (result.success) {
        showToast({ message: 'Resource created!', type: 'success' });
        // Return a synthetic resource for optimistic UI
        onSuccess({
          id: crypto.randomUUID(),
          title: form.title,
          content_type: form.content_type,
          source_type: form.source_type,
          source_url: form.source_url,
          topic: form.topic || null,
          is_published: true,
          created_at: new Date().toISOString(),
          category: categories.find(c => c.id === form.category_id)
            ? { id: form.category_id, name: categories.find(c => c.id === form.category_id)!.name, slug: '' }
            : null,
        });
      } else {
        showToast({ message: result.error || 'Failed to create.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-indigo-50/50">
          <h2 className="text-xl font-semibold text-gray-900">Add CS Resource</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Binary Search Algorithm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select
                value={form.content_type}
                onChange={e => setForm({ ...form, content_type: e.target.value, source_type: e.target.value === 'video' ? 'youtube' : 'google_drive' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="worksheet">Worksheet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                required
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="" disabled>Select…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source URL *</label>
            <input
              required
              value={form.source_url}
              onChange={e => setForm({ ...form, source_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={form.content_type === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://drive.google.com/file/d/...'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic (optional)</label>
            <input
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g. Algorithms"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? 'Creating…' : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
