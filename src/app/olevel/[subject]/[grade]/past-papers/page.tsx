import { Suspense } from 'react';
import Link from 'next/link';
import ResourceGrid from '@/components/resources/ResourceGrid';
import type { ResourceItem } from '@/components/resources/ResourceGrid';
import PortalResourceStreamSection from '@/components/resources/PortalResourceStreamSection';
import { PORTAL_RESOURCE_STREAMS } from '@/lib/init-subject';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import { getSubjectLabel } from '@/config/navigation';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatGrade(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
  if (!isSupabaseConfigured()) {
    return (
      <ResourceGrid
        resources={DEMO_PAPERS.map((p) => ({ ...p, href: p.href.startsWith('#') ? `${basePath}/${p.href.slice(1)}` : p.href }))}
        emptyTitle="No past papers yet"
        emptyMessage="Connect Supabase and upload your first paper to see it here."
      />
    );
  }

  return (
    <PortalResourceStreamSection
      subjectSlug={subject}
      categorySlug={grade}
      moduleType={PORTAL_RESOURCE_STREAMS.solvedPastPapers}
      layout="past-paper-cards"
      basePath={basePath}
    />
  );
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
      <div className="portal-page-body portal-surface-navy max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        {/* Filters */}
        <div className="rounded-2xl p-4 mb-6 flex flex-wrap gap-3 portal-glass-card">
          <select className="px-3 py-2 text-sm rounded-xl portal-glass-select focus:outline-none focus:border-amber-400/50">
            <option>All Years</option>
            <option>2024</option><option>2023</option><option>2022</option><option>2021</option>
          </select>
          <select className="px-3 py-2 text-sm rounded-xl portal-glass-select focus:outline-none focus:border-amber-400/50">
            <option>All Sessions</option>
            <option>May/June</option><option>Oct/Nov</option><option>Feb/Mar</option>
          </select>
          <select className="px-3 py-2 text-sm rounded-xl portal-glass-select focus:outline-none focus:border-amber-400/50">
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
