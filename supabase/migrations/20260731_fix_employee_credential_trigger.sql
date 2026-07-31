-- Создание сотрудника с паролем падало с ошибкой внешнего ключа.
--
-- Было: один триггер BEFORE INSERT OR UPDATE OF password. На вставке функция
-- писала в employee_credentials ссылку на сотрудника, которого ещё нет —
-- строка employees появляется только после BEFORE-триггера. Внешний ключ
-- employee_credentials_employee_id_fkey такую запись отклонял, и завести
-- нового сотрудника было нельзя вовсе. Смена пароля существующему работала,
-- поэтому поломка всплыла не сразу.
--
-- Стало: обновление пароля обрабатывает прежний BEFORE-триггер, а вставку —
-- отдельный AFTER INSERT: к этому моменту сотрудник уже существует, и внешний
-- ключ доволен. Пароль после хэширования обнуляется отдельным UPDATE; он
-- повторно вызывает BEFORE-триггер, но там условие «пароль не пуст» уже ложно,
-- поэтому рекурсии нет.

create or replace function public.sync_employee_credential_after_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
begin
  if new.password is not null and new.password <> '' then
    insert into public.employee_credentials (employee_id, password_hash, updated_at)
    values (new.id, crypt(new.password, gen_salt('bf')), now())
    on conflict (employee_id) do update
      set password_hash = excluded.password_hash, updated_at = now();

    -- Открытый пароль в таблице не остаётся — ради этого всё и затевалось.
    update public.employees set password = null where id = new.id;
  end if;
  return null;
end;
$function$;

drop trigger if exists trg_sync_employee_credential on public.employees;
create trigger trg_sync_employee_credential
  before update of password on public.employees
  for each row execute function public.sync_employee_credential();

drop trigger if exists trg_sync_employee_credential_ins on public.employees;
create trigger trg_sync_employee_credential_ins
  after insert on public.employees
  for each row execute function public.sync_employee_credential_after_insert();
