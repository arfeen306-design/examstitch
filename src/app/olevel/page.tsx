'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

const subjects = [
  {
    name: 'Mathematics',
    code: '4024/0580',
    slug: 'mathematics-4024',
    description: 'Extended & Core Mathematics — Grades 9, 10 & 11',
    papers: 2,
    color: 'from-blue-500 to-indigo-600',
  },
];

export default function OLevelPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="gradient-hero pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 text-gold-500 text-sm font-medium mb-3">
              <BookOpen className="w-4 h-4" />
              <span>O-Level / IGCSE</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-white mb-2">
              O-Level / IGCSE Resources
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 max-w-xl">
              Cambridge IGCSE past papers, video lectures, and topical worksheets organized by grade and subject.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Subject Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, i) => (
            <motion.div key={subject.slug} variants={fadeUp} custom={i + 3}>
              <Link href={`/olevel/${subject.slug}`} className="block group">
                <div className="card-hover bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
                  <div className={`w-12 h-12 bg-gradient-to-br ${subject.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-sm font-bold text-white">{subject.code}</span>
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 mb-1 group-hover:text-gold-700 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-navy-500 mb-4">{subject.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-navy-400">{subject.papers} Papers</span>
                    <ArrowRight className="w-4 h-4 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
