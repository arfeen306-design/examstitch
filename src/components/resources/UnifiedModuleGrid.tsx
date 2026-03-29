'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Play, FileText, BookOpen, ChevronDown, Layers } from 'lucide-react';

export interface LearningModule {
  id: string;
  title: string;
  videoUrl: string;
  worksheetUrl?: string | null;
}

interface TopicGroup {
  baseTitle: string;
  parts: LearningModule[];
}

interface UnifiedModuleGridProps {
  modules: LearningModule[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
}

// ── Grouping logic ────────────────────────────────────────────────────────────
// Strips " — Part N", " Part N", " (Part N)" suffixes to get the base name.

function getBaseTitle(title: string): string {
  return title
    .replace(/\s*[—–-]\s*Part\s+\d+\s*$/i, '')
    .replace(/\s*\(Part\s+\d+\)\s*$/i, '')
    .replace(/\s+Part\s+\d+\s*$/i, '')
    .trim();
}

function groupModules(modules: LearningModule[]): TopicGroup[] {
  const map = new Map<string, LearningModule[]>();

  for (const mod of modules) {
    const base = getBaseTitle(mod.title);
    if (!map.has(base)) map.set(base, []);
    map.get(base)!.push(mod);
  }

  return Array.from(map.entries()).map(([baseTitle, parts]) => ({
    baseTitle,
    parts,
  }));
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-5 py-4 animate-pulse border-b border-navy-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-7 h-7 bg-navy-100 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-navy-100 rounded-full w-1/3" />
          <div className="h-3 bg-navy-50 rounded-full w-1/5" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-24 bg-gold-100 rounded-full" />
        <div className="h-7 w-20 bg-navy-50 rounded-full" />
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

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

// ── Action Pills ───────────────────────────────────────────────────────────────

function ActionPills({ mod }: { mod: LearningModule }) {
  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <Link
        href={`/view/${mod.id}`}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                   bg-gold-500 hover:bg-gold-400 text-navy-900
                   text-xs font-semibold rounded-full shadow-sm
                   transition-all duration-150 hover:shadow-md whitespace-nowrap"
      >
        <Play className="w-3 h-3 fill-navy-900" />
        Watch Video
      </Link>
      {mod.worksheetUrl && (
        <Link
          href={`/view/${mod.id}?mode=worksheet`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                     border border-navy-200 bg-white hover:bg-navy-50
                     text-navy-600 hover:text-navy-900
                     text-xs font-semibold rounded-full shadow-sm
                     transition-all duration-150 hover:shadow-md whitespace-nowrap"
        >
          <FileText className="w-3 h-3" />
          Worksheet
        </Link>
      )}
    </div>
  );
}

// ── Single topic row (no sub-topics) ─────────────────────────────────────────

function SingleRow({
  group,
  globalIndex,
}: {
  group: TopicGroup;
  globalIndex: number;
}) {
  const mod = group.parts[0];
  return (
    <motion.div
      whileHover={{ scale: 1.003, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
      className="flex flex-col sm:flex-row sm:items-center justify-between
                 gap-3 px-5 py-4 bg-white rounded-xl border border-navy-100/80
                 hover:border-gold-400/40 transition-colors duration-200"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                         bg-navy-900 text-white text-xs font-bold tabular-nums">
          {String(globalIndex + 1).padStart(2, '0')}
        </span>
        <h3 className="text-sm font-semibold text-navy-900 truncate hover:text-gold-600 transition-colors duration-150">
          {group.baseTitle}
        </h3>
      </div>
      <div className="pl-11 sm:pl-0">
        <ActionPills mod={mod} />
      </div>
    </motion.div>
  );
}

// ── Accordion row (has sub-topics) ────────────────────────────────────────────

function AccordionRow({
  group,
  globalIndex,
  isOpen,
  onToggle,
}: {
  group: TopicGroup;
  globalIndex: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden
                     ${isOpen ? 'border-gold-400/60 shadow-md' : 'border-navy-100/80 hover:border-gold-300/50'}`}>
      {/* Header — always visible */}
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.998 }}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 bg-white
                   hover:bg-gold-50/30 transition-colors duration-150 text-left"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg
                           text-xs font-bold tabular-nums transition-colors
                           ${isOpen ? 'bg-gold-500 text-navy-900' : 'bg-navy-900 text-white'}`}>
            {String(globalIndex + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-navy-900 truncate">
              {group.baseTitle}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Layers className="w-3 h-3 text-navy-400" />
              <span className="text-xs text-navy-400">
                {group.parts.length} parts
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Preview pills (first part) — shown when collapsed */}
          {!isOpen && (
            <div className="hidden sm:flex gap-2">
              <ActionPills mod={group.parts[0]} />
            </div>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className={`w-6 h-6 rounded-full flex items-center justify-center
                        ${isOpen ? 'bg-gold-100 text-gold-700' : 'bg-navy-50 text-navy-400'}`}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.button>

      {/* Expanded sub-topic list */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-navy-50 bg-navy-50/30 divide-y divide-navy-50/80">
              {group.parts.map((part, partIndex) => (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: partIndex * 0.06, duration: 0.25 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between
                             gap-3 px-5 py-3.5 hover:bg-white/60 transition-colors duration-150"
                >
                  {/* Sub-number + label */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="shrink-0 w-8 h-6 flex items-center justify-center
                                     rounded-md bg-white border border-navy-100
                                     text-xs font-bold text-navy-500 tabular-nums">
                      {globalIndex + 1}.{partIndex + 1}
                    </span>
                    <span className="text-sm text-navy-700 truncate">
                      {part.title !== group.baseTitle
                        ? part.title.replace(group.baseTitle, '').replace(/^[\s—–-]+/, '').trim() || `Part ${partIndex + 1}`
                        : `Part ${partIndex + 1}`
                      }
                    </span>
                  </div>
                  <div className="pl-11 sm:pl-0">
                    <ActionPills mod={part} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
};

export default function UnifiedModuleGrid({
  modules,
  isLoading = false,
  emptyTitle = 'No learning modules yet',
  emptyMessage = 'Upload your first video via the admin dashboard.',
}: UnifiedModuleGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-navy-100 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!modules.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  const groups = groupModules(modules);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {/* Legend */}
      <div className="flex items-center justify-between px-1 pb-2 mb-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-navy-400">
          {groups.length} topic{groups.length !== 1 ? 's' : ''}
          {groups.some(g => g.parts.length > 1) && (
            <span className="ml-1 text-navy-300">· click to expand parts</span>
          )}
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

      {/* Rows */}
      {groups.map((group, groupIndex) => (
        <motion.div key={group.baseTitle} variants={rowVariants}>
          {group.parts.length === 1 ? (
            <SingleRow group={group} globalIndex={groupIndex} />
          ) : (
            <AccordionRow
              group={group}
              globalIndex={groupIndex}
              isOpen={openIndex === groupIndex}
              onToggle={() => setOpenIndex(openIndex === groupIndex ? null : groupIndex)}
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
