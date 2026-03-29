'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, PlayCircle, BookOpen, ArrowRight } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

const sections = [
  {
    title: 'Video Lectures & Worksheets',
    description: 'Watch topic videos — each paired with a practice worksheet',
    href: 'video-lectures',
    icon: PlayCircle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    gradient: 'from-red-500 to-rose-600',
  },
  {
    title: 'Solved Past Papers',
    description: 'Practice with official Cambridge past papers and mark schemes',
    href: 'past-papers',
    icon: FileText,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'Topical Worksheets',
    description: 'Master individual topics with focused practice questions',
    href: 'topical',
    icon: BookOpen,
    color: 'text-green-500',
    bg: 'bg-green-50',
    gradient: 'from-green-500 to-emerald-600',
  },
];

function formatGrade(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function GradePage({ params }: { params: { subject: string; grade: string } }) {
  const gradeName = formatGrade(params.grade);

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="gradient-hero py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 text-sm mb-3">
              <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level / IGCSE</Link>
              <span className="text-white/30">/</span>
              <Link href={`/olevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">Mathematics (4024/0580)</Link>
              <span className="text-white/30">/</span>
              <span className="text-gold-500 font-medium">{gradeName}</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {gradeName}
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/60">
              Choose a resource type to get started.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section, i) => (
            <motion.div key={section.href} variants={fadeUp} custom={i + 3}>
              <Link
                href={`/olevel/${params.subject}/${params.grade}/${section.href}`}
                className="block group"
              >
                <div className="card-hover bg-white border border-navy-100 rounded-2xl p-8 text-center shadow-sm h-full">
                  <div className={`w-16 h-16 bg-gradient-to-br ${section.gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                    <section.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-gold-600 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-navy-500 mb-4">{section.description}</p>
                  <ArrowRight className="w-5 h-5 text-navy-300 group-hover:text-gold-500 mx-auto group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
