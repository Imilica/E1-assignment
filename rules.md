# Test Automation Rules (Playwright + TypeScript)

Source requirements: [requirements/Sandbox_Requirements.pdf](requirements/Sandbox_Requirements.pdf).
These rules apply to every test, page object, fixture and utility written in this repo.
References: <https://playwright.dev/docs/best-practices>, <https://playwright.dev/docs/pom>, <https://playwright.dev/docs/locators#locate-by-test-id>.

## 1. Scope

- UI tests (browser-driven) in `tests/login` and `tests/test-case`, run by the `chromium` project. They never use API calls for setup/teardown; preconditions go through the UI.
- API tests live only in `tests/api`, run by a separate `api` project (Playwright `request` fixture, no browser). They cover the app's JSON endpoints: status codes, response bodies, validation and error cases, derived from the server-side rules. They do not replace UI tests.
- Browser: Chromium only for UI tests.
- Features under test (from the requirements PDF):
  - **Login**: email/password login, redirect to dashboard, error on failure, Remember me, Forgot Password link, Admin link (-> admin login), Login link, frontend validation (no backend call on empty fields), email format validation, masked password, HTTPS only, labels/placeholders ("Email", "Password").
  - **New Test Case**: Title*, Description, Expected Result*, Test Steps* (>= 1, add via "Add Test Step"), Automated toggle (default off), Submit saves to the list, Back arrow returns to list, required-field errors, step order preserved, Enter key must not submit an invalid form, placeholders ("Title", "Description", "Expected Result", "Test step").
- Every test must trace back to a requirement bullet. Put the requirement in the test title or an annotation (see §5).

## 2. Architecture: Page Object Model

- One page object class per page or significant component (e.g. `LoginPage`, `NewTestCasePage`, `TestCaseListPage`, `TopMenu`).
- Page objects own locators and user-level actions. **Tests own assertions** (see §6 for the allowed exceptions).
- Locators are `readonly` properties defined in the constructor (or as getters). Never build locators inside tests.
- Actions are small, intent-named async methods (`login(email, password)`, `addTestStep(text)`), returning `void` or the next page object when navigation occurs.
- Page objects never call `expect` for business assertions, never contain `test.step`-less sleeps, and never hold test data.
- Compose, don't inherit: shared widgets (top menu, toasts) are separate component classes injected into pages. Use a `BasePage` only for trivial shared behaviour (`goto`, `waitForLoaded`).
- A page object exposes a `url`/`path` and a `goto()` method. Use relative paths; the base URL comes from config.
- Page objects receive `Page` via constructor and are instantiated only in fixtures (see §7), never with `new` inside tests.

## 3. Locators

- **Always use `getByTestId`.** Do not use CSS, XPath, text, role or placeholder locators as the primary strategy.
- Configure the attribute in `playwright.config.ts`: `use: { testIdAttribute: 'data-testid' }`. Change it only if the app already uses a different attribute.
- If an element has no test id, **create it**: add `data-testid` to the application source and note the addition in the PR description. If the app source is not ours to change, stop and ask the user. Do not silently fall back to a brittle locator.
- **Use the app's existing test ids** in `sandbox-app/public/` (e.g. `email`, `password`, `login-submit`, `login-error`, `title`, `title-error`, `add-step`, `tc-title`). Never rename or remove an existing id. Grep `data-testid` there before adding one.
- New ids follow the app's pattern: `kebab-case`, `<field>`, `<field>-error`, `nav-<target>`, `tc-<column>` for list cells. Describe purpose, not appearance.
- Repeated elements (`step-input`, `test-case-row`) share one id; narrow with chaining or `.filter({ hasText })`, and `.nth()` only with an index tied to the data.
- Test ids describe purpose, not appearance or position. They must be stable across copy and styling changes.
- Scope with chaining for repeated elements: `row.getByTestId('test-case-title')`. Use `.nth()` only with an index tied to the data, never to guess.
- Do not use `page.locator(...)` or `page.$` . Never use `{ force: true }` to dodge a bad locator.
- Text/placeholder/label *content* required by the PDF ("Email", "Password", "Title", ...) is verified through assertions (`toHaveAttribute('placeholder', ...)`), not used to locate elements.

## 4. Test data

- Use factories in `src/data/factories/` (`userFactory`, `testCaseFactory`) built on `@faker-js/faker`.
- **Seeded and reproducible**: seed faker once per worker/test from `process.env.FAKER_SEED` (default: a fixed constant). Log the seed in the report so any failure is reproducible.
- Randomized but stable: values vary by seed, not by run. Where uniqueness is needed (e.g. test case titles in a shared list) append a short deterministic suffix derived from the seed and test title/index, not `Date.now()`.
- Factories return fully valid objects by default and accept `Partial<T>` overrides: `testCaseFactory({ title: '' })` for negative cases. Each invalid case overrides only the field under test.
- Test steps are generated as ordered arrays so ordering assertions are meaningful (distinct, non-repeating strings).
- Credentials and URLs come from environment variables (`.env`, git-ignored; `.env.example` committed): `BASE_URL`, `USER_EMAIL`, `USER_PASSWORD`. Never hard-code or log secrets.
- Static fixtures (JSON in `src/data/static/`) only for constants that must not vary (e.g. a known invalid email list, boundary strings).
- Tests must be independent: each creates the data it needs and does not rely on records from other tests or on execution order. Clean up created data where the UI allows it; otherwise make titles unique so leftovers never collide.

## 5. Coding standards

### Naming
- Files: `kebab-case`: `login.page.ts`, `login.spec.ts`, `test-case.factory.ts`, `auth.fixture.ts`.
- Classes: `PascalCase` with `Page`/`Component` suffix. Methods and variables: `camelCase`. Constants: `UPPER_SNAKE_CASE`. Types/interfaces: `PascalCase`, no `I` prefix.
- Methods start with a verb (`fillEmail`, `submit`, `openForgotPassword`). Boolean helpers start with `is`/`has`.
- Test titles describe behaviour: `shows error message when credentials are invalid`. Group with `test.describe('Login', ...)`. Tag with `@smoke`/`@regression` in the title only if suites are introduced.

### File layout
```
.
├── CLAUDE.md
├── rules.md
├── requirements/
├── playwright.config.ts
├── tsconfig.json
├── .env.example
├── src/
│   ├── pages/            # page objects + components/
│   ├── fixtures/         # test.extend fixtures (index.ts exports `test`, `expect`)
│   ├── data/
│   │   ├── factories/
│   │   └── static/
│   └── utils/            # pure helpers (env, seed, wait helpers)
├── tests/
│   ├── login/            # *.spec.ts per feature
│   ├── test-case/
│   └── api/              # API specs (api project)
└── reports/              # generated, git-ignored
```
- One spec file per feature area. Specs import `test`/`expect` from `src/fixtures`, never from `@playwright/test` directly.
- Use path aliases (`@pages/*`, `@fixtures/*`, `@data/*`, `@utils/*`) defined in `tsconfig.json`.

### TypeScript
- `strict: true`. No `any`; use `unknown` and narrow. No non-null `!` assertions without a comment.
- Explicit return types on exported functions and page object methods. Use `import type` for types.
- Prefer `async/await`; no unhandled promises. Enable `@typescript-eslint/no-floating-promises`.
- ESLint (`eslint-plugin-playwright`) and Prettier are mandatory; code must pass lint before commit.

### Assertions
- Use **web-first, auto-retrying assertions** for UI tests (API tests assert on the response: `expect(response.status()).toBe(400)`, `expect(await response.json())`): `await expect(locator).toBeVisible()`, `toHaveText`, `toHaveValue`, `toHaveURL`, `toBeChecked`, `toHaveAttribute`, `toHaveCount`.
- Never assert on a snapshot value read earlier (`expect(await locator.textContent())`, `isVisible()`); these do not retry.
- Use `expect.soft` only for independent checks within one scenario (e.g. several placeholders). Keep one logical behaviour per test.
- Assert user-visible outcomes: URL after redirect, error text, list contents and order. Do not assert implementation details.
- Negative assertions (`not.toBeVisible`, no backend call) must be paired with a positive check proving the page reached the expected state. For "no backend call on empty fields" use `page.waitForRequest`/route counters to assert the request was **not** sent.
- Custom messages for non-obvious assertions: `expect(locator, 'Remember me must be unchecked by default')`.

### Waits, retries, timeouts
- **No `waitForTimeout`/fixed sleeps. No `networkidle`.** Rely on auto-waiting and web-first assertions. Wait on a specific condition (`toHaveURL`, `waitForResponse`) when needed.
- Timeouts live in `playwright.config.ts` only: `timeout: 30_000`, `expect.timeout: 5_000`, `actionTimeout: 10_000`, `navigationTimeout: 15_000`. Do not scatter per-call timeouts; if one is needed, add a comment with the reason.
- Retries: `retries: 0` locally, `2` in CI (`process.env.CI`). Retries are for infrastructure flake, not to hide bad tests. A test that only passes on retry must be fixed. Retried tests are flagged "flaky" in the report.
- `fullyParallel: true`; tests must be safe to run in parallel. `workers` default locally, `1`-`2` in CI.
- No `test.only` / `test.skip` committed (`forbidOnly: !!process.env.CI`). Use `test.fixme` with a linked reason for known defects.

### Error handling
- Do not wrap actions in `try/catch` to swallow failures. Let Playwright errors fail the test with its own message.
- Throw typed, descriptive errors from utilities (e.g. missing env var: `Missing required env var USER_EMAIL`). Validate env once in a config helper.
- Use `test.step('...', async () => {...})` in page object actions or specs to give readable traces.
- Failure artifacts: `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`.

## 6. Framework-specific rules

### Page objects
```ts
import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeToggle: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByTestId('email');
    this.passwordInput = page.getByTestId('password');
    this.rememberMeToggle = page.getByTestId('remember-me');
    this.submitButton = page.getByTestId('login-submit');
    this.errorMessage = page.getByTestId('login-error');
  }

  async goto(): Promise<void> { await this.page.goto('/login'); }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```
- Locators are public `readonly` so specs can assert on them (`await expect(login.errorMessage).toBeVisible()`).
- Allowed assertion in a page object: a built-in "page is loaded" guard inside `goto()`/`waitForLoaded()`.

### Fixtures
- Extend `test` once in `src/fixtures/index.ts` using `base.extend<{...}>`. Expose page objects as fixtures: `async ({ page }, use) => { await use(new LoginPage(page)); }`.
- Use fixtures for setup/teardown instead of `beforeEach`/`afterEach` where reuse is likely (e.g. `authenticatedPage`, `testCaseData`).
- Authentication: log in once through the UI in a `globalSetup`/setup project and reuse `storageState` (stored in `.auth/`, git-ignored) for tests that are not about login. Login-feature tests start unauthenticated (`test.use({ storageState: { cookies: [], origins: [] } })`).
- Worker-scoped fixtures for expensive shared setup (faker seed); test-scoped for everything else. Fixtures must clean up after `use()`.
- Each test gets a fresh browser context (Playwright default). Do not share state between tests.

### Utilities
- `src/utils/` holds pure, framework-light helpers (env loader, seed provider, string helpers). No locators and no assertions.
- Environment access only via `src/utils/env.ts`; no `process.env` elsewhere.

### Config (`playwright.config.ts`)
- `baseURL` from `BASE_URL`; `testIdAttribute: 'data-testid'`; `testDir: './tests'`; `outputDir: './reports/test-results'`.
- HTTPS is required by the requirements: the base URL must be `https://`; add a test verifying the login page is served over HTTPS (`toHaveURL(/^https:/)`).
- Projects: `setup` (UI login), `chromium` (UI specs, depends on `setup`) and `api` (specs in `tests/api`, no browser, no storage state).

## 7. Reporting

- Format: **Playwright HTML reporter** (plus `list` reporter for terminal output).
  ```ts
  reporter: [['list'], ['html', { outputFolder: 'reports/html', open: 'never' }]]
  ```
- Location: `reports/html/` (report) and `reports/test-results/` (traces, screenshots, videos). The `reports/` folder is git-ignored.
- Publishing: **local only**. No CI publishing is configured. View with `npx playwright show-report reports/html`.
- Attach the faker seed to each report (`test.info().annotations.push({ type: 'seed', description: String(seed) })`).
- Annotate tests with the requirement they cover: `test.info().annotations.push({ type: 'requirement', description: 'Login: Remember me' })`.
- If CI publishing, JUnit or Allure is needed later, update this section first.

## 8. Commands (expected once the project is scaffolded)

```
npm ci
npx playwright install chromium
npx playwright test                       # all tests
npx playwright test tests/login           # one folder
npx playwright test -g "Remember me"      # by title
npx playwright test --ui | --debug        # interactive
npx playwright show-report reports/html
npm run lint && npm run typecheck
```

## 9. Additional rules

- Tests are deterministic, isolated, and order-independent; any shared state is a bug.
- Test what users see (best practice). Do not test third-party sites; mock or avoid external dependencies.
- Keep specs declarative: arrange (factory + fixtures), act (page object), assert (expect). No logic (loops/conditionals) in specs beyond data-driven `for` loops generating tests.
- Data-driven negative tests (invalid emails, empty fields) use a typed table + loop with unique titles.
- Security items from the PDF (masked password, HTTPS) are asserted explicitly: `await expect(login.passwordInput).toHaveAttribute('type', 'password')`.
- Commits must not include `reports/`, `.auth/`, `.env`, `test-results/`.
- When a requirement is ambiguous or a test id is missing and the app is not editable, **ask the user** instead of guessing.
