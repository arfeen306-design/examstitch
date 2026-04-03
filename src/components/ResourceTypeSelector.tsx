'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, PlayCircle, ArrowRight, type LucideIcon } from 'lucide-react';

interface SectionConfig {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
  glow: string;
}

const defaultSections: SectionConfig[] = [
  {
    title: 'Video Lectures & Worksheets',
    description: 'Watch topic videos — each paired with a practice worksheet',
    href: 'video-lectures',
    icon: PlayCircle,
    gradient: 'from-red-500 to-rose-600',
    glow: 'rgba(239,68,68,0.25)',
  },
  {
    title: 'Solved Past Papers',
    description: 'Practice with official Cambridge past papers and mark schemes',
    href: 'past-papers',
    icon: FileText,
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'rgba(99,102,241,0.25)',
  },
];

interface ResourceTypeSelectorProps {
  basePath: string;
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  subtitle?: string;
  sections?: SectionConfig[];
}

export default function ResourceTypeSelector({
  basePath,
  breadcrumbs,
  title,
  subtitle = 'Choose a resource type to get started.',
  sections = defaultSections,
}: ResourceTypeSelectorProps) {
  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* Header */}
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="text-white/30">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-white/50 hover:text-white/70 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gold-500 font-medium">{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{title}</h1>
            <p className="text-white/60">{subtitle}</p>
          </motion.div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {sections.map((section, i) => (
            <motion.div
              key={section.href}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`${basePath}/${section.href}`} className="block group h-full">
                <div className="relative overflow-hidden rounded-2xl p-8 text-center h-full flex flex-col items-center
                                bg-white/[0.06] backdrop-blur-xl border border-white/[0.1]
                                hover:border-white/[0.2] hover:bg-white/[0.1] transition-all duration-300 glass-gpu">
                  {/* Glow on hover */}
                  <div
                    className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10"
                    style={{ background: section.glow }}
                  />

                  {/* Gradient accent line */}
                  <div className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r ${section.gradient} rounded-full opacity-60`} />

                  <div className={`w-14 h-14 bg-gradient-to-br ${section.gradient} rounded-xl flex items-center justify-center mb-5
                                   shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <section.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold-300 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-white/40 mb-5 flex-1 min-h-[40px] flex items-center">
                    {section.description}
                  </p>
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
