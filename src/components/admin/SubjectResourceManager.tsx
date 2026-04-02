'use client';

/**
 * SubjectResourceManager — Generic resource table for ANY subject.
 *
 * Features: Public/Lock/Watermark toggles, inline edit, timestamp mapping,
 * sub-topic creation, delete, sort-order, module type filter.
 *
 * Usage:
 *   <SubjectResourceManager
 *     initialResources={resources}
 *     subjectSlug="computer-science"
 *     subjectId="uuid-..."
 *     accentColor="#6366f1"          // indigo for CS, #FF6B35 for Maths
 *     showModuleTypeFilter={false}   // CS doesn't have video_topical / solved_past_paper split
 *   />
 */

import { useState, useTransition } from 'react';
import {
  toggleResourceFlag,
  deleteResource,
  updateResource,
  bulkInsertResources,
} from '@/app/admin/actions';
import {
  Plus, Trash2, Pencil, X, Check, ExternalLink, ListPlus,
  FolderOpen, FileVideo, FileText, ChevronRight, Clock, Lock,
  Search,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Resource {
  id: string;
  title: string;
  subject: string;
  content_type: string;
  source_url?: string;
  worksheet_url?: string | null;
  module_type?: string;
  sort_order?: number | null;
  question_mapping?: any[] | null;
  topic: string | null;
  category: { name: string; slug: string; id: string } | null;
  is_published: boolean;
  is_locked: boolean;
  is_watermarked: boolean;
  created_at: string;
}

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

interface Props {
  initialResources: Resource[];
  subjectSlug: string;
  subjectId: string;
  accentColor?: string;
  showModuleTypeFilter?: boolean;
  /** Optional slot for a "New Resource" modal trigger — rendered in toolbar */
  renderAddButton?: (open: () => void) => React.ReactNode;
  /** Optional extra toolbar content (e.g. subject filter dropdown for Maths) */
  toolbarPrefix?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouping helpers
// ─────────────────────────────────────────────────────────────────────────────

function getBaseTitle(title: string): string {
  return title
    .replace(/\s*[—–-]\s*Part\s+\d+\s*$/i, '')
    .replace(/\s*\(Part\s+\d+\)\s*$/i, '')
    .replace(/\s+Part\s+\d+\s*$/i, '')
    .trim();
}

interface TopicGroup {
  baseTitle: string;
  parts: Resource[];
}

interface PaperGroup {
  categoryId: string;
  categoryName: string;
  topicGroups: TopicGroup[];
}

function buildHierarchy(resources: Resource[]): PaperGroup[] {
  const paperMap = new Map<string, { name: string; resources: Resource[] }>();
  for (const r of resources) {
    const catId = r.category?.id ?? '__none__';
    const catName = r.category?.name ?? 'Uncategorised';
    if (!paperMap.has(catId)) paperMap.set(catId, { name: catName, resources: [] });
    paperMap.get(catId)!.resources.push(r);
  }

  return Array.from(paperMap.entries()).map(([catId, { name, resources: catResources }]) => {
    const sorted = [...catResources].sort((a, b) => {
      const ao = a.sort_order ?? 9999;
      const bo = b.sort_order ?? 9999;
      if (ao !== bo) return ao - bo;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const groupMap = new Map<string, Resource[]>();
    for (const r of sorted) {
      const base = getBaseTitle(r.title);
      if (!groupMap.has(base)) groupMap.set(base, []);
      groupMap.get(base)!.push(r);
    }

    const topicGroups: TopicGroup[] = Array.from(groupMap.entries()).map(([baseTitle, parts]) => ({
      baseTitle,
      parts,
    }));

    return { categoryId: catId, categoryName: name, topicGroups };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline edit form
// ─────────────────────────────────────────────────────────────────────────────

function EditForm({ state, onChange }: { state: EditState; onChange: (s: EditState) => void }) {
  return (
    <div className="space-y-1.5">
      <input
        value={state.title}
        onChange={e => onChange({ ...state, title: e.target.value })}
        className="w-full px-2 py-1 text-sm border border-gold-300 rounded-md focus:ring-1 focus:ring-gold-500 outline-none"
        placeholder="Title"
      />
      <div className="relative">
        <span className="absolute left-2 top-1.5 text-[10px] font-bold text-red-500">YT</span>
        <input value={state.videoUrl} onChange={e => onChange({ ...state, videoUrl: e.target.value })}
          className="w-full pl-7 pr-2 py-1 text-xs font-mono border border-red-200 rounded-md focus:ring-1 focus:ring-red-400 outline-none"
          placeholder="YouTube URL" />
      </div>
      <div className="relative">
        <span className="absolute left-2 top-1.5 text-[10px] font-bold text-green-600">PDF</span>
        <input value={state.worksheetUrl} onChange={e => onChange({ ...state, worksheetUrl: e.target.value })}
          className="w-full pl-8 pr-2 py-1 text-xs font-mono border border-green-200 rounded-md focus:ring-1 focus:ring-green-400 outline-none"
          placeholder="Drive PDF URL (optional)" />
      </div>
      <div className="relative">
        <span className="absolute left-2 top-1.5 text-[10px] font-bold text-purple-600">#</span>
        <input type="number" min="0" value={state.sortOrder}
          onChange={e => onChange({ ...state, sortOrder: e.target.value })}
          className="w-full pl-6 pr-2 py-1 text-xs border border-purple-200 rounded-md focus:ring-1 focus:ring-purple-400 outline-none"
          placeholder="Sort order (0 = first)" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function SubjectResourceManager({
  initialResources,
  subjectSlug,
  subjectId,
  accentColor = '#FF6B35',
  showModuleTypeFilter = true,
  renderAddButton,
  toolbarPrefix,
}: Props) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [filterModuleType, setFilterModuleType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ title: '', videoUrl: '', worksheetUrl: '', contentType: 'video', sortOrder: '' });

  const [subtopicParentId, setSubtopicParentId] = useState<string | null>(null);
  const [subtopicState, setSubtopicState] = useState<SubtopicState>({ parentId: '', title: '', videoUrl: '', worksheetUrl: '' });

  const [mappingEditId, setMappingEditId] = useState<string | null>(null);
  const [mappingDraft, setMappingDraft] = useState<any[]>([]);

  // ── Timestamp mapping ─────────────────────────────────────────────────────

  const openTimestampEditor = (r: Resource) => {
    setMappingEditId(r.id);
    setMappingDraft(r.question_mapping || [{ question: 1, label: 'Q1', start_time: 0, parts: [] }]);
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

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = resources.filter(r => {
    if (filterModuleType !== 'all' && r.module_type !== filterModuleType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        r.title.toLowerCase().includes(q) ||
        r.category?.name.toLowerCase().includes(q) ||
        r.topic?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const paperGroups = buildHierarchy(filtered);

  // ── Toggle flags ──────────────────────────────────────────────────────────

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

  // ── Delete ────────────────────────────────────────────────────────────────

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

  // ── Sub-topic ─────────────────────────────────────────────────────────────

  const openSubtopic = (r: Resource) => {
    const base = getBaseTitle(r.title);
    const siblings = resources.filter(x => getBaseTitle(x.title) === base && x.id !== r.id);
    setSubtopicParentId(r.id);
    setSubtopicState({
      parentId: r.id,
      title: `${base} — Part ${siblings.length + 2}`,
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
    startTransition(async () => {
      try {
        const payload = {
          title: subtopicState.title,
          subject: parent.subject,
          category_id: parent.category?.id || '',
          source_url: subtopicState.videoUrl || subtopicState.worksheetUrl,
          worksheet_url: subtopicState.worksheetUrl || null,
          source_type: subtopicState.videoUrl.includes('youtu') ? 'youtube' : 'google_drive',
          content_type: subtopicState.videoUrl ? 'video' : 'pdf',
          module_type: 'video_topical',
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

  // ── Render a single resource row ──────────────────────────────────────────

  const renderRow = (r: Resource, topicIndex: number, partIndex: number | null, totalParts: number) => {
    const isSub = partIndex !== null;
    const label = isSub ? `${topicIndex + 1}.${partIndex! + 1}` : `${topicIndex + 1}`;

    const baseTitle = getBaseTitle(r.title);
    const partSuffix = isSub
      ? r.title.replace(baseTitle, '').replace(/^[\s—–-]+/, '').trim() || `Part ${partIndex! + 1}`
      : '';
    const subLabel = isSub ? baseTitle : r.title;

    return (
      <>
        <tr
          key={r.id}
          className={`transition-colors group
            ${editingId === r.id ? 'bg-gold-50/40' : isSub ? 'bg-blue-50/20 hover:bg-blue-50/40' : 'hover:bg-gray-50/50'}
            ${isSub ? 'border-l-4 border-blue-300' : ''}`}
        >
          {/* # */}
          <td className="w-12 px-3 py-2.5 text-center">
            <span className={`inline-block text-xs font-bold tabular-nums rounded px-1.5 py-0.5
              ${isSub ? 'text-blue-600 bg-blue-50' : 'text-gray-500 bg-gray-100'}`}>
              {label}
            </span>
          </td>

          {/* Title / Links */}
          <td className={`py-2.5 font-medium min-w-[180px] ${isSub ? 'pl-8 pr-4' : 'px-4'}`}>
            {editingId === r.id ? (
              <EditForm state={editState} onChange={setEditState} />
            ) : (
              <div className="flex items-start gap-2 min-w-0">
                {isSub ? (
                  <span className="shrink-0 text-blue-400 mt-0.5"><ChevronRight className="w-3 h-3" /></span>
                ) : totalParts > 1 ? (
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accentColor }} />
                ) : (
                  r.content_type === 'video'
                    ? <FileVideo className="w-3.5 h-3.5 shrink-0 text-red-400 mt-0.5" />
                    : <FileText className="w-3.5 h-3.5 shrink-0 text-green-500 mt-0.5" />
                )}
                <div className="min-w-0">
                  <span className="truncate block text-sm text-gray-900" title={r.title}>
                    {subLabel}
                    {isSub && partSuffix && (
                      <span className="text-[10px] font-normal text-blue-400 ml-1.5">— {partSuffix}</span>
                    )}
                  </span>
                  <div className="flex gap-1 mt-0.5 flex-wrap items-center">
                    {r.source_url && <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">YT</span>}
                    {r.worksheet_url && <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">PDF</span>}
                    {r.is_locked && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                    {totalParts > 1 && !isSub && (
                      <span className="text-[10px] text-gray-400">{totalParts} parts</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </td>

          {/* Sort order */}
          <td className="w-16 px-2 py-2.5 text-center">
            {editingId === r.id ? null : (
              <input
                type="number" min="0"
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
                className="w-14 text-center text-xs border border-purple-200 rounded-md px-1 py-1 focus:ring-1 focus:ring-purple-400 outline-none text-purple-700 hover:border-purple-400 transition"
                placeholder="—"
                title="Sort order — lower = first"
              />
            )}
          </td>

          {/* Type */}
          <td className="w-24 px-3 py-2.5">
            {editingId === r.id ? (
              <select value={editState.contentType} onChange={e => setEditState(s => ({ ...s, contentType: e.target.value }))}
                className="px-2 py-1 text-xs border border-gray-200 rounded-md">
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="worksheet">Worksheet</option>
              </select>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono uppercase bg-gray-100 text-gray-600">
                {r.content_type}
              </span>
            )}
          </td>

          {/* Module Type */}
          <td className="w-28 px-3 py-2.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
              r.module_type === 'solved_past_paper'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {r.module_type === 'solved_past_paper' ? 'Past Paper' : 'Video Topical'}
            </span>
          </td>

          {/* Toggles: Published, Locked, Watermarked */}
          <td className="w-14 px-2 py-2.5 text-center">
            <button
              onClick={() => handleToggle(r.id, 'is_published', r.is_published)}
              title={r.is_published ? 'Published — click to unpublish' : 'Unpublished — click to publish'}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${r.is_published ? 'bg-yellow-400' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${r.is_published ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </td>
          <td className="w-14 px-2 py-2.5 text-center">
            <button
              onClick={() => handleToggle(r.id, 'is_locked', r.is_locked)}
              title={r.is_locked ? 'Locked — click to unlock' : 'Public — click to lock'}
              style={r.is_locked ? { backgroundColor: accentColor } : undefined}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${!r.is_locked ? 'bg-gray-300' : ''}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${r.is_locked ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </td>
          <td className="w-14 px-2 py-2.5 text-center">
            <button
              onClick={() => handleToggle(r.id, 'is_watermarked', r.is_watermarked)}
              title={r.is_watermarked ? 'Watermarked — click to remove' : 'No watermark — click to enable'}
              style={r.is_watermarked ? { backgroundColor: accentColor } : undefined}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${!r.is_watermarked ? 'bg-gray-300' : ''}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${r.is_watermarked ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </td>

          {/* Actions */}
          <td className="w-32 px-3 py-2.5 text-right">
            <div className="flex items-center justify-end gap-1">
              {editingId === r.id ? (
                <>
                  <button onClick={() => saveEdit(r.id)} disabled={isPending} className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-50 transition" title="Save"><Check className="w-4 h-4" /></button>
                  <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-50 transition" title="Cancel"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(r)} className="text-gray-400 hover:text-amber-500 p-1 rounded hover:bg-amber-50 transition" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => openTimestampEditor(r)} className="text-gray-400 hover:text-purple-500 p-1 rounded hover:bg-purple-50 transition" title="Mapping"><Clock className="w-4 h-4" /></button>
                  <button onClick={() => openSubtopic(r)} className="text-gray-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50 transition" title="Add sub-topic"><ListPlus className="w-4 h-4" /></button>
                  <a href={`/view/${r.id}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-amber-500 p-1 rounded hover:bg-amber-50 transition" title="Preview"><ExternalLink className="w-4 h-4" /></a>
                  <button onClick={() => handleDelete(r.id, r.title)} className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </td>
        </tr>

        {/* Inline sub-topic form */}
        {subtopicParentId === r.id && (
          <tr key={`sub-form-${r.id}`} className="bg-blue-50/50 border-l-4 border-blue-400">
            <td colSpan={9} className="px-4 py-3">
              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <label className="text-xs font-semibold text-gray-500">Sub-topic Title</label>
                  <input value={subtopicState.title} onChange={e => setSubtopicState(s => ({ ...s, title: e.target.value }))}
                    className="px-2 py-1 text-sm border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none" placeholder="Part 2" />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[175px]">
                  <label className="text-xs font-semibold text-red-500">YouTube URL</label>
                  <input value={subtopicState.videoUrl} onChange={e => setSubtopicState(s => ({ ...s, videoUrl: e.target.value }))}
                    className="px-2 py-1 text-xs font-mono border border-red-200 rounded-md focus:ring-1 focus:ring-red-400 outline-none" placeholder="https://www.youtube.com/watch?v=..." />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[175px]">
                  <label className="text-xs font-semibold text-green-600">Worksheet PDF (optional)</label>
                  <input value={subtopicState.worksheetUrl} onChange={e => setSubtopicState(s => ({ ...s, worksheetUrl: e.target.value }))}
                    className="px-2 py-1 text-xs font-mono border border-green-200 rounded-md focus:ring-1 focus:ring-green-400 outline-none" placeholder="https://drive.google.com/..." />
                </div>
                <div className="flex gap-2 pb-0.5">
                  <button onClick={() => saveSubtopic(r)} disabled={isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition disabled:opacity-50"
                    style={{ backgroundColor: accentColor }}>
                    <Check className="w-3.5 h-3.5" /> Add
                  </button>
                  <button onClick={cancelSubtopic}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            </td>
          </tr>
        )}

        {/* Inline timestamp mapping editor */}
        {mappingEditId === r.id && (
          <tr key={`ts-editor-${r.id}`} className="bg-purple-50/50 border-l-4 border-purple-400">
            <td colSpan={9} className="px-4 py-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Question Timestamps
                  </span>
                  <button
                    onClick={() => {
                      const next = mappingDraft.length + 1;
                      setMappingDraft([...mappingDraft, { question: next, label: `Q${next}`, start_time: 0, parts: [] }]);
                    }}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800 px-2 py-1 rounded border border-purple-200 hover:bg-purple-100 transition"
                  >+ Add Question</button>
                </div>

                {mappingDraft.map((q: any, qi: number) => (
                  <div key={qi} className="flex flex-col gap-2 p-2 bg-white rounded-lg border border-purple-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <input value={q.label}
                        onChange={e => { const copy = [...mappingDraft]; copy[qi] = { ...copy[qi], label: e.target.value }; setMappingDraft(copy); }}
                        className="w-16 px-2 py-1 text-xs font-bold border border-purple-200 rounded-md text-center" placeholder="Q1" />
                      <span className="text-xs text-gray-400">@</span>
                      <input type="text"
                        value={(() => { const m = Math.floor(q.start_time / 60); const s = q.start_time % 60; return `${m}:${s.toString().padStart(2, '0')}`; })()}
                        onChange={e => { const [mm, ss] = e.target.value.split(':').map(Number); const copy = [...mappingDraft]; copy[qi] = { ...copy[qi], start_time: (mm || 0) * 60 + (ss || 0) }; setMappingDraft(copy); }}
                        className="w-16 px-2 py-1 text-xs font-mono border border-purple-200 rounded-md text-center" placeholder="0:00" title="MM:SS" />
                      <button
                        onClick={() => { const copy = [...mappingDraft]; const parts = copy[qi].parts || []; const nextPart = String.fromCharCode(97 + parts.length); copy[qi] = { ...copy[qi], parts: [...parts, { part: nextPart, start_time: q.start_time, pdf_page: 1 }] }; setMappingDraft(copy); }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold px-1.5 py-0.5 rounded border border-blue-200 hover:bg-blue-50 transition"
                      >+ Part</button>
                      <button
                        onClick={() => setMappingDraft(mappingDraft.filter((_: any, i: number) => i !== qi))}
                        className="text-red-400 hover:text-red-600 p-0.5 rounded hover:bg-red-50 transition ml-auto" title="Remove"
                      ><Trash2 className="w-3 h-3" /></button>
                    </div>
                    {q.parts && q.parts.length > 0 && (
                      <div className="flex flex-wrap gap-2 pl-6">
                        {q.parts.map((part: any, pi: number) => (
                          <div key={pi} className="flex items-center gap-1 bg-blue-50 rounded px-2 py-1">
                            <span className="text-xs font-bold text-blue-700 w-4">{part.part.toUpperCase()}</span>
                            <input type="text"
                              value={(() => { const m = Math.floor(part.start_time / 60); const s = part.start_time % 60; return `${m}:${s.toString().padStart(2, '0')}`; })()}
                              onChange={e => { const [mm, ss] = e.target.value.split(':').map(Number); const copy = [...mappingDraft]; const pcopy = [...copy[qi].parts]; pcopy[pi] = { ...pcopy[pi], start_time: (mm || 0) * 60 + (ss || 0) }; copy[qi] = { ...copy[qi], parts: pcopy }; setMappingDraft(copy); }}
                              className="w-14 px-1 py-0.5 text-[10px] font-mono border border-blue-200 rounded text-center" title="MM:SS" />
                            <input type="number" min="1" value={part.pdf_page || ''}
                              onChange={e => { const copy = [...mappingDraft]; const pcopy = [...copy[qi].parts]; pcopy[pi] = { ...pcopy[pi], pdf_page: parseInt(e.target.value) || 1 }; copy[qi] = { ...copy[qi], parts: pcopy }; setMappingDraft(copy); }}
                              className="w-10 px-1 py-0.5 text-[10px] border border-blue-200 rounded text-center" placeholder="pg" title="PDF page" />
                            <button onClick={() => { const copy = [...mappingDraft]; copy[qi] = { ...copy[qi], parts: copy[qi].parts.filter((_: any, i: number) => i !== pi) }; setMappingDraft(copy); }}
                              className="text-red-400 hover:text-red-600 p-0.5"><X className="w-2.5 h-2.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <button onClick={() => saveTimestamps(r.id)} disabled={isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" /> Save Timestamps
                  </button>
                  <button onClick={cancelTimestampEditor}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition">
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

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-2 flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          {toolbarPrefix}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 outline-none w-52"
              style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {showModuleTypeFilter && (
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[
                { value: 'all', label: 'All Types' },
                { value: 'video_topical', label: 'Video Topical' },
                { value: 'solved_past_paper', label: 'Past Papers' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilterModuleType(opt.value)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    filterModuleType === opt.value
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  style={filterModuleType === opt.value ? { backgroundColor: accentColor } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <span className="text-sm text-gray-400">
            {filtered.length} resource{filtered.length !== 1 ? 's' : ''} · {paperGroups.length} group{paperGroups.length !== 1 ? 's' : ''}
          </span>
        </div>

        {renderAddButton ? renderAddButton(() => {}) : null}
      </div>

      {/* Hierarchical table */}
      <div className="overflow-x-auto rounded-xl max-h-[70vh] overflow-y-auto shadow-sm border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] uppercase tracking-wider sticky top-0 z-10 bg-gray-800 text-white"
                 style={{ borderBottom: '2px solid var(--border-color, #e5e7eb)' }}>
            <tr>
              <th className="w-12 px-3 py-3 text-center whitespace-nowrap">#</th>
              <th className="px-4 py-3 min-w-[200px]">Topic / Title</th>
              <th className="w-16 px-2 py-3 text-center whitespace-nowrap">Order ↕</th>
              <th className="w-24 px-3 py-3 whitespace-nowrap">Type</th>
              <th className="w-28 px-3 py-3 whitespace-nowrap">Module</th>
              <th className="w-14 px-2 py-3 text-center whitespace-nowrap" title="Published">Pub</th>
              <th className="w-14 px-2 py-3 text-center whitespace-nowrap" title="Locked">🔒</th>
              <th className="w-14 px-2 py-3 text-center whitespace-nowrap" title="Watermark">Wtmk</th>
              <th className="w-32 px-3 py-3 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paperGroups.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">No resources found.</td>
              </tr>
            ) : (
              paperGroups.map(paper => (
                <>
                  {/* Paper group header */}
                  <tr key={`header-${paper.categoryId}`} className="bg-gray-50 border-t border-b border-gray-200">
                    <td colSpan={9} className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" style={{ color: accentColor }} />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-600">
                          {paper.categoryName}
                        </span>
                        <span className="text-xs text-gray-400">
                          · {paper.topicGroups.length} topic{paper.topicGroups.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Topic groups */}
                  {paper.topicGroups.map((group, topicIdx) => (
                    <>
                      {group.parts.map((part, partIdx) =>
                        renderRow(part, topicIdx, group.parts.length > 1 ? partIdx : null, group.parts.length)
                      )}
                    </>
                  ))}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
