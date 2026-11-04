// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { X, Save, Plus, Users, Truck, QrCode, Pencil, Trash2, History, ClipboardCheck, Printer } from 'lucide-react';
import { Select } from '../../components/ui/Select';
import { WAREHOUSE_MONEY_OWNERS } from '../dashboardHelpers';
import { QRCodeSVG } from 'qrcode.react';

export function Tab_suppliers(props: any) {
  const { editingSupplierId, handleBindSupplierOwner, handleDeleteSupplier, handleEditSupplier, handleOpenSupplierHistory, handleSupplierSubmit, loadingSuppliers, setEditingSupplierId, setShowProductQR, setShowSupplierQR, setSupplierForm, showProductQR, showSupplierQR, submittingSupplier, supplierForm, suppliers } = props;
  return (
<>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Поставщики</h1>
                <p className="text-slate-500 mt-1">Управление базой поставщиков</p>
              </div>

              <div className="oc-card p-6 mb-8 sticky top-0 z-20">
                <form onSubmit={handleSupplierSubmit} className="flex flex-col md:flex-row gap-4 items-end" autoComplete="off">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Название поставщика</label>
                    <input
                      type="text"
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="ООО Ромашка"
                      required
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Telegram Chat ID</label>
                    <input
                      type="text"
                      value={supplierForm.telegram_chat_id}
                      onChange={(e) => setSupplierForm({ ...supplierForm, telegram_chat_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="123456789"
                      required
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">API Токен WB</label>
                    <input
                      type="text"
                      value={supplierForm.wb_api_token || ''}
                      onChange={(e) => setSupplierForm({ ...supplierForm, wb_api_token: e.target.value.trim() })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="eyJ... (Статистика)"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">API Токен WB (Продвижение)</label>
                    <input
                      type="text"
                      value={supplierForm.wb_adv_api_token || ''}
                      onChange={(e) => setSupplierForm({ ...supplierForm, wb_adv_api_token: e.target.value.trim() })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="eyJ... для раздела «Реклама API»"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex gap-2">
                    {editingSupplierId && (
                      <button type="button" onClick={() => { setSupplierForm({ name: '', telegram_chat_id: '', wb_api_token: '', wb_adv_api_token: '' }); setEditingSupplierId(null); }} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200">
                        <X className="h-5 w-5" />
                      </button>
                    )}
                    <button type="submit" disabled={submittingSupplier} className={`px-6 py-2.5 font-medium flex items-center justify-center min-w-[140px] ${editingSupplierId ? 'btn-success' : 'btn-primary'}`}>
                      {submittingSupplier ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : editingSupplierId ? <><Save className="h-5 w-5 mr-2" /> Сохранить</> : <><Plus className="h-5 w-5 mr-2" /> Добавить</>}
                    </button>
                  </div>
                </form>
              </div>

              {loadingSuppliers ? (
                <div className="text-center py-12 text-slate-400">Загрузка...</div>
              ) : suppliers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100">
                  <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p>Список поставщиков пуст</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="oc-card p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-start space-x-4 min-w-0">
                          <div className="bg-indigo-50 p-3 rounded-lg shrink-0"><Truck className="h-6 w-6 text-indigo-600" /></div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-bold text-slate-900 break-words">{supplier.name}</h3>
                            <div className="flex items-center mt-1"><span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded font-medium">TG: {supplier.telegram_chat_id}</span></div>
                          </div>
                        </div>
                        <div className="flex space-x-2 shrink-0 ml-2">
                          <button onClick={() => setShowSupplierQR(supplier)} className="text-slate-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded" title="QR код"><QrCode className="h-4 w-4" /></button>
                          <button onClick={() => handleEditSupplier(supplier)} className="text-slate-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteSupplier(supplier.id)} className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="block text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wide">Деньги на складе</label>
                        <Select
                          value={(supplier as any).warehouse_money_owner || ''}
                          onChange={(e) => handleBindSupplierOwner(supplier.id, e.target.value || null)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="">— не привязано —</option>
                          {WAREHOUSE_MONEY_OWNERS.filter((o) => {
                            const cur = (supplier as any).warehouse_money_owner;
                            const takenByOther = suppliers.some((s: any) => String(s.id) !== String(supplier.id) && s.warehouse_money_owner === o.id);
                            return o.id === cur || !takenByOther;
                          }).map((o) => (
                            <option key={`bind-${supplier.id}-${o.id}`} value={o.id}>{o.title}</option>
                          ))}
                        </Select>
                        {(supplier as any).warehouse_money_owner && (
                          <div className="mt-1 text-[11px] text-emerald-600">Уведомления о списаниях идут этому поставщику (TG: {supplier.telegram_chat_id})</div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button className="flex-1 py-2.5 bg-slate-50 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100 flex items-center justify-center" onClick={() => handleOpenSupplierHistory(supplier)}><History className="h-4 w-4 mr-2 text-slate-500" /> Поставки</button>
                        <button className="flex-1 py-2.5 bg-slate-50 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100 flex items-center justify-center" onClick={() => handleOpenSupplierHistory(supplier, 'receptions')}><ClipboardCheck className="h-4 w-4 mr-2 text-slate-500" /> Приемки</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Supplier QR Modal */}
              {showSupplierQR && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSupplierQR(null)}>
                  <div className="bg-white p-8 rounded-xl text-center" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4">QR Поставщика</h3>
                    <p className="text-slate-500 mb-4">{showSupplierQR.name}</p>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 inline-block mb-4" id="supplier-qr-code">
                      <QRCodeSVG value={`SUPPLIER:${showSupplierQR.id}`} size={200} />
                    </div>
                    <div className="flex justify-center gap-3">
                      <button onClick={() => {
                        const win = window.open();
                        if (win) {
                          const svg = document.getElementById('supplier-qr-code')?.innerHTML;
                          win.document.write(`
                            <html>
                              <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family: sans-serif;">
                                <h1>${showSupplierQR.name}</h1>
                                <div style="margin: 20px;">${svg}</div>
                                <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                              </body>
                            </html>
                          `);
                          win.document.close();
                        }
                      }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
                        <Printer className="h-4 w-4 mr-2" /> Печать
                      </button>
                      <button onClick={() => setShowSupplierQR(null)} className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">Закрыть</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Product QR Modal */}
              {showProductQR && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowProductQR(null)}>
                  <div className="bg-white p-8 rounded-xl text-center" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-4">QR Товара</h3>
                    <p className="text-slate-500 mb-4">{showProductQR.name}</p>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 inline-block mb-4" id="product-qr-code">
                      <QRCodeSVG value={`PRODUCT:${showProductQR.id}`} size={200} />
                    </div>
                    <div className="flex justify-center gap-3">
                      <button onClick={() => {
                        const win = window.open();
                        if (win) {
                          const svg = document.getElementById('product-qr-code')?.innerHTML;
                          win.document.write(`
                            <html>
                              <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family: sans-serif;">
                                <h1>${showProductQR.name}</h1>
                                <div style="margin: 20px;">${svg}</div>
                                <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                              </body>
                            </html>
                          `);
                          win.document.close();
                        }
                      }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
                        <Printer className="h-4 w-4 mr-2" /> Печать
                      </button>
                      <button onClick={() => setShowProductQR(null)} className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">Закрыть</button>
                    </div>
                  </div>
                </div>
              )}
            </>
  );
}
