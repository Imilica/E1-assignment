# Sandbox E2E tests

Playwright + TypeScript tests for the app in [sandbox-app/](sandbox-app/). Conventions: [rules.md](rules.md). Plan and traceability: [test-plan.md](test-plan.md).

UI tests (`tests/login`, `tests/test-case`, Chromium) and API tests (`tests/api`, no browser).

## Install
```bash
npm install
npx playwright install chromium
(cd sandbox-app && npm install)
cp .env.example .env        # BASE_URL, USER_EMAIL, USER_PASSWORD, optional FAKER_SEED
```
Requires Node >= 22.5 and `openssl` (for the app's self-signed certificate).

## Run
The app starts automatically (`webServer` in `playwright.config.ts`) or reuses one already running on https://localhost:3443 (`npm run app:start`).

| Goal | Command |
|---|---|
| All tests | `npm test` |
| Smoke set (`@smoke`) | `npm run test:smoke` |
| UI tests only / API tests only | `npx playwright test --project=chromium` / `--project=api` |
| One folder / file | `npx playwright test tests/login` |
| One test by title | `npx playwright test -g "Remember me"` |
| UI mode / debug | `npm run test:ui` / `npm run test:debug` |
| Reproduce a data set | `FAKER_SEED=12345 npm test` |
| Lint + typecheck | `npm run lint && npm run typecheck` |

## Report
`reports/html/` (HTML report) and `reports/test-results/` (screenshots and videos for failed UI tests; trace on first retry). Open with `npm run report`. Each test shows its `requirement` and `seed` annotations. Reports are local only and git-ignored.

## Notes
- A `setup` project logs in through the UI once and stores the session in `.auth/user.json`; login specs start logged out.
- Tests clean up the test cases they create through the UI. If a run is killed mid-way, leftovers can be removed with `npm --prefix sandbox-app run reset-db` (stop the app first).
- API tests were added on request (not in the PDF); they cover the plan's "API test cases" table. `POST /api/test/reset` is deliberately not used because tests run in parallel against one DB.
- TC-LOGIN-09 (account lockout) is not implemented: the rule is not in the requirements PDF.
