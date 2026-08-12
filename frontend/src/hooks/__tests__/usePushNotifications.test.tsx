import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePushNotifications } from '../usePushNotifications';

// Mock pushManager 模块
vi.mock('../../lib/pushManager', () => ({
  registerPushSubscription: vi.fn(),
  unregisterPushSubscription: vi.fn(),
}));

// 需要在 mock 之后导入，以获取被 mock 的版本
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from '../../lib/pushManager';

const mockedRegister = vi.mocked(registerPushSubscription);
const mockedUnregister = vi.mocked(unregisterPushSubscription);

/** 模拟 PushSubscription 对象 */
function createMockSubscription(): PushSubscription {
  return {
    endpoint: 'https://push.example.com/sub/001',
    toJSON: vi.fn(() => ({
      endpoint: 'https://push.example.com/sub/001',
      keys: { p256dh: 'test-key', auth: 'test-auth' },
    })),
    unsubscribe: vi.fn().mockResolvedValue(true),
    options: {},
  } as unknown as PushSubscription;
}

/** 保存原始 Notification 引用，便于测试后恢复 */
const originalNotification = globalThis.Notification;

/**
 * 设置 Service Worker 和 Push API 的全局 mock
 *
 * usePushNotifications 在渲染时通过 navigator.serviceWorker 和 PushManager
 * 检测浏览器支持情况，因此必须在 renderHook 之前完成全局 mock 注入。
 */
function setupServiceWorkerMock(options?: {
  /** getSubscription 返回的已有订阅（默认 null） */
  existingSubscription?: PushSubscription | null;
}) {
  const mockSubscription = createMockSubscription();
  const getSubMock = vi.fn().mockResolvedValue(options?.existingSubscription ?? null);
  const mockPushManager = {
    subscribe: vi.fn().mockResolvedValue(mockSubscription),
    getSubscription: getSubMock,
  };

  const mockRegistration = {
    pushManager: mockPushManager,
  };

  // Mock navigator.serviceWorker
  Object.defineProperty(window.navigator, 'serviceWorker', {
    value: {
      ready: Promise.resolve(mockRegistration),
      register: vi.fn().mockResolvedValue(mockRegistration),
    },
    writable: true,
    configurable: true,
  });

  // Mock PushManager 在 window 上
  Object.defineProperty(window, 'PushManager', {
    value: class PushManager {},
    writable: true,
    configurable: true,
  });

  return { mockPushManager, mockRegistration, mockSubscription, getSubMock };
}

beforeEach(() => {
  vi.clearAllMocks();

  // Mock Notification API
  globalThis.Notification = {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  } as unknown as typeof Notification;
});

afterEach(() => {
  // 恢复 Notification
  globalThis.Notification = originalNotification;

  // 恢复 navigator.serviceWorker（删除 mock 属性）
  delete (window.navigator as unknown as Record<string, unknown>).serviceWorker;

  // 删除 mock 的 PushManager
  delete (window as unknown as Record<string, unknown>).PushManager;
});

// ---------------------------------------------------------------------------
// 初始状态
// ---------------------------------------------------------------------------
describe('usePushNotifications — 初始状态', () => {
  it('浏览器不支持时应标记 isSupported 为 false', () => {
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.isSubscribed).toBe(false);
  });

  it('浏览器支持时应标记 isSupported 为 true', async () => {
    setupServiceWorkerMock();

    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isSupported).toBe(true);

    // 等待 checkSubscription useEffect 完成
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
  });

  it('初始化时应读取当前通知权限状态', () => {
    (globalThis.Notification as unknown as Record<string, string>).permission = 'granted';

    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.permission).toBe('granted');
  });
});

// ---------------------------------------------------------------------------
// subscribe — 注册推送订阅
// ---------------------------------------------------------------------------
describe('usePushNotifications — subscribe', () => {
  it('不支持时应返回 false', async () => {
    const { result } = renderHook(() => usePushNotifications());

    let success: boolean;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success!).toBe(false);
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('权限已被拒绝时应返回 false', async () => {
    setupServiceWorkerMock();
    (globalThis.Notification as unknown as Record<string, string>).permission = 'denied';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { result } = renderHook(() => usePushNotifications());

    // 等待初始化的 checkSubscription 完成
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success!).toBe(false);
    expect(mockedRegister).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('通知权限已被拒绝，请在浏览器设置中手动开启');
    warnSpy.mockRestore();
  });

  it('注册成功时应更新订阅状态', async () => {
    const { mockSubscription } = setupServiceWorkerMock();
    (globalThis.Notification as unknown as Record<string, string>).permission = 'granted';

    mockedRegister.mockResolvedValueOnce(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    // 等待初始化的 checkSubscription 完成，避免竞态条件
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success!).toBe(true);
    expect(result.current.isSubscribed).toBe(true);
    expect(mockedRegister).toHaveBeenCalled();
  });

  it('注册失败（返回 null）时应保持未订阅状态', async () => {
    setupServiceWorkerMock();
    (globalThis.Notification as unknown as Record<string, string>).permission = 'granted';

    mockedRegister.mockResolvedValueOnce(null);

    const { result } = renderHook(() => usePushNotifications());

    // 等待初始化的 checkSubscription 完成
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.subscribe();
    });

    expect(success!).toBe(false);
    expect(result.current.isSubscribed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// unsubscribe — 注销推送订阅
// ---------------------------------------------------------------------------
describe('usePushNotifications — unsubscribe', () => {
  it('无订阅时应直接返回', async () => {
    setupServiceWorkerMock();

    const { result } = renderHook(() => usePushNotifications());

    // 等待初始化完成
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(mockedUnregister).not.toHaveBeenCalled();
  });

  it('有订阅时应调用注销并重置状态', async () => {
    const { mockSubscription } = setupServiceWorkerMock();
    (globalThis.Notification as unknown as Record<string, string>).permission = 'granted';

    // 先注册一个订阅
    mockedRegister.mockResolvedValueOnce(mockSubscription);
    mockedUnregister.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => usePushNotifications());

    // 等待初始化完成
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    // 注册订阅
    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.isSubscribed).toBe(true);

    // 注销订阅
    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(mockedUnregister).toHaveBeenCalledWith(mockSubscription);
    expect(result.current.isSubscribed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkSubscription — 检查订阅状态
// ---------------------------------------------------------------------------
describe('usePushNotifications — checkSubscription', () => {
  it('浏览器不支持时不应执行检查', async () => {
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.checkSubscription();
    });

    // 不崩溃即可，isSubscribed 应保持初始值
    expect(result.current.isSubscribed).toBe(false);
  });

  it('有已存在的订阅时应标记为已订阅', async () => {
    const existingSubscription = createMockSubscription();

    // 设置 getSubscription 返回已存在的订阅
    setupServiceWorkerMock({ existingSubscription });

    const { result } = renderHook(() => usePushNotifications());

    // checkSubscription 在 useEffect 中自动调用，等待其完成
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));
  });

  it('无已存在订阅时应标记为未订阅', async () => {
    // 默认 getSubscription 返回 null
    setupServiceWorkerMock();

    const { result } = renderHook(() => usePushNotifications());

    // 等待 checkSubscription 完成后确认 isSubscribed 为 false
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current.isSubscribed).toBe(false);
  });
});
