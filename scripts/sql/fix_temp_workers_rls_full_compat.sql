-- SkladPro hotfix: temporary_workers_logs RLS full compatibility for employee-mode (anon) and authenticated
-- Created: 2026-02-17 (Europe/Moscow)
-- Run in Supabase SQL Editor (project: blygwkxjogmioebutiwn)

begin;

alter table if exists public.temporary_workers_logs enable row level security;

-- SELECT: allow reading history in app for both anon and authenticated
-- (optional hardening later: limit by supplier/employee rules)
drop policy if exists temp_workers_select_auth on public.temporary_workers_logs;
create policy temp_workers_select_auth
on public.temporary_workers_logs
for select
to anon, authenticated
using (true);

-- INSERT: allow add form in both modes, require created_by present
drop policy if exists temp_workers_insert_auth on public.temporary_workers_logs;
create policy temp_workers_insert_auth
on public.temporary_workers_logs
for insert
to anon, authenticated
with check (created_by is not null);

commit;

-- Verify
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname='public' and tablename='temporary_workers_logs'
-- order by policyname;
