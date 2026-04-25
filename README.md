# SpendGuard

SpendGuard is a Next.js subscription management app for small businesses. It tracks recurring vendor subscriptions, renewal timing, duplicate vendors, department spend, and category spend.

## What is implemented

- Next.js App Router UI with a responsive operational dashboard
- Supabase-ready auth flow: login, registration, password reset, and account bootstrap
- Vendor-based subscription CRUD, department management, charts, and CSV export
- Groq-backed AI chat with a local fallback response
- Supabase PostgreSQL schema, destructive cleanup migration, and seed SQL

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

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` legacy fallback
- `SUPABASE_SERVICE_ROLE_KEY` legacy fallback
- `GROQ_API_KEY`
- `GROQ_MODEL`

## Supabase database

- For a fresh database, apply `db/schema.sql`.
- For an existing database with the previous payments, alerts, analysis, or tool-name columns, apply `db/migrate-remove-payments-alerts-analysis.sql`.
- Optionally load `db/seed.sql`.

The app expects the tables created by `schema.sql`, plus the standard `auth.users` table from Supabase Auth.

## Notes

- Subscription names now come from `vendors.name`; `subscriptions.tool_name` has been removed.
- Payments, alerts, and saved AI analyses have been removed from the database and UI.
- `/api/chat` uses Groq when configured and returns a local workspace readout when Groq is unavailable.
