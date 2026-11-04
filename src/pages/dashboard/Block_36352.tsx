// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X, ChevronDown } from 'lucide-react';

export function Block_36352(props: any) {
  const { assemblyAccessEmployeeSearch, assemblyAccessSearch, collapsedAssemblyGroups, employees, groupedAssemblyButtons, isButtonVisibleForEmployee, saveAssemblyAccess, setAssemblyAccessEmployeeSearch, setAssemblyAccessSearch, setAssemblyGroupRule, setCollapsedAssemblyGroups, setShowAssemblyAccessModal, updateAssemblyAccessEmployee } = props;
  return (
<div className="fixed inset-0 bg-slate-950/55 backdrop-blur-md flex items-center justify-center z-[80] p-3 sm:p-4" onClick={() => setShowAssemblyAccessModal(false)}>
              <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl shadow-2xl border border-white/60 w-full max-w-6xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 border-b border-slate-200 px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">Права доступа к кнопкам</h2>
                      <p className="text-sm text-slate-500 mt-1">Раздел «Сборка» - гибкое управление правами по ролям и сотрудникам</p>
                    </div>
                    <button onClick={() => setShowAssemblyAccessModal(false)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-600" /></button>
                  </div>
                </div>

                <div className="p-6 overflow-auto max-h-[calc(90vh-84px)]">
                  <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 text-xs sm:text-sm text-indigo-900 leading-relaxed mb-6">
                    <div><span className="font-semibold">Включено</span> - показывать / разрешить</div>
                    <div><span className="font-semibold">Выключено</span> - скрыть / запретить</div>
                  </div>

                  <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={assemblyAccessSearch}
                      onChange={(e) => setAssemblyAccessSearch(e.target.value)}
                      placeholder="Поиск по названию кнопки или раздела"
                      className="oc-input"
                    />
                    <input
                      value={assemblyAccessEmployeeSearch}
                      onChange={(e) => setAssemblyAccessEmployeeSearch(e.target.value)}
                      placeholder="Поиск по сотруднику"
                      className="oc-input"
                    />
                  </div>

                  <div className="space-y-6">
                    {groupedAssemblyButtons.map((group) => (
                      <div key={`assembly-group-${group.title}`} className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-px flex-1 bg-slate-200" />
                            <button
                              type="button"
                              onClick={() => setCollapsedAssemblyGroups((prev) => ({ ...prev, [group.title]: !prev[group.title] }))}
                              className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 inline-flex items-center gap-2"
                            >
                              <ChevronDown className={`h-4 w-4 transition-transform ${collapsedAssemblyGroups[group.title] ? '-rotate-90' : 'rotate-0'}`} />
                              {group.title}
                            </button>
                            <div className="h-px flex-1 bg-slate-200" />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const employeeIds = (employees || [])
                                  .filter((emp) => String(emp.role || '').toLowerCase() !== 'admin' && String(emp.login || '').toLowerCase() !== 'admin')
                                  .filter((emp) => {
                                    const q = String(assemblyAccessEmployeeSearch || '').trim().toLowerCase();
                                    if (!q) return true;
                                    const hay = `${emp.full_name || ''} ${emp.login || ''} ${emp.email || ''}`.toLowerCase();
                                    return hay.includes(q);
                                  })
                                  .map((emp) => String(emp.id));
                                setAssemblyGroupRule(group.items.map((x) => x.id), employeeIds, 'allow');
                              }}
                              className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs"
                            >
                              Включить группу
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const employeeIds = (employees || [])
                                  .filter((emp) => String(emp.role || '').toLowerCase() !== 'admin' && String(emp.login || '').toLowerCase() !== 'admin')
                                  .filter((emp) => {
                                    const q = String(assemblyAccessEmployeeSearch || '').trim().toLowerCase();
                                    if (!q) return true;
                                    const hay = `${emp.full_name || ''} ${emp.login || ''} ${emp.email || ''}`.toLowerCase();
                                    return hay.includes(q);
                                  })
                                  .map((emp) => String(emp.id));
                                setAssemblyGroupRule(group.items.map((x) => x.id), employeeIds, 'deny');
                              }}
                              className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs"
                            >
                              Выключить группу
                            </button>
                          </div>
                        </div>

                        {!collapsedAssemblyGroups[group.title] && group.items.map((btn) => (
                          <div key={btn.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="font-semibold text-slate-900">{btn.label}</div>
                              <span className="text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">Кнопка</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                              {employees
                                .filter((emp) => String(emp.role || '').toLowerCase() !== 'admin' && String(emp.login || '').toLowerCase() !== 'admin')
                                .filter((emp) => {
                                  const q = String(assemblyAccessEmployeeSearch || '').trim().toLowerCase();
                                  if (!q) return true;
                                  const hay = `${emp.full_name || ''} ${emp.login || ''} ${emp.email || ''}`.toLowerCase();
                                  return hay.includes(q);
                                })
                                .map((emp) => {
                                  const enabled = isButtonVisibleForEmployee(btn.id, String(emp.id));
                                  return (
                                    <div key={`${btn.id}-${emp.id}`} className="border rounded-xl p-2.5 bg-slate-50">
                                      <div className="text-xs text-slate-700 font-medium truncate">{emp.full_name}</div>
                                      <button
                                        type="button"
                                        onClick={() => updateAssemblyAccessEmployee(btn.id, String(emp.id), enabled ? 'deny' : 'allow')}
                                        className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${enabled ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                                      >
                                        <span className={`w-8 h-4 rounded-full relative ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${enabled ? 'left-4' : 'left-0.5'}`} />
                                        </span>
                                        <span className="font-medium">{enabled ? 'Показывать' : 'Скрыть'}</span>
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 mt-6 sticky bottom-0 pt-4 bg-gradient-to-t from-slate-50 to-transparent">
                    <button onClick={() => setShowAssemblyAccessModal(false)} className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 transition-colors">Отмена</button>
                    <button onClick={saveAssemblyAccess} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Сохранить права</button>
                  </div>
                </div>
              </div>
            </div>
  );
}
