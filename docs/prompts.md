# Prompt History

Short summary of the prompts given to Claude Code while building this solution, in order. The prompts are paraphrased, not verbatim. Outcomes are what actually ended up in the repository.

## Summary

| # | Prompt (summary) | Outcome |
|---|---|---|
| 1 | `/init`: analyse the repo and create a `CLAUDE.md`. | A `CLAUDE.md` already existed, so improvements were proposed instead of a rewrite: project state, commands, architecture notes. Applied after approval. |
| 2 | Add the official Playwright MCP server at project level. | `.mcp.json` with `@playwright/mcp`, so the live app can be inspected from Claude Code. |
| 3 | Merge the `.claude` folder of the separate Sandbox project into this project (the app was already copied; do not copy its `docs/`). | App-specific `sandbox-app/CLAUDE.md` and `.claude/settings.local.json` added. The Sandbox `rules.md` was deliberately not copied because it conflicts with this project's `rules.md`. |
| 4 | What test ids does the app have, and what are the options for naming them? | 46 existing ids listed with three options. Decision: keep the app's existing ids; `rules.md`, the plan and `CLAUDE.md` were updated to match. |
| 5 | Start the sandbox app. | App started in the background on https://localhost:3443. |
| 6 | Where is the run information (URL, accounts, commands) documented? | Pointed to `sandbox-app/CLAUDE.md`. |
| 7 | Main task: following `rules.md` and the test plan, scaffold and implement the whole framework: setup, UI tests, API tests, HTML report with screenshots and videos for failures, sample runs, run instructions. Do not claim passes that were not executed. | Playwright + TypeScript framework (page objects, fixtures, seeded faker factories), 35 UI tests, 32 API tests, HTML and JUnit reporting. `rules.md` forbade API tests, so this was raised and the decision was to allow them and update `rules.md`. Failures found while running (toggle click blocked by its slider) were fixed by adding test ids, not `force: true`. |
| 8 | Push the repo to GitHub (screenshot of the quick-setup page). | Repo initialised and committed. The first push failed for lack of credentials; later pushes succeeded. |
| 9 | Create `docs/test-cases.md` from `docs/test-plan.md`. | Detailed UI and API test cases with traceability. |
| 10 | Create `docs/test-report.md`: run the suite, publish results (HTML/JUnit), include passing and failing evidence. | Fresh runs (68 passed; 202 passed in a 3x parallel stability run). HTML report, JUnit and logs published. No real failures existed, so failure artifacts were captured with a labelled throwaway failing test that was then deleted. |
| 11 | Rename the evidence folder to `reports` and update every path. | `docs/reports/`; `.gitignore` changed to `/reports/` so the published folder is not ignored. |
| 12 | Commit and push; then fix the links broken by moving `test-plan.md` into `docs/`. | Two commits pushed to `main`. |
| 13 | Checklist review of required deliverables; then: delete TC-LOGIN-09, move `rules.md` into `docs/`, put the run guide there, update all links. | TC-LOGIN-09 removed from all docs. `docs/rules.md` and `docs/run-guide.md` added; README shortened; link check found no broken links. |
| 14 | Complete the README run instructions and say whether they are true. | Every documented command was run and passed (including the app starting itself). One unverified tip was removed. |
| 15 | Checklist review of quality requirements; then: create this prompts file. | This document. |

## Decisions that came out of the prompts

- Existing `data-testid` values are kept; new ones follow the app's naming (prompt 4).
- API tests are allowed in a separate `api` project; UI tests stay UI-only (prompt 7).
- Only ids were added to the app (slider and step ids); no application behaviour was changed (prompt 7).
- TC-LOGIN-09 (account lockout) is not part of the suite because the requirements PDF does not define the rule (prompt 13).
- All documents live in `docs/`; the root keeps only a short README and `CLAUDE.md` (prompt 13).
