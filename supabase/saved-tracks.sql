-- Cole no SQL editor do Supabase (uma vez).
-- Biblioteca privada: só o dono lê e escreve.

create table if not exists public.song_saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id text not null,
  title text not null,
  artist text not null,
  artwork_url text,
  saved_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

alter table public.song_saves enable row level security;

drop policy if exists "song saves self" on public.song_saves;
create policy "song saves self" on public.song_saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.song_saves to authenticated;

notify pgrst, 'reload schema';
