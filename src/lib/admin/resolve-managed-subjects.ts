import { createAdminClient } from '@/lib/supabase/admin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * student_accounts.managed_subjects stores subject UUIDs.
 * Portal routing expects public.subjects.slug values (and/or subject_paper slugs).
 */
export async function resolveManagedSubjectsToSlugs(raw: string[]): Promise<string[]> {
  if (!raw.length) return [];

  const uuids = raw.filter((s) => UUID_RE.test(s));
  const passthrough = raw.filter((s) => !UUID_RE.test(s));

  if (uuids.length === 0) return raw;

  const admin = createAdminClient();
  const { data, error } = await admin.from('subjects').select('slug').in('id', uuids);

  if (error) {
    console.error('[resolveManagedSubjectsToSlugs]', error.message);
    return [...passthrough, ...uuids];
  }

  const fromDb = (data ?? []).map((r) => r.slug).filter(Boolean) as string[];
  return [...passthrough, ...fromDb];
}
