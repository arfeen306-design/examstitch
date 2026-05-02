import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for the Maths/Math/Mathematics slug-aliasing path inside
 * getCategoriesBySubjectSlug. The aliasing lives in queries.ts as
 * SUBJECT_SLUG_ALIASES + normalizeSubjectPaperSlug. A regression here would
 * break SEO links because /olevel/maths is the public URL but the DB stores
 * the slug as 'mathematics-4024'.
 *
 * We mock:
 *   - next/cache → unstable_cache becomes a passthrough so the function runs
 *     in-process without Next.js runtime context.
 *   - createAnonClient → records every .eq() arg so the test can assert the
 *     final slug that hits the database.
 */

// Track what slug the production code asks the DB for. The actual record is
// the second arg to .eq('slug', X) inside resolveSubjectId.
const slugCalls: string[] = [];

vi.mock('next/cache', () => ({
  // Run the inner factory immediately and synchronously — no real cache.
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}));

vi.mock('@/lib/supabase/anon', () => ({
  createAnonClient: () => {
    const subjectPapersHandler = {
      select: () => ({
        eq: (_col: string, slug: string) => {
          slugCalls.push(slug);
          return {
            single: () =>
              Promise.resolve({
                data: { parent_subject_id: 'fake-parent-uuid' },
                error: null,
              }),
          };
        },
      }),
    };
    const categoriesHandler = {
      select: () => ({
        eq: () => ({
          is: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  { id: 'c1', slug: 'grade-9', name: 'Grade 9', subject_id: 'fake-parent-uuid' },
                ],
                error: null,
              }),
          }),
          single: () =>
            Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            }),
        }),
      }),
    };
    return {
      from: (table: string) => {
        if (table === 'subject_papers') return subjectPapersHandler;
        if (table === 'categories') return categoriesHandler;
        throw new Error(`Unexpected table query: ${table}`);
      },
    };
  },
}));

beforeEach(() => {
  slugCalls.length = 0;
});

describe('getCategoriesBySubjectSlug — Maths/Math alias normalization', () => {
  it('rewrites "maths" to "mathematics-4024" before querying subject_papers', async () => {
    const { getCategoriesBySubjectSlug } = await import('@/lib/supabase/queries');
    const cats = await getCategoriesBySubjectSlug('maths');
    expect(slugCalls).toContain('mathematics-4024');
    expect(slugCalls).not.toContain('maths');
    expect(cats).toHaveLength(1);
  });

  it('rewrites "math" to "mathematics-4024"', async () => {
    const { getCategoriesBySubjectSlug } = await import('@/lib/supabase/queries');
    await getCategoriesBySubjectSlug('math');
    expect(slugCalls).toContain('mathematics-4024');
  });

  it('rewrites "mathematics" to "mathematics-4024"', async () => {
    const { getCategoriesBySubjectSlug } = await import('@/lib/supabase/queries');
    await getCategoriesBySubjectSlug('mathematics');
    expect(slugCalls).toContain('mathematics-4024');
  });

  it('rewrites "cs" and "computer-science" to "computer-science-0478"', async () => {
    const { getCategoriesBySubjectSlug } = await import('@/lib/supabase/queries');
    await getCategoriesBySubjectSlug('cs');
    expect(slugCalls).toContain('computer-science-0478');

    slugCalls.length = 0;
    await getCategoriesBySubjectSlug('computer-science');
    expect(slugCalls).toContain('computer-science-0478');
  });

  it('passes through fully-qualified paper slugs untouched', async () => {
    const { getCategoriesBySubjectSlug } = await import('@/lib/supabase/queries');
    await getCategoriesBySubjectSlug('physics-5054');
    expect(slugCalls).toContain('physics-5054');
  });

  it('uppercase or whitespace input still aliases correctly', async () => {
    const { getCategoriesBySubjectSlug } = await import('@/lib/supabase/queries');
    await getCategoriesBySubjectSlug('  Maths  ');
    expect(slugCalls).toContain('mathematics-4024');
  });

  it('unknown slug passes through (and yields whatever the DB has)', async () => {
    const { getCategoriesBySubjectSlug } = await import('@/lib/supabase/queries');
    await getCategoriesBySubjectSlug('not-a-real-subject');
    expect(slugCalls).toContain('not-a-real-subject');
  });
});

describe('Taxonomy admin-portal mapping (regression: Maths vs Math)', () => {
  it('SUBJECT_TAXONOMY mathematics entry has the maths→math admin route alias', async () => {
    const { SUBJECT_TAXONOMY } = await import('@/config/taxonomy');
    const math = SUBJECT_TAXONOMY['mathematics'];
    expect(math).toBeDefined();
    expect(math.adminPortal.routeSegment).toBe('math');
    // The DB column 'subjects.slug' stores 'maths' (legacy); the URL uses 'math'.
    // Both must be in dbSubjectSlugs / subjectPaperSlugPrefixes so middleware
    // resolves the portal correctly under either form.
    expect(math.adminPortal.dbSubjectSlugs).toContain('maths');
    expect(math.adminPortal.subjectPaperSlugPrefixes).toContain('mathematics');
  });

  it('ADMIN_PORTALS keeps the math portal even after the taxonomy refactor', async () => {
    const { ADMIN_PORTALS } = await import('@/config/taxonomy');
    const portal = ADMIN_PORTALS.find((p) => p.routeSegment === 'math');
    expect(portal).toBeDefined();
    expect(portal!.dbSubjectSlugs).toContain('maths');
  });

  it('getRouteForSlug resolves "maths", "mathematics-4024", "mathematics-9709" all to "math"', async () => {
    const { getRouteForSlug } = await import('@/config/taxonomy');
    expect(getRouteForSlug('maths')).toBe('math');
    expect(getRouteForSlug('mathematics-4024')).toBe('math');
    expect(getRouteForSlug('mathematics-9709')).toBe('math');
  });
});
