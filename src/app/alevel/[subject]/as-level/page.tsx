'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, FileText, PlayCircle, PenTool } from 'lucide-react';
import { aLevelPapers, aLevelPapersBySubject, getSubjectLabel } from '@/config/navigation';

export default function ASLevelPage({ params }: { params: { subject: string } }) {
  return (
    <div className="min-h-screen bg-[#0B1120]">
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-sm mb-3">
              <Link href="/alevel" className="text-white/50 hover:text-white/70 transition-colors">A-Level</Link>
              <span className="text-white/30">/</span>
              <Link href={`/alevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">{getSubjectLabel(params.subject)}</Link>
              <span className="text-white/30">/</span>
              <span className="text-gold-500 font-medium">AS Level</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">AS Level Papers</h1>
            <p className="text-white/60">Choose a paper to access past papers, video solutions, and topical worksheets.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(aLevelPapersBySubject[params.subject] ?? aLevelPapers)['as-level'].map((paper, i) => (
            <motion.div
              key={paper.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/alevel/${params.subject}/as-level/${paper.slug}`} className="block group">
                <div className="relative overflow-hidden rounded-2xl p-8 h-full transition-all duration-300
                                bg-white/[0.06] backdrop-blur-xl border border-white/[0.1]
                                hover:border-white/[0.2] hover:bg-white/[0.1] hover:shadow-lg">
                  {/* Gradient accent line */}
                  <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-60" />

                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold-300 transition-colors">
                    {paper.label}
                  </h3>
                  <p className="text-sm text-white/40 mb-4">{paper.description}</p>
                  <div className="flex items-center gap-4 text-xs text-white/40 mb-4">
                    <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5 text-red-400" /> Videos</span>
                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-blue-400" /> Papers</span>
                    <span className="flex items-center gap-1"><PenTool className="w-3.5 h-3.5 text-emerald-400" /> Topical</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
