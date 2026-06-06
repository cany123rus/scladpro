import React, { useEffect, useMemo, useState } from 'react';
import { Settings, Layers, ShieldCheck, UserCog, Search, Check, Save, Pencil, History, Smartphone, Send, Bot, Wallet, TrendingDown, TrendingUp, Box } from 'lucide-react';
import { getEmpAvatarColor, getEmpInitials, normalizeRoleKey, getWarehouseMoneyOwner, getWarehouseMoneyDisplayComment, WAREHOUSE_MONEY_OWNERS, isAssemblyExcludedStaffRate, isAssemblyTempType } from './dashboardHelpers';
import { supabase } from '../lib/supabase';
import { telegramService } from '../services/telegram.service';

type BotSlot = { key: string; label: string; hint?: string };
const BOT_SLOTS: BotSlot[] = [
  { key: 'telegram_bot_token', label: 'Основной бот', hint: 'Приём файлов, уведомления сотрудникам' },
  { key: 'telegram_reception_bot_token', label: 'Бот приёмки', hint: 'Уведомления по приёмке' },
  { key: 'telegram_login_logs_bot_token', label: 'Бот логов входа', hint: 'Логи входов сотрудников' },
  { key: 'backup_bot_token', label: 'Бот бэкапов БД', hint: 'Отправка бэкапов базы' },
  { key: 'telegram_writeoff_bot_token', label: 'Бот списаний', hint: 'Уведомления админу о списаниях со склада' },
];
const WRITEOFF_CHAT_KEY = 'telegram_writeoff_admin_chat_id';

type SectionItem = { id: string; label: string };
type SectionGroup = { title: string; items: SectionItem[] };
type AssemblyGroup = { title: string; items: ReadonlyArray<{ id: string; label: string }> };

type AdminSection = 'sections-emp' | 'sections-role' | 'buttons' | 'employees' | 'bots' | 'finance' | 'assembly';

const money = (v: number) => Math.round(Number(v || 0)).toLocaleString('ru-RU') + ' ₽';
const spendCategory = (comment: string): string => {
  const c = String(comment || '').toLowerCase();
  if (c.startsWith('оплата зп') || c.includes('зп:')) return 'Зарплата';
  if (c.includes('доставк')) return 'Доставки';
  if (c.includes('временным') || c.includes('временны')) return 'Временные';
  return 'Прочее / ручное';
};
const CAT_COLORS: Record<string, string> = {
  'Зарплата': 'bg-indigo-500',
  'Доставки': 'bg-blue-500',
  'Временные': 'bg-emerald-500',
  'Прочее / ручное': 'bg-slate-400',
};

type AdminPanelProps = {
  section: AdminSection;
  setSection: (s: AdminSection) => void;
  showToast?: (msg: string, type?: string) => void;
  employees: any[];
  sectionGroups: SectionGroup[];
  roleKeys: string[];
  sectionRoleAccess: Record<string, Record<string, 'allow' | 'deny'>>;
  updateSectionRoleAccess: (roleKey: string, tabId: string, rule: 'allow' | 'deny') => void;
  saveSectionRoleAccess: () => void | Promise<void>;
  saveEmployeeSectionPermission: (employeeId: string, tabId: string, visible: boolean) => void | Promise<void>;
  groupedAssemblyButtons: AssemblyGroup[];
  assemblyAccessEmployeeSearch: string;
  setAssemblyAccessEmployeeSearch: (v: string) => void;
  assemblyAccessSearch: string;
  setAssemblyAccessSearch: (v: string) => void;
  isButtonVisibleForEmployee: (buttonId: string, employeeId: string) => boolean;
  updateAssemblyAccessEmployee: (buttonId: string, employeeId: string, rule: 'allow' | 'deny' | 'inherit') => void;
  setAssemblyGroupRule: (buttonIds: string[], employeeIds: string[], rule: 'allow' | 'deny' | 'inherit') => void;
  saveAssemblyAccess: () => void | Promise<void>;
  onEditEmployee: (emp: any) => void;
  onShowLogs: (emp: any) => void;
  onShowDevices: (emp: any) => void;
  onSendQR: (emp: any) => void;
};

const isAdminEmp = (e: any) => normalizeRoleKey(e?.role || e?.login) === 'admin';

const SubTab = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
      active
        ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border-indigo-200 shadow-sm'
        : 'text-slate-600 border-transparent hover:bg-slate-50 hover:border-slate-200'
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

const Toggle = ({ on, onClick, labelOn = 'Показывать', labelOff = 'Скрыть' }: { on: boolean; onClick: () => void; labelOn?: string; labelOff?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
      on ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600'
    }`}
  >
    <span className={`relative w-8 h-4 rounded-full ${on ? 'bg-emerald-500' : 'bg-slate-400'}`}>
      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${on ? 'left-4' : 'left-0.5'}`} />
    </span>
    {on ? labelOn : labelOff}
  </button>
);

export function AdminPanel(props: AdminPanelProps) {
  const {
    section, setSection, employees, sectionGroups, roleKeys, sectionRoleAccess,
    updateSectionRoleAccess, saveSectionRoleAccess, saveEmployeeSectionPermission,
    groupedAssemblyButtons, assemblyAccessEmployeeSearch, setAssemblyAccessEmployeeSearch,
    assemblyAccessSearch, setAssemblyAccessSearch, isButtonVisibleForEmployee,
    updateAssemblyAccessEmployee, setAssemblyGroupRule, saveAssemblyAccess,
    onEditEmployee, onShowLogs, onShowDevices, onSendQR, showToast,
  } = props;

  const notify = (msg: string, type = 'info') => { if (showToast) showToast(msg, type); };

  // ── Bots management ─────────────────────────────────────────────
  const [botTokens, setBotTokens] = useState<Record<string, string>>({});
  const [writeoffChat, setWriteoffChat] = useState('498924112');
  const [botsLoaded, setBotsLoaded] = useState(false);
  const [botBusyKey, setBotBusyKey] = useState('');

  useEffect(() => {
    if (section !== 'bots' || botsLoaded) return;
    (async () => {
      try {
        const keys = [...BOT_SLOTS.map((b) => b.key), WRITEOFF_CHAT_KEY];
        const { data } = await supabase.from('app_settings').select('key, value').in('key', keys);
        const map: Record<string, string> = {};
        (data || []).forEach((r: any) => { map[r.key] = r.value || ''; });
        setBotTokens(map);
        if (map[WRITEOFF_CHAT_KEY]) setWriteoffChat(map[WRITEOFF_CHAT_KEY]);
      } catch (e: any) {
        notify('Ошибка загрузки ботов: ' + (e?.message || 'неизвестно'), 'error');
      } finally {
        setBotsLoaded(true);
      }
    })();
  }, [section, botsLoaded]);

  const saveSetting = async (key: string, value: string) => {
    const { data: upd, error } = await supabase.from('app_settings').update({ value }).eq('key', key).select('key');
    if (error) throw error;
    if (!upd || !upd.length) {
      const { error: insErr } = await supabase.from('app_settings').insert({ key, value });
      if (insErr) throw insErr;
    }
  };

  const handleSaveBot = async (key: string) => {
    setBotBusyKey(key);
    try {
      await saveSetting(key, String(botTokens[key] || '').trim());
      if (key === 'telegram_writeoff_bot_token') await saveSetting(WRITEOFF_CHAT_KEY, String(writeoffChat || '').trim());
      notify('Сохранено', 'success');
    } catch (e: any) {
      notify('Ошибка сохранения: ' + (e?.message || 'неизвестно'), 'error');
    } finally {
      setBotBusyKey('');
    }
  };

  const handleTestBot = async (key: string) => {
    setBotBusyKey(key + ':test');
    try {
      const token = String(botTokens[key] || '').trim();
      if (!token) { notify('Сначала введите токен', 'error'); return; }
      if (key === 'telegram_writeoff_bot_token') {
        const chat = String(writeoffChat || '').trim();
        if (!chat) { notify('Укажите Chat ID администратора', 'error'); return; }
        await telegramService.sendMessage(token, chat, '✅ Тест бота списаний. Уведомления настроены.');
        notify('Тестовое сообщение отправлено админу', 'success');
      } else {
        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`).then((r) => r.json());
        if (res?.ok) notify(`Бот работает: @${res.result?.username || res.result?.first_name || 'bot'}`, 'success');
        else notify('Бот не отвечает: ' + (res?.description || 'ошибка'), 'error');
      }
    } catch (e: any) {
      notify('Ошибка теста: ' + (e?.message || 'неизвестно'), 'error');
    } finally {
      setBotBusyKey('');
    }
  };

  // ── Finance dashboard ───────────────────────────────────────────
  const [financeRows, setFinanceRows] = useState<any[]>([]);
  const [financeLoaded, setFinanceLoaded] = useState(false);

  useEffect(() => {
    if (section !== 'finance' || financeLoaded) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('warehouse_money_log')
          .select('id, amount, comment, type, employee_name, created_at, deleted_at')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5000);
        setFinanceRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        notify('Ошибка загрузки финансов: ' + (e?.message || 'неизвестно'), 'error');
      } finally {
        setFinanceLoaded(true);
      }
    })();
  }, [section, financeLoaded]);

  const finance = useMemo(() => {
    const ownerBalance: Record<string, number> = {};
    WAREHOUSE_MONEY_OWNERS.forEach((o) => { ownerBalance[o.id] = 0; });
    let income = 0;
    let spend = 0;
    const months = new Map<string, { income: number; spend: number }>();
    const categories = new Map<string, number>();
    financeRows.forEach((r) => {
      const amt = Number(r.amount || 0);
      const owner = getWarehouseMoneyOwner(r);
      ownerBalance[owner] = (ownerBalance[owner] || 0) + amt;
      const mk = String(r.created_at || '').slice(0, 7);
      const m = months.get(mk) || { income: 0, spend: 0 };
      if (amt >= 0) { income += amt; m.income += amt; }
      else {
        spend += -amt; m.spend += -amt;
        const cat = spendCategory(getWarehouseMoneyDisplayComment(r.comment));
        categories.set(cat, (categories.get(cat) || 0) + -amt);
      }
      months.set(mk, m);
    });
    const monthList = Array.from(months.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    const catList = Array.from(categories.entries()).sort((a, b) => b[1] - a[1]);
    const totalBalance = Object.values(ownerBalance).reduce((s, v) => s + v, 0);
    const maxMonth = Math.max(1, ...monthList.map(([, v]) => Math.max(v.income, v.spend)));
    return { ownerBalance, income, spend, totalBalance, monthList, catList, maxMonth };
  }, [financeRows]);

  // ── Assembly (сборка) daily quantities: temp (ФБО/ФБС) + staff ────
  const isoDay = (d: Date) => d.toISOString().slice(0, 10);
  const [asmFrom, setAsmFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return isoDay(d); });
  const [asmTo, setAsmTo] = useState(() => isoDay(new Date()));
  const [asmLoading, setAsmLoading] = useState(false);
  const [asmTempRows, setAsmTempRows] = useState<any[]>([]);
  const [asmStaffRows, setAsmStaffRows] = useState<any[]>([]);
  const [asmSelectedDay, setAsmSelectedDay] = useState<string>('');
  const [asmDetailSort, setAsmDetailSort] = useState<{ field: 'qty' | 'who' | 'type'; dir: 'asc' | 'desc' }>({ field: 'qty', dir: 'desc' });
  const [asmFullDetail, setAsmFullDetail] = useState(false);
  const [asmSuppliers, setAsmSuppliers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (section !== 'assembly') return;
    let cancelled = false;
    (async () => {
      setAsmLoading(true);
      try {
        const [tempRes, staffRes] = await Promise.all([
          supabase.from('temporary_workers_logs').select('date, quantity, work_comment, worker_name, supplier_id, hours, earnings').is('deleted_at', null).gte('date', asmFrom).lte('date', asmTo),
          supabase.from('work_logs').select('date, quantity, employee_id, supplier_id, hours, earnings, work_rates(name)').is('deleted_at', null).gte('date', asmFrom).lte('date', asmTo),
        ]);
        if (cancelled) return;
        setAsmTempRows(Array.isArray(tempRes.data) ? tempRes.data : []);
        setAsmStaffRows(Array.isArray(staffRes.data) ? staffRes.data : []);
        try {
          const { data: sup } = await supabase.from('suppliers').select('id, name');
          if (!cancelled) { const m = new Map<string, string>(); (sup || []).forEach((s: any) => m.set(String(s.id), s.name || '—')); setAsmSuppliers(m); }
        } catch { /* ignore */ }
      } catch (e: any) {
        if (!cancelled) notify('Ошибка загрузки сборки: ' + (e?.message || 'неизвестно'), 'error');
      } finally {
        if (!cancelled) setAsmLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [section, asmFrom, asmTo]);

  const empNameById = useMemo(() => {
    const m = new Map<string, string>();
    (employees || []).forEach((e: any) => m.set(String(e.id), e.full_name || e.login || 'Сотрудник'));
    return m;
  }, [employees]);

  const assembly = useMemo(() => {
    const days = new Map<string, { temp: number; staff: number; people: Record<string, number> }>();
    const startD = new Date(asmFrom + 'T00:00:00');
    const endD = new Date(asmTo + 'T00:00:00');
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      days.set(isoDay(d), { temp: 0, staff: 0, people: {} });
    }
    asmTempRows.forEach((r) => {
      const dk = String(r.date || '').slice(0, 10);
      if (!days.has(dk) || !isAssemblyTempType(r.work_comment)) return;
      const qty = Number(r.quantity || 0); if (qty <= 0) return;
      const day = days.get(dk)!; day.temp += qty;
      const name = `${r.worker_name || 'Без имени'} (врем)`;
      day.people[name] = (day.people[name] || 0) + qty;
    });
    asmStaffRows.forEach((r) => {
      const dk = String(r.date || '').slice(0, 10);
      if (!days.has(dk) || isAssemblyExcludedStaffRate(r.work_rates?.name)) return;
      const qty = Number(r.quantity || 0); if (qty <= 0) return;
      const day = days.get(dk)!; day.staff += qty;
      const name = empNameById.get(String(r.employee_id)) || 'Сотрудник';
      day.people[name] = (day.people[name] || 0) + qty;
    });
    const list = Array.from(days.entries());
    const maxDay = Math.max(1, ...list.map(([, v]) => v.temp + v.staff));
    const totalTemp = list.reduce((s, [, v]) => s + v.temp, 0);
    const totalStaff = list.reduce((s, [, v]) => s + v.staff, 0);
    return { list, maxDay, totalTemp, totalStaff };
  }, [asmTempRows, asmStaffRows, empNameById, asmFrom, asmTo]);

  const asmDayDetail = useMemo(() => {
    if (!asmSelectedDay) return null;
    const rows: Array<{ who: string; kind: string; type: string; qty: number; supplier: string; hours: number; earnings: number }> = [];
    const typeQty = (type: string, qty: number) => (qty > 0 ? `${type} ${qty}` : type);
    asmTempRows.forEach((r) => {
      if (String(r.date || '').slice(0, 10) !== asmSelectedDay || !isAssemblyTempType(r.work_comment)) return;
      const qty = Number(r.quantity || 0); if (qty <= 0) return;
      rows.push({ who: r.worker_name || 'Без имени', kind: 'Временный', type: String(r.work_comment || ''), qty, supplier: asmSuppliers.get(String(r.supplier_id)) || '—', hours: Number(r.hours || 0), earnings: Number(r.earnings || 0) });
    });
    asmStaffRows.forEach((r) => {
      if (String(r.date || '').slice(0, 10) !== asmSelectedDay || isAssemblyExcludedStaffRate(r.work_rates?.name)) return;
      const qty = Number(r.quantity || 0); if (qty <= 0) return;
      rows.push({ who: empNameById.get(String(r.employee_id)) || 'Сотрудник', kind: 'Сотрудник', type: String(r.work_rates?.name || ''), qty, supplier: asmSuppliers.get(String(r.supplier_id)) || '—', hours: Number(r.hours || 0), earnings: Number(r.earnings || 0) });
    });
    void typeQty;
    const { field, dir } = asmDetailSort;
    const mul = dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (field === 'qty') return (a.qty - b.qty) * mul;
      if (field === 'who') return a.who.localeCompare(b.who, 'ru') * mul;
      return a.type.localeCompare(b.type, 'ru') * mul;
    });
    return { rows, total: rows.reduce((s, r) => s + r.qty, 0) };
  }, [asmSelectedDay, asmTempRows, asmStaffRows, empNameById, asmDetailSort, asmSuppliers]);

  const staffEmployees = useMemo(() => (employees || []).filter((e) => !isAdminEmp(e)), [employees]);
  const allSections = useMemo(() => sectionGroups.flatMap((g) => g.items), [sectionGroups]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [empSearch, setEmpSearch] = useState('');

  const selEmp = staffEmployees.find((e) => String(e.id) === String(selectedEmployeeId)) || staffEmployees[0] || null;
  const effRole = selectedRole || roleKeys[0] || '';

  const matchEmp = (e: any, q: string) => {
    const s = String(q || '').trim().toLowerCase();
    if (!s) return true;
    return `${e.full_name || ''} ${e.login || ''} ${e.email || ''} ${e.role || ''}`.toLowerCase().includes(s);
  };

  const empSectionVisible = (emp: any, tabId: string) => (emp?.permissions ? emp.permissions[tabId] !== false : true);
  const roleSectionVisible = (roleKey: string, tabId: string) => sectionRoleAccess[roleKey]?.[tabId] !== 'deny';

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4">
      <div className="mb-6 flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-md">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">АдминПанель</h1>
          <p className="text-slate-500 text-sm">Доступ к разделам и кнопкам, управление сотрудниками</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <SubTab active={section === 'sections-emp'} onClick={() => setSection('sections-emp')} icon={Layers} label="Разделы — по сотруднику" />
        <SubTab active={section === 'sections-role'} onClick={() => setSection('sections-role')} icon={ShieldCheck} label="Разделы — по ролям" />
        <SubTab active={section === 'buttons'} onClick={() => setSection('buttons')} icon={Check} label="Права кнопок" />
        <SubTab active={section === 'employees'} onClick={() => setSection('employees')} icon={UserCog} label="Сотрудники" />
        <SubTab active={section === 'finance'} onClick={() => setSection('finance')} icon={Wallet} label="Финансы" />
        <SubTab active={section === 'assembly'} onClick={() => setSection('assembly')} icon={Box} label="Сборка" />
        <SubTab active={section === 'bots'} onClick={() => setSection('bots')} icon={Bot} label="Боты" />
      </div>

      {/* SECTIONS BY EMPLOYEE */}
      {section === 'sections-emp' && (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          <div className="oc-card p-3">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} placeholder="Поиск сотрудника" className="oc-input pl-9" />
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-auto custom-scrollbar">
              {staffEmployees.filter((e) => matchEmp(e, empSearch)).map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(String(emp.id))}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${String(selEmp?.id) === String(emp.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}
                >
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getEmpAvatarColor(String(emp.id))} text-white text-xs font-bold flex items-center justify-center shrink-0`}>{getEmpInitials(emp.full_name || emp.login || '?')}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{emp.full_name || emp.login}</div>
                    <div className="text-[11px] text-slate-400 truncate">{emp.role || emp.login}</div>
                  </div>
                </button>
              ))}
              {!staffEmployees.length && <div className="text-sm text-slate-400 px-3 py-4 text-center">Нет сотрудников</div>}
            </div>
          </div>

          <div className="oc-card p-5">
            {selEmp ? (
              <>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="font-bold text-slate-900">{selEmp.full_name || selEmp.login}</div>
                  <div className="flex gap-2">
                    <button onClick={() => allSections.forEach((s) => saveEmployeeSectionPermission(String(selEmp.id), s.id, true))} className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs">Открыть всё</button>
                    <button onClick={() => allSections.forEach((s) => saveEmployeeSectionPermission(String(selEmp.id), s.id, false))} className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs">Скрыть всё</button>
                  </div>
                </div>
                <div className="space-y-5">
                  {sectionGroups.map((group) => (
                    <div key={group.title}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{group.title}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.items.map((item) => {
                          const on = empSectionVisible(selEmp, item.id);
                          return (
                            <div key={item.id} className="flex items-center justify-between gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
                              <span className="text-sm text-slate-700">{item.label}</span>
                              <Toggle on={on} onClick={() => saveEmployeeSectionPermission(String(selEmp.id), item.id, !on)} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-4">Персональная настройка перекрывает доступ по роли. Изменения сохраняются сразу.</p>
              </>
            ) : (
              <div className="text-sm text-slate-400 text-center py-10">Выберите сотрудника слева</div>
            )}
          </div>
        </div>
      )}

      {/* SECTIONS BY ROLE */}
      {section === 'sections-role' && (
        <div className="oc-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500">Роль:</span>
              {roleKeys.length ? roleKeys.map((rk) => (
                <button
                  key={rk}
                  onClick={() => setSelectedRole(rk)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${effRole === rk ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {rk}
                </button>
              )) : <span className="text-sm text-slate-400">Нет ролей (кроме admin)</span>}
            </div>
            <button onClick={() => saveSectionRoleAccess()} className="inline-flex items-center gap-2 btn-primary px-4 py-2 text-sm"><Save className="h-4 w-4" /> Сохранить</button>
          </div>

          {effRole ? (
            <div className="space-y-5">
              <div className="flex gap-2">
                <button onClick={() => allSections.forEach((s) => updateSectionRoleAccess(effRole, s.id, 'allow'))} className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs">Открыть всё</button>
                <button onClick={() => allSections.forEach((s) => updateSectionRoleAccess(effRole, s.id, 'deny'))} className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs">Скрыть всё</button>
              </div>
              {sectionGroups.map((group) => (
                <div key={group.title}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{group.title}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const on = roleSectionVisible(effRole, item.id);
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
                          <span className="text-sm text-slate-700">{item.label}</span>
                          <Toggle on={on} onClick={() => updateSectionRoleAccess(effRole, item.id, on ? 'deny' : 'allow')} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-slate-400">Не забудьте нажать «Сохранить». Персональные настройки сотрудника имеют приоритет над ролью.</p>
            </div>
          ) : (
            <div className="text-sm text-slate-400 text-center py-10">Нет доступных ролей для настройки</div>
          )}
        </div>
      )}

      {/* BUTTON RIGHTS */}
      {section === 'buttons' && (
        <div className="oc-card p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <input value={assemblyAccessSearch} onChange={(e) => setAssemblyAccessSearch(e.target.value)} placeholder="Поиск по кнопке" className="oc-input" />
            <input value={assemblyAccessEmployeeSearch} onChange={(e) => setAssemblyAccessEmployeeSearch(e.target.value)} placeholder="Поиск по сотруднику" className="oc-input" />
          </div>

          <div className="space-y-6">
            {groupedAssemblyButtons.map((group) => {
              const empIds = staffEmployees.filter((e) => matchEmp(e, assemblyAccessEmployeeSearch)).map((e) => String(e.id));
              return (
                <div key={group.title} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.title}</span>
                    <div className="h-px flex-1 bg-slate-200" />
                    <button onClick={() => setAssemblyGroupRule(group.items.map((x) => x.id), empIds, 'allow')} className="px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-[11px]">Вкл. группу</button>
                    <button onClick={() => setAssemblyGroupRule(group.items.map((x) => x.id), empIds, 'deny')} className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-[11px]">Выкл. группу</button>
                  </div>
                  {group.items.map((btn) => (
                    <div key={btn.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                      <div className="font-semibold text-slate-900 mb-3">{btn.label}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                        {staffEmployees.filter((e) => matchEmp(e, assemblyAccessEmployeeSearch)).map((emp) => {
                          const enabled = isButtonVisibleForEmployee(btn.id, String(emp.id));
                          return (
                            <div key={`${btn.id}-${emp.id}`} className="border rounded-xl p-2.5 bg-slate-50">
                              <div className="text-xs text-slate-700 font-medium truncate">{emp.full_name || emp.login}</div>
                              <div className="mt-2"><Toggle on={enabled} onClick={() => updateAssemblyAccessEmployee(btn.id, String(emp.id), enabled ? 'deny' : 'allow')} /></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={() => saveAssemblyAccess()} className="inline-flex items-center gap-2 btn-primary px-4 py-2 text-sm"><Save className="h-4 w-4" /> Сохранить права кнопок</button>
          </div>
        </div>
      )}

      {/* EMPLOYEE CARDS */}
      {section === 'employees' && (
        <div className="oc-card p-5">
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} placeholder="Поиск сотрудника" className="oc-input pl-9" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(employees || []).filter((e) => matchEmp(e, empSearch)).map((emp) => (
              <div key={emp.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getEmpAvatarColor(String(emp.id))} text-white text-sm font-bold flex items-center justify-center`}>{getEmpInitials(emp.full_name || emp.login || '?')}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{emp.full_name || emp.login}</div>
                    <div className="text-[11px] text-slate-400 truncate">{emp.role || emp.login}{isAdminEmp(emp) ? ' • admin' : ''}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => onEditEmployee(emp)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"><Pencil className="h-3.5 w-3.5" /> Ред.</button>
                  <button onClick={() => onShowLogs(emp)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"><History className="h-3.5 w-3.5" /> Лог</button>
                  <button onClick={() => onShowDevices(emp)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"><Smartphone className="h-3.5 w-3.5" /> Устройства</button>
                  <button onClick={() => onSendQR(emp)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"><Send className="h-3.5 w-3.5" /> QR</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FINANCE DASHBOARD */}
      {section === 'finance' && (
        !financeLoaded ? (
          <div className="oc-card p-6 text-center text-slate-400">Загрузка…</div>
        ) : (
          <div className="space-y-5">
            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {WAREHOUSE_MONEY_OWNERS.map((o) => (
                <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium text-slate-500 truncate">{o.title}</div>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">{money(finance.ownerBalance[o.id] || 0)}</div>
                </div>
              ))}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Поступило всего</div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">{money(finance.income)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-rose-500" /> Потрачено всего</div>
                <div className="text-2xl font-extrabold text-rose-600 mt-1">{money(finance.spend)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Monthly chart — modern grouped columns */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Динамика по месяцам</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Поступления</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Списания</span>
                  </div>
                </div>
                {finance.monthList.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-8">Нет данных</div>
                ) : (
                  <div className="flex items-end justify-between gap-3 h-52 pt-4">
                    {finance.monthList.map(([mk, v]) => {
                      const ih = Math.round((v.income / finance.maxMonth) * 160);
                      const sh = Math.round((v.spend / finance.maxMonth) * 160);
                      const label = (() => { const [y, m] = mk.split('-'); return `${m}.${String(y).slice(2)}`; })();
                      return (
                        <div key={mk} className="flex-1 flex flex-col items-center gap-1.5 group">
                          <div className="flex items-end gap-1 h-[160px]">
                            <div className="w-3.5 sm:w-4 rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all hover:opacity-80" style={{ height: `${Math.max(v.income > 0 ? 3 : 0, ih)}px` }} title={`Поступило: ${money(v.income)}`} />
                            <div className="w-3.5 sm:w-4 rounded-t-md bg-gradient-to-t from-rose-500 to-rose-400 transition-all hover:opacity-80" style={{ height: `${Math.max(v.spend > 0 ? 3 : 0, sh)}px` }} title={`Списано: ${money(v.spend)}`} />
                          </div>
                          <span className="text-[10px] text-slate-400">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Category breakdown */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Куда уходят деньги</h3>
                {finance.catList.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-8">Нет списаний</div>
                ) : (
                  <div className="space-y-3">
                    {finance.catList.map(([cat, sum]) => (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700">{cat}</span>
                          <span className="font-semibold text-slate-900">{money(sum)} <span className="text-xs text-slate-400">· {((sum / (finance.spend || 1)) * 100).toFixed(0)}%</span></span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full ${CAT_COLORS[cat] || 'bg-slate-400'}`} style={{ width: `${(sum / (finance.spend || 1)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent operations */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500" />
                <h3 className="font-bold text-slate-900">Последние операции</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-auto">
                {financeRows.slice(0, 60).map((r) => {
                  const amt = Number(r.amount || 0);
                  const owner = WAREHOUSE_MONEY_OWNERS.find((o) => o.id === getWarehouseMoneyOwner(r));
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                      <div className="min-w-0">
                        <div className="text-sm text-slate-800 truncate">{getWarehouseMoneyDisplayComment(r.comment) || '—'}</div>
                        <div className="text-[11px] text-slate-400">{new Date(r.created_at).toLocaleString('ru-RU')} · {owner?.title || ''}{r.employee_name ? ` · ${r.employee_name}` : ''}</div>
                      </div>
                      <div className={`shrink-0 font-bold text-sm ${amt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{amt >= 0 ? '+' : '−'}{money(Math.abs(amt))}</div>
                    </div>
                  );
                })}
                {!financeRows.length && <div className="px-5 py-10 text-center text-slate-400 text-sm">Операций нет</div>}
              </div>
            </div>
          </div>
        )
      )}

      {/* ASSEMBLY */}
      {section === 'assembly' && (
          <div className="space-y-5">
            {/* Range picker */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Период с</label>
                <input type="date" value={asmFrom} onChange={(e) => { setAsmFrom(e.target.value); setAsmSelectedDay(''); }} className="oc-input h-10" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">по</label>
                <input type="date" value={asmTo} onChange={(e) => { setAsmTo(e.target.value); setAsmSelectedDay(''); }} className="oc-input h-10" />
              </div>
              <div className="flex gap-2">
                {[7, 30, 90].map((n) => (
                  <button key={n} onClick={() => { const d = new Date(); d.setDate(d.getDate() - (n - 1)); setAsmFrom(isoDay(d)); setAsmTo(isoDay(new Date())); setAsmSelectedDay(''); }} className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">{n} дн.</button>
                ))}
              </div>
              {asmLoading && <span className="text-xs text-slate-400">Загрузка…</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1"><Box className="h-3.5 w-3.5 text-amber-500" /> Временные (ФБО/ФБС)</div>
                <div className="text-2xl font-extrabold text-amber-600 mt-1">{assembly.totalTemp.toLocaleString('ru-RU')}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500 flex items-center gap-1"><Box className="h-3.5 w-3.5 text-indigo-500" /> Сотрудники</div>
                <div className="text-2xl font-extrabold text-indigo-600 mt-1">{assembly.totalStaff.toLocaleString('ru-RU')}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-slate-500">Всего собрано за период</div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{(assembly.totalTemp + assembly.totalStaff).toLocaleString('ru-RU')}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Собрано по дням <span className="text-xs font-normal text-slate-400">(нажмите на день для детализации)</span></h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" /> Сотрудники</span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Временные</span>
                </div>
              </div>
              <div className="flex items-end gap-[3px] h-56 pt-4 overflow-x-auto">
                {assembly.list.map(([dk, v]) => {
                  const total = v.temp + v.staff;
                  const h = Math.round((total / assembly.maxDay) * 190);
                  const staffH = total > 0 ? Math.round((v.staff / total) * h) : 0;
                  const tempH = h - staffH;
                  const dd = dk.slice(8, 10);
                  const people = Object.entries(v.people).sort((a, b) => b[1] - a[1]);
                  const dLabel = new Date(dk + 'T12:00:00').toLocaleDateString('ru-RU');
                  const title = `${dLabel}\nВсего: ${total} (сотрудники ${v.staff}, временные ${v.temp})` + (people.length ? '\n\nКто собрал:\n' + people.map(([n, q]) => `• ${n}: ${q}`).join('\n') : '\nНет сборки');
                  const selected = asmSelectedDay === dk;
                  return (
                    <button type="button" key={dk} onClick={() => setAsmSelectedDay(selected ? '' : dk)} className={`flex-1 min-w-[14px] flex flex-col items-center gap-1 rounded-md px-0.5 transition-colors cursor-pointer ${selected ? 'bg-indigo-100 ring-1 ring-indigo-300' : 'hover:bg-indigo-50/70'}`} title={title}>
                      <div className="w-full flex flex-col justify-end h-[190px]">
                        {total > 0 && (
                          <>
                            <div className="w-full bg-emerald-500 rounded-t-sm transition-all hover:brightness-95" style={{ height: `${tempH}px` }} />
                            <div className="w-full bg-indigo-500 transition-all hover:brightness-110" style={{ height: `${staffH}px` }} />
                          </>
                        )}
                      </div>
                      <span className={`text-[9px] ${selected ? 'text-indigo-700 font-bold' : 'text-slate-400'}`}>{dd}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">Временные: типы работ с «ФБО»/«ФБС». Сотрудники: все типы работ кроме повременных, ПИК и возвратов. Данные привязаны к дате смены/работы.</p>
            </div>

            {/* Day detail */}
            {asmSelectedDay && asmDayDetail && (
              <div className="rounded-2xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Детализация за {new Date(asmSelectedDay + 'T12:00:00').toLocaleDateString('ru-RU')}</h3>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-slate-600">
                      <input type="checkbox" checked={asmFullDetail} onChange={(e) => setAsmFullDetail(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      Полная детализация
                    </label>
                    <span className="text-sm text-slate-500">Всего собрано: <b className="text-slate-900">{asmDayDetail.total.toLocaleString('ru-RU')}</b></span>
                  </div>
                </div>
                {asmDayDetail.rows.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">В этот день сборки не было</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase select-none">
                      {(() => {
                        const sortBtn = (field: 'who' | 'type' | 'qty') => () => setAsmDetailSort((p) => ({ field, dir: p.field === field && p.dir === 'desc' ? 'asc' : 'desc' }));
                        const arw = (field: string) => asmDetailSort.field === field ? (asmDetailSort.dir === 'desc' ? ' ↓' : ' ↑') : '';
                        return (
                          <tr>
                            <th className="px-5 py-2.5 cursor-pointer hover:text-slate-700" onClick={sortBtn('who')}>Сотрудник{arw('who')}</th>
                            <th className="px-5 py-2.5">Категория</th>
                            {asmFullDetail && <th className="px-5 py-2.5">Поставщик</th>}
                            <th className="px-5 py-2.5 cursor-pointer hover:text-slate-700" onClick={sortBtn('type')}>{asmFullDetail ? 'Тип/Кол-во' : 'Тип работы'}{arw('type')}</th>
                            {asmFullDetail && <th className="px-5 py-2.5 text-right">Часы</th>}
                            {asmFullDetail && <th className="px-5 py-2.5 text-right">Заработок</th>}
                            <th className="px-5 py-2.5 text-right cursor-pointer hover:text-slate-700" onClick={sortBtn('qty')}>Количество{arw('qty')}</th>
                          </tr>
                        );
                      })()}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {asmDayDetail.rows.map((r, i) => (
                        <tr key={`asmd-${i}`} className="hover:bg-slate-50">
                          <td className="px-5 py-2.5 font-medium text-slate-800">{r.who}</td>
                          <td className="px-5 py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${r.kind === 'Временный' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{r.kind}</span></td>
                          {asmFullDetail && <td className="px-5 py-2.5 text-slate-600">{r.supplier}</td>}
                          <td className="px-5 py-2.5 text-slate-600">{asmFullDetail ? `${r.type} ${r.qty}` : r.type}</td>
                          {asmFullDetail && <td className="px-5 py-2.5 text-right text-slate-600">{r.hours ? `${r.hours} ч.` : '—'}</td>}
                          {asmFullDetail && <td className="px-5 py-2.5 text-right font-semibold text-green-600">{r.earnings ? `${r.earnings.toLocaleString('ru-RU')} ₽` : '—'}</td>}
                          <td className="px-5 py-2.5 text-right font-bold text-slate-900">{r.qty.toLocaleString('ru-RU')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
      )}

      {/* BOTS */}
      {section === 'bots' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900">
            Управление Telegram-ботами. Токен создаётся в <span className="font-semibold">@BotFather</span> (команда <span className="font-mono">/newbot</span>), затем вставляется сюда. «Бот списаний» отправляет администратору уведомления о каждом списании со склада.
          </div>
          {!botsLoaded ? (
            <div className="oc-card p-6 text-center text-slate-400">Загрузка…</div>
          ) : (
            BOT_SLOTS.map((slot) => {
              const isWriteoff = slot.key === 'telegram_writeoff_bot_token';
              const busy = botBusyKey === slot.key;
              const testing = botBusyKey === slot.key + ':test';
              return (
                <div key={slot.key} className={`rounded-2xl border bg-white p-4 shadow-sm ${isWriteoff ? 'border-emerald-200 ring-1 ring-emerald-50' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className={`h-4 w-4 ${isWriteoff ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <div className="font-semibold text-slate-900">{slot.label}</div>
                    {isWriteoff && <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">уведомления</span>}
                  </div>
                  {slot.hint && <div className="text-xs text-slate-400 mb-3">{slot.hint}</div>}
                  <input
                    type="text"
                    value={botTokens[slot.key] || ''}
                    onChange={(e) => setBotTokens((prev) => ({ ...prev, [slot.key]: e.target.value }))}
                    placeholder="Токен бота (123456:ABC...)"
                    className="oc-input font-mono text-xs"
                    autoComplete="off"
                  />
                  {isWriteoff && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Chat ID администратора</label>
                      <input
                        type="text"
                        value={writeoffChat}
                        onChange={(e) => setWriteoffChat(e.target.value)}
                        placeholder="498924112"
                        className="oc-input font-mono text-xs"
                      />
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => handleSaveBot(slot.key)} disabled={busy} className="inline-flex items-center gap-1.5 btn-primary px-3 py-2 text-sm disabled:opacity-50">
                      <Save className="h-4 w-4" /> {busy ? 'Сохранение…' : 'Сохранить'}
                    </button>
                    <button onClick={() => handleTestBot(slot.key)} disabled={testing} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                      <Send className="h-4 w-4" /> {testing ? 'Проверка…' : (isWriteoff ? 'Тест отправки' : 'Проверить')}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
