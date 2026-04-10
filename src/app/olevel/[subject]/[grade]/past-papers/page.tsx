import { Suspense } from 'react';
import Link from 'next/link';
import ResourceGrid from '@/components/resources/ResourceGrid';
import { getCategoryBySlug, getResourcesByCategory } from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import type { Resource } from '@/lib/supabase/types';
import type { ResourceItem } from '@/components/resources/ResourceGrid';
import { getSubjectLabel } from '@/config/navigation';
import { isAdminRequest } from '@/lib/admin-mode';
import { CONTENT_TYPES, MODULE_TYPES } from '@/lib/constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatGrade(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function toResourceItem(resource: Resource, basePath: string, adminBypass = false): ResourceItem {
  const examSeries = (resource as Resource & {
    exam_series?: { year: number; session: string; variant: number } | null;
  }).exam_series;
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description ?? undefined,
    contentType: resource.content_type,
    href: `/view/${resource.id}`,
    year: examSeries?.year,
    session: examSeries?.session,
    variant: examSeries?.variant,
    subject: resource.subject,
    isLocked: adminBypass ? false : ((resource as any).is_locked ?? false),
  };
}

// Demo papers shown while Supabase is not yet connected
const DEMO_PAPERS: ResourceItem[] = [
  { id: 'd1', title: 'May/June 2024 — Paper 1 Variant 1', contentType: 'pdf', href: '#may-june-2024-p1-v1', year: 2024, session: 'May/June', variant: 1, subject: 'Mathematics 4024/0580' },
  { id: 'd2', title: 'May/June 2024 — Paper 2 Variant 1', contentType: 'pdf', href: '#may-june-2024-p2-v1', year: 2024, session: 'May/June', variant: 1, subject: 'Mathematics 4024/0580' },
  { id: 'd3', title: 'Oct/Nov 2023 — Paper 1 Variant 2', contentType: 'pdf', href: '#oct-nov-2023-p1-v2', year: 2023, session: 'Oct/Nov',  variant: 2, subject: 'Mathematics 4024/0580' },
  { id: 'd4', title: 'Oct/Nov 2023 — Paper 2 Variant 2', contentType: 'pdf', href: '#oct-nov-2023-p2-v2', year: 2023, session: 'Oct/Nov',  variant: 2, subject: 'Mathematics 4024/0580' },
  { id: 'd5', title: 'May/June 2023 — Paper 1 Variant 1', contentType: 'pdf', href: '#may-june-2023-p1-v1', year: 2023, session: 'May/June', variant: 1, subject: 'Mathematics 4024/0580' },
  { id: 'd6', title: 'Feb/Mar 2023 — Paper 1 Variant 2', contentType: 'pdf', href: '#feb-mar-2023-p1-v2',  year: 2023, session: 'Feb/Mar', variant: 2, subject: 'Mathematics 4024/0580' },
];

// ── Async data component ──────────────────────────────────────────────────────

async function PastPapersGrid({
  subject,
  grade,
  basePath,
}: {
  subject: string;
  grade: string;
  basePath: string;
}) {
  // Return demo data while Supabase isn't configured yet
  if (!isSupabaseConfigured()) {
    return (
      <ResourceGrid
        resources={DEMO_PAPERS.map((p) => ({ ...p, href: p.href.startsWith('#') ? `${basePath}/${p.href.slice(1)}` : p.href }))}
        emptyTitle="No past papers yet"
        emptyMessage="Connect Supabase and upload your first paper to see it here."
      />
    );
  }

  try {
    const category = await getCategoryBySlug(subject, grade);

    if (!category) {
      return (
        <ResourceGrid
          resources={[]}
          emptyTitle="Category not found"
          emptyMessage="Run the SQL migrations to create the grade categories."
        />
      );
    }

    const resources = await getResourcesByCategory(category.id, CONTENT_TYPES.PDF, MODULE_TYPES.SOLVED_PAST_PAPER);
    const bypass = isAdminRequest();
    const items: ResourceItem[] = resources.map((r) => toResourceItem(r, basePath, bypass));

    return (
      <ResourceGrid
        resources={items}
        emptyTitle="No past papers yet"
        emptyMessage="Upload your first past paper via the admin dashboard."
      />
    );
  } catch (err) {
    console.error('PastPapersGrid error:', err);
    return (
      <ResourceGrid
        resources={DEMO_PAPERS}
        emptyTitle="Database error"
        emptyMessage="Could not load papers. Showing demo data."
      />
    );
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PastPapersPage({
  params,
}: {
  params: { subject: string; grade: string };
}) {
  const gradeName = formatGrade(params.grade);
  const basePath = `/olevel/${params.subject}/${params.grade}/past-papers`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level / IGCSE</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">{getSubjectLabel(params.subject)}</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}/${params.grade}`} className="text-white/50 hover:text-white/70 transition-colors">{gradeName}</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">Solved Past Papers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {gradeName} — Solved Past Papers
          </h1>
          <p className="text-white/60">
            Official Cambridge past papers. Click any paper to view, print, or download.
          </p>
        </div>
      </div>

      {/* Filters + Grid */}
      <div className="portal-page-body max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        {/* Filters */}
        <div className="rounded-2xl p-4 mb-6 flex flex-wrap gap-3
                        bg-white/[0.06] backdrop-blur-xl border border-white/[0.1]">
          <select className="px-3 py-2 text-sm rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/70 focus:outline-none focus:border-gold-500/50">
            <option>All Years</option>
            <option>2024</option><option>2023</option><option>2022</option><option>2021</option>
          </select>
          <select className="px-3 py-2 text-sm rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/70 focus:outline-none focus:border-gold-500/50">
            <option>All Sessions</option>
            <option>May/June</option><option>Oct/Nov</option><option>Feb/Mar</option>
          </select>
          <select className="px-3 py-2 text-sm rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/70 focus:outline-none focus:border-gold-500/50">
            <option>All Variants</option>
            <option>Variant 1</option><option>Variant 2</option><option>Variant 3</option>
          </select>
        </div>

        <Suspense fallback={<ResourceGrid resources={[]} isLoading={true} />}>
          <PastPapersGrid subject={params.subject} grade={params.grade} basePath={basePath} />
        </Suspense>
      </div>
    </div>
  );
}
