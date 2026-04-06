'use client';

import { useState, useTransition, useMemo, useCallback } from 'react';
import { Trash2, ExternalLink, Plus, FileText, Video, FileSpreadsheet, Search, X } from 'lucide-react';
import { deleteCSResource, createCSResource } from './actions';
import { useToast } from '@/components/ui/Toast';
import { MODULE_TYPES, getModuleTypeLabel } from '@/config/taxonomy';
import HierarchyPicker, { type HierarchySelection } from '@/components/admin/HierarchyPicker';

// ── Interfaces ───────────────────────────────────────────────────────────────

interface Resource {
  id: string;
  title: string;
  content_type: string;
  source_type: string;
  source_url: string;
  topic: string | null;
  module_type?: string;
  is_published: boolean;
  created_at: string;
  category: { id: string; name: string; slug: string } | null;
}

const CONTENT_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  video: Video,
  worksheet: FileSpreadsheet,
};

// ── Main Component ───────────────────────────────────────────────────────────

export default function CSResourceTable({
  initialResources,
  subjectId,
}: {
  initialResources: Resource[];
  subjectId: string;
}) {
  const [resources, setResources] = useState(initialResources);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const filtered = useMemo(() => resources.filter(r => {
    if (filterModule !== 'all' && r.module_type !== filterModule) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.category?.name.toLowerCase().includes(q) ||
      r.topic?.toLowerCase().includes(q)
    );
  }), [resources, search, filterModule]);

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
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, category, or topic…"
            className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          )}
        </div>

        {/* Module type filter */}
        <select
          value={filterModule}
          onChange={e => setFilterModule(e.target.value)}
          className="px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Types</option>
          {MODULE_TYPES.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      {/* Stats bar */}
      <p className="text-xs text-[var(--text-muted)]">
        Showing {filtered.length} of {resources.length} resources
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No CS resources found.</p>
          <p className="text-xs mt-1">Upload your first resource to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)]">
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Category</th>
                <th className="pb-3 pr-4">Module</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map(r => {
                const Icon = CONTENT_ICONS[r.content_type] || FileText;
                const moduleLabel = getModuleTypeLabel(r.module_type || '');
                return (
                  <tr key={r.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="py-3 pr-4">
                      <Icon className="w-4 h-4 text-indigo-500" />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-[var(--text-primary)] truncate max-w-xs">{r.title}</div>
                      {r.topic && <div className="text-xs text-[var(--text-muted)]">{r.topic}</div>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-400">
                        {r.category?.name || '—'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.module_type === 'solved_past_paper'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {moduleLabel}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[var(--text-muted)] text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[var(--text-muted)] hover:text-indigo-600 transition"
                          title="Open source"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(r.id, r.title)}
                          disabled={isPending}
                          className="p-1.5 text-[var(--text-muted)] hover:text-red-600 transition disabled:opacity-50"
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

      {/* Upload Modal — uses shared HierarchyPicker */}
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

// ── Upload Modal (uses HierarchyPicker) ──────────────────────────────────────

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

  // Form fields
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<'video' | 'pdf'>('video');

  // HierarchyPicker output
  const [selection, setSelection] = useState<HierarchySelection | null>(null);

  const handleHierarchyChange = useCallback((s: HierarchySelection) => {
    setSelection(s);
  }, []);

  const sourceType = sourceUrl.includes('youtu') ? 'youtube' : 'google_drive';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !sourceUrl.trim()) {
      showToast({ message: 'Title and Source URL are required.', type: 'error' });
      return;
    }
    if (!selection?.categoryId) {
      showToast({ message: 'Please select a category.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await createCSResource({
        title: title.trim(),
        content_type: contentType,
        source_type: sourceType,
        source_url: sourceUrl.trim(),
        topic: topic.trim() || undefined,
        category_id: selection.categoryId,
        module_type: selection.moduleType,
      });

      if (result.success) {
        showToast({ message: 'Resource created!', type: 'success' });
        onSuccess({
          id: crypto.randomUUID(),
          title: title.trim(),
          content_type: contentType,
          source_type: sourceType,
          source_url: sourceUrl.trim(),
          topic: topic.trim() || null,
          module_type: selection.moduleType,
          is_published: true,
          created_at: new Date().toISOString(),
          category: null,
        });
      } else {
        showToast({ message: result.error || 'Failed to create.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm";
  const labelClass = "block text-sm font-medium text-[var(--text-secondary)] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] bg-indigo-500/10">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Add CS Resource</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">O Level (0478) &middot; A Level (9618)</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className={labelClass}>Title *</label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inputClass}
              placeholder="e.g. Binary Search Algorithm — Part 1"
            />
          </div>

          {/* HierarchyPicker — handles Level, Grade/Section/Paper, Module Type, Category */}
          <HierarchyPicker
            subjectId={subjectId}
            subjectSlug="computer-science-0478"
            onChange={handleHierarchyChange}
            accentColor="#6366F1"
          />

          {/* Content Type */}
          <div>
            <label className={labelClass}>Content Type</label>
            <select
              value={contentType}
              onChange={e => setContentType(e.target.value as 'video' | 'pdf')}
              className={inputClass}
            >
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          {/* Source URL */}
          <div>
            <label className={labelClass}>Source URL *</label>
            <input
              required
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder={contentType === 'video' ? 'https://www.youtube.com/watch?v=...' : 'https://drive.google.com/file/d/...'}
            />
          </div>

          {/* Topic */}
          <div>
            <label className={labelClass}>Topic (optional)</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className={inputClass}
              placeholder="e.g. Algorithms, Data Structures, Networking"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? 'Creating…' : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
