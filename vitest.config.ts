import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration.
 *
 * Goals:
 *   - Honour the project's tsconfig path aliases (@/* → src/*).
 *   - Use happy-dom for any tests that touch DOM APIs (cheaper than jsdom).
 *   - Never hit the network. Tests must mock the Supabase client; if a test
 *     accidentally calls fetch() it will fail loudly.
 *
 * AUDIT_REPORT.md → Finding H-30 (zero automated tests).
 */
export default defineConfig({
  resolve: {
    // Vite's native tsconfig-paths support — replaces vite-tsconfig-paths.
    tsconfigPaths: true,
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/admin/resolve-managed-subjects.ts',
        'src/lib/supabase/queries.ts',
        'src/config/taxonomy.ts',
        'src/config/admin-portals.ts',
      ],
    },
  },
});
