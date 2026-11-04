# Contributing

Thanks for helping out. This is a small side project for a circle of friends, so keep changes proportionate: fix what matters, skip gold-plating.

Most work here is done with an AI coding agent (Claude Code) and two skill packs:

- **[mattpocock-skills](https://github.com/mattpocock/skills)** for the engineering workflow: specs, tickets, building, reviewing.
- **[Impeccable](https://github.com/pbakaus/impeccable)** for the UI: critique, audits and polish against the design system.

You can contribute without an agent too. The rules in [Code rules](#code-rules) and [UI rules](#ui-rules) apply either way.

## Setup

1. Get the app running locally: follow [Run locally](README.md#run-locally) in the README.
2. Install both skill packs in Claude Code (once per machine):

   ```sh
   claude plugin install mattpocock-skills@claude-plugins-official
   ```

   Then, inside Claude Code, run `/plugin marketplace add pbakaus/impeccable`, open `/plugin` and install **Impeccable**. When it offers its design hook, say yes: it checks every UI file the agent edits.

Don't run `/setup-matt-pocock-skills`. This repo is already configured; the settings live in [`docs/agents/`](docs/agents/):

- Issues and specs live as GitHub Issues on this repo, worked with the `gh` CLI ([`issue-tracker.md`](docs/agents/issue-tracker.md)).
- Triage uses the five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` ([`triage-labels.md`](docs/agents/triage-labels.md)).
- Domain docs are one [`GLOSSARY.md`](GLOSSARY.md) plus ADRs in [`docs/adr/`](docs/adr/) ([`domain.md`](docs/agents/domain.md)).

## Read first

| File | What it holds |
| --- | --- |
| [`GLOSSARY.md`](GLOSSARY.md) | The words we use: Programme, Scholarship, Application, Deadline, Requirement, Member, Allowlist and so on. Use them in code, issues and UI copy, and avoid the synonyms it lists. |
| [`docs/adr/`](docs/adr/) | Decisions already made. If your change contradicts one, say so in the issue or PR rather than silently overriding it. |
| [`PRODUCT.md`](PRODUCT.md) | Who the app is for and what it must do. |
| [`DESIGN.md`](DESIGN.md) | The design system: the Departures Board, dark only. |
| [`CLAUDE.md`](CLAUDE.md) | Standing instructions the agent follows in this repo. |

## The workflow

Each step names the mattpocock-skills command that does it. Not sure which one fits? Ask `/ask-matt`.

### 1. Shape the idea

- **`/grill-with-docs`**: talk the idea through. The agent asks hard questions, sharpens terms and updates `GLOSSARY.md` and the ADRs as decisions land.
- **`/prototype`**: when a question is easier to answer by trying it, build a throwaway prototype (a state model, or a few UI variations side by side).
- **`/research`**: when you need facts from docs or other primary sources, it writes up cited findings as a Markdown file.

### 2. Write it down

- **`/to-spec`**: turns the conversation into a spec and publishes it as a GitHub Issue (see #1 for the v1 spec).
- **`/to-tickets`**: breaks a spec into thin, end-to-end tickets as sub-issues, with blocking links between them (see #2 to #13).
- **`/triage`**: labels incoming issues. `ready-for-agent` means fully specified and safe for an agent to build unattended; `ready-for-human` means a person should do it.

Small fixes don't need a spec. A clear issue is enough.

### 3. Build

- **`/implement`**: builds one ticket (or a few). It drives `/tdd` at the agreed seams and finishes with `/code-review` before committing.
- **`/implement-spec`**: builds a whole spec on one branch, running tickets in parallel where the blocking links allow.
- **`/tdd`**: red, green, refactor, one vertical slice at a time. Use it directly for focused changes.
- **`/diagnosing-bugs`**: for anything broken, flaky or slow. It reproduces the bug as a failing check first, then fixes it and keeps the check as a regression test.
- **`/codebase-design`** and **`/domain-modeling`**: when a change touches a module's interface or the domain vocabulary.

### 4. Review and open a PR

- **`/code-review`**: reviews your diff against this repo's standards and against the issue it came from.
- **`/pr`**: writes the PR body: what changed, evidence that it works, and how risky it is to merge.

Work on a branch and open a pull request against `main`. **Merging to `main` deploys to production** (see [Deploying](README.md#deploying)).

### Other skills you may want

- **`/wizard`**: generates a step-by-step bash script for manual setup work only a human can do (third-party dashboards, credentials, migrations).
- **`/improve-codebase-architecture`**: finds places to simplify the code's structure.
- **`/retro`**: after a session, suggests improvements to the agent's setup.

## UI rules

All UI follows [`DESIGN.md`](DESIGN.md): **The Departures Board, dark only**.

- **Components come from shadcn**, through the shadcn MCP server in [`.mcp.json`](.mcp.json), and are restyled to the design tokens. Never ship the stock shadcn look, and never hard-code colours.
- **UI copy uses `GLOSSARY.md` terms.** The departures-board metaphor is visual only, so don't write "gates", "flights" or "boarding" into the copy.
- **Extend existing patterns** before inventing new ones.

### Using Impeccable

Impeccable is the design skill. Invoke it as `/impeccable <command> [target]`. The ones we use:

| Command | When |
| --- | --- |
| `/impeccable shape <feature>` | Before building a new screen: plan its UX and layout. |
| `/impeccable critique <route>` | Design review of a screen, with scored findings. |
| `/impeccable audit <route>` | Technical checks: accessibility, performance, responsive behaviour. |
| `/impeccable polish <route>` | Final quality pass before shipping. |
| `/impeccable document` | Rewrite `DESIGN.md` from the shipped UI after a deliberate design change. |

Run `/impeccable` with no command to get a menu.

**Don't run Impeccable inside an `/implement` or `/implement-spec` build.** Its design rounds stop and wait for you to choose, which stalls an unattended build. During builds the agent follows `DESIGN.md` directly. Run Impeccable yourself at review points: after a UI ticket lands, and once more before a release.

Impeccable keeps its project config and design mocks in [`.impeccable/`](.impeccable/). Review screenshots and hook caches there are git-ignored.

## Code rules

- **`src/core/` is the core module.** Every rule lives there, and it's the only code that talks to the database. Pages in `src/app/` and adapters in `src/server/` stay thin.
- **Test through the core module's public operations**, against a real Postgres (PGlite, in-process). Each test starts from a clean, migrated database; see [`src/core/testing/harness.ts`](src/core/testing/harness.ts).
- **Schema changes:** edit [`src/core/schema.ts`](src/core/schema.ts), run `npm run db:generate`, and commit the new migration in [`drizzle/`](drizzle/). Keep migrations additive where you can: production runs them before the new build goes live, so the old code briefly runs against the new schema.
- **Record decisions** that someone would otherwise re-litigate as a new ADR in [`docs/adr/`](docs/adr/) (`/domain-modeling` helps).
- **This is Next.js 16.** It differs from what agents were trained on; read [`AGENTS.md`](AGENTS.md) before touching framework code.

## Before you open a PR

```sh
npm test            # core-module tests
npm run typecheck
npm run lint
```

All three must pass. For UI changes, also look at the screens you touched in the browser, at phone and desktop widths.

## Commits and PRs

- **One topic per commit**, written in the imperative and naming the issue it closes, e.g. `Upcoming home screen (#8)`.
- **Use glossary terms** in commit messages, issue titles and PR descriptions.
- **Never commit `.env` or any `.env*.local` file.** Production secrets live only in Vercel.
