import {
  Calculator, Monitor, BookOpen, Atom, FlaskConical, Microscope,
  Languages, Globe, Award, type LucideIcon,
} from 'lucide-react';

// ─── Color Schemes ──────────────────────────────────────────────────────────
export type ColorScheme = {
  gradient: string;
  glow: string;
  badge: string;
};

const colors: Record<string, ColorScheme> = {
  blue:    { gradient: 'from-blue-500 to-indigo-600',    glow: 'rgba(99,102,241,0.35)',  badge: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
  emerald: { gradient: 'from-emerald-500 to-teal-600',   glow: 'rgba(16,185,129,0.35)',  badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
  purple:  { gradient: 'from-purple-500 to-violet-600',  glow: 'rgba(139,92,246,0.35)',  badge: 'bg-purple-500/20 text-purple-300 border-purple-400/30' },
  amber:   { gradient: 'from-amber-500 to-orange-600',   glow: 'rgba(245,158,11,0.35)',  badge: 'bg-amber-500/20 text-amber-300 border-amber-400/30' },
  rose:    { gradient: 'from-rose-500 to-pink-600',      glow: 'rgba(244,63,94,0.35)',   badge: 'bg-rose-500/20 text-rose-300 border-rose-400/30' },
  cyan:    { gradient: 'from-cyan-500 to-sky-600',       glow: 'rgba(6,182,212,0.35)',   badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' },
  gold:    { gradient: 'from-yellow-500 to-amber-600',   glow: 'rgba(234,179,8,0.35)',   badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' },
  lime:    { gradient: 'from-lime-500 to-green-600',     glow: 'rgba(132,204,22,0.35)',  badge: 'bg-lime-500/20 text-lime-300 border-lime-400/30' },
};

// ─── Subject Type ───────────────────────────────────────────────────────────
export type SubjectEntry = {
  id: string;
  name: string;
  code: string;
  icon: LucideIcon;
  colorScheme: ColorScheme;
  description: string;
  active: boolean;       // has live content pages
};

// ─── O-Level / IGCSE Subjects ───────────────────────────────────────────────
export const O_LEVEL_SUBJECTS: SubjectEntry[] = [
  {
    id: 'mathematics-4024',
    name: 'Mathematics',
    code: '4024/0580',
    icon: Calculator,
    colorScheme: colors.blue,
    description: 'Extended & Core Mathematics — Grades 9, 10 & 11',
    active: true,
  },
  {
    id: 'computer-science-0478',
    name: 'Computer Science',
    code: '0478',
    icon: Monitor,
    colorScheme: colors.emerald,
    description: 'Theory, Problem-solving & Programming',
    active: true,
  },
  {
    id: 'english-1123',
    name: 'English Language',
    code: '1123',
    icon: BookOpen,
    colorScheme: colors.purple,
    description: 'Reading, Writing & Language competencies',
    active: false,
  },
  {
    id: 'physics-5054',
    name: 'Physics',
    code: '5054',
    icon: Atom,
    colorScheme: colors.amber,
    description: 'Mechanics, Waves, Electricity & Modern Physics',
    active: false,
  },
  {
    id: 'chemistry-5070',
    name: 'Chemistry',
    code: '5070',
    icon: FlaskConical,
    colorScheme: colors.rose,
    description: 'Atomic structure, Bonding, Organic & Inorganic Chemistry',
    active: false,
  },
  {
    id: 'biology-5090',
    name: 'Biology',
    code: '5090',
    icon: Microscope,
    colorScheme: colors.lime,
    description: 'Cell Biology, Genetics, Ecology & Human Physiology',
    active: false,
  },
  {
    id: 'urdu-3248',
    name: 'Urdu',
    code: '3248',
    icon: Languages,
    colorScheme: colors.cyan,
    description: 'Comprehension, Essay & Formal Writing',
    active: false,
  },
  {
    id: 'pakistan-studies-2059',
    name: 'Pakistan Studies',
    code: '2059',
    icon: Globe,
    colorScheme: colors.gold,
    description: 'History, Geography & Current Affairs of Pakistan',
    active: false,
  },
];

// ─── A-Level Subjects ───────────────────────────────────────────────────────
export const A_LEVEL_SUBJECTS: SubjectEntry[] = [
  {
    id: 'mathematics-9709',
    name: 'Mathematics',
    code: '9709',
    icon: Calculator,
    colorScheme: colors.gold,
    description: 'Pure Mathematics, Statistics & Mechanics — AS & A2',
    active: true,
  },
  {
    id: 'computer-science-9618',
    name: 'Computer Science',
    code: '9618',
    icon: Monitor,
    colorScheme: colors.emerald,
    description: 'Theory, Problem-solving & Programming — AS & A2',
    active: true,
  },
  {
    id: 'physics-9702',
    name: 'Physics',
    code: '9702',
    icon: Atom,
    colorScheme: colors.amber,
    description: 'Advanced Mechanics, Fields, Quantum & Nuclear Physics',
    active: false,
  },
  {
    id: 'chemistry-9701',
    name: 'Chemistry',
    code: '9701',
    icon: FlaskConical,
    colorScheme: colors.rose,
    description: 'Physical, Inorganic & Organic Chemistry — AS & A2',
    active: false,
  },
  {
    id: 'biology-9700',
    name: 'Biology',
    code: '9700',
    icon: Microscope,
    colorScheme: colors.lime,
    description: 'Molecular Biology, Genetics, Ecology & Physiology',
    active: false,
  },
];
