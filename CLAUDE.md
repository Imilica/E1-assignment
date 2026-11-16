# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules for writing tests

All new tests, page objects, fixtures and utilities MUST follow [rules.md](rules.md). Read it before writing or changing any test code. It covers POM architecture, `getByTestId` locators, seeded faker factories, coding standards, Playwright/TypeScript conventions and local HTML reporting.

Feature requirements (Login, New Test Case) are in [requirements/Sandbox_Requirements.pdf](requirements/Sandbox_Requirements.pdf). Every test should trace back to a requirement there.

## Project state

The framework is implemented: Playwright config, `src/` (pages, fixtures, factories, utils) and UI specs in `tests/login` and `tests/test-case` cover TC-LOGIN-01..08 and TC-NTC-01..10; API specs in `tests/api` (separate `api` project, `ApiClient` in `src/utils/api-client.ts`) cover API-AUTH-xx and API-TC-xx. TC-LOGIN-09 is intentionally not implemented (rule missing from the PDF). See [README.md](README.md) for setup. [test-plan.md](test-plan.md) lists the test cases, assumptions and the app's `data-testid` values; reference its IDs from tests. `.mcp.json` configures the official Playwright MCP server (`@playwright/mcp`) for Claude Code, which can be used to inspect the live app for test ids.

The app under test is in [sandbox-app/](sandbox-app/) (see [sandbox-app/CLAUDE.md](sandbox-app/CLAUDE.md) for how to run it: `npm start` serves `https://localhost:3443` with a self-signed cert, so tests need `ignoreHTTPSErrors: true`; seed users and `POST /api/test/reset` are part of the testing contract). Tests use its existing `data-testid` values (e.g. `email`, `login-submit`, `tc-title`; full list in test-plan.md §6), which must never be renamed. Add a new id only where one is missing, following the app's pattern (rules.md §3).

## Commands

```
npm install && npx playwright install chromium
npx playwright test                    # all tests (setup + chromium + api)
npx playwright test --project=api      # API tests only
npx playwright test tests/login        # one folder
npx playwright test -g "Remember me"   # one test by title
npm run lint && npm run typecheck
npx playwright show-report reports/html
```

## Architecture notes that span files

- Specs import `test`/`expect` from `@fixtures` (`src/fixtures/index.ts`), never from `@playwright/test`. Page objects are instantiated only in fixtures.
- Auth: a setup project logs in via the UI once and saves `storageState` to `.auth/`. Login specs override it with an empty state to start unauthenticated.
- Env vars (`BASE_URL`, `USER_EMAIL`, `USER_PASSWORD`, `FAKER_SEED`) are read only through `src/utils/env.ts`. `BASE_URL` must be `https://`.
- Path aliases: `@pages/*`, `@fixtures/*`, `@data/*`, `@utils/*`.
- Each test annotates the requirement it covers and the faker seed (rules.md §7).

Key points (details in rules.md):
- Playwright + TypeScript, Page Object Model, UI tests only, Chromium.
- Locate elements only with `getByTestId`; if a test id is missing, add it (or ask the user if the app source is not editable).
- Web-first assertions only; no fixed sleeps; assertions live in specs, not page objects.
- Data from seeded `@faker-js/faker` factories; no hard-coded secrets (env vars).
- Reports: Playwright HTML in `reports/html`, local only.
