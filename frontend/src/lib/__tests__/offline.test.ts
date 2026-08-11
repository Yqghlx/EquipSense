import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PendingOperation } from '../../types';

const mocks = vi.hoisted(() => ({
  openDB: vi.fn(),
  db: {
    getAllFromIndex: vi.fn(),
    countFromIndex: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('idb', () => ({ openDB: mocks.openDB }));

import { offlineQueue } from '../offline';

const ownerA = 'tenant-001:user-001';
const ownerB = 'tenant-002:user-002';

const createOperation = (overrides: Partial<PendingOperation>): PendingOperation => ({
  id: 'op-a',
  ownerKey: ownerA,
  type: 'work-order-complete',
  url: '/api/v1/work-orders/wo-a/complete',
  method: 'POST',
  body: '{}',
  timestamp: 100,
  retryCount: 0,
  maxRetries: 3,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.openDB.mockResolvedValue(mocks.db);
  mocks.db.getAllFromIndex.mockResolvedValue([createOperation({})]);
  mocks.db.countFromIndex.mockResolvedValue(1);
  mocks.db.get.mockResolvedValue(createOperation({}));
  mocks.db.put.mockResolvedValue(undefined);
  mocks.db.delete.mockResolvedValue(undefined);
  vi.stubGlobal('fetch', vi.fn());
});

describe('offlineQueue 会话隔离', () => {
  it('数据库从 v1 升级到 v2 时应创建归属索引并清理无法归属的旧条目', async () => {
    await offlineQueue.count(ownerA);

    const [, version, options] = mocks.openDB.mock.calls[0] as [
      string,
      number,
      { upgrade: (db: unknown, oldVersion: number, newVersion: number, transaction: unknown) => void },
    ];
    const clear = vi.fn();
    const createIndex = vi.fn();
    const store = {
      indexNames: { contains: vi.fn().mockReturnValue(false) },
      createIndex,
      clear,
    };
    const transaction = { objectStore: vi.fn().mockReturnValue(store) };
    const database = {
      objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
      createObjectStore: vi.fn(),
    };

    expect(version).toBe(2);
    options.upgrade(database, 1, 2, transaction);

    expect(createIndex).toHaveBeenCalledWith('by-owner', 'ownerKey');
    expect(clear).toHaveBeenCalledOnce();
  });

  it('读取和计数必须通过归属索引限定当前租户用户', async () => {
    const later = createOperation({ id: 'op-later', timestamp: 200 });
    const earlier = createOperation({ id: 'op-earlier', timestamp: 50 });
    mocks.db.getAllFromIndex.mockResolvedValue([later, earlier]);

    await expect(offlineQueue.getAll(ownerA)).resolves.toEqual([earlier, later]);
    await expect(offlineQueue.count(ownerA)).resolves.toBe(1);

    expect(mocks.db.getAllFromIndex).toHaveBeenCalledWith(
      'pending-operations',
      'by-owner',
      ownerA,
    );
    expect(mocks.db.countFromIndex).toHaveBeenCalledWith(
      'pending-operations',
      'by-owner',
      ownerA,
    );
  });

  it('删除操作前必须再次校验归属，不能按 ID 删除其他用户的条目', async () => {
    mocks.db.get.mockResolvedValue(createOperation({ id: 'op-b', ownerKey: ownerB }));

    await offlineQueue.remove('op-b', ownerA);

    expect(mocks.db.delete).not.toHaveBeenCalled();
  });

  it('同步只发送当前归属的操作，并携带 HttpOnly Cookie', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    const operation = createOperation({});
    mocks.db.getAllFromIndex.mockResolvedValue([operation]);

    await expect(offlineQueue.sync(ownerA)).resolves.toEqual({
      succeeded: [operation.id],
      conflicts: [],
      failed: [],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      operation.url,
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(mocks.db.delete).toHaveBeenCalledWith('pending-operations', operation.id);
  });

  it('每次发送前都应等待会话归属校验，切换会话后立即停止', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    mocks.db.getAllFromIndex.mockResolvedValue([
      createOperation({ id: 'op-a' }),
      createOperation({ id: 'op-b', timestamp: 200 }),
    ]);
    let checks = 0;

    await offlineQueue.sync(ownerA, {
      isOwnerActive: async () => {
        checks += 1;
        return checks === 1;
      },
    });

    expect(checks).toBeGreaterThanOrEqual(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('没有归属键时不得打开数据库或创建离线操作', async () => {
    await expect(
      offlineQueue.add({
        ownerKey: '',
        type: 'device-note',
        url: '/api/v1/devices/device-a/note',
        method: 'POST',
        body: '{}',
      }),
    ).rejects.toThrow('必须绑定有效登录会话');
    await expect(offlineQueue.getAll('')).resolves.toEqual([]);
    await expect(offlineQueue.count('')).resolves.toBe(0);
    await expect(offlineQueue.sync('')).resolves.toEqual({
      succeeded: [],
      conflicts: [],
      failed: [],
    });

    expect(mocks.openDB).not.toHaveBeenCalled();
  });
});
