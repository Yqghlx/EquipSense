import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Wrench,
  AlertTriangle,
  Bell,
  ClipboardList,
  ClipboardCheck,
  Brain,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  Network,
  Target,
  Shield,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { useUnreadCount } from '../../hooks/useNotifications';

/** 侧边栏导航项配置 */
const baseNavItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/devices', icon: Wrench, labelKey: 'nav.devices' },
  { path: '/gateways', icon: Network, labelKey: 'nav.gateway' },
  { path: '/alerts', icon: AlertTriangle, labelKey: 'nav.alerts' },
  { path: '/alert-rules', icon: Bell, labelKey: 'nav.alertRules' },
  { path: '/work-orders', icon: ClipboardList, labelKey: 'nav.workOrders' },
  { path: '/pending-approvals', icon: ClipboardCheck, labelKey: 'nav.pendingApprovals' },
  { path: '/dispatch', icon: Users, labelKey: 'nav.dispatch' },
  { path: '/analyses', icon: Brain, labelKey: 'nav.analyses' },
  { path: '/knowledge', icon: BookOpen, labelKey: 'nav.knowledge' },
  { path: '/fmea', icon: AlertTriangle, labelKey: 'nav.fmea' },
  { path: '/evaluation', icon: Target, labelKey: 'nav.evaluation' },
  { path: '/audit-logs', icon: Shield, labelKey: 'nav.auditLogs' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

/** system_admin 专用导航项 */
const adminNavItems = [
  { path: '/users', icon: UserCog, labelKey: 'nav.users' },
  { path: '/admin/tenants', icon: Building2, labelKey: 'nav.tenantManagement' },
];

/**
 * 侧边栏组件
 *
 * 支持展开/收起切换，导航项高亮当前路由，
 * 收起时仅显示图标，展开时显示图标+文字。
 */
export function Sidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);
  const { data: unreadCount } = useUnreadCount();

  /** 根据角色动态构建导航项列表 */
  const navItems = user?.role === 'SystemAdmin'
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems;

  return (
    <>
      {/* 移动端 overlay：仅在 drawer 打开时显示，点击关闭 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-[var(--sidebar-bg)] transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
        // 移动端：fixed drawer，通过 mobileOpen 控制滑入/滑出
        'fixed inset-y-0 left-0 z-50 transform md:static md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}
    >
      {/* 品牌区域 + 收起/展开按钮 */}
      <div className="flex h-14 items-center border-b border-border px-4">
        {!collapsed && <span className="text-lg font-bold text-primary">EquipSense</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn('rounded p-1.5 text-muted-foreground hover:text-foreground', collapsed && 'mx-auto')}
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* 导航链接列表 */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map(({ path, icon: Icon, labelKey }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-2',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{t(labelKey)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* 通知铃铛 */}
      <div className="border-t border-border p-2">
        <button
          onClick={() => navigate('/notifications')}
          className={cn(
            'relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center px-2',
          )}
        >
          <Bell className="h-4 w-4 shrink-0" />
          {!collapsed && <span>通知</span>}
          {unreadCount != null && unreadCount > 0 && (
            <span className={cn(
              'flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white',
              collapsed && 'absolute -right-0.5 -top-0.5',
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
