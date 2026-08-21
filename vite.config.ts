import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base: './' — relative asset URLs pair with hash routing, so the build
// works on GitHub Pages sub-paths, localhost, and even a renamed repo.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    // Only the app's own tests plus script-side converter suites —
    // .claude/skills ships helper scripts whose *.test.cjs files are not
    // Vitest suites.
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,tsx}'],
  },
});
