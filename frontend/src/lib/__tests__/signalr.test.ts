import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockBuilder, mockConnection, mockSetStatus } = vi.hoisted(() => {
  const connection = {
    start: vi.fn(),
    stop: vi.fn(),
    onreconnecting: vi.fn(),
    onreconnected: vi.fn(),
    onclose: vi.fn(),
  };
  const builder = {
    withUrl: vi.fn(),
    withAutomaticReconnect: vi.fn(),
    configureLogging: vi.fn(),
    build: vi.fn(() => connection),
  };
  const setStatus = vi.fn();
  return { mockBuilder: builder, mockConnection: connection, mockSetStatus: setStatus };
});

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(function HubConnectionBuilder() {
    return mockBuilder;
  }),
  LogLevel: { Information: 2 },
}));

vi.mock('../../stores/realtimeStore', () => ({
  useRealtimeStore: {
    getState: () => ({ setStatus: mockSetStatus }),
  },
}));

describe('SignalR 连接生命周期', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockBuilder.withUrl.mockReturnValue(mockBuilder);
    mockBuilder.withAutomaticReconnect.mockReturnValue(mockBuilder);
    mockBuilder.configureLogging.mockReturnValue(mockBuilder);
    mockConnection.stop.mockResolvedValue(undefined);
  });

  it('首次握手失败后应清理单例，下一次调用仍可重新连接', async () => {
    const { startConnection } = await import('../signalr');
    const firstError = new Error('Unauthorized');
    mockConnection.start.mockRejectedValueOnce(firstError).mockResolvedValueOnce(undefined);

    await expect(startConnection()).rejects.toThrow('Unauthorized');
    await expect(startConnection()).resolves.toBe(mockConnection);

    expect(mockBuilder.build).toHaveBeenCalledTimes(2);
    expect(mockConnection.start).toHaveBeenCalledTimes(2);
    expect(mockConnection.stop).toHaveBeenCalledOnce();
  });
});
