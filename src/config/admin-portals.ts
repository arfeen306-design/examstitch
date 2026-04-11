/**
 * admin-portals.ts — Single source of truth for admin portal routing.
 *
 * Used by:
 *   - src/middleware.ts (subject isolation)
 *   - src/app/api/admin/login/route.ts (redirect + admin_subjects cookie)
 *   - src/app/admin/(dashboard)/layout.tsx (sidebar "My Subjects" links)
 *   - src/components/admin/SubjectSwitcher.tsx (panel switcher dropdown)
 *
 * public.subjects.slug values come from supabase/migrations/012_multi_subject.sql
 * (e.g. maths, computer-science — not "mathematics"). subject_papers.slug values are
 * full syllabus slugs (e.g. mathematics-4024, mathematics-9709). Matching uses
 * dbSubjectSlugs + subjectPaperSlugPrefixes so both layers resolve to the same portal.
 */

export interface AdminPortal {
  /** URL segment under /admin/ — e.g. 'cs' → /admin/cs */
  routeSegment: string;
  /** Display label in sidebar and switcher */
  label: string;
  /** Tailwind gradient classes for the switcher icon badge */
  gradient: string;
  /** Accent color hex for the portal theme */
  accentColor: string;
  /**
   * Exact public.subjects.slug values (parent discipline rows).
   * Must match Supabase `subjects.slug` after migration 012.
   */
  dbSubjectSlugs: string[];
  /**
   * Prefixes for subject_papers.slug — e.g. "mathematics" matches
   * mathematics-4024 and mathematics-9709.
   */
  subjectPaperSlugPrefixes: string[];
  /**
   * subject_papers.slug for the O-Level row — matches SUBJECT_TAXONOMY / HierarchyPicker.
   */
  taxonomyOLevelPaperSlug: string;
  /**
   * Cambridge offers an A-Level syllabus for this discipline (AS/A2 papers exist).
   * When false, provisioning creates only O-Level/IGCSE syllabi + grade folders (e.g. Pakistan Studies 2059).
   */
  hasALevelSyllabus?: boolean;
}

/**
 * Every subject that has (or will have) its own /admin/<segment> portal.
 * Order determines display order in the switcher.
 */
export const ADMIN_PORTALS: AdminPortal[] = [
  {
    routeSegment: 'cs',
    label: 'CS Resources',
    gradient: 'from-emerald-500 to-teal-600',
    accentColor: '#6366F1',
    dbSubjectSlugs: ['computer-science'],
    subjectPaperSlugPrefixes: ['computer-science'],
    taxonomyOLevelPaperSlug: 'computer-science-0478',
  },
  {
    routeSegment: 'math',
    label: 'Math Resources',
    gradient: 'from-blue-500 to-indigo-600',
    accentColor: '#3B82F6',
    dbSubjectSlugs: ['maths'],
    subjectPaperSlugPrefixes: ['mathematics'],
    taxonomyOLevelPaperSlug: 'mathematics-4024',
  },
  {
    routeSegment: 'physics',
    label: 'Physics Resources',
    gradient: 'from-amber-500 to-orange-600',
    accentColor: '#F59E0B',
    dbSubjectSlugs: ['physics'],
    subjectPaperSlugPrefixes: ['physics'],
    taxonomyOLevelPaperSlug: 'physics-5054',
  },
  {
    routeSegment: 'chemistry',
    label: 'Chemistry Resources',
    gradient: 'from-rose-500 to-pink-600',
    accentColor: '#F43F5E',
    dbSubjectSlugs: ['chemistry'],
    subjectPaperSlugPrefixes: ['chemistry'],
    taxonomyOLevelPaperSlug: 'chemistry-5070',
  },
  {
    routeSegment: 'biology',
    label: 'Biology Resources',
    gradient: 'from-lime-500 to-green-600',
    accentColor: '#84CC16',
    dbSubjectSlugs: ['biology'],
    subjectPaperSlugPrefixes: ['biology'],
    taxonomyOLevelPaperSlug: 'biology-5090',
  },
  {
    routeSegment: 'english',
    label: 'English Resources',
    gradient: 'from-violet-500 to-purple-600',
    accentColor: '#8B5CF6',
    dbSubjectSlugs: ['english'],
    subjectPaperSlugPrefixes: ['english'],
    taxonomyOLevelPaperSlug: 'english-1123',
    hasALevelSyllabus: false,
  },
  {
    routeSegment: 'urdu',
    label: 'Urdu Resources',
    gradient: 'from-cyan-500 to-sky-600',
    accentColor: '#06B6D4',
    dbSubjectSlugs: ['urdu'],
    subjectPaperSlugPrefixes: ['urdu'],
    taxonomyOLevelPaperSlug: 'urdu-3248',
    hasALevelSyllabus: false,
  },
  {
    routeSegment: 'pakistan-studies',
    label: 'Pak Studies Resources',
    gradient: 'from-yellow-500 to-amber-600',
    accentColor: '#EAB308',
    dbSubjectSlugs: ['pakistan-studies'],
    subjectPaperSlugPrefixes: ['pakistan-studies'],
    taxonomyOLevelPaperSlug: 'pakistan-studies-2059',
    hasALevelSyllabus: false,
  },
];

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
 * Given identifiers from managed_subjects resolution (parent subjects.slug and/or
 * subject_papers.slug strings), return portals the admin may access.
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

/**
 * Resolve a subject_papers.slug or parent subjects.slug to an admin route segment.
 */
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
