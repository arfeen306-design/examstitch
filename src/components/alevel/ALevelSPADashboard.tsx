'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronDown, PlayCircle, FileText, Calculator, BarChart2,
  Zap, BookOpen, ExternalLink,
} from 'lucide-react';
import UnifiedModuleGrid, { type LearningModule } from '@/components/resources/UnifiedModuleGrid';
import ResourceGrid, { type ResourceItem } from '@/components/resources/ResourceGrid';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaperSpaData {
  slug: string;
  label: string;
  description: string;
  level: 'as-level' | 'a2-level';
  videoModules: LearningModule[];
  pastPapers: ResourceItem[];
}

interface Props {
  subject: string;
  heading: string;
  label: string;
  asPapers: PaperSpaData[];
  a2Papers: PaperSpaData[];
}

type ActiveTab = 'videos' | 'papers';

// ── Static config ─────────────────────────────────────────────────────────────

const PAPER_CONFIG: Record<string, {
  Icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  glow: string;
  accent: string;
}> = {
  'paper-1-pure-mathematics': {
    Icon: Calculator,
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'rgba(79,70,229,0.28)',
    accent: '#6366f1',
  },
  'paper-5-probability-statistics': {
    Icon: BarChart2,
    gradient: 'from-cyan-500 to-teal-600',
    glow: 'rgba(8,145,178,0.28)',
    accent: '#06b6d4',
  },
  'paper-3-pure-mathematics': {
    Icon: Calculator,
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(124,58,237,0.28)',
    accent: '#8b5cf6',
  },
  'paper-4-mechanics': {
    Icon: Zap,
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.28)',
    accent: '#f59e0b',
  },
};

const DEFAULT_CFG = {
  Icon: BookOpen,
  gradient: 'from-slate-500 to-slate-600',
  glow: 'rgba(100,116,139,0.2)',
  accent: '#94a3b8',
};

const TABS: {
  key: ActiveTab;
  label: string;
  shortLabel: string;
  Icon: typeof PlayCircle;
  /** Active text colour (tailwind class) */
  activeText: string;
  /** Active underline gradient (CSS string) */
  underline: string;
  /** Glow behind the active tab (CSS rgba) */
  glow: string;
}[] = [
  {
    key: 'videos',
    label: 'Video Lectures & Worksheets',
    shortLabel: 'Videos',
    Icon: PlayCircle,
    activeText: 'text-rose-300',
    underline: 'linear-gradient(90deg, transparent, #f87171, #ef4444, transparent)',
    glow: 'rgba(239,68,68,0.18)',
  },
  {
    key: 'papers',
    label: 'Solved Past Papers',
    shortLabel: 'Papers',
    Icon: FileText,
    activeText: 'text-sky-300',
    underline: 'linear-gradient(90deg, transparent, #60a5fa, #3b82f6, transparent)',
    glow: 'rgba(59,130,246,0.18)',
  },
];

// ── Animation variants ────────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden:   { opacity: 0, y: 18 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function PaperRow({
  paper,
  subject,
  isActive,
  onToggle,
  activeTab,
  onTabChange,
}: {
  paper: PaperSpaData;
  subject: string;
  isActive: boolean;
  onToggle: () => void;
  activeTab: ActiveTab;
  onTabChange: (t: ActiveTab) => void;
}) {
  const cfg = PAPER_CONFIG[paper.slug] ?? DEFAULT_CFG;
  const { Icon } = cfg;
  const levelSlug = paper.level;

  return (
    <motion.div layout variants={itemVariants} className="relative">
      {/* Card header */}
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.995 }}
        className={`w-full text-left rounded-2xl transition-all duration-300 ${
          isActive
            ? 'border border-white/[0.12] bg-white/[0.06]'
            : 'portal-glass-card portal-glass-card--interactive'
        }`}
        style={isActive ? { boxShadow: `0 12px 40px ${cfg.glow}, 0 0 0 1px rgba(255,255,255,0.06)` } : undefined}
      >
        <div className="flex items-center gap-4 p-5">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shrink-0 shadow-lg transition-all duration-300 ${isActive ? 'scale-110 shadow-xl' : ''}`}
            style={isActive ? { boxShadow: `0 8px 24px ${cfg.glow}` } : undefined}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-[15px] font-bold leading-tight transition-colors ${isActive ? 'text-amber-200' : 'text-slate-100'}`}>
              {paper.label}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-1">
              {paper.description}
            </p>
          </div>

          {/* Counts + deep-link */}
          <div className="hidden md:flex items-center gap-4 shrink-0 mr-1">
            {paper.videoModules.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <PlayCircle className="w-3.5 h-3.5 text-red-400/80" />
                {paper.videoModules.length} video{paper.videoModules.length !== 1 ? 's' : ''}
              </span>
            )}
            {paper.pastPapers.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <FileText className="w-3.5 h-3.5 text-blue-400/80" />
                {paper.pastPapers.length} paper{paper.pastPapers.length !== 1 ? 's' : ''}
              </span>
            )}
            <Link
              href={`/alevel/${subject}/${levelSlug}/${paper.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Full Page
            </Link>
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isActive ? 180 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
              isActive ? 'bg-amber-500/15 text-amber-300' : 'bg-white/[0.05] text-slate-400'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.button>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            key="expansion"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="mt-2 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.018)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.2)`,
              }}
            >
              {/* Tab bar — each tab has its own colour so the active stream is unmistakable */}
              <div className="flex border-b border-white/[0.07] relative bg-black/[0.18]">
                {TABS.map((tab) => {
                  const TabIcon = tab.Icon;
                  const selected = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => onTabChange(tab.key)}
                      className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-semibold transition-all duration-200 ${
                        selected ? tab.activeText : 'text-slate-400 hover:text-slate-200'
                      }`}
                      style={selected ? {
                        background: `radial-gradient(120% 100% at 50% 100%, ${tab.glow} 0%, transparent 70%)`,
                      } : undefined}
                    >
                      <TabIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                      {selected && (
                        <motion.div
                          layoutId={`tab-line-${paper.slug}`}
                          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                          style={{ background: tab.underline }}
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div className="p-4 sm:p-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    {activeTab === 'videos' ? (
                      <UnifiedModuleGrid
                        modules={paper.videoModules}
                        emptyTitle="No video lectures yet"
                        emptyMessage="Video lectures for this paper will be available soon."
                      />
                    ) : (
                      <ResourceGrid
                        resources={paper.pastPapers}
                        emptyTitle="No past papers yet"
                        emptyMessage="Solved past papers for this paper will be uploaded soon."
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LevelSection({
  title,
  badge,
  badgeColor,
  papers,
  subject,
  activePaper,
  tabByPaper,
  onToggle,
  onTabChange,
}: {
  title: string;
  badge: string;
  badgeColor: string;
  papers: PaperSpaData[];
  subject: string;
  activePaper: string | null;
  tabByPaper: Record<string, ActiveTab>;
  onToggle: (slug: string) => void;
  onTabChange: (slug: string, tab: ActiveTab) => void;
}) {
  return (
    <div>
      {/* Sticky level header */}
      <div
        className="sticky top-[64px] z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 mb-4 py-3 flex items-center gap-3"
        style={{
          background: 'color-mix(in srgb, var(--bg-primary, #0b1120) 88%, transparent)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs tracking-wide"
          style={{
            background: badgeColor === 'blue'
              ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(79,70,229,0.2))'
              : 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(168,85,247,0.2))',
            border: badgeColor === 'blue'
              ? '1px solid rgba(99,102,241,0.3)'
              : '1px solid rgba(139,92,246,0.3)',
            color: badgeColor === 'blue' ? '#93c5fd' : '#c4b5fd',
          }}
        >
          {badge}
        </div>
        <h2 className="text-lg font-bold" style={{ color: badgeColor === 'blue' ? '#bfdbfe' : '#ddd6fe' }}>
          {title}
        </h2>
        <div
          className="flex-1 h-px"
          style={{
            background: badgeColor === 'blue'
              ? 'linear-gradient(90deg, rgba(99,102,241,0.25), transparent)'
              : 'linear-gradient(90deg, rgba(139,92,246,0.25), transparent)',
          }}
        />
        <span className="text-xs text-slate-500 font-medium shrink-0">{papers.length} paper{papers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Paper rows */}
      <motion.div
        variants={listVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="space-y-3"
      >
        {papers.map((paper) => (
          <PaperRow
            key={paper.slug}
            paper={paper}
            subject={subject}
            isActive={activePaper === paper.slug}
            onToggle={() => onToggle(paper.slug)}
            activeTab={tabByPaper[paper.slug] ?? 'videos'}
            onTabChange={(tab) => onTabChange(paper.slug, tab)}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function ALevelSPADashboard({ subject, heading, label, asPapers, a2Papers }: Props) {
  const [activePaper, setActivePaper] = useState<string | null>(null);
  const [tabByPaper, setTabByPaper] = useState<Record<string, ActiveTab>>({});

  function handleToggle(slug: string) {
    setActivePaper((prev) => (prev === slug ? null : slug));
    setTabByPaper((prev) => ({ ...prev, [slug]: prev[slug] ?? 'videos' }));
  }

  function handleTabChange(slug: string, tab: ActiveTab) {
    setTabByPaper((prev) => ({ ...prev, [slug]: tab }));
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ── Hero header ── */}
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3">
            <Link href="/alevel" className="text-white/50 hover:text-white/70 transition-colors">A-Level</Link>
            <span className="text-white/30">/</span>
            <span className="font-medium" style={{ color: 'var(--accent, #f59e0b)' }}>{label}</span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-2"
          >
            {heading}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-white/60 max-w-xl text-sm"
          >
            Select a paper below to expand its videos and past papers — no page changes needed.
          </motion.p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="portal-page-body portal-surface-navy max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main accordion */}
          <div className="flex-1 min-w-0 space-y-10">
            {asPapers.length > 0 && (
              <LevelSection
                title="AS Level"
                badge="AS"
                badgeColor="blue"
                papers={asPapers}
                subject={subject}
                activePaper={activePaper}
                tabByPaper={tabByPaper}
                onToggle={handleToggle}
                onTabChange={handleTabChange}
              />
            )}

            {a2Papers.length > 0 && (
              <LevelSection
                title="A2 Level"
                badge="A2"
                badgeColor="purple"
                papers={a2Papers}
                subject={subject}
                activePaper={activePaper}
                tabByPaper={tabByPaper}
                onToggle={handleToggle}
                onTabChange={handleTabChange}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-[88px] space-y-5">
              {/* Quick select */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Select</h3>
                <div className="space-y-1.5">
                  {[...asPapers, ...a2Papers].map((paper) => {
                    const cfg = PAPER_CONFIG[paper.slug] ?? DEFAULT_CFG;
                    const isActive = activePaper === paper.slug;
                    return (
                      <button
                        key={paper.slug}
                        onClick={() => handleToggle(paper.slug)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-all ${
                          isActive
                            ? 'text-amber-200 bg-amber-500/10 border border-amber-500/20'
                            : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 bg-gradient-to-r ${cfg.gradient}`} />
                        <span className="truncate">{paper.label}</span>
                        {isActive && <ChevronDown className="w-3 h-3 ml-auto rotate-180 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <NotifyMeBox level="alevel" sourcePage={`/alevel/${subject}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
