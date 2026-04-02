import Link from 'next/link';
import { ArrowRight, FileText, PlayCircle, PenTool } from 'lucide-react';
import { aLevelPapersBySubject, aLevelPapers, getSubjectLabel, getSubjectHeading } from '@/config/navigation';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';

// Pre-render known A-Level subject slugs at build time; revalidate daily
export const revalidate = 86400;

export async function generateStaticParams() {
  return [
    { subject: 'mathematics-9709' },
    { subject: 'computer-science-9618' },
  ];
}

export default function ALevelSubjectPage({ params }: { params: { subject: string } }) {
  const label = getSubjectLabel(params.subject);
  const heading = getSubjectHeading(params.subject);
  const papers = aLevelPapersBySubject[params.subject] ?? aLevelPapers;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3">
            <Link href="/alevel" className="text-white/50 hover:text-white/70 transition-colors">A-Level</Link>
            <span className="text-white/30">/</span>
            <span className="text-gold-500 font-medium">{label}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{heading}</h1>
          <p className="text-white/60 max-w-xl">Select your level and paper to access past papers, video solutions, and topical worksheets.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-10">
            {/* AS Level Section */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">AS</span>
                </div>
                AS Level
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {papers['as-level'].map((paper) => (
                  <Link key={paper.slug} href={`/alevel/${params.subject}/as-level/${paper.slug}`} className="block group">
                    <div className="card-hover border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md" style={{ backgroundColor: 'var(--bg-card)' }}>
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
                        <h3 className="text-base font-bold text-white group-hover:text-gold-300 transition-colors">{paper.label}</h3>
                        <p className="text-xs text-white/60 mt-1">{paper.description}</p>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <PlayCircle className="w-3.5 h-3.5 text-red-500" /> Videos
                          <FileText className="w-3.5 h-3.5 text-blue-500 ml-2" /> Papers
                          <PenTool className="w-3.5 h-3.5 text-[var(--accent)] ml-2" /> Topical
                        </div>
                        <div className="flex justify-end">
                          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* A2 Level Section */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">A2</span>
                </div>
                A2 Level
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {papers['a2-level'].map((paper) => (
                  <Link key={paper.slug} href={`/alevel/${params.subject}/a2-level/${paper.slug}`} className="block group">
                    <div className="card-hover border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md" style={{ backgroundColor: 'var(--bg-card)' }}>
                      <div className="bg-gradient-to-r from-purple-600 to-violet-700 p-4">
                        <h3 className="text-base font-bold text-white group-hover:text-gold-300 transition-colors">{paper.label}</h3>
                        <p className="text-xs text-white/60 mt-1">{paper.description}</p>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <PlayCircle className="w-3.5 h-3.5 text-red-500" /> Videos
                          <FileText className="w-3.5 h-3.5 text-blue-500 ml-2" /> Papers
                          <PenTool className="w-3.5 h-3.5 text-[var(--accent)] ml-2" /> Topical
                        </div>
                        <div className="flex justify-end">
                          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80">
            <NotifyMeBox level="alevel" sourcePage={`/alevel/${params.subject}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
