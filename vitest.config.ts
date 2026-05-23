import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: './tests/globalSetup.ts',
    setupFiles: ['./tests/setup.ts'],
    pool: 'forks',
    maxWorkers: 1,
    minWorkers: 1,
    env: {
      DATABASE_URL: 'file:./prisma/test.db',
      JWT_SECRET: 'test-secret-key-biblioteca-digital',
      NODE_ENV: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
      },
    },
  },
})