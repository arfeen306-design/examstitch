/**
 * portal-resolver.ts — Resolve an admin portal to its `public.subjects` row.
 *
 * Phase 2.1 (Maths/Math alignment): a single portal can map to multiple
 * legacy DB slugs ('maths' / 'math' / 'mathematics'). The dashboard, the
 * categories page, the bulk-upload page, the analytics page, and the
 * provisioner all need to find "the discipline row for this portal" — and
 * each used to call `.eq('slug', getPortalDbSubjectSlug(portal))`, which only
 * checked the primary slug. If a production row ever drifted to a secondary
 * form (because some out-of-band SQL fix called the row 'math' instead of
 * 'maths'), every one of those queries silently returned 0 results.
 *
 * This helper does the right thing: tries every recognised slug in priority
 * order, returns the first match. Use it everywhere a portal needs to be
 * resolved to a subject row.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminPortal } from '@/config/taxonomy';
import {
  getPortalDbSubjectSlugs,
  getTaxonomyBySlug,
} from '@/config/taxonomy';

export interface DisciplineSubjectRow {
  id: string;
  name: string;
  slug: string;
  levels?: string[] | null;
}

/**
 * Resolve a portal to its `public.subjects` row. Returns the first match
 * found by walking dbSubjectSlugs in configured order (primary first), or
 * null if no row exists for any recognised slug.
 *
 * @param supabase Service-role client (bypasses RLS).
 */
export async function resolveDisciplineSubjectForPortal(
  supabase: SupabaseClient,
  portal: AdminPortal,
): Promise<DisciplineSubjectRow | null> {
  // Phase 2.1 Task 2: prefer the taxonomy-configured `subjectId` when set —
  // a UUID is unambiguous regardless of which slug the production row uses.
  // Fall back to slug-based lookup so unfilled entries still work.
  const tax = getTaxonomyBySlug(portal.taxonomyOLevelPaperSlug);
  if (tax?.subjectId) {
    const { data: row } = await supabase
      .from('subjects')
      .select('id, name, slug, levels')
      .eq('id', tax.subjectId)
      .maybeSingle();
    if (row) {
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        levels: (row.levels as string[] | null | undefined) ?? null,
      };
    }
    // Configured subjectId was wrong / row deleted — fall through to slug lookup.
  }

  const recognisedSlugs = getPortalDbSubjectSlugs(portal);
  if (recognisedSlugs.length === 0) return null;

  const { data: candidates, error } = await supabase
    .from('subjects')
    .select('id, name, slug, levels')
    .in('slug', recognisedSlugs as string[]);

  if (error || !candidates || candidates.length === 0) return null;

  // Walk the configured slugs in priority order so the canonical primary
  // ('maths') wins over a stray legacy form ('math') when both exist.
  for (const slug of recognisedSlugs) {
    const hit = candidates.find((c) => c.slug === slug);
    if (hit) {
      return {
        id: hit.id,
        name: hit.name,
        slug: hit.slug,
        levels: (hit.levels as string[] | null | undefined) ?? null,
      };
    }
  }
  return null;
}

/** Just the discipline `subjects.id`. */
export async function resolveDisciplineSubjectIdForPortal(
  supabase: SupabaseClient,
  portal: AdminPortal,
): Promise<string | null> {
  const row = await resolveDisciplineSubjectForPortal(supabase, portal);
  return row?.id ?? null;
}
