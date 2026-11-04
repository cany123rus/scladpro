// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Send, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { supabase } from '../../lib/supabase';

export function Block_33307(props: any) {
  const { currentEmployee, cwScheduleDraftDates, cwScheduleDraftOffDates, cwScheduleEmployeeId, cwScheduleInlineError, cwScheduleLocked, cwScheduleMode, cwScheduleMonth, cwScheduleRuleMaxOffDays, cwScheduleRuleMutualOffEnabled, cwScheduleRuleSecondToMonthEnd, cwScheduleRuleStart1, cwScheduleRuleStart2, employees, hasAssemblyButtonAccess, isScheduleEmployeeVisible, loadAutoScheduleNotifyDates, loadEmployeeSchedule, loadScheduleRules, saveEmployeeSchedule, scheduleKeyForEmployee, setCwScheduleDraftDates, setCwScheduleDraftOffDates, setCwScheduleEmployeeId, setCwScheduleInlineError, setCwScheduleModalOpen, setCwScheduleMode, setCwScheduleMonth, setCwScheduleNotifyEmployeeIds, setCwScheduleNotifyOpen, setCwScheduleRulesOpen, showToast } = props;
  return (
<div className="fixed inset-0 z-[65] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-3" onClick={() => setCwScheduleModalOpen(false)}>
              <div className="w-full max-w-3xl h-[88vh] sm:h-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-20 bg-white px-3 pt-2 pb-2 sm:px-4 sm:pt-4 md:px-6 md:pt-6 border-b">
                  <div className="mx-auto mb-1.5 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" />
                  <div className="flex items-center justify-between gap-2 mb-2 pr-12 md:pr-0">
                    <div>
                      <div className="text-base sm:text-lg font-bold text-slate-900 leading-tight">График выходов</div>
                      <div className="text-[11px] sm:text-xs text-slate-500 leading-tight">Отмечай даты, когда сотрудник выходит на работу</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {String(currentEmployee?.role || '').toLowerCase() === 'admin' && (
                        <>
                          <button onClick={async () => { await loadAutoScheduleNotifyDates(); setCwScheduleNotifyEmployeeIds(['']); setCwScheduleNotifyOpen(true); }} className="px-2 py-1.5 text-xs rounded border border-sky-200 text-sky-700 hover:bg-sky-50 inline-flex items-center gap-1"><Send className="w-3.5 h-3.5" /> Telegram</button>
                          <button onClick={async () => { await loadScheduleRules(); setCwScheduleRulesOpen(true); }} className="px-3 py-1.5 text-xs rounded border border-indigo-200 text-indigo-700 hover:bg-indigo-50">Правила графика</button>
                        </>
                      )}
                      <button
                        onClick={() => setCwScheduleModalOpen(false)}
                        className="fixed right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md hover:bg-slate-50 md:static md:h-auto md:w-auto md:rounded-lg md:border-0 md:bg-transparent md:shadow-none md:p-2"
                        aria-label="Закрыть график выходов"
                      ><X className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 sm:px-4 md:px-6">
                  {String(currentEmployee?.role || '').toLowerCase() === 'admin' && hasAssemblyButtonAccess('cw_calendar_schedule_employee_pick') && (
                    <div className="mb-3 pt-1">
                      <label className="block text-xs text-slate-500 mb-1">Сотрудник</label>
                      <SearchSelect
                        value={cwScheduleEmployeeId}
                        onChange={async (id) => {
                          setCwScheduleEmployeeId(id);
                          if (id) await loadEmployeeSchedule(id);
                        }}
                        emptyLabel="Выберите сотрудника..."
                        options={employees
                          .filter((e) => String(e.role || '').toLowerCase() !== 'admin' && String(e.login || '').toLowerCase() !== 'admin')
                          .filter((e) => isScheduleEmployeeVisible(e))
                          .map((e) => ({ value: String(e.id), label: String(e.full_name || '') }))}
                        ariaLabel="Сотрудник"
                      />
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                    <div className="font-semibold text-slate-800 capitalize text-sm sm:text-base">{cwScheduleMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <button
                        type="button"
                        onClick={() => setCwScheduleMode((m) => m === 'work' ? 'off' : 'work')}
                        className={`w-full sm:w-auto px-3 py-2 text-xs rounded-full border ${cwScheduleMode === 'off' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}
                      >
                        {cwScheduleMode === 'off' ? 'Режим: Выходные' : 'Режим: Рабочие'}
                      </button>
                      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 self-start sm:self-auto">
                        <button onClick={() => setCwScheduleMonth(new Date(cwScheduleMonth.getFullYear(), cwScheduleMonth.getMonth() - 1, 1))} className="p-1 hover:bg-white rounded"><ChevronLeft className="h-4 w-4" /></button>
                        <button onClick={() => setCwScheduleMonth(new Date(cwScheduleMonth.getFullYear(), cwScheduleMonth.getMonth() + 1, 1))} className="p-1 hover:bg-white rounded"><ChevronRight className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] sm:text-xs font-medium text-slate-400">
                    {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d) => <div key={`sched-d-${d}`}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {(() => {
                      const year = cwScheduleMonth.getFullYear();
                      const month = cwScheduleMonth.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const firstDay = new Date(year, month, 1).getDay() || 7;
                      const cells: any[] = [];
                      for (let i = 1; i < firstDay; i++) cells.push(<div key={`sched-empty-${i}`} />);
                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const checkedWork = cwScheduleDraftDates.includes(dateStr);
                        const checkedOff = cwScheduleDraftOffDates.includes(dateStr);
                        const checked = cwScheduleMode === 'off' ? checkedOff : checkedWork;
                        cells.push(
                          <button
                            key={`sched-day-${d}`}
                            onClick={() => {
                              const isAdmin = String(currentEmployee?.role || '').toLowerCase() === 'admin';
                              if (!cwScheduleEmployeeId) return;
                              if (checked && cwScheduleLocked && !isAdmin) return;
                              if (cwScheduleMode === 'off') {
                                const next = checkedOff ? cwScheduleDraftOffDates.filter((x) => x !== dateStr) : [...cwScheduleDraftOffDates, dateStr];
                                setCwScheduleDraftOffDates(Array.from(new Set(next)).sort());
                              } else {
                                const next = checkedWork ? cwScheduleDraftDates.filter((x) => x !== dateStr) : [...cwScheduleDraftDates, dateStr];
                                setCwScheduleDraftDates(Array.from(new Set(next)).sort());
                              }
                            }}
                            className={`min-h-[52px] sm:min-h-[64px] border rounded-lg sm:rounded-xl p-1 sm:p-2 text-left transition-all ${checked ? (cwScheduleMode === 'off' ? 'bg-rose-50 border-rose-300' : 'bg-blue-50 border-blue-300') : 'bg-white border-slate-200 hover:border-blue-300'} ${checked && cwScheduleLocked && String(currentEmployee?.role || '').toLowerCase() !== 'admin' ? 'opacity-90' : ''}`}
                          >
                            <div className="text-xs sm:text-sm font-medium text-slate-700">{d}</div>
                            {checked && <div className={`text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 ${cwScheduleMode === 'off' ? 'text-rose-700' : 'text-blue-700'}`}>{cwScheduleMode === 'off' ? 'Выходной' : 'Рабочий'}</div>}
                          </button>
                        );
                      }
                      return cells;
                    })()}
                  </div>

                  <div className="mt-4 space-y-2 pb-24 sm:pb-2">
                    {!!cwScheduleInlineError && (
                      <div className="text-sm rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2">{cwScheduleInlineError}</div>
                    )}
                    <div className="hidden sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-xs text-slate-500">После сохранения отмена выхода доступна только администратору.</div>
                      <button
                        onClick={async () => {
                          if (!cwScheduleEmployeeId) return;
                          setCwScheduleInlineError('');
                          const isAdmin = String(currentEmployee?.role || '').toLowerCase() === 'admin';

                          if (!isAdmin) {
                            const now = new Date();
                            const day = now.getDate();
                            const inWin1 = Math.abs(day - Number(cwScheduleRuleStart1 || 1)) <= 3;
                            const inWin2 = Math.abs(day - Number(cwScheduleRuleStart2 || 14)) <= 3;
                            if (!inWin1 && !inWin2) {
                              setCwScheduleInlineError(`График можно заполнять в диапазоне ±3 дня от ${cwScheduleRuleStart1} и ${cwScheduleRuleStart2} числа`);
                              return;
                            }
                            const selectedStartDay = inWin2 && !inWin1 ? Number(cwScheduleRuleStart2 || 14) : Number(cwScheduleRuleStart1 || 1);
                            const start = new Date(now.getFullYear(), now.getMonth(), selectedStartDay);
                            const end = new Date(start);
                            if (selectedStartDay === Number(cwScheduleRuleStart2 || 14) && cwScheduleRuleSecondToMonthEnd) {
                              end.setMonth(end.getMonth() + 1, 0);
                            } else {
                              end.setDate(end.getDate() + 13);
                            }
                            const inWindow = (d: string) => {
                              const dt = new Date(`${d}T00:00:00`);
                              return dt >= start && dt <= end;
                            };
                            if (![...cwScheduleDraftDates, ...cwScheduleDraftOffDates].every(inWindow)) {
                              setCwScheduleInlineError('Можно указывать только даты в окне ближайших 14 дней');
                              return;
                            }
                          }

                          const offInMonth = cwScheduleDraftOffDates.filter((d) => {
                            const dt = new Date(`${d}T00:00:00`);
                            return dt.getFullYear() === cwScheduleMonth.getFullYear() && dt.getMonth() === cwScheduleMonth.getMonth();
                          }).length;
                          if (offInMonth > Number(cwScheduleRuleMaxOffDays || 0)) {
                            setCwScheduleInlineError(`Превышен лимит выходных: максимум ${cwScheduleRuleMaxOffDays} в месяц`);
                            return;
                          }

                          if (cwScheduleRuleMutualOffEnabled) {
                            const targetEmp = employees.find((e) => String(e.id) === String(cwScheduleEmployeeId));
                            const targetName = String(targetEmp?.full_name || targetEmp?.login || '').toLowerCase();
                            const isSerega = /серег|serg|seryo|seryog/i.test(targetName);
                            const isYulia = /юл|yuli|juli/i.test(targetName);
                            if (isSerega || isYulia) {
                              const counterpart = employees.find((e) => {
                                const n = String(e.full_name || e.login || '').toLowerCase();
                                return isSerega ? /юл|yuli|juli/i.test(n) : /серег|serg|seryo|seryog/i.test(n);
                              });
                              if (counterpart?.id) {
                                const key = scheduleKeyForEmployee(String(counterpart.id));
                                const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
                                const parsed = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
                                const cpOff: string[] = Array.isArray(parsed?.offDates) ? parsed.offDates : [];
                                const clash = cwScheduleDraftOffDates.find((d) => cpOff.includes(d));
                                if (clash) {
                                  setCwScheduleInlineError(`У сотрудника ${counterpart.full_name} уже выбран выходной ${new Date(`${clash}T12:00:00`).toLocaleDateString('ru-RU')}`);
                                  return;
                                }
                              }
                            }
                          }

                          await saveEmployeeSchedule(cwScheduleEmployeeId, cwScheduleDraftDates, cwScheduleDraftOffDates, true);
                          setCwScheduleInlineError('');
                          showToast('График сохранён', 'success');
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Сохранить график
                      </button>
                    </div>
                    <div className="sm:hidden fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 backdrop-blur px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                      <div className="text-[11px] text-slate-500 mb-2">После сохранения отмена выхода доступна только администратору.</div>
                      <button
                        onClick={async () => {
                          if (!cwScheduleEmployeeId) return;
                          setCwScheduleInlineError('');
                          const isAdmin = String(currentEmployee?.role || '').toLowerCase() === 'admin';

                          if (!isAdmin) {
                            const now = new Date();
                            const day = now.getDate();
                            const inWin1 = Math.abs(day - Number(cwScheduleRuleStart1 || 1)) <= 3;
                            const inWin2 = Math.abs(day - Number(cwScheduleRuleStart2 || 14)) <= 3;
                            if (!inWin1 && !inWin2) {
                              setCwScheduleInlineError(`График можно заполнять в диапазоне ±3 дня от ${cwScheduleRuleStart1} и ${cwScheduleRuleStart2} числа`);
                              return;
                            }
                            const selectedStartDay = inWin2 && !inWin1 ? Number(cwScheduleRuleStart2 || 14) : Number(cwScheduleRuleStart1 || 1);
                            const start = new Date(now.getFullYear(), now.getMonth(), selectedStartDay);
                            const end = new Date(start);
                            if (selectedStartDay === Number(cwScheduleRuleStart2 || 14) && cwScheduleRuleSecondToMonthEnd) {
                              end.setMonth(end.getMonth() + 1, 0);
                            } else {
                              end.setDate(end.getDate() + 13);
                            }
                            const inWindow = (d: string) => {
                              const dt = new Date(`${d}T00:00:00`);
                              return dt >= start && dt <= end;
                            };
                            if (![...cwScheduleDraftDates, ...cwScheduleDraftOffDates].every(inWindow)) {
                              setCwScheduleInlineError('Можно указывать только даты в окне ближайших 14 дней');
                              return;
                            }
                          }

                          const offInMonth = cwScheduleDraftOffDates.filter((d) => {
                            const dt = new Date(`${d}T00:00:00`);
                            return dt.getFullYear() === cwScheduleMonth.getFullYear() && dt.getMonth() === cwScheduleMonth.getMonth();
                          }).length;
                          if (offInMonth > Number(cwScheduleRuleMaxOffDays || 0)) {
                            setCwScheduleInlineError(`Превышен лимит выходных: максимум ${cwScheduleRuleMaxOffDays} в месяц`);
                            return;
                          }

                          if (cwScheduleRuleMutualOffEnabled) {
                            const targetEmp = employees.find((e) => String(e.id) === String(cwScheduleEmployeeId));
                            const targetName = String(targetEmp?.full_name || targetEmp?.login || '').toLowerCase();
                            const isSerega = /серег|serg|seryo|seryog/i.test(targetName);
                            const isYulia = /юл|yuli|juli/i.test(targetName);
                            if (isSerega || isYulia) {
                              const counterpart = employees.find((e) => {
                                const n = String(e.full_name || e.login || '').toLowerCase();
                                return isSerega ? /юл|yuli|juli/i.test(n) : /серег|serg|seryo|seryog/i.test(n);
                              });
                              if (counterpart?.id) {
                                const key = scheduleKeyForEmployee(String(counterpart.id));
                                const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
                                const parsed = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
                                const cpOff: string[] = Array.isArray(parsed?.offDates) ? parsed.offDates : [];
                                const clash = cwScheduleDraftOffDates.find((d) => cpOff.includes(d));
                                if (clash) {
                                  setCwScheduleInlineError(`У сотрудника ${counterpart.full_name} уже выбран выходной ${new Date(`${clash}T12:00:00`).toLocaleDateString('ru-RU')}`);
                                  return;
                                }
                              }
                            }
                          }

                          await saveEmployeeSchedule(cwScheduleEmployeeId, cwScheduleDraftDates, cwScheduleDraftOffDates, true);
                          setCwScheduleInlineError('');
                          showToast('График сохранён', 'success');
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-medium shadow-lg hover:bg-blue-700"
                      >
                        Сохранить график
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  );
}
