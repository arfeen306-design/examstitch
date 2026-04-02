'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useScroll,
  useSpring,
} from 'framer-motion';
import {
  Code2,
  Palette,
  Brain,
  Globe,
  Shield,
  Database,
  Smartphone,
  BarChart3,
  Search,
  Play,
  ChevronLeft,
  X,
  BookOpen,
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  Monitor,
  Volume2,
  Maximize2,
  ListVideo,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   SKILL CATALOGUE — easy to extend
   ═══════════════════════════════════════════════════════════════════════════ */

interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoId: string; // YouTube video ID
}

interface Skill {
  id: string;
  title: string;
  tagline: string;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  lessons: Lesson[];
}

const SKILLS: Skill[] = [
  {
    id: 'coding',
    title: 'Coding',
    tagline: 'Build the future, one line at a time',
    icon: Code2,
    gradient: 'from-violet-600 to-indigo-700',
    glowColor: 'rgba(124,58,237,0.35)',
    lessons: [
      { id: 'c1', title: 'Variables & Data Types', duration: '12:30', videoId: 'dQw4w9WgXcQ' },
      { id: 'c2', title: 'Control Flow & Loops', duration: '18:45', videoId: 'dQw4w9WgXcQ' },
      { id: 'c3', title: 'Functions & Scope', duration: '15:20', videoId: 'dQw4w9WgXcQ' },
      { id: 'c4', title: 'Arrays & Objects', duration: '20:10', videoId: 'dQw4w9WgXcQ' },
      { id: 'c5', title: 'DOM Manipulation', duration: '22:05', videoId: 'dQw4w9WgXcQ' },
      { id: 'c6', title: 'Async & Promises', duration: '19:50', videoId: 'dQw4w9WgXcQ' },
    ],
  },
  {
    id: 'design',
    title: 'Design',
    tagline: 'Where pixels meet purpose',
    icon: Palette,
    gradient: 'from-pink-500 to-rose-600',
    glowColor: 'rgba(236,72,153,0.35)',
    lessons: [
      { id: 'd1', title: 'Color Theory Essentials', duration: '14:00', videoId: 'dQw4w9WgXcQ' },
      { id: 'd2', title: 'Typography & Hierarchy', duration: '16:30', videoId: 'dQw4w9WgXcQ' },
      { id: 'd3', title: 'Layout & Composition', duration: '18:15', videoId: 'dQw4w9WgXcQ' },
      { id: 'd4', title: 'Figma Masterclass', duration: '25:00', videoId: 'dQw4w9WgXcQ' },
      { id: 'd5', title: 'Responsive Design', duration: '20:45', videoId: 'dQw4w9WgXcQ' },
    ],
  },
  {
    id: 'ai',
    title: 'Artificial Intelligence',
    tagline: 'Teach machines to think',
    icon: Brain,
    gradient: 'from-cyan-500 to-blue-600',
    glowColor: 'rgba(6,182,212,0.35)',
    lessons: [
      { id: 'a1', title: 'What is AI? History & Ethics', duration: '11:30', videoId: 'dQw4w9WgXcQ' },
      { id: 'a2', title: 'Machine Learning Basics', duration: '19:20', videoId: 'dQw4w9WgXcQ' },
      { id: 'a3', title: 'Neural Networks Explained', duration: '23:50', videoId: 'dQw4w9WgXcQ' },
      { id: 'a4', title: 'Prompt Engineering', duration: '15:10', videoId: 'dQw4w9WgXcQ' },
      { id: 'a5', title: 'Building with AI APIs', duration: '21:30', videoId: 'dQw4w9WgXcQ' },
    ],
  },
  {
    id: 'web',
    title: 'Web Development',
    tagline: 'Craft experiences for the world',
    icon: Globe,
    gradient: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(16,185,129,0.35)',
    lessons: [
      { id: 'w1', title: 'HTML5 Semantics', duration: '10:00', videoId: 'dQw4w9WgXcQ' },
      { id: 'w2', title: 'CSS Grid & Flexbox', duration: '17:25', videoId: 'dQw4w9WgXcQ' },
      { id: 'w3', title: 'JavaScript in the Browser', duration: '20:00', videoId: 'dQw4w9WgXcQ' },
      { id: 'w4', title: 'React Fundamentals', duration: '24:15', videoId: 'dQw4w9WgXcQ' },
      { id: 'w5', title: 'Next.js & Deployment', duration: '22:40', videoId: 'dQw4w9WgXcQ' },
    ],
  },
  {
    id: 'cyber',
    title: 'Cybersecurity',
    tagline: 'Defend the digital frontier',
    icon: Shield,
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245,158,11,0.35)',
    lessons: [
      { id: 'cy1', title: 'Threat Landscape 101', duration: '13:40', videoId: 'dQw4w9WgXcQ' },
      { id: 'cy2', title: 'Encryption & Hashing', duration: '16:00', videoId: 'dQw4w9WgXcQ' },
      { id: 'cy3', title: 'Network Security', duration: '19:30', videoId: 'dQw4w9WgXcQ' },
      { id: 'cy4', title: 'Ethical Hacking Basics', duration: '21:15', videoId: 'dQw4w9WgXcQ' },
    ],
  },
  {
    id: 'data',
    title: 'Data Science',
    tagline: 'Turn data into decisions',
    icon: Database,
    gradient: 'from-fuchsia-500 to-purple-600',
    glowColor: 'rgba(192,38,211,0.35)',
    lessons: [
      { id: 'ds1', title: 'Data Thinking', duration: '12:00', videoId: 'dQw4w9WgXcQ' },
      { id: 'ds2', title: 'Python for Data', duration: '18:50', videoId: 'dQw4w9WgXcQ' },
      { id: 'ds3', title: 'Pandas & Visualisation', duration: '20:25', videoId: 'dQw4w9WgXcQ' },
      { id: 'ds4', title: 'Statistics Essentials', duration: '17:10', videoId: 'dQw4w9WgXcQ' },
    ],
  },
  {
    id: 'mobile',
    title: 'Mobile Apps',
    tagline: 'Apps that live in your pocket',
    icon: Smartphone,
    gradient: 'from-sky-500 to-blue-600',
    glowColor: 'rgba(14,165,233,0.35)',
    lessons: [
      { id: 'm1', title: 'React Native Setup', duration: '14:30', videoId: 'dQw4w9WgXcQ' },
      { id: 'm2', title: 'Components & Navigation', duration: '19:00', videoId: 'dQw4w9WgXcQ' },
      { id: 'm3', title: 'State & APIs', duration: '22:10', videoId: 'dQw4w9WgXcQ' },
      { id: 'm4', title: 'Publishing to Stores', duration: '16:45', videoId: 'dQw4w9WgXcQ' },
    ],
  },
  {
    id: 'analytics',
    title: 'Digital Analytics',
    tagline: 'Measure what matters',
    icon: BarChart3,
    gradient: 'from-lime-500 to-green-600',
    glowColor: 'rgba(132,204,22,0.35)',
    lessons: [
      { id: 'an1', title: 'Analytics Foundations', duration: '11:20', videoId: 'dQw4w9WgXcQ' },
      { id: 'an2', title: 'Google Analytics Deep Dive', duration: '18:00', videoId: 'dQw4w9WgXcQ' },
      { id: 'an3', title: 'A/B Testing & CRO', duration: '15:40', videoId: 'dQw4w9WgXcQ' },
      { id: 'an4', title: 'Dashboard Building', duration: '20:30', videoId: 'dQw4w9WgXcQ' },
    ],
  },
];

const QUOTES = [
  'Master the Future.',
  'Code is the new literacy.',
  'Design is intelligence made visible.',
  'Data is the new oil.',
  'Security first, always.',
];

/* ═══════════════════════════════════════════════════════════════════════════
   FLOATING PARTICLE FIELD — animated SVG orbs behind hero
   ═══════════════════════════════════════════════════════════════════════════ */

function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        dur: 12 + Math.random() * 18,
        delay: Math.random() * -20,
        opacity: 0.15 + Math.random() * 0.25,
      })),
    [],
  );

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.circle
          key={p.id}
          cx={`${p.x}%`}
          cy={`${p.y}%`}
          r={p.size}
          fill="white"
          opacity={p.opacity}
          animate={{
            cy: [`${p.y}%`, `${(p.y + 30) % 100}%`, `${p.y}%`],
            cx: [`${p.x}%`, `${(p.x + 15) % 100}%`, `${p.x}%`],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ORBIT RING — animated rings behind the hero title
   ═══════════════════════════════════════════════════════════════════════════ */

function OrbitRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[280, 400, 520].map((size, i) => (
        <motion.div
          key={size}
          className="absolute rounded-full border border-white/[0.06]"
          style={{ width: size, height: size }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 50 + i * 20, repeat: Infinity, ease: 'linear' }}
        >
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-white/30"
            style={{ top: 0, left: '50%', marginLeft: -4, marginTop: -4 }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SKILL CARD — glow + float effect
   ═══════════════════════════════════════════════════════════════════════════ */

interface SkillCardProps {
  skill: Skill;
  index: number;
  onSelect: (skill: Skill) => void;
}

function SkillCard({ skill, index, onSelect }: SkillCardProps) {
  const Icon = skill.icon;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const resetMouse = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 800 }}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      onClick={() => onSelect(skill)}
      className="group relative cursor-pointer"
    >
      {/* Glow backdrop */}
      <motion.div
        className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{ background: skill.glowColor }}
      />

      <div className="relative bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6 h-full
                      hover:border-white/[0.2] hover:bg-white/[0.1] transition-all duration-300 overflow-hidden">
        {/* Gradient accent line */}
        <div className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r ${skill.gradient} rounded-full opacity-60`} />

        {/* Floating icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${skill.gradient} flex items-center justify-center mb-4 shadow-lg`}
        >
          <Icon className="w-7 h-7 text-white" strokeWidth={1.8} />
        </motion.div>

        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">{skill.title}</h3>
        <p className="text-sm text-white/50 mb-4 leading-relaxed">{skill.tagline}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 font-medium">{skill.lessons.length} lessons</span>
          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center gap-1 text-xs font-semibold text-white/60 group-hover:text-white transition-colors"
          >
            Explore <ArrowRight className="w-3.5 h-3.5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CINEMA PLAYER — glassmorphic immersive video + playlist
   ═══════════════════════════════════════════════════════════════════════════ */

interface CinemaPlayerProps {
  skill: Skill;
  onBack: () => void;
}

function CinemaPlayer({ skill, onBack }: CinemaPlayerProps) {
  const [activeLesson, setActiveLesson] = useState(skill.lessons[0]);
  const [activeTab, setActiveTab] = useState<'resources' | 'solver'>('resources');
  const Icon = skill.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#08080f]"
    >
      {/* Top bar — glassmorphic */}
      <div className="sticky top-0 z-30 bg-white/[0.04] backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Skills
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${skill.gradient} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-none">{skill.title}</h1>
              <p className="text-white/40 text-xs mt-0.5">{skill.tagline}</p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Main content: Video + Sidebar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* ── Left: Video + Tabs ────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Video embed — glassmorphic frame */}
            <motion.div
              key={activeLesson.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/40"
            >
              {/* Glow ring behind video */}
              <div
                className="absolute -inset-[2px] rounded-2xl opacity-50 blur-sm"
                style={{ background: `linear-gradient(135deg, ${skill.glowColor}, transparent 60%)` }}
              />
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeLesson.videoId}?autoplay=0&rel=0&modestbranding=1`}
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>

              {/* Bottom glassmorphic control bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${skill.gradient} flex items-center justify-center shrink-0`}>
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{activeLesson.title}</p>
                      <p className="text-white/40 text-xs">{activeLesson.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-lg bg-white/[0.1] backdrop-blur-sm hover:bg-white/[0.2] flex items-center justify-center transition-colors">
                      <Volume2 className="w-4 h-4 text-white/70" />
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-white/[0.1] backdrop-blur-sm hover:bg-white/[0.2] flex items-center justify-center transition-colors">
                      <Maximize2 className="w-4 h-4 text-white/70" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabs: Resources / Interactive Solver */}
            <div className="mt-5">
              <div className="flex gap-1 bg-white/[0.04] backdrop-blur-xl rounded-xl p-1 border border-white/[0.06] w-fit">
                {(['resources', 'solver'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-2
                      ${activeTab === tab
                        ? 'bg-white/[0.12] text-white shadow-sm'
                        : 'text-white/40 hover:text-white/60'}`}
                  >
                    {tab === 'resources' ? <FileText className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {tab === 'resources' ? 'Resources' : 'Interactive Solver'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5"
                >
                  {activeTab === 'resources' ? (
                    <div className="space-y-3">
                      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-white/50" /> Lesson Resources
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {['Lesson Notes (PDF)', 'Practice Exercises', 'Cheat Sheet', 'Quiz'].map((r, i) => (
                          <div
                            key={r}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06] transition-all cursor-pointer group"
                          >
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${skill.gradient} flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity`}>
                              <FileText className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-white/80 text-sm font-medium">{r}</p>
                              <p className="text-white/30 text-xs">{['PDF', 'PDF', 'PNG', 'Interactive'][i]}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-white/50" /> Interactive Solver
                      </h3>
                      <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-6 text-center">
                        <motion.div
                          animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${skill.gradient} flex items-center justify-center mb-4 shadow-lg`}
                        >
                          <Zap className="w-8 h-8 text-white" />
                        </motion.div>
                        <p className="text-white/70 text-sm font-medium mb-1">AI-Powered Practice</p>
                        <p className="text-white/40 text-xs max-w-sm mx-auto leading-relaxed">
                          Test your understanding with adaptive exercises that match the lesson you just watched.
                        </p>
                        <button className={`mt-4 px-5 py-2 rounded-xl bg-gradient-to-r ${skill.gradient} text-white text-xs font-bold shadow-lg hover:shadow-xl transition-shadow`}>
                          Start Solving
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right: Playlist Sidebar ───────────────────────────────── */}
          <div className="lg:w-[340px] shrink-0">
            <div className="sticky top-[72px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Sidebar header */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <ListVideo className="w-4 h-4 text-white/50" />
                <span className="text-white text-sm font-bold">Course Playlist</span>
                <span className="ml-auto text-xs text-white/30 font-mono">{skill.lessons.length} lessons</span>
              </div>

              {/* Scrollable lesson list */}
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto divide-y divide-white/[0.04]
                             scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {skill.lessons.map((lesson, i) => {
                  const isActive = lesson.id === activeLesson.id;
                  return (
                    <motion.button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-200 group
                        ${isActive
                          ? 'bg-white/[0.08]'
                          : 'hover:bg-white/[0.04]'}`}
                    >
                      {/* Lesson number */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all
                        ${isActive
                          ? `bg-gradient-to-br ${skill.gradient} text-white shadow-md`
                          : 'bg-white/[0.06] text-white/40 group-hover:text-white/60'}`}
                      >
                        {isActive ? (
                          <Play className="w-3.5 h-3.5 fill-white" />
                        ) : (
                          i + 1
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate transition-colors
                          ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">{lesson.duration}</p>
                      </div>

                      {isActive && (
                        <motion.div
                          layoutId="active-indicator"
                          className={`w-1.5 h-8 rounded-full bg-gradient-to-b ${skill.gradient}`}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function DigitalSkillsClient() {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  // Cycle quotes
  useEffect(() => {
    const t = setInterval(() => setQuoteIdx((i) => (i + 1) % QUOTES.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Parallax on scroll
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, 100]);

  // Filter skills by search
  const filteredSkills = useMemo(
    () =>
      SKILLS.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.tagline.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery],
  );

  // Transition to cinema mode
  const handleSelectSkill = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <AnimatePresence mode="wait">
      {selectedSkill ? (
        <CinemaPlayer
          key={`cinema-${selectedSkill.id}`}
          skill={selectedSkill}
          onBack={() => setSelectedSkill(null)}
        />
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
        >
          {/* ═══ HERO ═══ */}
          <motion.section
            ref={heroRef}
            style={{ opacity: heroOpacity, y: heroY }}
            className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2e] to-[#08081a]" />
            {/* Mesh accent */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.1),transparent_60%)]" />
            {/* Particles + Orbits */}
            <ParticleField />
            <OrbitRings />

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] mb-8"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-white/70 tracking-wide">New — Interactive Digital Skills</span>
              </motion.div>

              {/* Rotating quote */}
              <div className="h-20 sm:h-24 flex items-center justify-center mb-4">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={quoteIdx}
                    initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -30, filter: 'blur(8px)' }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="text-4xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent tracking-tight"
                  >
                    {QUOTES[quoteIdx]}
                  </motion.h1>
                </AnimatePresence>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-base sm:text-lg text-white/50 max-w-xl mx-auto leading-relaxed mb-10"
              >
                Immersive, cinema-quality courses in Coding, Design, AI, Cybersecurity, and more.
                Choose your skill. Start learning.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex items-center justify-center gap-4"
              >
                <a
                  href="#skills"
                  className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/30 transition-all"
                >
                  <Monitor className="w-4 h-4" />
                  Browse Skills
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
                <a
                  href="#skills"
                  className="px-7 py-3.5 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.1] font-semibold text-sm transition-all"
                >
                  Watch Demo
                </a>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mt-16 flex items-center justify-center gap-8 sm:gap-12"
              >
                {[
                  { value: `${SKILLS.length}`, label: 'Skill Tracks' },
                  { value: `${SKILLS.reduce((a, s) => a + s.lessons.length, 0)}`, label: 'Lessons' },
                  { value: '4K', label: 'Quality' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{stat.value}</p>
                    <p className="text-xs text-white/40 font-medium mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-white/60"
                />
              </div>
            </motion.div>
          </motion.section>

          {/* ═══ SKILLS GRID ═══ */}
          <section
            id="skills"
            className="relative bg-gradient-to-b from-[#08081a] to-[#0d0d20] py-20 sm:py-28"
          >
            {/* Section header */}
            <div className="max-w-6xl mx-auto px-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
                  Choose Your Skill
                </h2>
                <p className="text-white/40 text-base max-w-md mx-auto">
                  Eight future-proof tracks. Each one is a gateway to a new career.
                </p>
              </motion.div>

              {/* Search bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-8 max-w-md mx-auto relative"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search skills…"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/[0.06] backdrop-blur-md border border-white/[0.08]
                             text-white placeholder:text-white/30 text-sm font-medium
                             focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-white/40 hover:text-white/70 transition-colors" />
                  </button>
                )}
              </motion.div>
            </div>

            {/* Grid */}
            <div className="max-w-6xl mx-auto px-6">
              <AnimatePresence>
                {filteredSkills.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-white/30 text-sm py-20"
                  >
                    No skills match &ldquo;{searchQuery}&rdquo;
                  </motion.p>
                ) : (
                  <motion.div
                    layout
                    className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    {filteredSkills.map((skill, i) => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        index={i}
                        onSelect={handleSelectSkill}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom fade to page edge */}
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0d0d20] to-transparent pointer-events-none" />
          </section>

          {/* ═══ FOOTER CTA ═══ */}
          <section className="bg-[#0d0d20] py-20">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                  Ready to level up?
                </h2>
                <p className="text-white/40 text-sm max-w-md mx-auto mb-8">
                  Pick any skill above and dive into cinema-quality lessons with interactive exercises — completely free during early access.
                </p>
                <a
                  href="#skills"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 hover:shadow-xl transition-all"
                >
                  <Zap className="w-4 h-4" /> Get Started Now
                </a>
              </motion.div>
            </div>
          </section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
