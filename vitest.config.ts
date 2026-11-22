import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setupEnv.ts'],
    testTimeout: 45000,
    hookTimeout: 60000,
    fileParallelism: false
  }
});
