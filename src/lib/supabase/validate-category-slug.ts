/**
 * Category Slug Validation
 *
 * Prevents the "invisible content" bug where categories are created
 * with slugs that don't match frontend routing conventions.
 *
 * Rules enforced:
 *   O-Level:  slug must be grade-9, grade-10, or grade-11
 *   A-Level:  slug must be paper-N-descriptive-name (no subject prefix)
 *   Section:  slug must be as-level or a2-level (A-Level section parents)
 *
 * See docs/CATEGORY_SLUG_CONVENTION.md for the full specification.
 */

const OLEVEL_SLUG_RE = /^grade-(9|10|11)$/;
const ALEVEL_PAPER_SLUG_RE = /^paper-\d+-[a-z0-9]+(-[a-z0-9]+)*$/;
const ALEVEL_SECTION_SLUG_RE = /^(as-level|a2-level)$/;

// Subject prefixes that must never appear in category slugs
const SUBJECT_PREFIXES = [
  'cs-', 'maths-', 'math-', 'physics-', 'phys-', 'chemistry-', 'chem-',
  'biology-', 'bio-', 'english-', 'urdu-', 'pakistan-',
];

export type SlugLevel = 'olevel' | 'alevel';

export interface SlugValidationResult {
  valid: boolean;
  error?: string;
  expected?: string;
}

/**
 * Validates a category slug against the routing conventions.
 *
 * @param slug   The slug to validate
 * @param level  Whether this is an O-Level or A-Level category
 * @param type   'grade' for O-Level grades, 'paper' for A-Level papers,
 *               'section' for A-Level section parents (as-level / a2-level).
 *               Defaults to 'grade' for olevel and 'paper' for alevel.
 */
export function validateCategorySlug(
  slug: string,
  level: SlugLevel,
  type?: 'grade' | 'paper' | 'section',
): SlugValidationResult {
  // Basic format checks
  if (!slug || slug.trim() !== slug) {
    return { valid: false, error: 'Slug must not be empty or have leading/trailing spaces.' };
  }

  if (/[A-Z]/.test(slug)) {
    return { valid: false, error: 'Slug must be lowercase. Got uppercase characters.' };
  }

  if (/\s/.test(slug)) {
    return { valid: false, error: 'Slug must not contain spaces. Use hyphens instead.' };
  }

  // Check for subject prefixes
  const badPrefix = SUBJECT_PREFIXES.find(p => slug.startsWith(p));
  if (badPrefix) {
    return {
      valid: false,
      error: `Slug must not start with a subject prefix ("${badPrefix}"). Category slugs are shared across the routing layer and must not be subject-scoped.`,
      expected: level === 'olevel' ? 'grade-9, grade-10, or grade-11' : 'paper-1-name-here',
    };
  }

  // Level-specific validation
  if (level === 'olevel') {
    if (!OLEVEL_SLUG_RE.test(slug)) {
      return {
        valid: false,
        error: `Invalid O-Level slug "${slug}". O-Level categories must be grade-9, grade-10, or grade-11.`,
        expected: 'grade-9, grade-10, or grade-11',
      };
    }
    return { valid: true };
  }

  // A-Level: determine if this is a section parent or a paper
  const effectiveType = type ?? 'paper';

  if (effectiveType === 'section') {
    if (!ALEVEL_SECTION_SLUG_RE.test(slug)) {
      return {
        valid: false,
        error: `Invalid A-Level section slug "${slug}". Must be "as-level" or "a2-level".`,
        expected: 'as-level or a2-level',
      };
    }
    return { valid: true };
  }

  // Paper slug
  if (!ALEVEL_PAPER_SLUG_RE.test(slug)) {
    return {
      valid: false,
      error: `Invalid A-Level paper slug "${slug}". Must match pattern paper-N-descriptive-name (e.g. paper-1-theory-fundamentals).`,
      expected: 'paper-1-descriptive-name',
    };
  }

  return { valid: true };
}
