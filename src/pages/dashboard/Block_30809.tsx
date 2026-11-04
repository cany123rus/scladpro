// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Send } from 'lucide-react';

export function Block_30809(props: any) {
  const { handleSendQR, sendingQR, setShowSendQRModal, showSendQRModal } = props;
  return (
<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 w-full max-w-sm text-center">
                <div className="mb-6 flex justify-center">
                  <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm inline-block">
                    <QRCodeSVG
                      id="employee-qr-code"
                      value={`EMPLOYEE:${showSendQRModal.id}`}
                      size={150}
                    />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">QR код сотрудника</h3>
                <p className="text-slate-500 mb-6">
                  <strong>{showSendQRModal.full_name}</strong>
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={() => setShowSendQRModal(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Закрыть
                  </button>
                  <button
                    onClick={() => {
                        const printWindow = window.open('', '', 'width=400,height=400');
                        printWindow?.document.write(`
                          <html>
                            <head>
                              <title>Print QR</title>
                              <style>
                                body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                                @page { size: 58mm 40mm; margin: 0; }
                                .qr-container { width: 58mm; height: 40mm; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
                                .name { font-size: 12px; font-family: sans-serif; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50mm; }
                              </style>
                            </head>
                            <body>
                              <div class="qr-container">
                                <div class="name">${showSendQRModal.full_name}</div>
                                ${document.getElementById('employee-qr-code')?.outerHTML || ''}
                              </div>
                              <script>
                                window.onload = () => { window.print(); window.close(); }
                              </script>
                            </body>
                          </html>
                        `);
                        printWindow?.document.close();
                    }}
                    className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium flex items-center"
                  >
                    <Printer className="h-5 w-5 mr-2" />
                    Печать
                  </button>
                  <button
                    onClick={handleSendQR}
                    disabled={sendingQR}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center"
                  >
                    {sendingQR ? '...' : <Send className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
  );
}
