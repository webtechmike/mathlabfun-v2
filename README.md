# mathlabfun v2

Math drills with daily streaks, super streaks, and a spacebucks economy. v2 is
a clean rewrite of the original mathlabfun on a modern stack:

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 with an `outerspace` theme baked into `@theme` tokens
- Supabase (Auth + Postgres + RLS) via `@supabase/ssr`
- Zustand + TanStack Query for client state and server cache
- Vitest + Testing Library
- Husky + lint-staged + Prettier
- Deployed to Vercel at [mathlab.fun](https://mathlab.fun)

See [`ROADMAP.md`](./ROADMAP.md) for what's next, architectural decisions, and
design space for upcoming features (level progression, paid tier, etc.).

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
  app/                              # Next.js App Router
    layout.tsx                      # outerspace shell, header, isolated stacking
    page.tsx                        # home + game list
    login/                          # email auth (server actions)
    auth/callback/route.ts          # Supabase OAuth callback
    games/[slug]/page.tsx           # registry-driven game route
  components/
    Header.tsx                      # server component, fetches profile
    UserMenu.tsx                    # client dropdown for sign-out
    OuterspaceBackground.tsx        # seeded star field
    Spaceship.tsx                   # pure CSS spaceship
    SpacebucksIcon.tsx              # icon with rewards tooltip
  lib/
    games/
      types.ts                      # shared game types
      registry.ts                   # slug → GameModule lookup
      shared/
        question.ts                 # generateQuestion, pickOperation, etc.
        question.test.ts
        reward.ts                   # canonical calculateReward
        reward.test.ts
      math-attack/
        component.tsx               # typed-input game UI
        index.ts                    # GameModule export
      tap-attack/
        rules.ts                    # generateChoices + halved reward
        rules.test.ts
        component.tsx               # multiple-choice game UI
        index.ts
    supabase/                       # browser + server clients, profile helpers
    utils.ts
  proxy.ts                          # Next 16 proxy: refresh Supabase session
supabase/
  migrations/                       # SQL run against your Supabase project
```

## Games

Two games are live:

| Slug          | Title       | Input               | Reward ratio | Notes                                                          |
| ------------- | ----------- | ------------------- | ------------ | -------------------------------------------------------------- |
| `math-attack` | Math Attack | typed number        | 1×           | Tests recall. Has hint button.                                 |
| `tap-attack`  | Tap Attack  | multiple-choice tap | 0.5×         | Mobile-friendly. 3 choices for L1–L3, 4 for L4+. Auto-advance. |

The Tap Attack reward is computed as `Math.max(1, Math.floor(canonical / 2))`,
so the two games stay in lockstep automatically if the canonical economy
changes.

## Adding a new game

1. Create `src/lib/games/<slug>/`:
    - `component.tsx` (`"use client"`, accepts `GameComponentProps`)
    - `index.ts` exporting `{ meta, Component }: GameModule`
    - Game-specific `rules.ts` + `rules.test.ts` if the game has its own
      mechanics (e.g. distractor generation, custom reward scaling)
2. Reuse `src/lib/games/shared/`:
    - `question.ts` for question generation and operator helpers
    - `reward.ts` for the canonical spacebucks calculation (wrap it if your
      game has different economics)
3. Register the module in `src/lib/games/registry.ts`.
4. It's now reachable at `/games/<slug>` and rendered as a card on `/`.

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

## Deploying to Vercel

This is a Next.js 16 + Supabase app — Vercel is the supported deploy target
and the host for [mathlab.fun](https://mathlab.fun).

1. Push the repo to GitHub.
2. **Import** it on [vercel.com](https://vercel.com).
3. In **Project Settings → Build and Deployment**:
    - Framework Preset = **Next.js**
    - Root Directory = blank
    - Install/Build/Output command overrides = **off**
    - Node.js Version = **22.x**
4. Add env vars from `.env.local` to **Production, Preview, and Development**
   scopes.
5. Add your production URL to the Supabase **Authentication → URL Configuration**
   allowed redirect list, and set the Site URL to it.

### Pinning the toolchain

To prevent "fails almost instantly" deploys caused by pnpm version drift
between local and CI:

```json
// package.json
{
    "packageManager": "pnpm@10.18.0",
    "engines": { "node": "22.x" }
}
```

The `pnpm-workspace.yaml` uses `ignoredBuiltDependencies`, which is a pnpm
v10+ field. Without pinning, Vercel may pick pnpm 9 and the install step dies
before producing any meaningful log output.

### DNS migration notes (one-time)

The domain was migrated from Netlify (v1) to Vercel (v2). The records that
work:

- Apex `mathlab.fun` → `A` to `76.76.21.21`
- `www.mathlab.fun` → `CNAME` to `cname.vercel-dns.com`

Removed from Netlify: the custom-domain claim. The v1 site is archived but
not reachable from `mathlab.fun`.

## Migration notes from v1

What was kept (in spirit, not in code):

- Math Attack's reward rules — base by operation, negative-result bonus, level
  bonus, super streak doubling — ported to a pure function in
  `src/lib/games/shared/reward.ts` and unit-tested.
- The user/profile data model: daily streak, super streak, score streak, best
  score streak, totals, spacebucks. Now lives in `public.profiles` with RLS.
- The outerspace visual language. SCSS-generated stars are replaced by a
  single box-shadow-scattered star field.

What was dropped:

- Create React App, react-scripts, Redux Toolkit, redux-persist, Firebase
  (Auth + Firestore), `services/firebase.js`, `services/challenges.ts`,
  legacy `Game`, `Game2`, `Game3` drafts, and the SCSS pipeline.
