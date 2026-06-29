-- Recipe Tracker: initial schema
create extension if not exists "pgcrypto";

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  servings integer not null check (servings > 0),
  prep_time_minutes integer not null check (prep_time_minutes >= 0),
  cook_time_minutes integer not null check (cook_time_minutes >= 0),
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_created_at_idx on public.recipes (created_at desc);

-- Row Level Security
alter table public.recipes enable row level security;

-- Example permissive read policy for the anon role; tighten for production.
create policy "Allow read access to recipes"
  on public.recipes for select
  using (true);
