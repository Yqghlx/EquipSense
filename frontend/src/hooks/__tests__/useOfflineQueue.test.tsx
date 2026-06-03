import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useOfflineQueue } from '../useOfflineQueue';
import type { PendingOperation, SyncResult } from '../../types';

// Mock 离线队列模块
vi.mock('../../lib/offline', () => ({
  offlineQueue: {
    count: vi.fn().mockResolvedValue(0),
    add: vi.fn().mockResolvedValue(undefined),
    sync: vi.fn().mockResolvedValue({ succeeded: [], conflicts: [], failed: [] }),
    getAll: vi.fn().mockResolvedValue([]),
    remove: vi.fn().mockResolvedValue(undefined),
    registerBackgroundSync: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock 网络状态 hook
vi.mock('../useOfflineStatus', () => ({
  useOfflineStatus: vi.fn(() => ({ isOnline: true, isOffline: false })),
}));

// 需要在 mock 之后导入，以获取被 mock 的版本
import { offlineQueue } from '../../lib/offline';
import { useOfflineStatus } from '../useOfflineStatus';

const mockedQueue = vi.mocked(offlineQueue);
const mockedOfflineStatus = vi.mocked(useOfflineStatus);

/** 创建 QueryClient 包装器，用于 hook 测试 */
const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

/** 待处理操作模拟数据 */
const mockOperation: PendingOperation = {
  id: 'op-001',
  type: 'update',
  url: '/work-orders/wo-001',
  method: 'PUT',
  body: JSON.stringify({ status: 'Completed' }),
  timestamp: Date.now(),
  retryCount: 0,
  maxRetries: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
  // 重置网络状态 mock 为在线
  mockedOfflineStatus.mockReturnValue({ isOnline: true, isOffline: false });
});

// ---------------------------------------------------------------------------
// 初始状态
// ---------------------------------------------------------------------------
describe('useOfflineQueue — 初始状态', () => {
  it('初始化时应获取待处理操作数量', async () => {
    mockedQueue.count.mockResolvedValueOnce(3);

    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.pendingCount).toBe(3));
    expect(mockedQueue.count).toHaveBeenCalled();
  });

  it('初始同步状态应为 false', async () => {
    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isSyncing).toBe(false);
  });

  it('初始同步结果应为 null', async () => {
    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    expect(result.current.lastSyncResult).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// enqueue — 入队操作
// ---------------------------------------------------------------------------
describe('useOfflineQueue — enqueue', () => {
  it('在线时应入队并立即同步', async () => {
    const syncResult: SyncResult = {
      succeeded: ['op-001'],
      conflicts: [],
      failed: [],
    };
    // add 返回值
    mockedQueue.add.mockResolvedValueOnce(mockOperation);
    // syncNow 调用 sync
    mockedQueue.sync.mockResolvedValueOnce(syncResult);
    // refreshCount 在 syncNow 之后调用
    mockedQueue.count.mockResolvedValue(0);

    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.enqueue('update', '/work-orders/wo-001', 'PUT', {
        status: 'Completed',
      });
    });

    expect(mockedQueue.add).toHaveBeenCalledWith({
      type: 'update',
      url: '/work-orders/wo-001',
      method: 'PUT',
      body: JSON.stringify({ status: 'Completed' }),
    });
    // 在线时应触发 sync，而不是 registerBackgroundSync
    expect(mockedQueue.sync).toHaveBeenCalled();
    expect(mockedQueue.registerBackgroundSync).not.toHaveBeenCalled();
  });

  it('离线时应入队并注册后台同步', async () => {
    mockedOfflineStatus.mockReturnValue({ isOnline: false, isOffline: true });
    mockedQueue.add.mockResolvedValueOnce(mockOperation);
    mockedQueue.count.mockResolvedValue(1);

    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.enqueue('create', '/work-orders', 'POST', {
        title: '新建工单',
      });
    });

    expect(mockedQueue.add).toHaveBeenCalledWith({
      type: 'create',
      url: '/work-orders',
      method: 'POST',
      body: JSON.stringify({ title: '新建工单' }),
    });
    // 离线时应调用 registerBackgroundSync，而不是 sync
    expect(mockedQueue.registerBackgroundSync).toHaveBeenCalled();
    expect(mockedQueue.sync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// syncNow — 立即同步
// ---------------------------------------------------------------------------
describe('useOfflineQueue — syncNow', () => {
  it('同步成功时应返回结果并刷新计数', async () => {
    const syncResult: SyncResult = {
      succeeded: ['op-001', 'op-002'],
      conflicts: [],
      failed: [],
    };
    mockedQueue.sync.mockResolvedValueOnce(syncResult);
    mockedQueue.count.mockResolvedValueOnce(0);

    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    let returned: SyncResult | undefined;
    await act(async () => {
      returned = await result.current.syncNow();
    });

    expect(returned).toEqual(syncResult);
    expect(result.current.lastSyncResult).toEqual(syncResult);
    expect(result.current.isSyncing).toBe(false);
  });

  it('同步期间 isSyncing 应为 true', async () => {
    // 使用一个未 resolved 的 Promise 来验证中间状态
    let resolveSync: (value: SyncResult) => void;
    const syncPromise = new Promise<SyncResult>((resolve) => {
      resolveSync = resolve;
    });
    mockedQueue.sync.mockReturnValueOnce(syncPromise);
    mockedQueue.count.mockResolvedValue(0);

    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    // 启动同步
    act(() => {
      result.current.syncNow();
    });

    // 同步进行中
    expect(result.current.isSyncing).toBe(true);

    // 完成同步
    await act(async () => {
      resolveSync!({ succeeded: [], conflicts: [], failed: [] });
    });

    expect(result.current.isSyncing).toBe(false);
  });

  it('同步失败时也应将 isSyncing 恢复为 false', async () => {
    mockedQueue.sync.mockRejectedValueOnce(new Error('同步失败'));
    mockedQueue.count.mockResolvedValue(0);

    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      // syncNow 内部 catch 后仍会执行 finally 重置状态，
      // 但这里直接调用会抛出异常，需要用 try/catch 包裹
      try {
        await result.current.syncNow();
      } catch {
        // 预期异常
      }
    });

    // finally 块确保 isSyncing 恢复
    expect(result.current.isSyncing).toBe(false);
  });

  it('有成功同步项时应刷新缓存', async () => {
    const syncResult: SyncResult = {
      succeeded: ['op-001'],
      conflicts: [],
      failed: [],
    };
    mockedQueue.sync.mockResolvedValueOnce(syncResult);
    mockedQueue.count.mockResolvedValueOnce(0);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useOfflineQueue(), { wrapper });

    await act(async () => {
      await result.current.syncNow();
    });

    // 有 succeeded 项时应刷新 work-orders / devices / alerts 缓存
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['work-orders'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['devices'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['alerts'] });
  });

  it('无成功同步项时不应刷新缓存', async () => {
    const syncResult: SyncResult = {
      succeeded: [],
      conflicts: ['op-001'],
      failed: [],
    };
    mockedQueue.sync.mockResolvedValueOnce(syncResult);
    mockedQueue.count.mockResolvedValueOnce(0);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useOfflineQueue(), { wrapper });

    await act(async () => {
      await result.current.syncNow();
    });

    // succeeded 为空，不应触发缓存刷新
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getPending — 获取所有待处理操作
// ---------------------------------------------------------------------------
describe('useOfflineQueue — getPending', () => {
  it('应返回所有待处理操作', async () => {
    mockedQueue.getAll.mockResolvedValueOnce([mockOperation]);

    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    let pending: PendingOperation[] = [];
    await act(async () => {
      pending = await result.current.getPending();
    });

    expect(pending).toEqual([mockOperation]);
    expect(mockedQueue.getAll).toHaveBeenCalled();
  });

  it('无待处理操作时应返回空数组', async () => {
    mockedQueue.getAll.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    let pending: PendingOperation[] = [];
    await act(async () => {
      pending = await result.current.getPending();
    });

    expect(pending).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// removePending — 删除单个待处理操作
// ---------------------------------------------------------------------------
describe('useOfflineQueue — removePending', () => {
  it('应删除指定操作并刷新计数', async () => {
    mockedQueue.remove.mockResolvedValueOnce(undefined);
    mockedQueue.count.mockResolvedValueOnce(0);

    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.removePending('op-001');
    });

    expect(mockedQueue.remove).toHaveBeenCalledWith('op-001');
    // remove 之后会调用 refreshCount
    expect(mockedQueue.count).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// refreshCount — 刷新待处理计数
// ---------------------------------------------------------------------------
describe('useOfflineQueue — refreshCount', () => {
  it('应更新 pendingCount', async () => {
    // 使用 mockResolvedValue 而非 mockResolvedValueOnce，
    // 因为 hook 初始化时 useEffect 也会调用 count()
    mockedQueue.count.mockResolvedValue(5);

    const { result } = renderHook(() => useOfflineQueue(), {
      wrapper: createWrapper(),
    });

    // 等待初始化的 refreshCount 完成后再手动调用
    await waitFor(() => expect(result.current.pendingCount).toBe(5));

    // 再次调用 refreshCount 验证值更新
    mockedQueue.count.mockResolvedValue(8);
    await act(async () => {
      await result.current.refreshCount();
    });

    expect(result.current.pendingCount).toBe(8);
  });
});
