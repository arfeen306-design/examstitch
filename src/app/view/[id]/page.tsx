import { notFound } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { Lock, LogIn, GraduationCap } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
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
      const redirectTo = `/view/${params.id}`;
      return (
        <div className="min-h-screen pt-24 pb-16 flex items-center justify-center"
             style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <div className="w-full max-w-md mx-4 text-center">
            <div className="rounded-2xl p-10 shadow-lg"
                 style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                   style={{ backgroundColor: 'var(--border-subtle)' }}>
                <Lock className="w-8 h-8" style={{ color: '#FF6B35' }} />
              </div>

              {/* Heading */}
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Premium Access Required
              </h1>
              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                This resource is restricted to registered students.
              </p>
              <p className="text-sm font-medium mb-8 truncate px-2" style={{ color: 'var(--text-secondary)' }}
                 title={resource.title}>
                {resource.title}
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <Link
                  href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: '#FF6B35', color: '#fff' }}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In to Access
                </Link>
                <Link
                  href={`/auth/signup?redirectTo=${encodeURIComponent(redirectTo)}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
                           backgroundColor: 'var(--bg-card)' }}
                >
                  <GraduationCap className="w-4 h-4" />
                  Create a Free Account
                </Link>
              </div>

              <p className="text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
                      className="underline" style={{ color: 'var(--accent)' }}>
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      );
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
