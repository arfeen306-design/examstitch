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
  /** When set, groups with parent as root so a lone "Part 2" still nests correctly */
  parentResourceId?: string | null;
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

/** Professional Scholar — glass rows on navy portals (no solid white cards). */
const CARD_GLASS =
  'rounded-xl border border-slate-600/45 bg-slate-950/25 backdrop-blur-md shadow-inner ' +
  'transition-all duration-200 hover:border-amber-500/30 hover:bg-slate-950/40';

const ROW_INNER = 'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4';

const IDX_MAIN =
  'shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold tabular-nums ' +
  'bg-amber-500/12 text-amber-200 border border-amber-500/35';

const TITLE_MAIN = 'text-sm font-semibold text-slate-100 truncate flex items-center gap-2';

const BTN_WATCH =
  'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ' +
  'border border-amber-400/55 text-amber-200 bg-transparent ' +
  'transition-all duration-200 hover:bg-amber-400/10 hover:border-amber-300/75 hover:text-amber-100 ' +
  'hover:shadow-[0_0_18px_rgba(251,191,36,0.14)]';

const BTN_WORKSHEET =
  'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ' +
  'border border-slate-500/55 text-slate-200 bg-slate-900/30 backdrop-blur-sm ' +
  'transition-all duration-200 hover:border-amber-400/40 hover:text-amber-100/95 hover:bg-slate-900/50';

// ── Grouping logic ────────────────────────────────────────────────────────────

function getBaseTitle(title: string): string {
  return title
    .replace(/\s*[—–-]\s*Part\s+\d+\s*$/i, '')
    .replace(/\s*\(Part\s+\d+\)\s*$/i, '')
    .replace(/\s+Part\s+\d+\s*$/i, '')
    .trim();
}

function moduleRootId(mod: LearningModule, byId: Map<string, LearningModule>): string {
  let cur: LearningModule | undefined = mod;
  const seen = new Set<string>();
  while (cur?.parentResourceId) {
    if (seen.has(cur.id)) break;
    seen.add(cur.id);
    const p = byId.get(cur.parentResourceId);
    if (!p) break;
    cur = p;
  }
  return cur?.id ?? mod.id;
}

function groupModules(modules: LearningModule[]): TopicGroup[] {
  const byId = new Map(modules.map(m => [m.id, m]));
  const rootClusters = new Map<string, LearningModule[]>();

  for (const mod of modules) {
    const root = moduleRootId(mod, byId);
    if (!rootClusters.has(root)) rootClusters.set(root, []);
    rootClusters.get(root)!.push(mod);
  }

  const groups: TopicGroup[] = [];
  for (const [rootId, parts] of rootClusters) {
    const sorted = [...parts].sort((a, b) => {
      if (a.id === rootId) return -1;
      if (b.id === rootId) return 1;
      return a.title.localeCompare(b.title);
    });
    const root = sorted.find(p => p.id === rootId) ?? sorted[0];
    groups.push({
      baseTitle: getBaseTitle(root.title),
      parts: sorted,
    });
  }
  groups.sort((a, b) => a.baseTitle.localeCompare(b.baseTitle));
  return groups;
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-5 py-4 animate-pulse border-b border-slate-700/40">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-7 h-7 rounded-lg shrink-0 bg-slate-800/60" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 rounded-full w-1/3 bg-slate-800/50" />
          <div className="h-3 rounded-full w-1/5 bg-slate-800/35" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-24 rounded-lg bg-slate-800/40" />
        <div className="h-7 w-20 rounded-lg bg-slate-800/30" />
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
      <div className="w-14 h-14 rounded-2xl bg-slate-900/40 border border-slate-600/40 flex items-center justify-center mb-4 backdrop-blur-md">
        <BookOpen className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">{message}</p>
    </motion.div>
  );
}

// ── Action pills ───────────────────────────────────────────────────────────────

function ActionPills({ mod }: { mod: LearningModule }) {
  const redirectTo = encodeURIComponent(`/view/${mod.id}`);

  if (mod.isLocked) {
    return (
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Link
          href={`/auth/login?redirectTo=${redirectTo}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap border border-amber-600/50 text-amber-200 bg-amber-500/10 hover:bg-amber-500/15 transition"
        >
          <Lock className="w-3 h-3" />
          Members Only
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <Link href={`/view/${mod.id}`} className={BTN_WATCH}>
        <Play className="w-3 h-3 fill-amber-200/90" />
        Watch Video
      </Link>
      {mod.worksheetUrl && (
        <Link href={`/view/${mod.id}?mode=worksheet`} className={BTN_WORKSHEET}>
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
    <motion.div whileHover={{ scale: 1.005 }} className={`${CARD_GLASS} ${ROW_INNER}`}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span className={IDX_MAIN}>{String(globalIndex + 1).padStart(2, '0')}</span>
        <h3 className={TITLE_MAIN}>
          {group.baseTitle}
          {mod.isLocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 bg-orange-500/15 text-orange-200 border border-orange-400/25">
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
  const outer = `${CARD_GLASS} overflow-hidden ${isOpen ? 'border-amber-500/35 shadow-[0_8px_32px_rgba(0,0,0,0.35)]' : ''}`;

  const btnBg =
    'w-full flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-150 text-left ' +
    'bg-slate-950/20 hover:bg-slate-900/35';

  const chev = `${isOpen ? 'bg-amber-500/20 text-amber-200' : 'bg-slate-800/60 text-slate-400'} w-6 h-6 rounded-full flex items-center justify-center border border-slate-600/40`;

  const innerTop = 'border-t border-slate-700/45 bg-slate-950/20';
  const partRow =
    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 transition-colors border-b border-slate-800/55 last:border-b-0 hover:bg-slate-900/25';
  const partIdx =
    'shrink-0 w-8 h-6 flex items-center justify-center rounded-md text-xs font-bold tabular-nums bg-slate-900/55 border border-slate-600/45 text-amber-200/90';
  const partTitle = 'text-sm text-slate-200 truncate';

  return (
    <div className={outer}>
      <motion.button onClick={onToggle} whileTap={{ scale: 0.998 }} className={btnBg}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold tabular-nums transition-colors ${
              isOpen ? 'bg-amber-500/25 text-amber-100 border border-amber-400/40' : IDX_MAIN
            }`}
          >
            {String(globalIndex + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 truncate">{group.baseTitle}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Layers className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-400">{group.parts.length} parts</span>
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
  const effectiveModules = isAdmin ? modules.map(m => (m.isLocked ? { ...m, isLocked: false } : m)) : modules;

  if (isLoading) {
    return (
      <div className={`${CARD_GLASS} overflow-hidden rounded-2xl`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!effectiveModules.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  const groups = groupModules(effectiveModules);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
      <div className="flex items-center justify-between px-1 pb-2 mb-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          {groups.length} topic{groups.length !== 1 ? 's' : ''}
          {groups.some(g => g.parts.length > 1) && <span className="ml-1 text-slate-500">· click to expand parts</span>}
        </p>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block bg-amber-400/90" />
            Video
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block bg-slate-400" />
            Worksheet
          </span>
        </div>
      </div>

      {groups.map((group, groupIndex) => (
        <motion.div key={group.baseTitle} variants={rowVariants}>
          {group.parts.length === 1 && !group.parts[0].parentResourceId ? (
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
