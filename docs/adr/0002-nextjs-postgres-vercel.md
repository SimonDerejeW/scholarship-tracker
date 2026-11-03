# Next.js + Postgres on Vercel, Google sign-in

One TypeScript Next.js codebase serves both frontend and backend, backed by a hosted Postgres (Neon or Supabase) and deployed to Vercel, with Better Auth handling Google sign-in. One codebase and one deploy keeps it maintainable for a solo builder, everything fits free tiers for a handful of users, and Google sign-in means friends don't need another password.

## Considered Options

- Python backend (Django/FastAPI) with a separate frontend: fine, but two codebases and two deploys for no gain here.
- Auth.js instead of Better Auth: also viable; Better Auth was the owner's preference.
