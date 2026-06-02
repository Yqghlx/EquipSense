import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PendingOperation, SyncResult } from '../types';

/** IndexedDB 数据库 Schema 定义 */
interface OfflineDBSchema extends DBSchema {
  'pending-operations': {
    key: string;
    value: PendingOperation;
    indexes: {
      'by-timestamp': number;
      'by-type': string;
    };
  };
}

const DB_NAME = 'equipsense-offline';
const DB_VERSION = 1;

/** 获取 IndexedDB 数据库实例（单例模式） */
async function getDB(): Promise<IDBPDatabase<OfflineDBSchema>> {
  return openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('pending-operations', { keyPath: 'id' });
      store.createIndex('by-timestamp', 'timestamp');
      store.createIndex('by-type', 'type');
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
  async getAll(): Promise<PendingOperation[]> {
    const db = await getDB();
    const all = await db.getAll('pending-operations');
    return all.sort((a, b) => a.timestamp - b.timestamp);
  },

  /** 获取待同步操作数量 */
  async count(): Promise<number> {
    const db = await getDB();
    return db.count('pending-operations');
  },

  /** 按 ID 获取单个操作 */
  async get(id: string): Promise<PendingOperation | undefined> {
    const db = await getDB();
    return db.get('pending-operations', id);
  },

  /** 删除指定操作（同步成功后调用） */
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('pending-operations', id);
  },

  /** 更新操作的重试次数 */
  async incrementRetry(id: string): Promise<void> {
    const db = await getDB();
    const entry = await db.get('pending-operations', id);
    if (entry) {
      entry.retryCount += 1;
      await db.put('pending-operations', entry);
    }
  },

  /** 清空所有待同步操作 */
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('pending-operations');
  },

  /**
   * 同步所有待处理操作到服务器
   *
   * 逐条发送：
   * - 200/201: 同步成功，从队列中移除
   * - 409 Conflict: 版本冲突，标记为冲突，从队列中移除
   * - 其他错误: 增加重试次数，超过最大重试次数则标记为失败
   */
  async sync(): Promise<SyncResult> {
    const operations = await this.getAll();
    const result: SyncResult = { succeeded: [], failed: [], conflicts: [] };

    for (const op of operations) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(op.url, {
          method: op.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: op.body,
        });

        if (response.ok) {
          await this.remove(op.id);
          result.succeeded.push(op.id);
        } else if (response.status === 409) {
          await this.remove(op.id);
          result.conflicts.push(op.id);
        } else {
          await this.incrementRetry(op.id);
          const current = await this.get(op.id);
          if (current && current.retryCount >= current.maxRetries) {
            await this.remove(op.id);
            result.failed.push({ id: op.id, error: `HTTP ${response.status}` });
          }
        }
      } catch {
        await this.incrementRetry(op.id);
        const current = await this.get(op.id);
        if (current && current.retryCount >= current.maxRetries) {
          await this.remove(op.id);
          result.failed.push({ id: op.id, error: '网络异常' });
        }
      }
    }

    return result;
  },

  /**
   * 注册 Background Sync（如果浏览器支持）
   */
  async registerBackgroundSync(tag = 'offline-sync'): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      if ('sync' in registration) {
        await (registration as unknown as { sync: { register(tag: string): Promise<void> } })
          .sync.register(tag);
        return true;
      }
    } catch {
      // Background Sync 不支持或注册失败，静默处理
    }
    return false;
  },
};
