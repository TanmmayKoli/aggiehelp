# CampusKind / AggieHelp MVP

CampusKind is a UC Davis mutual-aid hackathon app for small, voluntary assists. It uses Supabase Auth email/password login, profile roles from `public.profiles`, realtime request/offer/match/chat updates, ConsentShare contact consent, SafeMeet public meetup suggestions, and an admin moderation dashboard.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## Supabase Setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run `supabase/schema.sql`.
3. In Supabase Auth, create these email/password users:
   - `tanmmay@ucdavis.edu` / `Tanmmay123!`
   - `maya@ucdavis.edu` / `Maya123!`
   - `alex@ucdavis.edu` / `Alex123!`
   - `priya@ucdavis.edu` / `Priya123!`
   - `admin@ucdavis.edu` / `Admin123!`
4. After the Auth users exist, run `supabase/seed-profiles.sql`.

`profiles.id` references `auth.users(id)`, so profile seeding must happen after the Auth accounts are created.

## Environment Variables

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Add the same variables in Vercel under Project Settings -> Environment Variables.

Do not add service-role keys to the frontend. This app only uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Demo Flow

1. Open the deployed Vercel URL. It should show the login page.
2. Quick-fill Tanmmay and sign in.
3. Create a safe request or use the seeded grocery request.
4. Sign out, quick-fill Maya or Alex, and offer help on an open request.
5. Sign back in as Tanmmay and accept the offer.
6. Sign in as the helper and confirm the match.
7. In the active match, toggle both ConsentShare buttons to enable contact sharing.
8. Send chat messages. Contact details are blocked until both users consent, and private meetup language is always blocked.
9. Sign in as Priya or Admin to review blocked messages, reports, requests, offers, matches, and profiles.

## Notes

- Missing Supabase env vars show a clean setup screen instead of crashing.
- Realtime subscriptions are enabled for requests, offers, matches, messages, and reports.
- SafeMeet estimates use Haversine distance and a 3 mph walking speed.
