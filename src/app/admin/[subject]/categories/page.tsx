'use client';

import { useState, useTransition, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Pencil, Trash2, X, Check, FolderOpen, Loader2 } from 'lucide-react';
import { createSubjectCategory, renameCategory, deleteSubjectCategory } from './actions';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { ROUTE_TO_PORTAL, getPortalDbSubjectSlug } from '@/config/admin-portals';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  resource_count: number;
}

export default function CategoriesPage() {
  const params = useParams();
  const portal = ROUTE_TO_PORTAL[params.subject as string];
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formParentId, setFormParentId] = useState<string | null>(null);

  // Inline rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (!portal) return;
    const supabase = createClient();

    async function load() {
      // Get subject_id
      const { data: subject } = await supabase
        .from('subjects')
        .select('id')
        .eq('slug', getPortalDbSubjectSlug(portal))
        .single();

      if (!subject) { setLoading(false); return; }
      setSubjectId(subject.id);

      // Get categories with resource counts
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id, sort_order')
        .eq('subject_id', subject.id)
        .order('sort_order', { ascending: true });

      if (!cats) { setLoading(false); return; }

      // Count resources per category
      const withCounts: CategoryRow[] = await Promise.all(
        cats.map(async (cat) => {
          const { count } = await supabase
            .from('resources')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', cat.id);
          return { ...cat, resource_count: count ?? 0 };
        })
      );

      setCategories(withCounts);
      setLoading(false);
    }

    load();
  }, [portal]);

  function autoSlug(name: string) {
    setFormName(name);
    setFormSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId) return;
    startTransition(async () => {
      const result = await createSubjectCategory({
        name: formName,
        slug: formSlug,
        subject_id: subjectId,
        parent_id: formParentId,
      });
      if (result.success) {
        showToast({ message: 'Category created!', type: 'success' });
        setFormName(''); setFormSlug(''); setShowForm(false); setFormParentId(null);
        window.location.reload();
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  }

  function handleRename(catId: string) {
    startTransition(async () => {
      const result = await renameCategory(catId, renameValue);
      if (result.success) {
        setCategories(prev => prev.map(c => c.id === catId ? { ...c, name: renameValue } : c));
        setRenamingId(null);
        showToast({ message: 'Renamed!', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  }

  function handleDelete(cat: CategoryRow) {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteSubjectCategory(cat.id);
      if (result.success) {
        setCategories(prev => prev.filter(c => c.id !== cat.id));
        showToast({ message: 'Category deleted.', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed', type: 'error' });
      }
    });
  }

  if (!portal) return <p className="text-[var(--text-muted)] py-10 text-center">Unknown subject portal.</p>;

  // Group: top-level and children
  const topLevel = categories.filter(c => !c.parent_id);
  const children = categories.filter(c => c.parent_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Categories</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{categories.length} categories for {portal.label.replace(' Resources', '')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition"
          style={{ backgroundColor: `${portal.accentColor}20`, color: portal.accentColor }}
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="p-4 rounded-xl border-2 border-dashed space-y-3"
          style={{ borderColor: `${portal.accentColor}30`, backgroundColor: `${portal.accentColor}05` }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Name *</label>
              <input required value={formName} onChange={e => autoSlug(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)]"
                placeholder="e.g. Grade 9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Slug</label>
              <input required value={formSlug} onChange={e => setFormSlug(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm font-mono bg-[var(--bg-card)] text-[var(--text-primary)]"
                placeholder="grade-9" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Parent Category (optional)</label>
            <select value={formParentId ?? ''} onChange={e => setFormParentId(e.target.value || null)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)]">
              <option value="">None (top-level)</option>
              {topLevel.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-[var(--text-muted)]">Cancel</button>
            <button type="submit" disabled={isPending}
              className="px-4 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: portal.accentColor }}>
              {isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
        </div>
      )}

      {/* Category list */}
      {!loading && categories.length === 0 && (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No categories yet. Create one above.</p>
        </div>
      )}

      {!loading && topLevel.map(cat => {
        const catChildren = children.filter(c => c.parent_id === cat.id);
        return (
          <div key={cat.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
            {/* Top-level category */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FolderOpen className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                {renamingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                      className="px-2 py-1 text-sm border border-[var(--border-color)] rounded bg-[var(--bg-card)] text-[var(--text-primary)] flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleRename(cat.id)} />
                    <button onClick={() => handleRename(cat.id)} disabled={isPending}><Check className="w-4 h-4 text-green-400" /></button>
                    <button onClick={() => setRenamingId(null)}><X className="w-4 h-4 text-[var(--text-muted)]" /></button>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{cat.name}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">{cat.slug}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[var(--text-muted)] px-2 py-0.5 rounded-full bg-[var(--bg-surface)]">
                  {cat.resource_count} resources
                </span>
                <button onClick={() => { setRenamingId(cat.id); setRenameValue(cat.name); }}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition" title="Rename">
                  <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
                <button onClick={() => handleDelete(cat)} disabled={isPending}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 transition" title="Delete">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>

            {/* Children */}
            {catChildren.length > 0 && (
              <div className="border-t border-[var(--border-subtle)]">
                {catChildren.map(child => (
                  <div key={child.id} className="flex items-center justify-between px-4 py-2.5 pl-10 hover:bg-[var(--bg-surface)] transition">
                    <div className="min-w-0 flex-1">
                      {renamingId === child.id ? (
                        <div className="flex items-center gap-2">
                          <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                            className="px-2 py-1 text-sm border border-[var(--border-color)] rounded bg-[var(--bg-card)] text-[var(--text-primary)] flex-1"
                            onKeyDown={e => e.key === 'Enter' && handleRename(child.id)} />
                          <button onClick={() => handleRename(child.id)} disabled={isPending}><Check className="w-3.5 h-3.5 text-green-400" /></button>
                          <button onClick={() => setRenamingId(null)}><X className="w-3.5 h-3.5 text-[var(--text-muted)]" /></button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-[var(--text-secondary)]">{child.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{child.slug}</p>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[var(--text-muted)]">{child.resource_count}</span>
                      <button onClick={() => { setRenamingId(child.id); setRenameValue(child.name); }}
                        className="p-1 rounded hover:bg-[var(--bg-surface)] transition">
                        <Pencil className="w-3 h-3 text-[var(--text-muted)]" />
                      </button>
                      <button onClick={() => handleDelete(child)} disabled={isPending}
                        className="p-1 rounded hover:bg-red-500/10 transition">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
