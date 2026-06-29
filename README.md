# 🍳 Recipe Tracker

A production-ready starter for tracking, scaling and organising recipes — built with
**Next.js (App Router)**, **React**, **Supabase** and **TypeScript**, structured around
**Clean Architecture**.

## Features

- Create, fetch and list recipes via a typed HTTP API
- Domain-driven core with self-validating entities & value objects
- Supabase (Postgres) persistence behind a swappable repository interface
- Strict layer boundaries enforced via ESLint import rules
- Type-safe end to end with TypeScript path aliases per layer

## Tech Stack

| Concern        | Choice                          |
| -------------- | ------------------------------- |
| Framework      | Next.js 14 (App Router)         |
| UI             | React 18                        |
| Database/Auth  | Supabase (Postgres)             |
| Language       | TypeScript                      |
| Validation     | Zod (interface-layer schemas)   |
| Lint/Format    | ESLint + Prettier               |

## Getting Started

### 1. Prerequisites

- Node.js >= 18.17
- A Supabase project (free tier is fine)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

| Variable                        | Description                                  |
| ------------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your project URL                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon public key (RLS protected)              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key — **server only, secret**   |

### 4. Apply the database schema

Run the SQL in `supabase/migrations/0001_initial_schema.sql` against your Supabase
project (SQL editor or `supabase db push`).

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

| Method | Path                | Description          |
| ------ | ------------------- | -------------------- |
| GET    | `/api/recipes`      | List all recipes     |
| POST   | `/api/recipes`      | Create a recipe      |
| GET    | `/api/recipes/:id`  | Fetch a recipe by id |

Example create payload:

```json
{
  "title": "Pancakes",
  "description": "Fluffy weekend pancakes",
  "ingredients": [
    { "name": "Flour", "quantity": 200, "unit": "g" },
    { "name": "Milk", "quantity": 300, "unit": "ml" }
  ],
  "steps": ["Mix dry ingredients", "Whisk in milk", "Cook on a hot pan"],
  "servings": 4,
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 15,
  "difficulty": "easy"
}
```

## Scripts

| Script                 | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the dev server              |
| `npm run build`        | Production build                  |
| `npm run start`        | Run the production build          |
| `npm run lint`         | Lint (incl. layer import rules)   |
| `npm run typecheck`    | Type-check with `tsc --noEmit`    |
| `npm run format`       | Format with Prettier              |

## Clean Architecture

Source code lives in `src/` and is split into four layers. **Dependencies only point
inward** — outer layers depend on inner layers, never the reverse.

```
interfaces  ──►  application  ──►  domain
infrastructure ─►  application  ──►  domain
```

### `src/domain/` — the business core

Pure business rules. Imports **nothing** from outside itself.

- `entities/Recipe.ts` — the Recipe aggregate root, protects its own invariants
- `value-objects/` — `RecipeId`, `Ingredient` (immutable, validated, compared by value)
- `repositories/RecipeRepository.ts` — repository **interface** (describes WHAT, not HOW)
- `services/RecipeScalingService.ts` — domain service for scaling ingredient quantities
- `errors/DomainError.ts` — domain exceptions

### `src/application/` — use cases

Orchestrates the domain to fulfil application use cases. Imports only from `domain/`.

- `use-cases/` — one class per use case, each with an `execute(dto)` method
  - `CreateRecipeUseCase`, `GetRecipeUseCase`, `ListRecipesUseCase`
- `dtos/` — input/output contracts (plain data, never entities)
- `ports/IdGenerator.ts` — port the infrastructure must implement
- `mappers/RecipeMapper.ts` — maps domain entities → DTOs

### `src/infrastructure/` — implementation details

All I/O. Implements interfaces/ports defined inward. Imports from `domain/` and `application/`.

- `supabase/` — Supabase client factory + DB row types (never leak past this layer)
- `repositories/SupabaseRecipeRepository.ts` — fulfils `RecipeRepository`, maps rows ↔ entities
- `services/CryptoIdGenerator.ts` — fulfils the `IdGenerator` port
- `config/env.ts` — the only place env vars are read
- `composition/` — the **composition root** (DI container) wiring everything together

### `src/interfaces/` — entry points / adapters

Translates external input into use case calls and use case output into responses.
Imports only from `application/`. Contains no business logic.

- `http/RecipeController.ts` — thin controller: validate → call use case → shape response
- `http/schemas/` — Zod input validation (schema-level only)
- `http/errorHandler.ts` — maps errors to HTTP status codes

### Framework boundary — `app/`

The Next.js App Router lives in `app/`. Route handlers are framework entry points that
pull a fully-wired controller from the infrastructure composition root and delegate.
They contain no logic.

### Why this matters

- **Swappable infrastructure**: replace Supabase with another DB by writing a new
  `RecipeRepository` implementation — the domain and use cases never change.
- **Testable core**: domain and application layers have zero framework/IO dependencies.
- **Enforced boundaries**: ESLint `no-restricted-imports` rules fail the build if a layer
  imports something it shouldn't.

> See `CLAUDE.md` and `architecture.json` at the repo root, plus the per-layer
> `CLAUDE.md` files, for the full architecture contract.
