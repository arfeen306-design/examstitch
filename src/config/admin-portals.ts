/**
 * admin-portals.ts — Single source of truth for admin portal routing.
 *
 * Used by:
 *   - src/middleware.ts (subject isolation)
 *   - src/app/api/admin/login/route.ts (redirect + admin_subjects cookie)
 *   - src/app/admin/(dashboard)/layout.tsx (sidebar "My Subjects" links)
 *   - src/components/admin/SubjectSwitcher.tsx (panel switcher dropdown)
 *
 * To add a new subject portal:
 *   1. Add an entry here.
 *   2. Create the route at /admin/<routeSegment>/.
 *   That's it — sidebar, switcher, middleware, and login all pick it up automatically.
 */

export interface AdminPortal {
  /** Base subject key — matches SUBJECT_TAXONOMY keys and slug prefixes */
  subjectKey: string;
  /** URL segment under /admin/ — e.g. 'cs' → /admin/cs */
  routeSegment: string;
  /** Display label in sidebar and switcher */
  label: string;
  /** Tailwind gradient classes for the switcher icon badge */
  gradient: string;
  /** Accent color hex for the portal theme */
  accentColor: string;
}

/**
 * Every subject that has (or will have) its own /admin/<segment> portal.
 * Order determines display order in the switcher.
 */
export const ADMIN_PORTALS: AdminPortal[] = [
  {
    subjectKey: 'computer-science',
    routeSegment: 'cs',
    label: 'CS Resources',
    gradient: 'from-emerald-500 to-teal-600',
    accentColor: '#6366F1',
  },
  {
    subjectKey: 'mathematics',
    routeSegment: 'math',
    label: 'Math Resources',
    gradient: 'from-blue-500 to-indigo-600',
    accentColor: '#3B82F6',
  },
  {
    subjectKey: 'physics',
    routeSegment: 'physics',
    label: 'Physics Resources',
    gradient: 'from-amber-500 to-orange-600',
    accentColor: '#F59E0B',
  },
  {
    subjectKey: 'chemistry',
    routeSegment: 'chemistry',
    label: 'Chemistry Resources',
    gradient: 'from-rose-500 to-pink-600',
    accentColor: '#F43F5E',
  },
  {
    subjectKey: 'biology',
    routeSegment: 'biology',
    label: 'Biology Resources',
    gradient: 'from-lime-500 to-green-600',
    accentColor: '#84CC16',
  },
  {
    subjectKey: 'english',
    routeSegment: 'english',
    label: 'English Resources',
    gradient: 'from-violet-500 to-purple-600',
    accentColor: '#8B5CF6',
  },
  {
    subjectKey: 'urdu',
    routeSegment: 'urdu',
    label: 'Urdu Resources',
    gradient: 'from-cyan-500 to-sky-600',
    accentColor: '#06B6D4',
  },
  {
    subjectKey: 'pakistan-studies',
    routeSegment: 'pakistan-studies',
    label: 'Pak Studies Resources',
    gradient: 'from-yellow-500 to-amber-600',
    accentColor: '#EAB308',
  },
];

// ── Derived lookups (computed once at module load) ──────────────────────────

/** Map: slug prefix → route segment. E.g. 'computer-science' → 'cs' */
export const SLUG_TO_ROUTE: Record<string, string> = Object.fromEntries(
  ADMIN_PORTALS.map(p => [p.subjectKey, p.routeSegment])
);

/** Map: route segment → portal. E.g. 'cs' → full portal object */
export const ROUTE_TO_PORTAL: Record<string, AdminPortal> = Object.fromEntries(
  ADMIN_PORTALS.map(p => [p.routeSegment, p])
);

/** Set of all subject portal route segments (for middleware checks) */
export const PORTAL_ROUTE_SEGMENTS: Set<string> = new Set(
  ADMIN_PORTALS.map(p => p.routeSegment)
);

/** Shared admin routes that are NOT subject portals */
export const SHARED_ADMIN_ROUTES = new Set([
  'login', 'forbidden', 'resources', 'categories', 'blog',
  'subscribers', 'bookings', 'students', 'super',
]);

/**
 * Given a list of managed subject slugs (e.g. ['computer-science-0478', 'physics-5054']),
 * return the portal entries the admin can access.
 */
export function getPortalsForSubjects(managedSubjectSlugs: string[]): AdminPortal[] {
  const seen = new Set<string>();
  const result: AdminPortal[] = [];

  for (const slug of managedSubjectSlugs) {
    for (const portal of ADMIN_PORTALS) {
      if (slug.startsWith(portal.subjectKey) && !seen.has(portal.subjectKey)) {
        seen.add(portal.subjectKey);
        result.push(portal);
      }
    }
  }

  return result;
}

/**
 * Given a list of managed subject slugs, return the set of allowed route segments.
 */
export function getAllowedRouteSegments(managedSubjectSlugs: string[]): Set<string> {
  return new Set(getPortalsForSubjects(managedSubjectSlugs).map(p => p.routeSegment));
}

/**
 * Given a subject slug (e.g. 'computer-science-0478'), return the route segment ('cs').
 * Returns null if no portal exists for this subject.
 */
export function getRouteForSlug(slug: string): string | null {
  for (const [prefix, route] of Object.entries(SLUG_TO_ROUTE)) {
    if (slug.startsWith(prefix)) return route;
  }
  return null;
}
