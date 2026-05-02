/**
 * env.ts — Boot-time environment validation.
 *
 * Parses `process.env` with Zod once at module load. If a required variable is
 * missing or malformed, the build/server fails fast with a readable error
 * instead of producing opaque `undefined` runtime errors deep in Supabase.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
 *
 * Replaces every `process.env.X!` assertion with a typed, never-undefined value.
 *
 * AUDIT_REPORT.md → Finding H-29.
 */

import { z } from 'zod';

const ServerEnvSchema = z.object({
  // ── Supabase (required) ──────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or too short'),

  // ── Server-only secrets ──────────────────────────────────────────────────
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY is missing or too short')
    .optional(),

  REVALIDATION_SECRET: z.string().min(8).optional(),
  OPENAI_API_KEY: z.string().min(8).optional(),
  GOOGLE_SHEETS_WEBHOOK_URL: z.string().url().optional(),

  // ── Client-readable (NEXT_PUBLIC_*) ──────────────────────────────────────
  NEXT_PUBLIC_ADOBE_CLIENT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // ── Standard ─────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

/**
 * Edge runtime cannot read every env var via destructuring at module load,
 * so we explicitly enumerate the keys we want before parsing. This also keeps
 * Next.js' build-time `process.env` inlining intact.
 */
const rawEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  REVALIDATION_SECRET: process.env.REVALIDATION_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GOOGLE_SHEETS_WEBHOOK_URL: process.env.GOOGLE_SHEETS_WEBHOOK_URL,
  NEXT_PUBLIC_ADOBE_CLIENT_ID: process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
};

const parsed = ServerEnvSchema.safeParse(rawEnv);

if (!parsed.success) {
  // Build-time / boot-time fail. Zod's flat error format is the most readable
  // and renders nicely in Vercel build logs.
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(
    `\n[env] Invalid or missing environment variables:\n${issues}\n\nCheck your .env file or Vercel project settings.\n`,
  );
}

export const env: ServerEnv = parsed.data;

/** Server-only secrets that must never be accessed in client code. */
export function requireServerSecret<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = env[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`[env] required server secret "${String(key)}" is not set`);
  }
  return value as NonNullable<ServerEnv[K]>;
}
