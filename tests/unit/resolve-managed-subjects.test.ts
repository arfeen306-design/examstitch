import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * resolveManagedSubjectsToSlugs is the load-bearing function that turns
 * student_accounts.managed_subjects (UUIDs) into the slug array consumed by
 * middleware admin-portal isolation. Bugs here = "admin sees a portal they
 * shouldn't" or "admin can't see a portal they should".
 *
 * We mock createAdminClient so tests never hit the network.
 */

const fromMock = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}));

beforeEach(() => {
  fromMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Helper: make .from('subjects').select(...).in(...) return the supplied data.
 */
function mockSubjectsLookup(rows: { slug: string }[] | null, error: { message: string } | null = null) {
  fromMock.mockImplementation((table: string) => {
    if (table !== 'subjects') {
      throw new Error(`Unexpected table query: ${table}`);
    }
    return {
      select: () => ({
        in: () => Promise.resolve({ data: rows, error }),
      }),
    };
  });
}

describe('resolveManagedSubjectsToSlugs', () => {
  it('returns [] for an empty input', async () => {
    const { resolveManagedSubjectsToSlugs } = await import('@/lib/admin/resolve-managed-subjects');
    const result = await resolveManagedSubjectsToSlugs([]);
    expect(result).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('passes through entries that are not UUIDs without hitting the DB', async () => {
    const { resolveManagedSubjectsToSlugs } = await import('@/lib/admin/resolve-managed-subjects');
    const result = await resolveManagedSubjectsToSlugs(['maths', 'computer-science']);
    expect(result).toEqual(['maths', 'computer-science']);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('resolves UUIDs to slugs via subjects lookup', async () => {
    mockSubjectsLookup([{ slug: 'physics' }, { slug: 'chemistry' }]);
    const { resolveManagedSubjectsToSlugs } = await import('@/lib/admin/resolve-managed-subjects');
    const result = await resolveManagedSubjectsToSlugs([
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
    ]);
    expect(result.sort()).toEqual(['chemistry', 'physics']);
  });

  it('combines passthrough slugs with DB-resolved slugs', async () => {
    mockSubjectsLookup([{ slug: 'biology' }]);
    const { resolveManagedSubjectsToSlugs } = await import('@/lib/admin/resolve-managed-subjects');
    const result = await resolveManagedSubjectsToSlugs([
      'maths', // passthrough
      '33333333-3333-3333-3333-333333333333', // → biology
    ]);
    expect(result).toContain('maths');
    expect(result).toContain('biology');
    expect(result).toHaveLength(2);
  });

  it('on DB error, falls back to {passthrough + raw UUIDs} so the admin is not silently locked out', async () => {
    mockSubjectsLookup(null, { message: 'connection refused' });
    const { resolveManagedSubjectsToSlugs } = await import('@/lib/admin/resolve-managed-subjects');
    const result = await resolveManagedSubjectsToSlugs([
      'maths',
      '44444444-4444-4444-4444-444444444444',
    ]);
    // Falls back to original UUIDs so the caller still has *some* identifier
    // to evaluate against admin_portals.dbSubjectSlugs (which is conservative
    // — UUIDs won't match any portal, so the admin lands on the safe default
    // rather than being granted broader access).
    expect(result).toEqual(['maths', '44444444-4444-4444-4444-444444444444']);
  });

  it('drops null/empty slug rows from the DB response', async () => {
    mockSubjectsLookup([{ slug: 'physics' }, { slug: '' }] as { slug: string }[]);
    const { resolveManagedSubjectsToSlugs } = await import('@/lib/admin/resolve-managed-subjects');
    const result = await resolveManagedSubjectsToSlugs([
      '55555555-5555-5555-5555-555555555555',
      '66666666-6666-6666-6666-666666666666',
    ]);
    expect(result).toEqual(['physics']);
  });

  it('rejects malformed UUIDs as passthrough strings (does not query DB)', async () => {
    const { resolveManagedSubjectsToSlugs } = await import('@/lib/admin/resolve-managed-subjects');
    const result = await resolveManagedSubjectsToSlugs([
      'not-a-uuid',
      '12345678', // too short
    ]);
    expect(result).toEqual(['not-a-uuid', '12345678']);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('does NOT hallucinate permissions: an admin with no subjects gets [] regardless of DB state', async () => {
    // Even if the DB had random rows, an empty input must produce empty output.
    mockSubjectsLookup([{ slug: 'physics' }]);
    const { resolveManagedSubjectsToSlugs } = await import('@/lib/admin/resolve-managed-subjects');
    const result = await resolveManagedSubjectsToSlugs([]);
    expect(result).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('Phase 2.1: resolves UUIDs known to taxonomy WITHOUT hitting the DB', async () => {
    // Mathematics UUID was wired into SUBJECT_TAXONOMY in Phase 2.1.
    const { resolveManagedSubjectsToSlugs } = await import('@/lib/admin/resolve-managed-subjects');
    const mathUuid = '15a91306-cc84-456c-aeef-e04c610b9ec7';
    const result = await resolveManagedSubjectsToSlugs([mathUuid]);
    expect(result).toEqual(['maths']);
    // Critically: zero DB round-trips when every UUID is taxonomy-known.
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('mixes taxonomy hits and DB fallback when only some UUIDs are known', async () => {
    mockSubjectsLookup([{ slug: 'unknown-subject' }]);
    const { resolveManagedSubjectsToSlugs } = await import('@/lib/admin/resolve-managed-subjects');
    const knownUuid = '15a91306-cc84-456c-aeef-e04c610b9ec7'; // mathematics
    const unknownUuid = '99999999-9999-9999-9999-999999999999';
    const result = await resolveManagedSubjectsToSlugs([knownUuid, unknownUuid]);
    expect(result).toContain('maths');
    expect(result).toContain('unknown-subject');
    // DB only consulted for the unresolved UUID, not the taxonomy-known one.
    expect(fromMock).toHaveBeenCalledTimes(1);
  });
});
