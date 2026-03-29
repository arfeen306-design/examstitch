'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, PlayCircle, PenTool } from 'lucide-react';
import { oLevelGrades } from '@/config/navigation';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

export default function OLevelSubjectPage({ params }: { params: { subject: string } }) {
  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 text-sm mb-3">
              <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level / IGCSE</Link>
              <span className="text-white/30">/</span>
              <span className="text-gold-500 font-medium">Mathematics (4024/0580)</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Mathematics — 4024/0580
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 max-w-xl">
              Select your grade to access past papers, video solutions, and topical worksheets.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main: Grade Cards */}
          <div className="flex-1">
            <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {oLevelGrades.map((grade, i) => (
                <motion.div key={grade.slug} variants={fadeUp} custom={i + 3}>
                  <Link href={`/olevel/${params.subject}/${grade.slug}`} className="block group">
                    <div className="card-hover bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-sm">
                      {/* Grade Banner */}
                      <div className="bg-gradient-to-r from-navy-800 to-navy-900 p-5">
                        <h3 className="text-lg font-bold text-white group-hover:text-gold-500 transition-colors">
                          {grade.label}
                        </h3>
                        <p className="text-xs text-white/50 mt-1">{grade.description}</p>
                      </div>
                      {/* Quick Links */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-navy-600">
                          <PlayCircle className="w-4 h-4 text-red-500" />
                          <span>Video Lectures</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-navy-600">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span>Solved Past Papers</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-navy-600">
                          <PenTool className="w-4 h-4 text-green-500" />
                          <span>Topical Worksheets</span>
                        </div>
                        <div className="pt-2 flex items-center justify-end">
                          <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Quick Filter */}
            <div className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-navy-900 mb-4">Quick Filter</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm rounded-lg bg-navy-50 text-navy-700 hover:bg-gold-50 hover:text-gold-700 transition-colors">
                  Topical Questions
                </button>
                <button className="w-full text-left px-3 py-2 text-sm rounded-lg bg-navy-50 text-navy-700 hover:bg-gold-50 hover:text-gold-700 transition-colors">
                  Solved Past Papers by Year
                </button>
                <button className="w-full text-left px-3 py-2 text-sm rounded-lg bg-navy-50 text-navy-700 hover:bg-gold-50 hover:text-gold-700 transition-colors">
                  Video Lectures
                </button>
              </div>
            </div>

            {/* Notify Me */}
            <NotifyMeBox level="olevel" sourcePage={`/olevel/${params.subject}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
