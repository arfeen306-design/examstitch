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

export function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
