# Test Cases

Derived from [test-plan.md](test-plan.md). Source requirements: [../requirements/Sandbox_Requirements.pdf](../requirements/Sandbox_Requirements.pdf). Conventions: [../rules.md](../rules.md).

Priority: P1 = must pass for release, P2 = important, P3 = nice to have.
Status: **Automated** = implemented and passing; **Pending** = blocked, not implemented.

Common preconditions
- App running at `https://localhost:3443` (self-signed certificate), seeded database.
- UI login tests start logged out. New Test Case tests start logged in as the standard user (`USER_EMAIL` / `USER_PASSWORD`).
- Test data comes from seeded faker factories; each created test case has a unique title and is deleted after the test.

## Summary

| ID | Feature | Title | Type | Priority | Status | Automated in |
|---|---|---|---|---|---|---|
| TC-LOGIN-01 | Login | Successful login redirects to dashboard | Positive | P1 | Automated | tests/login/login.spec.ts |
| TC-LOGIN-02 | Login | Invalid credentials show an error | Negative | P1 | Automated | tests/login/login.spec.ts |
| TC-LOGIN-03 | Login | Empty fields: frontend validation, no backend call | Negative | P1 | Automated | tests/login/login.spec.ts |
| TC-LOGIN-04 | Login | Invalid email formats are rejected | Negative | P2 | Automated | tests/login/login.spec.ts |
| TC-LOGIN-05 | Login | Password masked and HTTPS only | Security | P1 | Automated | tests/login/login.spec.ts |
| TC-LOGIN-06 | Login | Remember me keeps the session persistent | Positive | P2 | Automated | tests/login/login.spec.ts |
| TC-LOGIN-07 | Login | Navigation links | Navigation | P2 | Automated | tests/login/login.spec.ts |
| TC-LOGIN-08 | Login | Labels, placeholders and toggle visibility | Usability | P3 | Automated | tests/login/login.spec.ts |
| TC-LOGIN-09 | Login | Repeated failed attempts (lock behaviour) | Negative | P2 | Pending | not in the PDF |
| TC-NTC-01 | New Test Case | Create with all fields and see it in the list | Positive | P1 | Automated | tests/test-case/new-test-case.spec.ts |
| TC-NTC-02 | New Test Case | Create with required fields only | Positive | P1 | Automated | tests/test-case/new-test-case.spec.ts |
| TC-NTC-03 | New Test Case | Required fields empty | Negative | P1 | Automated | tests/test-case/new-test-case.spec.ts |
| TC-NTC-04 | New Test Case | At least one step required | Negative | P1 | Automated | tests/test-case/new-test-case.spec.ts |
| TC-NTC-05 | New Test Case | Multiple steps keep their order | Positive | P1 | Automated | tests/test-case/new-test-case.spec.ts |
| TC-NTC-06 | New Test Case | Automated toggle | Positive | P2 | Automated | tests/test-case/new-test-case.spec.ts |
| TC-NTC-07 | New Test Case | Enter key does not submit an invalid form | Negative | P2 | Automated | tests/test-case/new-test-case.spec.ts |
| TC-NTC-08 | New Test Case | Back arrow returns to the list | Navigation | P2 | Automated | tests/test-case/new-test-case.spec.ts |
| TC-NTC-09 | New Test Case | Placeholders are correct | Usability | P3 | Automated | tests/test-case/new-test-case.spec.ts |
| TC-NTC-10 | New Test Case | All created test cases are listed | Positive | P1 | Automated | tests/test-case/new-test-case.spec.ts |
| API-AUTH-01..08 | API | Login, admin login, session and forgot-password endpoints | API | P1/P2 | Automated | tests/api/auth.api.spec.ts |
| API-TC-01..05 | API | Test case endpoints | API | P1/P2 | Automated | tests/api/test-cases.api.spec.ts |

## Login

### TC-LOGIN-01: Successful login redirects to dashboard
- Priority: P1. Requirement: Login button submits; redirect on correct credentials.
- Preconditions: user is logged out.
- Data: valid credentials from `USER_EMAIL` / `USER_PASSWORD`.
- Steps:
  1. Open `/login`.
  2. Enter the email and password.
  3. Click Login.
- Expected: URL is `/dashboard`; the dashboard title is visible and the welcome text shows the user's email; no login error is shown.

### TC-LOGIN-02: Invalid credentials show an error
- Priority: P1. Requirement: show an error message when login fails.
- Data: (a) well-formed email and password from `userFactory()` that do not exist; (b) valid email with a wrong password.
- Steps: open `/login`; enter the data; click Login.
- Expected: error banner "Invalid email or password." is visible; URL stays `/login`; the email field keeps its value; the password field stays masked.

### TC-LOGIN-03: Empty fields trigger frontend validation, no backend call
- Priority: P1. Requirement: frontend validation, no backend call on empty fields; password required.
- Cases:

| Case | Email | Password | Email error | Password error |
|---|---|---|---|---|
| both empty | empty | empty | "Email is required." | "Password is required." |
| email only | filled | empty | none | "Password is required." |
| password only | empty | filled | "Email is required." | none |

- Steps: open `/login`; fill per the case; click Login.
- Expected: the listed field errors are shown; URL stays `/login`; no request to the login API is sent.

### TC-LOGIN-04: Invalid email formats are rejected
- Priority: P2. Requirement: email must be a valid format.
- Data: `plainaddress`, `user@`, `@domain.com`, `user@domain`, `user name@domain.com` (one test each), with a valid-looking password.
- Steps: enter the email and password; click Login.
- Expected: "Please enter a valid email address." is shown; URL stays `/login`; no login request is sent.

### TC-LOGIN-05: Password masked and HTTPS only
- Priority: P1. Requirement: HTTPS only; masked password.
- Steps: open `/login`; inspect the password input; request the same page over `http://`.
- Expected: page URL starts with `https://`; the password input has `type="password"`; the plain `http://` request is refused.

### TC-LOGIN-06: Remember me keeps the session persistent
- Priority: P2. Requirement: Remember me toggle.
- Steps and expected:
  1. Open `/login`: the toggle is off by default.
  2. Log in with Remember me ON: the `session` cookie is persistent and expires about 30 days ahead.
  3. In a fresh session log in with Remember me OFF: the `session` cookie is a browser-session cookie (no expiry).

### TC-LOGIN-07: Navigation links
- Priority: P2. Requirement: Forgot Password, Admin and Login links.
- Steps and expected:
  - Click "Forgot password?": URL is `/forgot-password`, the reset form is visible.
  - Click Admin in the top menu: URL is `/admin/login`, the submit button reads "Login as admin".
  - From the admin login click Login in the top menu: URL is `/login`.

### TC-LOGIN-08: Labels, placeholders and toggle visibility
- Priority: P3. Requirement: labels and placeholders "Email" and "Password"; Remember me toggle.
- Expected: email and password inputs have placeholders "Email" and "Password" and accessible names (labels) "Email" and "Password"; the Remember me toggle is visible and enabled.

### TC-LOGIN-09: Repeated failed attempts (lock behaviour) — Pending
- Priority: P2. Not specified in the PDF, so not implemented.
- Draft: submit wrong credentials N times; expect a lock/throttle message and a valid login to be refused.
- Needs from the product owner: the number of attempts and the message.

## New Test Case

### TC-NTC-01: Create with all fields and see it in the list
- Priority: P1. Requirement: create a test case; Submit saves it in the list.
- Data: `testCaseFactory` with title, description, expected result, 3 steps, Automated ON.
- Steps: open the New Test Case page; fill all fields; add steps; turn Automated on; click Submit.
- Expected: user lands on `/test-cases`; exactly one row has the generated title and shows the description, expected result, the 3 steps in order and Automated "Yes".

### TC-NTC-02: Create with required fields only
- Priority: P1. Requirement: Description is optional.
- Data: empty description, 1 step.
- Expected: saved; one row with the title, expected result and the single step appears in the list.

### TC-NTC-03: Required fields empty
- Priority: P1. Requirement: Title, Expected Result and Test Steps are mandatory.
- Cases (each overrides only the fields listed):

| Case | Title error | Expected Result error | Steps error |
|---|---|---|---|
| empty Title | "Title is required." | none | none |
| empty Expected Result | none | "Expected Result is required." | none |
| empty Title and Expected Result | "Title is required." | "Expected Result is required." | none |
| all required fields empty | "Title is required." | "Expected Result is required." | "At least one test step is required." |

- Steps: fill per the case; click Submit.
- Expected: the listed errors are shown; URL stays `/test-cases/new`; no save request is sent.

### TC-NTC-04: At least one step required
- Priority: P1. Requirement: at least one test step.
- Data: valid title and expected result, the step left empty.
- Expected: "At least one test step is required." is shown; no title or expected result error; URL unchanged; nothing saved.

### TC-NTC-05: Multiple steps keep their order
- Priority: P1. Requirement: Add Test Step; steps are ordered and preserved.
- Data: 5 distinct ordered steps.
- Steps: fill step 1; click Add Test Step four times, filling each new step in order; check the form; Submit.
- Expected: before Submit there are 5 step inputs in the entered order; after save the list row shows the 5 steps in the same order.

### TC-NTC-06: Automated toggle
- Priority: P2. Requirement: Automated toggle (default off).
- Expected:
  - The toggle is off by default; a case saved with it off shows Automated "No".
  - A case saved with the toggle turned on shows Automated "Yes".

### TC-NTC-07: Enter key
- Priority: P2. Requirement: Enter must not accidentally submit an invalid form.
- Cases and expected:
  - Title filled, rest empty, press Enter in Title: "Expected Result is required." is shown; URL unchanged; no step added; nothing saved.
  - Title and first step filled, press Enter in the step field: same outcome.
  - All fields valid, press Enter in Title: form submits and the case appears in the list (observed behaviour).

### TC-NTC-08: Back arrow
- Priority: P2. Requirement: back arrow returns to the Test Case List.
- Steps: fill title and expected result; click the back arrow.
- Expected: URL is `/test-cases`; no row with the entered title exists; no save request was sent.

### TC-NTC-09: Placeholders
- Priority: P3. Requirement: placeholders.
- Expected: placeholders are "Title", "Description", "Expected Result" and "Test step".

### TC-NTC-10: All created test cases are listed
- Priority: P1. Requirement: all test cases are listed.
- Data: 3 test cases with unique seeded titles.
- Steps: create the 3 cases one after another; open the list.
- Expected: each title appears exactly once. (The total row count is not asserted because tests run in parallel against one shared list.)

## API test cases

Not in the PDF; derived from `sandbox-app/server.js` (see [test-plan.md](test-plan.md)). Preconditions: seeded database; "logged in" means a session obtained through `POST /api/login`.

### Auth (`tests/api/auth.api.spec.ts`)

| ID | Request | Expected |
|---|---|---|
| API-AUTH-01 | `POST /api/login` valid credentials | 200, body `{redirect: "/dashboard", role: "user"}`, `Set-Cookie: session=...; HttpOnly; Secure` |
| API-AUTH-02 | `POST /api/login` with `remember` true / false | true: `Max-Age=2592000` (30 days); false: no `Max-Age` |
| API-AUTH-03 | `POST /api/login` unknown user; valid email with wrong password | 401, `{error: "Invalid email or password."}`, no cookie |
| API-AUTH-04 | `POST /api/login` with each invalid email, missing email, empty password | 400; "Please enter a valid email address." or "Password is required." |
| API-AUTH-05 | `POST /api/admin/login` with admin; with a normal user | admin: 200, role `admin`; user: 401 |
| API-AUTH-06 | `GET /api/me` logged out; logged in | 401 `{error: "Not authenticated"}`; 200 with email and role |
| API-AUTH-07 | `POST /api/logout` then `GET /api/me` | logout 200 `{ok: true}`; `/api/me` then 401 |
| API-AUTH-08 | `POST /api/forgot-password` known and unknown email; invalid email | both valid emails: 200 with the same message; invalid: 400 |

### Test cases (`tests/api/test-cases.api.spec.ts`)

| ID | Request | Expected |
|---|---|---|
| API-TC-01 | `GET`, `POST`, `DELETE /api/test-cases` logged out | 401 each |
| API-TC-02 | `POST` valid case with 4 steps and `automated: true`, then `GET` | 201 with id and the submitted fields, steps in order; the list contains exactly that case |
| API-TC-03 | `POST` with missing/blank title, missing/blank expected result, missing/empty/blank/non-list steps, everything missing | 400 `{errors: {...}}` with the matching per-field messages; nothing saved |
| API-TC-04 | `POST` with padded title, no description, no `automated`, steps `["  first  ", "", "second"]` | 201; title trimmed, description `""`, automated `false`, steps `["first", "second"]` |
| API-TC-05 | `DELETE /api/test-cases/:id` for an existing id; for an unknown id | 200 `{ok: true}` and the case is gone from the list; unknown id also 200 (observed) |

Not covered: `POST /api/test/reset` (wipes the shared database, unsafe with parallel tests).

## Traceability

| PDF requirement | Test cases |
|---|---|
| Login with email/password, redirect | TC-LOGIN-01, API-AUTH-01 |
| Error message on failure | TC-LOGIN-02, API-AUTH-03 (TC-LOGIN-09 pending) |
| Remember me | TC-LOGIN-06, TC-LOGIN-08, API-AUTH-02 |
| Forgot Password / Admin / Login links | TC-LOGIN-07, API-AUTH-05, API-AUTH-08 |
| No backend call on empty fields | TC-LOGIN-03, TC-LOGIN-04 |
| Email valid format; password required; clear errors | TC-LOGIN-03, TC-LOGIN-04, API-AUTH-04 |
| HTTPS only; masked password | TC-LOGIN-05, API-AUTH-01 |
| Labels and placeholders | TC-LOGIN-08 |
| Create test case with required/optional fields | TC-NTC-01, TC-NTC-02, API-TC-02, API-TC-04 |
| Add multiple steps, ordered and preserved | TC-NTC-05, API-TC-02 |
| Automated toggle default off | TC-NTC-06, API-TC-04 |
| Submit saves in the list | TC-NTC-01, TC-NTC-10, API-TC-02 |
| Back arrow | TC-NTC-08 |
| Mandatory fields and error messages | TC-NTC-03, TC-NTC-04, API-TC-03 |
| Enter key does not submit invalid form | TC-NTC-07 |
| Placeholders | TC-NTC-09 |
