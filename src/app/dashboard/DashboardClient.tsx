'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, BookOpen, Clock, CheckCircle, GraduationCap,
  TrendingUp, Flame, Zap, Target, ArrowRight, Play,
  Brain, Rocket, Star, Trophy, ChevronRight, BarChart3,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface ProgressItem {
  id: string;
  is_completed: boolean;
  last_viewed_at: string;
  resource: {
    id: string;
    title: string;
    description: string | null;
    content_type: string;
    subject: string;
  };
}

interface UnlockedSkill {
  id: string;
  name: string;
  slug: string;
  icon: string;
  gradient: string;
  description: string | null;
}

interface SubjectProgress {
  subjectName: string;
  subjectSlug: string;
  viewed: number;
  total: number;
}

interface RecommendedResource {
  id: string;
  title: string;
  categoryName: string;
}

interface DashboardProps {
  studentName: string;
  studentLevel: string;
  progress: ProgressItem[];
  totalResources: number;
  unlockedSkills: UnlockedSkill[];
  subjectProgress?: SubjectProgress[];
  recommended?: RecommendedResource[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOTIVATIONAL QUOTES
   ═══════════════════════════════════════════════════════════════════════════ */

const QUOTES = [
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Education is the passport to the future.", author: "Malcolm X" },
  { text: "Success is the sum of small efforts, repeated.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else will.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "The harder you work, the luckier you get.", author: "Gary Player" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED BACKGROUND PARTICLES
   ═══════════════════════════════════════════════════════════════════════════ */

function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 15 + 10,
        delay: Math.random() * 5,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-teal-400/20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() > 0.5 ? 15 : -15, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANIMATED PROGRESS RING (SVG)
   ═══════════════════════════════════════════════════════════════════════════ */

function ProgressRing({ percentage, size = 120, strokeWidth = 8, color = '#14b8a6' }: {
  percentage: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="transparent"
          stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: 'easeOut', delay: 0.5 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-black text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5, type: 'spring' }}
        >
          {percentage}%
        </motion.span>
        <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Complete</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STREAK COUNTER
   ═══════════════════════════════════════════════════════════════════════════ */

function StreakBadge({ days }: { days: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
      className="relative"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/30">
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Flame className="w-4 h-4 text-yellow-200" />
        </motion.div>
        <span className="text-sm font-bold text-white">{days} Day Streak</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════════════ */

function StatCard({ icon: Icon, label, value, gradient, delay }: {
  icon: React.ElementType; label: string; value: string | number; gradient: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5 group cursor-default"
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${gradient.split(' ')[0]}15, transparent 60%)` }} />
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mt-0.5">{label}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function DashboardClient({
  studentName,
  studentLevel,
  progress,
  totalResources,
  unlockedSkills,
  subjectProgress = [],
  recommended = [],
}: DashboardProps) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [greeting, setGreeting] = useState('Welcome');
  const [currentTime, setCurrentTime] = useState('');

  const firstName = studentName.split(' ')[0];
  const completedCount = progress.filter((p) => p.is_completed).length;
  const percentage = totalResources > 0 ? Math.round((completedCount / totalResources) * 100) : 0;
  const recentlyViewed = progress.slice(0, 6);

  // Calculate streak (consecutive days with activity)
  const streak = useMemo(() => {
    if (progress.length === 0) return 0;
    const dates = [...new Set(progress.map((p) => new Date(p.last_viewed_at).toDateString()))];
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (dates.includes(d.toDateString())) count++;
      else if (i > 0) break;
    }
    return count;
  }, [progress]);

  // Greeting based on time of day
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good Morning');
    else if (h < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const fmt = new Intl.DateTimeFormat('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    setCurrentTime(fmt.format(new Date()));
  }, []);

  // Rotate quotes every 6 seconds
  useEffect(() => {
    const t = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const getTimeAgo = useCallback((date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative overflow-hidden">
      <FloatingParticles />

      {/* Gradient Orbs Background */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[128px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

        {/* ── HERO GREETING ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-teal-400 font-medium mb-1"
              >
                {currentTime}
              </motion.p>
              <h1 className="text-3xl sm:text-4xl font-black text-white">
                {greeting},{' '}
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {firstName}
                </span>
                ! ✨
              </h1>
              <p className="text-white/40 text-sm mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/60 text-xs font-semibold">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {studentLevel}
                </span>
              </p>
            </div>
            {streak > 0 && <StreakBadge days={streak} />}
          </div>

          {/* Motivational Quote Carousel */}
          <motion.div
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500 via-cyan-400 to-violet-500 rounded-full" />
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20"
              >
                <Brain className="w-5 h-5 text-white" />
              </motion.div>
              <div className="flex-1 min-h-[48px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={quoteIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-white/90 text-sm sm:text-base font-medium italic leading-relaxed">
                      &ldquo;{QUOTES[quoteIdx].text}&rdquo;
                    </p>
                    <p className="text-white/30 text-xs mt-1 font-medium">— {QUOTES[quoteIdx].author}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── STATS ROW ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Target} label="Total Resources" value={totalResources} gradient="from-blue-500 to-cyan-500" delay={0.1} />
          <StatCard icon={CheckCircle} label="Completed" value={completedCount} gradient="from-emerald-500 to-teal-500" delay={0.2} />
          <StatCard icon={Clock} label="In Progress" value={progress.length - completedCount} gradient="from-amber-500 to-orange-500" delay={0.3} />
          <StatCard icon={TrendingUp} label="Completion" value={`${percentage}%`} gradient="from-violet-500 to-purple-500" delay={0.4} />
        </div>

        {/* ── MAIN GRID ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT (2/3) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Progress Overview Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-6"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <ProgressRing percentage={percentage} />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                    <BarChart3 className="w-5 h-5 text-teal-400" /> Learning Progress
                  </h2>
                  <p className="text-white/40 text-sm mt-1">
                    You&apos;ve completed <span className="text-teal-400 font-bold">{completedCount}</span> of{' '}
                    <span className="text-white/60 font-bold">{totalResources}</span> resources in your level.
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4 w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut', delay: 0.8 }}
                    />
                  </div>

                  {percentage < 100 ? (
                    <p className="text-white/30 text-xs mt-3 flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5 text-violet-400" />
                      Keep going! You&apos;re {100 - percentage}% away from mastery.
                    </p>
                  ) : (
                    <p className="text-emerald-400 text-xs mt-3 flex items-center gap-1.5 font-semibold">
                      <Trophy className="w-3.5 h-3.5" /> 🎉 Congratulations! You&apos;ve completed everything!
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recently Viewed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-400" /> Recently Viewed
              </h2>

              {recentlyViewed.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recentlyViewed.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + idx * 0.1 }}
                    >
                      <Link
                        href={`/view/${p.resource.id}`}
                        className="group flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-teal-500/30 transition-all duration-300"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          p.is_completed
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20'
                        }`}>
                          {p.is_completed ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : (
                            <Play className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white/90 truncate group-hover:text-teal-300 transition-colors">
                            {p.resource.title}
                          </p>
                          <p className="text-[11px] text-white/30 flex items-center gap-2">
                            <span className="uppercase">{p.resource.subject}</span>
                            <span>•</span>
                            <span>{getTimeAgo(p.last_viewed_at)}</span>
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-teal-400 transition-colors shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="rounded-2xl border border-dashed border-white/10 p-12 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20"
                  >
                    <BookOpen className="w-8 h-8 text-white" />
                  </motion.div>
                  <p className="text-white/50 text-sm font-medium mb-1">No resources viewed yet</p>
                  <p className="text-white/30 text-xs mb-4">Start exploring to track your learning journey!</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 transition-shadow"
                  >
                    Explore Resources <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              )}
            </motion.div>

            {/* Subject Progress Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-violet-400" /> Subject Progress
              </h2>

              {subjectProgress.length > 0 ? (
                <div className="space-y-3">
                  {subjectProgress.map((sp, idx) => {
                    const pct = sp.total > 0 ? Math.round((sp.viewed / sp.total) * 100) : 0;
                    return (
                      <motion.div
                        key={sp.subjectSlug || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + idx * 0.1 }}
                        className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.03]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-white/90">{sp.subjectName}</span>
                          <span className="text-xs font-bold text-white/50">{sp.viewed} / {sp.total}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, ease: 'easeOut', delay: 1.2 + idx * 0.1 }}
                          />
                        </div>
                        <p className="text-[10px] text-white/30 mt-1">{pct}% complete</p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <p className="text-white/30 text-xs">No subject progress yet — start learning!</p>
                </div>
              )}
            </motion.div>

            {/* Recommended Next */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Rocket className="w-5 h-5 text-emerald-400" /> Recommended Next
              </h2>

              {recommended.length > 0 ? (
                <div className="space-y-2">
                  {recommended.map((r, idx) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + idx * 0.1 }}
                    >
                      <Link
                        href={`/view/${r.id}`}
                        className="group flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-300"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/80 truncate group-hover:text-emerald-300 transition-colors">{r.title}</p>
                          <p className="text-[10px] text-white/30">{r.categoryName}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-emerald-400 transition-colors shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <p className="text-white/30 text-xs">View some resources to get personalized recommendations!</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT SIDEBAR (1/3) */}
          <div className="space-y-6">

            {/* Unlocked Digital Skills */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-violet-400" /> Your Digital Skills
              </h3>

              {unlockedSkills.length > 0 ? (
                <div className="space-y-2">
                  {unlockedSkills.map((skill, idx) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + idx * 0.1 }}
                    >
                      <Link
                        href={`/digital-skills?skill=${skill.slug}`}
                        className="group flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-300"
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${skill.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white/80 truncate group-hover:text-violet-300 transition-colors">
                            {skill.name}
                          </p>
                          {skill.description && (
                            <p className="text-[10px] text-white/30 truncate">{skill.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-violet-400 transition-colors shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-white/30 text-xs mb-3">No skills unlocked yet</p>
                  <Link
                    href="/digital-skills"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-semibold hover:bg-violet-500/30 transition-colors"
                  >
                    Explore Skills <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-cyan-400" /> Quick Actions
              </h3>
              <div className="space-y-2">
                {[
                  { href: '/', label: 'Browse Resources', icon: BookOpen, gradient: 'from-blue-500 to-cyan-500' },
                  { href: '/digital-skills', label: 'Digital Skills', icon: Brain, gradient: 'from-violet-500 to-fuchsia-500' },
                  { href: '/demo', label: 'Book a Tutor', icon: Star, gradient: 'from-amber-500 to-orange-500' },
                ].map((action, idx) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-300"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-cyan-400 transition-colors ml-auto shrink-0" />
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Academic Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-5"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4 text-amber-400" /> Academic Info
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Current Level</div>
                  <div className="text-sm font-bold text-white/80 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] uppercase">
                    {studentLevel}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Account Status</div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <motion.span
                      className="w-2 h-2 rounded-full bg-emerald-400"
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-emerald-400">Active Student</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.02 }}
              className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-600 shadow-xl shadow-teal-500/10"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
              <Rocket className="w-8 h-8 text-white/80 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Level Up!</h3>
              <p className="text-white/70 text-xs mb-4 leading-relaxed">
                Consistency is key. Complete one more resource today and keep your streak alive!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#0A0F1C] text-xs font-bold shadow-lg hover:shadow-xl transition-shadow"
              >
                Continue Learning <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
