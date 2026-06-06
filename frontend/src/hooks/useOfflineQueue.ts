import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { offlineQueue } from '../lib/offline';
import { useOfflineStatus } from './useOfflineStatus';
import type { PendingOperation, OfflineOperationType, SyncResult } from '../types';

/**
 * 离线操作队列 Hook
 *
 * 提供离线操作的入队、同步、查询能力，并集成 TanStack Query 缓存刷新。
 */
export function useOfflineQueue() {
  const queryClient = useQueryClient();
  const { isOnline } = useOfflineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const refreshCount = useCallback(async () => {
    const count = await offlineQueue.count();
    setPendingCount(count);
  }, []);

  /**
   * 立即同步所有待处理操作
   */
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    setIsSyncing(true);
    try {
      const result = await offlineQueue.sync();
      setLastSyncResult(result);
      await refreshCount();

      if (result.succeeded.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        queryClient.invalidateQueries({ queryKey: ['devices'] });
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
      }

      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient, refreshCount]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount, isOnline]);

  /**
   * 将操作加入离线队列
   */
  const enqueue = useCallback(
    async (type: OfflineOperationType, url: string, method: string, body: unknown) => {
      await offlineQueue.add({
        type,
        url,
        method,
        body: JSON.stringify(body),
      });
      await refreshCount();

      if (isOnline) {
        await syncNow();
      } else {
        await offlineQueue.registerBackgroundSync();
      }
    },
    [isOnline, refreshCount, syncNow],
  );

  /** 获取所有待处理操作 */
  const getPending = useCallback(async (): Promise<PendingOperation[]> => {
    return offlineQueue.getAll();
  }, []);

  /** 删除单个待处理操作（用户手动取消） */
  const removePending = useCallback(
    async (id: string) => {
      await offlineQueue.remove(id);
      await refreshCount();
    },
    [refreshCount],
  );

  return {
    pendingCount,
    isSyncing,
    lastSyncResult,
    enqueue,
    syncNow,
    getPending,
    removePending,
    refreshCount,
  };
}
