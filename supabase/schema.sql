-- Pathshala: syllabus schema
-- Run this in the Supabase SQL editor (or `supabase db push` if you use the CLI).
-- Designed to grow: more units per subject and more semesters later are just
-- more rows, not schema changes.

create extension if not exists "pgcrypto";

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  semester int not null default 1,
  sort_order int not null default 0
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  unit_number text not null,
  unit_label text not null,
  unit_title text not null,
  learning_outcomes text default '',
  summary text default '',
  keywords text default '',
  self_assessment_questions text default '',
  references_text text default '',
  raw_text text default '',
  sort_order int not null default 0,
  unique (subject_id, unit_number)
);

create table if not exists subtopics (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  number text not null,
  title text not null,
  content text not null default '',
  sort_order int not null default 0,
  unique (unit_id, number)
);

-- Personal-use app, single implicit user: progress is not scoped to an
-- auth user on purpose. If this ever needs to support more than one
-- person, add a user_id column + Supabase Auth + RLS at that point.
create table if not exists progress (
  subtopic_id uuid primary key references subtopics(id) on delete cascade,
  status text not null default 'unread' check (status in ('unread', 'read', 'practiced')),
  updated_at timestamptz not null default now()
);

create table if not exists streak (
  id int primary key default 1 check (id = 1),
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date
);

insert into streak (id, current_streak, longest_streak, last_active_date)
values (1, 0, 0, null)
on conflict (id) do nothing;

-- Since this is a single-user personal app with no login wall, keep RLS
-- off for simplicity (it's the default). If you ever add Auth, turn RLS
-- on for all four tables and scope `progress`/`streak` by user_id.
