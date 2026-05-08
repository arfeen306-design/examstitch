/**
 * taxonomy.ts — Universal Subject Taxonomy (Canonical)
 *
 * Single source of truth for every subject:
 *   • Cambridge codes (O / A / IGCSE)
 *   • Database slugs (matches public.subjects.slug)
 *   • URL slugs (matches subject_papers.slug)
 *   • Admin portal config (route segment, label, gradient, syllabus flags)
 *   • Public UI metadata (gradient, color scheme, icon, description)
 *   • A-Level paper structure (sections + papers)
 *
 * After Phase 4, this file replaces:
 *   • src/config/subjects.ts          (deleted)
 *   • src/config/admin-portals.ts     (deleted)
 * and is the only place a new subject ever needs to be added.
 *
 * AUDIT_REPORT.md → Findings H-26, H-13.
 */

import {
  Calculator, Monitor, BookOpen, Atom, FlaskConical, Microscope,
  Languages, Globe, Award, Briefcase, Landmark, Brain,
  type LucideIcon,
} from 'lucide-react';
import { MODULE_TYPES as MT } from '@/lib/constants';

// ── Module Types (universal across all subjects) ────────────────────────────

export const MODULE_TYPES = [
  { value: MT.VIDEO_TOPICAL, label: 'Video Lecture' },
  { value: MT.SOLVED_PAST_PAPER, label: 'Solved Past Paper' },
] as const;

export type ModuleType = (typeof MODULE_TYPES)[number]['value'];

// ── O-Level Grades (shared by all O-Level subjects) ─────────────────────────

export const OLEVEL_GRADES = [
  { value: 'grade-9' as const, label: 'Grade 9' },
  { value: 'grade-10' as const, label: 'Grade 10' },
  { value: 'grade-11' as const, label: 'Grade 11' },
] as const;

export type OLevelGrade = (typeof OLEVEL_GRADES)[number]['value'];

// ── A-Level Sections ────────────────────────────────────────────────────────

export const ALEVEL_SECTIONS = [
  { value: 'as' as const, label: 'AS Level' },
  { value: 'a2' as const, label: 'A2 Level' },
] as const;

export type ALevelSection = (typeof ALEVEL_SECTIONS)[number]['value'];

// ── Color schemes (Tailwind utility class sets) ─────────────────────────────

export interface ColorScheme {
  gradient: string;
  glow: string;
  badge: string;
  accent: string;
}

export type ColorKey =
  | 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan' | 'gold' | 'lime'
  | 'indigo' | 'slate' | 'teal';

const COLOR_SCHEMES: Record<ColorKey, ColorScheme> = {
  blue:    { gradient: 'from-blue-500 to-indigo-600',    glow: 'rgba(99,102,241,0.25)',  badge: 'bg-blue-500/20 text-white border-blue-500/50',    accent: 'text-blue-400' },
  emerald: { gradient: 'from-emerald-500 to-teal-600',   glow: 'rgba(16,185,129,0.25)',  badge: 'bg-emerald-500/20 text-white border-emerald-500/50', accent: 'text-emerald-400' },
  purple:  { gradient: 'from-purple-500 to-violet-600',  glow: 'rgba(139,92,246,0.25)',  badge: 'bg-purple-500/20 text-white border-purple-500/50', accent: 'text-purple-400' },
  amber:   { gradient: 'from-amber-500 to-orange-600',   glow: 'rgba(245,158,11,0.25)',  badge: 'bg-amber-500/20 text-white border-amber-500/50',  accent: 'text-amber-400' },
  rose:    { gradient: 'from-rose-500 to-pink-600',      glow: 'rgba(244,63,94,0.25)',   badge: 'bg-rose-500/20 text-white border-rose-500/50',    accent: 'text-rose-400' },
  cyan:    { gradient: 'from-cyan-500 to-sky-600',       glow: 'rgba(6,182,212,0.25)',   badge: 'bg-cyan-500/20 text-white border-cyan-500/50',    accent: 'text-cyan-400' },
  gold:    { gradient: 'from-yellow-500 to-amber-600',   glow: 'rgba(234,179,8,0.25)',   badge: 'bg-yellow-500/20 text-white border-yellow-500/50', accent: 'text-yellow-400' },
  lime:    { gradient: 'from-lime-500 to-green-600',     glow: 'rgba(132,204,22,0.25)',  badge: 'bg-lime-500/20 text-white border-lime-500/50',    accent: 'text-lime-400' },
  indigo:  { gradient: 'from-indigo-500 to-violet-600',  glow: 'rgba(99,102,241,0.25)',  badge: 'bg-indigo-500/20 text-white border-indigo-500/50', accent: 'text-indigo-400' },
  slate:   { gradient: 'from-slate-500 to-zinc-600',     glow: 'rgba(100,116,139,0.25)', badge: 'bg-slate-500/20 text-white border-slate-500/50',  accent: 'text-slate-300' },
  teal:    { gradient: 'from-teal-500 to-emerald-600',   glow: 'rgba(20,184,166,0.25)',  badge: 'bg-teal-500/20 text-white border-teal-500/50',    accent: 'text-teal-300' },
};

export function getColorScheme(key: ColorKey): ColorScheme {
  return COLOR_SCHEMES[key];
}

// ── Icon registry — keys map to LucideIcon refs ─────────────────────────────

export type IconKey =
  | 'calculator' | 'monitor' | 'bookOpen' | 'atom' | 'flask' | 'microscope'
  | 'languages' | 'globe' | 'award' | 'briefcase' | 'landmark' | 'brain';

const ICONS: Record<IconKey, LucideIcon> = {
  calculator: Calculator,
  monitor: Monitor,
  bookOpen: BookOpen,
  atom: Atom,
  flask: FlaskConical,
  microscope: Microscope,
  languages: Languages,
  globe: Globe,
  award: Award,
  briefcase: Briefcase,
  landmark: Landmark,
  brain: Brain,
};

export function getSubjectIcon(key: IconKey): LucideIcon {
  return ICONS[key];
}

// ── Paper Definition ────────────────────────────────────────────────────────

export interface PaperDef {
  value: string;
  label: string;
  description?: string;
}

// ── Admin Portal Block (per subject) ────────────────────────────────────────

export interface AdminPortalConfig {
  /** URL segment under /admin/ — e.g. 'cs' → /admin/cs */
  routeSegment: string;
  /** Display label in sidebar and switcher */
  label: string;
  /** Tailwind gradient classes for the switcher icon badge */
  gradient: string;
  /**
   * Exact public.subjects.slug values (parent discipline rows).
   * Often differs from URL slugs — e.g. "maths" vs paper slug "mathematics-4024".
   */
  dbSubjectSlugs: string[];
  /**
   * Prefixes for subject_papers.slug — e.g. "mathematics" matches
   * mathematics-4024 and mathematics-9709.
   */
  subjectPaperSlugPrefixes: string[];
  /** Cambridge offers an A-Level syllabus (AS/A2 papers exist). */
  hasALevelSyllabus: boolean;
}

// ── Subject Taxonomy Entry ──────────────────────────────────────────────────

export interface SubjectTaxonomy {
  /** Subject display name */
  name: string;
  /** One-line public-facing description (used in subject grids) */
  description: string;
  /** Cambridge subject code for the O-Level variant */
  oLevelCode: string;
  /** Cambridge subject code for the A-Level variant (null if A-Level doesn't exist) */
  aLevelCode: string | null;
  /** Slug used to look up the subject in the DB — matches subject_papers.slug */
  oLevelSlug: string;
  /** A-Level slug (null if no A-Level variant) */
  aLevelSlug: string | null;
  /** A-Level papers keyed by section. Null if no A-Level variant. */
  aLevelPapers: Record<ALevelSection, PaperDef[]> | null;
  /** Whether this subject's portal is currently live (has content). */
  active: boolean;
  /** Accent color hex for admin UI */
  accentColor: string;
  /** Display string for breadcrumbs/headings, e.g. "4024/0580" */
  displayCode: string;
  /** Tailwind gradient for subject cards (consumed by both public and admin UI) */
  gradient: string;
  /** Keyed color scheme — used by public subject grid */
  colorKey: ColorKey;
  /** Keyed icon ref — consumers pull the LucideIcon via getSubjectIcon */
  iconKey: IconKey;
  /** Admin portal binding — the exclusive source for /admin/<segment> routing */
  adminPortal: AdminPortalConfig;
  /**
   * Phase 2.1 (H-26): legacy / alternate slugs for this subject. Resolved by
   * `getTaxonomyBySlug` in addition to the primary keys, so URL bookmarks and
   * cross-system identifiers (e.g. 'math' vs 'maths') keep working.
   *
   * Aliases are documentation; the resolver also walks
   * `adminPortal.dbSubjectSlugs`. Listing here makes intent explicit.
   */
  aliases?: string[];
  /**
   * Phase 2.1 (H-26): canonical `public.subjects.id` UUID for this subject.
   *
   * When set, queries that need a discipline subject UUID can use this
   * directly instead of looking it up by slug. Eliminates the slug-mismatch
   * class of bug entirely (a UUID is the same regardless of whether the row
   * was created under 'maths', 'math', or 'mathematics').
   *
   * Leave `undefined` until you have the production UUID, then paste it in.
   * The resolver gracefully falls back to slug-based lookup when this is
   * unset, so unfilled entries are never broken.
   */
  subjectId?: string;
}

// ── The Dictionary ──────────────────────────────────────────────────────────
// Adding a new subject is a single-entry edit here. The provisioning action
// (provisionPortalHierarchy) will create its full category tree on first run.

export const SUBJECT_TAXONOMY: Record<string, SubjectTaxonomy> = {
  'mathematics': {
    name: 'Mathematics',
    description: 'Extended & Core Mathematics — Grades 9, 10 & 11, plus AS/A2 Pure & Mechanics',
    oLevelCode: '4024',
    aLevelCode: '9709',
    oLevelSlug: 'mathematics-4024',
    aLevelSlug: 'mathematics-9709',
    accentColor: '#3B82F6',
    displayCode: '4024/0580',
    gradient: 'from-blue-500 to-indigo-600',
    colorKey: 'blue',
    iconKey: 'calculator',
    active: true,
    // Phase 2.1: explicit alias list. 'maths' is canonical, 'math' is the
    // legacy form some old rows/URLs use. Both resolve to this entry via
    // getTaxonomyBySlug.
    aliases: ['math'],
    // Canonical public.subjects.id from production. Verified via the live
    // DB on 2026-05-02 — there is exactly ONE row for Mathematics
    // (slug='maths') and zero duplicates. Setting this UUID makes every
    // dashboard / Server-Action query for the math portal go straight to
    // .eq('id', subjectId) — no slug lookup, no ambiguity, immune to drift.
    subjectId: '15a91306-cc84-456c-aeef-e04c610b9ec7',
    adminPortal: {
      routeSegment: 'math',
      label: 'Math Resources',
      gradient: 'from-blue-500 to-indigo-600',
      // 'maths' is the canonical primary slug (matches the production
      // public.subjects row). 'math' is recognised as an alias because
      // historic rows / out-of-band SQL fixes occasionally created the
      // discipline under 'math' instead. Both forms resolve to the same
      // portal — see resolveDisciplineSubjectIdForPortal.
      dbSubjectSlugs: ['maths', 'math', 'mathematics'],
      subjectPaperSlugPrefixes: ['mathematics'],
      hasALevelSyllabus: true,
    },
    aLevelPapers: {
      as: [
        { value: 'paper-1', label: 'Paper 1 — Pure Mathematics', description: 'Algebra, functions, coordinate geometry, calculus' },
        { value: 'paper-5', label: 'Paper 5 — Probability & Statistics', description: 'Statistical data, probability, distributions' },
      ],
      a2: [
        { value: 'paper-3', label: 'Paper 3 — Pure Mathematics', description: 'Advanced calculus, differential equations, vectors' },
        { value: 'paper-4', label: 'Paper 4 — Mechanics', description: 'Forces, energy, motion, equilibrium' },
      ],
    },
  },

  'computer-science': {
    name: 'Computer Science',
    description: 'Theory, Problem-solving & Programming — O-Level and A-Level',
    oLevelCode: '0478',
    aLevelCode: null,
    oLevelSlug: 'computer-science-0478',
    aLevelSlug: null,
    accentColor: '#6366F1',
    displayCode: '0478',
    gradient: 'from-emerald-500 to-teal-600',
    colorKey: 'emerald',
    iconKey: 'monitor',
    active: true,
    aliases: ['cs'],
    subjectId: '28ba9830-b8d6-45b0-9746-fa5e124941e7',
    adminPortal: {
      routeSegment: 'cs',
      label: 'CS Resources',
      gradient: 'from-emerald-500 to-teal-600',
      dbSubjectSlugs: ['computer-science'],
      subjectPaperSlugPrefixes: ['computer-science'],
      hasALevelSyllabus: false,
    },
    aLevelPapers: null,
  },

  'physics': {
    name: 'Physics',
    description: 'Mechanics, Waves, Electricity, Modern Physics — O-Level and A-Level',
    oLevelCode: '5054',
    aLevelCode: null,
    oLevelSlug: 'physics-5054',
    aLevelSlug: null,
    accentColor: '#F59E0B',
    displayCode: '5054/0625',
    gradient: 'from-amber-500 to-orange-600',
    colorKey: 'amber',
    iconKey: 'atom',
    active: true,
    subjectId: '6c79d950-8ecb-40db-a32f-4b694295eb28',
    adminPortal: {
      routeSegment: 'physics',
      label: 'Physics Resources',
      gradient: 'from-amber-500 to-orange-600',
      dbSubjectSlugs: ['physics'],
      subjectPaperSlugPrefixes: ['physics'],
      hasALevelSyllabus: false,
    },
    aLevelPapers: null,
  },

  'chemistry': {
    name: 'Chemistry',
    description: 'Atomic structure, Bonding, Organic & Inorganic Chemistry — O-Level and A-Level',
    oLevelCode: '5070',
    aLevelCode: null,
    oLevelSlug: 'chemistry-5070',
    aLevelSlug: null,
    accentColor: '#F43F5E',
    displayCode: '5070/0620',
    gradient: 'from-rose-500 to-pink-600',
    colorKey: 'rose',
    iconKey: 'flask',
    active: true,
    subjectId: 'b24b1de0-a121-4875-9921-a3319ecf1ef9',
    adminPortal: {
      routeSegment: 'chemistry',
      label: 'Chemistry Resources',
      gradient: 'from-rose-500 to-pink-600',
      dbSubjectSlugs: ['chemistry'],
      subjectPaperSlugPrefixes: ['chemistry'],
      hasALevelSyllabus: false,
    },
    aLevelPapers: null,
  },

  'biology': {
    name: 'Biology',
    description: 'Cell Biology, Genetics, Ecology, Human Physiology — O-Level and A-Level',
    oLevelCode: '5090',
    aLevelCode: null,
    oLevelSlug: 'biology-5090',
    aLevelSlug: null,
    accentColor: '#84CC16',
    displayCode: '5090/0610',
    gradient: 'from-lime-500 to-green-600',
    colorKey: 'lime',
    iconKey: 'microscope',
    active: true,
    subjectId: '160357b6-58fb-435d-9175-ed15b9c6516b',
    adminPortal: {
      routeSegment: 'biology',
      label: 'Biology Resources',
      gradient: 'from-lime-500 to-green-600',
      dbSubjectSlugs: ['biology'],
      subjectPaperSlugPrefixes: ['biology'],
      hasALevelSyllabus: false,
    },
    aLevelPapers: null,
  },

  'english': {
    name: 'English Language',
    description: 'Reading, Writing & Language competencies — O-Level / IGCSE',
    oLevelCode: '1123',
    aLevelCode: null,
    oLevelSlug: 'english-1123',
    aLevelSlug: null,
    accentColor: '#8B5CF6',
    displayCode: '1123/0500',
    gradient: 'from-purple-500 to-violet-600',
    colorKey: 'purple',
    iconKey: 'bookOpen',
    active: true,
    subjectId: '3e575e44-9b60-4d3c-a868-47a1b13fe637',
    adminPortal: {
      routeSegment: 'english',
      label: 'English Resources',
      gradient: 'from-violet-500 to-purple-600',
      dbSubjectSlugs: ['english'],
      subjectPaperSlugPrefixes: ['english'],
      hasALevelSyllabus: false,
    },
    aLevelPapers: null,
  },

  'urdu': {
    name: 'Urdu',
    description: 'Comprehension, Essay & Formal Writing — O-Level',
    oLevelCode: '3248',
    aLevelCode: null,
    oLevelSlug: 'urdu-3248',
    aLevelSlug: null,
    accentColor: '#06B6D4',
    displayCode: '3248',
    gradient: 'from-cyan-500 to-sky-600',
    colorKey: 'cyan',
    iconKey: 'languages',
    active: true,
    subjectId: 'df8a79f0-f2fa-40ae-ad26-a450ad6890d9',
    adminPortal: {
      routeSegment: 'urdu',
      label: 'Urdu Resources',
      gradient: 'from-cyan-500 to-sky-600',
      dbSubjectSlugs: ['urdu'],
      subjectPaperSlugPrefixes: ['urdu'],
      hasALevelSyllabus: false,
    },
    aLevelPapers: null,
  },

  'pakistan-studies': {
    name: 'Pakistan Studies',
    description: 'History, Geography & Current Affairs of Pakistan — O-Level',
    oLevelCode: '2059',
    aLevelCode: null,
    oLevelSlug: 'pakistan-studies-2059',
    aLevelSlug: null,
    accentColor: '#EAB308',
    displayCode: '2059',
    gradient: 'from-yellow-500 to-amber-600',
    colorKey: 'gold',
    iconKey: 'globe',
    active: true,
    subjectId: '840d7caf-ad6a-4c1c-a7ce-2762b491139b',
    adminPortal: {
      routeSegment: 'pakistan-studies',
      label: 'Pak Studies Resources',
      gradient: 'from-yellow-500 to-amber-600',
      dbSubjectSlugs: ['pakistan-studies'],
      subjectPaperSlugPrefixes: ['pakistan-studies'],
      hasALevelSyllabus: false,
    },
    aLevelPapers: null,
  },

  // ── Phase 4: New subjects (active=false until provisioned in DB) ──────────
  'history': {
    name: 'History',
    description: 'World History from 1900 to the present — O-Level and A-Level',
    oLevelCode: '2147',
    aLevelCode: null,
    oLevelSlug: 'history-2147',
    aLevelSlug: null,
    accentColor: '#A78BFA',
    displayCode: '2147/0470',
    gradient: 'from-indigo-500 to-violet-600',
    colorKey: 'indigo',
    iconKey: 'landmark',
    active: false,
    adminPortal: {
      routeSegment: 'history',
      label: 'History Resources',
      gradient: 'from-indigo-500 to-violet-600',
      dbSubjectSlugs: ['history'],
      subjectPaperSlugPrefixes: ['history'],
      hasALevelSyllabus: false,
    },
    aLevelPapers: null,
  },

  'business': {
    name: 'Business Studies',
    description: 'Business activity, people, marketing, operations & finance — O-Level and A-Level',
    oLevelCode: '7115',
    aLevelCode: null,
    oLevelSlug: 'business-7115',
    aLevelSlug: null,
    accentColor: '#14B8A6',
    displayCode: '7115/0450',
    gradient: 'from-teal-500 to-emerald-600',
    colorKey: 'teal',
    iconKey: 'briefcase',
    active: false,
    adminPortal: {
      routeSegment: 'business',
      label: 'Business Resources',
      gradient: 'from-teal-500 to-emerald-600',
      dbSubjectSlugs: ['business'],
      subjectPaperSlugPrefixes: ['business'],
      hasALevelSyllabus: false,
    },
    aLevelPapers: null,
  },
};

// ── Lookup helpers ──────────────────────────────────────────────────────────

/**
 * Legacy URL → canonical taxonomy key. Phase 4 cleanup: when a slug changes
 * we record the old form here so existing student bookmarks and SEO links
 * keep resolving. Add new aliases as they arise; never remove.
 */
const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  // /admin/maths predates /admin/math (commit 02d73ca). Both must resolve.
  'maths': 'mathematics',
  'math': 'mathematics',
  'cs': 'computer-science',
  // Allow bare display codes too:
  '4024': 'mathematics',
  '9709': 'mathematics',
  '0478': 'computer-science',
  '9618': 'computer-science',
};

/**
 * Resolve any of:
 *   • taxonomy key             ('mathematics')
 *   • O-Level paper slug       ('mathematics-4024')
 *   • A-Level paper slug       ('mathematics-9709')
 *   • DB subjects.slug         ('maths')
 *   • Admin route segment      ('math')
 *   • Cambridge code only      ('4024')
 *   • Legacy alias             ('cs', 'math')
 * → the canonical SubjectTaxonomy entry, or null.
 *
 * This is the ONE function any part of the codebase should call to translate
 * an unknown slug into a subject. It supersedes the various ad-hoc lookups
 * in admin-portals.ts, queries.ts and navigation.ts.
 */
export function getTaxonomyBySlug(slug: string | null | undefined): SubjectTaxonomy | null {
  if (!slug) return null;
  const key = slug.trim().toLowerCase();
  if (!key) return null;

  // 1. Direct taxonomy key
  if (SUBJECT_TAXONOMY[key]) return SUBJECT_TAXONOMY[key];

  // 2. O / A paper slug
  for (const tax of Object.values(SUBJECT_TAXONOMY)) {
    if (tax.oLevelSlug === key || tax.aLevelSlug === key) return tax;
  }

  // 3. DB subjects.slug, admin route segment, or explicit aliases
  for (const tax of Object.values(SUBJECT_TAXONOMY)) {
    if (tax.adminPortal.dbSubjectSlugs.includes(key)) return tax;
    if (tax.adminPortal.routeSegment === key) return tax;
    if (tax.aliases?.includes(key)) return tax;
  }

  // 4. Legacy redirect map
  const redirected = LEGACY_SLUG_REDIRECTS[key];
  if (redirected && SUBJECT_TAXONOMY[redirected]) return SUBJECT_TAXONOMY[redirected];

  return null;
}

/** @deprecated use getTaxonomyBySlug — kept for one release for callers */
export const getTaxonomyByKey = (key: string): SubjectTaxonomy | null =>
  SUBJECT_TAXONOMY[key] ?? null;

/** Get all subject keys that have an A-Level variant */
export function getSubjectsWithALevel(): string[] {
  return Object.entries(SUBJECT_TAXONOMY)
    .filter(([, t]) => t.aLevelCode !== null)
    .map(([key]) => key);
}

/** Check if a module_type value is valid */
export function isValidModuleType(value: string): value is ModuleType {
  return MODULE_TYPES.some(m => m.value === value);
}

/** Get display label for a module_type */
export function getModuleTypeLabel(value: string): string {
  return MODULE_TYPES.find(m => m.value === value)?.label ?? value;
}

/**
 * Convert a paper label like "Paper 1 — Pure Mathematics" to a URL-safe
 * kebab slug like "paper-1-pure-mathematics". Used by the provisioner to
 * derive category slugs from taxonomy paper definitions.
 *
 * Output is stable across labels: lowercases, strips em-dashes and
 * non-alphanumeric punctuation, collapses runs of separators to one dash.
 */
export function paperLabelToSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/—/g, ' ')          // em dash → space
    .replace(/[^a-z0-9-]+/g, '-') // any non-alphanumeric → dash
    .replace(/-+/g, '-')          // collapse repeats
    .replace(/^-|-$/g, '');       // trim
}

/**
 * Provisioner-shaped paper config derived from a taxonomy entry.
 * Every active subject — including History, Business, and any future entry
 * added to SUBJECT_TAXONOMY — produces the same shape, so the provisioner
 * never needs another `if (subject === ...)` branch.
 */
export interface ProvisionerPaperConfig {
  'as-level': { label: string; slug: string; description: string }[];
  'a2-level': { label: string; slug: string; description: string }[];
}

/** Build a ProvisionerPaperConfig from a taxonomy entry. */
export function getProvisionerPapers(tax: SubjectTaxonomy): ProvisionerPaperConfig | null {
  if (!tax.aLevelPapers) return null;
  const map = (papers: PaperDef[]) =>
    papers.map((p) => ({
      label: p.label,
      slug: paperLabelToSlug(p.label),
      description: p.description ?? '',
    }));
  return {
    'as-level': map(tax.aLevelPapers.as),
    'a2-level': map(tax.aLevelPapers.a2),
  };
}

/**
 * @deprecated use getTaxonomyBySlug.
 * Determine which subject taxonomy key a subject_id/slug maps to.
 */
export function getSubjectKey(slugOrId: string): string | null {
  const tax = getTaxonomyBySlug(slugOrId);
  if (!tax) return null;
  for (const [key, value] of Object.entries(SUBJECT_TAXONOMY)) {
    if (value === tax) return key;
  }
  return null;
}

// ── Admin Portal selectors (formerly in admin-portals.ts) ───────────────────

export interface AdminPortal {
  routeSegment: string;
  label: string;
  gradient: string;
  accentColor: string;
  dbSubjectSlugs: string[];
  subjectPaperSlugPrefixes: string[];
  /** subject_papers.slug for the O-Level row — used by HierarchyPicker. */
  taxonomyOLevelPaperSlug: string;
  hasALevelSyllabus?: boolean;
  /** Whether this portal is currently active. Inactive portals are listed
   *  for super-admin provisioning but hidden from regular admins. */
  active: boolean;
}

/**
 * Display order for the portals — preserved from the pre-Phase-4 hardcoded
 * ordering so the sidebar/switcher are not reshuffled by this refactor.
 */
const PORTAL_DISPLAY_ORDER: readonly string[] = [
  'computer-science',
  'mathematics',
  'physics',
  'chemistry',
  'biology',
  'english',
  'urdu',
  'pakistan-studies',
  'history',
  'business',
] as const;

function adminPortalFromTaxonomy(tax: SubjectTaxonomy): AdminPortal {
  return {
    routeSegment: tax.adminPortal.routeSegment,
    label: tax.adminPortal.label,
    gradient: tax.adminPortal.gradient,
    accentColor: tax.accentColor,
    dbSubjectSlugs: tax.adminPortal.dbSubjectSlugs,
    subjectPaperSlugPrefixes: tax.adminPortal.subjectPaperSlugPrefixes,
    taxonomyOLevelPaperSlug: tax.oLevelSlug,
    hasALevelSyllabus: tax.adminPortal.hasALevelSyllabus,
    active: tax.active,
  };
}

/** Every admin portal, in display order. Includes inactive portals so
 *  super-admins can see and provision them. */
export const ADMIN_PORTALS: AdminPortal[] = PORTAL_DISPLAY_ORDER
  .map((key) => SUBJECT_TAXONOMY[key])
  .filter((t): t is SubjectTaxonomy => Boolean(t))
  .map(adminPortalFromTaxonomy);

/** Active admin portals only — sidebar / search / public consumers. */
export const ACTIVE_ADMIN_PORTALS: AdminPortal[] = ADMIN_PORTALS.filter((p) => p.active);

function portalMatchesSlug(portal: AdminPortal, slug: string): boolean {
  if (portal.dbSubjectSlugs.includes(slug)) return true;
  for (const prefix of portal.subjectPaperSlugPrefixes) {
    if (slug === prefix || slug.startsWith(`${prefix}-`)) return true;
  }
  return false;
}

/** Map: route segment → portal */
export const ROUTE_TO_PORTAL: Record<string, AdminPortal> = Object.fromEntries(
  ADMIN_PORTALS.map((p) => [p.routeSegment, p]),
);

/** Set of all subject portal route segments (for middleware checks) */
export const PORTAL_ROUTE_SEGMENTS: Set<string> = new Set(ADMIN_PORTALS.map((p) => p.routeSegment));

/** Shared admin routes that are NOT subject portals */
export const SHARED_ADMIN_ROUTES = new Set([
  'login',
  'forbidden',
  'resources',
  'categories',
  'blog',
  'subscribers',
  'bookings',
  'students',
  'super',
]);

/**
 * Given identifiers from managed_subjects resolution (parent subjects.slug
 * and/or subject_papers.slug strings), return portals the admin may access.
 */
export function getPortalsForSubjects(managedSubjectSlugs: string[]): AdminPortal[] {
  const seen = new Set<string>();
  const result: AdminPortal[] = [];

  for (const slug of managedSubjectSlugs) {
    if (!slug?.trim()) continue;
    for (const portal of ADMIN_PORTALS) {
      if (portalMatchesSlug(portal, slug) && !seen.has(portal.routeSegment)) {
        seen.add(portal.routeSegment);
        result.push(portal);
      }
    }
  }

  return result;
}

export function getAllowedRouteSegments(managedSubjectSlugs: string[]): Set<string> {
  return new Set(getPortalsForSubjects(managedSubjectSlugs).map((p) => p.routeSegment));
}

/** Resolve a subject_papers.slug or parent subjects.slug to an admin route segment. */
export function getRouteForSlug(slug: string): string | null {
  for (const portal of ADMIN_PORTALS) {
    if (portalMatchesSlug(portal, slug)) return portal.routeSegment;
  }
  return null;
}

/** Parent discipline slug for Supabase `subjects.slug` lookups (first configured slug). */
export function getPortalDbSubjectSlug(portal: AdminPortal): string {
  return portal.dbSubjectSlugs[0];
}

/** Every recognised discipline slug for a portal, primary first. */
export function getPortalDbSubjectSlugs(portal: AdminPortal): readonly string[] {
  return portal.dbSubjectSlugs;
}

// ── Public subject-list selectors (formerly in subjects.ts) ─────────────────

export interface SubjectEntry {
  id: string;          // The paper slug (used as the URL segment)
  name: string;
  code: string;
  iconKey: IconKey;
  colorScheme: ColorScheme;
  description: string;
  active: boolean;
}

function entryFromTaxonomy(
  tax: SubjectTaxonomy,
  variant: 'olevel' | 'alevel',
): SubjectEntry | null {
  if (variant === 'olevel') {
    return {
      id: tax.oLevelSlug,
      name: tax.name,
      code: tax.displayCode,
      iconKey: tax.iconKey,
      colorScheme: COLOR_SCHEMES[tax.colorKey],
      description: tax.description,
      active: tax.active,
    };
  }
  if (!tax.aLevelSlug || !tax.aLevelCode) return null;
  return {
    id: tax.aLevelSlug,
    name: tax.name,
    code: tax.aLevelCode,
    iconKey: tax.iconKey,
    // A-Level Mathematics historically used a gold scheme; preserve the swap.
    colorScheme: tax.oLevelSlug === 'mathematics-4024' ? COLOR_SCHEMES.gold : COLOR_SCHEMES[tax.colorKey],
    description: tax.description,
    active: tax.active,
  };
}

export const O_LEVEL_SUBJECTS: SubjectEntry[] = Object.values(SUBJECT_TAXONOMY)
  .map((t) => entryFromTaxonomy(t, 'olevel'))
  .filter((e): e is SubjectEntry => e !== null);

export const A_LEVEL_SUBJECTS: SubjectEntry[] = Object.values(SUBJECT_TAXONOMY)
  .map((t) => entryFromTaxonomy(t, 'alevel'))
  .filter((e): e is SubjectEntry => e !== null);

/**
 * Combined & deduplicated subject list for admin role assignment. Each
 * subject appears once (uses the O-Level paper id as canonical).
 */
export const ALL_SUBJECTS: { id: string; name: string; code: string }[] =
  Object.values(SUBJECT_TAXONOMY).map((t) => ({
    id: t.oLevelSlug,
    name: t.name,
    code: t.displayCode,
  }));
