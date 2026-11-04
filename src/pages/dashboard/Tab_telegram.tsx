// Вынесено из Dashboard.tsx автоматически (ленивая загрузка раздела). Данные приходят пропсами из Dashboard.
/* eslint-disable */
import { TelegramSettingsSection } from '../dashboardComponents';
import { Lock, LockOpen, Save, Send } from 'lucide-react';
import { Select } from '../../components/ui/Select';

export function Tab_telegram(props: any) {
  const { backupBotToken, handleRestoreDatabase, handleSaveSetting, handleSendTelegram, handleSendTelegramMenu, isBackupTokenLocked, isReceptionTokenLocked, isTokenLocked, selectedBotForManual, sendingTelegram, setBackupBotToken, setIsBackupTokenLocked, setIsReceptionTokenLocked, setIsTokenLocked, setSelectedBotForManual, setTelegramBotToken, setTelegramBotTokenFile, setTelegramFile, setTelegramMessage, setTelegramReceptionBotToken, setTelegramSupplierId, suppliers, telegramBotToken, telegramBotTokenFile, telegramFileRef, telegramMessage, telegramReceptionBotToken, telegramSupplierId } = props;
  return (
<TelegramSettingsSection>
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Telegram Уведомления</h1>
                <p className="text-slate-500 mt-1">Настройка отправки отчетов</p>
              </div>

              <div className="oc-card p-6">
                <form onSubmit={handleSendTelegram} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bot Token (Поставки)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                        <input
                            type={isTokenLocked ? "password" : "text"}
                            value={telegramBotToken}
                            onChange={(e) => setTelegramBotToken(e.target.value)}
                            disabled={isTokenLocked}
                            className={`w-full px-4 py-2.5 border rounded-lg outline-none ${isTokenLocked ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white border-indigo-300 ring-2 ring-indigo-100'}`}
                            placeholder="123456789:ABC-def123..."
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setIsTokenLocked(!isTokenLocked)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            title={isTokenLocked ? "Разблокировать" : "Заблокировать"}
                        >
                            {isTokenLocked ? <Lock className="h-5 w-5" /> : <LockOpen className="h-5 w-5" />}
                        </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleSaveSetting('telegram_bot_token', telegramBotToken)}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            title="Сохранить"
                        >
                            <Save className="h-5 w-5" />
                        </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bot Token (Приемка)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                        <input
                            type={isReceptionTokenLocked ? "password" : "text"}
                            value={telegramReceptionBotToken}
                            onChange={(e) => setTelegramReceptionBotToken(e.target.value)}
                            disabled={isReceptionTokenLocked}
                            className={`w-full px-4 py-2.5 border rounded-lg outline-none ${isReceptionTokenLocked ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white border-indigo-300 ring-2 ring-indigo-100'}`}
                            placeholder="123456789:ABC-def123..."
                        />
                        <button
                            type="button"
                            onClick={() => setIsReceptionTokenLocked(!isReceptionTokenLocked)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            title={isReceptionTokenLocked ? "Разблокировать" : "Заблокировать"}
                        >
                            {isReceptionTokenLocked ? <Lock className="h-5 w-5" /> : <LockOpen className="h-5 w-5" />}
                        </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleSaveSetting('telegram_reception_bot_token', telegramReceptionBotToken)}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            title="Сохранить"
                        >
                            <Save className="h-5 w-5" />
                        </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bot Token (Логи входа)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                        <input
                            type={isFileTokenLocked ? "password" : "text"}
                            value={telegramBotTokenFile}
                            onChange={(e) => setTelegramBotTokenFile(e.target.value)}
                            disabled={isFileTokenLocked}
                            className={`w-full px-4 py-2.5 border rounded-lg outline-none ${isFileTokenLocked ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white border-indigo-300 ring-2 ring-indigo-100'}`}
                            placeholder="123456789:ABC-def123..."
                        />
                        <button
                            type="button"
                            onClick={() => setIsFileTokenLocked(!isFileTokenLocked)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            title={isFileTokenLocked ? "Разблокировать" : "Заблокировать"}
                        >
                            {isFileTokenLocked ? <Lock className="h-5 w-5" /> : <LockOpen className="h-5 w-5" />}
                        </button>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                              await handleSaveSetting('telegram_login_logs_bot_token', telegramBotTokenFile);
                            }}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            title="Сохранить"
                        >
                            <Save className="h-5 w-5" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Только этот бот отправляет логи входа/выхода администраторам.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Bot Token Backup (Авто-выгрузка)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                        <input
                            type={isBackupTokenLocked ? "password" : "text"}
                            value={backupBotToken}
                            onChange={(e) => setBackupBotToken(e.target.value)}
                            disabled={isBackupTokenLocked}
                            className={`w-full px-4 py-2.5 border rounded-lg outline-none ${isBackupTokenLocked ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white border-indigo-300 ring-2 ring-indigo-100'}`}
                            placeholder="123456789:ABC-def123..."
                        />
                        <button
                            type="button"
                            onClick={() => setIsBackupTokenLocked(!isBackupTokenLocked)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            title={isBackupTokenLocked ? "Разблокировать" : "Заблокировать"}
                        >
                            {isBackupTokenLocked ? <Lock className="h-5 w-5" /> : <LockOpen className="h-5 w-5" />}
                        </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleSaveSetting('backup_bot_token', backupBotToken)}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            title="Сохранить"
                        >
                            <Save className="h-5 w-5" />
                        </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Восстановление базы данных</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleRestoreDatabase}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg"
                        />
                    </div>
                    <p className="text-xs text-red-500 mt-1">Внимание: Восстановление перезапишет существующие данные!</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Отправить через бота</label>
                    <Select
                      value={selectedBotForManual}
                      onChange={(e) => setSelectedBotForManual(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="main">Основной бот (Поставки)</option>
                      <option value="reception">Бот Приемки</option>
                      <option value="file">Бот Файлов</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Поставщик (Chat ID)</label>
                    <Select
                      value={telegramSupplierId}
                      onChange={(e) => setTelegramSupplierId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    >
                      <option value="">Выберите поставщика...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.telegram_chat_id ? `(${s.telegram_chat_id})` : '(Нет ID)'}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Сообщение</label>
                    <textarea
                      value={telegramMessage}
                      onChange={(e) => setTelegramMessage(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px]"
                      placeholder="Введите текст сообщения..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Прикрепить файл</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={telegramFileRef}
                        onChange={(e) => setTelegramFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={sendingTelegram}
                      className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center justify-center min-w-[140px]"
                    >
                      {sendingTelegram ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-2" />
                          Отправить
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendTelegramMenu}
                      className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 flex items-center justify-center min-w-[220px]"
                    >
                      Отправить кнопки меню в Telegram
                    </button>
                  </div>
                </form>
              </div>
            </div>
            </TelegramSettingsSection>
  );
}
