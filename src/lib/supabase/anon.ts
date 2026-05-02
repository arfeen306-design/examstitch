/**
 * Server-side Supabase client using the **anon** key.
 *
 * Unlike server.ts (which reads cookies for user sessions), this client
 * is cookie-free and works safely inside `unstable_cache` closures.
 *
 * Use this for all PUBLIC reads — it respects Row Level Security.
 * For admin writes or reading private data, use createAdminClient().
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export function createAnonClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
