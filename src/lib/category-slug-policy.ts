/**
 * Category slug policy — aligns CMS category slugs with public routing (navigation.ts).
 * Used by server actions when creating categories.
 */

import {
  oLevelGrades,
  aLevelPapersBySubject,
  type PaperConfig,
} from '@/config/navigation';

/** O-Level grade slugs used in /olevel/[subject]/[grade]/... */
export const O_LEVEL_ROUTE_SLUGS = new Set(oLevelGrades.map((g) => g.slug));

/** A-Level section parent slugs (top-level categories under a discipline). */
export const A_LEVEL_SECTION_SLUGS = new Set(['as-level', 'a2-level']);

/** Maps public.subjects.slug (parent discipline) → aLevelPapersBySubject key. */
export const PARENT_SUBJECT_SLUG_TO_ALEVEL_NAV_KEY: Record<string, string> = {
  maths: 'mathematics-9709',
  'computer-science': 'computer-science-9618',
  physics: 'physics-9702',
  chemistry: 'chemistry-9701',
  biology: 'biology-9700',
};

function papersForSection(navKey: string, sectionSlug: 'as-level' | 'a2-level'): PaperConfig[] {
  const entry = aLevelPapersBySubject[navKey];
  if (!entry) return [];
  return entry[sectionSlug];
}

export interface ValidateCategorySlugInput {
  /** Normalized slug (lowercase, hyphenated). */
  normalizedSlug: string;
  /** public.subjects.slug for the category's subject_id (e.g. maths, computer-science). */
  parentSubjectSlug: string;
  /** Parent category slug when parent_id is set; null for top-level. */
  parentCategorySlug: string | null;
}

/**
 * Returns an error message if the slug is not allowed, otherwise null.
 */
export function validateCategorySlugAgainstNavigation(input: ValidateCategorySlugInput): string | null {
  const { normalizedSlug, parentSubjectSlug, parentCategorySlug } = input;

  if (!parentCategorySlug) {
    if (O_LEVEL_ROUTE_SLUGS.has(normalizedSlug)) return null;
    if (A_LEVEL_SECTION_SLUGS.has(normalizedSlug)) {
      const navKey = PARENT_SUBJECT_SLUG_TO_ALEVEL_NAV_KEY[parentSubjectSlug];
      if (!navKey) {
        return `Section categories (as-level / a2-level) are not configured for subject "${parentSubjectSlug}".`;
      }
      return null;
    }
    return (
      `Invalid top-level slug "${normalizedSlug}". Use one of: ${[...O_LEVEL_ROUTE_SLUGS].join(', ')}` +
      (PARENT_SUBJECT_SLUG_TO_ALEVEL_NAV_KEY[parentSubjectSlug]
        ? ', or as-level / a2-level for A-Level.'
        : '.')
    );
  }

  if (!A_LEVEL_SECTION_SLUGS.has(parentCategorySlug)) {
    return (
      'Nested categories are only allowed under as-level or a2-level. ' +
      'O-Level uses flat grade categories (grade-9, grade-10, grade-11).'
    );
  }

  const navKey = PARENT_SUBJECT_SLUG_TO_ALEVEL_NAV_KEY[parentSubjectSlug];
  if (!navKey) {
    return `A-Level paper categories are not configured for subject "${parentSubjectSlug}".`;
  }

  const sectionKey = parentCategorySlug === 'as-level' ? 'as-level' : 'a2-level';
  const allowed = papersForSection(navKey, sectionKey).map((p) => p.slug);
  if (allowed.includes(normalizedSlug)) return null;

  return (
    `Invalid paper slug "${normalizedSlug}" for ${parentCategorySlug}. ` +
    `Must be one of: ${allowed.join(', ')} (see navigation / public routes).`
  );
}
