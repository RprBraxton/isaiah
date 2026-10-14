create table if not exists public.allowed_emails (email text primary key check (email = lower(email)), added_at timestamptz default now());
alter table public.allowed_emails enable row level security;
create or replace function public.is_allowed() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.allowed_emails a where a.email = lower(coalesce(auth.jwt()->>'email','')));
$$;
revoke all on function public.is_allowed() from public; grant execute on function public.is_allowed() to authenticated;
create policy "self check" on public.allowed_emails for select to authenticated using (email = lower(auth.jwt()->>'email'));
create table if not exists public.entries (
  kind text not null check (kind in ('ms','letters','logs','growth','firsts','weekly','settings')),
  id text not null, data jsonb, updated_at bigint not null, deleted boolean not null default false,
  updated_by uuid default auth.uid(), server_ts timestamptz not null default now(), primary key (kind,id));
alter table public.entries enable row level security;
alter table public.entries replica identity full;
create policy "allowlisted read" on public.entries for select to authenticated using (public.is_allowed());
create policy "allowlisted insert" on public.entries for insert to authenticated with check (public.is_allowed());
create policy "allowlisted update" on public.entries for update to authenticated using (public.is_allowed()) with check (public.is_allowed());
-- last-write-wins guard: ignore older updates
create or replace function public.lww() returns trigger language plpgsql as $$
begin if new.updated_at < old.updated_at then return old; end if; new.server_ts := now(); return new; end $$;
drop trigger if exists entries_lww on public.entries;
create trigger entries_lww before update on public.entries for each row execute function public.lww();
do $$ begin alter publication supabase_realtime add table public.entries; exception when duplicate_object then null; end $$;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('photos','photos',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
create policy "photos read" on storage.objects for select to authenticated using (bucket_id='photos' and public.is_allowed());
create policy "photos insert" on storage.objects for insert to authenticated with check (bucket_id='photos' and public.is_allowed());
create policy "photos update" on storage.objects for update to authenticated using (bucket_id='photos' and public.is_allowed());
