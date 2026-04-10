import { Suspense } from 'react';
import Link from 'next/link';
import UnifiedModuleGrid from '@/components/resources/UnifiedModuleGrid';
import type { LearningModule } from '@/components/resources/UnifiedModuleGrid';
import { getCategoryBySlug, getResourcesByCategory } from '@/lib/supabase/queries';
import { isSupabaseConfigured } from '@/lib/supabase/is-configured';
import { aLevelPapers, aLevelPapersBySubject, getSubjectLabel } from '@/config/navigation';
import { isAdminRequest } from '@/lib/admin-mode';

async function VideoModules({ subject, paper }: { subject: string; paper: string }) {
  if (!isSupabaseConfigured()) {
    return <UnifiedModuleGrid modules={[]} emptyTitle="Database not configured" emptyMessage="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." />;
  }

  try {
    const category = await getCategoryBySlug(subject, paper);
    if (!category) return <UnifiedModuleGrid modules={[]} emptyTitle="Category not found" emptyMessage="Run the SQL migrations first." />;

    // Fetch ALL published videos (no module_type filter)
    const resources = await getResourcesByCategory(category.id, 'video');

    const adminBypass = isAdminRequest();
    const modules: LearningModule[] = resources.map(r => ({
      id: r.id,
      title: r.title,
      videoUrl: r.source_url,
      worksheetUrl: (r as any).worksheet_url || null,
      isLocked: adminBypass ? false : ((r as any).is_locked ?? false),
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
    return <UnifiedModuleGrid modules={[]} emptyTitle="Failed to load" emptyMessage="Please refresh the page." />;
  }
}

export default function VideoLecturesPage({ params }: { params: { subject: string; paper: string } }) {
  const papers = aLevelPapersBySubject[params.subject] ?? aLevelPapers;
  const allPapers = [...papers['as-level'], ...papers['a2-level']];
  const paperConfig = allPapers.find(p => p.slug === params.paper);
  const paperName = paperConfig?.label || params.paper.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const levelSlug = papers['a2-level'].find(p => p.slug === params.paper) ? 'a2-level' : 'as-level';
  const levelName = levelSlug === 'as-level' ? 'AS Level' : 'A2 Level';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <Link href="/alevel" className="text-white/50 hover:text-white/70 transition-colors">A-Level</Link>
            <span className="text-white/30">/</span>
            <Link href={`/alevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">{getSubjectLabel(params.subject)}</Link>
            <span className="text-white/30">/</span>
            <Link href={`/alevel/${params.subject}/${levelSlug}`} className="text-white/50 hover:text-white/70 transition-colors">{levelName}</Link>
            <span className="text-white/30">/</span>
            <Link href={`/alevel/${params.subject}/${levelSlug}/${params.paper}`} className="text-white/50 hover:text-white/70 transition-colors">{paperName}</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">Video Lectures & Worksheets</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{paperName} — Video Lectures & Worksheets</h1>
          <p className="text-white/60">Topic-by-topic video explanations — each paired with a downloadable worksheet.</p>
        </div>
      </div>
      <div className="portal-page-body max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <Suspense fallback={<UnifiedModuleGrid modules={[]} isLoading={true} />}>
          <VideoModules subject={params.subject} paper={params.paper} />
        </Suspense>
      </div>
    </div>
  );
}
