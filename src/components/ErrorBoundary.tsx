import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  clearing: boolean;
}

/**
 * Экран «что-то пошло не так».
 *
 * Раньше с него можно было переписать только текст глазами, и до разработчика
 * доезжал кусок без самой ошибки. Теперь отчёт копируется кнопкой целиком —
 * сообщение, стек, адрес страницы и версия сборки, — а рядом есть сброс кэша:
 * добрая половина таких падений лечится именно им (после деплоя у вкладки
 * остаются старые куски приложения).
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    clearing: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false, clearing: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private buildReport() {
    const scripts = Array.from(document.querySelectorAll('script[src]'))
      .map((s) => String((s as HTMLScriptElement).src).split('/').pop())
      .filter(Boolean)
      .slice(0, 4)
      .join(', ');
    return [
      `Ошибка: ${this.state.error?.toString() || 'нет текста'}`,
      `Страница: ${window.location.href}`,
      `Время: ${new Date().toLocaleString('ru-RU')}`,
      `Сборка: ${scripts}`,
      `Браузер: ${navigator.userAgent}`,
      '',
      'Стек:',
      String(this.state.error?.stack || '—'),
      '',
      'Компоненты:',
      String(this.state.errorInfo?.componentStack || '—'),
    ].join('\n');
  }

  private copyReport = async () => {
    const text = this.buildReport();
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
    } catch {
      // Буфер недоступен (старый браузер, нет https) — выделяем текст вручную.
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); this.setState({ copied: true }); } catch { /* пусть копируют глазами */ }
      area.remove();
    }
  };

  /** Сброс кэша приложения: вход и настройки не трогаем. */
  private hardReload = async () => {
    this.setState({ clearing: true });
    try {
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      await Promise.all((regs || []).map((r) => r.unregister()));
    } catch { /* нет service worker — и ладно */ }
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch { /* нет Cache API */ }
    try { sessionStorage.clear(); } catch { /* приватный режим */ }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Что-то пошло не так</h1>
            <p className="text-slate-600 mb-6">
              Нажмите «Сбросить кэш и обновить» — чаще всего это лечит. Если повторится,
              скопируйте отчёт кнопкой ниже и пришлите разработчику.
            </p>

            <div className="bg-slate-100 p-4 rounded-lg overflow-auto max-h-96 mb-6">
              <p className="font-mono text-sm text-red-800 font-bold mb-2">
                {this.state.error?.toString()}
              </p>
              <pre className="font-mono text-xs text-slate-700 whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={this.hardReload}
                disabled={this.state.clearing}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-60"
              >
                {this.state.clearing ? 'Обновляю…' : 'Сбросить кэш и обновить'}
              </button>
              <button
                onClick={this.copyReport}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                {this.state.copied ? 'Отчёт скопирован' : 'Скопировать отчёт'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Просто обновить
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
