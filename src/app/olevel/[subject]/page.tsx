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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main: Grade Cards */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {oLevelGrades.map((grade) => (
                <Link key={grade.slug} href={`/olevel/${params.subject}/${grade.slug}`} className="block group">
                  <div className="relative overflow-hidden rounded-2xl transition-all duration-300
                                  bg-white/[0.06] backdrop-blur-xl border border-white/[0.1]
                                  hover:border-white/[0.2] hover:bg-white/[0.1] hover:shadow-lg">
                    {/* Top accent */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-5">
                      <h3 className="text-lg font-bold text-white group-hover:text-gold-300 transition-colors">{grade.label}</h3>
                      <p className="text-xs text-white/50 mt-1">{grade.description}</p>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <PlayCircle className="w-4 h-4 text-red-400" /><span>Video Lectures</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <FileText className="w-4 h-4 text-blue-400" /><span>Solved Past Papers</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <PenTool className="w-4 h-4 text-emerald-400" /><span>Topical Worksheets</span>
                      </div>
                      <div className="pt-2 flex items-center justify-end">
                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            <div className="rounded-2xl p-5 bg-white/[0.06] backdrop-blur-xl border border-white/[0.1]">
              <h3 className="text-sm font-semibold text-white mb-4">Quick Filter</h3>
              <div className="space-y-2">
                {['Topical Questions', 'Solved Past Papers by Year', 'Video Lectures'].map(label => (
                  <button key={label} className="w-full text-left px-3 py-2 text-sm rounded-lg transition-colors
                                                  text-white/50 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white/80">
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
