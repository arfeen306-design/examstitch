'use client';
// All interactive/animated homepage content — receives feed data as props from the server page

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

const SUBJECTS = ["Mathematics", "Computer Science", "Physics", "Chemistry"];

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

// ── LiveFeed UI — pure client component, receives data from server ──────────
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
      {/* Hero Section */}
      <section className="gradient-hero relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-700/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <motion.div initial="hidden" animate="visible" className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8">
              <Star className="w-4 h-4 text-gold-500" />
              <span className="text-sm text-white/70">Free resources for Cambridge students</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              <span className="sr-only">Master O and A-level Mathematics, Computer Science, Physics, Chemistry</span>
              <span aria-hidden>Master{' '}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={subjectIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="text-gold-500 inline-block"
                  >
                    {SUBJECTS[subjectIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Cambridge O-Level & A-Level past papers with video solutions — organised by topic, year, and paper.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/olevel"
                className="inline-flex items-center gap-2 px-8 py-4 gradient-gold rounded-full font-semibold text-navy-900 hover:opacity-90 transition-opacity text-base"
              >
                Start with O-Level <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/20 rounded-full font-medium text-white hover:bg-white/15 transition-colors text-base"
              >
                <Search className="w-5 h-5" />
                Search Resources
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} custom={4} className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <Icon className="w-5 h-5 text-gold-500/60 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-white tabular-nums">
                      <AnimatedCounter value={stat.value} duration={2000} delay={i * 150} />
                    </div>
                    <div className="text-xs text-white/40">{stat.label}</div>
                  </div>
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

      {/* Live Activity Feed — data passed from server page */}
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
                <div className="w-12 h-12 gradient-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-on-accent)' }}>{item.step}</span>
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
