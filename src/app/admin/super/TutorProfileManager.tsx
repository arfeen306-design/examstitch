'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus, Save, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { assignTutorToAdminUser, deleteTutorProfile, upsertTutorProfile } from './tutor-actions';
import { isStudentAccountAdminRole } from '@/lib/admin/student-account-role';

interface TutorItem {
  id: string;
  full_name: string;
  slug: string;
  thumbnail_url: string | null;
  hook_intro: string | null;
  detailed_bio: string | null;
  video_intro_url: string | null;
  video_demo_url: string | null;
  specialties: string[];
  locations: string[];
  is_verified: boolean;
}

interface AdminItem {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_super_admin: boolean;
  tutor_id: string | null;
}

interface TutorFormState {
  id?: string;
  full_name: string;
  slug: string;
  thumbnail_url: string;
  hook_intro: string;
  detailed_bio: string;
  video_intro_url: string;
  video_demo_url: string;
  specialties: string;
  locations: string;
  is_verified: boolean;
}

function emptyForm(): TutorFormState {
  return {
    full_name: '',
    slug: '',
    thumbnail_url: '',
    hook_intro: '',
    detailed_bio: '',
    video_intro_url: '',
    video_demo_url: '',
    specialties: '',
    locations: '',
    is_verified: false,
  };
}

function toArray(csv: string): string[] {
  return csv.split(',').map((v) => v.trim()).filter(Boolean);
}

export default function TutorProfileManager({ tutors, admins }: { tutors: TutorItem[]; admins: AdminItem[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<TutorFormState>(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [assignment, setAssignment] = useState<Record<string, string>>(() =>
    Object.fromEntries(admins.map((a) => [a.id, a.tutor_id ?? '']))
  );

  const subAdmins = useMemo(
    () => admins.filter((a) => isStudentAccountAdminRole(a.role) && !a.is_super_admin),
    [admins],
  );

  function startCreate() {
    setForm(emptyForm());
    setShowForm(true);
  }

  function startEdit(tutor: TutorItem) {
    setForm({
      id: tutor.id,
      full_name: tutor.full_name,
      slug: tutor.slug,
      thumbnail_url: tutor.thumbnail_url ?? '',
      hook_intro: tutor.hook_intro ?? '',
      detailed_bio: tutor.detailed_bio ?? '',
      video_intro_url: tutor.video_intro_url ?? '',
      video_demo_url: tutor.video_demo_url ?? '',
      specialties: tutor.specialties.join(', '),
      locations: tutor.locations.join(', '),
      is_verified: tutor.is_verified,
    });
    setShowForm(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await upsertTutorProfile({
        id: form.id,
        full_name: form.full_name,
        slug: form.slug,
        thumbnail_url: form.thumbnail_url,
        hook_intro: form.hook_intro,
        detailed_bio: form.detailed_bio,
        video_intro_url: form.video_intro_url,
        video_demo_url: form.video_demo_url,
        specialties: toArray(form.specialties),
        locations: toArray(form.locations),
        is_verified: form.is_verified,
      });
      if (!result.success) {
        showToast({ message: result.error || 'Unable to save tutor profile.', type: 'error' });
        return;
      }
      showToast({ message: form.id ? 'Tutor profile updated.' : 'Tutor profile created.', type: 'success' });
      setForm(emptyForm());
      setShowForm(false);
      router.refresh();
    });
  }

  function handleDelete(tutorId: string, name: string) {
    if (!confirm(`Delete tutor profile "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteTutorProfile(tutorId);
      if (!result.success) {
        showToast({ message: result.error || 'Unable to delete tutor.', type: 'error' });
        return;
      }
      showToast({ message: 'Tutor profile deleted.', type: 'success' });
      router.refresh();
    });
  }

  function handleAssign(adminId: string) {
    startTransition(async () => {
      const selectedTutor = assignment[adminId] || null;
      const result = await assignTutorToAdminUser(adminId, selectedTutor);
      if (!result.success) {
        showToast({ message: result.error || 'Assignment failed.', type: 'error' });
        return;
      }
      showToast({ message: selectedTutor ? 'Tutor assigned to sub-admin.' : 'Tutor assignment removed.', type: 'success' });
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-[var(--text-primary)]">Tutor Profiles</h4>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Professional Scholar palette: navy surfaces with gold highlight actions</p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Tutor
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="p-4 rounded-xl border border-amber-500/40 bg-slate-900/40 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required value={form.full_name} onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))} placeholder="Full Name" className="px-3 py-2 text-sm rounded-lg border border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-400" />
            <input required value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} placeholder="Slug (e.g. sarah-khan)" className="px-3 py-2 text-sm rounded-lg border border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-400" />
          </div>

          <input value={form.thumbnail_url} onChange={(e) => setForm((s) => ({ ...s, thumbnail_url: e.target.value }))} placeholder="Thumbnail URL" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-400" />
          <input value={form.hook_intro} onChange={(e) => setForm((s) => ({ ...s, hook_intro: e.target.value }))} placeholder="Hook Intro" className="w-full px-3 py-2 text-sm rounded-lg border border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-400" />
          <textarea value={form.detailed_bio} onChange={(e) => setForm((s) => ({ ...s, detailed_bio: e.target.value }))} placeholder="Detailed bio" rows={4} className="w-full px-3 py-2 text-sm rounded-lg border border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-400" />

          <div className="grid grid-cols-2 gap-3">
            <input value={form.video_intro_url} onChange={(e) => setForm((s) => ({ ...s, video_intro_url: e.target.value }))} placeholder="Google Drive intro video URL" className="px-3 py-2 text-sm rounded-lg border border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-400" />
            <input value={form.video_demo_url} onChange={(e) => setForm((s) => ({ ...s, video_demo_url: e.target.value }))} placeholder="Google Drive demo video URL" className="px-3 py-2 text-sm rounded-lg border border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input value={form.specialties} onChange={(e) => setForm((s) => ({ ...s, specialties: e.target.value }))} placeholder="Specialties (comma separated)" className="px-3 py-2 text-sm rounded-lg border border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-400" />
            <input value={form.locations} onChange={(e) => setForm((s) => ({ ...s, locations: e.target.value }))} placeholder="Locations (comma separated)" className="px-3 py-2 text-sm rounded-lg border border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-400" />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-100">
            <input type="checkbox" checked={form.is_verified} onChange={(e) => setForm((s) => ({ ...s, is_verified: e.target.checked }))} className="rounded border-slate-500 bg-slate-950 text-amber-400 focus:ring-amber-300" />
            Verified tutor
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-slate-600">Cancel</button>
            <button disabled={isPending} type="submit" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 disabled:opacity-50">
              <Save className="w-3.5 h-3.5" /> Save Tutor
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {tutors.map((t) => (
          <div key={t.id} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{t.full_name}</p>
                <p className="text-xs text-[var(--text-muted)]">/{t.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                {t.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300">
                    <Check className="w-3 h-3" /> VERIFIED
                  </span>
                )}
                <button onClick={() => startEdit(t)} className="px-2.5 py-1 text-xs rounded-lg border border-amber-500/40 text-amber-300">Edit</button>
                <button onClick={() => handleDelete(t.id, t.full_name)} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-red-500/40 text-red-300">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
            {t.hook_intro && <p className="text-xs text-[var(--text-secondary)] mt-2">{t.hook_intro}</p>}
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <h5 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Assign Tutor Profile to Sub-Admins</h5>
        <div className="space-y-2">
          {subAdmins.map((admin) => (
            <div key={admin.id} className="flex items-center gap-2">
              <div className="w-52 text-xs text-[var(--text-primary)] truncate">{admin.full_name}</div>
              <select
                value={assignment[admin.id] ?? ''}
                onChange={(e) => setAssignment((prev) => ({ ...prev, [admin.id]: e.target.value }))}
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)]"
              >
                <option value="">Unassigned</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
              <button
                onClick={() => handleAssign(admin.id)}
                disabled={isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-amber-500 text-slate-950 font-semibold disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
