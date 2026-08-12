import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, useEffect, useState } from 'react';
import { queryClient } from './lib/queryClient';
import { AuthLayout } from './components/layout/AuthLayout';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/layout/AuthGuard';
import { NotificationToast } from './components/layout/NotificationToast';
import { InstallPrompt } from './components/layout/InstallPrompt';
import { OfflineIndicator } from './components/layout/OfflineIndicator';
import { RootErrorBoundary } from './components/layout/RootErrorBoundary';
import { useAuthStore } from './stores/authStore';
import useTokenRefresh from './hooks/useTokenRefresh';
import { restoreSessionFromCookie } from './lib/authSession';
import { persistTokenExpiry } from './lib/tokenExpiry';
import { clearLegacyApiCache } from './lib/serviceWorkerCache';
import { shouldRenderLoginPage } from './lib/authRouting';
import { PageFallback, RouteErrorFallback, SessionRestoreFallback } from './components/layout/AppFeedback';

// 认证页面 — 首屏需要，直接导入
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// 业务页面 — 懒加载，减少首屏包体积
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DeviceListPage = lazy(() => import('./pages/DeviceListPage'));
const DeviceDetailPage = lazy(() => import('./pages/DeviceDetailPage'));
const DeviceSetupPage = lazy(() => import('./pages/DeviceSetupPage'));
const GatewayDevicesPage = lazy(() => import('./pages/GatewayDevicesPage'));
const GatewayMonitorPage = lazy(() => import('./pages/GatewayMonitorPage'));
const GatewayListPage = lazy(() => import('./pages/GatewayListPage'));
const AlertCenterPage = lazy(() => import('./pages/AlertCenterPage'));
const AlertRulesPage = lazy(() => import('./pages/AlertRulesPage'));
const WorkOrderListPage = lazy(() => import('./pages/WorkOrderListPage'));
const WorkOrderDetailPage = lazy(() => import('./pages/WorkOrderDetailPage'));
const WorkOrderReportsPage = lazy(() => import('./pages/WorkOrderReportsPage'));
const DispatchBoardPage = lazy(() => import('./pages/DispatchBoardPage'));
const AnalysesPage = lazy(() => import('./pages/AnalysesPage'));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'));
const FmeaPage = lazy(() => import('./pages/FmeaPage'));
const PendingRulesPage = lazy(() => import('./pages/PendingRulesPage'));
const PendingApprovalsPage = lazy(() => import('./pages/PendingApprovalsPage'));
const EvaluationPage = lazy(() => import('./pages/EvaluationPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TenantsPage = lazy(() => import('./pages/admin/TenantsPage'));
const TenantDetailPage = lazy(() => import('./pages/admin/TenantDetailPage'));

/**
 * 应用路由配置
 *
 * - /login 使用 AuthLayout（居中布局）
 * - 其他路由使用 AppLayout（侧边栏+头部），需认证
 * - 业务页面使用 React.lazy 懒加载，减少首屏体积
 */
function AppRoutes() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const setAuth = useAuthStore((s) => s.setAuth);
  const finishSessionRestore = useAuthStore((s) => s.finishSessionRestore);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isSessionReady = useAuthStore((s) => s.isSessionReady);
  const [sessionRestoreError, setSessionRestoreError] = useState(false);

  /**
   * 页面加载时先清理旧认证 API 缓存，再恢复 sessionStorage/HttpOnly Cookie 会话。
   *
   * 旧 Service Worker 可能仍控制当前页面；在会话探活前等待 Cache Storage 清理，
   * 确保旧版本缓存不会抢先返回上一位用户的数据。清理失败时停在安全初始化页。
   */
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      const cacheCleanupSucceeded = await clearLegacyApiCache();
      if (cancelled) return;

      if (!cacheCleanupSucceeded) {
        setSessionRestoreError(true);
        return;
      }

      loadFromStorage();

      // 当前标签页已有用户信息时无需发起额外请求；新标签页则通过 Cookie 恢复。
      if (useAuthStore.getState().isAuthenticated) {
        finishSessionRestore();
        return;
      }

      const session = await restoreSessionFromCookie();
      if (cancelled) return;
      if (session) {
        setAuth(session.user);
        if (session.expiresIn !== undefined) {
          persistTokenExpiry(session.expiresIn);
        }
      }
      finishSessionRestore();
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [finishSessionRestore, loadFromStorage, setAuth]);

  /** Access Token 过期前 5 分钟自动刷新，避免用户操作中途 401 */
  useTokenRefresh();

  if (sessionRestoreError) {
    return <SessionRestoreFallback error />;
  }

  if (!isSessionReady) {
    return <SessionRestoreFallback />;
  }

  const renderLoginPage = shouldRenderLoginPage(isAuthenticated, user);

  return (
    <Routes>
      {/* 认证路由 */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={renderLoginPage ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
        <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />} />
      </Route>

      {/* 业务路由（需认证，AuthGuard 保护） */}
      <Route element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          {/* 路由级错误边界：单页面崩溃时在此兜底，避免影响整个 AppLayout（侧边栏/头部仍可用） */}
          <Route errorElement={<RouteErrorFallback />}>
            <Route path="/dashboard" element={<Suspense fallback={<PageFallback />}><DashboardPage /></Suspense>} />
            <Route path="/devices" element={<Suspense fallback={<PageFallback />}><DeviceListPage /></Suspense>} />
            <Route path="/devices/:id" element={<Suspense fallback={<PageFallback />}><DeviceDetailPage /></Suspense>} />
            <Route path="/device-setup" element={<Suspense fallback={<PageFallback />}><DeviceSetupPage /></Suspense>} />
            <Route path="/gateway/devices" element={<Suspense fallback={<PageFallback />}><GatewayDevicesPage /></Suspense>} />
            <Route path="/gateways" element={<Suspense fallback={<PageFallback />}><GatewayListPage /></Suspense>} />
            <Route path="/gateways/:gatewayId" element={<Suspense fallback={<PageFallback />}><GatewayMonitorPage /></Suspense>} />
            <Route path="/gateway/monitor" element={<Navigate to="/gateways" replace />} />
            <Route path="/alerts" element={<Suspense fallback={<PageFallback />}><AlertCenterPage /></Suspense>} />
            <Route path="/alert-rules" element={<Suspense fallback={<PageFallback />}><AlertRulesPage /></Suspense>} />
            <Route path="/work-orders" element={<Suspense fallback={<PageFallback />}><WorkOrderListPage /></Suspense>} />
            <Route path="/work-orders/reports" element={<Suspense fallback={<PageFallback />}><WorkOrderReportsPage /></Suspense>} />
            <Route path="/work-orders/:id" element={<Suspense fallback={<PageFallback />}><WorkOrderDetailPage /></Suspense>} />
            <Route path="/pending-approvals" element={<Suspense fallback={<PageFallback />}><PendingApprovalsPage /></Suspense>} />
            <Route path="/notifications" element={<Suspense fallback={<PageFallback />}><NotificationsPage /></Suspense>} />
            <Route path="/audit-logs" element={<Suspense fallback={<PageFallback />}><AuditLogsPage /></Suspense>} />
            <Route path="/users" element={<Suspense fallback={<PageFallback />}><UsersPage /></Suspense>} />
            <Route path="/dispatch" element={<Suspense fallback={<PageFallback />}><DispatchBoardPage /></Suspense>} />
            <Route path="/analyses" element={<Suspense fallback={<PageFallback />}><AnalysesPage /></Suspense>} />
            <Route path="/knowledge" element={<Suspense fallback={<PageFallback />}><KnowledgePage /></Suspense>} />
            <Route path="/fmea" element={<Suspense fallback={<PageFallback />}><FmeaPage /></Suspense>} />
            <Route path="/evaluation" element={<Suspense fallback={<PageFallback />}><EvaluationPage /></Suspense>} />
            <Route path="/pending-rules" element={<Suspense fallback={<PageFallback />}><PendingRulesPage /></Suspense>} />
            <Route path="/settings" element={<Suspense fallback={<PageFallback />}><SettingsPage /></Suspense>} />
            {/* system_admin 管理路由 */}
            <Route path="/admin/tenants" element={<Suspense fallback={<PageFallback />}><TenantsPage /></Suspense>} />
            <Route path="/admin/tenants/:id" element={<Suspense fallback={<PageFallback />}><TenantDetailPage /></Suspense>} />
          </Route>
        </Route>
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
    <RootErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <NotificationToast />
          <InstallPrompt />
          <OfflineIndicator />
        </BrowserRouter>
      </QueryClientProvider>
    </RootErrorBoundary>
  );
}
