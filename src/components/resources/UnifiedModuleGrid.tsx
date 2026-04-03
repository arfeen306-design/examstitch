'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Play, FileText, BookOpen, ChevronDown, Layers, Lock } from 'lucide-react';

export interface LearningModule {
  id: string;
  title: string;
  videoUrl: string;
  worksheetUrl?: string | null;
  isLocked?: boolean;
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
  return Array.from(map.entries()).map(([baseTitle, parts]) => ({ baseTitle, parts }));
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-5 py-4 animate-pulse border-b border-white/[0.06]">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-7 h-7 rounded-lg shrink-0 bg-white/[0.08]" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 rounded-full w-1/3 bg-white/[0.08]" />
          <div className="h-3 rounded-full w-1/5 bg-white/[0.04]" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-24 rounded-full bg-white/[0.06]" />
        <div className="h-7 w-20 rounded-full bg-white/[0.04]" />
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
      <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mb-4">
        <BookOpen className="w-7 h-7 text-white/30" />
      </div>
      <h3 className="text-sm font-semibold text-white/60 mb-1">{title}</h3>
      <p className="text-xs text-white/30 max-w-xs leading-relaxed">{message}</p>
    </motion.div>
  );
}

// ── Action Pills ───────────────────────────────────────────────────────────────

function ActionPills({ mod }: { mod: LearningModule }) {
  const redirectTo = encodeURIComponent(`/view/${mod.id}`);

  if (mod.isLocked) {
    return (
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Link
          href={`/auth/login?redirectTo=${redirectTo}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                     text-xs font-semibold rounded-full shadow-sm
                     transition-all duration-150 hover:shadow-md whitespace-nowrap
                     bg-orange-500/20 text-orange-300 border border-orange-400/30 hover:bg-orange-500/30"
        >
          <Lock className="w-3 h-3" />
          Members Only
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <Link
        href={`/view/${mod.id}`}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                   text-xs font-semibold rounded-full shadow-sm
                   transition-all duration-150 hover:shadow-md whitespace-nowrap
                   bg-gradient-to-r from-red-500 to-rose-600 text-white"
      >
        <Play className="w-3 h-3 fill-white" />
        Watch Video
      </Link>
      {mod.worksheetUrl && (
        <Link
          href={`/view/${mod.id}?mode=worksheet`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                     text-xs font-semibold rounded-full shadow-sm
                     transition-all duration-150 hover:shadow-md whitespace-nowrap
                     bg-white/[0.06] text-white/60 border border-white/[0.1] hover:bg-white/[0.1] hover:text-white/80"
        >
          <FileText className="w-3 h-3" />
          Worksheet
        </Link>
      )}
    </div>
  );
}

// ── Single topic row ─────────────────────────────────────────────────────────

function SingleRow({ group, globalIndex }: { group: TopicGroup; globalIndex: number }) {
  const mod = group.parts[0];
  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between
                 gap-3 px-5 py-4 rounded-xl transition-all duration-200
                 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15]"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold tabular-nums
                        bg-white/[0.08] text-white/50">
          {String(globalIndex + 1).padStart(2, '0')}
        </span>
        <h3 className="text-sm font-semibold text-white/80 truncate transition-colors duration-150 flex items-center gap-2">
          {group.baseTitle}
          {mod.isLocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0
                            bg-orange-500/10 text-orange-300">
              <Lock className="w-2.5 h-2.5" /> Locked
            </span>
          )}
        </h3>
      </div>
      <div className="pl-11 sm:pl-0">
        <ActionPills mod={mod} />
      </div>
    </motion.div>
  );
}

// ── Accordion row ────────────────────────────────────────────────────────────

function AccordionRow({
  group, globalIndex, isOpen, onToggle,
}: {
  group: TopicGroup; globalIndex: number; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className={`rounded-xl transition-all duration-200 overflow-hidden border
                    ${isOpen ? 'border-indigo-500/40 shadow-[0_6px_24px_rgba(99,102,241,0.1)]' : 'border-white/[0.08]'}`}>
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.998 }}
        className="w-full flex items-center justify-between gap-4 px-5 py-4
                   transition-colors duration-150 text-left bg-white/[0.04] hover:bg-white/[0.07]"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold tabular-nums transition-colors
                          ${isOpen ? 'bg-indigo-500 text-white' : 'bg-white/[0.08] text-white/50'}`}>
            {String(globalIndex + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white/80 truncate">{group.baseTitle}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Layers className="w-3 h-3 text-white/30" />
              <span className="text-xs text-white/30">{group.parts.length} parts</span>
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className={`w-6 h-6 rounded-full flex items-center justify-center
                     ${isOpen ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.06] text-white/30'}`}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

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
            <div className="border-t border-white/[0.06] bg-white/[0.02]">
              {group.parts.map((part, partIndex) => (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: partIndex * 0.06, duration: 0.25 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between
                             gap-3 px-5 py-3.5 transition-colors duration-150 border-b border-white/[0.04]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="shrink-0 w-8 h-6 flex items-center justify-center
                                     rounded-md text-xs font-bold tabular-nums
                                     bg-white/[0.06] border border-white/[0.08] text-white/40">
                      {globalIndex + 1}.{partIndex + 1}
                    </span>
                    <span className="text-sm text-white/50 truncate">
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

  const isAdmin = typeof document !== 'undefined' && document.cookie.includes('admin_mode=1');
  const effectiveModules = isAdmin
    ? modules.map(m => m.isLocked ? { ...m, isLocked: false } : m)
    : modules;

  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08]">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!effectiveModules.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  const groups = groupModules(effectiveModules);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {/* Legend */}
      <div className="flex items-center justify-between px-1 pb-2 mb-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
          {groups.length} topic{groups.length !== 1 ? 's' : ''}
          {groups.some(g => g.parts.length > 1) && (
            <span className="ml-1 text-white/15">· click to expand parts</span>
          )}
        </p>
        <div className="flex items-center gap-4 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block bg-red-500" />
            Video
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block bg-white/20" />
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
