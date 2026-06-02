import { CloudOff, Wifi } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

/**
 * 离线状态徽章
 *
 * 显示在工单标题旁，指示当前网络状态和待同步操作数。
 * 在线且无待同步操作时隐藏，离线时显示橙色提示，在线但有
 * 待同步数据时显示蓝色提示。
 */
export function OfflineStatusBadge() {
  const { isOffline } = useOfflineStatus();
  const { pendingCount } = useOfflineQueue();

  // 在线且无待同步操作时不显示
  if (!isOffline && pendingCount === 0) return null;

  if (isOffline) {
    return (
      <Badge variant="outline" className="gap-1 border-orange-300 text-orange-600">
        <CloudOff className="h-3 w-3" />
        离线 {pendingCount > 0 && `(${pendingCount} 待同步)`}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 border-blue-300 text-blue-600">
      <Wifi className="h-3 w-3" />
      {pendingCount} 待同步
    </Badge>
  );
}
