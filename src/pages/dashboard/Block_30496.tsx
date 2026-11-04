// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { Pencil, X, RefreshCw, Save } from 'lucide-react';
import { Select } from '../../components/ui/Select';

export function Block_30496(props: any) {
  const { EMPLOYEE_PERMISSION_SECTIONS, addingEmployee, editingEmployee, handleUpdateEmployee, setEditingEmployee } = props;
  return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
              <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
                <div className="flex items-center gap-3 bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-5 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20"><Pencil className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Персонал</div>
                    <h2 className="truncate text-lg font-bold leading-tight">Редактировать сотрудника</h2>
                  </div>
                  <button type="button" onClick={() => setEditingEmployee(null)} className="rounded-xl p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleUpdateEmployee} className="flex min-h-0 flex-1 flex-col">
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">ФИО</label>
                        <input
                        type="text"
                        value={editingEmployee.full_name}
                        onChange={e => setEditingEmployee({...editingEmployee, full_name: e.target.value})}
                        className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Роль</label>
                        <Select
                        value={editingEmployee.role || 'Сборщик'}
                        onChange={e => setEditingEmployee({...editingEmployee, role: e.target.value})}
                        className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                        <option value="Сборщик">Сборщик</option>
                        <option value="Менеджер">Менеджер</option>
                        <option value="Управляющий">Управляющий</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Логин</label>
                        <input
                        type="text"
                        value={editingEmployee.login}
                        onChange={e => setEditingEmployee({...editingEmployee, login: e.target.value})}
                        className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Пароль</label>
                        <input
                        type="text"
                        value={editingEmployee.password || ''}
                        onChange={e => setEditingEmployee({...editingEmployee, password: e.target.value})}
                        className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Оставьте пустым — пароль не изменится"
                        />
                        <p className="mt-1 text-xs text-slate-400">Пароли хранятся в виде хэша. Введите новый, чтобы сбросить.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Chat ID</label>
                        <input
                        type="text"
                        value={editingEmployee.telegram_chat_id}
                        onChange={e => setEditingEmployee({...editingEmployee, telegram_chat_id: e.target.value})}
                        className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Доступ к разделам</label>
                    <div className="space-y-3">
                      {EMPLOYEE_PERMISSION_SECTIONS.map(section => (
                        <div key={section.title} className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">{section.title}</div>
                          <div className="grid grid-cols-1 gap-2">
                            {section.items.map(item => (
                              <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                                <span className="text-sm text-slate-700">{item.label}</span>
                                <button
                                  type="button"
                                  onClick={() => setEditingEmployee((prev: any) => ({
                                    ...prev,
                                    permissions: {
                                      ...prev.permissions,
                                      [item.id]: prev.permissions?.[item.id] === false ? true : false
                                    }
                                  }))}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingEmployee.permissions?.[item.id] !== false ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                >
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingEmployee.permissions?.[item.id] !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button type="button" onClick={() => setEditingEmployee(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Отмена</button>
                    <button type="submit" disabled={addingEmployee} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50">
                      {addingEmployee ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{addingEmployee ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
  );
}
