-- Recipe Tracker: track how many times each recipe has been cooked.
alter table public.recipes
  add column if not exists times_cooked integer not null default 0
    check (times_cooked >= 0);
