'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  GraduationCap,
  BookOpen,
  Award,
  ArrowRight,
  FileText,
  PlayCircle,
  Users,
  Star,
  Video,
  Megaphone,
  Download,
  TrendingUp,
  Globe,
  CheckCircle,
} from 'lucide-react';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const levelCards = [
  {
    title: 'Pre O-Level',
    description: 'Build your foundation with core mathematical concepts',
    href: '/pre-olevel',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    count: 'Coming Soon',
  },
  {
    title: 'O-Level / IGCSE',
    description: 'Grade 9, 10 & 11 — Past papers, video solutions & topical worksheets',
    href: '/olevel',
    icon: GraduationCap,
    gradient: 'from-blue-500 to-indigo-600',
    count: 'Mathematics 4024/0580',
  },
  {
    title: 'A-Level',
    description: 'AS & A2 Level — Paper 1 to Paper 4 with full video solutions',
    href: '/alevel',
    icon: Award,
    gradient: 'from-gold-500 to-gold-700',
    count: 'Mathematics 9709',
  },
];

const stats = [
  { icon: FileText, value: '500+', label: 'Solved Past Papers' },
  { icon: PlayCircle, value: '200+', label: 'Video Solutions' },
  { icon: BookOpen, value: '50+', label: 'Topical Worksheets' },
  { icon: Users, value: '10K+', label: 'Students Helped' },
];

const SUBJECTS = ['Mathematics', 'Computer Science', 'Physics', 'Chemistry'];

// ── Feed types ──────────────────────────────────────────────────────────────
export interface FeedItem {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'worksheet' | 'blog';
  created_at: string;
  image_url?: string | null;
  content?: string | null;
}

const TYPE_CONFIG = {
  video:     { icon: Video,     label: 'Video',        bg: 'rgba(14, 165, 233, 0.12)', color: '#0EA5E9' },
  pdf:       { icon: FileText,  label: 'Past Paper',   bg: 'rgba(249, 115, 22, 0.12)', color: '#F97316' },
  worksheet: { icon: BookOpen,  label: 'Worksheet',    bg: 'rgba(34, 197, 94, 0.12)',  color: '#22C55E' },
  blog:      { icon: Megaphone, label: 'Announcement', bg: 'rgba(168, 85, 247, 0.12)', color: '#A855F7' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function isNew(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() < 48 * 60 * 60 * 1000;
}

// ── Floating Card Component ─────────────────────────────────────────────────
function FloatingCard({
  children,
  className = '',
  delay = 0,
  x = 0,
  y = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  x?: number;
  y?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: x - 20, y: y + 20 }}
      animate={{ opacity: 1, scale: 1, x, y }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute ${className}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: delay * 2 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Mini Line Graph SVG ─────────────────────────────────────────────────────
function MiniGraph() {
  return (
    <svg viewBox="0 0 120 40" className="w-full h-10" fill="none">
      <defs>
        <linearGradient id="graphGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 35 L20 28 L40 30 L60 18 L80 22 L100 10 L120 5"
        stroke="#FF6B35"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 1.2, ease: 'easeOut' }}
      />
      <path
        d="M0 35 L20 28 L40 30 L60 18 L80 22 L100 10 L120 5 L120 40 L0 40 Z"
        fill="url(#graphGrad)"
      />
    </svg>
  );
}

// ── Hero Illustration (Right Side) ──────────────────────────────────────────
function HeroIllustration() {
  return (
    <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px] flex items-center justify-center">
      {/* Organic blob background */}
      <motion.div
        className="absolute w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,53,0.15) 0%, rgba(255,107,53,0.05) 60%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Central visual — large graduation icon */}
      <motion.div
        className="relative z-10 w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-3xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F65 100%)',
          boxShadow: '0 20px 60px rgba(255, 107, 53, 0.35)',
        }}
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <GraduationCap className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 text-white" />
        {/* Decorative ring */}
        <motion.div
          className="absolute inset-[-8px] rounded-3xl border-2 border-white/20"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Floating Card 1: Predicted Grade */}
      <FloatingCard
        className="top-4 -left-4 sm:top-8 sm:left-0 lg:top-6 lg:-left-4 z-20"
        delay={0.8}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Predicted Grade</p>
            <p className="text-lg font-extrabold text-gray-900">A*</p>
          </div>
          <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500 text-white">+12%</span>
        </div>
      </FloatingCard>

      {/* Floating Card 2: Students Worldwide */}
      <FloatingCard
        className="bottom-8 -left-6 sm:bottom-12 sm:-left-2 lg:bottom-10 lg:-left-6 z-20"
        delay={1.0}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Students</p>
            <p className="text-lg font-extrabold text-gray-900">10K+</p>
          </div>
          <span className="text-[10px] font-medium text-gray-400">worldwide</span>
        </div>
      </FloatingCard>

      {/* Floating Card 3: Progress Score */}
      <FloatingCard
        className="top-12 -right-2 sm:top-16 sm:right-0 lg:top-10 lg:-right-4 z-20"
        delay={1.2}
      >
        <div
          className="px-4 py-3 rounded-2xl shadow-xl backdrop-blur-sm w-40"
          style={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Progress</p>
          </div>
          <MiniGraph />
          <p className="text-xs font-bold text-gray-700 mt-1">Score: <span className="text-orange-500">92%</span></p>
        </div>
      </FloatingCard>

      {/* Floating stars */}
      <FloatingCard className="bottom-4 right-4 sm:bottom-8 sm:right-8 z-20" delay={1.4}>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6 + i * 0.1, duration: 0.3, ease: 'backOut' }}
            >
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </motion.div>
          ))}
        </div>
      </FloatingCard>
    </div>
  );
}

// ── Social Proof Bar ────────────────────────────────────────────────────────
function SocialProofBar() {
  const avatarColors = ['#FF6B35', '#0EA5E9', '#22C55E', '#A855F7', '#F59E0B'];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="flex flex-wrap items-center gap-6"
    >
      {/* Avatar stack */}
      <div className="flex items-center">
        <div className="flex -space-x-2.5">
          {avatarColors.map((color, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.08, duration: 0.3 }}
              className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-md"
              style={{ backgroundColor: color, zIndex: 5 - i }}
            >
              {['Z', 'A', 'S', 'M', 'R'][i]}
            </motion.div>
          ))}
        </div>
        <div className="ml-3">
          <span className="text-white font-extrabold text-lg">10,000+</span>
          <p className="text-white/50 text-xs">Happy students</p>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-10 bg-white/15" />

      {/* Rating */}
      <div className="flex items-center gap-2">
        <span className="text-white font-extrabold text-lg">4.8/5</span>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-400/50 text-amber-400/50'}`}
            />
          ))}
        </div>
        <span className="text-white/40 text-xs">Student ratings</span>
      </div>
    </motion.div>
  );
}

// ── LiveFeed UI ─────────────────────────────────────────────────────────────
function LiveFeedUI({ items }: { items: FeedItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#22C55E' }} />
        <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Latest Updates
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
      </div>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--border-subtle)' }} />
        <div className="space-y-6">
          {items.map((item) => {
            const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.blog;
            const Icon = cfg.icon;
            const fresh = isNew(item.created_at);
            return (
              <div key={item.id} className="relative flex gap-4 pl-12">
                <div
                  className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2"
                  style={{ backgroundColor: cfg.bg, borderColor: 'var(--bg-primary)', outline: `2px solid ${cfg.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div
                  className="flex-1 rounded-xl p-4 transition-shadow hover:shadow-md"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 1px 4px var(--shadow-color)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {fresh && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                                style={{ backgroundColor: '#FF6B3520', color: '#FF6B35' }}>NEW</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                      {item.content && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{item.content}</p>
                      )}
                    </div>
                    <span className="text-xs shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>{timeAgo(item.created_at)}</span>
                  </div>
                  {item.type === 'blog' && item.image_url && (
                    <div className="mt-3">
                      <img src={item.image_url} alt={item.title} className="w-full rounded-lg object-cover max-h-48" loading="lazy" />
                      <a href={item.image_url} target="_blank" rel="noopener noreferrer" download
                         className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                         style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}>
                        <Download className="w-3 h-3" /> Download
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function HomeClient({ feedItems }: { feedItems: FeedItem[] }) {
  const [subjectIndex, setSubjectIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubjectIndex((prev) => (prev + 1) % SUBJECTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* ═══ HERO SECTION — Two-Column Human-Centric Layout ═══ */}
      <section className="gradient-hero relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 items-center">
            {/* ── LEFT COLUMN (60%) — Text & CTAs ── */}
            <motion.div
              initial="hidden"
              animate="visible"
              className="lg:col-span-3 text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-6">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white/70">Free resources for Cambridge students</span>
              </motion.div>

              {/* Main heading */}
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-4">
                <span className="sr-only">Master O and A-level Mathematics, Computer Science, Physics, Chemistry</span>
                <span aria-hidden>
                  Master O and A-level{' '}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={subjectIndex}
                      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                      className="inline-block"
                      style={{ color: '#FF6B35' }}
                    >
                      {SUBJECTS[subjectIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.h1>

              {/* Subtext */}
              <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-white/60 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Past papers with video solutions, topical worksheets, and expert video lectures — organized by grade, paper, and topic.
              </motion.p>

              {/* CTA Buttons — Vivid Orange */}
              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <Link
                  href="/olevel"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-base transition-all duration-300 hover:shadow-[0_8px_30px_rgba(255,107,53,0.4)] hover:scale-[1.02]"
                  style={{ backgroundColor: '#FF6B35' }}
                >
                  Start Learning Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/20 rounded-full font-medium text-white hover:bg-white/15 transition-all duration-300 text-base"
                >
                  <Search className="w-5 h-5" />
                  Search Resources
                </Link>
              </motion.div>

              {/* Social Proof */}
              <SocialProofBar />
            </motion.div>

            {/* ── RIGHT COLUMN (40%) — Human Element + Floating Cards ── */}
            <motion.div
              className="lg:col-span-2 relative"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <HeroIllustration />
            </motion.div>
          </div>

          {/* ── Stats Row ── */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="mt-16 sm:mt-20"
          >
            <motion.div
              variants={fadeUp}
              custom={5}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-3xl mx-auto"
            >
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    className="text-center px-4 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm"
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: '#FF6B35' }} />
                    <div className="text-2xl font-extrabold text-white tabular-nums">
                      <AnimatedCounter value={stat.value} duration={2000} delay={i * 150} />
                    </div>
                    <div className="text-[11px] text-white/40 font-medium">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L48 35C96 30 192 20 288 22C384 24 480 38 576 42C672 46 768 40 864 35C960 30 1056 26 1152 28C1248 30 1344 38 1392 42L1440 46V80H0V40Z" fill="var(--wave-fill)" />
          </svg>
        </div>
      </section>

      {/* Live Activity Feed */}
      <LiveFeedUI items={feedItems} />

      {/* Level Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="text-center mb-12">
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Choose Your Level
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Select your academic level to access organized resources for every paper and topic.
          </motion.p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {levelCards.map((card, i) => (
            <motion.div key={card.title} variants={fadeUp} custom={i + 2}>
              <Link href={card.href} className="block group">
                <div className="card-hover relative overflow-hidden rounded-2xl p-8 h-full"
                     style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
                  <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 transition-colors" style={{ color: 'var(--text-primary)' }}>{card.title}</h3>
                  <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{card.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium px-3 py-1 rounded-full"
                          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)' }}>{card.count}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all" style={{ color: 'var(--border-color)' }} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-20" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              How ExamStitch Works
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
              View past papers with instant video solutions — question by question.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Pick Your Paper', desc: 'Browse by grade, year, session, and variant.' },
              { step: '02', title: 'View & Print', desc: 'Open the paper in our built-in viewer. Print or download instantly.' },
              { step: '03', title: 'Watch Solutions', desc: 'Click any question number to jump directly to the video solution.' },
            ].map((item, i) => (
              <motion.div key={item.step} variants={fadeUp} custom={i + 2} className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#FF6B35' }}
                >
                  <span className="text-sm font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Notify Me Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-xl mx-auto">
          <NotifyMeBox level="general" sourcePage="/" />
        </div>
      </section>
    </>
  );
}
