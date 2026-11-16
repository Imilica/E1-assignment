import { test, expect } from '@fixtures';
import { userFactory } from '@data/factories/user.factory';
import { INVALID_EMAILS } from '@data/static/invalid-emails';
import { env } from '@utils/env';

// Login tests always start logged out.
test.use({ storageState: { cookies: [], origins: [] } });

const DAY_MS = 24 * 60 * 60 * 1000;

function covers(requirement: string): void {
  test.info().annotations.push({ type: 'requirement', description: requirement });
}

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('TC-LOGIN-01: successful login redirects to the dashboard @smoke', async ({
    loginPage,
    dashboardPage,
    page,
  }) => {
    covers('Login: redirect to dashboard on correct credentials');
    await loginPage.login(env.userEmail, env.userPassword);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboardPage.title).toBeVisible();
    await expect(dashboardPage.welcome).toContainText(env.userEmail);
    await expect(loginPage.errorMessage).toBeHidden();
  });

  test.describe('TC-LOGIN-02: invalid credentials show an error', () => {
    test('unknown user', async ({ loginPage, page }) => {
      covers('Login: show error message when login fails');
      const user = userFactory();
      await loginPage.login(user.email, user.password);

      await expect(loginPage.errorMessage).toBeVisible();
      await expect(loginPage.errorMessage).toContainText('Invalid email or password');
      await expect(page).toHaveURL(/\/login$/);
      await expect(loginPage.emailInput).toHaveValue(user.email);
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('valid email with a wrong password', async ({ loginPage, page }) => {
      covers('Login: show error message when login fails');
      const { password } = userFactory();
      await loginPage.login(env.userEmail, password);

      await expect(loginPage.errorMessage).toBeVisible();
      await expect(page).toHaveURL(/\/login$/);
      await expect(loginPage.emailInput).toHaveValue(env.userEmail);
    });
  });

  test.describe('TC-LOGIN-03: empty fields trigger frontend validation and no backend call', () => {
    // An empty expected error means the field must show no error.
    const cases = [
      {
        name: 'both empty',
        fillEmail: false,
        fillPassword: false,
        emailError: 'Email is required.',
        passwordError: 'Password is required.',
      },
      {
        name: 'email only',
        fillEmail: true,
        fillPassword: false,
        emailError: '',
        passwordError: 'Password is required.',
      },
      {
        name: 'password only',
        fillEmail: false,
        fillPassword: true,
        emailError: 'Email is required.',
        passwordError: '',
      },
    ];

    for (const c of cases) {
      test(c.name, async ({ loginPage, page }) => {
        covers('Login: frontend validation, no backend call on empty fields; password required');
        const user = userFactory({
          ...(c.fillEmail ? {} : { email: '' }),
          ...(c.fillPassword ? {} : { password: '' }),
        });
        await loginPage.fillCredentials(user.email, user.password);
        await loginPage.submit();

        await expect(loginPage.emailError).toHaveText(c.emailError);
        await expect(loginPage.passwordError).toHaveText(c.passwordError);
        await expect(page).toHaveURL(/\/login$/);
        // Counter is read after the validation messages proved the submit was handled.
        expect(loginPage.loginRequestCount, 'no login request may be sent').toBe(0);
      });
    }
  });

  test.describe('TC-LOGIN-04: invalid email formats are rejected', () => {
    for (const invalidEmail of INVALID_EMAILS) {
      test(`rejects "${invalidEmail}"`, async ({ loginPage, page }) => {
        covers('Login: email must be a valid format');
        await loginPage.fillCredentials(invalidEmail, userFactory().password);
        await loginPage.submit();

        await expect(loginPage.emailError).toHaveText('Please enter a valid email address.');
        await expect(page).toHaveURL(/\/login$/);
        expect(loginPage.loginRequestCount, 'no login request may be sent').toBe(0);
      });
    }
  });

  test('TC-LOGIN-05: password is masked and the page is served over HTTPS @smoke', async ({
    loginPage,
    page,
  }) => {
    covers('Login: HTTPS only; masked password');
    await expect(page).toHaveURL(/^https:\/\//);
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    const insecureUrl = new URL('/login', env.baseUrl);
    insecureUrl.protocol = 'http:';
    await expect(page.goto(insecureUrl.toString()), 'plain http must be refused').rejects.toThrow();
  });

  test.describe('TC-LOGIN-06: Remember me', () => {
    test('is off by default', async ({ loginPage }) => {
      covers('Login: Remember me toggle');
      await expect(
        loginPage.rememberMeToggle,
        'Remember me must be unchecked by default',
      ).not.toBeChecked();
    });

    test('ON keeps a persistent session cookie', async ({ loginPage, page, context }) => {
      covers('Login: Remember me keeps the user logged in longer');
      await loginPage.login(env.userEmail, env.userPassword, true);
      await expect(page).toHaveURL(/\/dashboard$/);

      await expect
        .poll(async () => (await context.cookies()).find((c) => c.name === 'session')?.expires)
        .toBeGreaterThan(Date.now() / 1000 + 29 * (DAY_MS / 1000));
    });

    test('OFF issues a browser-session cookie', async ({ loginPage, page, context }) => {
      covers('Login: Remember me keeps the user logged in longer');
      await loginPage.login(env.userEmail, env.userPassword, false);
      await expect(page).toHaveURL(/\/dashboard$/);

      await expect
        .poll(async () => (await context.cookies()).find((c) => c.name === 'session')?.expires)
        .toBe(-1);
    });
  });

  test.describe('TC-LOGIN-07: navigation links', () => {
    test('Forgot Password link opens the forgot password page', async ({
      loginPage,
      forgotPasswordPage,
      page,
    }) => {
      covers('Login: Forgot Password link');
      await loginPage.forgotPasswordLink.click();
      await expect(page).toHaveURL(/\/forgot-password$/);
      await expect(forgotPasswordPage.submitButton).toBeVisible();
    });

    test('Admin link in the top menu opens the admin login page', async ({ loginPage, page }) => {
      covers('Login: Admin link');
      await loginPage.topMenu.openAdminLogin();
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(loginPage.submitButton).toHaveText('Login as admin');
    });

    test('Login link in the top menu leads to the login page', async ({ loginPage, page }) => {
      covers('Login: Login link');
      await loginPage.topMenu.openAdminLogin();
      await expect(page).toHaveURL(/\/admin\/login$/);
      await loginPage.topMenu.openLogin();
      await expect(page).toHaveURL(/\/login$/);
      await expect(loginPage.submitButton).toHaveText('Login');
    });
  });

  test('TC-LOGIN-08: labels, placeholders and Remember me are visible', async ({ loginPage }) => {
    covers('Login: labels/placeholders "Email" and "Password"; Remember me toggle');
    await expect.soft(loginPage.emailInput).toHaveAttribute('placeholder', 'Email');
    await expect.soft(loginPage.emailInput).toHaveAccessibleName('Email');
    await expect.soft(loginPage.passwordInput).toHaveAttribute('placeholder', 'Password');
    await expect.soft(loginPage.passwordInput).toHaveAccessibleName('Password');
    await expect.soft(loginPage.rememberMeToggle).toBeVisible();
    await expect.soft(loginPage.rememberMeToggle).toBeEnabled();
  });
});
