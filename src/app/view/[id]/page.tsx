import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import EmbeddedViewer from '@/components/resources/EmbeddedViewer';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface ViewerPageProps {
  params: { id: string };
  searchParams: { mode?: string };
}

async function getResource(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('resources')
    .select('*, category:categories(id, name, slug, subject_id, subjects:subjects(slug, code))')
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

  const section = 'video-lectures';

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

  const isWorksheet = searchParams.mode === 'worksheet';
  const worksheetUrl = (resource as any).worksheet_url;

  // If worksheet mode requested but no worksheet URL exists, fall back to video
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
