/**
 * taxonomy.ts — Universal Subject Taxonomy
 *
 * Single source of truth for every subject's hierarchical structure:
 *   Level → Section → Paper → Category (DB)
 *
 * Used by:
 *   - HierarchyPicker component (admin resource upload modals)
 *   - Server-side validation (guards.ts, actions.ts)
 *   - Analytics queries (filtering by level/paper)
 *
 * Rules:
 *   1. O-Level subjects use Grade 9 / 10 / 11 as levels.
 *   2. A-Level subjects use AS / A2 as sections, each with specific papers.
 *   3. module_type is always 'video_topical' or 'solved_past_paper'.
 */

// ── Module Types (universal across all subjects) ────────────────────────────

import { MODULE_TYPES as MT } from '@/lib/constants';

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

// ── Paper Definition ────────────────────────────────────────────────────────

export interface PaperDef {
  value: string;        // slug used for category matching: 'paper-1', 'paper-2', etc.
  label: string;        // display name: 'Paper 1 — Pure Mathematics'
  description?: string; // optional tooltip
}

// ── Subject Taxonomy Entry ──────────────────────────────────────────────────

export interface SubjectTaxonomy {
  /** Subject display name */
  name: string;
  /** Cambridge subject code for the O-Level variant */
  oLevelCode: string;
  /** Cambridge subject code for the A-Level variant (null if A-Level doesn't exist) */
  aLevelCode: string | null;
  /** Slug used to look up the subject in the DB — matches subjects.slug */
  oLevelSlug: string;
  /** A-Level slug (null if no A-Level variant) */
  aLevelSlug: string | null;
  /** A-Level papers keyed by section. Null if no A-Level variant. */
  aLevelPapers: Record<ALevelSection, PaperDef[]> | null;
  /** Accent color for admin UI */
  accentColor: string;
}

// ── The Dictionary ──────────────────────────────────────────────────────────

export const SUBJECT_TAXONOMY: Record<string, SubjectTaxonomy> = {
  'mathematics': {
    name: 'Mathematics',
    oLevelCode: '4024',
    aLevelCode: '9709',
    oLevelSlug: 'mathematics-4024',
    aLevelSlug: 'mathematics-9709',
    accentColor: '#3B82F6',
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
    oLevelCode: '0478',
    aLevelCode: '9618',
    oLevelSlug: 'computer-science-0478',
    aLevelSlug: 'computer-science-9618',
    accentColor: '#6366F1',
    aLevelPapers: {
      as: [
        { value: 'paper-1', label: 'Paper 1 — Theory Fundamentals', description: 'Data representation, communication, hardware, logic, software, security' },
        { value: 'paper-2', label: 'Paper 2 — Problem-solving & Programming', description: 'Algorithm design, pseudocode, programming concepts, databases' },
      ],
      a2: [
        { value: 'paper-3', label: 'Paper 3 — Advanced Theory', description: 'Computational thinking, processors, networks, databases, Big-O' },
        { value: 'paper-4', label: 'Paper 4 — Practical', description: 'Programming project and practical problem-solving' },
      ],
    },
  },

  'physics': {
    name: 'Physics',
    oLevelCode: '5054',
    aLevelCode: '9702',
    oLevelSlug: 'physics-5054',
    aLevelSlug: 'physics-9702',
    accentColor: '#F59E0B',
    aLevelPapers: {
      as: [
        { value: 'paper-1', label: 'Paper 1 — Multiple Choice', description: 'AS-level multiple choice covering all AS topics' },
        { value: 'paper-2', label: 'Paper 2 — AS Structured Questions', description: 'Short and structured questions on AS physics' },
      ],
      a2: [
        { value: 'paper-3', label: 'Paper 3 — Advanced Practical Skills', description: 'Planning, analysis and evaluation of experiments' },
        { value: 'paper-4', label: 'Paper 4 — A2 Structured Questions', description: 'Structured questions on A2 physics topics' },
        { value: 'paper-5', label: 'Paper 5 — Planning, Analysis & Evaluation', description: 'Practical planning and data analysis' },
      ],
    },
  },

  'chemistry': {
    name: 'Chemistry',
    oLevelCode: '5070',
    aLevelCode: '9701',
    oLevelSlug: 'chemistry-5070',
    aLevelSlug: 'chemistry-9701',
    accentColor: '#F43F5E',
    aLevelPapers: {
      as: [
        { value: 'paper-1', label: 'Paper 1 — Multiple Choice', description: 'AS-level multiple choice covering all AS topics' },
        { value: 'paper-2', label: 'Paper 2 — AS Structured Questions', description: 'Short and structured questions on AS chemistry' },
      ],
      a2: [
        { value: 'paper-3', label: 'Paper 3 — Advanced Practical Skills', description: 'Planning, analysis and evaluation of experiments' },
        { value: 'paper-4', label: 'Paper 4 — A2 Structured Questions', description: 'Structured questions on A2 chemistry topics' },
        { value: 'paper-5', label: 'Paper 5 — Planning, Analysis & Evaluation', description: 'Practical planning and data analysis' },
      ],
    },
  },

  'biology': {
    name: 'Biology',
    oLevelCode: '5090',
    aLevelCode: '9700',
    oLevelSlug: 'biology-5090',
    aLevelSlug: 'biology-9700',
    accentColor: '#84CC16',
    aLevelPapers: {
      as: [
        { value: 'paper-1', label: 'Paper 1 — Multiple Choice', description: 'AS-level multiple choice covering all AS topics' },
        { value: 'paper-2', label: 'Paper 2 — AS Structured Questions', description: 'Short and structured questions on AS biology' },
      ],
      a2: [
        { value: 'paper-3', label: 'Paper 3 — Advanced Practical Skills', description: 'Planning, analysis and evaluation of experiments' },
        { value: 'paper-4', label: 'Paper 4 — A2 Structured Questions', description: 'Structured questions on A2 biology topics' },
        { value: 'paper-5', label: 'Paper 5 — Planning, Analysis & Evaluation', description: 'Practical planning and data analysis' },
      ],
    },
  },

  'english': {
    name: 'English Language',
    oLevelCode: '1123',
    aLevelCode: null,
    oLevelSlug: 'english-1123',
    aLevelSlug: null,
    accentColor: '#8B5CF6',
    aLevelPapers: null,
  },

  'urdu': {
    name: 'Urdu',
    oLevelCode: '3248',
    aLevelCode: null,
    oLevelSlug: 'urdu-3248',
    aLevelSlug: null,
    accentColor: '#06B6D4',
    aLevelPapers: null,
  },

  'pakistan-studies': {
    name: 'Pakistan Studies',
    oLevelCode: '2059',
    aLevelCode: null,
    oLevelSlug: 'pakistan-studies-2059',
    aLevelSlug: null,
    accentColor: '#EAB308',
    aLevelPapers: null,
  },
};

// ── Lookup helpers ──────────────────────────────────────────────────────────

/** Resolve taxonomy entry from a subject slug (e.g. 'computer-science-0478' → CS entry) */
export function getTaxonomyBySlug(slug: string): SubjectTaxonomy | null {
  for (const tax of Object.values(SUBJECT_TAXONOMY)) {
    if (tax.oLevelSlug === slug || tax.aLevelSlug === slug) return tax;
  }
  return null;
}

/** Resolve taxonomy entry from a base key (e.g. 'physics') */
export function getTaxonomyByKey(key: string): SubjectTaxonomy | null {
  return SUBJECT_TAXONOMY[key] ?? null;
}

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
 * Determine which subject taxonomy key a subject_id/slug maps to.
 * Returns the base key (e.g. 'physics') or null.
 */
export function getSubjectKey(slugOrId: string): string | null {
  for (const [key, tax] of Object.entries(SUBJECT_TAXONOMY)) {
    if (tax.oLevelSlug === slugOrId || tax.aLevelSlug === slugOrId) return key;
  }
  // Fallback: check if the input is a base key itself
  if (SUBJECT_TAXONOMY[slugOrId]) return slugOrId;
  return null;
}
