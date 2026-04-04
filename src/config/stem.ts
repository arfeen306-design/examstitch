// ─── STEM Interactive Hub — Simulation Data ─────────────────────────────────

export interface Simulation {
  id: string;
  title: string;
  description: string;
  icon: string;       // Lucide icon name
  gradient: string;   // Tailwind gradient classes
  glowColor: string;  // rgba glow for hover
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
}

export interface StemCategory {
  id: string;
  label: string;
  slug: string;
  description: string;
  icon: string;
  gradient: string;
  glowColor: string;
  heroGradient: string;
  simulations: Simulation[];
}

export const STEM_CATEGORIES: StemCategory[] = [
  {
    id: 'mathematics',
    label: 'Mathematics',
    slug: 'mathematics',
    description: 'Explore geometry, vectors, and calculus through interactive 3D visualisations.',
    icon: 'Pi',
    gradient: 'from-blue-500 to-indigo-600',
    glowColor: 'rgba(99,102,241,0.35)',
    heroGradient: 'from-blue-600 via-indigo-700 to-violet-800',
    simulations: [
      {
        id: 'geometry-explorer',
        title: '3D Geometry Explorer',
        description: 'Manipulate 3D shapes — rotate, slice, and measure angles, surface areas, and volumes in real time.',
        icon: 'Box',
        gradient: 'from-blue-500 to-cyan-400',
        glowColor: 'rgba(59,130,246,0.35)',
        difficulty: 'Beginner',
        tags: ['Shapes', 'Volume', 'Surface Area'],
      },
      {
        id: 'vector-lab',
        title: 'Vector Visualiser',
        description: 'Add, subtract, and compute dot & cross products of 3D vectors with instant graphical feedback.',
        icon: 'Move3D',
        gradient: 'from-violet-500 to-purple-500',
        glowColor: 'rgba(139,92,246,0.35)',
        difficulty: 'Intermediate',
        tags: ['Vectors', 'Dot Product', 'Cross Product'],
      },
      {
        id: 'calculus-visualiser',
        title: '3D Calculus Visualiser',
        description: 'Plot functions, visualise derivatives and integrals, and explore limits on interactive graphs.',
        icon: 'TrendingUp',
        gradient: 'from-emerald-500 to-teal-500',
        glowColor: 'rgba(16,185,129,0.35)',
        difficulty: 'Advanced',
        tags: ['Differentiation', 'Integration', 'Limits'],
      },
    ],
  },
  {
    id: 'science',
    label: 'Science',
    slug: 'science',
    description: 'Dive into physics and chemistry with hands-on 3D simulations and experiments.',
    icon: 'FlaskConical',
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245,158,11,0.35)',
    heroGradient: 'from-amber-600 via-orange-700 to-red-800',
    simulations: [
      {
        id: 'atomic-structure',
        title: 'Atomic Structure 3D',
        description: 'Explore electron shells, orbitals, and atomic models — from Bohr to quantum mechanical.',
        icon: 'Atom',
        gradient: 'from-amber-500 to-yellow-400',
        glowColor: 'rgba(245,158,11,0.35)',
        difficulty: 'Beginner',
        tags: ['Atoms', 'Electrons', 'Orbitals'],
      },
      {
        id: 'pendulum-lab',
        title: 'Physics Pendulum Lab',
        description: 'Adjust mass, length, and gravity to observe simple harmonic motion and energy conservation.',
        icon: 'Activity',
        gradient: 'from-rose-500 to-pink-500',
        glowColor: 'rgba(244,63,94,0.35)',
        difficulty: 'Intermediate',
        tags: ['SHM', 'Energy', 'Oscillation'],
      },
      {
        id: 'chemical-bonding',
        title: 'Chemical Bonding 3D',
        description: 'Build molecules, visualise ionic and covalent bonds, and explore molecular geometry.',
        icon: 'Hexagon',
        gradient: 'from-teal-500 to-emerald-500',
        glowColor: 'rgba(20,184,166,0.35)',
        difficulty: 'Intermediate',
        tags: ['Ionic', 'Covalent', 'Molecular Geometry'],
      },
    ],
  },
];

/** Flat list of all simulations with their category slug */
export function getAllSimulations() {
  return STEM_CATEGORIES.flatMap((cat) =>
    cat.simulations.map((sim) => ({ ...sim, category: cat.slug })),
  );
}

/** Find a category by slug */
export function getCategoryBySlug(slug: string) {
  return STEM_CATEGORIES.find((c) => c.slug === slug);
}

/** Find a simulation by category + id */
export function getSimulation(categorySlug: string, simId: string) {
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) return null;
  return cat.simulations.find((s) => s.id === simId) ?? null;
}
