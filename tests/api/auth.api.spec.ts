import { test, expect } from '@fixtures';
import { userFactory } from '@data/factories/user.factory';
import { INVALID_EMAILS } from '@data/static/invalid-emails';
import { env } from '@utils/env';

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

function covers(requirement: string): void {
  test.info().annotations.push({ type: 'requirement', description: requirement });
}

test.describe('API: auth', () => {
  test('API-AUTH-01: valid credentials return 200, a redirect and a secure session cookie', async ({
    api,
  }) => {
    covers('Login: redirect to dashboard on correct credentials');
    const response = await api.login(env.userEmail, env.userPassword);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ redirect: '/dashboard', role: 'user' });
    const cookie = response.headers()['set-cookie'] ?? '';
    expect(cookie).toMatch(/^session=[0-9a-f]{64};/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
  });

  test('API-AUTH-02: Remember me ON gives a persistent cookie, OFF a session cookie', async ({
    api,
  }) => {
    covers('Login: Remember me toggle');
    const remembered = await api.login(env.userEmail, env.userPassword, true);
    const notRemembered = await api.login(env.userEmail, env.userPassword, false);

    expect(remembered.headers()['set-cookie']).toContain(`Max-Age=${THIRTY_DAYS_SECONDS}`);
    expect(notRemembered.headers()['set-cookie']).not.toContain('Max-Age');
  });

  test.describe('API-AUTH-03: invalid credentials are refused with 401', () => {
    test('unknown user', async ({ api }) => {
      covers('Login: show error message when login fails');
      const user = userFactory();
      const response = await api.login(user.email, user.password);

      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ error: 'Invalid email or password.' });
      expect(response.headers()['set-cookie']).toBeUndefined();
    });

    test('valid email with a wrong password', async ({ api }) => {
      covers('Login: show error message when login fails');
      const response = await api.login(env.userEmail, userFactory().password);

      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ error: 'Invalid email or password.' });
    });
  });

  test.describe('API-AUTH-04: invalid login payloads are rejected with 400', () => {
    for (const email of INVALID_EMAILS) {
      test(`email "${email}"`, async ({ api }) => {
        covers('Login: email must be a valid format');
        const response = await api.login(email, userFactory().password);

        expect(response.status()).toBe(400);
        expect(await response.json()).toEqual({ error: 'Please enter a valid email address.' });
      });
    }

    test('missing email', async ({ api }) => {
      covers('Login: email must be a valid format');
      const response = await api.loginRaw({ password: userFactory().password });

      expect(response.status()).toBe(400);
    });

    test('empty password', async ({ api }) => {
      covers('Login: password required');
      const response = await api.login(env.userEmail, '');

      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error: 'Password is required.' });
    });
  });

  test.describe('API-AUTH-05: admin login', () => {
    test('accepts an admin account', async ({ api }) => {
      covers('Login: Admin link leads to admin login');
      const response = await api.adminLogin(env.adminEmail, env.adminPassword);

      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ redirect: '/dashboard', role: 'admin' });
    });

    test('refuses a normal user', async ({ api }) => {
      covers('Login: Admin link leads to admin login');
      const response = await api.adminLogin(env.userEmail, env.userPassword);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('API-AUTH-06: current user', () => {
    test('returns 401 when logged out', async ({ api }) => {
      covers('Login: protected data requires authentication');
      const response = await api.me();

      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ error: 'Not authenticated' });
    });

    test('returns email and role when logged in', async ({ userApi }) => {
      covers('Login: protected data requires authentication');
      const response = await userApi.me();

      expect(response.status()).toBe(200);
      expect(await response.json()).toMatchObject({ email: env.userEmail, role: 'user' });
    });
  });

  test('API-AUTH-07: logout invalidates the session', async ({ userApi }) => {
    covers('Login: session ends on logout');
    expect((await userApi.me()).status()).toBe(200);

    const logout = await userApi.logout();
    expect(logout.status()).toBe(200);
    expect(await logout.json()).toEqual({ ok: true });

    expect((await userApi.me()).status()).toBe(401);
  });

  test.describe('API-AUTH-08: forgot password', () => {
    test('answers identically for a known and an unknown email', async ({ api }) => {
      covers('Login: Forgot Password');
      const known = await api.forgotPassword(env.userEmail);
      const unknown = await api.forgotPassword(userFactory().email);

      expect(known.status()).toBe(200);
      expect(unknown.status()).toBe(200);
      expect(await known.json()).toEqual(await unknown.json());
    });

    test('rejects an invalid email', async ({ api }) => {
      covers('Login: email must be a valid format');
      const response = await api.forgotPassword('plainaddress');

      expect(response.status()).toBe(400);
    });
  });
});
