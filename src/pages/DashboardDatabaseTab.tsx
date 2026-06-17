// "База данных" tab extracted from Dashboard.tsx. Pure presentational —
// all data/handlers are passed in as props.
import React from 'react';
import { Upload, History, Database, RefreshCw, Send, Download, Trash2 } from 'lucide-react';

type DatabaseLog = {
  version?: string | number;
  date?: string;
  details?: string;
  source?: string;
  status?: string;
  file_name?: string;
  file_path?: string;
  bucket?: string;
  created_at?: string;
};

type DashboardDatabaseTabProps = {
  databaseRestoreInputRef: React.RefObject<HTMLInputElement>;
  databaseHistoryRef: React.RefObject<HTMLDivElement>;
  handleRestoreDatabase: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadDatabase: () => void;
  handleCreateDatabaseBackup: () => void;
  refreshDatabaseLogs: () => void;
  databaseBackupScheduleLabel: string;
  databaseLogs: DatabaseLog[];
  databaseLogsLoading: boolean;
  databaseBackupLoading: boolean;
  databaseDownloadLoading: boolean;
  handleDownloadBackupFromHistory: (log: DatabaseLog) => void;
  handleClearDatabaseLogs: () => void;
  databaseDownloadingPath: string | null;
};

export function DashboardDatabaseTab({
  databaseRestoreInputRef,
  databaseHistoryRef,
  handleRestoreDatabase,
  handleDownloadDatabase,
  handleCreateDatabaseBackup,
  refreshDatabaseLogs,
  databaseBackupScheduleLabel,
  databaseLogs,
  databaseLogsLoading,
  databaseBackupLoading,
  databaseDownloadLoading,
  handleDownloadBackupFromHistory,
  handleClearDatabaseLogs,
  databaseDownloadingPath,
}: DashboardDatabaseTabProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">База данных</h1>
        <p className="text-slate-500 mt-1">Полные бэкапы, восстановление и лог версий базы данных</p>
        <input
          ref={databaseRestoreInputRef}
          type="file"
          accept="application/json"
          onChange={handleRestoreDatabase}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <Upload className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Восстановить базу</h3>
          <p className="text-sm text-slate-500 mb-4">Загрузка JSON-бэкапа и восстановление данных в Supabase</p>
          <button
            onClick={() => databaseRestoreInputRef.current?.click()}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
          >
            Загрузить файл
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <History className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">История базы</h3>
          <p className="text-sm text-slate-500 mb-4">Последние бэкапы и лог версий базы данных</p>
          <button
            onClick={() => databaseHistoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm"
          >
            Открыть историю
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-lg border border-slate-200">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Database className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Автобэкап БД</h3>
          <p className="text-sm text-slate-500 mb-2">{databaseBackupScheduleLabel}</p>
          <p className="text-xs text-slate-400 mb-4">Последний лог: {databaseLogs[0]?.date || 'пока нет записей'}</p>
          <div className="space-y-2">
            <button
              onClick={refreshDatabaseLogs}
              disabled={databaseLogsLoading}
              className="w-full py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm flex items-center justify-center disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${databaseLogsLoading ? 'animate-spin' : ''}`} /> Обновить историю
            </button>
            <button
              onClick={handleCreateDatabaseBackup}
              disabled={databaseBackupLoading}
              className="w-full py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 font-medium text-sm flex items-center justify-center disabled:opacity-50"
            >
              <Send className={`h-4 w-4 mr-2 ${databaseBackupLoading ? 'animate-pulse' : ''}`} /> {databaseBackupLoading ? 'Создание бэкапа...' : 'Создать бэкап'}
            </button>
            <button
              onClick={handleDownloadDatabase}
              disabled={databaseDownloadLoading}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center justify-center disabled:opacity-50"
            >
              <Download className={`h-4 w-4 mr-2 ${databaseDownloadLoading ? 'animate-pulse' : ''}`} /> {databaseDownloadLoading ? 'Скачивание...' : 'Скачать базу'}
            </button>
          </div>
        </div>
      </div>

      <div ref={databaseHistoryRef} className="oc-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900">Лог версий базы данных</h3>
          {databaseLogs.length > 0 && (
            <button
              onClick={handleClearDatabaseLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Очистить историю
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Версия</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Дата</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Описание</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Файл</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {databaseLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">История бэкапов пока пустая</td>
              </tr>
            ) : databaseLogs.map((log, index) => (
              <tr key={`${log.created_at || log.date || 'log'}-${index}`} className="hover:bg-slate-50 align-top">
                <td className="px-6 py-4 font-medium text-indigo-600">{log.version}</td>
                <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{log.date}</td>
                <td className="px-6 py-4 text-slate-600">
                  <div>{log.details}</div>
                  {(log.source || log.status || log.file_name) && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                      {log.source && <span className="rounded-full bg-slate-100 px-2 py-1">Источник: {log.source}</span>}
                      {log.status && <span className="rounded-full bg-slate-100 px-2 py-1">Статус: {log.status}</span>}
                      {log.file_name && <span className="rounded-full bg-slate-100 px-2 py-1">Файл: {log.file_name}</span>}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  {log.file_path ? (
                    <button
                      onClick={() => handleDownloadBackupFromHistory(log)}
                      disabled={databaseDownloadingPath === log.file_path}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Download className={`h-3.5 w-3.5 ${databaseDownloadingPath === log.file_path ? 'animate-pulse' : ''}`} /> Скачать
                    </button>
                  ) : (
                    <span className="text-xs text-slate-300" title="Файл не сохранён в облаке (старая запись)">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
