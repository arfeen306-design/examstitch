'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play, FileText, BookOpen } from 'lucide-react';

export interface LearningModule {
  id: string;
  title: string;
  videoUrl: string;
  worksheetUrl?: string | null;
}

interface UnifiedModuleGridProps {
  modules: LearningModule[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
}

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-navy-50 animate-pulse">
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-navy-100 rounded-full w-1/3" />
        <div className="flex gap-2">
          <div className="h-7 w-20 bg-navy-50 rounded-full" />
          <div className="h-7 w-24 bg-navy-50 rounded-full" />
        </div>
      </div>
      <div className="h-5 w-5 bg-navy-100 rounded-full ml-4" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-14 h-14 bg-navy-50 rounded-2xl flex items-center justify-center mb-4">
        <BookOpen className="w-7 h-7 text-navy-300" />
      </div>
      <h3 className="text-sm font-semibold text-navy-700 mb-1">{title}</h3>
      <p className="text-xs text-navy-400 max-w-xs leading-relaxed">{message}</p>
    </motion.div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function TopicRow({ module, index }: { module: LearningModule; index: number }) {
  return (
    <motion.div
      variants={rowVariants}
      whileHover={{ scale: 1.005, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between
                 gap-3 px-5 py-4 bg-white rounded-xl border border-navy-100/80
                 hover:border-gold-400/40 transition-colors duration-200 cursor-default"
    >
      {/* Index + Title */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                         bg-navy-900 text-white text-xs font-bold tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="text-sm font-semibold text-navy-900 truncate
                       group-hover:text-gold-600 transition-colors duration-150">
          {module.title}
        </h3>
      </div>

      {/* Action Pills */}
      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 pl-11 sm:pl-0">
        {/* Video pill → navigate to viewer */}
        <Link
          href={`/view/${module.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                     bg-gold-500 hover:bg-gold-400 text-navy-900
                     text-xs font-semibold rounded-full shadow-sm
                     transition-all duration-150 hover:shadow-md"
        >
          <Play className="w-3 h-3 fill-navy-900" />
          Watch Video
        </Link>

        {/* Worksheet pill — only shown if worksheet URL exists */}
        {module.worksheetUrl && (
          <Link
            href={`/view/${module.id}?tab=worksheet`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                       border border-navy-200 bg-white hover:bg-navy-50
                       text-navy-600 hover:text-navy-900
                       text-xs font-semibold rounded-full shadow-sm
                       transition-all duration-150 hover:shadow-md"
          >
            <FileText className="w-3 h-3" />
            Worksheet
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UnifiedModuleGrid({
  modules,
  isLoading = false,
  emptyTitle = 'No learning modules yet',
  emptyMessage = 'Upload your first video via the admin dashboard.',
}: UnifiedModuleGridProps) {

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden divide-y divide-navy-50">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!modules.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {/* Header strip */}
      <div className="flex items-center justify-between px-1 pb-2 mb-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-navy-400">
          {modules.length} topic{modules.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-4 text-xs text-navy-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gold-400 inline-block" />
            Video
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-navy-200 inline-block" />
            Worksheet
          </span>
        </div>
      </div>

      {/* Topic rows */}
      {modules.map((mod, index) => (
        <TopicRow key={mod.id} module={mod} index={index} />
      ))}
    </motion.div>
  );
}
