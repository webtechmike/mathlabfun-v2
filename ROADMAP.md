# Roadmap

A living document for what's built, what's next, and the design space for the
big upcoming features. Update as decisions are made — past entries stay so
future-you (or a future agent) can see _why_ a choice was made, not just
what.

## Status (May 2026)

- Repo migrated from CRA + Firebase (v1) to Next.js 16 + Supabase (v2).
- Production live at [mathlab.fun](https://mathlab.fun) via Vercel.
- Auth via Supabase email/password; Google OAuth wired but not enabled.
- Two games shipped: `math-attack` (typed input) and `tap-attack` (multiple
  choice, mobile-friendly).
- DB schema (`supabase/migrations/0001_init.sql`) models profile + per-answer
  history with RLS pinned to `auth.uid()`.
- 45 unit tests on game rules (`pnpm test`).

### Known gaps

- **Nothing persists yet.** Spacebucks, streaks, and best scores are
  component state. They reset on refresh.
- **Super streak is always `false`.** Both games hardcode
  `isSuperStreakActive: false`. No daily-login detection.
- **`level` is a query-string param.** `?level=4` works but there's no UI to
  change levels and nothing stores the player's current level.
- **No profile page.** Can sign in/out but can't see lifetime stats.
- **No age/parent fields at signup.** Needed for COPPA-aware payments and
  the planned upsell flow.
- **No component tests.** `@testing-library/react` is installed but unused.

## Architectural decisions log

Lightweight ADRs. When you make a non-obvious call, add a row.

| #   | Decision                                              | Reasoning                                                                                                                                                                            |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Next.js 16 App Router (not Pages)                     | Server components let the header fetch profile data without an extra API call. The new `proxy.ts` (formerly `middleware.ts`) refreshes Supabase sessions per request.                |
| 2   | Supabase over Firebase                                | Postgres + RLS keeps rules in one place. `@supabase/ssr` makes auth work cleanly across server components, client components, and proxy.                                             |
| 3   | Tailwind v4 with `@theme` tokens                      | The `outerspace` palette lives in CSS variables, so design tokens are consumed identically by Tailwind utilities and any raw CSS.                                                    |
| 4   | Game registry pattern                                 | `lib/games/registry.ts` maps slug → `GameModule`. Adding a game is "drop a folder, register it" — no router changes.                                                                 |
| 5   | Hoist shared math to `lib/games/shared/`              | `question.ts` and `reward.ts` are canonical. Per-game `rules.ts` files only exist when a game has its own mechanics (e.g. `tap-attack/rules.ts` for distractors and reward scaling). |
| 6   | Tap Attack as a separate slug, not a math-attack mode | Recall and recognition are different skills. Separate slugs mean separate stats, separate URLs, separate leaderboards.                                                               |
| 7   | Tap reward = `floor(canonical / 2)` (min 1)           | Recognition is easier than recall, so the economy reflects that — and it auto-tracks any future change to the canonical reward.                                                      |
| 8   | `level` as a stand-in for age                         | Until signup collects an age field, level drives the choice-count heuristic in Tap Attack (3 for L1–L3, 4 for L4+). Swap to `min(ageCap, levelCap)` when age exists.                 |
| 9   | `isolate` on `<body>`                                 | Without it, the `-z-10` star background escapes to the root stacking context and gets painted over by body's background. Documented because it's non-obvious.                        |
| 10  | Pin `packageManager` + Node 22.x                      | `pnpm-workspace.yaml` uses `ignoredBuiltDependencies` (pnpm v10+). Without pinning, Vercel may pick pnpm 9 and silently fail install.                                                |

## Next steps (ordered)

The order reflects what unlocks the most other work, not what's easiest.

### 1. Persist game state to Supabase

Without this, every other feature is fake. Concretely:

- After each answered question, write a row to `public.answers` (table
  already exists) and update the player's `public.profiles` (spacebucks,
  score streak, best score streak, totals).
- The shared `calculateReward` is the right hook point — wrap both game
  components' submit handlers in a "record answer" call that talks to a
  server action or Supabase client.
- Hydrate initial state from the profile so the stat bar shows real numbers,
  not zeros.
- Decide: optimistic UI (update component state immediately, sync in
  background) or pessimistic (wait for Supabase). Optimistic is way better
  for the game feel.

**Risk:** without rate limits or server-side validation, a clever user can
POST `correct: true` for every "question". The `answers` table should be
written via a server action that re-computes the reward server-side using the
shared `calculateReward` (which is already pure and portable).

### 2. Daily streak + super streak

Profile already has `daily_streak` and `super_streak` columns. Needed:

- On every sign-in (or first authed page load of the day in the user's
  timezone), check `last_login_date`. If it's yesterday's date, increment
  `daily_streak`. If it's older, reset to 1.
- `super_streak` = 1 if `daily_streak >= 3`, else 0.
- Both games should read `isSuperStreakActive: profile.super_streak >= 1`
  when calling `calculateReward`. Right now they pass `false`.
- Visualize the streak somewhere — maybe a fire icon counter in the header,
  or a small "🔥 3 days" widget on the home page.

### 3. Profile page

`/profile` (or wherever). Shows:

- Display name, email, member-since.
- Current daily streak, super streak status.
- Lifetime totals from `public.profiles`.
- Per-game best score streak (requires schema change — see "DB schema work"
  below).
- Sign-out button (already in the user menu, but also live here).

### 4. Level progression — PARTIALLY SHIPPED — see [Design: Level progression](#design-level-progression)

**Shipped (Jun 2026):** a 12-level curriculum in `src/lib/games/shared/levels.ts`
(gentle pre-K bottom, per-level timers), in-game progression, and parent-facing
level selector + lock in Tap Attack. The remaining piece is **persistence** —
level + lock state reset on refresh (blocked on #1).

### 5. Age and parent fields at signup — see [Design: Age & parent linking](#design-age--parent-linking)

### 6. Paid tier — see [Design: Paid tier](#design-paid-tier)

### 7. More games

Once the foundation is solid, expanding the catalog is the growth lever.
Candidates in rough order of fit:

- **`asteroid-blast`** — Tap Attack with motion. Answers float as asteroids
  at different speeds; tap the correct one before it leaves the screen.
  Difficulty scales with asteroid speed and count. Real-time timing makes it
  more game-y than drill-y.
- **`number-line`** — Drag a marker to the answer on a number line.
  Particularly good for negative numbers and fractions later.
- **`fraction-shop`** — Buy items with fractional spacebucks. Teaches
  fractions in a contextual way without ever feeling like a worksheet.
- **`equation-builder`** — Given a target answer, drag operators between
  numbers to make the equation true. Reverse direction from the other games.
- **`times-table-grid`** — Old-school 12×12 grid; race against the clock to
  fill it in.

Each new game costs roughly: 1 component + 1 rules file (if novel mechanics)

- 1 test + 1 registry line.

### Tap Attack — open follow-ups (noted Jun 2026)

Playtesting with a 4-year-old surfaced these. None are blocking; pick up next
session.

- **Upper addition/subtraction may still be too hard.** Levels 6–7 introduce
  two-digit and negative numbers (e.g. `−47 + 88`), which can be a wall for a
  young learner even though the answer is in range. Idea: split the jump —
  keep two-digit positives for a level or two before introducing negatives,
  and/or cap operand magnitude separately from answer range (add an
  `maxOperand` to `LevelSpec` so we can keep answers ±100 while keeping the
  _displayed numbers_ smaller). Needs product thought on the exact ramp before
  implementing.
- **Hints are missing in Tap Attack.** Math Attack has a hint button
  (`generateHint` / `question.hint` exists and is populated), but Tap Attack
  never surfaces it. Options: a "?" button that highlights/eliminates one wrong
  choice (50/50 lifeline), or shows the range hint text. Eliminating a
  distractor is the more tap-friendly version. Decide whether hints cost
  something (e.g. reduced reward for that question) like Math Attack's flow.
- **Spacing between gameplay and stats.** The progress bar / stat block sits
  too close to the play area. Add vertical breathing room — likely a larger
  gap (or a divider) between the spaceship and the progress bar, or group the
  "info" (level/streak/spacebucks/progress) and "play" (problem/choices) into
  two visually distinct zones. Pure layout tweak in `tap-attack/component.tsx`.

### Lower-priority but worth tracking

- **Persist `level` per game per user.** Currently `?level=4` works but is
  ephemeral. Move to `public.game_progress (user_id, game_slug, level)`.
- **Component tests** for `Header`, `UserMenu`, and at least one game
  component (smoke test that "correct tap awards spacebucks").
- **Animations.** Confetti or coin spawn on correct answer; brief shake on
  wrong. Currently only a color flash.
- **Audio.** Optional sound effects with a mute toggle.
- **PWA / Add to Home Screen.** Manifest + service worker. Particularly
  valuable for the mobile/tap-attack user.
- **Accessibility audit.** Keyboard nav on tap-attack buttons, focus rings,
  `prefers-reduced-motion` respect for the spaceship float.
- **Sentry or PostHog.** Once there are real users, knowing what they do and
  what breaks matters.
- **Sitemap + Open Graph image.** SEO is cheap to do once.

## Design: Level progression

The product question: **how does a player advance, and what changes when they
do?**

### Current state (updated Jun 2026)

- `GameComponentProps` exposes a `level: number` prop.
- **A 10-level curriculum lives in `src/lib/games/shared/levels.ts`** as an
  array of `LevelSpec` (operations + answer range + choice count per level).
  `generateLeveledQuestion(level, …)` produces questions that satisfy the
  spec, with integer answers guaranteed in range. Division (level 10) always
  yields clean integer quotients (no remainders).
- **Tap Attack has working in-game progression:** advance one level after
  `CORRECT_TO_ADVANCE` (5) correct answers at the current level, up to level 10. Wrong answers and timeouts never demote — they only reset the reward
  streak. A progress bar + level chip + "Level up!" banner surface it.
- Math Attack still only uses `level` for the `+Math.floor(level/2)` reward
  bonus. It can adopt `generateLeveledQuestion` later (the helper lives in
  `shared/` precisely so it can).
- **Gentle bottom for young learners:** levels 1–5 are addition only, starting
  at sums-to-5 with small operands; levels 1–4 use long (45–60s) timers and a
  forgiving timeout (no streak reset), so a 4-year-old can take their time.
- **Parent controls (in-game, no persistence needed):** a level `<select>`
  jumps to any level, and a **Lock** toggle pins the child to the current
  level (disables auto-advance). Stopgap for age/level-cap work until signup
  collects an age.
- `?level=N` is now the **starting** level; progression / the picker take over
  in-session.
- **Still missing: persistence.** Level + lock state reset on refresh (blocked
  on #1). When `game_progress` lands, seed `initialLevel` from it and write the
  new level on each level-up / picker change.

### Curriculum (shipped)

Per-level `roundSeconds` and `forgivingTimeout` (no streak reset on timeout)
keep the early levels stress-free.

| Lvl | Operations              | Answer range | Choices | Timer | Forgiving |
| --- | ----------------------- | ------------ | ------- | ----- | --------- |
| 1   | addition                | 0–5          | 3       | 60s   | yes       |
| 2   | addition                | 0–10         | 3       | 60s   | yes       |
| 3   | addition                | 0–20         | 3       | 50s   | yes       |
| 4   | addition                | 0–50         | 3       | 45s   | yes       |
| 5   | addition                | 0–99         | 3       | 40s   | no        |
| 6   | addition                | −100–100     | 3       | 40s   | no        |
| 7   | add, subtract           | −100–100     | 3       | 35s   | no        |
| 8   | multiply                | 0–50         | 4       | 35s   | no        |
| 9   | multiply                | 0–100        | 4       | 30s   | no        |
| 10  | multiply                | −100–100     | 4       | 30s   | no        |
| 11  | add, subtract, multiply | −100–100     | 4       | 25s   | no        |
| 12  | + intro division        | −100–100     | 4       | 25s   | no        |

To retune: edit `LEVELS` in `levels.ts` (ranges, timers, forgiveness). To
change the advance threshold or make wrong answers demote, edit
`CORRECT_TO_ADVANCE` and `onChoose` in `tap-attack/component.tsx`.

### Open design questions

1. **Unlock criteria.** What earns the next level?
    - Spacebucks total (e.g. every 100 spacebucks → level up). Simple, but
      stockpilers level up by grinding.
    - Score streak milestones (e.g. hit a streak of 10 to advance). Skill-based
      but punishing — one wrong tap erases progress.
    - Per-game XP (e.g. each correct answer = XP, level = `floor(sqrt(xp))`).
      Standard RPG curve, feels fair.
    - Daily streak based. Aligns with the "come back tomorrow" loop but
      decouples skill from progression.
    - **Recommendation:** per-game XP with a sqrt curve. Independent of
      spacebucks (which then stays a pure currency) and not punished by single
      mistakes.

2. **What changes per level?**
    - **Reward.** Already wired via `Math.floor(level / 2)` — keep.
    - **Question difficulty.** Currently the question generator uses
      `maxInput = 10` always. We could pass `maxInput = 10 + level * 2` to
      grow the range. Pure addition would stay easy, but `47 × 38` at level
      15 is meaningfully different from `7 × 8`.
    - **Operations available.** Add division at level 5, decimals at level
      8, negative inputs at level 10, etc.
    - **Tap Attack distractor difficulty.** At higher levels, distractors
      could be tighter (only off-by-one and table neighbors, no obvious
      confused-operation distractors).
    - **Time pressure.** Round seconds shrink slightly per level.
    - **Recommendation:** start with question difficulty (`maxInput`) since
      it's the most testable and most pedagogically meaningful. Layer in
      operations next, then time pressure.

3. **Per-game vs unified level?**
    - Per-game level lets a kid be a tap-attack master while still climbing
      math-attack. Honors the "different skills" reasoning behind splitting
      the games.
    - Unified level is simpler to display in the header.
    - **Recommendation:** per-game level, with the option to display a
      "blended" level on the profile.

4. **UX for leveling up.**
    - Toast on level up.
    - Modal with a "you unlocked X" screen — short and skippable.
    - Confetti animation.
    - **Recommendation:** subtle but celebratory — a brief full-screen badge
      animation (1.5s) that doesn't interrupt the next question.

### Schema impact

```sql
-- New table: public.game_progress
create table public.game_progress (
    user_id uuid not null references public.profiles (id) on delete cascade,
    game_slug text not null,
    level integer not null default 1,
    xp integer not null default 0,
    best_score_streak integer not null default 0,
    primary key (user_id, game_slug)
);

alter table public.game_progress enable row level security;
-- (RLS policies pin to auth.uid() = user_id, same shape as profiles)
```

Move `best_score_streak` off `public.profiles` (which currently has a
non-game-specific best streak) into `game_progress` once we have multiple
games.

### Minimal first slice

- Add `game_progress` table.
- On each correct answer, increment xp by 1 (or by question difficulty).
- Compute `level = max(1, floor(sqrt(xp)))` on read (no migration needed
  when the curve changes).
- Pass `level` from the loaded `game_progress` row into the game component
  instead of the query string.
- Display level somewhere in the stat bar.

That's the smallest thing that's actually a "progression system" and unblocks
the difficulty-scaling work above.

## Design: Age & parent linking

You raised this as the unlock for both the choice-count heuristic and the
paid-tier upsell flow.

### Why we need age

- **COPPA.** US law treats users under 13 differently. Payment flows must go
  through a verified parent, and certain data collection requires verifiable
  parental consent. We can't ship the paid tier without solving this.
- **Better choice-count heuristic.** Today Tap Attack uses level (which
  starts at 1 for everyone). With age, we can default a 5-year-old to 3
  choices regardless of their level number.
- **Difficulty defaults.** A new account with `age = 6` should start at a
  lower level than `age = 11`.
- **Marketing surface.** Knowing the age lets us tailor copy and email
  content.

### Signup flow proposal

For users under 13, follow a "parent gate" pattern:

1. Email + password (or Google OAuth) — same as now.
2. **New required step:** birthday (month + year, day optional).
3. If computed `age < 13`:
    - Require parent email (separate field).
    - Send a verification email to the parent with a link to confirm.
    - Until the parent verifies, the kid account is in "limited" mode —
      can play games, can't make purchases.
4. If `age >= 13`: standard flow, no parent gate.

### Schema impact

```sql
alter table public.profiles
    add column birth_year smallint,
    add column birth_month smallint,
    add column parent_email text,
    add column parent_email_verified_at timestamptz;

create index profiles_parent_email_idx on public.profiles (parent_email);
```

Computed: `age = (current_year - birth_year) - (current_month < birth_month ? 1 : 0)`.

Store year + month rather than a full birthdate; we don't need the day for
anything and storing less PII is good policy.

### Linking parents to multiple kids

If one parent has multiple kids on the platform, the `parent_email` column
naturally lets us group them. Future: a parent dashboard at `/parent` that
authenticates by parent email (separate auth flow) and shows each linked
kid's progress.

## Design: Paid tier

You called this out specifically. There are two layers to design: **what's
behind the paywall**, and **how the payment mechanics work**.

### What to put behind the paywall

The "free demo, paid serious version" model has a few common shapes:

1. **Cosmetic only.** Free users get the full game; paid gets custom
   avatars, spaceship skins, custom themes. Simple, ethically clean for a
   kid product, but the upgrade incentive is weak.
2. **Volume gated.** Free users get N questions/day or N games/week; paid
   users get unlimited. Easy to bypass with multiple accounts and feels
   punitive on a learning product.
3. **Content gated.** Free users get math-attack + tap-attack; paid users
   get the full catalog (asteroid-blast, fraction-shop, etc.). Aligns
   incentives — we make more games, more people pay.
4. **Feature gated.** Free users get drills; paid users get a parent
   dashboard, weekly progress emails, custom problem sets, exportable
   reports. The "serious users" framing in your message points here.
5. **Hybrid.** Most paid SaaS for kids does (3) + (4) — paid users unlock
   premium games _and_ get a parent dashboard.

**Recommendation:** start with (4). A parent dashboard with weekly progress
emails is the most defensible value prop for a paying parent and the least
contentious for the kid (nothing is taken away from them). Layer (3) on top
as you build more games — premium games can launch as paid-only and graduate
to free after a few months.

### Pricing shape

- **$3.99/month, $29/year** is a typical floor for kid edtech apps. Annual
  saves 40%, which is the standard nudge.
- **Family plan** ($6.99/month) for parents with multiple kids — leverages
  the parent-email linking from the age section.
- **7-day free trial.** Standard. Requires saved card up front for it to
  convert; without a card, conversion is bad.

### Payment integration

Stripe is the right choice:

- Plays well with Supabase (use the Supabase + Stripe edge function pattern).
- Native subscription support, including dunning, trial handling, family
  plans, and proration.
- Stripe Checkout (hosted) avoids handling card data ourselves — useful for
  the kid-product compliance posture.

### Schema impact

```sql
create table public.subscriptions (
    user_id uuid primary key references public.profiles (id) on delete cascade,
    stripe_customer_id text not null,
    stripe_subscription_id text,
    plan text not null,                 -- 'monthly' | 'annual' | 'family'
    status text not null,               -- 'active' | 'trialing' | 'canceled' | 'past_due'
    current_period_end timestamptz,
    trial_end timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
-- (read-only to the user; writes only via service role from the webhook handler)
```

Plus a Stripe webhook handler (server action or route handler) that listens
to `customer.subscription.created/updated/deleted` and `invoice.paid` and
syncs the row.

### Feature gating in code

A small helper:

```ts
// src/lib/billing/access.ts
export async function isPaidUser(supabase): Promise<boolean> {
    const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .single();
    return ["active", "trialing"].includes(data?.status);
}
```

Used in:

- Game registry to filter out paid-only games for free users.
- Parent dashboard route guard.
- Game components that want to surface a "go pro" CTA.

### Minimum viable paid tier

1. Stripe account, monthly product, annual product.
2. `subscriptions` table + webhook.
3. `/upgrade` page with the two plans and a "start trial" CTA.
4. Parent dashboard at `/parent` (gated behind active subscription).
5. Weekly digest email of kid's progress (Supabase Edge Function on a cron).

That's the smallest thing that's a coherent paid product. Premium games can
follow once #1 is shipped and we have real subscriber data.

## Things to remember

These are sharp edges or non-obvious facts the next person will want to
know.

- **Don't put `-z-*` on a child of `<body>` without `isolate` on body.** The
  negative z-index escapes to the root stacking context and gets painted
  over.
- **`OuterspaceBackground` is server-rendered.** Star positions come from
  a seeded PRNG so SSR and CSR markup match — don't change to `Math.random`.
- **`level` is currently a query param.** Until #4 ships, `?level=N` is the
  only way to test level-dependent behavior in dev.
- **Tap Attack reward is derived from Math Attack reward.** Changing the
  canonical economy automatically changes Tap Attack at half rate. This is
  intentional.
- **Pinning `packageManager` matters.** `pnpm-workspace.yaml` uses pnpm
  v10+ syntax. Vercel deploys fail silently if pnpm 9 is picked.
