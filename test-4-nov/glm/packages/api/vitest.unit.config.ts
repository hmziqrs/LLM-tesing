import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/test/unit/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '**/*.integration.test.ts'],
    setupFiles: ['./test/unit/setup.ts'],
  },
  resolve: {
    alias: {
      '@glm/db': resolve(__dirname, '../../db/src'),
      '@glm/db/schema': resolve(__dirname, '../../db/src/schema'),
      '@glm/auth': resolve(__dirname, '../../auth/src'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"test"',
  },
  optimizeDeps: {
    include: ['@glm/db', '@glm/db/schema', '@glm/auth'],
  },
});