// ─── Subject Metadata ────────────────────────────────────────────────────────
// Maps URL slugs to display info. Used by breadcrumbs and page headers.

export type SubjectMeta = {
  name: string;
  code: string;
  displayCode: string;   // shown in breadcrumbs, e.g. "4024/0580"
  slug: string;
  color: string;         // gradient classes for subject cards
};

export const subjectMeta: Record<string, SubjectMeta> = {
  // ── O-Level / IGCSE ──
  'mathematics-4024': {
    name: 'Mathematics',
    code: '4024',
    displayCode: '4024/0580',
    slug: 'mathematics-4024',
    color: 'from-blue-500 to-indigo-600',
  },
  'computer-science-0478': {
    name: 'Computer Science',
    code: '0478',
    displayCode: '0478',
    slug: 'computer-science-0478',
    color: 'from-emerald-500 to-teal-600',
  },
  'english-1123': {
    name: 'English Language',
    code: '1123',
    displayCode: '1123/0500',
    slug: 'english-1123',
    color: 'from-purple-500 to-violet-600',
  },
  'physics-5054': {
    name: 'Physics',
    code: '5054',
    displayCode: '5054/0625',
    slug: 'physics-5054',
    color: 'from-amber-500 to-orange-600',
  },
  'chemistry-5070': {
    name: 'Chemistry',
    code: '5070',
    displayCode: '5070/0620',
    slug: 'chemistry-5070',
    color: 'from-rose-500 to-pink-600',
  },
  'biology-5090': {
    name: 'Biology',
    code: '5090',
    displayCode: '5090/0610',
    slug: 'biology-5090',
    color: 'from-lime-500 to-green-600',
  },
  'urdu-3248': {
    name: 'Urdu',
    code: '3248',
    displayCode: '3248',
    slug: 'urdu-3248',
    color: 'from-cyan-500 to-sky-600',
  },
  'pakistan-studies-2059': {
    name: 'Pakistan Studies',
    code: '2059',
    displayCode: '2059',
    slug: 'pakistan-studies-2059',
    color: 'from-yellow-500 to-amber-600',
  },
  // ── A-Level ──
  'mathematics-9709': {
    name: 'Mathematics',
    code: '9709',
    displayCode: '9709',
    slug: 'mathematics-9709',
    color: 'from-yellow-500 to-amber-600',
  },
  'computer-science-9618': {
    name: 'Computer Science',
    code: '9618',
    displayCode: '9618',
    slug: 'computer-science-9618',
    color: 'from-emerald-500 to-teal-600',
  },
  'physics-9702': {
    name: 'Physics',
    code: '9702',
    displayCode: '9702',
    slug: 'physics-9702',
    color: 'from-amber-500 to-orange-600',
  },
  'chemistry-9701': {
    name: 'Chemistry',
    code: '9701',
    displayCode: '9701',
    slug: 'chemistry-9701',
    color: 'from-rose-500 to-pink-600',
  },
  'biology-9700': {
    name: 'Biology',
    code: '9700',
    displayCode: '9700',
    slug: 'biology-9700',
    color: 'from-lime-500 to-green-600',
  },
};

/** Resolve display name from a URL slug, e.g. "Mathematics (4024/0580)" */
export function getSubjectLabel(slug: string): string {
  const meta = subjectMeta[slug];
  if (meta) return `${meta.name} (${meta.displayCode})`;
  // Fallback: title-case the slug
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Resolve the short heading, e.g. "Mathematics — 4024/0580" */
export function getSubjectHeading(slug: string): string {
  const meta = subjectMeta[slug];
  if (meta) return `${meta.name} — ${meta.displayCode}`;
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export const mainNavItems = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'STEM',
    href: '/stem',
  },
  {
    label: 'A-Level',
    href: '/alevel',
  },
  {
    label: 'O-Level / IGCSE',
    href: '/olevel',
  },
  {
    label: 'Pre O-Level',
    href: '/pre-olevel',
  },
  {
    label: 'Digital Skills',
    href: '/digital-skills',
  },
  {
    label: 'Blog',
    href: '/blog',
  },
  {
    label: 'Contact',
    href: '/contact',
  },
];

// ─── O-Level Grades (shared by all O-Level subjects) ─────────────────────────

export const oLevelGrades = [
  { label: 'Grade 9', slug: 'grade-9', description: 'Foundation level preparation for IGCSE' },
  { label: 'Grade 10', slug: 'grade-10', description: 'Intermediate O-Level concepts and practice' },
  { label: 'Grade 11', slug: 'grade-11', description: 'Advanced O-Level and exam preparation' },
];

// ─── A-Level Papers (per subject) ────────────────────────────────────────────

type PaperConfig = { label: string; slug: string; description: string };

export const aLevelPapersBySubject: Record<string, { 'as-level': PaperConfig[]; 'a2-level': PaperConfig[] }> = {
  'mathematics-9709': {
    'as-level': [
      { label: 'Paper 1 — Pure Mathematics', slug: 'paper-1-pure-mathematics', description: 'Algebra, functions, coordinate geometry, calculus' },
      { label: 'Paper 5 — Probability & Statistics', slug: 'paper-5-probability-statistics', description: 'Statistical data, probability, distributions' },
    ],
    'a2-level': [
      { label: 'Paper 3 — Pure Mathematics', slug: 'paper-3-pure-mathematics', description: 'Advanced calculus, differential equations, vectors' },
      { label: 'Paper 4 — Mechanics', slug: 'paper-4-mechanics', description: 'Forces, energy, motion, equilibrium' },
    ],
  },
  'computer-science-9618': {
    'as-level': [
      { label: 'Paper 1 — Theory Fundamentals', slug: 'paper-1-theory-fundamentals', description: 'Data representation, communication, hardware, logic, software, security' },
      { label: 'Paper 2 — Problem-solving & Programming', slug: 'paper-2-problem-solving-programming', description: 'Algorithm design, pseudocode, programming concepts, databases' },
    ],
    'a2-level': [
      { label: 'Paper 3 — Advanced Theory', slug: 'paper-3-advanced-theory', description: 'Computational thinking, processors, networks, databases, Big-O' },
      { label: 'Paper 4 — Practical', slug: 'paper-4-practical', description: 'Programming project and practical problem-solving' },
    ],
  },
  'physics-9702': {
    'as-level': [
      { label: 'Paper 1 — Multiple Choice', slug: 'paper-1-multiple-choice', description: 'AS-level multiple choice covering all AS topics' },
      { label: 'Paper 2 — AS Structured Questions', slug: 'paper-2-as-structured-questions', description: 'Short and structured questions on AS physics' },
    ],
    'a2-level': [
      { label: 'Paper 3 — Advanced Practical Skills', slug: 'paper-3-advanced-practical-skills', description: 'Planning, analysis and evaluation of experiments' },
      { label: 'Paper 4 — A2 Structured Questions', slug: 'paper-4-a2-structured-questions', description: 'Structured questions on A2 physics topics' },
      { label: 'Paper 5 — Planning, Analysis & Evaluation', slug: 'paper-5-planning-analysis-evaluation', description: 'Practical planning and data analysis' },
    ],
  },
  'chemistry-9701': {
    'as-level': [
      { label: 'Paper 1 — Multiple Choice', slug: 'paper-1-multiple-choice', description: 'AS-level multiple choice covering all AS topics' },
      { label: 'Paper 2 — AS Structured Questions', slug: 'paper-2-as-structured-questions', description: 'Short and structured questions on AS chemistry' },
    ],
    'a2-level': [
      { label: 'Paper 3 — Advanced Practical Skills', slug: 'paper-3-advanced-practical-skills', description: 'Planning, analysis and evaluation of experiments' },
      { label: 'Paper 4 — A2 Structured Questions', slug: 'paper-4-a2-structured-questions', description: 'Structured questions on A2 chemistry topics' },
      { label: 'Paper 5 — Planning, Analysis & Evaluation', slug: 'paper-5-planning-analysis-evaluation', description: 'Practical planning and data analysis' },
    ],
  },
  'biology-9700': {
    'as-level': [
      { label: 'Paper 1 — Multiple Choice', slug: 'paper-1-multiple-choice', description: 'AS-level multiple choice covering all AS topics' },
      { label: 'Paper 2 — AS Structured Questions', slug: 'paper-2-as-structured-questions', description: 'Short and structured questions on AS biology' },
    ],
    'a2-level': [
      { label: 'Paper 3 — Advanced Practical Skills', slug: 'paper-3-advanced-practical-skills', description: 'Planning, analysis and evaluation of experiments' },
      { label: 'Paper 4 — A2 Structured Questions', slug: 'paper-4-a2-structured-questions', description: 'Structured questions on A2 biology topics' },
      { label: 'Paper 5 — Planning, Analysis & Evaluation', slug: 'paper-5-planning-analysis-evaluation', description: 'Practical planning and data analysis' },
    ],
  },
};

/** Backward-compatible: return papers for a subject (defaults to Maths) */
export const aLevelPapers = aLevelPapersBySubject['mathematics-9709'];
