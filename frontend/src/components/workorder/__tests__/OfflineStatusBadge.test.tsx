import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineStatusBadge } from '../OfflineStatusBadge';

// Mock useOfflineStatus hook
const mockUseOfflineStatus = vi.fn();
vi.mock('../../../hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => mockUseOfflineStatus(),
}));

// Mock useOfflineQueue hook
const mockUseOfflineQueue = vi.fn();
vi.mock('../../../hooks/useOfflineQueue', () => ({
  useOfflineQueue: () => mockUseOfflineQueue(),
}));

beforeEach(() => {
  vi.clearAllMocks();

  // 默认值：在线、无待同步
  mockUseOfflineStatus.mockReturnValue({
    isOnline: true,
    isOffline: false,
    lastChangedAt: Date.now(),
  });

  mockUseOfflineQueue.mockReturnValue({
    pendingCount: 0,
  });
});

describe('OfflineStatusBadge', () => {
  // ==========================================================================
  // 隐藏条件
  // ==========================================================================

  it('在线且无待同步操作时不应渲染', () => {
    const { container } = render(<OfflineStatusBadge />);

    expect(container.innerHTML).toBe('');
  });

  // ==========================================================================
  // 离线状态
  // ==========================================================================

  it('离线时应显示橙色 Badge', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
      lastChangedAt: Date.now(),
    });

    render(<OfflineStatusBadge />);

    // 应渲染包含"离线"文本的 Badge
    const badge = screen.getByText(/离线/);
    expect(badge).toBeInTheDocument();

    // 验证橙色样式类
    const badgeElement = badge.closest('[class*="border-orange"]');
    expect(badgeElement).toBeInTheDocument();
  });

  it('离线且有待同步操作时应显示待同步数量', () => {
    mockUseOfflineStatus.mockReturnValue({
      isOnline: false,
      isOffline: true,
      lastChangedAt: Date.now(),
    });
    mockUseOfflineQueue.mockReturnValue({
      pendingCount: 5,
    });

    render(<OfflineStatusBadge />);

    // 应显示待同步数量
    expect(screen.getByText(/离线.*5 待同步/)).toBeInTheDocument();
  });

  // ==========================================================================
  // 在线但有待同步
  // ==========================================================================

  it('在线且有待同步操作时应显示蓝色 Badge', () => {
    mockUseOfflineQueue.mockReturnValue({
      pendingCount: 3,
    });

    render(<OfflineStatusBadge />);

    // 应渲染包含"待同步"文本的 Badge
    expect(screen.getByText(/3 待同步/)).toBeInTheDocument();

    // 验证蓝色样式类
    const badge = screen.getByText(/3 待同步/);
    const badgeElement = badge.closest('[class*="border-blue"]');
    expect(badgeElement).toBeInTheDocument();
  });

  it('在线且有 0 个待同步操作时不应渲染', () => {
    mockUseOfflineQueue.mockReturnValue({
      pendingCount: 0,
    });

    const { container } = render(<OfflineStatusBadge />);

    expect(container.innerHTML).toBe('');
  });
});
