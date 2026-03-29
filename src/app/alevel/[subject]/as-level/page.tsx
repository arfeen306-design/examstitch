'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, FileText, PlayCircle, PenTool } from 'lucide-react';
import { aLevelPapers } from '@/config/navigation';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

export default function ASLevelPage({ params }: { params: { subject: string } }) {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 text-sm mb-3">
              <Link href="/alevel" className="text-white/50 hover:text-white/70 transition-colors">A-Level</Link>
              <span className="text-white/30">/</span>
              <Link href={`/alevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">Mathematics (9709)</Link>
              <span className="text-white/30">/</span>
              <span className="text-gold-500 font-medium">AS Level</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl font-bold text-white mb-2">
              AS Level Papers
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/60">
              Choose a paper to access past papers, video solutions, and topical worksheets.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aLevelPapers['as-level'].map((paper, i) => (
            <motion.div key={paper.slug} variants={fadeUp} custom={i + 3}>
              <Link href={`/alevel/${params.subject}/as-level/${paper.slug}`} className="block group">
                <div className="card-hover bg-white border border-navy-100 rounded-2xl p-8 shadow-sm h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-gold-700 transition-colors">
                    {paper.label}
                  </h3>
                  <p className="text-sm text-navy-500 mb-4">{paper.description}</p>
                  <div className="flex items-center gap-4 text-xs text-navy-400 mb-4">
                    <span className="flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5 text-red-500" /> Videos</span>
                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-blue-500" /> Papers</span>
                    <span className="flex items-center gap-1"><PenTool className="w-3.5 h-3.5 text-green-500" /> Topical</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
