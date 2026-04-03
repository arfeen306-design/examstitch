import {
  Calculator, Monitor, BookOpen, Atom, FlaskConical, Microscope,
  Languages, Globe, Award, type LucideIcon,
} from 'lucide-react';

// ─── Color Schemes ──────────────────────────────────────────────────────────
export type ColorScheme = {
  gradient: string;
  glow: string;
  badge: string;
  accent: string;   // accent text class for "Explore" link & highlights
};

const colors: Record<string, ColorScheme> = {
  blue:    { gradient: 'from-blue-500 to-indigo-600',    glow: 'rgba(99,102,241,0.25)',  badge: 'bg-blue-500/20 text-white border-blue-500/50',    accent: 'text-blue-400' },
  emerald: { gradient: 'from-emerald-500 to-teal-600',   glow: 'rgba(16,185,129,0.25)',  badge: 'bg-emerald-500/20 text-white border-emerald-500/50', accent: 'text-emerald-400' },
  purple:  { gradient: 'from-purple-500 to-violet-600',  glow: 'rgba(139,92,246,0.25)',  badge: 'bg-purple-500/20 text-white border-purple-500/50', accent: 'text-purple-400' },
  amber:   { gradient: 'from-amber-500 to-orange-600',   glow: 'rgba(245,158,11,0.25)',  badge: 'bg-amber-500/20 text-white border-amber-500/50',  accent: 'text-amber-400' },
  rose:    { gradient: 'from-rose-500 to-pink-600',      glow: 'rgba(244,63,94,0.25)',   badge: 'bg-rose-500/20 text-white border-rose-500/50',    accent: 'text-rose-400' },
  cyan:    { gradient: 'from-cyan-500 to-sky-600',       glow: 'rgba(6,182,212,0.25)',   badge: 'bg-cyan-500/20 text-white border-cyan-500/50',    accent: 'text-cyan-400' },
  gold:    { gradient: 'from-yellow-500 to-amber-600',   glow: 'rgba(234,179,8,0.25)',   badge: 'bg-yellow-500/20 text-white border-yellow-500/50', accent: 'text-yellow-400' },
  lime:    { gradient: 'from-lime-500 to-green-600',     glow: 'rgba(132,204,22,0.25)',  badge: 'bg-lime-500/20 text-white border-lime-500/50',    accent: 'text-lime-400' },
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
    code: '1123/0500',
    icon: BookOpen,
    colorScheme: colors.purple,
    description: 'Reading, Writing & Language competencies',
    active: true,
  },
  {
    id: 'physics-5054',
    name: 'Physics',
    code: '5054/0625',
    icon: Atom,
    colorScheme: colors.amber,
    description: 'Mechanics, Waves, Electricity & Modern Physics',
    active: true,
  },
  {
    id: 'chemistry-5070',
    name: 'Chemistry',
    code: '5070/0620',
    icon: FlaskConical,
    colorScheme: colors.rose,
    description: 'Atomic structure, Bonding, Organic & Inorganic Chemistry',
    active: true,
  },
  {
    id: 'biology-5090',
    name: 'Biology',
    code: '5090/0610',
    icon: Microscope,
    colorScheme: colors.lime,
    description: 'Cell Biology, Genetics, Ecology & Human Physiology',
    active: true,
  },
  {
    id: 'urdu-3248',
    name: 'Urdu',
    code: '3248',
    icon: Languages,
    colorScheme: colors.cyan,
    description: 'Comprehension, Essay & Formal Writing',
    active: true,
  },
  {
    id: 'pakistan-studies-2059',
    name: 'Pakistan Studies',
    code: '2059',
    icon: Globe,
    colorScheme: colors.gold,
    description: 'History, Geography & Current Affairs of Pakistan',
    active: true,
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
    active: true,
  },
  {
    id: 'chemistry-9701',
    name: 'Chemistry',
    code: '9701',
    icon: FlaskConical,
    colorScheme: colors.rose,
    description: 'Physical, Inorganic & Organic Chemistry — AS & A2',
    active: true,
  },
  {
    id: 'biology-9700',
    name: 'Biology',
    code: '9700',
    icon: Microscope,
    colorScheme: colors.lime,
    description: 'Molecular Biology, Genetics, Ecology & Physiology',
    active: true,
  },
];
