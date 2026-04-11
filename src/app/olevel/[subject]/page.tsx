import Link from 'next/link';
import { ArrowRight, FileText, PlayCircle, PenTool } from 'lucide-react';
import { oLevelGrades, getSubjectLabel, getSubjectHeading } from '@/config/navigation';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [
    { subject: 'mathematics-4024' },
    { subject: 'computer-science-0478' },
    { subject: 'english-1123' },
    { subject: 'physics-5054' },
    { subject: 'chemistry-5070' },
    { subject: 'biology-5090' },
    { subject: 'urdu-3248' },
    { subject: 'pakistan-studies-2059' },
  ];
}

export default function OLevelSubjectPage({ params }: { params: { subject: string } }) {
  const label = getSubjectLabel(params.subject);
  const heading = getSubjectHeading(params.subject);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3">
            <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level / IGCSE</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">{label}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{heading}</h1>
          <p className="text-white/60 max-w-xl">Select your grade to access past papers, video solutions, and topical worksheets.</p>
        </div>
      </div>

      <div className="portal-page-body portal-surface-navy max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main: Grade Cards */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {oLevelGrades.map((grade) => (
                <Link key={grade.slug} href={`/olevel/${params.subject}/${grade.slug}`} className="block group">
                  <div className="relative overflow-hidden rounded-2xl portal-glass-card portal-glass-card--interactive">
                    {/* Top accent */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-5">
                      <h3 className="text-lg font-bold text-white group-hover:text-gold-300 transition-colors">{grade.label}</h3>
                      <p className="text-xs text-white/50 mt-1">{grade.description}</p>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <PlayCircle className="w-4 h-4 text-red-400" /><span>Video Lectures</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <FileText className="w-4 h-4 text-blue-400" /><span>Solved Past Papers</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <PenTool className="w-4 h-4 text-emerald-400" /><span>Topical Worksheets</span>
                      </div>
                      <div className="pt-2 flex items-center justify-end">
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-300 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            <div className="rounded-2xl p-5 portal-glass-card">
              <h3 className="text-sm font-semibold text-slate-100 mb-4">Quick Filter</h3>
              <div className="space-y-2">
                {['Topical Questions', 'Solved Past Papers by Year', 'Video Lectures'].map(label => (
                  <button key={label} type="button" className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                                                  text-slate-300 portal-glass-inset portal-glass-inset--interactive hover:text-slate-100">
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
