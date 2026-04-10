'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Play, FileText, BookOpen, ChevronDown, Layers, Lock } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';

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

function SkeletonRow({ beach }: { beach: boolean }) {
  const b = beach ? 'border-slate-200' : 'border-white/[0.06]';
  const bg = beach ? 'bg-slate-200' : 'bg-white/[0.08]';
  const bg2 = beach ? 'bg-slate-100' : 'bg-white/[0.04]';
  return (
    <div className={`flex items-center justify-between px-5 py-4 animate-pulse border-b ${b}`}>
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-7 h-7 rounded-lg shrink-0 ${bg}`} />
        <div className="space-y-1.5 flex-1">
          <div className={`h-4 rounded-full w-1/3 ${bg}`} />
          <div className={`h-3 rounded-full w-1/5 ${bg2}`} />
        </div>
      </div>
      <div className="flex gap-2">
        <div className={`h-7 w-24 rounded-full ${beach ? 'bg-slate-200' : 'bg-white/[0.06]'}`} />
        <div className={`h-7 w-20 rounded-full ${bg2}`} />
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ title, message, beach }: { title: string; message: string; beach: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        className={
          beach
            ? 'w-14 h-14 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center mb-4'
            : 'w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mb-4'
        }
      >
        <BookOpen className={beach ? 'w-7 h-7 text-slate-500' : 'w-7 h-7 text-white/30'} />
      </div>
      <h3 className={beach ? 'text-sm font-semibold text-slate-800 mb-1' : 'text-sm font-semibold text-white/60 mb-1'}>
        {title}
      </h3>
      <p className={beach ? 'text-xs text-slate-600 max-w-xs leading-relaxed' : 'text-xs text-white/30 max-w-xs leading-relaxed'}>
        {message}
      </p>
    </motion.div>
  );
}

// ── Action Pills ───────────────────────────────────────────────────────────────

function ActionPills({ mod, beach }: { mod: LearningModule; beach: boolean }) {
  const redirectTo = encodeURIComponent(`/view/${mod.id}`);

  if (mod.isLocked) {
    return (
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Link
          href={`/auth/login?redirectTo=${redirectTo}`}
          className={
            beach
              ? 'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full shadow-sm transition-all duration-150 hover:shadow-md whitespace-nowrap bg-amber-100 text-amber-900 border-2 border-amber-700/40 hover:bg-amber-200'
              : 'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full shadow-sm transition-all duration-150 hover:shadow-md whitespace-nowrap bg-orange-500/20 text-orange-300 border border-orange-400/30 hover:bg-orange-500/30'
          }
        >
          <Lock className="w-3 h-3" />
          Members Only
        </Link>
      </div>
    );
  }

  const worksheetClass = beach
    ? 'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full shadow-sm transition-all duration-150 hover:shadow-md whitespace-nowrap bg-white text-navy-900 border-2 border-slate-400 hover:bg-slate-50 hover:border-slate-500'
    : 'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full shadow-sm transition-all duration-150 hover:shadow-md whitespace-nowrap bg-white/[0.06] text-white/60 border border-white/[0.1] hover:bg-white/[0.1] hover:text-white/80';

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <Link
        href={`/view/${mod.id}`}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                   text-xs font-semibold rounded-full shadow-sm
                   transition-all duration-150 hover:shadow-md whitespace-nowrap
                   bg-gradient-to-r from-red-500 to-rose-600 text-white border border-red-700/30"
      >
        <Play className="w-3 h-3 fill-white" />
        Watch Video
      </Link>
      {mod.worksheetUrl && (
        <Link href={`/view/${mod.id}?mode=worksheet`} className={worksheetClass}>
          <FileText className="w-3 h-3" />
          Worksheet
        </Link>
      )}
    </div>
  );
}

// ── Single topic row ─────────────────────────────────────────────────────────

function SingleRow({ group, globalIndex, beach }: { group: TopicGroup; globalIndex: number; beach: boolean }) {
  const mod = group.parts[0];
  const row = beach
    ? 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 rounded-xl transition-all duration-200 bg-white border border-slate-300 shadow-sm hover:border-slate-400 hover:shadow'
    : 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 rounded-xl transition-all duration-200 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15]';
  const idx = beach
    ? 'shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold tabular-nums bg-slate-200 text-slate-800'
    : 'shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold tabular-nums bg-white/[0.08] text-white/50';
  const title = beach
    ? 'text-sm font-semibold text-slate-900 truncate transition-colors duration-150 flex items-center gap-2'
    : 'text-sm font-semibold text-white/80 truncate transition-colors duration-150 flex items-center gap-2';
  const lockPill = beach
    ? 'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 bg-amber-100 text-amber-900 border border-amber-700/30'
    : 'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 bg-orange-500/10 text-orange-300';

  return (
    <motion.div whileHover={{ scale: 1.005 }} className={row}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span className={idx}>{String(globalIndex + 1).padStart(2, '0')}</span>
        <h3 className={title}>
          {group.baseTitle}
          {mod.isLocked && (
            <span className={lockPill}>
              <Lock className="w-2.5 h-2.5" /> Locked
            </span>
          )}
        </h3>
      </div>
      <div className="pl-11 sm:pl-0">
        <ActionPills mod={mod} beach={beach} />
      </div>
    </motion.div>
  );
}

// ── Accordion row ────────────────────────────────────────────────────────────

function AccordionRow({
  group, globalIndex, isOpen, onToggle, beach,
}: {
  group: TopicGroup; globalIndex: number; isOpen: boolean; onToggle: () => void; beach: boolean;
}) {
  const outer = beach
    ? `rounded-xl transition-all duration-200 overflow-hidden border bg-white ${isOpen ? 'border-indigo-400 shadow-md' : 'border-slate-300'}`
    : `rounded-xl transition-all duration-200 overflow-hidden border ${isOpen ? 'border-indigo-500/40 shadow-[0_6px_24px_rgba(99,102,241,0.1)]' : 'border-white/[0.08]'}`;

  const btnBg = beach
    ? 'w-full flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-150 text-left bg-slate-50 hover:bg-slate-100'
    : 'w-full flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-150 text-left bg-white/[0.04] hover:bg-white/[0.07]';

  const idxClosed = beach ? 'bg-slate-200 text-slate-800' : 'bg-white/[0.08] text-white/50';
  const titleC = beach ? 'text-sm font-semibold text-slate-900 truncate' : 'text-sm font-semibold text-white/80 truncate';
  const metaC = beach ? 'text-xs text-slate-600' : 'text-xs text-white/30';
  const layersC = beach ? 'w-3 h-3 text-slate-500' : 'w-3 h-3 text-white/30';

  const chev = beach
    ? `${isOpen ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'} w-6 h-6 rounded-full flex items-center justify-center`
    : `${isOpen ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.06] text-white/30'} w-6 h-6 rounded-full flex items-center justify-center`;

  const innerTop = beach ? 'border-t border-slate-200 bg-slate-50/80' : 'border-t border-white/[0.06] bg-white/[0.02]';
  const partRow = beach
    ? 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-150 border-b border-slate-200'
    : 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-150 border-b border-white/[0.04]';
  const partIdx = beach
    ? 'shrink-0 w-8 h-6 flex items-center justify-center rounded-md text-xs font-bold tabular-nums bg-white border border-slate-300 text-slate-700'
    : 'shrink-0 w-8 h-6 flex items-center justify-center rounded-md text-xs font-bold tabular-nums bg-white/[0.06] border border-white/[0.08] text-white/40';
  const partTitle = beach ? 'text-sm text-slate-800 truncate' : 'text-sm text-white/50 truncate';

  return (
    <div className={outer}>
      <motion.button onClick={onToggle} whileTap={{ scale: 0.998 }} className={btnBg}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold tabular-nums transition-colors ${
              isOpen ? 'bg-indigo-500 text-white' : idxClosed
            }`}
          >
            {String(globalIndex + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <h3 className={titleC}>{group.baseTitle}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Layers className={layersC} />
              <span className={metaC}>{group.parts.length} parts</span>
            </div>
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className={chev}>
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
            <div className={innerTop}>
              {group.parts.map((part, partIndex) => (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: partIndex * 0.06, duration: 0.25 }}
                  className={partRow}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={partIdx}>
                      {globalIndex + 1}.{partIndex + 1}
                    </span>
                    <span className={partTitle}>
                      {part.title !== group.baseTitle
                        ? part.title.replace(group.baseTitle, '').replace(/^[\s—–-]+/, '').trim() || `Part ${partIndex + 1}`
                        : `Part ${partIndex + 1}`}
                    </span>
                  </div>
                  <div className="pl-11 sm:pl-0">
                    <ActionPills mod={part} beach={beach} />
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
  const { theme } = useTheme();
  const beach = theme === 'beach';

  const isAdmin = typeof document !== 'undefined' && document.cookie.includes('admin_mode=1');
  const effectiveModules = isAdmin
    ? modules.map(m => m.isLocked ? { ...m, isLocked: false } : m)
    : modules;

  if (isLoading) {
    return (
      <div
        className={
          beach
            ? 'rounded-2xl overflow-hidden bg-white border border-slate-300 shadow-sm'
            : 'rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08]'
        }
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} beach={beach} />
        ))}
      </div>
    );
  }

  if (!effectiveModules.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} beach={beach} />;
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
        <p
          className={
            beach
              ? 'text-xs font-semibold uppercase tracking-widest text-slate-700'
              : 'text-xs font-semibold uppercase tracking-widest text-white/30'
          }
        >
          {groups.length} topic{groups.length !== 1 ? 's' : ''}
          {groups.some(g => g.parts.length > 1) && (
            <span className={beach ? 'ml-1 text-slate-500' : 'ml-1 text-white/15'}>· click to expand parts</span>
          )}
        </p>
        <div className={beach ? 'flex items-center gap-4 text-xs text-slate-700' : 'flex items-center gap-4 text-xs text-white/30'}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block bg-red-500" />
            Video
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full inline-block ${beach ? 'bg-slate-500' : 'bg-white/20'}`} />
            Worksheet
          </span>
        </div>
      </div>

      {/* Rows */}
      {groups.map((group, groupIndex) => (
        <motion.div key={group.baseTitle} variants={rowVariants}>
          {group.parts.length === 1 ? (
            <SingleRow group={group} globalIndex={groupIndex} beach={beach} />
          ) : (
            <AccordionRow
              group={group}
              globalIndex={groupIndex}
              isOpen={openIndex === groupIndex}
              onToggle={() => setOpenIndex(openIndex === groupIndex ? null : groupIndex)}
              beach={beach}
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
