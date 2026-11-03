# Scholarship Tracker

A shared tracker for a small circle of friends applying to master's Programmes and Scholarships. See [`GLOSSARY.md`](GLOSSARY.md) for vocabulary and [`docs/adr/`](docs/adr/) for decisions.

Next.js + TypeScript, Postgres via Drizzle, Better Auth with Google sign-in (ADR 0002).

## Run locally

Prerequisites: Node 24+, and either Docker or any Postgres you can point `DATABASE_URL` at.

One-time setup:

```sh
npm install
cp .env.example .env   # then fill in the values (see below)
docker compose up -d   # local Postgres matching the default DATABASE_URL
```

Then, every time:

```sh
npm run dev
```

This applies any pending migrations, then starts the app on http://localhost:3000.

## Environment variables

All are required; `.env.example` documents each one.

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `ADMIN_EMAIL` | The Admin's email; this person can always sign in (ADR 0004) |
| `BETTER_AUTH_SECRET` | Random secret for signing sessions: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | The app's public URL, e.g. `http://localhost:3000` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth client credentials |

### Google OAuth credentials (a human step)

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type **Web application**.
2. Add the authorised redirect URI `${BETTER_AUTH_URL}/api/auth/callback/google`, e.g. `http://localhost:3000/api/auth/callback/google`.
3. Copy the client ID and secret into `.env`.

Signing in with `ADMIN_EMAIL` lands on Upcoming; any other Google account sees the "not invited" page.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Migrate the database, then start the dev server |
| `npm test` | Run the core-module tests (in-process Postgres via PGlite; no setup needed) |
| `npm run typecheck` | Generate route types and type-check |
| `npm run lint` | Lint |
| `npm run db:generate` | Generate a migration after changing `src/core/schema.ts` |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL` |

## Layout

- `src/core/`: the core module. Every rule lives here, and it is the only code that talks to the database. Tests exercise its public operations against a real Postgres (PGlite), each test starting from a clean, migrated database (`src/core/testing/harness.ts`).
- `src/server/`: thin adapters wiring the core module, Better Auth and the session into Next.js.
- `src/app/`: pages. Everything except `/sign-in` and `/not-invited` requires a session.
- `drizzle/`: versioned SQL migrations.
