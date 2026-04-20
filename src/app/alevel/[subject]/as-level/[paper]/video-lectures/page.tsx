import { Suspense } from 'react';
import Link from 'next/link';
import UnifiedModuleGrid from '@/components/resources/UnifiedModuleGrid';
import PortalResourceStreamSection from '@/components/resources/PortalResourceStreamSection';
import { PORTAL_RESOURCE_STREAMS } from '@/lib/init-subject';
import { aLevelPapers, aLevelPapersBySubject, getSubjectLabel } from '@/config/navigation';

export default function VideoLecturesPage({ params }: { params: { subject: string; paper: string } }) {
  const papers = aLevelPapersBySubject[params.subject] ?? aLevelPapers;
  const allPapers = [...papers['as-level'], ...papers['a2-level']];
  const paperConfig = allPapers.find(p => p.slug === params.paper);
  const paperName = paperConfig?.label || params.paper.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const levelSlug = papers['as-level'].find(p => p.slug === params.paper) ? 'as-level' : 'a2-level';
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
      <div className="portal-page-body portal-surface-navy max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <Suspense fallback={<UnifiedModuleGrid modules={[]} isLoading={true} />}>
          <PortalResourceStreamSection
            subjectSlug={params.subject}
            categorySlug={params.paper}
            moduleType={PORTAL_RESOURCE_STREAMS.videoLectures}
            layout="video-modules"
          />
        </Suspense>
      </div>
    </div>
  );
}
