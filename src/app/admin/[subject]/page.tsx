import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAdminSession } from '@/lib/supabase/guards';
import { ROUTE_TO_PORTAL, getPortalDbSubjectSlug } from '@/config/taxonomy';
import { resolveDisciplineSubjectForPortal } from '@/lib/admin/portal-resolver';
import { provisionSubjectPortal, fetchMergedCategoriesForSubject } from '@/lib/db/subject-provisioner';
import { oLevelToALevelSlug } from '@/config/navigation';
import { FileText, Video, BookOpen, TrendingUp, Database } from 'lucide-react';
import SubjectResourceManager from '@/components/admin/SubjectResourceManager';
import SeedDisciplineSubjectsButton from '@/components/admin/SeedDisciplineSubjectsButton';
import QuickSetupButton from '@/components/admin/QuickSetupButton';

export const dynamic = 'force-dynamic';

export default async function SubjectAdminPage({
  params,
}: {
  params: { subject: string };
}) {
  const portal = ROUTE_TO_PORTAL[params.subject];
  if (!portal) notFound();

  const supabase = createAdminClient();

  // Resolve the parent subject. Phase 2.1: a portal may map to multiple legacy
  // DB slugs (e.g. 'maths' AND 'math'); resolveDisciplineSubjectForPortal
  // walks them in priority order. The dashboard then keys every downstream
  // query off the resolved UUID — never a slug — so it is robust to whichever
  // historic slug form actually exists in production.
  const subject = await resolveDisciplineSubjectForPortal(supabase, portal);

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

  // ── PARALLEL FETCH (Phase 2.1 perf fix) ─────────────────────────────────
  // Was: 6 sequential awaits + provisionSubjectPortal on every render
  // (~10-20 nested round-trips). Now: one Promise.all.
  //
  // Provisioner skipped on the hot path entirely — it only needs to run when
  // a subject portal has no categories yet. We detect that AFTER the parallel
  // fetch and only re-run if necessary, so the common case (subject already
  // configured) pays zero provisioning cost.
  const [
    mergedRes,
    papersRes,
    topicsRes,
    resourcesRes,
  ] = await Promise.all([
    fetchMergedCategoriesForSubject(supabase, subject.id),
    supabase
      .from('subject_papers')
      .select('id, slug')
      .eq('parent_subject_id', subject.id),
    supabase
      .from('topics')
      .select('id, subject_papers!inner(parent_subject_id)')
      .eq('subject_papers.parent_subject_id', subject.id),
    // Resources query: NO categories self-join. The previous embed
    // `parent:categories!categories_parent_id_fkey(...)` triggered PostgREST
    // schema-cache failures ("Could not find a relationship between
    // 'categories' and 'categories' in the schema cache") on every dashboard
    // load. The downstream code (SubjectResourceManager + ResourceGridClient)
    // only reads `category.parent_id` (the FK column), never the nested
    // `category.parent.{name,slug}`, so the embed was always dead weight.
    // Drop it entirely → no self-reference → no cache fragility.
    supabase
      .from('resources')
      .select(
        `
        *,
        category:categories(
          id, name, slug, parent_id, subject_id, syllabus_id, syllabus_tier_id,
          syllabus:subject_papers(slug, code, name),
          syllabus_tier:syllabi(id, tier, name)
        )
      `,
        { count: 'exact' },
      )
      .eq('subject_id', subject.id)
      .order('syllabus_id', { ascending: true, nullsFirst: true })
      .order('category_id', { ascending: true })
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
  ]);

  let mergedCategories = mergedRes.data;
  if (mergedRes.error) {
    console.error('[admin subject portal] fetchMergedCategoriesForSubject:', mergedRes.error);
  }

  // Lazy provisioning: only run when zero categories exist. Idempotent — safe
  // to call but expensive (~10-20 round-trips). Skipping when categories
  // already exist drops common-case page load by ~1-2s.
  if (!mergedCategories || mergedCategories.length === 0) {
    try {
      const prov = await provisionSubjectPortal(supabase, params.subject);
      if (!prov.success && prov.error) {
        console.error('[admin subject portal] provisionSubjectPortal:', prov.error);
      } else if (prov.success && (prov.categoriesCreated ?? 0) > 0) {
        // Refetch only after a real provisioning event populated rows.
        const refetched = await fetchMergedCategoriesForSubject(supabase, subject.id);
        if (!refetched.error) mergedCategories = refetched.data;
      }
    } catch (e) {
      console.error('[admin subject portal] provisionSubjectPortal threw:', e);
    }
  }

  const initialCategoryOptions = (mergedCategories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parent_id: c.parent_id ?? null,
    syllabus_id: c.syllabus_id ?? null,
    syllabus_tier_id: c.syllabus_tier_id ?? null,
  }));

  const subjectPapers = papersRes.data;
  const oLevelPaperId =
    subjectPapers?.find((p) => p.slug === portal.taxonomyOLevelPaperSlug)?.id ?? null;
  const aLevelSlug = oLevelToALevelSlug[portal.taxonomyOLevelPaperSlug];
  const aLevelPaperId =
    aLevelSlug && subjectPapers?.length
      ? subjectPapers.find((p) => p.slug === aLevelSlug)?.id ?? null
      : null;

  const topics = topicsRes.data;
  const isUnconfiguredSubject = (topics ?? []).length === 0;

  const { data: resources, count, error: resourcesError } = resourcesRes;
  const resourceFetchWarning = resourcesError
    ? `Resource query failed: ${resourcesError.message}`
    : null;
  if (resourcesError) {
    console.error('[admin subject portal] resources query failed:', resourcesError.message);
  }

  const allResources = (resources ?? []) as any[];
  const totalCount = count ?? 0;

  if (process.env.NODE_ENV === 'development') {
    console.info(
      `[admin/${params.subject}] discipline subject_id=${subject.id} resources fetched=${allResources.length} (count header=${totalCount})`,
    );
  }

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          {subject.name} Dashboard
        </h2>
        {isUnconfiguredSubject ? (
          <QuickSetupButton subjectId={subject.id} portalRouteSegment={params.subject} />
        ) : null}
        <p className="w-full text-sm text-[var(--text-muted)] mt-1">
          Manage resources for{' '}
          {portal.hasALevelSyllabus === false
            ? 'O Level and IGCSE.'
            : `${subject.levels?.length ? subject.levels.join(', ') : 'O Level, A Level, AS Level, and A2 Level'}.`}
        </p>
        {resourceFetchWarning ? (
          <p className="w-full text-xs text-amber-300 mt-1">{resourceFetchWarning}</p>
        ) : null}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-slate-900/30 backdrop-blur-md border border-slate-700/40 rounded-2xl p-6 shadow-sm flex items-center gap-4"
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
      <div className="bg-slate-900/30 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-700/40">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {subject.name} Resource Manager
        </h3>
        <SubjectResourceManager
          key={subject.id}
          initialResources={allResources}
          initialCategories={initialCategoryOptions}
          subjectSlug={portal.taxonomyOLevelPaperSlug}
          subjectId={subject.id}
          disciplineName={subject.name}
          oLevelPaperId={oLevelPaperId}
          aLevelPaperId={aLevelPaperId}
          accentColor={portal.accentColor}
          showModuleTypeFilter={true}
        />
      </div>
    </div>
  );
}
