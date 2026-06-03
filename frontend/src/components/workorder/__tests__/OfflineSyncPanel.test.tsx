import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfflineSyncPanel } from '../OfflineSyncPanel';
import type { PendingOperation, SyncResult } from '../../../types';

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

    // 离线时应显示"离线操作队列"标题
    expect(await screen.findByText('离线操作队列')).toBeInTheDocument();

    // 应显示自动同步提示
    expect(screen.getByText('网络恢复后将自动同步所有操作')).toBeInTheDocument();
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

    // 应显示"待同步操作"标题
    expect(await screen.findByText('待同步操作')).toBeInTheDocument();

    // 应显示待同步数量
    expect(screen.getByText('3')).toBeInTheDocument();

    // 应显示"立即同步"按钮
    expect(screen.getByText('立即同步')).toBeInTheDocument();
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

    // 应显示同步成功的提示
    expect(await screen.findByText(/1 项操作已同步成功/)).toBeInTheDocument();
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

    // 应显示冲突和失败的提示
    expect(await screen.findByText(/1 项操作存在冲突/)).toBeInTheDocument();
    expect(screen.getByText(/1 项操作同步失败/)).toBeInTheDocument();
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

    // 应显示操作类型的中文标签
    expect(await screen.findByText('完成工单')).toBeInTheDocument();
    // 应显示重试次数
    expect(screen.getByText(/已重试 2 次/)).toBeInTheDocument();
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

    const syncButton = await screen.findByText('立即同步');
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

    // 同步中按钮应显示"同步中..."文本并禁用
    const syncButton = await screen.findByText('同步中...');
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

    // 等待操作列表渲染
    await screen.findByText('完成工单');

    // 找到所有按钮中带有 X 图标的（删除按钮）
    const removeButton = screen.getByRole('button', { name: '' });
    await user.click(removeButton);

    expect(mockRemovePending).toHaveBeenCalledWith('op-001');
  });
});
