import { Suspense } from 'react';
import Link from 'next/link';
import ResourceGrid from '@/components/resources/ResourceGrid';
import { getCategoryBySlug, getResourcesByCategory } from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import type { Resource } from '@/lib/supabase/types';
import type { ResourceItem } from '@/components/resources/ResourceGrid';
import { aLevelPapers } from '@/config/navigation';

function toResourceItem(resource: Resource, basePath: string): ResourceItem {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description ?? undefined,
    contentType: resource.content_type,
    href: `/view/${resource.id}`,
    subject: resource.subject,
  };
}

const DEMO_VIDEOS: ResourceItem[] = [
  { id: 'v1', title: 'Quadratics — Completing the Square',           contentType: 'video', href: '#', subject: 'Mathematics 9709', description: 'Step by step completing the square method' },
  { id: 'v2', title: 'Functions — Inverse Functions', contentType: 'video', href: '#', subject: 'Mathematics 9709', description: 'Finding and graphing inverse functions' },
  { id: 'v3', title: 'Coordinate Geometry — Perpendicular Lines',           contentType: 'video', href: '#', subject: 'Mathematics 9709', description: 'Finding equations of perpendicular bisectors' },
  { id: 'v4', title: 'Circular Measure — Arc Length',      contentType: 'video', href: '#', subject: 'Mathematics 9709', description: 'Solving problems with radians and sectors' },
  { id: 'v5', title: 'Trigonometry — Solving Equations',           contentType: 'video', href: '#', subject: 'Mathematics 9709', description: 'Solving trig equations in given domains' },
];

async function VideoGrid({ subject, paper, basePath }: { subject: string; paper: string; basePath: string }) {
  if (!isSupabaseConfigured()) {
    return <ResourceGrid resources={DEMO_VIDEOS} />;
  }

  try {
    const category = await getCategoryBySlug(subject, paper);
    if (!category) return <ResourceGrid resources={[]} emptyTitle="Category not found" emptyMessage="Run the SQL migrations first." />;
    const resources = await getResourcesByCategory(category.id, 'video');
    
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

export default function VideoLecturesPage({ params }: { params: { subject: string; paper: string } }) {
  const allPapers = [...aLevelPapers['as-level'], ...aLevelPapers['a2-level']];
  const paperConfig = allPapers.find(p => p.slug === params.paper);
  const paperName = paperConfig?.label || params.paper.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const levelSlug = aLevelPapers['as-level'].find(p => p.slug === params.paper) ? 'as-level' : 'a2-level';
  const levelName = levelSlug === 'as-level' ? 'AS Level' : 'A2 Level';
  
  const basePath = `/alevel/${params.subject}/${levelSlug}/${params.paper}/video-lectures`;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <Link href="/alevel" className="text-white/50 hover:text-white/70 transition-colors">A-Level</Link>
            <span className="text-white/30">/</span>
            <Link href={`/alevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">Mathematics (9709)</Link>
            <span className="text-white/30">/</span>
            <Link href={`/alevel/${params.subject}/${levelSlug}`} className="text-white/50 hover:text-white/70 transition-colors">{levelName}</Link>
            <span className="text-white/30">/</span>
            <Link href={`/alevel/${params.subject}/${levelSlug}/${params.paper}`} className="text-white/50 hover:text-white/70 transition-colors">{paperName}</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">Video Lectures</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{paperName} — Video Lectures</h1>
          <p className="text-white/60">Watch detailed video explanations for every topic.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <Suspense fallback={<ResourceGrid resources={[]} isLoading={true} />}>
          <VideoGrid subject={params.subject} paper={params.paper} basePath={basePath} />
        </Suspense>
      </div>
    </div>
  );
}
