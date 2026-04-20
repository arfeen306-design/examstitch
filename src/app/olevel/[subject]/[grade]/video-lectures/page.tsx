import { Suspense } from 'react';
import Link from 'next/link';
import UnifiedModuleGrid from '@/components/resources/UnifiedModuleGrid';
import PortalResourceStreamSection from '@/components/resources/PortalResourceStreamSection';
import { PORTAL_RESOURCE_STREAMS } from '@/lib/init-subject';
import { getSubjectLabel } from '@/config/navigation';

function formatGrade(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function VideoLecturesPage({ params }: { params: { subject: string; grade: string } }) {
  const gradeName = formatGrade(params.grade);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
            <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level / IGCSE</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">{getSubjectLabel(params.subject)}</Link>
            <span className="text-white/30">/</span>
            <Link href={`/olevel/${params.subject}/${params.grade}`} className="text-white/50 hover:text-white/70 transition-colors">{gradeName}</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">Video Lectures & Worksheets</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{gradeName} — Video Lectures & Worksheets</h1>
          <p className="text-white/60">Topic-by-topic video explanations — each paired with a downloadable worksheet.</p>
        </div>
      </div>
      <div className="portal-page-body portal-surface-navy max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <Suspense fallback={<UnifiedModuleGrid modules={[]} isLoading={true} />}>
          <PortalResourceStreamSection
            subjectSlug={params.subject}
            categorySlug={params.grade}
            moduleType={PORTAL_RESOURCE_STREAMS.videoLectures}
            layout="video-modules"
          />
        </Suspense>
      </div>
    </div>
  );
}
