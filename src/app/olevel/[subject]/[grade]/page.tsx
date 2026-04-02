'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, PlayCircle, BookOpen, ArrowRight } from 'lucide-react';
import { getSubjectLabel } from '@/config/navigation';

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
              <Link href={`/olevel/${params.subject}`} className="text-white/50 hover:text-white/70 transition-colors">{getSubjectLabel(params.subject)}</Link>
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <motion.div initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {sections.map((section, i) => (
            <motion.div key={section.href} variants={fadeUp} custom={i + 3}>
              <Link
                href={`/olevel/${params.subject}/${params.grade}/${section.href}`}
                className="block group h-full"
              >
                <div className="relative overflow-hidden rounded-2xl p-8 text-center shadow-lg h-full flex flex-col items-center
                                border transition-all duration-300 group-hover:shadow-xl group-hover:scale-[1.02]"
                     style={{
                       backgroundColor: 'var(--bg-card, white)',
                       borderColor: 'var(--border-subtle, #e2e8f0)',
                     }}>
                  {/* Gradient accent top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${section.gradient}`} />

                  <div className={`w-14 h-14 bg-gradient-to-br ${section.gradient} rounded-xl flex items-center justify-center mb-5
                                   shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <section.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 transition-colors"
                      style={{ color: 'var(--text-primary, #1a1f36)' }}>
                    {section.title}
                  </h3>
                  <p className="text-sm mb-5 flex-1 min-h-[40px] flex items-center"
                     style={{ color: 'var(--text-secondary, #64748b)' }}>
                    {section.description}
                  </p>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all"
                              style={{ color: 'var(--text-muted, #94a3b8)' }} />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
