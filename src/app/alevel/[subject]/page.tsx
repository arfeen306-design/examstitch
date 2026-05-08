import { aLevelPapersBySubject, aLevelPapers, getSubjectLabel, getSubjectHeading, type PaperConfig } from '@/config/navigation';
import { getCategoryBySlug, getPublishedResourcesByModuleStream } from '@/lib/supabase/queries';
import { PORTAL_RESOURCE_STREAMS } from '@/lib/init-subject';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import type { LearningModule } from '@/components/resources/UnifiedModuleGrid';
import type { ResourceItem } from '@/components/resources/ResourceGrid';
import ALevelSPADashboard, { type PaperSpaData } from '@/components/alevel/ALevelSPADashboard';
import type { Resource } from '@/lib/supabase/types';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [{ subject: 'mathematics-9709' }];
}

// Demo past papers shown when Supabase is not configured
const DEMO_PAPERS: ResourceItem[] = [
  { id: 'd1', title: 'May/June 2024 — Variant 1', contentType: 'pdf', href: '#', year: 2024, session: 'May/June', variant: 1 },
  { id: 'd2', title: 'May/June 2024 — Variant 2', contentType: 'pdf', href: '#', year: 2024, session: 'May/June', variant: 2 },
  { id: 'd3', title: 'Oct/Nov 2023 — Variant 2',  contentType: 'pdf', href: '#', year: 2023, session: 'Oct/Nov',  variant: 2 },
  { id: 'd4', title: 'May/June 2023 — Variant 1', contentType: 'pdf', href: '#', year: 2023, session: 'May/June', variant: 1 },
];

async function fetchPaperData(
  subject: string,
  paper: PaperConfig,
  level: 'as-level' | 'a2-level',
): Promise<PaperSpaData> {
  const base: PaperSpaData = {
    slug: paper.slug,
    label: paper.label,
    description: paper.description,
    level,
    videoModules: [],
    pastPapers: [],
  };

  if (!isSupabaseConfigured()) {
    return { ...base, pastPapers: DEMO_PAPERS };
  }

  try {
    const category = await getCategoryBySlug(subject, paper.slug);
    if (!category) return base;

    const [videoResources, paperResources] = await Promise.all([
      getPublishedResourcesByModuleStream(category.id, PORTAL_RESOURCE_STREAMS.videoLectures),
      getPublishedResourcesByModuleStream(category.id, PORTAL_RESOURCE_STREAMS.solvedPastPapers),
    ]);

    const videoModules: LearningModule[] = videoResources.map((r) => ({
      id: r.id,
      title: r.title,
      videoUrl: r.source_url,
      worksheetUrl: (r as Resource & { worksheet_url?: string | null }).worksheet_url ?? null,
      isLocked: (r as Resource & { is_locked?: boolean }).is_locked ?? false,
      parentResourceId: (r as Resource & { parent_resource_id?: string | null }).parent_resource_id ?? null,
    }));

    const pastPapers: ResourceItem[] = paperResources.map((r) => {
      const es = (r as Resource & {
        exam_series?: { year: number; session: string; variant: number } | null;
      }).exam_series;
      return {
        id: r.id,
        title: r.title,
        description: r.description ?? undefined,
        contentType: r.content_type,
        href: `/view/${r.id}`,
        year: es?.year,
        session: es?.session,
        variant: es?.variant,
        isLocked: (r as Resource & { is_locked?: boolean }).is_locked ?? false,
      };
    });

    return { ...base, videoModules, pastPapers };
  } catch {
    return base;
  }
}

export default async function ALevelSubjectPage({ params }: { params: { subject: string } }) {
  const papersBySub = aLevelPapersBySubject[params.subject] ?? aLevelPapers;

  const [asPapers, a2Papers] = await Promise.all([
    Promise.all(papersBySub['as-level'].map((p) => fetchPaperData(params.subject, p, 'as-level'))),
    Promise.all(papersBySub['a2-level'].map((p) => fetchPaperData(params.subject, p, 'a2-level'))),
  ]);

  return (
    <ALevelSPADashboard
      subject={params.subject}
      heading={getSubjectHeading(params.subject)}
      label={getSubjectLabel(params.subject)}
      asPapers={asPapers}
      a2Papers={a2Papers}
    />
  );
}
