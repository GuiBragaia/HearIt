-- Cole no SQL editor do Supabase (uma vez).
-- Feedback e sugestões: só quem tem 5.000+ pontos.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('note', 'idea')),
  body text not null,
  created_at timestamptz not null default now(),
  constraint feedback_body_len check (char_length(trim(body)) between 12 and 800)
);

create index if not exists feedback_user_idx on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

drop policy if exists "feedback insert" on public.feedback;
create policy "feedback insert" on public.feedback
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.points >= 5000
    )
  );

revoke all on public.feedback from anon, authenticated;

create or replace function public.submit_feedback(p_kind text, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  pts integer;
  recent integer;
  note text := trim(coalesce(p_body, ''));
begin
  if uid is null then
    raise exception 'auth';
  end if;
  if p_kind not in ('note', 'idea') then
    raise exception 'kind';
  end if;
  if char_length(note) < 12 or char_length(note) > 800 then
    raise exception 'body';
  end if;

  select points into pts from public.profiles where id = uid;
  if pts is null or pts < 5000 then
    raise exception 'points';
  end if;

  select count(*) into recent
  from public.feedback
  where user_id = uid and created_at > now() - interval '6 hours';
  if recent >= 3 then
    raise exception 'rate';
  end if;

  insert into public.feedback (user_id, kind, body) values (uid, p_kind, note);
end;
$$;

grant execute on function public.submit_feedback(text, text) to authenticated;

notify pgrst, 'reload schema';
