import { test as base, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { DashboardPage } from '@pages/dashboard.page';
import { ForgotPasswordPage } from '@pages/forgot-password.page';
import { LoginPage } from '@pages/login.page';
import { NewTestCasePage } from '@pages/new-test-case.page';
import { TestCaseListPage } from '@pages/test-case-list.page';
import { testCaseFactory } from '@data/factories/test-case.factory';
import type { TestCaseData } from '@data/factories/test-case.factory';
import { ApiClient } from '@utils/api-client';
import { env } from '@utils/env';
import { deriveSeed, shortSuffix } from '@utils/seed';

type TestCaseBuilder = (overrides?: Partial<TestCaseData>) => TestCaseData;

interface Fixtures {
  loginPage: LoginPage;
  forgotPasswordPage: ForgotPasswordPage;
  dashboardPage: DashboardPage;
  newTestCasePage: NewTestCasePage;
  testCaseListPage: TestCaseListPage;
  /** Builds valid test cases with unique titles (no cleanup; used by API specs). */
  makeTestCase: TestCaseBuilder;
  /** Same, but deletes the cases through the UI afterwards (UI specs). */
  buildTestCase: TestCaseBuilder;
  /** API client without a session (API project). */
  api: ApiClient;
  /** API client logged in as the standard user; created test cases are deleted afterwards. */
  userApi: ApiClient;
  /** Re-seeds faker per test and records the seed in the report. */
  seed: number;
}

export const test = base.extend<Fixtures>({
  seed: [
    async ({}, use, testInfo) => {
      const seed = deriveSeed(env.fakerSeed, ...testInfo.titlePath);
      faker.seed(seed);
      testInfo.annotations.push({ type: 'seed', description: `${env.fakerSeed} (test: ${seed})` });
      await use(seed);
    },
    { auto: true },
  ],
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  newTestCasePage: async ({ page }, use) => {
    await use(new NewTestCasePage(page));
  },
  testCaseListPage: async ({ page }, use) => {
    await use(new TestCaseListPage(page));
  },
  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },
  userApi: async ({ request }, use) => {
    const client = new ApiClient(request);
    const response = await client.login(env.userEmail, env.userPassword);
    if (!response.ok()) throw new Error(`API login failed with status ${response.status()}`);
    await use(client);
    await client.cleanup();
  },
  makeTestCase: async ({}, use, testInfo) => {
    let count = 0;
    await use((overrides = {}) => {
      const suffix = shortSuffix(env.fakerSeed, ...testInfo.titlePath, String(count));
      count += 1;
      return testCaseFactory(suffix, overrides);
    });
  },
  buildTestCase: async ({ page, testCaseListPage, makeTestCase }, use) => {
    const created: string[] = [];
    await use((overrides) => {
      const data = makeTestCase(overrides);
      created.push(data.title);
      return data;
    });
    if (created.length > 0 && !page.isClosed()) {
      await testCaseListPage.goto();
      for (const title of created) await testCaseListPage.deleteByTitle(title);
    }
  },
});

export { expect };
