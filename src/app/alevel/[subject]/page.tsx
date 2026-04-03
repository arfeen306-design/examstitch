import Link from 'next/link';
import { ArrowRight, FileText, PlayCircle, PenTool } from 'lucide-react';
import { aLevelPapersBySubject, aLevelPapers, getSubjectLabel, getSubjectHeading } from '@/config/navigation';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [
    { subject: 'mathematics-9709' },
    { subject: 'computer-science-9618' },
    { subject: 'physics-9702' },
    { subject: 'chemistry-9701' },
    { subject: 'biology-9700' },
  ];
}

function PaperCard({ paper, href }: { paper: { label: string; slug: string; description: string }; href: string }) {
  return (
    <Link href={href} className="block group">
      <div className="relative overflow-hidden rounded-2xl transition-all duration-300
                      bg-white/[0.06] backdrop-blur-xl border border-white/[0.1]
                      hover:border-white/[0.2] hover:bg-white/[0.1] hover:shadow-lg">
        <div className="p-5">
          <h3 className="text-base font-bold text-white group-hover:text-gold-300 transition-colors">{paper.label}</h3>
          <p className="text-xs text-white/40 mt-1 mb-4">{paper.description}</p>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5 text-red-400" /> Videos</span>
            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-blue-400" /> Papers</span>
            <span className="flex items-center gap-1"><PenTool className="w-3.5 h-3.5 text-emerald-400" /> Topical</span>
          </div>
          <div className="flex justify-end mt-3">
            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ALevelSubjectPage({ params }: { params: { subject: string } }) {
  const label = getSubjectLabel(params.subject);
  const heading = getSubjectHeading(params.subject);
  const papers = aLevelPapersBySubject[params.subject] ?? aLevelPapers;

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <div className="gradient-hero pt-32 pb-16">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-10">
            {/* AS Level Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-300">AS</span>
                </div>
                AS Level
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {papers['as-level'].map((paper) => (
                  <PaperCard
                    key={paper.slug}
                    paper={paper}
                    href={`/alevel/${params.subject}/as-level/${paper.slug}`}
                  />
                ))}
              </div>
            </div>

            {/* A2 Level Section */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/20 border border-purple-400/30 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-300">A2</span>
                </div>
                A2 Level
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {papers['a2-level'].map((paper) => (
                  <PaperCard
                    key={paper.slug}
                    paper={paper}
                    href={`/alevel/${params.subject}/a2-level/${paper.slug}`}
                  />
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
