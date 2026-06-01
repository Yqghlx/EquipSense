import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../stores/authStore';
import { useSignalR } from '../../hooks/useSignalR';

/**
 * 应用主布局组件
 *
 * 包含侧边栏 + 顶部导航 + 内容区域。
 * 未认证时自动重定向到登录页。
 * 认证后自动建立 SignalR 实时连接。
 */
export function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useSignalR();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
