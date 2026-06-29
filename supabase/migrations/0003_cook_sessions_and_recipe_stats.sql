-- Recipe Tracker: derive "times cooked" from cooking history.
--
-- A cook session records one occasion a recipe was cooked. The times-cooked
-- count is no longer a stored column — it is derived as the number of
-- cook_sessions for a recipe and exposed through the recipes_with_stats view,
-- so the recipes list can read each recipe + its count in a single query.

create table if not exists public.cook_sessions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  cooked_at timestamptz not null default now(),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists cook_sessions_recipe_id_idx on public.cook_sessions (recipe_id);

-- Row Level Security
alter table public.cook_sessions enable row level security;

create policy "Allow read access to cook sessions"
  on public.cook_sessions for select
  using (true);

-- times_cooked is now derived from cook_sessions, not stored on the recipe.
alter table public.recipes drop column if exists times_cooked;

-- View: every recipe together with its derived times-cooked count.
-- A LEFT JOIN keeps recipes with zero sessions (count = 0).
create or replace view public.recipes_with_stats as
  select
    r.*,
    count(cs.id)::int as times_cooked
  from public.recipes r
  left join public.cook_sessions cs on cs.recipe_id = r.id
  group by r.id;
