-- Replace per-cook "deviations" with a single free-form notepad.
--
-- The "did something differently" list (idea.md §3) is dropped in favour of one
-- free-text notepad per cook: while cooking, the user can open a single notepad
-- (available from the ingredients, prep and cook stages) and jot anything down.
-- Those notes are frozen onto the immutable cook session and shown in history.
--
-- Distinct from `notes` ("notes for next time"), which is written after the cook
-- on the congrats screen and feeds the AI recipe-suggestion flow.

alter table public.cook_sessions
  drop column if exists deviations;

alter table public.cook_sessions
  add column if not exists cook_notes text not null default '';
