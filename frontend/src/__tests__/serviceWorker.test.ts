import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

type ServiceWorkerEvent = {
  /** Background Sync 标签；activate 事件不提供该字段。 */
  tag?: string;
  /** 等待异步 Service Worker 工作完成。 */
  waitUntil(promise: Promise<unknown>): void;
};

type ServiceWorkerListener = (event: ServiceWorkerEvent) => void;

const mocks = vi.hoisted(() => {
  class MockNavigationRoute {
    public readonly handler: unknown;
    public readonly options: unknown;

    constructor(
      handler: unknown,
      options: unknown,
    ) {
      this.handler = handler;
      this.options = options;
    }
  }

  class MockCacheFirst {
    public readonly options: unknown;

    constructor(options: unknown) {
      this.options = options;
    }
  }

  class MockNetworkOnly {
    public readonly options: unknown;

    constructor(options: unknown) {
      this.options = options;
    }
  }

  return {
    clientsClaim: vi.fn(),
    cleanupOutdatedCaches: vi.fn(),
    createHandlerBoundToURL: vi.fn(() => vi.fn()),
    precacheAndRoute: vi.fn(),
    registerRoute: vi.fn(),
    NavigationRoute: MockNavigationRoute,
    CacheFirst: MockCacheFirst,
    NetworkOnly: MockNetworkOnly,
    CacheableResponsePlugin: class {
      public readonly options: unknown;

      constructor(options: unknown) {
        this.options = options;
      }
    },
    ExpirationPlugin: class {
      public readonly options: unknown;

      constructor(options: unknown) {
        this.options = options;
      }
    },
    getOfflineOwnerKey: vi.fn((user: { tenantId?: string; id?: string } | null) => {
      if (!user?.tenantId || !user.id) return null;
      return `${user.tenantId}:${user.id}`;
    }),
    offlineQueue: {
      sync: vi.fn().mockResolvedValue({ succeeded: [], conflicts: [], failed: [] }),
    },
  };
});

vi.mock('workbox-core', () => ({ clientsClaim: mocks.clientsClaim }));
vi.mock('workbox-cacheable-response', () => ({
  CacheableResponsePlugin: mocks.CacheableResponsePlugin,
}));
vi.mock('workbox-expiration', () => ({ ExpirationPlugin: mocks.ExpirationPlugin }));
vi.mock('workbox-precaching', () => ({
  cleanupOutdatedCaches: mocks.cleanupOutdatedCaches,
  createHandlerBoundToURL: mocks.createHandlerBoundToURL,
  precacheAndRoute: mocks.precacheAndRoute,
}));
vi.mock('workbox-routing', () => ({
  NavigationRoute: mocks.NavigationRoute,
  registerRoute: mocks.registerRoute,
}));
vi.mock('workbox-strategies', () => ({
  CacheFirst: mocks.CacheFirst,
  NetworkOnly: mocks.NetworkOnly,
}));
vi.mock('../lib/offline', () => ({
  getOfflineOwnerKey: mocks.getOfflineOwnerKey,
  offlineQueue: mocks.offlineQueue,
}));

const workerSelf = globalThis.self as unknown as {
  addEventListener: (type: string, listener: EventListener) => void;
  __WB_MANIFEST?: unknown;
};
const listeners = new Map<string, ServiceWorkerListener>();

beforeAll(async () => {
  Object.defineProperty(workerSelf, '__WB_MANIFEST', {
    configurable: true,
    value: [],
  });
  vi.spyOn(workerSelf, 'addEventListener').mockImplementation((type, listener) => {
    if (type === 'sync' || type === 'activate') {
      listeners.set(type, listener as unknown as ServiceWorkerListener);
    }
  });

  // 导入真实 Service Worker 模块，随后通过已注册的事件监听器验证运行时行为。
  await import('../sw');
});

afterAll(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

/** 触发指定 Service Worker 事件并等待其 waitUntil promise。 */
async function dispatchWorkerEvent(type: string, event: ServiceWorkerEvent): Promise<void> {
  let pending: Promise<unknown> | undefined;
  const listener = listeners.get(type);
  expect(listener).toBeDefined();
  listener?.({
    ...event,
    waitUntil: (promise) => {
      pending = promise;
    },
  });
  await pending;
}

describe('自定义 Service Worker 会话边界', () => {
  it('Background Sync 应按标签归属同步，并通过 auth/me 校验 Cookie 用户', async () => {
    const ownerKey = 'tenant-001:user-001';
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ tenantId: 'tenant-001', id: 'user-001' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await dispatchWorkerEvent('sync', {
      tag: `offline-sync-${encodeURIComponent(ownerKey)}`,
      waitUntil: vi.fn(),
    });

    expect(mocks.offlineQueue.sync).toHaveBeenCalledWith(
      ownerKey,
      expect.objectContaining({ isOwnerActive: expect.any(Function) }),
    );
    const options = mocks.offlineQueue.sync.mock.calls[0][1] as {
      isOwnerActive: () => Promise<boolean>;
    };
    await expect(options.isOwnerActive()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/me',
      expect.objectContaining({ credentials: 'include', cache: 'no-store' }),
    );
  });

  it('Cookie 用户与标签归属不一致时应拒绝后台同步', async () => {
    const ownerKey = 'tenant-001:user-001';
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ tenantId: 'tenant-002', id: 'user-002' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await dispatchWorkerEvent('sync', {
      tag: `offline-sync-${encodeURIComponent(ownerKey)}`,
      waitUntil: vi.fn(),
    });

    const options = mocks.offlineQueue.sync.mock.calls[0][1] as {
      isOwnerActive: () => Promise<boolean>;
    };
    await expect(options.isOwnerActive()).resolves.toBe(false);
  });

  it('activate 应删除历史认证 API 缓存', async () => {
    const deleteCache = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('caches', { delete: deleteCache });

    await dispatchWorkerEvent('activate', { waitUntil: vi.fn() });

    expect(deleteCache).toHaveBeenCalledWith('api-cache');
  });

  it('不带归属键的同步标签不得触发队列同步', async () => {
    await dispatchWorkerEvent('sync', { tag: 'unexpected-sync-tag', waitUntil: vi.fn() });

    expect(mocks.offlineQueue.sync).not.toHaveBeenCalled();
  });
});
