import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['**/test/components/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', '**/*.integration.test.ts'],
    setupFiles: ['./test/unit.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/functions': resolve(__dirname, './src/functions'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/routes': resolve(__dirname, './src/routes'),
    },
  },
});