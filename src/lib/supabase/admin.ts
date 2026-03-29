/**
 * Admin Supabase client — bypasses Row Level Security.
 * Use ONLY in trusted server-side code (admin dashboard, migrations, cron jobs).
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Admin client cannot be created.');
  }

  // We do not pass a Database generic here because our hand-written types
  // use a simplified shape that doesn't include the Relationships/CompositeTypes
  // keys that supabase-js v2 requires at the generic level.
  // Queries in route handlers cast rows with explicit types for safety.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
