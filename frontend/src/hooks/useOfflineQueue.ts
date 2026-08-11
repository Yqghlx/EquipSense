import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getOfflineOwnerKey, offlineQueue } from '../lib/offline';
import { useAuthStore } from '../stores/authStore';
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
  const user = useAuthStore((state) => state.user);
  const ownerKey = getOfflineOwnerKey(user);
  const syncControllersRef = useRef<Set<AbortController>>(new Set());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const refreshCount = useCallback(async () => {
    if (!ownerKey) {
      setPendingCount(0);
      return;
    }

    const count = await offlineQueue.count(ownerKey);
    // 旧会话的异步计数可能晚于身份切换返回，不能把旧租户数量写入当前 UI。
    if (getOfflineOwnerKey(useAuthStore.getState().user) !== ownerKey) return;
    setPendingCount(count);
  }, [ownerKey]);

  /**
   * 立即同步所有待处理操作
   */
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    const emptyResult: SyncResult = { succeeded: [], conflicts: [], failed: [] };
    if (!ownerKey) {
      setLastSyncResult(emptyResult);
      setPendingCount(0);
      return emptyResult;
    }

    const controller = new AbortController();
    syncControllersRef.current.add(controller);
    setIsSyncing(true);
    // 直接读取 Zustand 当前快照，避免依赖 effect 调度或在渲染阶段写入 ref。
    const isOwnerActive = () =>
      getOfflineOwnerKey(useAuthStore.getState().user) === ownerKey;
    try {
      const result = await offlineQueue.sync(ownerKey, {
        signal: controller.signal,
        isOwnerActive,
      });

      // 旧会话即使完成了网络请求，也不能把结果写回当前用户的 UI 或缓存。
      if (controller.signal.aborted || !isOwnerActive()) {
        return emptyResult;
      }

      setLastSyncResult(result);
      await refreshCount();

      if (result.succeeded.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        queryClient.invalidateQueries({ queryKey: ['devices'] });
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
      }

      return result;
    } finally {
      syncControllersRef.current.delete(controller);
      if (isOwnerActive() && syncControllersRef.current.size === 0) {
        setIsSyncing(false);
      }
    }
  }, [ownerKey, queryClient, refreshCount]);

  /** 会话变化或组件卸载时终止旧同步，避免旧 Cookie 被后续会话复用。 */
  useEffect(() => {
    const controllers = syncControllersRef.current;
    setLastSyncResult(null);
    setPendingCount(0);
    setIsSyncing(false);
    return () => {
      for (const controller of controllers) {
        controller.abort();
      }
      controllers.clear();
    };
  }, [ownerKey]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount, isOnline]);

  /**
   * 将操作加入离线队列
   */
  const enqueue = useCallback(
    async (type: OfflineOperationType, url: string, method: string, body: unknown) => {
      if (!ownerKey) {
        throw new Error('离线操作需要有效登录会话');
      }

      await offlineQueue.add({
        ownerKey,
        type,
        url,
        method,
        body: JSON.stringify(body),
      });
      await refreshCount();

      if (isOnline) {
        await syncNow();
      } else {
        await offlineQueue.registerBackgroundSync(ownerKey);
      }
    },
    [isOnline, ownerKey, refreshCount, syncNow],
  );

  /** 获取所有待处理操作 */
  const getPending = useCallback(async (): Promise<PendingOperation[]> => {
    if (!ownerKey) return [];
    return offlineQueue.getAll(ownerKey);
  }, [ownerKey]);

  /** 删除单个待处理操作（用户手动取消） */
  const removePending = useCallback(
    async (id: string) => {
      if (!ownerKey) return;
      await offlineQueue.remove(id, ownerKey);
      await refreshCount();
    },
    [ownerKey, refreshCount],
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
