/**
 * Admin Supabase client — bypasses Row Level Security.
 * Use ONLY in trusted server-side code (admin dashboard, migrations, cron jobs).
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
import { createClient } from '@supabase/supabase-js';
import { env, requireServerSecret } from '@/lib/env';

export function createAdminClient() {
  // Force a typed runtime error if the service-role key is missing — caller
  // can't accidentally fall back to anon credentials.
  const serviceKey = requireServerSecret('SUPABASE_SERVICE_ROLE_KEY');

  // We do not pass a Database generic here because our hand-written types
  // use a simplified shape that doesn't include the Relationships/CompositeTypes
  // keys that supabase-js v2 requires at the generic level.
  // Queries in route handlers cast rows with explicit types for safety.
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
