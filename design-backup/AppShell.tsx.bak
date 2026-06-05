import React, { useMemo, useState } from 'react';
import { Box, LogOut, Menu, UserCog, X } from 'lucide-react';
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
        <div className="w-9" />
      </div>

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

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {visibleMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  navigate(`/${item.id}`);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all border ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border-indigo-200 shadow-sm'
                    : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900 hover:border-slate-200'
                }`}
              >
                <item.icon className={`h-5 w-5 mr-3 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200 mt-auto">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                <UserCog className="h-6 w-6" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{currentEmployee?.full_name || 'Администратор'}</p>
                <p className="text-xs text-gray-500 truncate">{currentEmployee?.role || 'Управляющий'}</p>
              </div>
            </div>
            <button
              onClick={() => onLogout?.()}
              className="w-full inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Закончить сессию
            </button>
          </div>
        </aside>

        <main className="flex-1 p-1.5 md:p-6 overflow-y-auto pt-24 md:pt-6">
          <div className="mb-3 md:mb-4 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur px-4 py-3 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-sm font-semibold text-slate-900">{title}</div>
              <div className="text-xs text-slate-500">{subtitle}</div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500">
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Онлайн</span>
              <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Page mode</span>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
