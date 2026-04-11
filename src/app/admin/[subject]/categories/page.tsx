'use client';

import { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Pencil, Trash2, X, Check, FolderOpen, Loader2 } from 'lucide-react';
import {
  createSubjectCategory,
  renameCategory,
  deleteSubjectCategory,
  seedPortalDefaultCategories,
} from './actions';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { ROUTE_TO_PORTAL, getPortalDbSubjectSlug } from '@/config/admin-portals';
import { listMergedCategoriesForSubjectAdmin } from '@/app/admin/actions';
import { oLevelGrades, aLevelPapersBySubject } from '@/config/navigation';
import { PARENT_SUBJECT_SLUG_TO_ALEVEL_NAV_KEY, A_LEVEL_SECTION_SLUGS } from '@/lib/category-slug-policy';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number | null;
  resource_count: number;
}

export default function CategoriesPage() {
  const params = useParams();
  const portalRouteSegment = params.subject as string;
  const portal = ROUTE_TO_PORTAL[portalRouteSegment];
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
  const addCategoryButtonRef = useRef<HTMLButtonElement>(null);
  const [seeding, setSeeding] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!portal) return;
    setLoading(true);
    const supabase = createClient();

    const { data: subject } = await supabase
      .from('subjects')
      .select('id')
      .eq('slug', getPortalDbSubjectSlug(portal))
      .single();

    if (!subject) {
      setSubjectId(null);
      setCategories([]);
      setLoading(false);
      return;
    }
    setSubjectId(subject.id);

    const merged = await listMergedCategoriesForSubjectAdmin(subject.id);
    if (!merged.ok) {
      showToast({ message: `Could not load categories: ${merged.error}`, type: 'error' });
      setCategories([]);
      setLoading(false);
      return;
    }
    const cats = merged.categories;
    if (!cats.length) {
      setCategories([]);
      setLoading(false);
      return;
    }

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
  }, [portal, showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
        setFormName('');
        setFormSlug('');
        setShowForm(false);
        setFormParentId(null);
        await loadCategories();
        requestAnimationFrame(() => addCategoryButtonRef.current?.focus());
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

  function handleSeedDefaults() {
    startTransition(async () => {
      setSeeding(true);
      try {
        const result = await seedPortalDefaultCategories(portalRouteSegment);
        if (result.success) {
          showToast({
            message:
              result.categoriesCreated > 0
                ? `Added or updated ${result.categoriesCreated} category folder(s).`
                : 'Category tree is already up to date.',
            type: 'success',
          });
          await loadCategories();
        } else {
          showToast({ message: result.error, type: 'error' });
        }
      } finally {
        setSeeding(false);
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
  /** Only AS/A2 roots may have children (public URL policy); O-Level grades stay top-level. */
  const paperSectionParents = categories.filter(
    c => !c.parent_id && (c.slug === 'as-level' || c.slug === 'a2-level'),
  );
  const disciplineSlug = getPortalDbSubjectSlug(portal);
  const alevelNavKey = PARENT_SUBJECT_SLUG_TO_ALEVEL_NAV_KEY[disciplineSlug] ?? null;
  const alevelPaperConfig = alevelNavKey ? aLevelPapersBySubject[alevelNavKey] : null;
  const selectedParent = categories.find(c => c.id === formParentId);
  const selectedParentSection =
    selectedParent && A_LEVEL_SECTION_SLUGS.has(selectedParent.slug)
      ? (selectedParent.slug as 'as-level' | 'a2-level')
      : null;
  const allowedPaperSlugsForParent =
    alevelPaperConfig && selectedParentSection ? alevelPaperConfig[selectedParentSection] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Categories</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{categories.length} categories for {portal.label.replace(' Resources', '')}</p>
        </div>
        <button
          ref={addCategoryButtonRef}
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ backgroundColor: `${portal.accentColor}20`, color: portal.accentColor }}
        >
          <Plus className="w-4 h-4" aria-hidden />
          Add Category
        </button>
      </div>

      <div
        className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-secondary)] leading-relaxed space-y-3"
        role="region"
        aria-label="How categories map to the public site"
      >
        <p>
          <strong className="text-[var(--text-primary)]">O-Level and A-Level are not a dropdown here.</strong>{' '}
          They are <strong className="text-[var(--text-primary)]">category slugs</strong> that must match the live
          course URLs (same names as on the public site).
        </p>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={seeding || isPending}
            onClick={handleSeedDefaults}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50 w-fit"
            style={{ backgroundColor: portal.accentColor }}
          >
            {seeding ? 'Seeding…' : 'Create default O-Level & A-Level folders'}
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            Adds Grade 9–11, AS Level, A2 Level, and the correct paper rows for this subject (safe to run again).
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          If you add categories manually: top-level slugs must be{' '}
          <code className="text-[var(--text-secondary)]">{oLevelGrades.map(g => g.slug).join(', ')}</code>
          {portal.hasALevelSyllabus !== false && alevelNavKey ? (
            <>
              {' '}
              or <code className="text-[var(--text-secondary)]">as-level</code>,{' '}
              <code className="text-[var(--text-secondary)]">a2-level</code>. Paper rows must use the exact slugs
              below (not plain &quot;paper-1&quot;).
            </>
          ) : (
            <>.</>
          )}
        </p>
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
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Parent (A-Level papers only)</label>
            <select value={formParentId ?? ''} onChange={e => setFormParentId(e.target.value || null)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)]">
              <option value="">None — top-level (O-Level grades or AS/A2 roots)</option>
              {paperSectionParents.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              O-Level uses flat grades only (no parent). A-Level papers go under <strong className="font-normal text-[var(--text-secondary)]">AS Level</strong> or{' '}
              <strong className="font-normal text-[var(--text-secondary)]">A2 Level</strong> after those rows exist (use the seed button above if the list is empty).
            </p>
          </div>
          {allowedPaperSlugsForParent.length > 0 && (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-3 text-xs">
              <p className="font-medium text-[var(--text-primary)] mb-2">Allowed paper slugs for this parent</p>
              <ul className="space-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
                {allowedPaperSlugsForParent.map((p) => (
                  <li key={p.slug}>
                    <span className="text-[var(--text-muted)]">{p.label}</span> — <span className="text-amber-200/90">{p.slug}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
