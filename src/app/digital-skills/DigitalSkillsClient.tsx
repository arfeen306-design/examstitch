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
  ChevronRight,
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
  ImageIcon,
  PenLine,
  ExternalLink,
  Clock,
} from 'lucide-react';
import TrendingRow from '@/components/digital-skills/TrendingRow';
import dynamic from 'next/dynamic';

const CheatSheetViewer = dynamic(
  () => import('@/components/digital-skills/CheatSheetViewer'),
  { ssr: false },
);

const InteractiveSolver = dynamic(
  () => import('@/components/digital-skills/InteractiveSolver'),
  { ssr: false },
);

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */

// DB types coming from server props
interface DBLesson {
  id: string;
  title: string;
  video_url: string | null;
  duration: string | null;
  sort_order: number;
  is_free: boolean;
  notes_url: string | null;
  exercises_url: string | null;
  cheatsheet_url: string | null;
  quiz_url: string | null;
  resource_url: string | null;
}

interface DBPlaylist {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  skill_lessons: DBLesson[];
}

interface DBSkill {
  id: string;
  name: string;
  slug: string;
  icon: string;
  tagline: string | null;
  description: string | null;
  gradient: string | null;
  glow_color: string | null;
  is_active: boolean;
  sort_order: number;
  skill_playlists: DBPlaylist[];
}

// UI types used by components
interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoId: string;
  notesUrl: string | null;
  exercisesUrl: string | null;
  cheatsheetUrl: string | null;
  quizUrl: string | null;
}

interface Playlist {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Skill {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  playlists: Playlist[];
  allLessons: Lesson[];      // flat list for quick lookups
  hasRealData: boolean;
}

// Icon name → component map
const ICON_MAP: Record<string, React.ElementType> = {
  Code2, Palette, Brain, Globe, Shield, Database, Smartphone, BarChart3,
  Monitor, Zap, FileText, BookOpen,
};

function resolveIcon(name: string): React.ElementType {
  return ICON_MAP[name] || Code2;
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string | null): string {
  if (!url) return '';
  // youtube.com/watch?v=ID  |  youtu.be/ID  |  youtube.com/embed/ID
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  // Could be a bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  return '';
}

// Transform DB data → UI format (preserving playlist hierarchy)
function transformDBSkills(dbSkills: DBSkill[]): Skill[] {
  return dbSkills.map((s) => {
    const playlists: Playlist[] = s.skill_playlists
      .map((pl) => ({
        id: pl.id,
        title: pl.title,
        lessons: pl.skill_lessons
          .filter((l) => l.video_url)
          .map((l) => ({
            id: l.id,
            title: l.title,
            duration: l.duration || '',
            videoId: extractYouTubeId(l.video_url),
            notesUrl: l.notes_url,
            exercisesUrl: l.exercises_url,
            cheatsheetUrl: l.cheatsheet_url,
            quizUrl: l.quiz_url,
          })),
      }))
      .filter((pl) => pl.lessons.length > 0);

    const allLessons = playlists.flatMap((pl) => pl.lessons);

    return {
      id: s.slug,
      slug: s.slug,
      title: s.name,
      tagline: s.tagline || '',
      icon: resolveIcon(s.icon),
      gradient: s.gradient || 'from-violet-600 to-indigo-700',
      glowColor: s.glow_color || 'rgba(124,58,237,0.35)',
      playlists,
      allLessons,
      hasRealData: allLessons.length > 0,
    };
  });
}

// Fallback demo playlists for skills that have no real content yet
const DEMO_PLAYLISTS: Record<string, Playlist[]> = {
  coding: [{ id: 'demo-coding', title: 'Getting Started', lessons: [
    { id: 'c1', title: 'Variables & Data Types', duration: '12:30', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
    { id: 'c2', title: 'Control Flow & Loops', duration: '18:45', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
    { id: 'c3', title: 'Functions & Scope', duration: '15:20', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
  ]}],
  design: [{ id: 'demo-design', title: 'Design Essentials', lessons: [
    { id: 'd1', title: 'Color Theory Essentials', duration: '14:00', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
    { id: 'd2', title: 'Typography & Hierarchy', duration: '16:30', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
  ]}],
  ai: [{ id: 'demo-ai', title: 'AI Foundations', lessons: [
    { id: 'a1', title: 'What is AI? History & Ethics', duration: '11:30', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
    { id: 'a2', title: 'Machine Learning Basics', duration: '19:20', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
  ]}],
  'web-development': [{ id: 'demo-web', title: 'Web Fundamentals', lessons: [
    { id: 'w1', title: 'HTML5 Semantics', duration: '10:00', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
    { id: 'w2', title: 'CSS Grid & Flexbox', duration: '17:25', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
  ]}],
  cybersecurity: [{ id: 'demo-cyber', title: 'Security Basics', lessons: [
    { id: 'cy1', title: 'Threat Landscape 101', duration: '13:40', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
    { id: 'cy2', title: 'Encryption & Hashing', duration: '16:00', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
  ]}],
  'data-science': [{ id: 'demo-ds', title: 'Data Essentials', lessons: [
    { id: 'ds1', title: 'Data Thinking', duration: '12:00', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
    { id: 'ds2', title: 'Python for Data', duration: '18:50', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
  ]}],
  'mobile-apps': [{ id: 'demo-mobile', title: 'Mobile Dev Intro', lessons: [
    { id: 'm1', title: 'React Native Setup', duration: '14:30', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
    { id: 'm2', title: 'Components & Navigation', duration: '19:00', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
  ]}],
  'digital-analytics': [{ id: 'demo-analytics', title: 'Analytics Intro', lessons: [
    { id: 'an1', title: 'Analytics Foundations', duration: '11:20', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
    { id: 'an2', title: 'Google Analytics Deep Dive', duration: '18:00', videoId: 'dQw4w9WgXcQ', notesUrl: null, exercisesUrl: null, cheatsheetUrl: null, quizUrl: null },
  ]}],
};

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
          <span className="text-xs text-white/40 font-medium">{skill.allLessons.length} lessons</span>
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
  const [activeLesson, setActiveLesson] = useState(skill.allLessons[0]);
  const [activeTab, setActiveTab] = useState<'resources' | 'solver'>('resources');
  const [viewerOpen, setViewerOpen] = useState<{ url: string; title: string } | null>(null);
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(() => {
    // Auto-expand the playlist containing the first lesson
    const firstPl = skill.playlists.find((pl) =>
      pl.lessons.some((l) => l.id === skill.allLessons[0]?.id),
    );
    return new Set(firstPl ? [firstPl.id] : []);
  });
  const Icon = skill.icon;

  // Find which playlist owns the active lesson (for breadcrumb)
  const activePlaylist = skill.playlists.find((pl) =>
    pl.lessons.some((l) => l.id === activeLesson?.id),
  );

  // Auto-expand playlist when active lesson changes
  useEffect(() => {
    if (activePlaylist && !expandedPlaylists.has(activePlaylist.id)) {
      setExpandedPlaylists((prev) => new Set([...prev, activePlaylist.id]));
    }
  }, [activePlaylist]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlaylist = useCallback((plId: string) => {
    setExpandedPlaylists((prev) => {
      const next = new Set(prev);
      if (next.has(plId)) next.delete(plId);
      else next.add(plId);
      return next;
    });
  }, []);

  // Compute global lesson index for numbering
  const lessonGlobalIndex = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const pl of skill.playlists) {
      for (const l of pl.lessons) {
        map.set(l.id, idx++);
      }
    }
    return map;
  }, [skill.playlists]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#08080f]"
    >
      {/* Top bar — breadcrumb navigation */}
      <div className="sticky top-0 z-30 bg-white/[0.04] backdrop-blur-2xl border-b border-white/[0.06]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Breadcrumbs: Digital Skills > Skill Title > Playlist Name */}
          <nav className="flex items-center gap-1.5 text-sm min-w-0">
            <button
              onClick={onBack}
              className="text-white/40 hover:text-white transition-colors font-medium shrink-0"
            >
              Digital Skills
            </button>
            <ChevronLeft className="w-3.5 h-3.5 text-white/20 rotate-180 shrink-0" />
            <button
              onClick={onBack}
              className="text-white/40 hover:text-white transition-colors font-medium truncate max-w-[120px]"
            >
              {skill.title}
            </button>
            {activePlaylist && (
              <>
                <ChevronLeft className="w-3.5 h-3.5 text-white/20 rotate-180 shrink-0" />
                <span className="text-white/70 font-medium truncate max-w-[180px]">
                  {activePlaylist.title}
                </span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${skill.gradient} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-sm leading-none">{skill.title}</h1>
              <p className="text-white/40 text-xs mt-0.5">{skill.tagline}</p>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] flex items-center justify-center transition-colors shrink-0"
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
                        {[
                          { label: 'Lesson Notes', type: 'PDF', url: activeLesson.notesUrl, icon: FileText, color: 'from-blue-500 to-blue-600', viewable: true },
                          { label: 'Practice Exercises', type: 'PDF', url: activeLesson.exercisesUrl, icon: PenLine, color: 'from-amber-500 to-amber-600', viewable: true },
                          { label: 'Cheat Sheet', type: 'Image / PDF', url: activeLesson.cheatsheetUrl, icon: ImageIcon, color: 'from-purple-500 to-purple-600', viewable: true },
                          { label: 'Interactive Quiz', type: 'Quiz', url: activeLesson.quizUrl, icon: Brain, color: 'from-emerald-500 to-emerald-600', viewable: false },
                        ].map((r) => {
                          const RIcon = r.icon;
                          const hasUrl = !!r.url;

                          if (!hasUrl) {
                            return (
                              <div
                                key={r.label}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] opacity-50"
                              >
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center opacity-40`}>
                                  <RIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white/50 text-sm font-medium">{r.label}</p>
                                  <p className="text-white/20 text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Coming Soon
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          // Viewable resources open in the in-app viewer
                          if (r.viewable) {
                            return (
                              <button
                                key={r.label}
                                onClick={() => setViewerOpen({ url: r.url!, title: `${activeLesson.title} — ${r.label}` })}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.08] transition-all cursor-pointer group text-left w-full"
                              >
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                                  <RIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white/80 text-sm font-medium">{r.label}</p>
                                  <p className="text-white/30 text-xs">{r.type}</p>
                                </div>
                                <Play className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
                              </button>
                            );
                          }

                          // Non-viewable (quiz) opens in new tab
                          return (
                            <a
                              key={r.label}
                              href={r.url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.08] transition-all cursor-pointer group"
                            >
                              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                                <RIcon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white/80 text-sm font-medium">{r.label}</p>
                                <p className="text-white/30 text-xs">{r.type}</p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-white/60 transition-colors" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <InteractiveSolver
                      lessonId={activeLesson?.id || ''}
                      lessonTitle={activeLesson?.title || ''}
                      gradient={skill.gradient}
                      glowColor={skill.glowColor}
                      isAdmin={false}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Right: Playlist Sidebar (grouped by playlist) ──────── */}
          <div className="lg:w-[340px] shrink-0">
            <div className="sticky top-[72px] bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Sidebar header */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <ListVideo className="w-4 h-4 text-white/50" />
                <span className="text-white text-sm font-bold">Course Playlist</span>
                <span className="ml-auto text-xs text-white/30 font-mono">
                  {skill.allLessons.length} lessons
                </span>
              </div>

              {/* Scrollable grouped playlist */}
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto
                             scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {skill.playlists.map((pl) => {
                  const isExpanded = expandedPlaylists.has(pl.id);
                  const hasActiveLessonInPl = pl.lessons.some((l) => l.id === activeLesson?.id);

                  return (
                    <div key={pl.id}>
                      {/* ── Playlist header (collapsible) ─────────────── */}
                      <button
                        onClick={() => togglePlaylist(pl.id)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-2.5 border-b border-white/[0.04] transition-colors
                          ${hasActiveLessonInPl ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${hasActiveLessonInPl ? 'text-white' : 'text-white/60'}`}>
                            {pl.title}
                          </p>
                          <p className="text-[10px] text-white/30 mt-0.5">
                            {pl.lessons.length} lesson{pl.lessons.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {hasActiveLessonInPl && (
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${skill.gradient} shadow-sm`} />
                        )}
                      </button>

                      {/* ── Lessons under this playlist ────────────── */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="divide-y divide-white/[0.03]">
                              {pl.lessons.map((lesson) => {
                                const isActive = lesson.id === activeLesson?.id;
                                const gIdx = lessonGlobalIndex.get(lesson.id) ?? 0;

                                return (
                                  <motion.button
                                    key={lesson.id}
                                    onClick={() => setActiveLesson(lesson)}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`w-full text-left pl-10 pr-4 py-3 flex items-center gap-3 transition-all duration-200 group
                                      ${isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}`}
                                  >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all
                                      ${isActive
                                        ? `bg-gradient-to-br ${skill.gradient} text-white shadow-md`
                                        : 'bg-white/[0.06] text-white/40 group-hover:text-white/60'}`}
                                    >
                                      {isActive ? (
                                        <Play className="w-3 h-3 fill-white" />
                                      ) : (
                                        gIdx + 1
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
                                        className={`w-1.5 h-7 rounded-full bg-gradient-to-b ${skill.gradient}`}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                      />
                                    )}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CheatSheet / Resource Viewer Modal ─────────────────────── */}
      {viewerOpen && (
        <CheatSheetViewer
          url={viewerOpen.url}
          title={viewerOpen.title}
          onClose={() => setViewerOpen(null)}
          accentGradient={skill.gradient}
        />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function DigitalSkillsClient({ dbSkills = [] }: { dbSkills?: DBSkill[] }) {
  // Transform DB skills and merge with demo fallback
  const SKILLS = useMemo(() => {
    const transformed = transformDBSkills(dbSkills);
    // For skills with no real lessons, inject demo playlists
    return transformed.map((s) => {
      if (s.hasRealData) return s;
      const demoPlaylists = DEMO_PLAYLISTS[s.slug] || s.playlists;
      const demoAllLessons = demoPlaylists.flatMap((pl) => pl.lessons);
      return { ...s, playlists: demoPlaylists, allLessons: demoAllLessons };
    });
  }, [dbSkills]);

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
    [searchQuery, SKILLS],
  );

  // Transition to cinema mode
  const handleSelectSkill = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Select skill by slug (for trending row)
  const handleTrendingSelect = useCallback((slug: string) => {
    const match = SKILLS.find(
      (s) => s.slug === slug || s.id === slug || s.title.toLowerCase().replace(/\s+/g, '-') === slug,
    );
    if (match) {
      setSelectedSkill(match);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [SKILLS]);

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
                  { value: `${SKILLS.reduce((a, s) => a + s.allLessons.length, 0)}`, label: 'Lessons' },
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

          {/* ═══ TRENDING NOW ═══ */}
          <section className="relative bg-gradient-to-b from-[#08081a] to-[#08081a] pt-12 pb-0">
            <div className="max-w-6xl mx-auto px-6">
              <TrendingRow onSelectSkill={handleTrendingSelect} />
            </div>
          </section>

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
