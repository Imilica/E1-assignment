# Sandbox E2E tests

Playwright + TypeScript UI and API tests for the sandbox app in [sandbox-app/](sandbox-app/) (Login and New Test Case features).

- **UI tests:** `tests/login`, `tests/test-case` (Chromium, Page Object Model, `getByTestId` locators).
- **API tests:** `tests/api` (Playwright `request`, no browser).
- **Reports:** Playwright HTML and JUnit XML, with screenshots and videos for failed UI tests.

## Prerequisites

- Node.js **22.5 or newer** (the app uses the built-in `node:sqlite`)
- `openssl` on the PATH (the app generates a self-signed HTTPS certificate on first start)

## Install

```bash
npm install
npx playwright install chromium
(cd sandbox-app && npm install)
cp .env.example .env
```

`.env` holds `BASE_URL` (must be `https://`), the seed user and admin credentials, and an optional `FAKER_SEED`. The defaults in `.env.example` match the app's seed accounts, so no edits are needed to run against a local app.

## Run the tests

You do not have to start the app yourself: Playwright starts it (`https://localhost:3443`) and stops it afterwards. If it is already running, Playwright reuses it.

```bash
npm test
```

| Goal | Command |
|---|---|
| All tests (setup + UI + API) | `npm test` |
| Smoke set (`@smoke`) | `npm run test:smoke` |
| UI tests only | `npx playwright test --project=chromium` |
| API tests only | `npx playwright test --project=api` |
| One folder or file | `npx playwright test tests/login` |
| One test by title | `npx playwright test -g "Remember me"` |
| Interactive UI mode | `npm run test:ui` |
| Debugger | `npm run test:debug` |
| Reproduce a data set | `FAKER_SEED=12345 npm test` |
| Lint and typecheck | `npm run lint && npm run typecheck` |
| Start the app by itself | `npm run app:start` (Ctrl+C to stop) |

## View the report

```bash
npm run report        # opens reports/html in the browser
```

| Output | Location |
|---|---|
| HTML report | `reports/html/` |
| JUnit XML | `reports/junit.xml` |
| Screenshots, videos, traces of failures | `reports/test-results/` |
| Published copy of the last run | [docs/reports/](docs/reports/) |

Open a trace with `npx playwright show-trace <path to trace.zip>`. `reports/` is generated and git-ignored.

## Troubleshooting

- **Leftover test cases after a killed run:** stop the app, then `npm --prefix sandbox-app run reset-db`.
- **Port 3443 busy with something else:** stop whatever uses it. If it is a sandbox app left running in the background, `npm --prefix sandbox-app run stop`.
- **`Missing required env var ...`:** copy `.env.example` to `.env`.

## Documentation (all in [docs/](docs/))

| Document | Content |
|---|---|
| [run-guide.md](docs/run-guide.md) | Same instructions with project internals |
| [rules.md](docs/rules.md) | Conventions every test must follow |
| [test-plan.md](docs/test-plan.md) | Scope, assumptions, test ids, traceability |
| [test-cases.md](docs/test-cases.md) | Detailed UI and API test cases |
| [test-report.md](docs/test-report.md) | Latest results with evidence ([docs/reports/](docs/reports/)) |
| [prompts.md](docs/prompts.md) | Prompt history and resulting decisions |
