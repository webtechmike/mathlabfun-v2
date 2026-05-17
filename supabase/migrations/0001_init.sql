-- mathlabfun v2 initial schema
--
-- Run this in the Supabase SQL editor (Project → SQL → New query) once, or
-- via the Supabase CLI: `supabase db push`.

set check_function_bodies = off;

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users, keyed by the user's auth.uid().
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text,
    email text,
    daily_streak integer not null default 0,
    super_streak integer not null default 0,
    score_streak integer not null default 0,
    best_score_streak integer not null default 0,
    total_correct_answers integer not null default 0,
    total_questions_answered integer not null default 0,
    spacebucks integer not null default 0,
    last_login_date timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by their owner" on public.profiles;
create policy "profiles are readable by their owner"
    on public.profiles for select
    using (auth.uid() = id);

drop policy if exists "profiles are insertable by their owner" on public.profiles;
create policy "profiles are insertable by their owner"
    on public.profiles for insert
    with check (auth.uid() = id);

drop policy if exists "profiles are updatable by their owner" on public.profiles;
create policy "profiles are updatable by their owner"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row on user signup, and keep updated_at fresh.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, display_name)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
    before update on public.profiles
    for each row
    execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- answers: one row per submitted question. Powers analytics later.
-- ---------------------------------------------------------------------------

create table if not exists public.answers (
    id bigint generated always as identity primary key,
    user_id uuid not null references public.profiles (id) on delete cascade,
    game_slug text not null,
    operation text not null,
    input1 integer not null,
    input2 integer not null,
    submitted_answer integer,
    correct boolean not null,
    spacebucks_awarded integer not null default 0,
    answered_at timestamptz not null default now()
);

create index if not exists answers_user_id_answered_at_idx
    on public.answers (user_id, answered_at desc);

alter table public.answers enable row level security;

drop policy if exists "answers are readable by their owner" on public.answers;
create policy "answers are readable by their owner"
    on public.answers for select
    using (auth.uid() = user_id);

drop policy if exists "answers are insertable by their owner" on public.answers;
create policy "answers are insertable by their owner"
    on public.answers for insert
    with check (auth.uid() = user_id);
