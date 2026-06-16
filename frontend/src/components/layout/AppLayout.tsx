/* eslint-disable react-hooks/set-state-in-effect -- 路由切换时关闭移动端 drawer 是合法的副作用模式，无级联渲染风险 */
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
 *
 * 移动端适配（< 768px）：侧边栏变为 Drawer，默认隐藏，
 * 通过 Header 的 hamburger 按钮触发，点击 overlay 或路由切换后自动关闭。
 */
export function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useSignalR();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // 路由切换时自动关闭移动端 drawer，避免点击导航后侧边栏还盖住内容
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
