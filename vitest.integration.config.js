import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: true,
    sequence: {
      shuffle: false,
    },
    // Vitest 4: pool options are now top-level
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Allow tests to be retried on network failures
    retry: 1,
  },
});
