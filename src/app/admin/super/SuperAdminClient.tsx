'use client';

import { useState, useTransition } from 'react';
import { Plus, UserPlus, X, Trash2, Video, FileText, Eye, EyeOff, Link as LinkIcon } from 'lucide-react';
import { createSubject, assignSubjectToAdmin, removeSubjectFromAdmin } from './actions';
import { createMediaWidget, deleteMediaWidget, toggleMediaWidget } from './media-actions';
import { useToast } from '@/components/ui/Toast';

interface Subject {
  id: string;
  name: string;
  slug: string;
  levels: string[];
}

interface Admin {
  id: string;
  email: string;
  full_name: string;
  is_super_admin: boolean;
  managed_subjects: string[];
}

interface MediaWidgetItem {
  id: string;
  page_slug: string;
  section_order: number;
  media_type: 'youtube' | 'pdf';
  title: string;
  url: string;
  permissions: { allow_print: boolean; allow_download: boolean };
  is_active: boolean;
  created_at: string;
}

export default function SuperAdminClient({
  subjects: initialSubjects,
  admins: initialAdmins,
  mediaWidgets: initialMedia,
}: {
  subjects: Subject[];
  admins: Admin[];
  mediaWidgets: MediaWidgetItem[];
}) {
  const [tab, setTab] = useState<'subjects' | 'admins' | 'media'>('subjects');

  const tabs = [
    { id: 'subjects' as const, label: 'Subject Factory' },
    { id: 'admins' as const, label: 'Admin Manager' },
    { id: 'media' as const, label: 'Media Manager' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-navy-50 overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-100 flex">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'text-navy-900 border-b-2 border-navy-900 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === 'subjects' ? (
          <SubjectFactory subjects={initialSubjects} />
        ) : tab === 'admins' ? (
          <AdminManager admins={initialAdmins} subjects={initialSubjects} />
        ) : (
          <MediaManager widgets={initialMedia} />
        )}
      </div>
    </div>
  );
}

// ── Subject Factory ─────────────────────────────────────────────────────────

const LEVEL_OPTIONS = ['Pre-O', 'O Level', 'A Level', 'AS Level', 'A2 Level'] as const;

function SubjectFactory({ subjects }: { subjects: Subject[] }) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', levels: [] as string[] });

  function toggleLevel(level: string) {
    setForm(prev => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter(l => l !== level)
        : [...prev.levels, level],
    }));
  }

  function handleAutoSlug(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setForm(prev => ({ ...prev, name, slug }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createSubject(form);
      if (result.success) {
        showToast({ message: `Subject "${form.name}" created!`, type: 'success' });
        setForm({ name: '', slug: '', levels: [] });
        setShowForm(false);
      } else {
        showToast({ message: result.error || 'Failed.', type: 'error' });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">Active Subjects</h4>
          <p className="text-xs text-gray-500 mt-0.5">{subjects.length} configured</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-navy-900 text-white text-xs font-medium rounded-lg hover:bg-navy-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          New Subject
        </button>
      </div>

      {/* Existing subjects list */}
      <div className="space-y-2">
        {subjects.map(s => (
          <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">{s.name}</p>
              <p className="text-xs text-gray-400 font-mono">/{s.slug}</p>
            </div>
            <div className="flex gap-1.5">
              {s.levels?.map(l => (
                <span key={l} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-white border border-gray-200 text-gray-600">
                  {l}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New subject form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-2 border-dashed border-navy-200 rounded-xl space-y-3 bg-navy-50/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subject Name *</label>
              <input
                required
                value={form.name}
                onChange={e => handleAutoSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-navy-500 focus:border-navy-500"
                placeholder="e.g. Physics"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">URL Slug</label>
              <input
                required
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-navy-500 focus:border-navy-500"
                placeholder="physics"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Levels *</label>
            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                    form.levels.includes(level)
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || form.levels.length === 0}
              className="px-4 py-1.5 text-xs font-medium text-white bg-navy-900 rounded-lg hover:bg-navy-800 disabled:opacity-50 transition"
            >
              {isPending ? 'Creating…' : 'Create Subject'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Admin Manager ───────────────────────────────────────────────────────────

function AdminManager({ admins, subjects }: { admins: Admin[]; subjects: Subject[] }) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');

  const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

  function handleAssign(userId: string) {
    if (!selectedSubject) return;
    startTransition(async () => {
      const result = await assignSubjectToAdmin(userId, selectedSubject);
      if (result.success) {
        showToast({ message: 'Subject assigned!', type: 'success' });
        setAssignTarget(null);
        setSelectedSubject('');
      } else {
        showToast({ message: result.error || 'Failed.', type: 'error' });
      }
    });
  }

  function handleRemove(userId: string, subjectId: string) {
    startTransition(async () => {
      const result = await removeSubjectFromAdmin(userId, subjectId);
      if (result.success) {
        showToast({ message: 'Subject removed.', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed.', type: 'error' });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-gray-900">Admin Users</h4>
        <p className="text-xs text-gray-500 mt-0.5">Manage subject assignments for each admin.</p>
      </div>

      <div className="space-y-3">
        {admins.map(admin => (
          <div key={admin.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {admin.full_name}
                  {admin.is_super_admin && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700">
                      SUPER
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{admin.email}</p>
              </div>
              <button
                onClick={() => setAssignTarget(assignTarget === admin.id ? null : admin.id)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Assign
              </button>
            </div>

            {/* Current subjects */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {admin.managed_subjects.length === 0 && !admin.is_super_admin && (
                <span className="text-xs text-gray-400 italic">No subjects assigned</span>
              )}
              {admin.is_super_admin && (
                <span className="text-xs text-amber-600 font-medium">Access to all subjects</span>
              )}
              {!admin.is_super_admin && admin.managed_subjects.map(sid => (
                <span
                  key={sid}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700"
                >
                  {subjectMap.get(sid) || sid.slice(0, 8)}
                  <button
                    onClick={() => handleRemove(admin.id, sid)}
                    disabled={isPending}
                    className="hover:text-red-600 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Assign dropdown */}
            {assignTarget === admin.id && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-indigo-500"
                >
                  <option value="" disabled>Choose subject…</option>
                  {subjects
                    .filter(s => !admin.managed_subjects.includes(s.id))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <button
                  onClick={() => handleAssign(admin.id)}
                  disabled={isPending || !selectedSubject}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {isPending ? '…' : 'Add'}
                </button>
              </div>
            )}
          </div>
        ))}

        {admins.length === 0 && (
          <p className="text-sm text-gray-400 py-8 text-center">No admin accounts found.</p>
        )}
      </div>
    </div>
  );
}

// ── Media Manager ───────────────────────────────────────────────────────────

const PAGE_OPTIONS = [
  { value: 'home', label: 'Home Page' },
  { value: 'blog', label: 'Blog' },
  { value: 'pre-o-level', label: 'Pre O-Level' },
] as const;

function MediaManager({ widgets }: { widgets: MediaWidgetItem[] }) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState(widgets);
  const [form, setForm] = useState({
    page_slug: 'home',
    media_type: 'youtube' as 'youtube' | 'pdf',
    title: '',
    url: '',
    allow_print: true,
    allow_download: true,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createMediaWidget({
        page_slug: form.page_slug,
        media_type: form.media_type,
        title: form.title,
        url: form.url,
        permissions: { allow_print: form.allow_print, allow_download: form.allow_download },
      });
      if (result.success) {
        showToast({ message: 'Media widget added!', type: 'success' });
        setForm({ page_slug: 'home', media_type: 'youtube', title: '', url: '', allow_print: true, allow_download: true });
        setShowForm(false);
      } else {
        showToast({ message: result.error || 'Failed.', type: 'error' });
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this media widget?')) return;
    startTransition(async () => {
      const result = await deleteMediaWidget(id);
      if (result.success) {
        setItems(prev => prev.filter(w => w.id !== id));
        showToast({ message: 'Widget deleted.', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed.', type: 'error' });
      }
    });
  }

  function handleToggle(id: string, currentlyActive: boolean) {
    startTransition(async () => {
      const result = await toggleMediaWidget(id, !currentlyActive);
      if (result.success) {
        setItems(prev => prev.map(w => w.id === id ? { ...w, is_active: !currentlyActive } : w));
        showToast({ message: currentlyActive ? 'Widget hidden.' : 'Widget visible.', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed.', type: 'error' });
      }
    });
  }

  const grouped = PAGE_OPTIONS.map(p => ({
    ...p,
    widgets: items.filter(w => w.page_slug === p.value),
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-900">Media Widgets</h4>
          <p className="text-xs text-gray-500 mt-0.5">YouTube videos &amp; PDF viewers on public pages</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-navy-900 text-white text-xs font-medium rounded-lg hover:bg-navy-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Media
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-2 border-dashed border-navy-200 rounded-xl space-y-3 bg-navy-50/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Page Target *</label>
              <select
                value={form.page_slug}
                onChange={e => setForm({ ...form, page_slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-navy-500 focus:border-navy-500"
              >
                {PAGE_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Media Type *</label>
              <select
                value={form.media_type}
                onChange={e => setForm({ ...form, media_type: e.target.value as 'youtube' | 'pdf' })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-navy-500 focus:border-navy-500"
              >
                <option value="youtube">YouTube Video</option>
                <option value="pdf">PDF Document</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-navy-500 focus:border-navy-500"
              placeholder={form.media_type === 'youtube' ? 'e.g. O-Level Paper 1 Walkthrough' : 'e.g. 2024 Specimen Paper'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {form.media_type === 'youtube' ? 'YouTube URL or Video ID *' : 'PDF URL (Supabase Storage) *'}
            </label>
            <input
              required
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-navy-500 focus:border-navy-500"
              placeholder={form.media_type === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...supabase.co/storage/v1/...'}
            />
          </div>

          {form.media_type === 'pdf' && (
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={form.allow_download}
                  onChange={e => setForm({ ...form, allow_download: e.target.checked })}
                  className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                />
                Allow Download
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={form.allow_print}
                  onChange={e => setForm({ ...form, allow_print: e.target.checked })}
                  className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                />
                Allow Print
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 text-xs font-medium text-white bg-navy-900 rounded-lg hover:bg-navy-800 disabled:opacity-50 transition"
            >
              {isPending ? 'Adding…' : 'Add Widget'}
            </button>
          </div>
        </form>
      )}

      {/* Grouped widgets by page */}
      {grouped.map(group => (
        <div key={group.value}>
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.label}</h5>
          {group.widgets.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No media widgets</p>
          ) : (
            <div className="space-y-2">
              {group.widgets.map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    {w.media_type === 'youtube' ? (
                      <Video className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{w.title}</p>
                      <p className="text-[11px] text-gray-400 font-mono truncate">{w.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleToggle(w.id, w.is_active)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg hover:bg-gray-200 transition"
                      title={w.is_active ? 'Hide' : 'Show'}
                    >
                      {w.is_active ? (
                        <Eye className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
