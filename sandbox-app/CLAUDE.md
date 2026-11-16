# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

Minimal Node.js + SQLite web app that is the target of the Playwright e2e tests in the parent project. Requirements: `../requirements/Sandbox_Requirements.pdf` (Login and New Test Case features). Keep it minimal: functionality and usability over looks, no build step, no frontend framework.

## Test-writing rules

Tests, page objects, fixtures and test data live in the parent project, not here, and MUST follow [../rules.md](../rules.md). Do not add Playwright code under `sandbox-app/`.

## Commands

```bash
npm install
npm start            # foreground HTTPS server on https://localhost:3443 (PORT env overrides)
npm run start:bg     # background; logs to server.log, PID in .server.pid
npm run stop
npm run reset-db     # wipe data, restore seed users (or POST /api/test/reset while running)
```

There is no build, lint, or test setup in this app. Requires Node >= 22.5 (uses built-in `node:sqlite`, no native deps) and `openssl` on PATH.

Seed accounts: `user@example.com` / `Password123!`, `admin@example.com` / `Admin123!`.

## Architecture

- `server.js`: single Express app wrapped in an HTTPS server (HTTPS-only is a requirement). Defines page routes, the JSON API (`/api/...`) and the test-only `POST /api/test/reset`. Page routes for `/dashboard` and `/test-cases*` redirect to `/login` when unauthenticated; API routes return 401.
- `db.js`: opens SQLite (`data/sandbox.db`, override with `DB_FILE`), creates the schema, seeds users, exports `reset()`. Passwords are scrypt-hashed.
- `cert.js`: generates a self-signed cert into `certs/` via `openssl` on first start.
- Auth is a hand-rolled session: random token in a `sessions` table, sent as an `HttpOnly; Secure` cookie. "Remember me" is the only difference: a persistent cookie with 30-day expiry versus a browser-session cookie with 1-day server expiry. `/api/admin/login` shares the login handler but requires role `admin`.
- Frontend is static HTML in `public/` (no templating) plus plain JS in `public/static/`. `app.js` holds shared helpers and renders the top nav client-side from `/api/me`. Each page has its own script (`login.js`, `new-test-case.js`, ...).

## Conventions that matter for e2e testing

- Validation is duplicated on purpose: client-side (forms use `novalidate` and custom JS so errors are consistent and invalid login submits make **no** backend call) and server-side.
- New Test Case form: Enter key must not submit or add a step unless the whole form is valid (handled in `new-test-case.js`).
- Elements use `data-testid` attributes and the placeholders/labels named in the requirements ("Email", "Password", "Title", "Description", "Expected Result", "Test step"). Preserve these when editing markup. Never rename or remove an existing `data-testid`; adding ids is safe.
- Seed data, the reset endpoint, and the self-signed cert (tests need `ignoreHTTPSErrors: true`) are part of the testing contract; don't remove them. `/api/test/reset` is unauthenticated by design (sandbox only).
- Don't change app behaviour to make a test pass; only add `data-testid` attributes. Report bugs instead of hiding them.
