import Link from 'next/link';
import { ArrowRight, FileText, PlayCircle, PenTool } from 'lucide-react';
import { oLevelGrades } from '@/config/navigation';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';

// Pre-render known subject slugs at build time; revalidate daily
export const revalidate = 86400;

export async function generateStaticParams() {
  return [{ subject: 'mathematics-4024' }];
}

export default function OLevelSubjectPage({ params }: { params: { subject: string } }) {
  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3">
            <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level / IGCSE</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">Mathematics (4024/0580)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Mathematics — 4024/0580</h1>
          <p className="text-white/60 max-w-xl">Select your grade to access past papers, video solutions, and topical worksheets.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main: Grade Cards */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {oLevelGrades.map((grade) => (
                <Link key={grade.slug} href={`/olevel/${params.subject}/${grade.slug}`} className="block group">
                  <div className="card-hover border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <div className="bg-gradient-to-r from-[var(--hero-via)] to-[var(--hero-from)] p-5">
                      <h3 className="text-lg font-bold text-white group-hover:text-gold-500 transition-colors">{grade.label}</h3>
                      <p className="text-xs text-white/50 mt-1">{grade.description}</p>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <PlayCircle className="w-4 h-4 text-red-500" /><span>Video Lectures</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <FileText className="w-4 h-4 text-blue-500" /><span>Solved Past Papers</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <PenTool className="w-4 h-4 text-[var(--accent)]" /><span>Topical Worksheets</span>
                      </div>
                      <div className="pt-2 flex items-center justify-end">
                        <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            <div className="border border-[var(--border-subtle)] rounded-2xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Filter</h3>
              <div className="space-y-2">
                {['Topical Questions', 'Solved Past Papers by Year', 'Video Lectures'].map(label => (
                  <button key={label} className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-gold-50 hover:text-gold-700" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <NotifyMeBox level="olevel" sourcePage={`/olevel/${params.subject}`} />
          </div>
        </div>
      </div>
    </div>
  );
}


