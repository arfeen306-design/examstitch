import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import EmbeddedViewer from '@/components/resources/EmbeddedViewer';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface ViewerPageProps {
  params: { id: string };
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
  const subjectCode = category.subjects?.code || '';
  const categorySlug = category.slug || '';

  // Determine the content section from content_type
  const section =
    resource.content_type === 'video' ? 'video-lectures' :
    resource.content_type === 'worksheet' ? 'topical' :
    'past-papers';

  // A-Level papers have slugs like paper-1-pure-mathematics
  if (categorySlug.startsWith('paper-')) {
    // Determine AS vs A2 based on paper number
    const paperNum = parseInt(categorySlug.match(/paper-(\d+)/)?.[1] || '1');
    const level = paperNum <= 2 || paperNum === 5 ? 'as-level' : 'a2-level';
    return {
      href: `/alevel/${subjectSlug}/${level}/${categorySlug}/${section}`,
      label: `Back to ${category.name}`,
    };
  }

  // O-Level grades
  if (categorySlug.startsWith('grade-')) {
    return {
      href: `/olevel/${subjectSlug}/${categorySlug}/${section}`,
      label: `Back to ${category.name}`,
    };
  }

  return { href: '/', label: 'Back to Home' };
}

export async function generateMetadata({ params }: ViewerPageProps): Promise<Metadata> {
  const resource = await getResource(params.id);
  if (!resource) return { title: 'Resource Not Found — ExamStitch' };

  return {
    title: `${resource.title} — ExamStitch`,
    description: resource.description || `View ${resource.content_type} resource on ExamStitch.`,
  };
}

export default async function ViewerPage({ params }: ViewerPageProps) {
  const resource = await getResource(params.id);
  if (!resource) notFound();

  const { href: backHref, label: backLabel } = buildBackPath(resource);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <EmbeddedViewer
          title={resource.title}
          sourceUrl={resource.source_url}
          contentType={resource.content_type}
          backHref={backHref}
          backLabel={backLabel}
        />
      </div>
    </div>
  );
}
