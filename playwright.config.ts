import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE } from './src/utils/auth-file';
import { env } from './src/utils/env';

export default defineConfig({
  testDir: './tests',
  outputDir: './reports/test-results',
  fullyParallel: true,
  forbidOnly: env.isCi,
  retries: env.isCi ? 2 : 0,
  workers: env.isCi ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { outputFolder: 'reports/html', open: 'never' }]],
  use: {
    baseURL: env.baseUrl,
    testIdAttribute: 'data-testid',
    // The sandbox app serves a self-signed certificate.
    ignoreHTTPSErrors: true,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm --prefix sandbox-app start',
    url: env.baseUrl,
    ignoreHTTPSErrors: true,
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      testIgnore: [/.*\.setup\.ts/, /tests\/api\/.*/],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
    {
      name: 'api',
      testMatch: /tests\/api\/.*\.spec\.ts/,
    },
  ],
});
