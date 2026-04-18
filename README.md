# SpendGuard

SpendGuard is a Next.js subscription management app for small businesses. It tracks recurring subscriptions, payment history, renewal timing, duplicate tools, underused software, and AI-generated savings recommendations.

## What is implemented

- Next.js App Router UI with a responsive operational dashboard
- Supabase-ready auth flow: login, registration, password reset, and account bootstrap
- Demo mode that works immediately without credentials
- Subscription CRUD, payment logging, department management, alert center, charts, and CSV export
- Groq-backed analysis route with a local heuristic fallback
- Supabase PostgreSQL schema and seed SQL
- Vercel-friendly API routes, including a cron refresh endpoint for alerts and projected payments

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in the values you want to use.

3. Start the app:

```bash
npm run dev
```

If you skip the Supabase and Groq environment variables, SpendGuard runs in demo mode and keeps the seeded workspace in local storage.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `CRON_SECRET`

## Supabase database

- Apply [db/schema.sql](C:\Users\T14s\Desktop\spend guard\db\schema.sql)
- Optionally load [db/seed.sql](C:\Users\T14s\Desktop\spend guard\db\seed.sql)

The app expects the tables created by `schema.sql`, plus the standard `auth.users` table from Supabase Auth.

## Notes

- Demo mode is immediate and safe for local review.
- Live mode uses Supabase Auth plus business-scoped row-level security.
- `/api/analyze` returns structured recommendations and gracefully falls back to local heuristics if Groq is unavailable.
- `/api/cron/refresh` is ready for a Vercel cron job once `CRON_SECRET` and Supabase admin credentials are configured.
