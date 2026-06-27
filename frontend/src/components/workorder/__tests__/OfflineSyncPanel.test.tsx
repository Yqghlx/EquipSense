import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfflineSyncPanel } from '../OfflineSyncPanel';
import type { PendingOperation, SyncResult } from '../../../types';

// Mock react-i18next：返回 key 作为翻译结果（带插值的 key 仍返回 key 字符串）
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock useOfflineStatus hook
const mockUseOfflineStatus = vi.fn();
vi.mock('../../../hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => mockUseOfflineStatus(),
}));

// Mock useOfflineQueue hook
const mockSyncNow = vi.fn();
const mockGetPending = vi.fn();
const mockRemovePending = vi.fn();
const mockUseOfflineQueue = vi.fn();
vi.mock('../../../hooks/useOfflineQueue', () => ({
  useOfflineQueue: () => mockUseOfflineQueue(),
}));

/** 构造模拟的 PendingOperation 数据 */
const mockPendingOp: PendingOperation = {
  id: 'op-001',
  type: 'work-order-complete',
  url: '/api/v1/workorders/wo-001/complete',
  method: 'POST',
  body: '{"resolution":"已修复"}',
  timestamp: Date.now(),
  retryCount: 0,
  maxRetries: 3,
};

/** 构造模拟的 SyncResult 数据 */
const mockSyncResult: SyncResult = {
  succeeded: ['op-001'],
  failed: [],
  conflicts: [],
};

beforeEach(() => {
  vi.clearAllMocks();

  // 默认值：在线、无待同步
  mockUseOfflineStatus.mockReturnValue({
    isOnline: true,
    isOffline: false,
    lastChangedAt: Date.now(),
  });

  // 默认值：无待同步操作
  mockUseOfflineQueue.mockReturnValue({
    pendingCount: 0,
    isSyncing: false,
    lastSyncResult: null,
    syncNow: mockSyncNow,
    getPending: mockGetPending.mockResolvedValue([]),
    removePending: mockRemovePending,
  });
});

describe('OfflineSyncPanel', () => {
  // ==========================================================================
  // 显示/隐藏逻辑
  // ==========================================================================

  it('在线且无待同步操作时不应渲染', () => {
    const { container } = render(<OfflineSyncPanel />);

    expect(container.innerHTML).toBe('');
  });

  it('离线时应显示面板', async () => {
    // 设置离线状态
    mockUseOfflineStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
      lastChangedAt: Date.now(),
    });

    render(<OfflineSyncPanel />);

    // 离线时应显示标题（i18n mock 返回 key）
    expect(await screen.findByText('offlineSync.titleOffline')).toBeInTheDocument();

    // 应显示自动同步提示
    expect(screen.getByText('offlineSync.autoSyncHint')).toBeInTheDocument();
  });

  it('在线且有待同步操作时应显示面板', async () => {
    // 设置有待同步操作
    mockUseOfflineQueue.mockReturnValue({
      pendingCount: 3,
      isSyncing: false,
      lastSyncResult: null,
      syncNow: mockSyncNow,
      getPending: mockGetPending.mockResolvedValue([mockPendingOp]),
      removePending: mockRemovePending,
    });

    render(<OfflineSyncPanel />);

    // 应显示标题（i18n mock 返回 key）
    expect(await screen.findByText('offlineSync.titlePending')).toBeInTheDocument();

    // 应显示待同步数量
    expect(screen.getByText('3')).toBeInTheDocument();

    // 应显示"立即同步"按钮
    expect(screen.getByText('offlineSync.syncNow')).toBeInTheDocument();
  });

  // ==========================================================================
  // 同步结果展示
  // ==========================================================================

  it('应展示最近一次同步成功的结果', async () => {
    mockUseOfflineQueue.mockReturnValue({
      pendingCount: 1,
      isSyncing: false,
      lastSyncResult: mockSyncResult,
      syncNow: mockSyncNow,
      getPending: mockGetPending.mockResolvedValue([mockPendingOp]),
      removePending: mockRemovePending,
    });

    render(<OfflineSyncPanel />);

    // 应显示同步成功的提示（i18n mock 返回 key）
    expect(await screen.findByText('offlineSync.synced')).toBeInTheDocument();
  });

  it('应展示同步失败和冲突的结果', async () => {
    const failResult: SyncResult = {
      succeeded: [],
      failed: [{ id: 'op-002', error: '网络超时' }],
      conflicts: ['op-003'],
    };

    mockUseOfflineQueue.mockReturnValue({
      pendingCount: 2,
      isSyncing: false,
      lastSyncResult: failResult,
      syncNow: mockSyncNow,
      getPending: mockGetPending.mockResolvedValue([]),
      removePending: mockRemovePending,
    });

    render(<OfflineSyncPanel />);

    // 应显示冲突和失败的提示（i18n mock 返回 key）
    expect(await screen.findByText('offlineSync.conflicts')).toBeInTheDocument();
    expect(screen.getByText('offlineSync.failed')).toBeInTheDocument();
  });

  // ==========================================================================
  // 待同步操作列表
  // ==========================================================================

  it('应展示待同步操作列表', async () => {
    const opWithRetry: PendingOperation = {
      ...mockPendingOp,
      retryCount: 2,
    };

    mockUseOfflineQueue.mockReturnValue({
      pendingCount: 1,
      isSyncing: false,
      lastSyncResult: null,
      syncNow: mockSyncNow,
      getPending: mockGetPending.mockResolvedValue([opWithRetry]),
      removePending: mockRemovePending,
    });

    render(<OfflineSyncPanel />);

    // 应显示操作类型的翻译 key（mock 返回 key 字符串）
    expect(await screen.findByText('offlineSync.op.work-order-complete')).toBeInTheDocument();
    // 应显示重试次数
    expect(screen.getByText('offlineSync.retried')).toBeInTheDocument();
  });

  // ==========================================================================
  // 交互操作
  // ==========================================================================

  it('点击同步按钮应调用 syncNow', async () => {
    const user = userEvent.setup();

    // 模拟 syncNow 返回结果
    mockSyncNow.mockResolvedValue(mockSyncResult);
    // 第二次 getPending 返回空列表（同步后无待同步）
    mockGetPending
      .mockResolvedValueOnce([mockPendingOp])
      .mockResolvedValueOnce([]);

    mockUseOfflineQueue.mockReturnValue({
      pendingCount: 1,
      isSyncing: false,
      lastSyncResult: null,
      syncNow: mockSyncNow,
      getPending: mockGetPending,
      removePending: mockRemovePending,
    });

    render(<OfflineSyncPanel />);

    const syncButton = await screen.findByText('offlineSync.syncNow');
    await user.click(syncButton);

    expect(mockSyncNow).toHaveBeenCalledTimes(1);
  });

  it('同步中时同步按钮应禁用', async () => {
    mockUseOfflineQueue.mockReturnValue({
      pendingCount: 1,
      isSyncing: true,
      lastSyncResult: null,
      syncNow: mockSyncNow,
      getPending: mockGetPending.mockResolvedValue([mockPendingOp]),
      removePending: mockRemovePending,
    });

    render(<OfflineSyncPanel />);

    // 同步中按钮应显示"同步中"文本（i18n key）并禁用
    const syncButton = await screen.findByText('offlineSync.syncing');
    expect(syncButton).toBeDisabled();
  });

  it('点击删除按钮应调用 removePending', async () => {
    const user = userEvent.setup();

    mockUseOfflineQueue.mockReturnValue({
      pendingCount: 1,
      isSyncing: false,
      lastSyncResult: null,
      syncNow: mockSyncNow,
      getPending: mockGetPending.mockResolvedValue([mockPendingOp]),
      removePending: mockRemovePending.mockResolvedValue(undefined),
    });

    render(<OfflineSyncPanel />);

    // 等待操作列表渲染（i18n mock 返回 key）
    await screen.findByText('offlineSync.op.work-order-complete');

    // 找到所有按钮中带有 X 图标的（删除按钮）
    const removeButton = screen.getByRole('button', { name: '' });
    await user.click(removeButton);

    expect(mockRemovePending).toHaveBeenCalledWith('op-001');
  });
});
