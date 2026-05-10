# AggieHelp MVP

AggieHelp is a UC Davis mutual-aid hackathon app for small, safe assists. The frontend runs on Next.js and Vercel, while Supabase stores persistent app data for profiles, requests, offers, matches, messages, safe spots, and reports.

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

## Privacy And Moderation

Blocked messages are privacy-filtered:
- Sender sees their blocked content and the safety reason.
- Receiver sees only a generic AggieHelp safety notice.
- Admin sees full moderation logs, including blocked content and reason.

Precise device location is only used in the current browser session to calculate SafeMeet ETA. AggieHelp does not store live device location in Supabase.

## Demo Flow

1. Sign in as Tanmmay and create or use the seeded grocery request.
2. Sign in as Maya and offer help.
3. Sign in as Tanmmay and accept Maya's offer.
4. Sign in as Maya and confirm the match.
5. Test ConsentShare by toggling both users' consent.
6. Test SafeMeet, including the optional current-location ETA button.
7. Test blocked contact info before ConsentShare is enabled.
8. Test blocked alcohol and private-room messages.
9. Sign in as Priya or Admin to review blocked messages and reports.

## Notes

- Realtime subscriptions are enabled for requests, offers, matches, messages, and reports.
- SafeMeet uses public safe spots, Haversine distance, and a 3 mph walking speed.
- Google Maps links use normal URLs and do not require a Maps API key.
