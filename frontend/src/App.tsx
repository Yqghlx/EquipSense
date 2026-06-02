import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthLayout } from './components/layout/AuthLayout';
import { AppLayout } from './components/layout/AppLayout';
import { NotificationToast } from './components/layout/NotificationToast';
import { InstallPrompt } from './components/layout/InstallPrompt';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DeviceListPage from './pages/DeviceListPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import AlertCenterPage from './pages/AlertCenterPage';
import AlertRulesPage from './pages/AlertRulesPage';
import WorkOrderListPage from './pages/WorkOrderListPage';
import WorkOrderDetailPage from './pages/WorkOrderDetailPage';
import AnalysesPage from './pages/AnalysesPage';
import KnowledgePage from './pages/KnowledgePage';
import PendingRulesPage from './pages/PendingRulesPage';
import SettingsPage from './pages/SettingsPage';
import DeviceSetupPage from './pages/DeviceSetupPage';
import DispatchBoardPage from './pages/DispatchBoardPage';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';

/**
 * 应用路由配置
 *
 * - /login 使用 AuthLayout（居中布局）
 * - 其他路由使用 AppLayout（侧边栏+头部），需认证
 * - 各业务页面目前为占位符，后续子计划逐步实现
 */
function AppRoutes() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  /** 页面加载时从 localStorage 恢复认证状态 */
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Routes>
      {/* 认证路由 */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      </Route>

      {/* 业务路由（需认证） */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/devices" element={<DeviceListPage />} />
        <Route path="/devices/:id" element={<DeviceDetailPage />} />
        <Route path="/device-setup" element={<DeviceSetupPage />} />
        <Route path="/alerts" element={<AlertCenterPage />} />
        <Route path="/alert-rules" element={<AlertRulesPage />} />
        <Route path="/work-orders" element={<WorkOrderListPage />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
        <Route path="/dispatch" element={<DispatchBoardPage />} />
        <Route path="/analyses" element={<AnalysesPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/pending-rules" element={<PendingRulesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 兜底路由 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/**
 * 应用根组件
 *
 * 顶层 Provider 依次为：
 * 1. QueryClientProvider — TanStack Query 数据请求
 * 2. BrowserRouter — 路由
 * 3. NotificationToast — 全局通知浮层
 * 4. InstallPrompt — PWA 安装提示（仅在可安装时显示）
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <NotificationToast />
        <InstallPrompt />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
