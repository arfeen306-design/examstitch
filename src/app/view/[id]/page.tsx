import { notFound } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import PremiumGate from '@/components/resources/PremiumGate';
import type { QuestionMapping } from '@/components/resources/InteractiveSolver';
import type { Metadata } from 'next';

const EmbeddedViewer    = nextDynamic(() => import('@/components/resources/EmbeddedViewer'),    { ssr: false });
const InteractiveSolver = nextDynamic(() => import('@/components/resources/InteractiveSolver'), { ssr: false });

// force-dynamic: this page checks the user session on every request
// (ISR cannot be used for per-user auth-gated content)
export const dynamic = 'force-dynamic';

interface ViewerPageProps {
  params: { id: string };
  searchParams: { mode?: string };
}

async function getResource(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*, category:categories(id, name, slug, subject_id, subjects!categories_subject_id_fkey(slug, code))')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

function buildBackPath(resource: any): { href: string; label: string } {
  const category = resource.category;
  if (!category) {
    return { href: '/', label: 'Back to Home' };
  }

  const subjectSlug = category.subjects?.slug || resource.subject || 'mathematics-9709';
  const categorySlug = category.slug || '';

  const section = resource.module_type === 'solved_past_paper' ? 'past-papers' : 'video-lectures';

  if (categorySlug.startsWith('paper-')) {
    const paperNum = parseInt(categorySlug.match(/paper-(\d+)/)?.[1] || '1');
    const level = paperNum <= 2 || paperNum === 5 ? 'as-level' : 'a2-level';
    return {
      href: `/alevel/${subjectSlug}/${level}/${categorySlug}/${section}`,
      label: `Back to ${category.name}`,
    };
  }

  if (categorySlug.startsWith('grade-')) {
    return {
      href: `/olevel/${subjectSlug}/${categorySlug}/${section}`,
      label: `Back to ${category.name}`,
    };
  }

  return { href: '/', label: 'Back to Home' };
}

export async function generateMetadata({ params, searchParams }: ViewerPageProps): Promise<Metadata> {
  const resource = await getResource(params.id);
  if (!resource) return { title: 'Resource Not Found — ExamStitch' };

  const isWorksheet = searchParams.mode === 'worksheet';
  const suffix = isWorksheet ? ' — Worksheet' : '';

  return {
    title: `${resource.title}${suffix} — ExamStitch`,
    description: resource.description || `View resource on ExamStitch.`,
  };
}

export default async function ViewerPage({ params, searchParams }: ViewerPageProps) {
  const resource = await getResource(params.id);
  if (!resource) notFound();

  // ── Auth gate for locked resources ───────────────────────────────────────
  if ((resource as any).is_locked) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return <PremiumGate resourceTitle={resource.title} redirectTo={`/view/${params.id}`} user={null} />;
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const isWorksheet = searchParams.mode === 'worksheet';
  const worksheetUrl = (resource as any).worksheet_url;
  const questionMapping = (resource as any).question_mapping as QuestionMapping[] | null;

  // ── Interactive Solver mode ──────────────────────────────────────────────
  // Activates when the resource has BOTH a video AND a PDF AND question mappings
  const hasVideo = resource.source_url && resource.content_type === 'video';
  const hasPdf = !!worksheetUrl;
  const hasMapping = Array.isArray(questionMapping) && questionMapping.length > 0;
  const useInteractiveSolver = hasVideo && hasPdf && hasMapping && !isWorksheet;

  if (useInteractiveSolver) {
    const { href: backHref, label: backLabel } = buildBackPath(resource);
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <InteractiveSolver
            title={resource.title}
            videoUrl={resource.source_url}
            pdfUrl={worksheetUrl}
            questionMapping={questionMapping!}
            backHref={backHref}
            backLabel={backLabel}
          />
        </div>
      </div>
    );
  }

  // ── Standard single-pane viewer ──────────────────────────────────────────
  const showWorksheet = isWorksheet && !!worksheetUrl;
  const sourceUrl = showWorksheet ? worksheetUrl : resource.source_url;
  const contentType = showWorksheet ? 'pdf' : resource.content_type;
  const title = showWorksheet ? `${resource.title} — Worksheet` : resource.title;
  const { href: backHref, label: backLabel } = buildBackPath(resource);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <EmbeddedViewer
          title={title}
          sourceUrl={sourceUrl}
          contentType={contentType}
          backHref={backHref}
          backLabel={backLabel}
        />
      </div>
    </div>
  );
}
