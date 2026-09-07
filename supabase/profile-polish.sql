-- Cole no SQL editor do Supabase (uma vez).
-- Banner, selos em destaque e exclusão da conta.

alter table public.profiles
  add column if not exists banner_url text;

alter table public.profiles
  add column if not exists shown_badges text[] not null default '{}';

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'auth';
  end if;
  delete from storage.objects
  where bucket_id = 'avatars'
    and split_part(name, '/', 1) = uid::text;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

notify pgrst, 'reload schema';
