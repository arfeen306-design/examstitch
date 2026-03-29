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
    <div
      className="flex items-center justify-between px-5 py-4 animate-pulse"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="w-7 h-7 rounded-lg shrink-0" style={{ backgroundColor: 'var(--border-subtle)' }} />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 rounded-full w-1/3" style={{ backgroundColor: 'var(--border-subtle)' }} />
          <div className="h-3 rounded-full w-1/5" style={{ backgroundColor: 'var(--bg-surface)' }} />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-7 w-24 rounded-full" style={{ backgroundColor: 'var(--accent-subtle)' }} />
        <div className="h-7 w-20 rounded-full" style={{ backgroundColor: 'var(--bg-surface)' }} />
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
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
           style={{ backgroundColor: 'var(--bg-surface)' }}>
        <BookOpen className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
      <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{message}</p>
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
                   text-xs font-semibold rounded-full shadow-sm
                   transition-all duration-150 hover:shadow-md whitespace-nowrap"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--text-on-accent)',
        }}
      >
        <Play className="w-3 h-3" style={{ fill: 'var(--text-on-accent)' }} />
        Watch Video
      </Link>
      {mod.worksheetUrl && (
        <Link
          href={`/view/${mod.id}?mode=worksheet`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5
                     text-xs font-semibold rounded-full shadow-sm
                     transition-all duration-150 hover:shadow-md whitespace-nowrap"
          style={{
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-secondary)',
          }}
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
      whileHover={{ scale: 1.005, boxShadow: '0 6px 24px var(--shadow-color)' }}
      className="flex flex-col sm:flex-row sm:items-center justify-between
                 gap-3 px-5 py-4 rounded-xl transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <span
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold tabular-nums"
          style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}
        >
          {String(globalIndex + 1).padStart(2, '0')}
        </span>
        <h3 className="text-sm font-semibold truncate transition-colors duration-150"
            style={{ color: 'var(--text-primary)' }}>
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
    <div
      className="rounded-xl transition-all duration-200 overflow-hidden"
      style={{
        border: isOpen
          ? '1px solid var(--accent)'
          : '1px solid var(--border-subtle)',
        boxShadow: isOpen ? '0 6px 24px var(--shadow-color)' : 'none',
      }}
    >
      {/* Header — always visible */}
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.998 }}
        className="w-full flex items-center justify-between gap-4 px-5 py-4
                   transition-colors duration-150 text-left"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <span
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold tabular-nums transition-colors"
            style={{
              backgroundColor: isOpen ? 'var(--accent)' : 'var(--badge-bg)',
              color: isOpen ? 'var(--text-on-accent)' : 'var(--badge-text)',
            }}
          >
            {String(globalIndex + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {group.baseTitle}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Layers className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {group.parts.length} parts
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: isOpen ? 'var(--accent-subtle)' : 'var(--bg-surface)',
              color: isOpen ? 'var(--accent-text)' : 'var(--text-muted)',
            }}
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
            <div style={{
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
            }}>
              {group.parts.map((part, partIndex) => (
                <motion.div
                  key={part.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: partIndex * 0.06, duration: 0.25 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between
                             gap-3 px-5 py-3.5 transition-colors duration-150"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  {/* Sub-number + label */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="shrink-0 w-8 h-6 flex items-center justify-center
                                 rounded-md text-xs font-bold tabular-nums"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {globalIndex + 1}.{partIndex + 1}
                    </span>
                    <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
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
      <div className="rounded-2xl overflow-hidden"
           style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
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
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {groups.length} topic{groups.length !== 1 ? 's' : ''}
          {groups.some(g => g.parts.length > 1) && (
            <span className="ml-1" style={{ color: 'var(--border-color)' }}>· click to expand parts</span>
          )}
        </p>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'var(--accent)' }} />
            Video
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'var(--border-color)' }} />
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
