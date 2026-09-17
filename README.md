# Pathshala

A syllabus-first study companion for BCA Semester 1 — built from your own
unit material, nothing added, nothing assumed.

This is the first working build from the Phase 1 research/requirements doc.
Read that doc for the reasoning behind each choice below; this README is
just "how do I run it."

## What's here right now

- All 8 Semester 1 subjects, Unit 1, parsed from your uploaded PDFs into
  structured data (`data/seed/`) — real content, not placeholders.
- Runs immediately with **zero setup** using that local seed data.
- Supabase schema + a seed script, ready for when you want content stored
  in a backend instead (so adding future units doesn't mean a new deploy).
- An AI assistant scoped to whatever unit is open (needs a free Gemini
  API key to actually respond — the UI works without one, it just can't
  reach the model).
- Read-aloud via the browser's built-in text-to-speech, with lock-screen
  controls wired up (Media Session API) — per your call to try this
  before building a pre-generated-audio pipeline.
- Installable as a PWA on Android and desktop.

## Quickstart

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you should immediately see the 8 subjects
with real content, no configuration needed. Progress and streaks are
saved in your browser's localStorage for now (per device, not synced
yet — see "What's deliberately not done yet" below).

## Connecting Supabase (optional, for now)

The app works fine without this. Connect it when you're ready to add
content without redeploying, or want progress synced across devices.

1. Create a free Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Copy `.env.local.example` to `.env.local` and fill in your project's
   URL and anon key (Project Settings → API), plus the service role key.
4. Push the seed content in: `node scripts/seed.mjs`
5. Restart `npm run dev` — the app now reads from Supabase instead of
   the bundled JSON automatically (see `lib/content.ts` — it checks for
   the env vars and falls back to local data if they're missing).

Supabase's free tier pauses a project after 7 days with no activity —
the first request after that takes 10-30s to wake it back up. Fine for
a personal study app; restore manually from the dashboard, or ping it
on a schedule if that ever bothers you.

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
