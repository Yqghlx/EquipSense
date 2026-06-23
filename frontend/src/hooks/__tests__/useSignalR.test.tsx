import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * useSignalR Hook 测试
 *
 * 验证 SignalR 连接管理的正确性：
 * - 认证后自动建立连接并注册事件处理器
 * - 未认证时调用 stopConnection 断开
 *
 * 使用 vi.hoisted() 确保 mock 对象在 vi.mock 提升时也可访问。
 * 每个测试通过 vi.resetModules() 重置模块缓存，避免 started ref 泄漏。
 */

const { mockConnection, mockAuthStore, mockPush, mockStart, mockStop } = vi.hoisted(() => {
  const conn = {
    on: vi.fn(),
    invoke: vi.fn(),
    stop: vi.fn(),
    onreconnected: vi.fn(),
  };
  return {
    mockConnection: conn,
    mockAuthStore: vi.fn(),
    mockPush: vi.fn(),
    mockStart: vi.fn().mockResolvedValue(conn),
    mockStop: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../lib/signalr', () => ({
  startConnection: () => mockStart(),
  stopConnection: () => mockStop(),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector(mockAuthStore()),
}));

vi.mock('../../stores/notificationStore', () => ({
  useNotificationStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ push: mockPush }),
}));

vi.mock('../../i18n', () => ({
  default: { t: (key: string) => key },
}));

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('useSignalR', () => {
  let useSignalR: typeof import('../useSignalR').useSignalR;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockStart.mockResolvedValue(mockConnection);

    mockAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'SystemAdmin' },
    });

    const mod = await import('../useSignalR');
    useSignalR = mod.useSignalR;
  });

  it('认证后应调用 startConnection 建立连接', async () => {
    renderHook(() => useSignalR(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledOnce();
    });
  });

  it('连接后应注册告警和遥测的 on 处理器', async () => {
    renderHook(() => useSignalR(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockConnection.on).toHaveBeenCalledWith('OnAlertTriggered', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('OnAlertResolved', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('OnTelemetryUpdate', expect.any(Function));
      // 工单事件必须被监听：SLA 升级只改 Priority 不改 Status，若不监听 OnWorkOrderEscalated，
      // 主管看到的还是旧优先级（直到手动刷新）——工业场景设备停机威胁，延误响应
      expect(mockConnection.on).toHaveBeenCalledWith('OnWorkOrderCreated', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('OnWorkOrderStatusChanged', expect.any(Function));
      expect(mockConnection.on).toHaveBeenCalledWith('OnWorkOrderEscalated', expect.any(Function));
      // 设备离线事件必须监听：设备离线不触发阈值告警（无遥测），不监听 OnDeviceStatusChanged
      // 则运维完全不知情（通信中断/故障无人知晓），设备列表/Dashboard 也不刷新
      expect(mockConnection.on).toHaveBeenCalledWith('OnDeviceStatusChanged', expect.any(Function));
    });
  });

  it('未认证时应调用 stopConnection 断开连接', async () => {
    // 先认证建立连接
    mockAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'SystemAdmin' },
    });

    const { rerender } = renderHook(() => useSignalR(), { wrapper: createWrapper() });

    // 等待连接建立
    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });

    // 切换为未认证状态
    mockAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
    rerender();

    // 验证 stopConnection 被调用
    await waitFor(() => {
      expect(mockStop).toHaveBeenCalled();
    });
  });
});
