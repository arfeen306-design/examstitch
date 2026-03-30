import { Suspense } from 'react';
import Link from 'next/link';
import UnifiedModuleGrid from '@/components/resources/UnifiedModuleGrid';
import type { LearningModule } from '@/components/resources/UnifiedModuleGrid';
import { getCategoryBySlug, getResourcesByCategory } from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';

function formatGrade(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const DEMO_MODULES: LearningModule[] = [
  { id: 'd1', title: 'Algebra — Linear Equations', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'd2', title: 'Trigonometry — Sine, Cosine, Tangent', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'd3', title: 'Geometry — Circle Theorems', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
];

async function VideoModules({ subject, grade }: { subject: string; grade: string }) {
  if (!isSupabaseConfigured()) {
    return <UnifiedModuleGrid modules={DEMO_MODULES} />;
  }

  try {
    const category = await getCategoryBySlug(subject, grade);
    if (!category) return <UnifiedModuleGrid modules={[]} emptyTitle="Category not found" emptyMessage="Run the SQL migrations first." />;
    
    const resources = await getResourcesByCategory(category.id, 'video', 'video_topical');
    
    const modules: LearningModule[] = resources.map(r => ({
      id: r.id,
      title: r.title,
      videoUrl: r.source_url,
      worksheetUrl: (r as any).worksheet_url || null,
    }));

    return (
      <UnifiedModuleGrid
        modules={modules}
        emptyTitle="No video lectures yet"
        emptyMessage="Upload your first video lecture via the admin dashboard."
      />
    );
  } catch (err) {
    console.error('VideoModules error:', err);
    return <UnifiedModuleGrid modules={DEMO_MODULES} />;
  }
}

export default function VideoLecturesPage({ params }: { params: { subject: string; grade: string } }) {
  const gradeName = formatGrade(params.grade);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="gradient-hero pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level / IGCSE</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">Mathematics (4024/0580)</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}/${params.grade}`} className="text-white/50 hover:text-white/70 transition-colors">{gradeName}</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">Video Lectures & Worksheets</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{gradeName} — Video Lectures & Worksheets</h1>
          <p className="text-white/60">Topic-by-topic video explanations — each paired with a downloadable worksheet.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <Suspense fallback={<UnifiedModuleGrid modules={[]} isLoading={true} />}>
          <VideoModules subject={params.subject} grade={params.grade} />
        </Suspense>
      </div>
    </div>
  );
}
