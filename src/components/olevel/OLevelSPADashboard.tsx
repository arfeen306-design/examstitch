'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronDown, PlayCircle, FileText, BookOpen, PenTool,
  ExternalLink, Star, ArrowRight,
} from 'lucide-react';
import UnifiedModuleGrid, { type LearningModule } from '@/components/resources/UnifiedModuleGrid';
import ResourceGrid, { type ResourceItem } from '@/components/resources/ResourceGrid';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GradeSpaData {
  slug: string;
  label: string;
  description: string;
  videoModules: LearningModule[];
  topics: { topic: string; count: number }[];
  pastPapers: ResourceItem[];
  hasPastPapers: boolean;
}

interface Props {
  subject: string;
  heading: string;
  label: string;
  grades: GradeSpaData[];
}

type ActiveTab = 'videos' | 'topical' | 'papers';

// ── Grade visual config ───────────────────────────────────────────────────────

const GRADE_CONFIG: Record<string, {
  gradient: string;
  glow: string;
  number: string;
  labelColor: string;
  badgeBg: string;
}> = {
  'grade-9': {
    gradient: 'from-blue-700 to-indigo-700',
    glow: 'rgba(67,56,202,0.3)',
    number: '09',
    labelColor: '#93c5fd',
    badgeBg: 'rgba(59,130,246,0.15)',
  },
  'grade-10': {
    gradient: 'from-sky-700 to-blue-700',
    glow: 'rgba(3,105,161,0.3)',
    number: '10',
    labelColor: '#7dd3fc',
    badgeBg: 'rgba(14,165,233,0.15)',
  },
  'grade-11': {
    gradient: 'from-emerald-700 to-teal-700',
    glow: 'rgba(4,120,87,0.32)',
    number: '11',
    labelColor: '#6ee7b7',
    badgeBg: 'rgba(16,185,129,0.15)',
  },
};

const DEFAULT_GRADE_CFG = {
  gradient: 'from-slate-600 to-slate-700',
  glow: 'rgba(100,116,139,0.2)',
  number: '??',
  labelColor: '#94a3b8',
  badgeBg: 'rgba(100,116,139,0.15)',
};

// ── Animation variants ────────────────────────────────────────────────────────

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const } },
};

// ── Topic grid (Topical Worksheets tab content) ───────────────────────────────

function TopicGrid({
  topics,
  basePath,
}: {
  topics: { topic: string; count: number }[];
  basePath: string;
}) {
  if (!topics.length) {
    return (
      <div className="flex flex-col items-center py-14 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
          <BookOpen className="w-6 h-6 text-white/25" />
        </div>
        <p className="text-sm font-medium text-white/40">No topical worksheets yet</p>
        <p className="text-xs text-white/20 mt-1 max-w-xs">Topics will appear here once worksheets are uploaded via the admin dashboard.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      {topics.map((item) => {
        const slug = item.topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return (
          <motion.div key={item.topic} variants={itemVariants}>
            <Link href={`${basePath}/${slug}`} className="block group">
              <div
                className="rounded-xl p-4 flex items-center gap-3 transition-all duration-200"
                style={{
                  background: 'rgba(8,14,28,0.55)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(251,191,36,0.3)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(14,24,48,0.75)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(8,14,28,0.55)';
                }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-700 to-teal-700 shadow-md group-hover:scale-105 transition-transform">
                  <PenTool className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate">{item.topic}</p>
                  <p className="text-xs text-white/30">{item.count} worksheet{item.count !== 1 ? 's' : ''}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-amber-300/70 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ── Grade row ─────────────────────────────────────────────────────────────────

function GradeRow({
  grade,
  subject,
  isActive,
  onToggle,
  activeTab,
  onTabChange,
}: {
  grade: GradeSpaData;
  subject: string;
  isActive: boolean;
  onToggle: () => void;
  activeTab: ActiveTab;
  onTabChange: (t: ActiveTab) => void;
}) {
  const cfg = GRADE_CONFIG[grade.slug] ?? DEFAULT_GRADE_CFG;
  const topicalBasePath = `/olevel/${subject}/${grade.slug}/topical`;

  type TabConfig = {
    key: ActiveTab;
    label: string;
    shortLabel: string;
    Icon: typeof PlayCircle;
    activeText: string;
    underline: string;
    glow: string;
    highlight?: boolean;
  };

  const tabs: TabConfig[] = [
    {
      key: 'videos',
      label: 'Video Lectures',
      shortLabel: 'Videos',
      Icon: PlayCircle,
      activeText: 'text-rose-300',
      underline: 'linear-gradient(90deg, transparent, #f87171, #ef4444, transparent)',
      glow: 'rgba(239,68,68,0.18)',
    },
    {
      key: 'topical',
      label: 'Topical Worksheets',
      shortLabel: 'Topics',
      Icon: PenTool,
      activeText: 'text-emerald-300',
      underline: 'linear-gradient(90deg, transparent, #34d399, #10b981, transparent)',
      glow: 'rgba(16,185,129,0.18)',
    },
    ...(grade.hasPastPapers
      ? [{
          key: 'papers' as ActiveTab,
          label: 'Solved Past Papers',
          shortLabel: 'Papers',
          Icon: FileText,
          activeText: 'text-amber-300',
          underline: 'linear-gradient(90deg, transparent, #fbbf24, #f59e0b, transparent)',
          glow: 'rgba(245,158,11,0.22)',
          highlight: true,
        }]
      : []),
  ];

  const videoCount  = grade.videoModules.length;
  const topicCount  = grade.topics.length;
  const paperCount  = grade.pastPapers.length;

  return (
    <motion.div layout variants={itemVariants} className="relative">
      {/* Grade card */}
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.996 }}
        className={`w-full text-left rounded-2xl transition-all duration-300 ${
          isActive
            ? 'border border-white/[0.12] bg-white/[0.05]'
            : 'portal-glass-card portal-glass-card--interactive'
        }`}
        style={isActive ? { boxShadow: `0 12px 40px ${cfg.glow}, 0 0 0 1px rgba(255,255,255,0.05)` } : undefined}
      >
        <div className="flex items-center gap-4 p-5">
          {/* Grade number badge */}
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shrink-0 shadow-lg font-black text-lg text-white transition-all duration-300 ${isActive ? 'scale-110 shadow-xl' : ''}`}
            style={isActive ? { boxShadow: `0 8px 24px ${cfg.glow}` } : undefined}
          >
            {cfg.number}
          </div>

          {/* Label + description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="text-[15px] font-bold leading-tight transition-colors"
                style={{ color: isActive ? '#fde68a' : cfg.labelColor }}
              >
                {grade.label}
              </h3>
              {grade.hasPastPapers && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Exam Ready
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{grade.description}</p>
          </div>

          {/* Resource counts */}
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 shrink-0 mr-1">
            {videoCount > 0 && (
              <span className="flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-red-400/80" />
                {videoCount}
              </span>
            )}
            {topicCount > 0 && (
              <span className="flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-emerald-400/80" />
                {topicCount}
              </span>
            )}
            {paperCount > 0 && (
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400/80" />
                {paperCount}
              </span>
            )}
            <Link
              href={`/olevel/${subject}/${grade.slug}`}
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
                background: 'rgba(6,11,24,0.75)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)`,
              }}
            >
              {/* Tab bar — distinct colour per content stream */}
              <div className="flex border-b border-white/[0.07] relative bg-black/[0.22]">
                {tabs.map((tab) => {
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
                      {tab.highlight && !selected && (
                        <Star className="w-2.5 h-2.5 text-amber-400/60 fill-current ml-0.5 shrink-0" />
                      )}
                      {selected && (
                        <motion.div
                          layoutId={`tab-line-olevel-${grade.slug}`}
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
                    {activeTab === 'videos' && (
                      <UnifiedModuleGrid
                        modules={grade.videoModules}
                        emptyTitle="No video lectures yet"
                        emptyMessage="Video lectures for this grade will appear here once uploaded."
                      />
                    )}
                    {activeTab === 'topical' && (
                      <TopicGrid topics={grade.topics} basePath={topicalBasePath} />
                    )}
                    {activeTab === 'papers' && grade.hasPastPapers && (
                      <ResourceGrid
                        resources={grade.pastPapers}
                        emptyTitle="No past papers yet"
                        emptyMessage="Solved past papers for Grade 11 will appear here once uploaded."
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

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function OLevelSPADashboard({ subject, heading, label, grades }: Props) {
  const [activeGrade, setActiveGrade]   = useState<string | null>(null);
  const [tabByGrade, setTabByGrade]     = useState<Record<string, ActiveTab>>({});

  function handleToggle(slug: string) {
    setActiveGrade((prev) => (prev === slug ? null : slug));
    setTabByGrade((prev) => ({ ...prev, [slug]: prev[slug] ?? 'videos' }));
  }

  function handleTabChange(slug: string, tab: ActiveTab) {
    setTabByGrade((prev) => ({ ...prev, [slug]: tab }));
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ── Hero ── */}
      <div className="gradient-hero pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-3">
            <Link href="/olevel" className="text-white/50 hover:text-white/70 transition-colors">O-Level / IGCSE</Link>
            <span className="text-white/30">/</span>
            <span className="font-medium" style={{ color: 'var(--accent, #3b82f6)' }}>{label}</span>
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
            Select your grade to expand videos and worksheets inline — Grade 11 also includes solved past papers.
          </motion.p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="portal-page-body portal-surface-navy max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Grade accordion */}
          <div className="flex-1 min-w-0">
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {grades.map((grade) => (
                <GradeRow
                  key={grade.slug}
                  grade={grade}
                  subject={subject}
                  isActive={activeGrade === grade.slug}
                  onToggle={() => handleToggle(grade.slug)}
                  activeTab={tabByGrade[grade.slug] ?? 'videos'}
                  onTabChange={(tab) => handleTabChange(grade.slug, tab)}
                />
              ))}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-[88px] space-y-5">
              {/* Quick select */}
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(6,11,24,0.65)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Quick Select</h3>
                <div className="space-y-1.5">
                  {grades.map((grade) => {
                    const cfg = GRADE_CONFIG[grade.slug] ?? DEFAULT_GRADE_CFG;
                    const isActive = activeGrade === grade.slug;
                    return (
                      <button
                        key={grade.slug}
                        onClick={() => handleToggle(grade.slug)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-all ${
                          isActive
                            ? 'text-amber-200 bg-amber-500/10 border border-amber-500/20'
                            : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0"
                          style={{ background: `linear-gradient(135deg, var(--grade-from, #1d4ed8), var(--grade-to, #4338ca))` }}
                        >
                          {cfg.number}
                        </span>
                        <span className="truncate flex-1">{grade.label}</span>
                        {grade.hasPastPapers && <Star className="w-3 h-3 text-amber-400/70 fill-current shrink-0" />}
                        {isActive && <ChevronDown className="w-3 h-3 ml-auto rotate-180 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5">
                  {[
                    { Icon: PlayCircle, color: 'text-red-400', label: 'Video Lectures' },
                    { Icon: PenTool,    color: 'text-emerald-400', label: 'Topical Worksheets' },
                    { Icon: FileText,   color: 'text-amber-400', label: 'Past Papers (Gr. 11)' },
                  ].map(({ Icon, color, label: l }) => (
                    <div key={l} className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Icon className={`w-3 h-3 ${color} shrink-0`} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              <NotifyMeBox level="olevel" sourcePage={`/olevel/${subject}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
