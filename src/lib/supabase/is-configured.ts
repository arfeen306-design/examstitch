import { env } from '@/lib/env';

/**
 * Returns true when the required Supabase env vars are set.
 * Use this guard in Server Components to fall back to demo data
 * while the project is being set up.
 *
 * After Phase 2 the env validator already throws at boot if these are
 * missing, so this is mainly a sanity check against the placeholder URL.
 */
export function isSupabaseConfigured(): boolean {
  return (
    env.NEXT_PUBLIC_SUPABASE_URL !== 'https://YOUR_PROJECT_REF.supabase.co' &&
    !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
