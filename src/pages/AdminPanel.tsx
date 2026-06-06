import React, { useEffect, useMemo, useState } from 'react';
import { Settings, Layers, ShieldCheck, UserCog, Search, Check, Save, Pencil, History, Smartphone, Send, Bot } from 'lucide-react';
import { getEmpAvatarColor, getEmpInitials, normalizeRoleKey } from './dashboardHelpers';
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

type AdminSection = 'sections-emp' | 'sections-role' | 'buttons' | 'employees' | 'bots';

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
