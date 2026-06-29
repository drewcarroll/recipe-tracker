# Recipe Tracker — Product Idea & Spec

> Mobile-web–first recipe app. Must work great in a phone browser (responsive, mobile-first; not a PWA for now). Built on the existing stack: **React, Next.js, Supabase, TypeScript**. AI features use **Anthropic Claude** via a **backend route** (API key never exposed client-side).

---

## 0. Auth (Lightweight, for now)

- No real authentication yet. User types a **username** → they're "in" their account.
- All data (recipes, history) is scoped to that username.
- Real auth (Supabase Auth) later, so model data with a `user` reference that can later map to an auth user.

## 1. Navigation

Navbar with **three tabs**:

1. **Recipes** — manage your recipes.
2. **Cook** — the default / center tab. The fun, primary action.
3. **History** — log of past cook sessions.

## 2. Recipes Page

### Recipe List ("Your Recipes")

- Vertical list of recipe cards. Each shows: **name**, a **color** (fixed **pastel** palette), an **icon** (curated, **colorful & fun** set), and **"Times cooked: X"** (derived from History).
- A **(+ New Recipe)** button.

### + New Recipe — two options

1. **Create from Scratch** — blank recipe; user edits normally.
2. **Create using AI** — "Paste in the recipe..." textarea → backend Claude call → structured recipe (ingredients w/ quantity+unit, prep, steps). **Saves directly** into a new recipe the user can then edit.

### Recipe Detail Page

- Basic info at top + **Edit/Delete** (change name, color, icon; delete recipe).
- Three sections:
  1. **Ingredients** — editable list; each has **quantity + unit + name**.
  2. **Prep** — standalone tasks done BEFORE the cook (chop veg, mix bowls). Editable list.
  3. **Steps** — sequential cook steps; add/edit/reorder.

## 3. Cook Page (default/center)

- Big, fun **COOK** button. Flow:
  1. Select a recipe.
  2. **Ingredients check** → Next.
  3. **Prep first** (guided).
  4. **Steps** guided one-by-one until done.
  5. **Congrats!** screen.
- **Deviation:** during the cook the user can record doing something differently (e.g., "used less X"). Stored on the session. Not bound to the recipe.
- **Notes for next time:** free-text after finishing → Submit → backend Claude generates **suggested changes** (name/ingredients/prep/steps). User **Approves/Rejects** each. **Approved changes apply directly** to the current recipe.

## 4. History Page

- Log of past **sessions**, each an **immutable snapshot** of what was actually cooked: recipe ref + name, ingredients/prep/steps as-at-cook-time, **deviations**, **notes**, **time it took**, timestamp.
- User can **delete** sessions.
- **"Times cooked: X"** = count of that recipe's sessions.
- **Rule:** editing a recipe (incl. AI-approved changes) must NOT alter past history entries.

## 5. Visual / UX

- Mobile-first; pastel palette; colorful fun icons; fun guided cook.

## 6. Tech Notes

- React, Next.js, Supabase (Postgres), TypeScript.
- Tables: users (username), recipes, ingredients, prep_items, steps, cook_sessions (snapshot + deviations + notes + duration).
- Claude for (a) paste→structured recipe, (b) post-cook suggestions. **Backend API routes only.**

## 7. Future

- Real auth (Supabase Auth) later. Possible PWA/offline later.
