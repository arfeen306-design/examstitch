import { oLevelGrades, getSubjectLabel, getSubjectHeading } from '@/config/navigation';
import { getCategoryBySlug, getPublishedResourcesByModuleStream, getTopicsByCategory } from '@/lib/supabase/queries';
import { PORTAL_RESOURCE_STREAMS } from '@/lib/init-subject';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import type { LearningModule } from '@/components/resources/UnifiedModuleGrid';
import type { ResourceItem } from '@/components/resources/ResourceGrid';
import OLevelSPADashboard, { type GradeSpaData } from '@/components/olevel/OLevelSPADashboard';
import type { Resource } from '@/lib/supabase/types';
import { getWorksheetsForGrade } from '@/lib/worksheets-registry';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [{ subject: 'mathematics-4024' }];
}

// Grades that include solved past papers in the SPA
const GRADES_WITH_PAST_PAPERS = new Set(['grade-11']);

// Demo fallbacks for when Supabase is not configured
const DEMO_TOPICS = [
  { topic: 'Number & Operations',       count: 12 },
  { topic: 'Algebra',                   count: 18 },
  { topic: 'Geometry',                  count: 15 },
  { topic: 'Trigonometry',              count: 10 },
  { topic: 'Statistics',                count: 8  },
  { topic: 'Probability',               count: 9  },
  { topic: 'Mensuration',               count: 11 },
  { topic: 'Coordinate Geometry',       count: 7  },
  { topic: 'Functions & Graphs',        count: 14 },
  { topic: 'Sets & Venn Diagrams',      count: 6  },
  { topic: 'Matrices & Transformations',count: 8  },
  { topic: 'Vectors',                   count: 5  },
];

const DEMO_PAST_PAPERS: ResourceItem[] = [
  { id: 'd1', title: 'May/June 2024 — Paper 1 Variant 1', contentType: 'pdf', href: '#', year: 2024, session: 'May/June', variant: 1 },
  { id: 'd2', title: 'May/June 2024 — Paper 2 Variant 1', contentType: 'pdf', href: '#', year: 2024, session: 'May/June', variant: 1 },
  { id: 'd3', title: 'Oct/Nov 2023 — Paper 1 Variant 2',  contentType: 'pdf', href: '#', year: 2023, session: 'Oct/Nov',  variant: 2 },
  { id: 'd4', title: 'May/June 2023 — Paper 1 Variant 1', contentType: 'pdf', href: '#', year: 2023, session: 'May/June', variant: 1 },
];

async function fetchGradeData(
  subject: string,
  grade: { label: string; slug: string; description: string },
): Promise<GradeSpaData> {
  const hasPastPapers = GRADES_WITH_PAST_PAPERS.has(grade.slug);

  // Filesystem-backed worksheet topics — the source of truth for the
  // Topical Worksheets tab. Each markdown file under
  // docs/worksheets/olevel-math/<grade>/ becomes a clickable topic card
  // and the topic detail page renders the markdown via KaTeX.
  // We only include these for the Mathematics subject for now.
  const fsTopics =
    subject === 'mathematics-4024'
      ? getWorksheetsForGrade(grade.slug).map((w) => ({
          topic: w.topic,
          slug: w.slug,
          count: w.questionCount,
        }))
      : [];

  const base: GradeSpaData = {
    slug: grade.slug,
    label: grade.label,
    description: grade.description,
    videoModules: [],
    topics: fsTopics,
    pastPapers: [],
    hasPastPapers,
  };

  if (!isSupabaseConfigured()) {
    return {
      ...base,
      topics: fsTopics.length > 0 ? fsTopics : DEMO_TOPICS,
      pastPapers: hasPastPapers ? DEMO_PAST_PAPERS : [],
    };
  }

  try {
    const category = await getCategoryBySlug(subject, grade.slug);
    // No category = nothing in the DB yet for this grade. Return an empty
    // grade rather than DEMO_TOPICS — those slugs don't resolve at the
    // /topical/[topic] route and would 404 on click.
    if (!category) return base;

    const fetches: Promise<unknown>[] = [
      getPublishedResourcesByModuleStream(category.id, PORTAL_RESOURCE_STREAMS.videoLectures),
      getTopicsByCategory(category.id),
    ];
    if (hasPastPapers) {
      fetches.push(getPublishedResourcesByModuleStream(category.id, PORTAL_RESOURCE_STREAMS.solvedPastPapers));
    }

    const results = await Promise.all(fetches);
    const videoResources = results[0] as Resource[];
    const topics          = results[1] as { topic: string; count: number }[];
    const paperResources  = hasPastPapers ? (results[2] as Resource[]) : [];

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

    // Merge filesystem worksheet topics with any DB-driven topics.
    // FS entries come first (they have explicit slugs and content); DB
    // entries are appended only if they don't duplicate an FS slug.
    const fsSlugs = new Set(fsTopics.map((t) => t.slug));
    const dbExtras = topics
      .filter((t) => !fsSlugs.has(t.topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')))
      .map((t) => ({ topic: t.topic, count: t.count }));

    return {
      ...base,
      videoModules,
      topics: [...fsTopics, ...dbExtras],
      pastPapers,
    };
  } catch {
    // On a real query error, fall back to FS-only topics so the page
    // still renders something useful.
    return base;
  }
}

export default async function OLevelSubjectPage({ params }: { params: { subject: string } }) {
  const grades = await Promise.all(
    oLevelGrades.map((g) => fetchGradeData(params.subject, g)),
  );

  return (
    <OLevelSPADashboard
      subject={params.subject}
      heading={getSubjectHeading(params.subject)}
      label={getSubjectLabel(params.subject)}
      grades={grades}
    />
  );
}
