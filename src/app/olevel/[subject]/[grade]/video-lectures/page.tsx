import { Suspense } from 'react';
import Link from 'next/link';
import ResourceGrid from '@/components/resources/ResourceGrid';
import { getCategoryBySlug, getResourcesByCategory } from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import type { Resource } from '@/lib/supabase/types';
import type { ResourceItem } from '@/components/resources/ResourceGrid';

function formatGrade(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function toResourceItem(resource: Resource, basePath: string): ResourceItem {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description ?? undefined,
    contentType: resource.content_type,
    href: `${basePath}/${resource.id}`,
    subject: resource.subject,
  };
}

const DEMO_VIDEOS: ResourceItem[] = [
  { id: 'v1', title: 'Algebra — Linear Equations',           contentType: 'video', href: '#', subject: 'Mathematics 4024/0580', description: 'Solving linear equations step by step' },
  { id: 'v2', title: 'Trigonometry — Sine, Cosine, Tangent', contentType: 'video', href: '#', subject: 'Mathematics 4024/0580', description: 'Introduction to trigonometric ratios' },
  { id: 'v3', title: 'Geometry — Circle Theorems',           contentType: 'video', href: '#', subject: 'Mathematics 4024/0580', description: 'All circle theorems explained with examples' },
  { id: 'v4', title: 'Statistics — Mean, Median, Mode',      contentType: 'video', href: '#', subject: 'Mathematics 4024/0580', description: 'Measures of central tendency' },
  { id: 'v5', title: 'Probability — Tree Diagrams',           contentType: 'video', href: '#', subject: 'Mathematics 4024/0580', description: 'Using tree diagrams to solve probability problems' },
  { id: 'v6', title: 'Mensuration — Volume & Surface Area',  contentType: 'video', href: '#', subject: 'Mathematics 4024/0580', description: '3D shapes — cylinders, cones, spheres' },
];

async function VideoGrid({ subject, grade }: { subject: string; grade: string }) {
  if (!isSupabaseConfigured()) {
    return <ResourceGrid resources={DEMO_VIDEOS} />;
  }

  try {
    const category = await getCategoryBySlug(subject, grade);
    if (!category) return <ResourceGrid resources={[]} emptyTitle="Category not found" emptyMessage="Run the SQL migrations first." />;
    const resources = await getResourcesByCategory(category.id, 'video');
    const basePath = `/olevel/${subject}/${grade}/video-lectures`;
    return (
      <ResourceGrid
        resources={resources.map((r) => toResourceItem(r, basePath))}
        emptyTitle="No video lectures yet"
        emptyMessage="Upload your first video lecture via the admin dashboard."
      />
    );
  } catch (err) {
    console.error('VideoGrid error:', err);
    return <ResourceGrid resources={DEMO_VIDEOS} />;
  }
}

export default function VideoLecturesPage({ params }: { params: { subject: string; grade: string } }) {
  const gradeName = formatGrade(params.grade);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level / IGCSE</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">Mathematics (4024/0580)</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}/${params.grade}`} className="text-white/50 hover:text-white/70 transition-colors">{gradeName}</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">Video Lectures</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{gradeName} — Video Lectures</h1>
          <p className="text-white/60">Watch detailed video explanations for every topic.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <Suspense fallback={<ResourceGrid resources={[]} isLoading={true} />}>
          <VideoGrid subject={params.subject} grade={params.grade} />
        </Suspense>
      </div>
    </div>
  );
}
