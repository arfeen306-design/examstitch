'use client';

import { useState, useTransition } from 'react';
import { toggleResourceFlag, deleteResource, updateResource, bulkInsertResources } from '../../actions';
import { Plus, Trash2, Pencil, X, Check, ExternalLink, ListPlus } from 'lucide-react';
import NewResourceModal from './NewResourceModal';
import { useToast } from '@/components/ui/Toast';

interface Resource {
  id: string;
  title: string;
  subject: string;
  content_type: string;
  source_url?: string;
  worksheet_url?: string | null;
  module_type?: string;
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
}

interface SubtopicState {
  parentId: string;
  title: string;
  videoUrl: string;
  worksheetUrl: string;
}

export default function ResourceGridClient({ initialResources }: { initialResources: Resource[] }) {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ title: '', videoUrl: '', worksheetUrl: '', contentType: 'video' });

  // Sub-topic state
  const [subtopicParentId, setSubtopicParentId] = useState<string | null>(null);
  const [subtopicState, setSubtopicState] = useState<SubtopicState>({ parentId: '', title: '', videoUrl: '', worksheetUrl: '' });

  const filtered = filterSubject === 'all'
    ? resources
    : resources.filter(r => r.subject === filterSubject);

  // ── Toggle flags ──────────────────────────────────────────────────────────

  const handleToggle = (id: string, field: 'is_published' | 'is_locked' | 'is_watermarked', currentValue: boolean) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, [field]: !currentValue } : r));
    startTransition(async () => {
      const { success } = await toggleResourceFlag(id, field, !currentValue);
      if (!success) {
        setResources(prev => prev.map(r => r.id === id ? { ...r, [field]: currentValue } : r));
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
        } else {
          showToast({ message: result.error || 'Delete failed', type: 'error' });
        }
      } catch (err: any) {
        showToast({ message: 'Delete failed: ' + err.message, type: 'error' });
      }
    });
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const startEdit = (r: Resource) => {
    setEditingId(r.id);
    setEditState({
      title: r.title,
      videoUrl: r.content_type === 'video' ? (r.source_url || '') : '',
      worksheetUrl: r.worksheet_url || '',
      contentType: r.content_type,
    });
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = (id: string) => {
    startTransition(async () => {
      try {
        const original = resources.find(r => r.id === id);
        if (!original) return;

        const updates: any = {};
        if (editState.title !== original.title) updates.title = editState.title;
        if (editState.videoUrl !== (original.source_url || '')) updates.source_url = editState.videoUrl;
        if (editState.worksheetUrl !== (original.worksheet_url || '')) updates.worksheet_url = editState.worksheetUrl || null;
        if (editState.contentType !== original.content_type) updates.content_type = editState.contentType;

        if (Object.keys(updates).length === 0) { cancelEdit(); return; }

        const result = await updateResource(id, updates);
        if (result.success) {
          setResources(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
          showToast({ message: 'Resource updated!', type: 'success' });
          cancelEdit();
        } else {
          showToast({ message: result.error || 'Failed to update', type: 'error' });
        }
      } catch (err: any) {
        showToast({ message: 'Update failed: ' + err.message, type: 'error' });
      }
    });
  };

  // ── Sub-topic ─────────────────────────────────────────────────────────────

  const openSubtopic = (r: Resource) => {
    // Auto-number: count existing sub-topics for this title base
    const baseTitle = r.title;
    const siblings = resources.filter(x => x.title.startsWith(baseTitle) && x.id !== r.id);
    const nextNum = siblings.length + 1;
    setSubtopicParentId(r.id);
    setSubtopicState({
      parentId: r.id,
      title: `${baseTitle} — Part ${nextNum + 1}`,
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
        const payload: any = {
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
          // Reload page to show new entry
          window.location.reload();
        } else {
          showToast({ message: result.error || 'Failed to add sub-topic', type: 'error' });
        }
      } catch (err: any) {
        showToast({ message: 'Failed: ' + err.message, type: 'error' });
      }
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="border border-navy-100 rounded-lg px-3 py-2 text-sm text-navy-700 focus:ring-1 focus:ring-gold-500 outline-none"
          >
            <option value="all">All Syllabi</option>
            <option value="mathematics-4024">O-Level / IGCSE (4024/0580)</option>
            <option value="mathematics-9709">A-Level (9709)</option>
          </select>
          <div className="text-sm text-navy-400">Showing {filtered.length} resources</div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Resource
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-navy-50 rounded-lg max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm text-left align-middle">
          <thead className="text-xs uppercase bg-navy-50 text-navy-500 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3">Title / Links</th>
              <th className="px-4 py-3">Subject / Cat</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-center">Published</th>
              <th className="px-4 py-3 text-center">Locked</th>
              <th className="px-4 py-3 text-center">Wtmk</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-50 bg-white">
            {filtered.map(r => (
              <>
                {/* Main resource row */}
                <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${editingId === r.id ? 'bg-gold-50/30' : ''}`}>
                  <td className="px-4 py-3 font-medium text-navy-900 max-w-[260px]">
                    {editingId === r.id ? (
                      <div className="space-y-1.5">
                        <input
                          value={editState.title}
                          onChange={e => setEditState(s => ({ ...s, title: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gold-300 rounded-md focus:ring-1 focus:ring-gold-500 outline-none"
                          placeholder="Title"
                        />
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-[10px] font-bold text-red-500">YT</span>
                          <input
                            value={editState.videoUrl}
                            onChange={e => setEditState(s => ({ ...s, videoUrl: e.target.value }))}
                            className="w-full pl-7 pr-2 py-1 text-xs font-mono border border-red-200 rounded-md focus:ring-1 focus:ring-red-400 outline-none"
                            placeholder="YouTube URL"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-[10px] font-bold text-green-600">PDF</span>
                          <input
                            value={editState.worksheetUrl}
                            onChange={e => setEditState(s => ({ ...s, worksheetUrl: e.target.value }))}
                            className="w-full pl-8 pr-2 py-1 text-xs font-mono border border-green-200 rounded-md focus:ring-1 focus:ring-green-400 outline-none"
                            placeholder="Google Drive PDF URL (optional)"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="truncate block" title={r.title}>{r.title}</span>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {r.source_url && (
                            <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">YT</span>
                          )}
                          {r.worksheet_url && (
                            <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">PDF</span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-navy-500">
                    <div className="font-semibold">{r.subject.replace('mathematics-', '')}</div>
                    <div className="truncate w-32" title={r.category?.name || 'Uncategorized'}>{r.category?.name || 'Uncategorized'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === r.id ? (
                      <select value={editState.contentType} onChange={e => setEditState(s => ({ ...s, contentType: e.target.value }))} className="px-2 py-1 text-xs border border-navy-200 rounded-md">
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                        <option value="worksheet">Worksheet</option>
                      </select>
                    ) : (
                      <span className="bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full text-xs font-mono uppercase">{r.content_type}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={r.is_published} onChange={() => handleToggle(r.id, 'is_published', r.is_published)} className="w-4 h-4 cursor-pointer accent-gold-500" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={r.is_locked} onChange={() => handleToggle(r.id, 'is_locked', r.is_locked)} className="w-4 h-4 cursor-pointer accent-red-500" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={r.is_watermarked} onChange={() => handleToggle(r.id, 'is_watermarked', r.is_watermarked)} className="w-4 h-4 cursor-pointer accent-blue-500" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {editingId === r.id ? (
                        <>
                          <button onClick={() => saveEdit(r.id)} disabled={isPending} className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-50 transition-colors" title="Save"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelEdit} className="text-navy-400 hover:text-navy-700 p-1 rounded hover:bg-navy-50 transition-colors" title="Cancel"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(r)} className="text-navy-400 hover:text-gold-500 transition-colors p-1 rounded hover:bg-gold-50" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => openSubtopic(r)} className="text-navy-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50" title="Add Sub-topic"><ListPlus className="w-4 h-4" /></button>
                          <a href={`/view/${r.id}`} target="_blank" rel="noreferrer" className="text-navy-400 hover:text-gold-500 transition-colors p-1 rounded hover:bg-gold-50" title="Preview"><ExternalLink className="w-4 h-4" /></a>
                          <button onClick={() => handleDelete(r.id, r.title)} className="text-navy-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Inline sub-topic form row */}
                {subtopicParentId === r.id && (
                  <tr key={`subtopic-${r.id}`} className="bg-blue-50/40 border-l-2 border-blue-400">
                    <td className="px-4 py-3" colSpan={7}>
                      <div className="flex flex-wrap gap-2 items-end">
                        <div className="flex flex-col gap-1 min-w-[160px]">
                          <label className="text-xs font-semibold text-navy-500">Sub-topic Title</label>
                          <input
                            value={subtopicState.title}
                            onChange={e => setSubtopicState(s => ({ ...s, title: e.target.value }))}
                            className="px-2 py-1 text-sm border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-400 outline-none"
                            placeholder="e.g. Differentiation Part 2"
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                          <label className="text-xs font-semibold text-red-500">YouTube Video URL</label>
                          <input
                            value={subtopicState.videoUrl}
                            onChange={e => setSubtopicState(s => ({ ...s, videoUrl: e.target.value }))}
                            className="px-2 py-1 text-xs font-mono border border-red-200 rounded-md focus:ring-1 focus:ring-red-400 outline-none"
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                          <label className="text-xs font-semibold text-green-600">Worksheet PDF (optional)</label>
                          <input
                            value={subtopicState.worksheetUrl}
                            onChange={e => setSubtopicState(s => ({ ...s, worksheetUrl: e.target.value }))}
                            className="px-2 py-1 text-xs font-mono border border-green-200 rounded-md focus:ring-1 focus:ring-green-400 outline-none"
                            placeholder="https://drive.google.com/..."
                          />
                        </div>
                        <div className="flex gap-2 pb-0.5">
                          <button
                            onClick={() => saveSubtopic(r)}
                            disabled={isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Add Sub-topic
                          </button>
                          <button
                            onClick={cancelSubtopic}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-navy-600 bg-navy-50 hover:bg-navy-100 rounded-lg border border-navy-200 transition"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-navy-400">No resources found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NewResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  );
}
