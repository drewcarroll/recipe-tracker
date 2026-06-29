-- Recipe Tracker: initial normalized schema.
--
-- Six tables: users, recipes, ingredients, prep_items, steps, cook_sessions.
--
-- Auth is lightweight for now (idea.md §0): a user is identified by a
-- `username`. Data is scoped to that username. The model is shaped so it can
-- later map onto Supabase Auth without a rewrite — see `users.auth_user_id`.
--
-- A cook session (idea.md §4) is an IMMUTABLE snapshot of what was actually
-- cooked. It captures the recipe name and the full recipe contents
-- (ingredients / prep / steps) as JSON at cook time, so later edits to a
-- recipe — including AI-approved changes — never alter past history. The
-- session therefore does not depend on the live recipe rows: deleting a recipe
-- nulls the back-reference but leaves the snapshot intact.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users — lightweight account keyed by username.
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  username text primary key,
  -- Reserved for the future Supabase Auth migration: once real auth exists,
  -- this maps a username to its auth.users(id). Nullable until then.
  auth_user_id uuid unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- recipes — owned by a user (referenced by username, per idea.md §0).
-- ---------------------------------------------------------------------------
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Pastel palette key + curated fun icon key (idea.md §2).
  color text not null,
  icon text not null,
  -- The "user ref". References users.username; updates cascade so a future
  -- rename stays consistent. Will later resolve to an auth user via
  -- users.auth_user_id.
  username text not null references public.users (username)
    on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_username_idx on public.recipes (username);

-- ---------------------------------------------------------------------------
-- ingredients — quantity + unit + name, belonging to a recipe (idea.md §2).
-- ---------------------------------------------------------------------------
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  -- Free-form to allow "1/2", "a pinch", "2-3", etc.
  quantity text not null default '',
  unit text not null default '',
  name text not null,
  -- Stable display ordering within the recipe.
  position integer not null default 0
);

create index if not exists ingredients_recipe_id_idx on public.ingredients (recipe_id);

-- ---------------------------------------------------------------------------
-- prep_items — standalone tasks done BEFORE the cook (idea.md §2).
-- ---------------------------------------------------------------------------
create table if not exists public.prep_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  text text not null,
  -- Ordinal position ("order" is a reserved word in SQL).
  position integer not null default 0
);

create index if not exists prep_items_recipe_id_idx on public.prep_items (recipe_id);

-- ---------------------------------------------------------------------------
-- steps — sequential cook steps (idea.md §2).
-- ---------------------------------------------------------------------------
create table if not exists public.steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  text text not null,
  -- Ordinal position ("order" is a reserved word in SQL).
  position integer not null default 0
);

create index if not exists steps_recipe_id_idx on public.steps (recipe_id);

-- ---------------------------------------------------------------------------
-- cook_sessions — immutable snapshot of one cook (idea.md §4).
--
-- Independent of the live recipe rows: recipe_id is a soft back-reference
-- (nulled if the recipe is deleted) while recipe_name + snapshot preserve
-- exactly what was cooked. snapshot holds the ingredients / prep / steps
-- as-at-cook-time; deviations holds in-the-moment changes the cook recorded.
-- ---------------------------------------------------------------------------
create table if not exists public.cook_sessions (
  id uuid primary key default gen_random_uuid(),
  -- Soft reference to the originating recipe; preserved as history even after
  -- the recipe is deleted.
  recipe_id uuid references public.recipes (id) on delete set null,
  -- Denormalized, frozen at cook time so history survives recipe deletion.
  recipe_name text not null,
  -- Full recipe contents as-at-cook-time:
  -- { "ingredients": [...], "prep": [...], "steps": [...] }.
  snapshot jsonb not null default '{}'::jsonb,
  -- Things done differently during the cook (idea.md §3); array of notes.
  deviations jsonb not null default '[]'::jsonb,
  -- Free-text "notes for next time".
  notes text not null default '',
  -- How long the cook took, in seconds.
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  -- Who cooked it. Kept as history (nulled, not deleted) if the user is removed.
  username text references public.users (username)
    on update cascade on delete set null,
  -- When the cook happened.
  cooked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists cook_sessions_recipe_id_idx on public.cook_sessions (recipe_id);
create index if not exists cook_sessions_username_idx on public.cook_sessions (username);
create index if not exists cook_sessions_cooked_at_idx on public.cook_sessions (cooked_at desc);

-- ---------------------------------------------------------------------------
-- recipes_with_stats — every recipe plus its derived "Times cooked" count
-- (idea.md §4: the count is the number of cook_sessions for the recipe, never
-- a stored column). LEFT JOIN keeps recipes with zero sessions (count = 0).
-- ---------------------------------------------------------------------------
create or replace view public.recipes_with_stats as
  select
    r.*,
    count(cs.id)::int as times_cooked
  from public.recipes r
  left join public.cook_sessions cs on cs.recipe_id = r.id
  group by r.id;

-- ---------------------------------------------------------------------------
-- Row Level Security.
-- Enabled on every table. Permissive read policies for now (auth is
-- lightweight); tighten once real Supabase Auth is wired up via
-- users.auth_user_id. Writes go through the server (service role key), which
-- bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.recipes enable row level security;
alter table public.ingredients enable row level security;
alter table public.prep_items enable row level security;
alter table public.steps enable row level security;
alter table public.cook_sessions enable row level security;

create policy "Allow read access to users" on public.users for select using (true);
create policy "Allow read access to recipes" on public.recipes for select using (true);
create policy "Allow read access to ingredients" on public.ingredients for select using (true);
create policy "Allow read access to prep_items" on public.prep_items for select using (true);
create policy "Allow read access to steps" on public.steps for select using (true);
create policy "Allow read access to cook_sessions" on public.cook_sessions for select using (true);
