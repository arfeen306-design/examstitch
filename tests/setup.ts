/**
 * Vitest setup — runs once per test worker before any spec.
 *
 * We populate the env-var keys that `src/lib/env.ts` requires *before* the
 * module is first imported. Without this the zod parse throws at module load
 * and every test file fails with a cryptic "Invalid or missing environment
 * variables" error instead of running.
 */

const REQUIRED_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-xxxxxxxxxxxxxxxxxxxx',
  // Service-role key is optional in env.ts, but several tests instantiate
  // mocked admin clients. Provide a deterministic fake.
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-xxxxxxxxxxxxxxxx',
  NODE_ENV: 'test',
};

for (const [key, value] of Object.entries(REQUIRED_ENV)) {
  if (!process.env[key]) process.env[key] = value;
}
