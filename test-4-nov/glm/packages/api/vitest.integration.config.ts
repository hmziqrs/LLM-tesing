import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/test/integration/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '**/*.unit.test.ts'],
    setupFiles: ['./test/integration/setup.ts'],
    globalSetup: ['./test/integration/global-setup.ts'],
  },
});