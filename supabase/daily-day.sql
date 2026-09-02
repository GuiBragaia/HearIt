-- Cole no SQL editor do Supabase (uma vez).
-- Daily passa a gravar no dia do jogador (não no UTC do banco),
-- e os pontos/placar recalculam na hora do envio.

drop function if exists public.recompute_profile_stats(uuid);
drop function if exists public.recompute_profile_stats(uuid, date);
drop function if exists public.submit_daily_run(text, boolean, integer, numeric, integer);
drop function if exists public.submit_daily_run(text, boolean, integer, numeric, integer, date);
drop function if exists public.reset_today_run();
drop function if exists public.reset_today_run(date);

create function public.recompute_profile_stats(uid uuid, p_today date default current_date)
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

  if last_day is null or last_day < (p_today - 1) then
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

create function public.submit_daily_run(
  p_song_id text,
  p_won boolean,
  p_score integer,
  p_duration numeric,
  p_level integer,
  p_day date default null
)
returns public.daily_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  day_key date := coalesce(p_day, current_date);
  existing public.daily_runs;
  inserted public.daily_runs;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  if day_key < current_date - 1 or day_key > current_date + 1 then
    raise exception 'day';
  end if;

  select * into existing from public.daily_runs where user_id = uid and day = day_key;
  if found then
    return existing;
  end if;

  insert into public.daily_runs (user_id, day, song_id, won, score, duration, level)
  values (uid, day_key, p_song_id, p_won, p_score, p_duration, p_level)
  returning * into inserted;

  perform public.recompute_profile_stats(uid, day_key);
  return inserted;
end;
$$;

create function public.reset_today_run(p_day date default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  day_key date := coalesce(p_day, current_date);
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from public.daily_runs where user_id = uid and day = day_key;
  perform public.recompute_profile_stats(uid, day_key);
end;
$$;

grant execute on function public.submit_daily_run(text, boolean, integer, numeric, integer, date) to authenticated;
grant execute on function public.reset_today_run(date) to authenticated;

notify pgrst, 'reload schema';
