# mathlabfun v2

Math drills with daily streaks, super streaks, and a spacebucks economy. v2 is
a clean rewrite of the original [mathlabfun](https://github.com/) on a modern
stack:

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 with an `outerspace` theme baked into `@theme` tokens
- Supabase (Auth + Postgres + RLS) via `@supabase/ssr`
- Zustand + TanStack Query for client state and server cache
- Vitest + Testing Library
- Husky + lint-staged + Prettier
- Deploys to Vercel

## Getting started

```bash
pnpm install
cp .env.example .env.local      # then fill in your Supabase credentials
pnpm dev
```

## Environment

Required (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:

- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never expose in the browser.

## Database setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   This creates `profiles` and `answers` tables with RLS that pins each row to
   `auth.uid()`, plus a trigger that auto-creates a profile row on signup.
3. Optionally enable Google OAuth in **Authentication → Providers** and add
   `http://localhost:3000/auth/callback` (and your production URL) to the
   allowed redirect list.

## Project layout

```
src/
  app/                          # Next.js App Router
    layout.tsx                  # outerspace shell, header
    page.tsx                    # home + game list
    login/                      # email auth (server actions)
    auth/callback/route.ts      # Supabase OAuth callback
    games/[slug]/page.tsx       # registry-driven game route
  components/                   # React components (server + client)
  lib/
    games/
      types.ts                  # shared game types
      registry.ts               # slug → GameModule lookup
      math-attack/
        rules.ts                # pure logic: question, hint, reward
        rules.test.ts           # Vitest unit tests
        component.tsx           # game UI
        index.ts                # GameModule export
    supabase/                   # browser + server clients, profile helpers
    utils.ts
  proxy.ts                      # Next 16 proxy: refresh Supabase session per request
supabase/
  migrations/                   # SQL run against your Supabase project
```

## Adding a new game

1. Create `src/lib/games/<slug>/`:
    - `rules.ts` (pure functions)
    - `rules.test.ts` (Vitest)
    - `component.tsx` (`"use client"`, accepts `GameComponentProps`)
    - `index.ts` exporting `{ meta, Component }: GameModule`
2. Register it in `src/lib/games/registry.ts`.
3. It's now reachable at `/games/<slug>`.

## Scripts

```bash
pnpm dev            # start the Next.js dev server
pnpm build          # production build
pnpm start          # serve the production build
pnpm test           # vitest run (game rules etc.)
pnpm test:watch     # vitest watch mode
pnpm test:ui        # vitest + UI
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm format         # prettier --write .
```

## Deploying

This is a Next.js 16 + Supabase app — Vercel is the path of least resistance.

1. Push the repo to GitHub.
2. **Import** it on [vercel.com](https://vercel.com).
3. Add the same env vars from `.env.local` in the Vercel project settings.
4. Add your production URL to the Supabase allowed redirect list.

Cloudflare Pages and Netlify both work but offer no advantage here.

## Migration notes from v1

What was kept (in spirit, not in code):

- Math Attack's reward rules — base by operation, negative-result bonus, level
  bonus, super streak doubling — ported to a pure function in
  `src/lib/games/math-attack/rules.ts` and unit-tested.
- The user/profile data model: daily streak, super streak, score streak, best
  score streak, totals, spacebucks. Now lives in `public.profiles` with RLS.
- The outerspace visual language. SCSS-generated stars are replaced by a
  single fixed background with stacked radial gradients.

What was dropped:

- Create React App, react-scripts, Redux Toolkit, redux-persist, Firebase
  (Auth + Firestore), `services/firebase.js`, `services/challenges.ts`,
  legacy `Game`, `Game2`, `Game3` drafts, and the SCSS pipeline.
