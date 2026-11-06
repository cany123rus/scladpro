// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { EmployeesSection } from '../dashboardComponents';
import { Users, Plus, Lock, Link, FileClock, Terminal, QrCode, LockOpen, Power, Trash2, Pencil, FileText, Search, Download } from 'lucide-react';
import { getEmpAvatarColor, getEmpInitials } from '../dashboardHelpers';
import { supabase } from '../../lib/supabase';

export function Tab_employees(props: any) {
  const { SHIFT_HOURS, blockedEmployeeIds, createPermanentAuthToken, employees, formatDeliveryUnits, handleDisconnectEmployee, handleDownloadSalaryReportPdf, isEmployeeOnline, mskMonthBounds, mskTodayYmd, paymentReports, paymentReportsFrom, paymentReportsLoading, paymentReportsSearch, paymentReportsTab, paymentReportsTo, setEditingEmployee, setEmployeeToDelete, setPaymentReportToDelete, setPaymentReportsFrom, setPaymentReportsSearch, setPaymentReportsTab, setPaymentReportsTo, setShiftKpiRange, setShowActivityLogModal, setShowAddEmployeeModal, setShowDevicesModal, setShowSendQRModal, shiftKpi, shiftKpiRange, showToast, toggleEmployeeBlocked } = props;
  return (
<EmployeesSection>
            <div className="max-w-6xl mx-auto">
              <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-5 sm:p-6 shadow-xl ring-1 ring-white/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-extrabold tracking-tight text-white">Сотрудники</h1>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-indigo-100/80">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 font-medium">
                          <Users className="h-3.5 w-3.5" /> Всего: {employees.length}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-medium text-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Онлайн: {employees.filter((e: any) => isEmployeeOnline(e)).length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddEmployeeModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-indigo-50 active:scale-[0.97]"
                  >
                    <Plus className="h-4 w-4" /> Добавить сотрудника
                  </button>
                </div>
              </div>

              {/* Дашборд смены + KPI */}
              <div className="mb-6 oc-card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">Дашборд смены и KPI</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Выработка и скорость · реальная смена {SHIFT_HOURS} ч (часы в сменах условны)</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <input type="date" value={shiftKpiRange.start} onChange={(e) => setShiftKpiRange((p) => ({ ...p, start: e.target.value }))} className="px-2 py-1.5 border border-slate-300 rounded-lg" />
                    <span className="text-slate-400">—</span>
                    <input type="date" value={shiftKpiRange.end} onChange={(e) => setShiftKpiRange((p) => ({ ...p, end: e.target.value }))} className="px-2 py-1.5 border border-slate-300 rounded-lg" />
                    {(() => { const t = mskTodayYmd(); const isToday = shiftKpiRange.start === t && shiftKpiRange.end === t; return (
                      <button onClick={() => setShiftKpiRange(isToday ? mskMonthBounds(new Date()) : { start: t, end: t })} className={`px-2.5 py-1.5 rounded-lg border ${isToday ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Сегодня</button>
                    ); })()}
                    <button onClick={() => setShiftKpiRange(mskMonthBounds(new Date()))} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Месяц</button>
                  </div>
                </div>
                <div className="p-5">
                  {/* Сводка за выбранный период */}
                  {(() => { const t = mskTodayYmd(); const suffix = (shiftKpiRange.start === t && shiftKpiRange.end === t) ? 'сегодня' : 'за период'; return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    <div className="rounded-2xl bg-indigo-50 p-3.5"><div className="text-lg font-extrabold text-indigo-700">{shiftKpi.rangeScans.toLocaleString('ru-RU')}</div><div className="text-[11px] text-indigo-600/70 mt-0.5">Отсканировано {suffix} (ШК)</div></div>
                    <div className="rounded-2xl bg-emerald-50 p-3.5"><div className="text-lg font-extrabold text-emerald-700">{shiftKpi.totalQty.toLocaleString('ru-RU')}</div><div className="text-[11px] text-emerald-600/70 mt-0.5">Собрано {suffix} (учтено)</div></div>
                    <div className="rounded-2xl bg-slate-100 p-3.5"><div className="text-lg font-extrabold text-slate-700">{shiftKpi.totalShifts.toLocaleString('ru-RU')}</div><div className="text-[11px] text-slate-500 mt-0.5">Смен {suffix}</div></div>
                    <div className="rounded-2xl bg-violet-50 p-3.5"><div className="text-lg font-extrabold text-violet-700">{shiftKpi.totalShifts > 0 ? (shiftKpi.totalQty / (shiftKpi.totalShifts * SHIFT_HOURS)).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) : '—'}</div><div className="text-[11px] text-violet-600/70 mt-0.5">Ср. скорость, ед/ч</div></div>
                  </div>
                  ); })()}
                  {/* Рейтинг сотрудников. Спиннер только при ПЕРВОЙ загрузке (rows пуст) —
                      при фоновом обновлении не мигаем: оставляем прошлую таблицу. */}
                  {shiftKpi.loading && shiftKpi.rows.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">Загрузка…</div>
                  ) : !shiftKpi.loading && shiftKpi.rows.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">Нет данных о сменах за период</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs">
                          <tr>
                            <th className="px-3 py-2 text-left">#</th>
                            <th className="px-3 py-2 text-left">Сотрудник</th>
                            <th className="px-3 py-2 text-right">Выработка</th>
                            <th className="px-3 py-2 text-right">Смен</th>
                            <th className="px-3 py-2 text-right">Ед/смена</th>
                            <th className="px-3 py-2 text-right">Скорость ед/ч</th>
                            <th className="px-3 py-2 text-right">Пик</th>
                            <th className="px-3 py-2 text-right">Ср. цена пика</th>
                            <th className="px-3 py-2 text-right">Заработок</th>
                            <th className="px-3 py-2 text-right">Ср. цена сборки</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftKpi.rows.map((r, i) => {
                            const maxSpeed = Math.max(1, ...shiftKpi.rows.map((x) => x.speed));
                            return (
                              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                <td className="px-3 py-2 text-left text-slate-400 font-semibold">{i + 1}</td>
                                <td className="px-3 py-2 text-left"><span className="font-medium text-slate-800">{r.name}</span> <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${r.kind === 'temp' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{r.kind === 'temp' ? 'врем.' : 'штат'}</span></td>
                                <td className="px-3 py-2 text-right font-semibold text-slate-800">{r.qty.toLocaleString('ru-RU')}</td>
                                <td className="px-3 py-2 text-right text-slate-600">{r.shifts}</td>
                                <td className="px-3 py-2 text-right text-slate-600">{r.perShift.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}</td>
                                <td className="px-3 py-2 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="hidden sm:block w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-violet-500 rounded-full" style={{ width: `${r.speed / maxSpeed * 100}%` }} /></div>
                                    <span className="font-medium text-violet-700 tabular-nums">{r.speed.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right text-amber-700 font-medium">{r.pikQty > 0 ? r.pikQty.toLocaleString('ru-RU') : '—'}</td>
                                <td className="px-3 py-2 text-right text-amber-700">{r.pikQty > 0 && r.pikEarn > 0 ? (r.pikEarn / r.pikQty).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ₽' : '—'}</td>
                                <td className="px-3 py-2 text-right text-slate-600">{(r.earnings + r.pikEarn) > 0 ? Math.round(r.earnings + r.pikEarn).toLocaleString('ru-RU') + ' ₽' : '—'}</td>
                                <td className="px-3 py-2 text-right text-slate-700 font-medium">{r.earnings > 0 && r.qty > 0 ? (r.earnings / r.qty).toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ₽' : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="oc-card overflow-hidden">
                <div className="md:hidden p-3 space-y-2">
                  {employees.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">Сотрудники не найдены</div>
                  ) : (
                    employees.map(emp => (
                      <div key={`emp-mobile-${emp.id}`} className="border border-slate-200 rounded-2xl p-3 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="relative shrink-0">
                              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${getEmpAvatarColor(emp.id || emp.full_name)} text-sm font-bold text-white shadow-sm`}>
                                {getEmpInitials(emp.full_name)}
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${isEmployeeOnline(emp) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">{emp.full_name}</div>
                              <div className="mt-0.5 text-xs text-slate-500">{emp.role || 'Сборщик'} • {emp.login}</div>
                              <div className="mt-0.5 text-xs text-slate-400">Chat ID: {emp.telegram_chat_id || '-'}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500" title="Пароли хранятся в виде хэша и не отображаются. Изменить можно в редактировании сотрудника.">
                              <Lock className="h-3 w-3" /> Пароль скрыт
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <button onClick={async () => {
                              const token = emp.auth_token || createPermanentAuthToken();
                              if (!emp.auth_token) {
                                const { error } = await supabase.from('employees').update({ auth_token: token, qr_code: `AUTH:${token}` }).eq('id', emp.id);
                                if (error) { showToast('Ошибка генерации ссылки', 'error'); return; }
                              }
                              const link = `${window.location.origin}/login?token=${token}`;
                              navigator.clipboard.writeText(link);
                              showToast('Ссылка для входа скопирована', 'success');
                            }} className="btn-ghost px-2 py-1 text-xs">Ссылка</button>
                          <button onClick={() => setShowActivityLogModal(emp)} className="btn-ghost px-2 py-1 text-xs">Лог</button>
                          <button onClick={() => setShowDevicesModal(emp)} className="btn-ghost px-2 py-1 text-xs">Устройства</button>
                          <button onClick={() => setShowSendQRModal(emp)} className="btn-ghost px-2 py-1 text-xs">QR</button>
                          <button onClick={() => setEditingEmployee(emp)} className="btn-ghost px-2 py-1 text-xs">Ред.</button>
                          <button onClick={() => toggleEmployeeBlocked(emp.id, !blockedEmployeeIds.includes(String(emp.id)))} className={`px-2 py-1 text-xs rounded border ${blockedEmployeeIds.includes(String(emp.id)) ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-amber-200 text-amber-700 hover:bg-amber-50'}`}>
                            {blockedEmployeeIds.includes(String(emp.id)) ? 'Разблок.' : 'Блок.'}
                          </button>
                          <button onClick={() => handleDisconnectEmployee(emp.id)} className="btn-danger px-2 py-1 text-xs">Откл.</button>
                          <button onClick={() => setEmployeeToDelete(emp)} className="btn-danger px-2 py-1 text-xs">Удалить</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <table className="hidden md:table w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">ФИО</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Роль</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Логин</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Пароль</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Chat ID</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Сотрудники не найдены</td>
                      </tr>
                    ) : (
                      employees.map(emp => (
                        <tr key={emp.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${getEmpAvatarColor(emp.id || emp.full_name)} text-sm font-bold text-white shadow-sm`}>
                                    {getEmpInitials(emp.full_name)}
                                  </div>
                                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${isEmployeeOnline(emp) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>
                                <span className="truncate">{emp.full_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                emp.role === 'Управляющий' ? 'bg-purple-100 text-purple-700' :
                                emp.role === 'Менеджер' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-700'
                            }`}>
                                {emp.role || 'Сборщик'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{emp.login}</td>
                          <td className="px-6 py-4 text-slate-400"><span className="inline-flex items-center gap-1 text-xs"><Lock className="h-3 w-3" /> скрыт</span></td>
                          <td className="px-6 py-4 text-slate-600">{emp.telegram_chat_id}</td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button
                                onClick={async () => {
                                    const token = emp.auth_token || createPermanentAuthToken();
                                    if (!emp.auth_token) {
                                      const { error } = await supabase.from('employees').update({ auth_token: token, qr_code: `AUTH:${token}` }).eq('id', emp.id);
                                      if (error) {
                                          showToast('Ошибка генерации ссылки', 'error');
                                          return;
                                      }
                                    }

                                    const link = `${window.location.origin}/login?token=${token}`;
                                    navigator.clipboard.writeText(link);
                                    showToast('Ссылка для входа скопирована', 'success');
                                }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Копировать ссылку для входа"
                            >
                                <Link className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setShowActivityLogModal(emp)}
                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                title="Лог действий"
                            >
                                <FileClock className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setShowDevicesModal(emp)}
                                className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                                title="Устройства"
                            >
                                <Terminal className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setShowSendQRModal(emp)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                title="Отправить QR"
                            >
                                <QrCode className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => toggleEmployeeBlocked(emp.id, !blockedEmployeeIds.includes(String(emp.id)))}
                                className={`p-2 rounded-lg ${blockedEmployeeIds.includes(String(emp.id)) ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                                title={blockedEmployeeIds.includes(String(emp.id)) ? 'Разблокировать' : 'Заблокировать'}
                            >
                                {blockedEmployeeIds.includes(String(emp.id)) ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            </button>
                            <button
                                onClick={() => handleDisconnectEmployee(emp.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Отключить"
                            >
                                <Power className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setEmployeeToDelete(emp)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Удалить"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setEditingEmployee(emp)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Редактировать"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment reports history */}
              <div className="mt-6 oc-card overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">Отчёты об оплатах</div>
                      <div className="text-xs text-slate-500">Сохранённые отчёты по оплатам</div>
                    </div>
                  </div>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1">
                    <button onClick={() => setPaymentReportsTab('delivery')} className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${paymentReportsTab === 'delivery' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Доставка</button>
                    <button onClick={() => setPaymentReportsTab('salary')} className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${paymentReportsTab === 'salary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>ЗП</button>
                    <button onClick={() => setPaymentReportsTab('temp')} className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${paymentReportsTab === 'temp' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Временные</button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="mb-3 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input value={paymentReportsSearch} onChange={(e) => setPaymentReportsSearch(e.target.value)} placeholder="Поиск: сотрудник, кто оплатил, название" className="oc-input pl-9 h-10" />
                    </div>
                    <input type="date" value={paymentReportsFrom} onChange={(e) => setPaymentReportsFrom(e.target.value)} className="oc-input h-10" title="С даты" />
                    <input type="date" value={paymentReportsTo} onChange={(e) => setPaymentReportsTo(e.target.value)} className="oc-input h-10" title="По дату" />
                  </div>
                  {paymentReportsLoading ? (
                    <div className="py-8 text-center text-sm text-slate-400">Загрузка отчётов…</div>
                  ) : (() => {
                    const q = paymentReportsSearch.trim().toLowerCase();
                    const fromTs = paymentReportsFrom ? new Date(paymentReportsFrom + 'T00:00:00').getTime() : null;
                    const toTs = paymentReportsTo ? new Date(paymentReportsTo + 'T23:59:59').getTime() : null;
                    const list = (paymentReports || []).filter((r: any) => {
                      if (r?.kind !== paymentReportsTab) return false;
                      if (q) {
                        const hay = `${r.title || ''} ${r?.payload?.paid_by || ''} ${r?.payload?.employee_name || ''}`.toLowerCase();
                        if (!hay.includes(q)) return false;
                      }
                      if (fromTs || toTs) {
                        const ts = r?.created_at ? new Date(r.created_at).getTime() : 0;
                        if (fromTs && ts < fromTs) return false;
                        if (toTs && ts > toTs) return false;
                      }
                      return true;
                    });
                    const filteredTotal = list.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
                    if (!list.length) return <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">{(q || fromTs || toTs) ? 'Ничего не найдено по фильтрам' : 'Отчётов пока нет'}</div>;
                    return [
                      <div key="pr-total" className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm">
                        <span className="text-slate-500">Найдено: <b className="text-slate-800">{list.length}</b></span>
                        <span className="text-slate-500">Сумма: <b className="text-emerald-700">{filteredTotal.toLocaleString('ru-RU')} ₽</b></span>
                      </div>,
                      ...list.map((r: any) => {
                      const items = Array.isArray(r?.payload?.items) ? r.payload.items : [];
                      return (
                        <div key={'pay-report-' + r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900">{r.title || 'Отчёт'}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span>{r?.created_at ? new Date(r.created_at).toLocaleString('ru-RU') : ''}</span>
                                {r?.payload?.paid_by && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">Оплатил: {r.payload.paid_by}</span>}
                                {r?.payload?.employee_name && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">Сотрудник: {r.payload.employee_name}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-black text-emerald-700">{Number(r.amount || 0).toLocaleString('ru-RU')} ₽</div>
                              <button onClick={() => setPaymentReportToDelete(r)} className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" title="Удалить отчёт">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          {paymentReportsTab === 'delivery' && items.length > 0 && (
                            <div className="mt-3 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="text-slate-400">
                                    <th className="py-1 pr-3 font-medium">Тип поставки</th>
                                    <th className="py-1 pr-3 font-medium">Кто вёз</th>
                                    <th className="py-1 pr-3 font-medium">Кол-во</th>
                                    <th className="py-1 pr-3 font-medium">Дата</th>
                                    <th className="py-1 font-medium text-right">Сумма</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {items.map((it: any, idx: number) => (
                                    <tr key={'pr-item-' + r.id + '-' + idx}>
                                      <td className="py-1.5 pr-3 text-slate-700">{it?.supply_type || '—'}</td>
                                      <td className="py-1.5 pr-3 text-slate-700">{it?.courier || '—'}</td>
                                      <td className="py-1.5 pr-3 text-slate-700">{formatDeliveryUnits(Number(it?.boxes || 0), Number(it?.pallets || 0))}</td>
                                      <td className="py-1.5 pr-3 text-slate-500">{it?.date ? new Date(String(it.date) + 'T12:00:00').toLocaleDateString('ru-RU') : '—'}</td>
                                      <td className="py-1.5 text-right font-semibold text-slate-900">{Number(it?.amount || 0).toLocaleString('ru-RU')} ₽</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {paymentReportsTab === 'salary' && r?.payload?.pdf_available && (
                            <div className="mt-3">
                              <button onClick={() => handleDownloadSalaryReportPdf(r)} className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">
                                <Download className="h-3.5 w-3.5" /> Скачать PDF
                              </button>
                            </div>
                          )}
                          {paymentReportsTab === 'temp' && items.length > 0 && (
                            <div className="mt-3 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="text-slate-400">
                                    <th className="py-1 pr-3 font-medium">Сотрудник</th>
                                    <th className="py-1 pr-3 font-medium">Работа</th>
                                    <th className="py-1 pr-3 font-medium">Дата</th>
                                    <th className="py-1 font-medium text-right">Сумма</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {items.map((it: any, idx: number) => (
                                    <tr key={'pr-temp-' + r.id + '-' + idx}>
                                      <td className="py-1.5 pr-3 text-slate-700">{it?.worker || '—'}</td>
                                      <td className="py-1.5 pr-3 text-slate-500">{it?.comment || '—'}</td>
                                      <td className="py-1.5 pr-3 text-slate-500">{it?.date ? new Date(String(it.date) + 'T12:00:00').toLocaleDateString('ru-RU') : '—'}</td>
                                      <td className="py-1.5 text-right font-semibold text-slate-900">{Number(it?.amount || 0).toLocaleString('ru-RU')} ₽</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })];
                  })()}
                </div>
              </div>
            </div>
            </EmployeesSection>
  );
}
