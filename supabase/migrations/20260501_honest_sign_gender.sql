alter table public.unified_honest_sign_codes
  add column if not exists gender text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'unified_honest_sign_codes_gender_check'
  ) then
    alter table public.unified_honest_sign_codes
      add constraint unified_honest_sign_codes_gender_check
      check (gender is null or gender in ('male', 'female'));
  end if;
end $$;

comment on column public.unified_honest_sign_codes.gender is 'Product gender for honest sign code batches: male or female';
