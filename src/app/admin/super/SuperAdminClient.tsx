'use client';

import { useState, useTransition } from 'react';
import { Plus, UserPlus, X, Trash2, Video, FileText, Eye, EyeOff, Link as LinkIcon, Shield } from 'lucide-react';
import { createSubject, assignSubjectToAdmin, removeSubjectFromAdmin, createAdminAccount, deleteAdminAccount, toggleSuperAdmin } from './actions';
import { createMediaWidget, deleteMediaWidget, toggleMediaWidget } from './media-actions';
import { useToast } from '@/components/ui/Toast';
import { ALL_SUBJECTS } from '@/config/subjects';

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
  view_count: number;
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
    <div className="bg-white/[0.04] rounded-2xl shadow-sm border border-white/[0.06] overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-white/[0.06] flex">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'text-white border-b-2 border-navy-900 bg-white/[0.04]'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.06]'
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
          <h4 className="font-semibold text-white">Active Subjects</h4>
          <p className="text-xs text-white/40 mt-0.5">{subjects.length} configured</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-navy-900 text-white text-xs font-medium rounded-lg hover:bg-white/[0.08] transition"
        >
          <Plus className="w-3.5 h-3.5" />
          New Subject
        </button>
      </div>

      {/* Existing subjects list */}
      <div className="space-y-2">
        {subjects.map(s => (
          <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div>
              <p className="text-sm font-medium text-white">{s.name}</p>
              <p className="text-xs text-white/30 font-mono">/{s.slug}</p>
            </div>
            <div className="flex gap-1.5">
              {s.levels?.map(l => (
                <span key={l} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50">
                  {l}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New subject form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-2 border-dashed border-white/[0.08] rounded-xl space-y-3 bg-white/[0.02]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Subject Name *</label>
              <input
                required
                value={form.name}
                onChange={e => handleAutoSlug(e.target.value)}
                className="w-full px-3 py-2 border border-white/[0.08] rounded-lg text-sm focus:ring-navy-500 focus:border-white/[0.06]0"
                placeholder="e.g. Physics"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">URL Slug</label>
              <input
                required
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 border border-white/[0.08] rounded-lg text-sm font-mono focus:ring-navy-500 focus:border-white/[0.06]0"
                placeholder="physics"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">Levels *</label>
            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                    form.levels.includes(level)
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/[0.08] rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || form.levels.length === 0}
              className="px-4 py-1.5 text-xs font-medium text-white bg-navy-900 rounded-lg hover:bg-white/[0.08] disabled:opacity-50 transition"
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    full_name: '',
    password: '',
    managed_subjects: [] as string[],
    is_super_admin: false,
  });

  // Merge DB subjects + config subjects into a unified lookup map.
  // Config subjects (ALL_SUBJECTS) are the authoritative list for role assignment.
  // DB subjects are kept for backwards-compat with existing UUID-based assignments.
  const subjectMap = new Map<string, string>();
  for (const s of subjects) subjectMap.set(s.id, s.name);           // DB (may have UUIDs)
  for (const s of ALL_SUBJECTS) subjectMap.set(s.id, s.name);       // Config (canonical IDs)

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

  function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createAdminAccount(newAdmin);
      if (result.success) {
        showToast({ message: `Admin "${newAdmin.full_name}" created successfully!`, type: 'success' });
        setNewAdmin({ email: '', full_name: '', password: '', managed_subjects: [], is_super_admin: false });
        setShowCreateForm(false);
      } else {
        showToast({ message: result.error || 'Failed to create admin.', type: 'error' });
      }
    });
  }

  function handleDeleteAdmin(userId: string, email: string) {
    if (!confirm(`Permanently delete admin "${email}"? This removes their Auth account and all access.`)) return;
    startTransition(async () => {
      const result = await deleteAdminAccount(userId);
      if (result.success) {
        showToast({ message: `Admin "${email}" deleted.`, type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed.', type: 'error' });
      }
    });
  }

  function handleToggleSuperAdmin(userId: string, currentlySuper: boolean) {
    const action = currentlySuper ? 'demote from' : 'promote to';
    if (!confirm(`Are you sure you want to ${action} Super Admin?`)) return;
    startTransition(async () => {
      const result = await toggleSuperAdmin(userId, !currentlySuper);
      if (result.success) {
        showToast({ message: currentlySuper ? 'Demoted to regular admin.' : 'Promoted to Super Admin!', type: 'success' });
      } else {
        showToast({ message: result.error || 'Failed.', type: 'error' });
      }
    });
  }

  function toggleNewAdminSubject(subjectId: string) {
    setNewAdmin(prev => ({
      ...prev,
      managed_subjects: prev.managed_subjects.includes(subjectId)
        ? prev.managed_subjects.filter(id => id !== subjectId)
        : [...prev.managed_subjects, subjectId],
    }));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white">Admin Users</h4>
          <p className="text-xs text-white/40 mt-0.5">{admins.length} admin{admins.length !== 1 ? 's' : ''} · Manage access &amp; subject assignments</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-navy-900 text-white text-xs font-medium rounded-lg hover:bg-white/[0.08] transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Create Admin
        </button>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateAdmin} className="p-5 border-2 border-dashed border-white/[0.08] rounded-xl space-y-4 bg-white/[0.02]">
          <p className="text-sm font-semibold text-white">New Admin Account</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Full Name *</label>
              <input
                required
                value={newAdmin.full_name}
                onChange={e => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-white/[0.08] rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Sarah Khan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Email *</label>
              <input
                required
                type="email"
                value={newAdmin.email}
                onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="w-full px-3 py-2 border border-white/[0.08] rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="teacher@school.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Temporary Password *</label>
            <input
              required
              type="text"
              value={newAdmin.password}
              onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
              className="w-full px-3 py-2 border border-white/[0.08] rounded-lg text-sm font-mono focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Min 6 characters — share with the teacher securely"
              minLength={6}
            />
          </div>

          {/* Subject Assignment — uses master config (all 13 subjects) */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-2">Assign Subjects *</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBJECTS.map(s => {
                const selected = newAdmin.managed_subjects.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleNewAdminSubject(s.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                      selected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white/[0.04] text-white/50 border-white/[0.08] hover:border-indigo-300'
                    }`}
                  >
                    {s.name} ({s.code})
                    {selected && <span className="ml-1">✓</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-white/30 mt-1">Admin can only upload/manage resources for assigned subjects.</p>
          </div>

          {/* Super Admin Toggle */}
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              checked={newAdmin.is_super_admin}
              onChange={e => setNewAdmin({ ...newAdmin, is_super_admin: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Grant Super Admin access <span className="text-white/30">(full platform control)</span></span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowCreateForm(false)} className="px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/[0.08] rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || newAdmin.managed_subjects.length === 0}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {isPending ? 'Creating…' : 'Create Admin Account'}
            </button>
          </div>
        </form>
      )}

      {/* Admin List */}
      <div className="space-y-3">
        {admins.map(admin => (
          <div key={admin.id} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.03]">
            {/* Admin Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                  admin.is_super_admin ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {admin.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {admin.full_name}
                    {admin.is_super_admin && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400">
                        SUPER ADMIN
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/40">{admin.email}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAssignTarget(assignTarget === admin.id ? null : admin.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                  title="Assign subject"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Assign</span>
                </button>
                <button
                  onClick={() => handleToggleSuperAdmin(admin.id, admin.is_super_admin)}
                  disabled={isPending}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition ${
                    admin.is_super_admin
                      ? 'text-amber-400 hover:bg-amber-500/10'
                      : 'text-white/40 hover:bg-white/[0.08]'
                  }`}
                  title={admin.is_super_admin ? 'Demote from Super Admin' : 'Promote to Super Admin'}
                >
                  <Shield className="w-3.5 h-3.5" />
                </button>
                {admin.email !== 'arfeen306@gmail.com' && (
                  <button
                    onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                    disabled={isPending}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Delete admin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Assigned Subjects */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {admin.is_super_admin && (
                <span className="text-xs text-amber-600 font-medium">⚡ Full access to all subjects</span>
              )}
              {!admin.is_super_admin && admin.managed_subjects.length === 0 && (
                <span className="text-xs text-red-400 italic">⚠ No subjects assigned — cannot access any content</span>
              )}
              {!admin.is_super_admin && admin.managed_subjects.map(sid => (
                <span
                  key={sid}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                >
                  {subjectMap.get(sid) || sid.slice(0, 8)}
                  <button
                    onClick={() => handleRemove(admin.id, sid)}
                    disabled={isPending}
                    className="hover:text-red-600 transition"
                    title="Remove subject"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Assign Subject Dropdown — all 13 subjects from config */}
            {assignTarget === admin.id && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.08]">
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs border border-white/[0.08] rounded-lg bg-white/[0.04] text-white focus:ring-indigo-500"
                >
                  <option value="" disabled>Choose subject…</option>
                  {ALL_SUBJECTS
                    .filter(s => !admin.managed_subjects.includes(s.id))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
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
          <p className="text-sm text-white/40 py-8 text-center">No admin accounts found. Create one above.</p>
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
          <h4 className="font-semibold text-white">Media Widgets</h4>
          <p className="text-xs text-white/40 mt-0.5">YouTube videos &amp; PDF viewers on public pages</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-navy-900 text-white text-xs font-medium rounded-lg hover:bg-white/[0.08] transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Media
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-2 border-dashed border-white/[0.08] rounded-xl space-y-3 bg-white/[0.02]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Page Target *</label>
              <select
                value={form.page_slug}
                onChange={e => setForm({ ...form, page_slug: e.target.value })}
                className="w-full px-3 py-2 border border-white/[0.08] rounded-lg text-sm focus:ring-navy-500 focus:border-white/[0.06]0"
              >
                {PAGE_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1">Media Type *</label>
              <select
                value={form.media_type}
                onChange={e => setForm({ ...form, media_type: e.target.value as 'youtube' | 'pdf' })}
                className="w-full px-3 py-2 border border-white/[0.08] rounded-lg text-sm focus:ring-navy-500 focus:border-white/[0.06]0"
              >
                <option value="youtube">YouTube Video</option>
                <option value="pdf">PDF Document</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-white/[0.08] rounded-lg text-sm focus:ring-navy-500 focus:border-white/[0.06]0"
              placeholder={form.media_type === 'youtube' ? 'e.g. O-Level Paper 1 Walkthrough' : 'e.g. 2024 Specimen Paper'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">
              {form.media_type === 'youtube' ? 'YouTube URL or Video ID *' : 'PDF URL (Supabase Storage) *'}
            </label>
            <input
              required
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 border border-white/[0.08] rounded-lg text-sm font-mono focus:ring-navy-500 focus:border-white/[0.06]0"
              placeholder={form.media_type === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...supabase.co/storage/v1/...'}
            />
          </div>

          {form.media_type === 'pdf' && (
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-white/60">
                <input
                  type="checkbox"
                  checked={form.allow_download}
                  onChange={e => setForm({ ...form, allow_download: e.target.checked })}
                  className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                />
                Allow Download
              </label>
              <label className="flex items-center gap-2 text-xs text-white/60">
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
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-white/50 hover:bg-white/[0.08] rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 text-xs font-medium text-white bg-navy-900 rounded-lg hover:bg-white/[0.08] disabled:opacity-50 transition"
            >
              {isPending ? 'Adding…' : 'Add Widget'}
            </button>
          </div>
        </form>
      )}

      {/* Grouped widgets by page */}
      {grouped.map(group => (
        <div key={group.value}>
          <h5 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{group.label}</h5>
          {group.widgets.length === 0 ? (
            <p className="text-xs text-white/40 italic py-2">No media widgets</p>
          ) : (
            <div className="space-y-2">
              {group.widgets.map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3 min-w-0">
                    {w.media_type === 'youtube' ? (
                      <Video className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{w.title}</p>
                      <p className="text-[11px] text-white/40 font-mono truncate">{w.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-medium text-white/40 px-1.5 py-0.5 rounded bg-white/[0.06]">
                      {w.view_count} views
                    </span>
                    <button
                      onClick={() => handleToggle(w.id, w.is_active)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg hover:bg-white/[0.08] transition"
                      title={w.is_active ? 'Hide' : 'Show'}
                    >
                      {w.is_active ? (
                        <Eye className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-white/30" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition"
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
