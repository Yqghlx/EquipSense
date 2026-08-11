import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PendingOperation, SyncResult, UserInfo } from '../types';

/** IndexedDB 数据库 Schema 定义 */
interface OfflineDBSchema extends DBSchema {
  'pending-operations': {
    key: string;
    value: PendingOperation;
    indexes: {
      'by-timestamp': number;
      'by-type': string;
      'by-owner': string;
    };
  };
}

const DB_NAME = 'equipsense-offline';
const DB_VERSION = 2;

/**
 * 生成离线队列归属键。
 *
 * 归属键只使用租户 ID 和用户 ID，不保存用户名、邮箱等个人信息；
 * 队列读写和同步必须带上该键，避免同一浏览器切换会话后误操作上一位用户的数据。
 */
export function getOfflineOwnerKey(
  user: Pick<UserInfo, 'tenantId' | 'id'> | null | undefined,
): string | null {
  const tenantId = user?.tenantId?.trim();
  const userId = user?.id?.trim();
  if (!tenantId || !userId) return null;
  return `${tenantId}:${userId}`;
}

/** 同步过程的会话约束，用于在 Cookie 会话切换时中止旧请求。 */
export interface OfflineSyncOptions {
  /** 当前会话同步控制器，登出或切换用户时触发中止。 */
  signal?: AbortSignal;
  /** 在每次发送前确认同步仍属于当前登录会话。 */
  isOwnerActive?: () => boolean | Promise<boolean>;
}

/** 获取 IndexedDB 数据库实例（单例模式） */
async function getDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  return openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      const store = db.objectStoreNames.contains('pending-operations')
        ? transaction.objectStore('pending-operations')
        : db.createObjectStore('pending-operations', { keyPath: 'id' });

      if (!store.indexNames.contains('by-timestamp')) {
        store.createIndex('by-timestamp', 'timestamp');
      }
      if (!store.indexNames.contains('by-type')) {
        store.createIndex('by-type', 'type');
      }
      if (!store.indexNames.contains('by-owner')) {
        store.createIndex('by-owner', 'ownerKey');
      }

      if (oldVersion < 2) {
        // v1 条目没有会话归属，无法证明其属于当前用户；升级时清理比误同步更安全。
        store.clear();
      }
    },
  });
}

/**
 * 离线操作队列 — 基于 IndexedDB 的持久化存储
 *
 * 提供离线操作的添加、查询、删除和批量同步能力。
 * 所有操作持久化到 IndexedDB，即使关闭浏览器也不会丢失。
 */
export const offlineQueue = {
  /**
   * 添加离线操作到队列
   */
  async add(
    operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>,
  ): Promise<PendingOperation> {
    if (!operation.ownerKey?.trim()) {
      throw new Error('离线操作必须绑定有效登录会话');
    }

    const db = await getDB();
    const entry: PendingOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };
    await db.put('pending-operations', entry);
    return entry;
  },

  /** 获取所有待同步操作（按时间升序排列） */
  async getAll(ownerKey: string): Promise<PendingOperation[]> {
    if (!ownerKey) return [];

    const db = await getDB();
    const operations = await db.getAllFromIndex('pending-operations', 'by-owner', ownerKey);
    return operations.sort((a, b) => a.timestamp - b.timestamp);
  },

  /** 获取待同步操作数量 */
  async count(ownerKey: string): Promise<number> {
    if (!ownerKey) return 0;

    const db = await getDB();
    return db.countFromIndex('pending-operations', 'by-owner', ownerKey);
  },

  /** 按 ID 获取单个操作 */
  async get(id: string, ownerKey: string): Promise<PendingOperation | undefined> {
    if (!ownerKey) return undefined;

    const db = await getDB();
    const operation = await db.get('pending-operations', id);
    return operation?.ownerKey === ownerKey ? operation : undefined;
  },

  /** 删除当前会话归属的指定操作（同步成功或用户手动取消后调用） */
  async remove(id: string, ownerKey: string): Promise<void> {
    if (!ownerKey) return;

    const db = await getDB();
    const operation = await db.get('pending-operations', id);
    if (operation?.ownerKey === ownerKey) {
      await db.delete('pending-operations', id);
    }
  },

  /** 更新当前会话归属操作的重试次数 */
  async incrementRetry(id: string, ownerKey: string): Promise<void> {
    if (!ownerKey) return;

    const db = await getDB();
    const entry = await db.get('pending-operations', id);
    if (entry?.ownerKey === ownerKey) {
      entry.retryCount += 1;
      await db.put('pending-operations', entry);
    }
  },

  /** 清空当前会话归属的待同步操作 */
  async clear(ownerKey: string): Promise<void> {
    if (!ownerKey) return;

    const db = await getDB();
    const operations = await this.getAll(ownerKey);
    const transaction = db.transaction('pending-operations', 'readwrite');
    for (const operation of operations) {
      await transaction.store.delete(operation.id);
    }
    await transaction.done;
  },

  /**
   * 同步所有待处理操作到服务器
   *
   * 逐条发送：
   * - 200/201: 同步成功，从队列中移除
   * - 409 Conflict: 版本冲突，标记为冲突，从队列中移除
   * - 其他错误: 增加重试次数，超过最大重试次数则标记为失败
   */
  async sync(ownerKey: string, options: OfflineSyncOptions = {}): Promise<SyncResult> {
    const result: SyncResult = { succeeded: [], failed: [], conflicts: [] };
    if (!ownerKey) return result;

    const shouldStop = async () => {
      if (options.signal?.aborted === true) return true;
      if (!options.isOwnerActive) return false;
      return !(await options.isOwnerActive());
    };
    const operations = await this.getAll(ownerKey);

    for (const op of operations) {
      if (await shouldStop()) break;

      try {
        // 认证通过 Cookie 自动携带（credentials: 'include'），无需手动设置 Authorization 头
        const response = await fetch(op.url, {
          method: op.method,
          credentials: 'include', // 携带 HttpOnly Cookie（access_token）
          headers: {
            'Content-Type': 'application/json',
          },
          body: op.body,
          ...(options.signal ? { signal: options.signal } : {}),
        });

        // 响应返回后再次确认会话，避免切换用户后用错误会话修改队列状态。
        if (await shouldStop()) break;

        if (response.ok) {
          await this.remove(op.id, ownerKey);
          result.succeeded.push(op.id);
        } else if (response.status === 409) {
          await this.remove(op.id, ownerKey);
          result.conflicts.push(op.id);
        } else {
          await this.incrementRetry(op.id, ownerKey);
          const current = await this.get(op.id, ownerKey);
          if (current && current.retryCount >= current.maxRetries) {
            await this.remove(op.id, ownerKey);
            result.failed.push({ id: op.id, error: `HTTP ${response.status}` });
          }
        }
      } catch {
        // AbortController 或会话代际变化触发的中止不是失败，不增加旧操作的重试次数。
        if (await shouldStop()) break;

        await this.incrementRetry(op.id, ownerKey);
        const current = await this.get(op.id, ownerKey);
        if (current && current.retryCount >= current.maxRetries) {
          await this.remove(op.id, ownerKey);
          result.failed.push({ id: op.id, error: '网络异常' });
        }
      }
    }

    return result;
  },

  /**
   * 注册 Background Sync（如果浏览器支持）
   */
  async registerBackgroundSync(ownerKey: string, tag = 'offline-sync'): Promise<boolean> {
    if (!ownerKey) return false;

    if (!('serviceWorker' in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await (registration as unknown as { sync: { register(tag: string): Promise<void> } })
          .sync.register(`${tag}-${encodeURIComponent(ownerKey)}`);
        return true;
      }
    } catch {
      // Background Sync 不支持或注册失败，静默处理
    }
    return false;
  },
};
