'use client';

import { Fragment, useMemo, useState, useTransition, useRef } from 'react';
import { toggleResourceFlag, deleteResource, updateResource, bulkInsertResources } from '../../actions';
import {
  Plus, Trash2, Pencil, X, Check, ExternalLink, ListPlus,
  FolderOpen, FileVideo, FileText, ChevronRight, ChevronDown, Clock, Lock,
} from 'lucide-react';
import NewResourceModal from './NewResourceModal';
import { useToast } from '@/components/ui/Toast';
import { MODULE_TYPES } from '@/lib/constants';
import { getSubjectLabel } from '@/config/navigation';
import {
  type AdminResourceRow,
  buildSyllabusModuleTopicHierarchy,
  filterResourcesBySyllabusSlug,
  getBaseTitle,
} from '@/lib/admin/resource-admin-hierarchy';

type Resource = AdminResourceRow;

interface EditState {
  title: string;
  videoUrl: string;
  worksheetUrl: string;
  contentType: string;
  sortOrder: string;
}

interface SubtopicState {
  parentId: string;
  title: string;
  videoUrl: string;
  worksheetUrl: string;
}

// Glass field chrome — Professional Scholar / navy dashboard
const ADMIN_TABLE_INPUT =
  'bg-slate-900/40 backdrop-blur-md text-slate-100 caret-slate-100 placeholder:text-slate-500 ' +
  'border border-slate-600/50 shadow-inner ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:border-amber-500/40';

/** Gold-bordered ghost buttons — Professional Scholar */
const SCHOLAR_LINK =
  'inline-flex items-center gap-1 rounded-md border border-amber-500/55 bg-transparent px-2 py-0.5 text-[11px] font-semibold ' +
  'text-amber-400/95 hover:bg-amber-500/10 hover:border-amber-400/80 hover:shadow-[0_0_14px_rgba(245,158,11,0.12)] transition';

// ─────────────────────────────────────────────────────────────────────────────
// Inline edit form
// ─────────────────────────────────────────────────────────────────────────────

function EditForm({
  state,
  onChange,
}: {
  state: EditState;
  onChange: (s: EditState) => void;
}) {
  return (
    <div className="space-y-1.5">
      <input
        value={state.title}
        onChange={e => onChange({ ...state, title: e.target.value })}
        className={`w-full px-2 py-1.5 text-sm rounded-md ${ADMIN_TABLE_INPUT} focus-visible:ring-amber-500`}
        placeholder="Title"
      />
      <div className="relative">
        <span className="absolute left-2 top-2 text-[10px] font-bold text-red-600 dark:text-red-400 z-[1] pointer-events-none" aria-hidden>YT</span>
        <input value={state.videoUrl} onChange={e => onChange({ ...state, videoUrl: e.target.value })}
          className={`w-full pl-7 pr-2 py-1.5 text-xs font-mono rounded-md ${ADMIN_TABLE_INPUT} focus-visible:ring-red-500`}
          placeholder="YouTube URL" />
      </div>
      <div className="relative">
        <span className="absolute left-2 top-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 z-[1] pointer-events-none" aria-hidden>PDF</span>
        <input value={state.worksheetUrl} onChange={e => onChange({ ...state, worksheetUrl: e.target.value })}
          className={`w-full pl-8 pr-2 py-1.5 text-xs font-mono rounded-md ${ADMIN_TABLE_INPUT} focus-visible:ring-emerald-600`}
          placeholder="Drive or Supabase PDF URL (optional)" />
      </div>
      <div className="relative">
        <span className="absolute left-2 top-2 text-[10px] font-bold text-violet-700 dark:text-violet-400 z-[1] pointer-events-none" aria-hidden>#</span>
        <input type="number" min="0" value={state.sortOrder}
          onChange={e => onChange({ ...state, sortOrder: e.target.value })}
          className={`w-full pl-6 pr-2 py-1.5 text-xs rounded-md ${ADMIN_TABLE_INPUT} focus-visible:ring-violet-500`}
          placeholder="Sort order (0 = first)" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ResourceGridClient({ initialResources }: { initialResources: Resource[] }) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [filterSyllabus, setFilterSyllabus] = useState<string>('all');
  const [filterModuleType, setFilterModuleType] = useState<string>('all');
  const [collapsedSyllabi, setCollapsedSyllabi] = useState<Set<string>>(new Set());
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const newResourceButtonRef = useRef<HTMLButtonElement>(null);
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ title: '', videoUrl: '', worksheetUrl: '', contentType: 'video', sortOrder: '' });

  const [subtopicParentId, setSubtopicParentId] = useState<string | null>(null);
  const [subtopicState, setSubtopicState] = useState<SubtopicState>({ parentId: '', title: '', videoUrl: '', worksheetUrl: '' });

  // Timestamp mapping editor state
  const [mappingEditId, setMappingEditId] = useState<string | null>(null);
  const [mappingDraft, setMappingDraft] = useState<any[]>([]);

  const openTimestampEditor = (r: Resource) => {
    setMappingEditId(r.id);
    setMappingDraft(r.question_mapping || [
      { question: 1, label: 'Q1', start_time: 0, parts: [] },
    ]);
  };

  const cancelTimestampEditor = () => setMappingEditId(null);

  const saveTimestamps = (resourceId: string) => {
    startTransition(async () => {
      try {
        const clean = mappingDraft.filter((q: any) => q.label);
        const result = await updateResource(resourceId, { question_mapping: clean.length > 0 ? clean : null });
        if (result.success) {
          setResources(prev => prev.map(r => r.id === resourceId ? { ...r, question_mapping: clean.length > 0 ? clean : null } : r));
          showToast({ message: 'Timestamps saved!', type: 'success' });
          setMappingEditId(null);
        } else {
          showToast({ message: result.error || 'Failed to save timestamps', type: 'error' });
        }
      } catch (err: unknown) {
        showToast({ message: 'Save failed: ' + (err instanceof Error ? err.message : String(err)), type: 'error' });
      }
    });
  };

  // ── Filtering & hierarchy (syllabus → module → parent/child topics) ───────

  const syllabusSlugsInData = useMemo(() => {
    const s = new Set<string>();
    for (const r of resources) {
      const slug = r.category?.syllabus?.slug;
      if (slug) s.add(slug);
      const tier = r.category?.syllabus_tier?.tier;
      if (tier === 'olevel') s.add('tier:olevel');
      if (tier === 'alevel') s.add('tier:alevel');
    }
    return [...s].sort();
  }, [resources]);

  const filtered = useMemo(() => {
    let rows = filterResourcesBySyllabusSlug(resources, filterSyllabus);
    if (filterModuleType !== 'all') {
      rows = rows.filter(r => r.module_type === filterModuleType);
    }
    return rows;
  }, [resources, filterSyllabus, filterModuleType]);

  const syllabusBuckets = useMemo(
    () => buildSyllabusModuleTopicHierarchy(filtered),
    [filtered],
  );

  const moduleCollapseKey = (syllabusSlug: string, categoryId: string) => `${syllabusSlug}::${categoryId}`;

  const toggleSyllabusCollapsed = (slug: string) => {
    setCollapsedSyllabi(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const toggleModuleCollapsed = (key: string) => {
    setCollapsedModules(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Toggle flags ───────────────────────────────────────────────────────────

  const handleToggle = (id: string, field: 'is_published' | 'is_locked' | 'is_watermarked', current: boolean) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, [field]: !current } : r));
    startTransition(async () => {
      const { success } = await toggleResourceFlag(id, field, !current);
      if (!success) {
        setResources(prev => prev.map(r => r.id === id ? { ...r, [field]: current } : r));
        showToast({ message: `Failed to update ${field}`, type: 'error' });
      }
    });
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        const result = await deleteResource(id);
        if (result.success) {
          setResources(prev => prev.filter(r => r.id !== id));
          showToast({ message: 'Resource deleted', type: 'success' });
        } else showToast({ message: result.error || 'Delete failed', type: 'error' });
      } catch (err: unknown) {
        showToast({ message: 'Delete failed: ' + (err instanceof Error ? err.message : String(err)), type: 'error' });
      }
    });
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const startEdit = (r: Resource) => {
    setEditingId(r.id);
    setEditState({
      title: r.title,
      videoUrl: r.content_type === 'video' ? (r.source_url || '') : '',
      worksheetUrl: r.worksheet_url || '',
      contentType: r.content_type,
      sortOrder: r.sort_order != null ? String(r.sort_order) : '',
    });
  };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id: string) => {
    startTransition(async () => {
      try {
        const original = resources.find(r => r.id === id);
        if (!original) return;
        const updates: Record<string, unknown> = {};
        if (editState.title !== original.title) updates.title = editState.title;
        if (editState.videoUrl !== (original.source_url || '')) updates.source_url = editState.videoUrl;
        if (editState.worksheetUrl !== (original.worksheet_url || '')) updates.worksheet_url = editState.worksheetUrl || null;
        if (editState.contentType !== original.content_type) updates.content_type = editState.contentType;
        const newOrder = editState.sortOrder !== '' ? parseInt(editState.sortOrder, 10) : null;
        if (newOrder !== (original.sort_order ?? null)) updates.sort_order = newOrder;
        if (Object.keys(updates).length === 0) { cancelEdit(); return; }

        const result = await updateResource(id, updates as Parameters<typeof updateResource>[1]);
        if (result.success) {
          setResources(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
          showToast({ message: 'Updated!', type: 'success' });
          cancelEdit();
        } else showToast({ message: result.error || 'Failed to update', type: 'error' });
      } catch (err: unknown) {
        showToast({ message: 'Update failed: ' + (err instanceof Error ? err.message : String(err)), type: 'error' });
      }
    });
  };

  // ── Sub-topic ──────────────────────────────────────────────────────────────

  const openSubtopic = (r: Resource) => {
    const base = getBaseTitle(r.title);
    const existingChildren = resources.filter(x => x.parent_resource_id === r.id).length;
    setSubtopicParentId(r.id);
    setSubtopicState({
      parentId: r.id,
      title: `${base} — Part ${existingChildren + 2}`,
      videoUrl: '',
      worksheetUrl: '',
    });
  };
  const cancelSubtopic = () => setSubtopicParentId(null);

  const saveSubtopic = (parent: Resource) => {
    if (!subtopicState.videoUrl && !subtopicState.worksheetUrl) {
      showToast({ message: 'Provide at least a video or worksheet URL.', type: 'error' });
      return;
    }
    const subjectId = parent.subject_id ?? parent.category?.subject_id ?? null;
    if (!subjectId) {
      showToast({
        message: 'Cannot save: this row has no subject link. Edit the parent resource or re-assign its category.',
        type: 'error',
      });
      return;
    }
    const categoryId = parent.category?.id;
    if (!categoryId) {
      showToast({
        message: 'Cannot save: parent has no category. Assign a module/category first.',
        type: 'error',
      });
      return;
    }
    startTransition(async () => {
      try {
        const syllabusId = parent.syllabus_id ?? parent.category?.syllabus_id ?? null;
        const payload = {
          title: subtopicState.title,
          subject: parent.subject,
          subject_id: subjectId,
          category_id: categoryId,
          syllabus_id: syllabusId ?? undefined,
          parent_resource_id: parent.id,
          source_url: subtopicState.videoUrl || subtopicState.worksheetUrl,
          worksheet_url: subtopicState.worksheetUrl || null,
          source_type: subtopicState.videoUrl.includes('youtu') ? 'youtube' : 'google_drive',
          content_type: subtopicState.videoUrl ? 'video' : 'pdf',
          module_type: MODULE_TYPES.VIDEO_TOPICAL,
          is_published: true,
          is_locked: false,
          is_watermarked: false,
        };
        const result = await bulkInsertResources([payload]);
        if (result.success) {
          showToast({ message: 'Sub-topic added!', type: 'success' });
          cancelSubtopic();
          window.location.reload();
        } else showToast({ message: result.error || 'Failed to add sub-topic', type: 'error' });
      } catch (err: unknown) {
        showToast({ message: 'Failed: ' + (err instanceof Error ? err.message : String(err)), type: 'error' });
      }
    });
  };

  // ── Render a single resource row ───────────────────────────────────────────

  const renderRow = (
    r: Resource,
    topicIndex: number,
    /** null = root row in a topic cluster; else 1-based child ordinal */
    childOrdinal: number | null,
    totalParts: number,
    rootId: string,
  ) => {
    const isSub = childOrdinal !== null || (Boolean(r.parent_resource_id) && r.id !== rootId);
    const label =
      childOrdinal === null
        ? `${topicIndex + 1}`
        : `${topicIndex + 1}.${childOrdinal}`;

    const baseTitle = getBaseTitle(r.title);
    const partSuffix = isSub
      ? r.title.replace(baseTitle, '').replace(/^[\s—–-]+/, '').trim() || (childOrdinal != null ? `Part ${childOrdinal}` : 'Part')
      : '';
    const subLabel = isSub ? baseTitle : r.title;

    return (
      <>
        {/* Resource row */}
        <tr
          key={r.id}
          className={`transition-colors group
            ${editingId === r.id ? 'bg-gold-500/10' : isSub ? 'bg-blue-500/10 hover:bg-blue-500/15' : 'hover:bg-[var(--bg-elevated)] dark:hover:bg-[var(--bg-elevated)]'}
            ${isSub ? 'border-l-4 border-blue-500/30' : ''}`}
        >
          {/* # Order column */}
          <td className="w-12 px-3 py-2.5 text-center">
            <span className={`inline-block text-xs font-bold tabular-nums rounded px-1.5 py-0.5
              ${isSub ? 'text-blue-400 bg-blue-500/20' : 'text-[var(--text-secondary)] bg-[var(--border-subtle)]'}`}>
              {label}
            </span>
          </td>

          {/* Title / Links column — no max-width cap so it takes remaining space */}
          <td className={`py-2.5 font-medium min-w-[180px] ${isSub ? 'pl-8 pr-4' : 'px-4'}`}
              style={{ color: 'var(--text-primary)' }}>
            {editingId === r.id ? (
              <EditForm state={editState} onChange={setEditState} />
            ) : (
              <div className="flex items-start gap-2 min-w-0">
                {/* Icon: folder (parent with children) or file */}
                {isSub ? (
                  <span className="shrink-0 text-blue-400 mt-0.5">
                    <ChevronRight className="w-3 h-3" />
                  </span>
                ) : totalParts > 1 ? (
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 text-gold-500 mt-0.5" />
                ) : (
                  r.content_type === 'video'
                    ? <FileVideo className="w-3.5 h-3.5 shrink-0 text-red-400 mt-0.5" />
                    : <FileText className="w-3.5 h-3.5 shrink-0 text-green-500 mt-0.5" />
                )}
                <div className="min-w-0">
                  <span className="truncate block text-sm" title={r.title}>
                    {subLabel}
                    {isSub && partSuffix && (
                      <span className="text-[10px] font-normal text-blue-400 ml-1.5">
                        — {partSuffix}
                      </span>
                    )}
                  </span>
                  <div className="flex gap-1.5 mt-1 flex-wrap items-center">
                    {r.source_url && <span className="text-[10px] font-semibold text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded">YT</span>}
                    {r.worksheet_url && <span className="text-[10px] font-semibold text-green-400 bg-green-500/15 px-1.5 py-0.5 rounded">PDF</span>}
                    {r.source_url && r.content_type === 'video' && (
                      <a href={r.source_url} target="_blank" rel="noreferrer" className={SCHOLAR_LINK}>
                        Watch video
                      </a>
                    )}
                    {r.worksheet_url && (
                      <a href={r.worksheet_url} target="_blank" rel="noreferrer" className={SCHOLAR_LINK}>
                        Worksheet
                      </a>
                    )}
                    {r.is_locked && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-400 bg-orange-500/15 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                    {totalParts > 1 && !isSub && (
                      <span className="text-[10px] text-[var(--text-muted)]">{totalParts} parts</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </td>

          {/* Sort order (editable inline without needing full-edit mode) */}
          <td className="w-16 px-2 py-2.5 text-center">
            {editingId === r.id ? null : (
              <input
                type="number"
                min="0"
                defaultValue={r.sort_order ?? ''}
                onBlur={async e => {
                  const val = e.target.value !== '' ? parseInt(e.target.value, 10) : null;
                  if (val === (r.sort_order ?? null)) return;
                  const result = await updateResource(r.id, { sort_order: val });
                  if (result.success) {
                    setResources(prev => prev.map(x => x.id === r.id ? { ...x, sort_order: val } : x));
                    showToast({ message: 'Order saved', type: 'success' });
                  }
                }}
                className={`w-14 text-center text-xs rounded-md px-1 py-1.5 ${ADMIN_TABLE_INPUT} focus-visible:ring-violet-500 hover:border-violet-500/60 transition`}
                placeholder="—"
                title="Sort order — lower = first"
              />
            )}
          </td>

          {/* Type */}
          <td className="w-24 px-3 py-2.5">
            {editingId === r.id ? (
              <select value={editState.contentType} onChange={e => setEditState(s => ({ ...s, contentType: e.target.value }))}
                className={`px-2 py-1.5 text-xs rounded-md ${ADMIN_TABLE_INPUT} focus-visible:ring-slate-500 max-w-full`}>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="worksheet">Worksheet</option>
              </select>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono uppercase"
                    style={{ backgroundColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                {r.content_type}
              </span>
            )}
          </td>

          {/* Module Type */}
          <td className="w-28 px-3 py-2.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
              r.module_type === MODULE_TYPES.SOLVED_PAST_PAPER
                ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                : 'bg-amber-500/15 text-amber-900 dark:text-amber-300'
            }`}>
              {r.module_type === MODULE_TYPES.SOLVED_PAST_PAPER ? 'Past Paper' : 'Video Topical'}
            </span>
          </td>

          {/* Toggles */}
          <td className="w-14 px-2 py-2.5 text-center">
            <button
              onClick={() => handleToggle(r.id, 'is_published', r.is_published)}
              title={r.is_published ? 'Published — click to unpublish' : 'Unpublished — click to publish'}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                r.is_published ? 'bg-yellow-400' : 'admin-toggle-track'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform ${
                  r.is_published ? 'translate-x-4 bg-white' : 'translate-x-0 admin-toggle-thumb'
                }`}
              />
            </button>
          </td>
          <td className="w-14 px-2 py-2.5 text-center">
            <button
              onClick={() => handleToggle(r.id, 'is_locked', r.is_locked)}
              title={r.is_locked ? 'Locked (login required) — click to unlock' : 'Public — click to lock (require login)'}
              style={r.is_locked ? { backgroundColor: '#FF6B35' } : undefined}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                !r.is_locked ? 'admin-toggle-track' : ''
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform ${
                  r.is_locked ? 'translate-x-4 bg-white' : 'translate-x-0 admin-toggle-thumb'
                }`}
              />
            </button>
          </td>
          <td className="w-14 px-2 py-2.5 text-center">
            <button
              onClick={() => handleToggle(r.id, 'is_watermarked', r.is_watermarked)}
              title={r.is_watermarked ? 'Watermarked — click to remove' : 'No watermark — click to enable'}
              style={r.is_watermarked ? { backgroundColor: '#FF6B35' } : undefined}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 ${
                !r.is_watermarked ? 'admin-toggle-track' : ''
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform ${
                  r.is_watermarked ? 'translate-x-4 bg-white' : 'translate-x-0 admin-toggle-thumb'
                }`}
              />
            </button>
          </td>

          {/* Actions — fixed w-32 so icons never shift */}
          <td className="w-32 px-3 py-2.5 text-right">
            <div className="flex items-center justify-end gap-1">
              {editingId === r.id ? (
                <>
                  <button onClick={() => saveEdit(r.id)} disabled={isPending} className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-green-500/10 transition" title="Save"><Check className="w-4 h-4" /></button>
                  <button onClick={cancelEdit} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] p-1 rounded hover:bg-[var(--bg-elevated)] transition" title="Cancel"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(r)} className="text-[var(--text-muted)] hover:text-gold-400 p-1 rounded hover:bg-gold-500/10 transition" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => openTimestampEditor(r)} className="text-[var(--text-muted)] hover:text-purple-400 p-1 rounded hover:bg-purple-500/10 transition" title="Timestamps"><Clock className="w-4 h-4" /></button>
                  <button onClick={() => openSubtopic(r)} className="text-[var(--text-muted)] hover:text-blue-400 p-1 rounded hover:bg-blue-500/10 transition" title="Add sub-topic"><ListPlus className="w-4 h-4" /></button>
                  <a href={`/view/${r.id}`} target="_blank" rel="noreferrer" className="text-[var(--text-muted)] hover:text-gold-400 p-1 rounded hover:bg-gold-500/10 transition" title="Preview"><ExternalLink className="w-4 h-4" /></a>
                  <button onClick={() => handleDelete(r.id, r.title)} className="text-[var(--text-muted)] hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </td>
        </tr>

        {/* Inline sub-topic form */}
        {subtopicParentId === r.id && (
          <tr key={`sub-form-${r.id}`} className="bg-blue-500/10 border-l-4 border-blue-500/40">
            <td colSpan={9} className="px-4 py-3">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Sub-topic Title</label>
                  <input value={subtopicState.title} onChange={e => setSubtopicState(s => ({ ...s, title: e.target.value }))}
                    className={`px-2 py-1.5 text-sm rounded-md ${ADMIN_TABLE_INPUT} focus-visible:ring-blue-500`}
                    placeholder="Differentiation Part 2" />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[175px]">
                  <label className="text-xs font-semibold text-red-500">YouTube URL</label>
                  <input value={subtopicState.videoUrl} onChange={e => setSubtopicState(s => ({ ...s, videoUrl: e.target.value }))}
                    className={`px-2 py-1.5 text-xs font-mono rounded-md ${ADMIN_TABLE_INPUT} focus-visible:ring-red-500`}
                    placeholder="https://www.youtube.com/watch?v=..." />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[175px]">
                  <label className="text-xs font-semibold text-green-600">Worksheet PDF (optional)</label>
                  <input value={subtopicState.worksheetUrl} onChange={e => setSubtopicState(s => ({ ...s, worksheetUrl: e.target.value }))}
                    className={`px-2 py-1.5 text-xs font-mono rounded-md ${ADMIN_TABLE_INPUT} focus-visible:ring-emerald-600`}
                    placeholder="https://drive.google.com/..." />
                </div>
                <div className="flex gap-2 pb-0.5">
                  <button onClick={() => saveSubtopic(r)} disabled={isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-blue-600 hover:bg-blue-500 rounded-lg transition disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> Add
                  </button>
                  <button onClick={cancelSubtopic}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)] transition">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            </td>
          </tr>
        )}

        {/* Inline timestamp mapping editor */}
        {mappingEditId === r.id && (
          <tr key={`ts-editor-${r.id}`} className="bg-purple-500/10 border-l-4 border-purple-500/40">
            <td colSpan={9} className="px-4 py-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Question Timestamps
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const next = mappingDraft.length + 1;
                        setMappingDraft([...mappingDraft, { question: next, label: `Q${next}`, start_time: 0, parts: [] }]);
                      }}
                      className="text-xs font-semibold text-purple-400 hover:text-purple-800 px-2 py-1 rounded border border-purple-500/30 hover:bg-purple-500/15 transition"
                    >+ Add Question</button>
                  </div>
                </div>

                {mappingDraft.map((q: any, qi: number) => (
                  <div key={qi} className="flex flex-col gap-2 p-2 bg-[var(--bg-card)] rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        value={q.label}
                        onChange={e => {
                          const copy = [...mappingDraft];
                          copy[qi] = { ...copy[qi], label: e.target.value };
                          setMappingDraft(copy);
                        }}
                        className={`w-16 px-2 py-1 text-xs font-bold rounded-md text-center ${ADMIN_TABLE_INPUT} focus-visible:ring-violet-500`}
                        placeholder="Q1"
                      />
                      <span className="text-xs text-[var(--text-muted)]">@</span>
                      <input
                        type="text"
                        value={(() => { const m = Math.floor(q.start_time / 60); const s = q.start_time % 60; return `${m}:${s.toString().padStart(2, '0')}`; })()}
                        onChange={e => {
                          const [mm, ss] = e.target.value.split(':').map(Number);
                          const copy = [...mappingDraft];
                          copy[qi] = { ...copy[qi], start_time: (mm || 0) * 60 + (ss || 0) };
                          setMappingDraft(copy);
                        }}
                        className={`w-16 px-2 py-1 text-xs font-mono rounded-md text-center ${ADMIN_TABLE_INPUT} focus-visible:ring-violet-500`}
                        placeholder="0:00"
                        title="MM:SS"
                      />
                      <button
                        onClick={() => {
                          const copy = [...mappingDraft];
                          const parts = copy[qi].parts || [];
                          const nextPart = String.fromCharCode(97 + parts.length); // a, b, c...
                          copy[qi] = { ...copy[qi], parts: [...parts, { part: nextPart, start_time: q.start_time, pdf_page: 1 }] };
                          setMappingDraft(copy);
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-800 font-semibold px-1.5 py-0.5 rounded border border-blue-500/30 hover:bg-blue-500/10 transition"
                      >+ Part</button>
                      <button
                        onClick={() => setMappingDraft(mappingDraft.filter((_: any, i: number) => i !== qi))}
                        className="text-red-400 hover:text-red-600 p-0.5 rounded hover:bg-red-500/10 transition ml-auto"
                        title="Remove question"
                      ><Trash2 className="w-3 h-3" /></button>
                    </div>

                    {/* Sub-parts */}
                    {q.parts && q.parts.length > 0 && (
                      <div className="flex flex-wrap gap-2 pl-6">
                        {q.parts.map((part: any, pi: number) => (
                          <div key={pi} className="flex items-center gap-1 bg-blue-500/15 rounded px-2 py-1">
                            <span className="text-xs font-bold text-blue-300 w-4">{part.part.toUpperCase()}</span>
                            <input
                              type="text"
                              value={(() => { const m = Math.floor(part.start_time / 60); const s = part.start_time % 60; return `${m}:${s.toString().padStart(2, '0')}`; })()}
                              onChange={e => {
                                const [mm, ss] = e.target.value.split(':').map(Number);
                                const copy = [...mappingDraft];
                                const pcopy = [...copy[qi].parts];
                                pcopy[pi] = { ...pcopy[pi], start_time: (mm || 0) * 60 + (ss || 0) };
                                copy[qi] = { ...copy[qi], parts: pcopy };
                                setMappingDraft(copy);
                              }}
                              className={`w-14 px-1 py-1 text-[10px] font-mono rounded text-center ${ADMIN_TABLE_INPUT} focus-visible:ring-blue-500`}
                              title="MM:SS"
                            />
                            <input
                              type="number" min="1"
                              value={part.pdf_page || ''}
                              onChange={e => {
                                const copy = [...mappingDraft];
                                const pcopy = [...copy[qi].parts];
                                pcopy[pi] = { ...pcopy[pi], pdf_page: parseInt(e.target.value) || 1 };
                                copy[qi] = { ...copy[qi], parts: pcopy };
                                setMappingDraft(copy);
                              }}
                              className={`w-10 px-1 py-1 text-[10px] rounded text-center ${ADMIN_TABLE_INPUT} focus-visible:ring-blue-500`}
                              placeholder="pg"
                              title="PDF page number"
                            />
                            <button
                              onClick={() => {
                                const copy = [...mappingDraft];
                                copy[qi] = { ...copy[qi], parts: copy[qi].parts.filter((_: any, i: number) => i !== pi) };
                                setMappingDraft(copy);
                              }}
                              className="text-red-400 hover:text-red-600 p-0.5"
                            ><X className="w-2.5 h-2.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <button onClick={() => saveTimestamps(r.id)} disabled={isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-purple-600 hover:bg-purple-500 rounded-lg transition disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> Save Timestamps
                  </button>
                  <button onClick={cancelTimestampEditor}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-color)] transition">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-2 flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={filterSyllabus}
            onChange={e => setFilterSyllabus(e.target.value)}
            className={`rounded-lg px-3 py-2 text-sm ${ADMIN_TABLE_INPUT}`}
            aria-label="Filter by syllabus"
          >
            <option value="all">All syllabi</option>
            {syllabusSlugsInData.map(slug => (
              <option key={slug} value={slug}>
                {slug === 'tier:olevel'
                  ? 'O-Level (tier)'
                  : slug === 'tier:alevel'
                    ? 'A-Level (tier)'
                    : getSubjectLabel(slug)}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-[var(--border-color)] overflow-hidden">
            {[
              { value: 'all', label: 'All Types' },
              { value: MODULE_TYPES.VIDEO_TOPICAL, label: 'Video Topical' },
              { value: MODULE_TYPES.SOLVED_PAST_PAPER, label: 'Past Papers' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterModuleType(opt.value)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  filterModuleType === opt.value
                    ? 'bg-[#FF6B35] text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="admin-resource-toolbar-meta text-sm text-[var(--text-muted)]">
            {filtered.length} resources · {syllabusBuckets.reduce((n, b) => n + b.modules.length, 0)} modules
          </span>
        </div>
        <button
          ref={newResourceButtonRef}
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e55a2b] px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 text-[var(--text-on-accent)]"
        >
          <Plus className="w-4 h-4" aria-hidden /> New Resource
        </button>
      </div>

      {/* Hierarchical table */}
      <div
        className="overflow-x-auto rounded-xl max-h-[70vh] overflow-y-auto border border-slate-700/50 bg-slate-900/20 backdrop-blur-md shadow-lg"
      >
        <table className="w-full text-sm text-left">
          <thead
            className="text-[10px] uppercase tracking-wider sticky top-0 z-10"
            style={{
              backgroundColor: 'var(--badge-bg)',
              color: 'var(--badge-text)',
              borderBottom: '2px solid var(--border-color)',
            }}
          >
            <tr>
              <th className="w-12 px-3 py-3 text-center whitespace-nowrap">#</th>
              {/* flex-grow: title column takes all remaining space */}
              <th className="px-4 py-3 min-w-[200px]">Topic / Title</th>
              <th className="w-16 px-2 py-3 text-center whitespace-nowrap">Order ↕</th>
              <th className="w-24 px-3 py-3 whitespace-nowrap">Type</th>
              <th className="w-28 px-3 py-3 whitespace-nowrap">Module</th>
              <th className="w-14 px-2 py-3 text-center whitespace-nowrap" title="Published — toggle to show/hide on site">Pub</th>
              <th className="w-14 px-2 py-3 text-center whitespace-nowrap" title="Locked — toggle to require login to view">🔒 Lock</th>
              <th className="w-14 px-2 py-3 text-center whitespace-nowrap" title="Watermark — toggle to mark content">Wtmk</th>
              <th className="w-32 px-3 py-3 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                 className="divide-y divide-[var(--border-subtle)]" >
            {syllabusBuckets.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[var(--text-muted)] text-sm">No resources found.</td>
              </tr>
            ) : (
              syllabusBuckets.map(bucket => (
                <Fragment key={bucket.syllabusSlug}>
                  <tr className="bg-slate-950/70 border-y border-amber-500/25">
                    <td colSpan={9} className="px-2 py-0">
                      <button
                        type="button"
                        onClick={() => toggleSyllabusCollapsed(bucket.syllabusSlug)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-amber-500/5 transition-colors rounded-none"
                      >
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 text-amber-400/90 transition-transform ${
                            collapsedSyllabi.has(bucket.syllabusSlug) ? '-rotate-90' : ''
                          }`}
                          aria-hidden
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">Syllabus</span>
                        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {bucket.syllabusLabel}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          · {bucket.modules.length} module{bucket.modules.length !== 1 ? 's' : ''}
                        </span>
                      </button>
                    </td>
                  </tr>
                  {!collapsedSyllabi.has(bucket.syllabusSlug) &&
                    bucket.modules.map(mod => {
                      const mk = moduleCollapseKey(bucket.syllabusSlug, mod.categoryId);
                      return (
                        <Fragment key={mk}>
                          <tr className="bg-[var(--bg-surface)]/60 border-b border-slate-700/40">
                            <td colSpan={9} className="px-2 py-0">
                              <button
                                type="button"
                                onClick={() => toggleModuleCollapsed(mk)}
                                className="flex w-full items-center gap-2 px-6 py-2 text-left hover:bg-slate-800/40 transition-colors"
                              >
                                <ChevronDown
                                  className={`w-3.5 h-3.5 shrink-0 text-[var(--text-muted)] transition-transform ${
                                    collapsedModules.has(mk) ? '-rotate-90' : ''
                                  }`}
                                  aria-hidden
                                />
                                <FolderOpen className="w-4 h-4 shrink-0 text-gold-500" aria-hidden />
                                <span
                                  className="text-[10px] font-bold uppercase tracking-widest"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  Module
                                </span>
                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {mod.categoryName}
                                </span>
                                <span className="text-xs text-[var(--text-muted)]">
                                  · {mod.topicClusters.length} topic{mod.topicClusters.length !== 1 ? 's' : ''}
                                </span>
                              </button>
                            </td>
                          </tr>
                          {!collapsedModules.has(mk) &&
                            mod.topicClusters.map((cluster, topicIdx) => (
                              <Fragment key={cluster.rootId}>
                                {cluster.parts.map((part, idx) => {
                                  const isRoot = part.id === cluster.rootId;
                                  const childOrdinal = isRoot
                                    ? null
                                    : cluster.parts.slice(0, idx + 1).filter(p => p.id !== cluster.rootId).length;
                                  return renderRow(
                                    part,
                                    topicIdx,
                                    childOrdinal,
                                    cluster.parts.length,
                                    cluster.rootId,
                                  );
                                })}
                              </Fragment>
                            ))}
                        </Fragment>
                      );
                    })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <NewResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultSyllabusSlug={filterSyllabus !== 'all' ? filterSyllabus : null}
        onSuccess={() => {
          setIsModalOpen(false);
          requestAnimationFrame(() => newResourceButtonRef.current?.focus());
        }}
      />
    </div>
  );
}
