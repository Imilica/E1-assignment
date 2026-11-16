# Sandbox App

Minimal Node.js + SQLite web app used as a target for future Playwright e2e tests.
Implements the Login and New Test Case features from `../requirements/Sandbox Requirements and Setup.pdf`.

## Requirements
- Node.js **22.5+** (uses built-in `node:sqlite`; developed on Node 24)
- `openssl` on PATH (to generate the self-signed HTTPS certificate on first start)

## Install
```bash
cd sandbox-app
npm install
```

## Start / Stop
| Action | Command |
|---|---|
| Start (foreground, Ctrl+C to stop) | `npm start` |
| Start in background | `npm run start:bg` (logs in `server.log`, PID in `.server.pid`) |
| Stop background server | `npm run stop` |
| Reset DB to seed state | `npm run reset-db` (or `POST /api/test/reset` while running) |

The app runs at **https://localhost:3443** (HTTPS only; override with `PORT=4000 npm start`).
The certificate is self-signed (generated into `certs/`), so browsers warn.
In Playwright set `use: { baseURL: 'https://localhost:3443', ignoreHTTPSErrors: true }`.

Data lives in `data/sandbox.db` (override with `DB_FILE`). Delete `data/` for a fresh DB.

## Seed accounts
| Role | Email | Password |
|---|---|---|
| user | `user@example.com` | `Password123!` |
| admin | `admin@example.com` | `Admin123!` |

## Pages
| URL | Description |
|---|---|
| `/login` | Email/password login, Remember me, Forgot password link |
| `/admin/login` | Same form; only admin accounts are accepted |
| `/forgot-password` | Email form; always shows a generic confirmation (no email is sent) |
| `/dashboard` | Landing page after login (requires login) |
| `/test-cases` | List of test cases, with delete (requires login) |
| `/test-cases/new` | New test case form (requires login) |

Top menu: logged out → **Login**, **Admin**; logged in → **Dashboard**, **Test Cases**, **Logout**.

## Behaviour notes (requirement mapping)
- **Login validation** is client-side: empty/invalid email or empty password shows an error and makes **no** backend call. Failed login shows a banner error.
- **Remember me**: checked → persistent cookie, 30-day session; unchecked → browser-session cookie, 1-day server expiry.
- Passwords are masked; cookie is `HttpOnly; Secure`.
- **New test case**: Title, Expected Result and at least one Test Step are required. **Add Test Step** adds rows (order preserved, blank steps dropped). Automated toggle defaults to off. Pressing Enter submits only if the form is valid (and never adds a step). Back arrow returns to the previous page / list. Submit redirects to the list.

## Test helpers
Elements carry `data-testid` attributes (e.g. `email`, `password`, `remember-me`, `login-submit`, `login-error`, `title`, `expected-result`, `add-step`, `step-input`, `automated`, `submit`, `test-case-row`). Form fields also have placeholders/labels (“Email”, “Password”, “Title”, “Description”, “Expected Result”, “Test step”), so `getByLabel`/`getByPlaceholder` work.

`POST /api/test/reset` resets the database — call it in `beforeEach` for isolation. **Sandbox only; never expose publicly.**

## Layout
```
server.js       Express HTTPS server, routes and API
db.js           SQLite schema, seed, reset
cert.js         Self-signed cert generation
public/         HTML pages; public/static has CSS and JS
scripts/        start.sh, stop.sh, reset-db.js
```
