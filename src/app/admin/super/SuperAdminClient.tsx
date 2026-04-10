'use client';

import { useState, useTransition, memo, Suspense, useDeferredValue } from 'react';
import { Plus, UserPlus, X, Trash2, Video, FileText, Eye, EyeOff, Shield } from 'lucide-react';
import { createSubject, assignSubjectToAdmin, removeSubjectFromAdmin, createAdminAccount, deleteAdminAccount, toggleSuperAdmin } from './actions';
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
  view_count: number;
  created_at: string;
}

// ── Tab loading skeleton ─────────────────────────────────────────────────────
function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-[var(--bg-surface)] rounded-xl w-1/3" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-[var(--bg-surface)] rounded-xl" />
        ))}
      </div>
    </div>
  );
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
  const deferredTab = useDeferredValue(tab);

  const tabs = [
    { id: 'subjects' as const, label: 'Subject Factory', icon: '🏭' },
    { id: 'admins' as const, label: 'Admin Manager', icon: '👥' },
    { id: 'media' as const, label: 'Media Manager', icon: '🎬' },
  ];

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-visible">
      {/* Tabs — sticky at top */}
      <div className="border-b border-[var(--border-subtle)] flex sticky top-0 z-10 bg-[var(--bg-elevated)] rounded-t-2xl">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-4 py-3.5 text-sm font-medium transition-all duration-100 relative ${
              tab === t.id
                ? 'text-[var(--text-primary)] bg-[var(--bg-elevated)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
            {tab === t.id && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        <Suspense fallback={<TabSkeleton />}>
          {deferredTab === 'subjects' ? (
            <SubjectFactory subjects={initialSubjects} />
          ) : deferredTab === 'admins' ? (
            <AdminManager admins={initialAdmins} subjects={initialSubjects} />
          ) : (
            <MediaManager widgets={initialMedia} />
          )}
        </Suspense>
      </div>
    </div>
  );
}

// ── Subject Factory ─────────────────────────────────────────────────────────

const LEVEL_OPTIONS = ['Pre-O', 'O Level', 'A Level', 'AS Level', 'A2 Level'] as const;

const SubjectFactory = memo(function SubjectFactory({ subjects }: { subjects: Subject[] }) {
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
          <h4 className="font-semibold text-[var(--text-primary)]">Active Subjects</h4>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{subjects.length} configured</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          New Subject
        </button>
      </div>

      <div className="space-y-2">
        {subjects.map(s => (
          <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
              <p className="text-xs text-[var(--text-muted)] font-mono">/{s.slug}</p>
            </div>
            <div className="flex gap-1.5">
              {s.levels?.map(l => (
                <span key={l} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
                  {l}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-2 border-dashed border-violet-500/20 rounded-xl space-y-3 bg-violet-500/[0.03]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Subject Name *</label>
              <input
                required
                value={form.name}
                onChange={e => handleAutoSlug(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-violet-500 focus:border-violet-500/40"
                placeholder="e.g. Physics"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">URL Slug</label>
              <input
                required
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm font-mono bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-violet-500 focus:border-violet-500/40"
                placeholder="physics"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Levels *</label>
            <div className="flex flex-wrap gap-2">
              {LEVEL_OPTIONS.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                    form.levels.includes(level)
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-violet-400/40'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || form.levels.length === 0}
              className="px-4 py-1.5 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {isPending ? 'Creating…' : 'Create Subject'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
});

// ── Categorized Subject Picker (O-Level / A-Level tabs) ─────────────────────

function CategorizedSubjectPicker({
  subjects,
  selected,
  onToggle,
}: {
  subjects: Subject[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [level, setLevel] = useState<'olevel' | 'alevel'>('olevel');
  const availableSubjects = subjects.filter((s) => {
    const levels = (s.levels || []).map((l) => l.toLowerCase());
    if (level === 'olevel') return levels.some((l) => l.includes('o level') || l.includes('igcse'));
    return levels.some((l) => l.includes('a level') || l.includes('as level') || l.includes('a2 level'));
  });

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Assign Subjects *</label>

      {/* O-Level / A-Level toggle */}
      <div className="flex gap-1 mb-3 p-0.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] w-fit">
        <button
          type="button"
          onClick={() => setLevel('olevel')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            level === 'olevel'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          O-Level / IGCSE
        </button>
        <button
          type="button"
          onClick={() => setLevel('alevel')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            level === 'alevel'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          A-Level
        </button>
      </div>

      {/* Subjects grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableSubjects.map(s => {
          const isSelected = selected.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggle(s.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left ${
                isSelected
                  ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/40 ring-1 ring-indigo-500/20'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-indigo-400/30 hover:bg-[var(--bg-surface)]'
              }`}
            >
              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                isSelected ? 'bg-indigo-500 text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
              }`}>
                {isSelected ? '✓' : s.name.charAt(0)}
              </span>
                  <span className="flex-1 truncate">{s.name}</span>
            </button>
          );
        })}
      </div>

      {/* Selected summary */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--text-muted)] font-medium self-center mr-1">{selected.length} selected:</span>
          {selected.map(sid => {
            const subj = subjects.find(s => s.id === sid);
            return (
              <span
                key={sid}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
              >
                {subj?.name || sid}
                <button type="button" onClick={() => onToggle(sid)} className="hover:text-red-400 transition">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-[var(--text-muted)] mt-2">Admin can only manage resources for assigned subjects. O-Level and A-Level subjects have separate IDs.</p>
    </div>
  );
}

// ── Categorized Assign Dropdown ─────────────────────────────────────────────

function CategorizedAssignDropdown({
  subjects,
  excludeIds,
  onSelect,
  isPending,
  onAssign,
}: {
  subjects: Subject[];
  excludeIds: string[];
  onSelect: (id: string) => void;
  isPending: boolean;
  onAssign: () => void;
}) {
  const [level, setLevel] = useState<'olevel' | 'alevel'>('olevel');
  const [selectedSubject, setSelectedSubject] = useState('');
  const levelSubjects = subjects.filter((s) => {
    const levels = (s.levels || []).map((l) => l.toLowerCase());
    if (level === 'olevel') return levels.some((l) => l.includes('o level') || l.includes('igcse'));
    return levels.some((l) => l.includes('a level') || l.includes('as level') || l.includes('a2 level'));
  });
  const available = levelSubjects.filter(s => !excludeIds.includes(s.id));

  return (
    <div className="space-y-2">
      {/* Level tabs */}
      <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] w-fit">
        <button
          type="button"
          onClick={() => { setLevel('olevel'); setSelectedSubject(''); }}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
            level === 'olevel' ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          O-Level
        </button>
        <button
          type="button"
          onClick={() => { setLevel('alevel'); setSelectedSubject(''); }}
          className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
            level === 'alevel' ? 'bg-purple-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          }`}
        >
          A-Level
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedSubject}
          onChange={e => { setSelectedSubject(e.target.value); onSelect(e.target.value); }}
          className="flex-1 px-2 py-1.5 text-xs border border-[var(--border-color)] rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] focus:ring-indigo-500"
        >
          <option value="" disabled>
            {available.length === 0 ? `All ${level === 'olevel' ? 'O-Level' : 'A-Level'} assigned` : 'Choose subject…'}
          </option>
          {available.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onAssign}
          disabled={isPending || !selectedSubject}
          className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isPending ? '…' : 'Add'}
        </button>
      </div>
    </div>
  );
}

// ── Admin Manager ───────────────────────────────────────────────────────────

const AdminManager = memo(function AdminManager({ admins, subjects }: { admins: Admin[]; subjects: Subject[] }) {
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

  // DB subjects are source of truth for managed_subjects (UUIDs)
  const subjectMap = new Map<string, string>();
  for (const s of subjects) subjectMap.set(s.id, s.name);

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
          <h4 className="font-semibold text-[var(--text-primary)]">Admin Users</h4>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{admins.length} admin{admins.length !== 1 ? 's' : ''} · Manage access &amp; subject assignments</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Create Admin
        </button>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateAdmin} className="p-5 border-2 border-dashed border-indigo-500/20 rounded-xl space-y-4 bg-indigo-500/[0.03]">
          <p className="text-sm font-semibold text-[var(--text-primary)]">New Admin Account</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Full Name *</label>
              <input
                required
                value={newAdmin.full_name}
                onChange={e => setNewAdmin({ ...newAdmin, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-indigo-500 focus:border-indigo-500/40"
                placeholder="e.g. Sarah Khan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email *</label>
              <input
                required
                type="email"
                value={newAdmin.email}
                onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-indigo-500 focus:border-indigo-500/40"
                placeholder="teacher@school.edu"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Temporary Password *</label>
            <input
              required
              type="text"
              value={newAdmin.password}
              onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm font-mono bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-indigo-500 focus:border-indigo-500/40"
              placeholder="Min 6 characters — share with the teacher securely"
              minLength={6}
            />
          </div>

          {/* Categorized Subject Picker with O-Level / A-Level tabs */}
          <CategorizedSubjectPicker
            subjects={subjects}
            selected={newAdmin.managed_subjects}
            onToggle={toggleNewAdminSubject}
          />

          {/* Super Admin Toggle */}
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={newAdmin.is_super_admin}
              onChange={e => setNewAdmin({ ...newAdmin, is_super_admin: e.target.checked })}
              className="rounded border-[var(--border-color)] bg-[var(--bg-elevated)] text-indigo-600 focus:ring-indigo-500"
            />
            <span>Grant Super Admin access <span className="text-[var(--text-muted)]">(full platform control)</span></span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowCreateForm(false)} className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] rounded-lg transition">
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

      {/* Admin List — scrollable container */}
      <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {admins.map(admin => (
          <div key={admin.id} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            {/* Admin Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                  admin.is_super_admin ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {admin.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {admin.full_name}
                    {admin.is_super_admin && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400">
                        SUPER ADMIN
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">{admin.email}</p>
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
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'
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
                <span className="text-xs text-amber-400 font-medium">Full access to all subjects</span>
              )}
              {!admin.is_super_admin && admin.managed_subjects.length === 0 && (
                <span className="text-xs text-red-400 italic">No subjects assigned — cannot access any content</span>
              )}
              {!admin.is_super_admin && admin.managed_subjects.map(sid => (
                <span
                  key={sid}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                >
                  {subjectMap.get(sid) || sid.slice(0, 12)}
                  <button
                    onClick={() => handleRemove(admin.id, sid)}
                    disabled={isPending}
                    className="hover:text-red-400 transition"
                    title="Remove subject"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Categorized Assign Dropdown with O-Level / A-Level tabs */}
            {assignTarget === admin.id && (
              <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                <CategorizedAssignDropdown
                  subjects={subjects}
                  excludeIds={admin.managed_subjects}
                  onSelect={setSelectedSubject}
                  isPending={isPending}
                  onAssign={() => handleAssign(admin.id)}
                />
              </div>
            )}
          </div>
        ))}

        {admins.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] py-8 text-center">No admin accounts found. Create one above.</p>
        )}
      </div>
    </div>
  );
});

// ── Media Manager ───────────────────────────────────────────────────────────

const PAGE_OPTIONS = [
  { value: 'home', label: 'Home Page' },
  { value: 'blog', label: 'Blog' },
  { value: 'pre-o-level', label: 'Pre O-Level' },
] as const;

const MediaManager = memo(function MediaManager({ widgets }: { widgets: MediaWidgetItem[] }) {
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
          <h4 className="font-semibold text-[var(--text-primary)]">Media Widgets</h4>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">YouTube videos &amp; PDF viewers on public pages</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Media
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 border-2 border-dashed border-violet-500/20 rounded-xl space-y-3 bg-violet-500/[0.03]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Page Target *</label>
              <select
                value={form.page_slug}
                onChange={e => setForm({ ...form, page_slug: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] focus:ring-violet-500 focus:border-violet-500/40"
              >
                {PAGE_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Media Type *</label>
              <select
                value={form.media_type}
                onChange={e => setForm({ ...form, media_type: e.target.value as 'youtube' | 'pdf' })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] focus:ring-violet-500 focus:border-violet-500/40"
              >
                <option value="youtube">YouTube Video</option>
                <option value="pdf">PDF Document</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-violet-500 focus:border-violet-500/40"
              placeholder={form.media_type === 'youtube' ? 'e.g. O-Level Paper 1 Walkthrough' : 'e.g. 2024 Specimen Paper'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              {form.media_type === 'youtube' ? 'YouTube URL or Video ID *' : 'PDF URL (Supabase Storage) *'}
            </label>
            <input
              required
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm font-mono bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-violet-500 focus:border-violet-500/40"
              placeholder={form.media_type === 'youtube' ? 'https://youtube.com/watch?v=...' : 'https://...supabase.co/storage/v1/...'}
            />
          </div>

          {form.media_type === 'pdf' && (
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.allow_download}
                  onChange={e => setForm({ ...form, allow_download: e.target.checked })}
                  className="rounded border-[var(--border-color)] bg-[var(--bg-elevated)] text-violet-600 focus:ring-violet-500"
                />
                Allow Download
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.allow_print}
                  onChange={e => setForm({ ...form, allow_print: e.target.checked })}
                  className="rounded border-[var(--border-color)] bg-[var(--bg-elevated)] text-violet-600 focus:ring-violet-500"
                />
                Allow Print
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] rounded-lg transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {isPending ? 'Adding…' : 'Add Widget'}
            </button>
          </div>
        </form>
      )}

      {grouped.map(group => (
        <div key={group.value}>
          <h5 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{group.label}</h5>
          {group.widgets.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic py-2">No media widgets</p>
          ) : (
            <div className="space-y-2">
              {group.widgets.map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3 min-w-0">
                    {w.media_type === 'youtube' ? (
                      <Video className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{w.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">{w.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-medium text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]">
                      {w.view_count} views
                    </span>
                    <button
                      onClick={() => handleToggle(w.id, w.is_active)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition"
                      title={w.is_active ? 'Hide' : 'Show'}
                    >
                      {w.is_active ? (
                        <Eye className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-[var(--text-muted)]" />
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
});
