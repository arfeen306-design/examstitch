/**
 * constants.ts — Centralised constants for ExamStitch.
 *
 * Single source of truth for magic strings used across queries,
 * admin actions, and UI components. Import from here instead of
 * hardcoding values like 'video_topical' or 'solved_past_paper'.
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

export const CACHE_TIMES = {
  SHORT: 300,    // 5 min — resources, categories, stats
  MEDIUM: 600,   // 10 min — unused currently, reserved
  LONG: 3600,    // 1 hour — levels, subjects, blog, near-static
} as const;

export const ADMIN_ROLES = {
  SUPER: 'super',
  ADMIN: 'admin',
} as const;
