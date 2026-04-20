/**
 * constants.ts — Centralised constants for ExamStitch.
 *
 * Single source of truth for magic strings used across queries,
 * admin actions, and UI components. Import from here instead of
 * hardcoding values like 'video_topical' or 'solved_past_paper'.
 *
 * Public portal **lanes** (`videoLectures` / `solvedPastPapers`) are grouped as
 * `PORTAL_RESOURCE_STREAMS` in `@/lib/init-subject` — use that object for routing
 * and filters; use `PORTAL_RESOURCE_CTA_*` below for shared amber glass buttons.
 */

export const CONTENT_TYPES = {
  VIDEO: 'video',
  PDF: 'pdf',
  WORKSHEET: 'worksheet',
} as const;

export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];

export const MODULE_TYPES = {
  VIDEO_TOPICAL: 'video_topical',
  SOLVED_PAST_PAPER: 'solved_past_paper',
} as const;

export type ModuleType = (typeof MODULE_TYPES)[keyof typeof MODULE_TYPES];

/**
 * Amber glass CTAs for resource actions on navy / glass surfaces.
 * Use with `UnifiedModuleGrid`, search results, and similar portals.
 */
export const PORTAL_RESOURCE_CTA_PRIMARY =
  'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ' +
  'border border-amber-400/60 text-amber-400 bg-transparent ' +
  'transition-all duration-200 hover:bg-amber-400/10 hover:border-amber-300/80 hover:text-amber-300 ' +
  'hover:shadow-[0_0_18px_rgba(251,191,36,0.14)]';

export const PORTAL_RESOURCE_CTA_SECONDARY =
  'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ' +
  'border border-amber-400/55 text-amber-400 bg-transparent ' +
  'transition-all duration-200 hover:bg-amber-400/10 hover:border-amber-300/75 hover:text-amber-300 ' +
  'hover:shadow-[0_0_14px_rgba(251,191,36,0.1)]';

/** Same tokens, slightly larger — admin “save / link” primary actions on dark panels */
export const PORTAL_RESOURCE_CTA_PRIMARY_MD =
  'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg ' +
  'border border-amber-400/60 text-amber-400 bg-transparent ' +
  'transition-all duration-200 hover:bg-amber-400/10 hover:border-amber-300/80 hover:text-amber-300 ' +
  'disabled:opacity-45 disabled:pointer-events-none';

export const CACHE_TIMES = {
  SHORT: 300,    // 5 min — resources, categories, stats
  MEDIUM: 600,   // 10 min — unused currently, reserved
  LONG: 3600,    // 1 hour — levels, subjects, blog, near-static
} as const;

export const ADMIN_ROLES = {
  SUPER: 'super',
  ADMIN: 'admin',
} as const;
