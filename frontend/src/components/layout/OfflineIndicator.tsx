import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

/**
 * 全局离线状态指示器
 *
 * 固定在页面顶部居中，当网络断开时显示红色横幅。
 */
export function OfflineIndicator() {
  const { t } = useTranslation();
  const { isOnline } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm text-white animate-in slide-in-from-top">
      <WifiOff className="h-4 w-4" />
      <span>{t('layout.offline')}</span>
    </div>
  );
}
