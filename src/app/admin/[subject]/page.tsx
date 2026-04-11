import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/supabase/guards';
import { ROUTE_TO_PORTAL, getPortalDbSubjectSlug } from '@/config/admin-portals';
import { provisionSubjectPortal, fetchMergedCategoriesForSubject } from '@/lib/db/subject-provisioner';
import { FileText, Video, BookOpen, TrendingUp, Database } from 'lucide-react';
import SubjectResourceManager from '@/components/admin/SubjectResourceManager';
import SeedDisciplineSubjectsButton from '@/components/admin/SeedDisciplineSubjectsButton';

export const dynamic = 'force-dynamic';

export default async function SubjectAdminPage({
  params,
}: {
  params: { subject: string };
}) {
  const portal = ROUTE_TO_PORTAL[params.subject];
  if (!portal) notFound();

  const supabase = createAdminClient();

  // Resolve the parent subject from the subjects table
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, levels')
    .eq('slug', getPortalDbSubjectSlug(portal))
    .single();

  if (!subject) {
    const session = await getAdminSession();
    const label = portal.label.replace(' Resources', '');
    const slug = getPortalDbSubjectSlug(portal);
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="rounded-xl border border-slate-600/40 bg-slate-950/35 backdrop-blur-md p-6 text-left shadow-inner">
          <div className="flex items-center gap-2 text-amber-400/90 mb-2">
            <Database className="w-5 h-5 shrink-0" aria-hidden />
            <h2 className="text-lg font-semibold text-slate-100">{label} is not in the database yet</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            The portal expects a parent subject row with slug{' '}
            <code className="text-amber-200/90 bg-slate-900/60 px-1.5 py-0.5 rounded text-xs font-mono">{slug}</code>
            {' '}in <code className="text-slate-300 text-xs font-mono">public.subjects</code>.
          </p>
          <ol className="mt-4 text-sm text-slate-400 space-y-2 list-decimal list-inside">
            <li>
              Apply the migration{' '}
              <code className="text-xs font-mono text-slate-300">20260414_seed_discipline_subjects.sql</code> (or run equivalent SQL in Supabase).
            </li>
            <li>
              In <strong className="text-slate-300">Super Admin → Subject Factory</strong>, create the subject if it is still missing.
            </li>
            <li>
              Use <strong className="text-slate-300">Provision hierarchy</strong> on the same page to seed syllabi and default categories for this portal.
            </li>
          </ol>
          {session?.isSuperAdmin ? (
            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
              <SeedDisciplineSubjectsButton returnTo={`/admin/${params.subject}`} />
              <Link
                href="/admin/super"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-amber-500/50 text-amber-200 bg-transparent hover:bg-amber-500/10 transition"
              >
                Open Super Admin
              </Link>
            </div>
          ) : (
            <p className="mt-6 text-xs text-slate-500">
              Ask a super admin to run the migration or provision <span className="text-slate-400">{label}</span>.
            </p>
          )}
        </div>
      </div>
    );
  }

  try {
    const prov = await provisionSubjectPortal(supabase, params.subject);
    if (!prov.success && prov.error) {
      console.error('[admin subject portal] provisionSubjectPortal:', prov.error);
    }
  } catch (e) {
    console.error('[admin subject portal] provisionSubjectPortal threw:', e);
  }

  const { data: mergedCategories, error: mergeCatErr } = await fetchMergedCategoriesForSubject(
    supabase,
    subject.id,
  );
  if (mergeCatErr) {
    console.error('[admin subject portal] fetchMergedCategoriesForSubject:', mergeCatErr);
  }
  const initialCategoryOptions = (mergedCategories ?? []).map((c) => ({ id: c.id, name: c.name }));

  // Fetch all resources for this subject
  const { data: resources, count } = await supabase
    .from('resources')
    .select('*, category:categories(id, name, slug)', { count: 'exact' })
    .eq('subject_id', subject.id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const allResources = (resources ?? []) as any[];
  const totalCount = count ?? 0;

  const pdfCount = allResources.filter(r => r.content_type === 'pdf').length;
  const videoCount = allResources.filter(r => r.content_type === 'video').length;
  const worksheetCount = allResources.filter(r => r.content_type === 'worksheet').length;

  const stats = [
    { label: 'Total Resources', value: totalCount.toString(), icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
    { label: 'Videos', value: videoCount.toString(), icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    { label: 'PDFs', value: pdfCount.toString(), icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    { label: 'Worksheets', value: worksheetCount.toString(), icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          {subject.name} Dashboard
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage resources for{' '}
          {portal.hasALevelSyllabus === false
            ? 'O Level and IGCSE.'
            : `${subject.levels?.length ? subject.levels.join(', ') : 'O Level, A Level, AS Level, and A2 Level'}.`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm flex items-center gap-4"
            >
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)]">{stat.label}</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resource Manager */}
      <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-sm border border-[var(--border-subtle)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {subject.name} Resource Manager
        </h3>
        <SubjectResourceManager
          key={subject.id}
          initialResources={allResources}
          initialCategories={initialCategoryOptions}
          subjectSlug={portal.taxonomyOLevelPaperSlug}
          subjectId={subject.id}
          accentColor={portal.accentColor}
          showModuleTypeFilter={true}
        />
      </div>
    </div>
  );
}
