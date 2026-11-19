# Run Guide

How to install, run and report the Playwright tests for the sandbox app. Conventions: [rules.md](rules.md). Plan: [test-plan.md](test-plan.md). Cases: [test-cases.md](test-cases.md). Latest results: [test-report.md](test-report.md).

UI tests (`tests/login`, `tests/test-case`, Chromium) and API tests (`tests/api`, no browser) run through three Playwright projects: `setup` (UI login), `chromium` and `api`.

## Install

```bash
npm install
npx playwright install chromium
(cd sandbox-app && npm install)
cp .env.example .env        # BASE_URL, USER_EMAIL, USER_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD, optional FAKER_SEED
```

Requires Node >= 22.5 and `openssl` (for the app's self-signed certificate). `BASE_URL` must be `https://`.

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

## Reports

| Output | Location | Open with |
|---|---|---|
| HTML report (generated) | `reports/html/` | `npm run report` |
| JUnit XML (generated) | `reports/junit.xml` | any JUnit viewer |
| Failure artifacts (generated) | `reports/test-results/`: screenshot and video for failed UI tests, trace on first retry | `npx playwright show-trace <trace.zip>` |
| Published copy of the last run | [reports/](reports/) in this folder | see [test-report.md](test-report.md) |

The root `reports/` folder is generated and git-ignored. `docs/reports/` is the committed, published copy. Each test records its `requirement` and `seed` annotations in the reports.

## Notes

- A `setup` project logs in through the UI once and stores the session in `.auth/user.json`; login specs start logged out.
- Tests clean up the test cases they create (UI tests through the UI, API tests by id). If a run is killed mid-way, leftovers can be removed with `npm --prefix sandbox-app run reset-db` (stop the app first).
- API tests are not in the requirements PDF; they cover the "API test cases" table of the plan. `POST /api/test/reset` is deliberately not used because tests run in parallel against one database.
