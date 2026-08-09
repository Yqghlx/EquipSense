import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Sun, Moon, Globe, LogOut, User, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { RealtimeIndicator } from './RealtimeIndicator';
import { revokeSessionAndClearLocalState } from '../../lib/authSession';
import { useState } from 'react';

/**
 * 顶部导航栏组件
 *
 * 包含通知铃铛（下拉展示最近通知）、主题切换、语言切换、用户菜单（退出登录）。
 */
export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  /** 未读通知数量（最多显示 9+） */
  const unreadCount = notifications.filter((n) => !n.read).length;

  /** 退出登录并跳转到登录页 */
  const handleLogout = async () => {
    await revokeSessionAndClearLocalState();
    navigate('/login', { replace: true });
  };

  /** 切换中英文 */
  const toggleLanguage = () => {
    const next = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        {/* 移动端 hamburger 按钮：触发 AppLayout 的 drawer */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="打开菜单">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm text-muted-foreground">EquipSense</span>
      </div>

      <div className="flex items-center gap-2">
        {/* 实时连接状态指示器（绿=正常/黄=重连中/灰=断开） */}
        <RealtimeIndicator />

        {/* 通知铃铛 */}
        <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
          <DropdownMenuTrigger className="relative inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">{t('common.noData')}</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-2">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{n.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 主题切换 */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="切换主题">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* 语言切换 */}
        <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="切换语言">
          <Globe className="h-4 w-4" />
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={user?.username ?? '用户菜单'}
            className="inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-accent hover:text-accent-foreground"
          >
            <User className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm font-medium">{user?.username}</div>
            <div className="px-2 text-xs text-muted-foreground">{user?.role}</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
