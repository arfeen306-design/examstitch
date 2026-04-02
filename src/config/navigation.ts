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
  'mathematics-9709': {
    name: 'Mathematics',
    code: '9709',
    displayCode: '9709',
    slug: 'mathematics-9709',
    color: 'from-gold-500 to-gold-700',
  },
  'computer-science-9618': {
    name: 'Computer Science',
    code: '9618',
    displayCode: '9618',
    slug: 'computer-science-9618',
    color: 'from-emerald-500 to-teal-600',
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
    label: 'Pre O-Level',
    href: '/pre-olevel',
  },
  {
    label: 'O-Level / IGCSE',
    href: '/olevel',
    children: [
      { label: 'Mathematics (4024/0580)', href: '/olevel/mathematics-4024' },
      { label: 'Computer Science (0478)', href: '/olevel/computer-science-0478' },
    ],
  },
  {
    label: 'A-Level',
    href: '/alevel',
    children: [
      { label: 'Mathematics (9709)', href: '/alevel/mathematics-9709' },
      { label: 'Computer Science (9618)', href: '/alevel/computer-science-9618' },
    ],
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
};

/** Backward-compatible: return papers for a subject (defaults to Maths) */
export const aLevelPapers = aLevelPapersBySubject['mathematics-9709'];
