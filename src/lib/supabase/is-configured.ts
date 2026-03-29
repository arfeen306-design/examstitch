/**
 * Returns true when the required Supabase env vars are set.
 * Use this guard in Server Components to fall back to demo data
 * while the project is being set up.
 */
export function isSupabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://YOUR_PROJECT_REF.supabase.co' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
