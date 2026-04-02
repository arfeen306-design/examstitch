'use client';

import { useState, useTransition } from 'react';
import { Plus, UserPlus, X, Trash2 } from 'lucide-react';
import { createSubject, assignSubjectToAdmin, removeSubjectFromAdmin } from './actions';
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

export default function SuperAdminClient({
  subjects: initialSubjects,
  admins: initialAdmins,
}: {
  subjects: Subject[];
  admins: Admin[];
}) {
  const [tab, setTab] = useState<'subjects' | 'admins'>('subjects');

  const tabs = [
    { id: 'subjects' as const, label: 'Subject Factory' },
    { id: 'admins' as const, label: 'Admin Manager' },
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
        ) : (
          <AdminManager admins={initialAdmins} subjects={initialSubjects} />
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
