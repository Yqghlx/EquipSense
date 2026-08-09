import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../stores/notificationStore';
import { X } from 'lucide-react';

/**
 * 通知 Toast 组件
 *
 * 固定在页面右下角，展示最新的未读通知。
 * 点击跳转关联链接，5 秒后自动标记为已读。
 */
export function NotificationToast() {
  const { t } = useTranslation();
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const navigate = useNavigate();

  /** 获取最新的未读通知 */
  const unread = notifications.filter((n) => !n.read);
  const latest = unread[0];

  /** 5 秒后自动标记已读 */
  useEffect(() => {
    if (!latest) return;
    const timer = setTimeout(() => {
      markRead(latest.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [latest, markRead]);

  if (!latest) return null;

  return (
    <div
      data-testid="notification-toast"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="notification-toast fixed bottom-4 right-4 z-50 w-80 cursor-pointer rounded-lg border border-border bg-card p-4 shadow-lg transition-all"
      onClick={() => {
        markRead(latest.id);
        if (latest.link) navigate(latest.link);
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">{latest.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{latest.message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            markRead(latest.id);
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label={t('notification.close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
