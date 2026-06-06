import React, { useMemo, useState } from 'react';
import { Settings, Layers, ShieldCheck, UserCog, Search, Check, X as XIcon, Save, Pencil, History, Smartphone, Send } from 'lucide-react';
import { getEmpAvatarColor, getEmpInitials, normalizeRoleKey } from './dashboardHelpers';

type SectionItem = { id: string; label: string };
type SectionGroup = { title: string; items: SectionItem[] };
type AssemblyGroup = { title: string; items: ReadonlyArray<{ id: string; label: string }> };

type AdminPanelProps = {
  section: 'sections-emp' | 'sections-role' | 'buttons' | 'employees';
  setSection: (s: 'sections-emp' | 'sections-role' | 'buttons' | 'employees') => void;
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
    onEditEmployee, onShowLogs, onShowDevices, onSendQR,
  } = props;

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
          <h1 className="text-2xl font-bold text-slate-900">Администрирование</h1>
          <p className="text-slate-500 text-sm">Доступ к разделам и кнопкам, управление сотрудниками</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <SubTab active={section === 'sections-emp'} onClick={() => setSection('sections-emp')} icon={Layers} label="Разделы — по сотруднику" />
        <SubTab active={section === 'sections-role'} onClick={() => setSection('sections-role')} icon={ShieldCheck} label="Разделы — по ролям" />
        <SubTab active={section === 'buttons'} onClick={() => setSection('buttons')} icon={Check} label="Права кнопок" />
        <SubTab active={section === 'employees'} onClick={() => setSection('employees')} icon={UserCog} label="Сотрудники" />
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
    </div>
  );
}
