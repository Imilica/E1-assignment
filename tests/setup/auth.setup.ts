import { test as setup, expect } from '@fixtures';
import { AUTH_FILE } from '@utils/auth-file';
import { env } from '@utils/env';

setup('authenticate as the standard user through the UI', async ({ loginPage, page }) => {
  await loginPage.goto();
  await loginPage.login(env.userEmail, env.userPassword);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().storageState({ path: AUTH_FILE });
});
