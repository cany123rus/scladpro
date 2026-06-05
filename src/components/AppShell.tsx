import React, { useEffect, useMemo, useState } from 'react';
import { Box, LogOut, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DASHBOARD_MENU_ITEMS } from '../constants/dashboardMenu';
import type { DashboardTabId } from '../constants/dashboardTabs';

type EmployeeLike = {
  full_name?: string;
  role?: string;
  can_access_database?: boolean;
  permissions?: Record<string, boolean>;
};

type AppShellProps = {
  activeTab: DashboardTabId;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onLogout?: () => void | Promise<void>;
  currentEmployee?: EmployeeLike | null;
};

const canSeeMenuItem = (itemId: string, currentEmployee?: EmployeeLike | null) => {
  if (!currentEmployee) return true;
  if (itemId === 'database') return Boolean(currentEmployee.can_access_database);
  if (currentEmployee.permissions && currentEmployee.permissions[itemId] === false) return false;
  return true;
};

// Initials + a stable accent colour derived from the name.
const AVATAR_COLORS = [
  'from-indigo-500 to-violet-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-cyan-500',
  'from-fuchsia-500 to-purple-500',
];

const getInitials = (name?: string) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'А';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const colorFromName = (name?: string) => {
  const s = String(name || 'admin');
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

// Live Supabase connection state, driven by the events emitted in lib/supabase.ts.
const ConnectionBadge = () => {
  const [ok, setOk] = useState(true);

  useEffect(() => {
    const onIssue = () => setOk(false);
    const onOk = () => setOk(true);
    window.addEventListener('supabase:connection-issue', onIssue as EventListener);
    window.addEventListener('supabase:connection-ok', onOk as EventListener);
    return () => {
      window.removeEventListener('supabase:connection-issue', onIssue as EventListener);
      window.removeEventListener('supabase:connection-ok', onOk as EventListener);
    };
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
        ok
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
      title={ok ? 'Соединение с базой активно' : 'Проблемы с соединением — повторные попытки'}
    >
      <span className={`relative flex h-2 w-2`}>
        {ok && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      </span>
      {ok ? 'В сети' : 'Переподключение'}
    </span>
  );
};

const Clock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="hidden lg:inline text-[11px] font-medium text-slate-500 tabular-nums">
      {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
};

export default function AppShell({
  activeTab,
  children,
  title = 'Операционная система SkladPro',
  subtitle = 'Единый рабочий контур: сборка, FBS/FBO, задачи и аналитика',
  onLogout,
  currentEmployee,
}: AppShellProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const visibleMenuItems = useMemo(
    () => DASHBOARD_MENU_ITEMS.filter((item) => canSeeMenuItem(item.id, currentEmployee)),
    [currentEmployee]
  );

  const name = currentEmployee?.full_name || 'Администратор';
  const initials = getInitials(name);
  const avatarColor = colorFromName(name);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100">
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-md">
            <Box className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">СкладПро</span>
        </div>
        <ConnectionBadge />
      </div>

      {/* Mobile backdrop when sidebar open */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="flex min-h-screen">
        <aside className={`w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 flex flex-col fixed h-full overflow-y-auto custom-scrollbar z-30 transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static pt-20 md:pt-0 shadow-xl shadow-slate-200/40`}>
          <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-md">
              <Box className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 leading-none">СкладПро</span>
              <div className="text-[11px] text-slate-500">Операционная панель</div>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-0.5 mt-4">
            {visibleMenuItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(`/${item.id}`);
                    setIsSidebarOpen(false);
                  }}
                  className={`group relative w-full flex items-center pl-4 pr-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    active
                      ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-indigo-600 transition-all ${
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
                    }`}
                  />
                  <item.icon className={`h-5 w-5 mr-3 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 mt-auto">
            <div className="flex items-center mb-4">
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
                {initials}
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                <p className="text-xs text-slate-500 truncate">{currentEmployee?.role || 'Управляющий'}</p>
              </div>
            </div>
            <button
              onClick={() => onLogout?.()}
              className="w-full inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Закончить сессию
            </button>
          </div>
        </aside>

        <main className="flex-1 p-1.5 md:p-6 overflow-y-auto pt-24 md:pt-6">
          <div className="mb-3 md:mb-4 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{title}</div>
              <div className="text-xs text-slate-500 truncate">{subtitle}</div>
            </div>
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <Clock />
              <ConnectionBadge />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
