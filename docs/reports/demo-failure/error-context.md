# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zz-demo-failure.spec.ts >> DEMO: login error text is wrong on purpose
- Location: tests/zz-demo-failure.spec.ts:6:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('login-error')
Expected: "This text is deliberately wrong"
Received: "Invalid email or password."
Timeout:  5000ms

Call log:
  - Expect "toHaveText" getByTestId('login-error') with timeout 5000ms
  - waiting for getByTestId('login-error')
    - locator resolved to <div hidden="" role="alert" id="form-error" class="error banner" data-testid="login-error"></div>
    - unexpected value ""
    13 × locator resolved to <div role="alert" id="form-error" class="error banner" data-testid="login-error">Invalid email or password.</div>
       - unexpected value "Invalid email or password."

```

```yaml
- alert: Invalid email or password.
```

# Test source

```ts
  1  | import { test, expect } from '@fixtures';
  2  | 
  3  | test.use({ storageState: { cookies: [], origins: [] } });
  4  | 
  5  | // Temporary spec: proves failure artifacts (screenshot, video, trace) are captured.
  6  | test('DEMO: login error text is wrong on purpose', async ({ loginPage }) => {
  7  |   await loginPage.goto();
  8  |   await loginPage.login('nobody@example.com', 'Wrong-Pass1!');
> 9  |   await expect(loginPage.errorMessage).toHaveText('This text is deliberately wrong');
     |                                        ^ Error: expect(locator).toHaveText(expected) failed
  10 | });
  11 | 
```