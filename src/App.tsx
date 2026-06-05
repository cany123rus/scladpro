import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
// Heavy pages are lazy-loaded so the initial bundle stays small (jspdf, exceljs,
// zxing, html2canvas etc. live inside these and load only when the page opens).
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SharedAnalytics = lazy(() => import('./pages/SharedAnalytics'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
import { DASHBOARD_TAB_IDS, DEFAULT_DASHBOARD_TAB, isDashboardTabId } from './constants/dashboardTabs';
import { PageSkeleton } from './components/Skeleton';

const PageFallback = () => <PageSkeleton />;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const employee = localStorage.getItem('current_employee');

  if (loading) return <PageSkeleton />;
  if (!session && !employee) return <Navigate to="/login" />;
  return <>{children}</>;
};

const DashboardIndexRedirect = () => {
  let target = DEFAULT_DASHBOARD_TAB;
  try {
    const saved = String(localStorage.getItem('dashboard_active_tab_v1') || '').trim();
    if (isDashboardTabId(saved)) target = saved;
  } catch {}
  return <Navigate to={`/${target}`} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/shared/:token" element={<SharedAnalytics />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardIndexRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      {DASHBOARD_TAB_IDS.filter((tabId) => tabId !== 'tasks').map((tabId) => (
        <Route
          key={tabId}
          path={`/${tabId}`}
          element={
            <ProtectedRoute>
              <Dashboard forcedTab={tabId} />
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
