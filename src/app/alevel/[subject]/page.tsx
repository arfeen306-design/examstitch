'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, FileText, PlayCircle, PenTool } from 'lucide-react';
import { aLevelPapers } from '@/config/navigation';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

export default function ALevelSubjectPage({ params }: { params: { subject: string } }) {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="gradient-hero pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 text-sm mb-3">
              <Link href="/alevel" className="text-white/50 hover:text-white/70 transition-colors">A-Level</Link>
              <span className="text-white/30">/</span>
              <span className="text-gold-500 font-medium">Mathematics (9709)</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Mathematics — 9709
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 max-w-xl">
              Select your level and paper to access past papers, video solutions, and topical worksheets.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-10">
            {/* AS Level Section */}
            <div>
              <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">AS</span>
                </div>
                AS Level
              </h2>
              <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aLevelPapers['as-level'].map((paper, i) => (
                  <motion.div key={paper.slug} variants={fadeUp} custom={i + 3}>
                    <Link href={`/alevel/${params.subject}/as-level/${paper.slug}`} className="block group">
                      <div className="card-hover bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
                          <h3 className="text-base font-bold text-white group-hover:text-gold-300 transition-colors">
                            {paper.label}
                          </h3>
                          <p className="text-xs text-white/60 mt-1">{paper.description}</p>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-navy-500">
                            <PlayCircle className="w-3.5 h-3.5 text-red-500" /> Videos
                            <FileText className="w-3.5 h-3.5 text-blue-500 ml-2" /> Papers
                            <PenTool className="w-3.5 h-3.5 text-green-500 ml-2" /> Topical
                          </div>
                          <div className="flex justify-end">
                            <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* A2 Level Section */}
            <div>
              <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">A2</span>
                </div>
                A2 Level
              </h2>
              <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {aLevelPapers['a2-level'].map((paper, i) => (
                  <motion.div key={paper.slug} variants={fadeUp} custom={i + 5}>
                    <Link href={`/alevel/${params.subject}/a2-level/${paper.slug}`} className="block group">
                      <div className="card-hover bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-purple-600 to-violet-700 p-4">
                          <h3 className="text-base font-bold text-white group-hover:text-gold-300 transition-colors">
                            {paper.label}
                          </h3>
                          <p className="text-xs text-white/60 mt-1">{paper.description}</p>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-navy-500">
                            <PlayCircle className="w-3.5 h-3.5 text-red-500" /> Videos
                            <FileText className="w-3.5 h-3.5 text-blue-500 ml-2" /> Papers
                            <PenTool className="w-3.5 h-3.5 text-green-500 ml-2" /> Topical
                          </div>
                          <div className="flex justify-end">
                            <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
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
