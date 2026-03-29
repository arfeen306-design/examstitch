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
    ],
  },
  {
    label: 'A-Level',
    href: '/alevel',
    children: [
      { label: 'Mathematics (9709)', href: '/alevel/mathematics-9709' },
    ],
  },
  {
    label: 'Blog',
    href: '/blog',
  },
];

export const oLevelGrades = [
  { label: 'Grade 9', slug: 'grade-9', description: 'Foundation level mathematics for IGCSE preparation' },
  { label: 'Grade 10', slug: 'grade-10', description: 'Intermediate O-Level mathematics concepts and practice' },
  { label: 'Grade 11', slug: 'grade-11', description: 'Advanced O-Level mathematics and exam preparation' },
];

export const aLevelPapers = {
  'as-level': [
    { label: 'Paper 1 — Pure Mathematics', slug: 'paper-1-pure-mathematics', description: 'Algebra, functions, coordinate geometry, calculus' },
    { label: 'Paper 5 — Probability & Statistics', slug: 'paper-5-probability-statistics', description: 'Statistical data, probability, distributions' },
  ],
  'a2-level': [
    { label: 'Paper 3 — Pure Mathematics', slug: 'paper-3-pure-mathematics', description: 'Advanced calculus, differential equations, vectors' },
    { label: 'Paper 4 — Mechanics', slug: 'paper-4-mechanics', description: 'Forces, energy, motion, equilibrium' },
  ],
};
