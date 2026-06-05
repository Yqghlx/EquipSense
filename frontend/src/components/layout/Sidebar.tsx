import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Wrench,
  AlertTriangle,
  Bell,
  ClipboardList,
  Brain,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';

/** 侧边栏导航项配置 */
const baseNavItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/devices', icon: Wrench, labelKey: 'nav.devices' },
  { path: '/alerts', icon: AlertTriangle, labelKey: 'nav.alerts' },
  { path: '/alert-rules', icon: Bell, labelKey: 'nav.alertRules' },
  { path: '/work-orders', icon: ClipboardList, labelKey: 'nav.workOrders' },
  { path: '/dispatch', icon: Users, labelKey: 'nav.dispatch' },
  { path: '/analyses', icon: Brain, labelKey: 'nav.analyses' },
  { path: '/knowledge', icon: BookOpen, labelKey: 'nav.knowledge' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

/** system_admin 专用导航项 */
const adminNavItems = [
  { path: '/admin/tenants', icon: Building2, labelKey: 'nav.tenantManagement' },
];

/**
 * 侧边栏组件
 *
 * 支持展开/收起切换，导航项高亮当前路由，
 * 收起时仅显示图标，展开时显示图标+文字。
 */
export function Sidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);

  /** 根据角色动态构建导航项列表 */
  const navItems = user?.role === 'SystemAdmin'
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems;

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border bg-[var(--sidebar-bg)] transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
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
    </aside>
  );
}
