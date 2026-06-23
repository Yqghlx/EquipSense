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
 * - 【回归 #238】重连后不得重复注册处理器（避免事件触发 N+1 次）
 *
 * 使用 vi.hoisted() 确保 mock 对象在 vi.mock 提升时也可访问。
 * 每个测试通过 vi.resetModules() 重置模块缓存，避免 started ref 泄漏。
 */

const { mockConnection, mockAuthStore, mockPush, mockStart, mockStop, reconnectedCbs, handlers } = vi.hoisted(() => {
  // 累积态：记录每个事件的 handler，模拟 @microsoft/signalr .on() 的 indexOf 去重语义
  // （相同函数引用跳过）—— 这是 #238 bug 复现的关键：registerHandlers 每次新闭包引用不同，
  // 去重失效，重连重新注册会累积。
  const handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
  const reconnectedCbs: Array<() => void> = [];
  const conn = {
    on: vi.fn((method: string, handler: (...args: unknown[]) => void) => {
      const key = method.toLowerCase();
      if (!handlers[key]) handlers[key] = [];
      if (!handlers[key].includes(handler)) handlers[key].push(handler);
    }),
    invoke: vi.fn(),
    stop: vi.fn(),
    onreconnected: vi.fn((cb: () => void) => {
      reconnectedCbs.push(cb);
    }),
  };
  return {
    mockConnection: conn,
    mockAuthStore: vi.fn(),
    mockPush: vi.fn(),
    mockStart: vi.fn(),
    mockStop: vi.fn(),
    reconnectedCbs,
    handlers,
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
    // 清空累积态（普通数组/对象，clearAllMocks 不影响），避免测试间相互污染
    reconnectedCbs.length = 0;
    for (const k of Object.keys(handlers)) delete handlers[k];
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

  it('【回归】重连后不得重复注册处理器（避免事件触发 N+1 次）', async () => {
    // 旧 BUG：onreconnected(() => registerHandlers(conn)) 每次重连重新注册处理器，
    // 但 registerHandlers 每次创建新闭包（不同函数引用），@microsoft/signalr 的 .on() 用
    // indexOf 去重依赖相同引用 → 去重失效 → handler 累积。单例 HubConnection 重连保留 _methods
    // （源码确认 _methods 仅构造函数初始化），故重连 N 次后每个事件触发 N+1 次
    // （重复弹告警通知、invalidateQueries 触发 N+1 倍请求）。工业网络抖动下加剧。
    renderHook(() => useSignalR(), { wrapper: createWrapper() });
    await waitFor(() => expect(handlers['onalerttriggered']).toHaveLength(1));

    // 模拟网络抖动重连 3 次：每次真实重连触发一次 onreconnected（调用全部已注册回调）
    for (let i = 0; i < 3; i++) {
      reconnectedCbs.forEach((cb) => cb());
    }

    // 修复后重连不重新注册 → 每个事件仍 1 个处理器。
    // 旧代码会累积到 4（首次 1 + 重连 3 × 新闭包），事件触发 4 次。
    expect(handlers['onalerttriggered']).toHaveLength(1);
    expect(handlers['onworkorderescalated']).toHaveLength(1);
    expect(handlers['ondevicestatuschanged']).toHaveLength(1);
  });
});
