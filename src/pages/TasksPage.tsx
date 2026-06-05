import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import type { DashboardTabId } from '../constants/dashboardTabs';

const Tasks = React.lazy(() => import('../components/Tasks').then((m) => ({ default: m.Tasks })));

export default function TasksPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const currentEmployee = useMemo(() => {
    try {
      const raw = localStorage.getItem('current_employee');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {}
    try {
      localStorage.removeItem('current_employee');
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
    navigate('/login');
  };

  return (
    <AppShell
      activeTab={'tasks' as DashboardTabId}
      currentEmployee={currentEmployee}
      onLogout={handleLogout}
      title="Операционная система SkladPro"
      subtitle="Единый рабочий контур: сборка, FBS/FBO, задачи и аналитика"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="max-w-full mx-auto px-4 h-full">
          <React.Suspense fallback={<div className="p-4 text-sm text-slate-500">Загрузка задач...</div>}>
            <Tasks />
          </React.Suspense>
        </div>
      </div>
    </AppShell>
  );
}
