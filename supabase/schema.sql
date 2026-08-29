-- Hear It — run this in the Supabase SQL editor (once).
-- Auth: disable "Confirm email" in Authentication > Providers while developing.

create extension if not exists citext;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle citext not null unique,
  display_name text not null default '',
  photo_url text,
  favorites text[] not null default '{}',
  points integer not null default 0,
  streak integer not null default 0,
  best_streak integer not null default 0,
  songs_guessed integer not null default 0,
  songs_played integer not null default 0,
  perfect_guesses integer not null default 0,
  clutch_guesses integer not null default 0,
  lightning_guesses integer not null default 0,
  sum_clip numeric not null default 0,
  last_played_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint handle_shape check (handle ~ '^[a-z0-9_]{2,16}$'),
  constraint display_name_len check (char_length(display_name) <= 24)
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint no_self_friend check (requester_id <> addressee_id),
  constraint unique_pair unique (requester_id, addressee_id)
);

create table if not exists public.daily_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  song_id text not null,
  won boolean not null,
  score integer not null default 0,
  duration numeric not null,
  level integer not null,
  created_at timestamptz not null default now(),
  constraint unique_day unique (user_id, day)
);

create index if not exists profiles_points_idx on public.profiles (points desc);
create index if not exists daily_runs_day_score_idx on public.daily_runs (day, score desc);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);
create index if not exists friendships_requester_idx on public.friendships (requester_id, status);

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.daily_runs enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "friends read" on public.friendships;
create policy "friends read" on public.friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friends insert" on public.friendships;
create policy "friends insert" on public.friendships
  for insert with check (auth.uid() = requester_id);

drop policy if exists "friends update" on public.friendships;
create policy "friends update" on public.friendships
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "friends delete" on public.friendships;
create policy "friends delete" on public.friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "runs read" on public.daily_runs;
create policy "runs read" on public.daily_runs for select using (true);

drop policy if exists "runs insert" on public.daily_runs;
create policy "runs insert" on public.daily_runs
  for insert with check (auth.uid() = user_id);

drop policy if exists "runs delete" on public.daily_runs;
create policy "runs delete" on public.daily_runs
  for delete using (auth.uid() = user_id);

create or replace function public.normalize_handle(raw text)
returns text
language sql
immutable
as $$
  select left(regexp_replace(lower(coalesce(raw, '')), '[^a-z0-9_]', '', 'g'), 16);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  h text;
  n text;
  attempt text;
  i int := 0;
begin
  h := public.normalize_handle(coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1)));
  if char_length(h) < 2 then
    h := 'player';
  end if;
  n := trim(coalesce(new.raw_user_meta_data->>'display_name', ''));
  if char_length(n) > 24 then
    n := left(n, 24);
  end if;
  attempt := h;
  while exists (select 1 from public.profiles where handle = attempt) loop
    i := i + 1;
    attempt := left(h, 12) || i::text;
  end loop;
  insert into public.profiles (id, handle, display_name)
  values (new.id, attempt, n);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.recompute_profile_stats(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  streak_now int := 0;
  best_now int := 0;
  prev date;
  d date;
  last_day date;
begin
  last_day := (select max(day) from public.daily_runs where user_id = uid);

  for d in
    select day from public.daily_runs where user_id = uid order by day
  loop
    if prev is null or d = prev + 1 then
      streak_now := case when prev is null then 1 else streak_now + 1 end;
    else
      streak_now := 1;
    end if;
    if best_now < streak_now then
      best_now := streak_now;
    end if;
    prev := d;
  end loop;

  if last_day is null or last_day < (current_date - 1) then
    streak_now := 0;
  end if;

  update public.profiles
  set
    points = coalesce((select sum(score) from public.daily_runs where user_id = uid), 0),
    songs_played = coalesce((select count(*) from public.daily_runs where user_id = uid), 0),
    songs_guessed = coalesce((select count(*) from public.daily_runs where user_id = uid and won), 0),
    perfect_guesses = coalesce((select count(*) from public.daily_runs where user_id = uid and won and level = 0), 0),
    clutch_guesses = coalesce((select count(*) from public.daily_runs where user_id = uid and won and level = 4), 0),
    lightning_guesses = coalesce((select count(*) from public.daily_runs where user_id = uid and won and duration <= 1), 0),
    sum_clip = coalesce((select sum(duration) from public.daily_runs where user_id = uid and won), 0),
    last_played_on = last_day,
    streak = streak_now,
    best_streak = best_now,
    updated_at = now()
  where id = uid;
end;
$$;

create or replace function public.submit_daily_run(
  p_song_id text,
  p_won boolean,
  p_score integer,
  p_duration numeric,
  p_level integer
)
returns public.daily_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := current_date;
  existing public.daily_runs;
  inserted public.daily_runs;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  select * into existing from public.daily_runs where user_id = uid and day = today;
  if found then
    return existing;
  end if;

  insert into public.daily_runs (user_id, day, song_id, won, score, duration, level)
  values (uid, today, p_song_id, p_won, p_score, p_duration, p_level)
  returning * into inserted;

  perform public.recompute_profile_stats(uid);
  return inserted;
end;
$$;

create or replace function public.reset_today_run()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from public.daily_runs where user_id = uid and day = current_date;
  perform public.recompute_profile_stats(uid);
end;
$$;

grant execute on function public.submit_daily_run(text, boolean, integer, numeric, integer) to authenticated;
grant execute on function public.reset_today_run() to authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar read" on storage.objects;
create policy "avatar read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatar write" on storage.objects;
create policy "avatar write" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatar update" on storage.objects;
create policy "avatar update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatar delete" on storage.objects;
create policy "avatar delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
