import { useState, useEffect, useCallback } from 'react';

/**
 * 网络状态 Hook
 *
 * 监听浏览器的 online/offline 事件，提供当前网络状态。
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [lastChangedAt, setLastChangedAt] = useState<number>(Date.now());

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastChangedAt(Date.now());
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setLastChangedAt(Date.now());
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    /** 当前是否在线 */
    isOnline,
    /** 当前是否离线 */
    isOffline: !isOnline,
    /** 最近一次网络状态变化的时间戳 */
    lastChangedAt,
  };
}
