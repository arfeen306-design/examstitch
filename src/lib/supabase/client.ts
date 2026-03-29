/**
 * Browser-side Supabase client.
 * Use this in Client Components ('use client').
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // We omit the Database generic here because supabase-js v2 expects Relationships
  // and CompositeTypes in the generic shape. Our readable types in ./types.ts are
  // used for explicit casting in queries instead.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
