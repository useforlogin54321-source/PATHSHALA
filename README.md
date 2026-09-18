# Pathshala

A syllabus-first study companion for BCA Semester 1 — built from your own
unit material, nothing added, nothing assumed.

This is the first working build from the Phase 1 research/requirements doc.
Read that doc for the reasoning behind each choice below; this README is
just "how do I run it."

## What's here right now

- All 8 Semester 1 subjects, Unit 1, parsed from your uploaded PDFs into
  structured data — real content, not placeholders.
- **Connected to a live Supabase project** (`pathshala`, Mumbai region,
  free tier) — subjects/units/subtopics are seeded and live. The app
  reads from Supabase when configured, and falls back to the bundled
  local JSON in `data/seed/` (or if Supabase is ever unreachable, e.g.
  waking up from an idle pause) so it never hard-fails.
- An AI assistant scoped to whatever unit is open (needs a free Gemini
  API key to actually respond — the UI works without one, it just can't
  reach the model).
- Read-aloud via the browser's built-in text-to-speech, with lock-screen
  controls wired up (Media Session API) — per your call to try this
  before building a pre-generated-audio pipeline.
- Installable as a PWA on Android and desktop.
- Fonts (Source Serif 4, Public Sans) are self-hosted via Fontsource -
  no external font host dependency at all.

## Quickstart

```bash
npm install
npm run dev
```

Open http://localhost:3000. With `.env.local` present (see below) it
reads live from Supabase; without it, it runs on the bundled seed data.
Either way it works with zero setup. Progress and streaks are saved in
your browser's localStorage for now (per device, not synced yet — see
"What's deliberately not done yet" below).

## Supabase

Already set up and seeded - project `pathshala` in your account, region
ap-south-1, free tier ($0/month). `supabase/schema.sql` is the schema
that's live there. To point your own local copy or a fresh deploy at it,
copy `.env.local.example` to `.env.local` and fill in the project URL and
anon key from Supabase's dashboard (Project Settings → API).

Free tier auto-pauses a project after 7 days with no activity - the
first request after that takes 10-30s to wake it back up (the app falls
back to local content in the meantime rather than erroring). Restore
manually from the dashboard, or ping it on a schedule if that bothers
you.

## Deploying to Vercel

1. Go to https://vercel.com/new and import the `PATHSHALA` GitHub repo
   (already pushed there).
2. Add these Environment Variables in the Vercel project settings before
   the first deploy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (once you have one - see below)
   (Same values as in your local `.env.local`.)
3. Deploy. Vercel auto-detects Next.js, no build config needed.
4. Once it's live, open the URL on your Android phone and use the
   browser's "Install app" / "Add to Home Screen" option to install it
   as a PWA.

Every push to `main` auto-deploys after this is set up once.

## Adding the AI assistant

1. Get a free key at https://aistudio.google.com/apikey (no card needed).
2. Add it to `.env.local` as `GEMINI_API_KEY`.
3. Restart the dev server.

The assistant (`app/api/chat/route.ts`) only ever sees the currently-open
unit's text plus a system prompt that requires it to stay inside that
material and say plainly when something's out of scope — see the Phase 1
doc's "AI Architecture" section for the reasoning.

## Adding more units and subjects later

Today's content lives in `data/seed/*.json`, one file per subject, each
holding one unit. `scripts/parse_units.py` is the tool that produced
them - it looks for the pattern your source PDFs already use: numbered
headings like `1.1 Title`, plus Summary/Keywords/Self-Assessment
Questions/References sections. When you have a new unit PDF:

1. Put it in a folder the same way STUDY.zip was laid out
   (`<Subject Name>/something.pdf`), then run:
   ```bash
   python3 scripts/parse_units.py /path/to/that/folder
   ```
   This needs `pdftotext` on your machine (part of `poppler-utils` -
   `winget install poppler` or the poppler Windows binaries work fine).
2. Add the new subject to `data/seed/index.json` if it's not already
   there (slug, display name, order).
3. Spot-check the generated JSON against the source PDF - the parser is
   best-effort, not guaranteed (see below).
4. If you're on Supabase, re-run `node scripts/seed.mjs` - it upserts,
   so re-running is safe.

This is the one real technical-debt item flagged in the Phase 1 doc:
worth turning into a proper AI-assisted import step once 2-3 more units
exist to prove the pattern, rather than staying fully manual forever.

## What's deliberately not done yet

- **Progress/streak sync across devices.** Currently localStorage only
  (per device). The Supabase `progress`/`streak` tables exist in the
  schema but aren't wired up yet — straightforward follow-up once
  you've confirmed the core app feels right.
- **No content-ingestion tool beyond the manual steps above.**
- **No auth.** This is a personal, unpublished app with no login wall by
  design (see Phase 1 doc). Add Supabase Auth + RLS if that ever changes.

## A note on the parsed content

The unit text was auto-extracted from your PDFs with a heuristic parser,
not retyped by hand. It's accurate in spot-checks, but worth skimming
each subject once against the source PDF before you fully trust it for
revision — text extraction can occasionally mangle tables, bullet
symbols, or diagrams described as ASCII art (the Flowcharts section in
C Programming is one place to check).

## Project structure

```
app/                  Pages and the AI chat API route
components/           UI components (nav, reading pane, chat, read-aloud)
lib/                  Data access (Supabase + local fallback), types, progress/streak
data/seed/            The 8 subjects' Unit 1 content, parsed and structured
supabase/schema.sql   Table definitions
scripts/seed.mjs      Pushes data/seed/ into Supabase
```
