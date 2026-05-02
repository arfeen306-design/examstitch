import { createAdminClient } from '@/lib/supabase/admin';
import { SUBJECT_TAXONOMY } from '@/config/taxonomy';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * student_accounts.managed_subjects stores subject UUIDs.
 * Portal routing expects public.subjects.slug values (and/or subject_paper slugs).
 *
 * Phase 2.1 perf: now that SUBJECT_TAXONOMY[*].subjectId is populated with
 * production UUIDs, the common case (every admin's managed_subjects matches a
 * configured taxonomy entry) resolves entirely in-process — no DB round-trip.
 * Only unknown UUIDs fall through to the DB lookup.
 *
 * On the layout hot path (every admin page render) this drops one round-trip
 * per request.
 */
export async function resolveManagedSubjectsToSlugs(raw: string[]): Promise<string[]> {
  if (!raw.length) return [];

  const uuids = raw.filter((s) => UUID_RE.test(s));
  const passthrough = raw.filter((s) => !UUID_RE.test(s));

  if (uuids.length === 0) return raw;

  // ── Local pass: resolve any UUIDs we already know about from taxonomy. ──
  const taxonomyByUuid = new Map<string, string[]>();
  for (const tax of Object.values(SUBJECT_TAXONOMY)) {
    if (tax.subjectId) {
      taxonomyByUuid.set(tax.subjectId, tax.adminPortal.dbSubjectSlugs.slice());
    }
  }

  const resolvedFromTaxonomy: string[] = [];
  const unresolvedUuids: string[] = [];
  for (const uuid of uuids) {
    const slugs = taxonomyByUuid.get(uuid);
    if (slugs && slugs.length) {
      // Use the canonical primary slug (dbSubjectSlugs[0]); the portal helpers
      // already accept any of the recognised aliases.
      resolvedFromTaxonomy.push(slugs[0]);
    } else {
      unresolvedUuids.push(uuid);
    }
  }

  if (unresolvedUuids.length === 0) {
    return [...passthrough, ...resolvedFromTaxonomy];
  }

  // ── DB fallback for UUIDs not in taxonomy (custom subjects, future entries) ──
  const admin = createAdminClient();
  const { data, error } = await admin.from('subjects').select('slug').in('id', unresolvedUuids);

  if (error) {
    console.error('[resolveManagedSubjectsToSlugs]', error.message);
    return [...passthrough, ...resolvedFromTaxonomy, ...unresolvedUuids];
  }

  const fromDb = (data ?? []).map((r) => r.slug).filter(Boolean) as string[];
  return [...passthrough, ...resolvedFromTaxonomy, ...fromDb];
}
