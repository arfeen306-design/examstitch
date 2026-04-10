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

const POLICY_PREFIX = 'Category policy: ';

/**
 * Returns an error message if the slug is not allowed, otherwise null.
 * Messages begin with "Category policy:" for screen-reader and toast clarity.
 */
export function validateCategorySlugAgainstNavigation(input: ValidateCategorySlugInput): string | null {
  const { normalizedSlug, parentSubjectSlug, parentCategorySlug } = input;

  if (!parentCategorySlug) {
    if (O_LEVEL_ROUTE_SLUGS.has(normalizedSlug)) return null;
    if (A_LEVEL_SECTION_SLUGS.has(normalizedSlug)) {
      const navKey = PARENT_SUBJECT_SLUG_TO_ALEVEL_NAV_KEY[parentSubjectSlug];
      if (!navKey) {
        return `${POLICY_PREFIX}Section categories as-level and a2-level are not configured for subject "${parentSubjectSlug}".`;
      }
      return null;
    }
    return (
      `${POLICY_PREFIX}The slug "${normalizedSlug}" is not allowed for a top-level category. ` +
      `Use one of: ${[...O_LEVEL_ROUTE_SLUGS].join(', ')}` +
      (PARENT_SUBJECT_SLUG_TO_ALEVEL_NAV_KEY[parentSubjectSlug]
        ? ', or as-level / a2-level for A-Level.'
        : '. Custom slugs such as math-101 are rejected so public URLs stay in sync.')
    );
  }

  if (!A_LEVEL_SECTION_SLUGS.has(parentCategorySlug)) {
    return (
      `${POLICY_PREFIX}` +
      'Nested categories are only allowed under as-level or a2-level. ' +
      'O-Level uses flat grade categories (grade-9, grade-10, grade-11).'
    );
  }

  const navKey = PARENT_SUBJECT_SLUG_TO_ALEVEL_NAV_KEY[parentSubjectSlug];
  if (!navKey) {
    return `${POLICY_PREFIX}A-Level paper categories are not configured for subject "${parentSubjectSlug}".`;
  }

  const sectionKey = parentCategorySlug === 'as-level' ? 'as-level' : 'a2-level';
  const allowed = papersForSection(navKey, sectionKey).map((p) => p.slug);
  if (allowed.includes(normalizedSlug)) return null;

  return (
    `${POLICY_PREFIX}The paper slug "${normalizedSlug}" is not valid under ${parentCategorySlug}. ` +
    `Allowed slugs are: ${allowed.join(', ')}. These must match the public course routes.`
  );
}
