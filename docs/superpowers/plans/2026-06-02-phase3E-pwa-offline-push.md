# Phase 3E: PWA 离线 + 推送通知 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 EquipSense 添加完整的 PWA 离线能力和 Web Push 推送通知。离线场景下支持工单执行报告、审批操作和设备备注的编辑队列，网络恢复后自动同步；推送通知在浏览器未打开时也能触达用户。

**Architecture:** 前端通过 vite-plugin-pwa + Workbox 实现 App Shell 预缓存和 API Stale-While-Revalidate 策略；IndexedDB (idb) 存储离线操作队列，Background Sync API 触发网络恢复同步；后端新增 PushSubscription 实体和 Web Push 服务（VAPID），与现有 SignalRNotificationService 集成。

**Tech Stack:** vite-plugin-pwa (Workbox)、idb (IndexedDB)、Web Push API、Web Push (C# NuGet)、.NET 8、EF Core 8、PostgreSQL、React 19 + TanStack Query + shadcn/ui

---

## 文件结构

```
frontend/
├── public/
│   ├── offline.html                        -- 离线回退页面
│   ├── icon-192.png                        -- (已存在或待补充)
│   ├── icon-512.png                        -- (已存在或待补充)
├── src/
│   ├── lib/
│   │   ├── offline.ts                      -- 离线操作队列 (IndexedDB)
│   │   ├── pushManager.ts                  -- 推送订阅管理
│   ├── hooks/
│   │   ├── useOfflineStatus.ts             -- 网络状态 hook
│   │   ├── usePushNotifications.ts         -- 推送通知 hook
│   │   ├── useOfflineQueue.ts              -- 离线队列操作 hook
│   ├── components/
│   │   ├── layout/
│   │   │   ├── OfflineIndicator.tsx        -- 全局离线状态指示器
│   │   │   ├── InstallPrompt.tsx           -- (已有，增强 A2HS)
│   ├── types/
│   │   ├── index.ts                        -- (已有，追加离线类型)
│   ├── sw-dev.ts                           -- 开发环境 SW 注册入口
src/EquipAI.Core/
├── Entities/PushSubscription.cs            -- 推送订阅实体
├── Interfaces/IPushNotificationService.cs  -- 推送通知服务接口
src/EquipAI.Application/
├── Notifications/
│   ├── PushSubscriptionService.cs          -- 订阅注册/注销
│   ├── PushNotificationService.cs          -- 发送推送
│   ├── DTOs/PushSubscriptionDto.cs         -- 推送订阅 DTO
src/EquipAI.Infrastructure/
├── Data/Configurations/
│   ├── PushSubscriptionConfiguration.cs    -- EF 表映射
src/EquipAI.WebAPI/
├── Controllers/
│   ├── PushSubscriptionsController.cs      -- 推送订阅 API
```

---

### Task 1: vite-plugin-pwa 配置增强 + Service Worker + 离线回退

**目标:** 完善现有 vite-plugin-pwa 配置，添加 App Shell 预缓存、API Stale-While-Revalidate 策略、静态资源 Cache-First、离线回退页面和 A2HS 提示增强。

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/components/layout/InstallPrompt.tsx`
- Create: `frontend/public/offline.html`
- Create: `frontend/src/hooks/useOfflineStatus.ts`
- Create: `frontend/src/components/layout/OfflineIndicator.tsx`
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/hooks/__tests__/useOfflineStatus.test.ts`

- [ ] **Step 1: 创建离线回退页面**

```html
<!-- frontend/public/offline.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EquipSense - 离线</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8fafc;
      color: #1e293b;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    p {
      color: #64748b;
      margin-bottom: 1.5rem;
    }
    button {
      padding: 0.75rem 1.5rem;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">&#128268;</div>
    <h1>当前处于离线状态</h1>
    <p>EquipSense 无法连接到服务器。请检查网络连接后重试。</p>
    <p>您正在进行中的操作已安全保存，网络恢复后将自动同步。</p>
    <button onclick="window.location.reload()">重试连接</button>
  </div>
</body>
</html>
```

- [ ] **Step 2: 增强 vite-plugin-pwa 配置**

修改 `frontend/vite.config.ts`，升级 VitePWA 配置：

```typescript
// 在现有 VitePWA 配置中替换为：
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'offline.html'],
  manifest: {
    name: 'EquipSense — 工业设备智能监控',
    short_name: 'EquipSense',
    description: '工业设备智能监控与预测维护平台',
    theme_color: '#2563eb',
    background_color: '#ffffff',
    display: 'standalone',
    start_url: '/dashboard',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    // 导航请求离线回退
    navigateFallback: '/offline.html',
    navigateFallbackDenylist: [/^\/api/, /^\/hubs/],
    runtimeCaching: [
      // API 数据: Stale-While-Revalidate（优先缓存，后台更新）
      {
        urlPattern: /^https?:\/\/.*\/api\/v1\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 10 },
          cacheableResponse: { statuses: [0, 200] },
          // 带上认证头
          fetchOptions: { credentials: 'include' as RequestCredentials },
        },
      },
      // 静态资源（字体、图片等）: Cache-First
      {
        urlPattern: /\.(?:woff2|woff|ttf|otf|eot)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'font-cache',
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
  devOptions: {
    enabled: false,
  },
}),
```

- [ ] **Step 3: 创建 useOfflineStatus hook**

```typescript
// frontend/src/hooks/useOfflineStatus.ts
import { useState, useEffect, useCallback } from 'react';

/**
 * 网络状态 Hook
 *
 * 监听浏览器的 online/offline 事件，提供当前网络状态。
 * - isOnline: 当前是否在线
 * - isOffline: 当前是否离线
 * - lastChangedAt: 最近一次网络状态变化的时间戳
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [lastChangedAt, setLastChangedAt] = useState<number>(Date.now());

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastChangedAt(Date.now());
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setLastChangedAt(Date.now());
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    /** 当前是否在线 */
    isOnline,
    /** 当前是否离线 */
    isOffline: !isOnline,
    /** 最近一次网络状态变化的时间戳 */
    lastChangedAt,
  };
}
```

- [ ] **Step 4: 创建全局离线状态指示器组件**

```typescript
// frontend/src/components/layout/OfflineIndicator.tsx
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * 全局离线状态指示器
 *
 * 固定在页面顶部居中，当网络断开时显示红色横幅，
 * 网络恢复时短暂显示绿色横幅后自动消失。
 */
export function OfflineIndicator() {
  const { isOnline, isOffline } = useOfflineStatus();

  // 在线状态不显示任何内容
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm text-white animate-in slide-in-from-top">
      <WifiOff className="h-4 w-4" />
      <span>网络已断开 — 您的操作将在恢复连接后自动同步</span>
    </div>
  );
}
```

- [ ] **Step 5: 在 App.tsx 中挂载 OfflineIndicator**

在 `App` 组件中，在 `<InstallPrompt />` 下方添加：

```typescript
import { OfflineIndicator } from './components/layout/OfflineIndicator';

// 在 App 组件的 JSX 中，与 InstallPrompt 并列
<OfflineIndicator />
<NotificationToast />
<InstallPrompt />
```

- [ ] **Step 6: 在 types/index.ts 追加离线相关类型**

在 `frontend/src/types/index.ts` 文件末尾追加：

```typescript
// ============================================================================
// 离线操作队列
// ============================================================================

/** 离线操作类型 */
export type OfflineOperationType =
  | 'work-order-complete'
  | 'work-order-accept'
  | 'work-order-reject'
  | 'device-note';

/** 离线操作队列条目 */
export interface PendingOperation {
  /** 操作唯一标识（UUID） */
  id: string;
  /** 操作类型 */
  type: OfflineOperationType;
  /** 请求 URL */
  url: string;
  /** HTTP 方法 */
  method: string;
  /** 请求体（JSON 序列化） */
  body: string;
  /** 创建时间戳（毫秒） */
  timestamp: number;
  /** 重试次数 */
  retryCount: number;
  /** 最大重试次数 */
  maxRetries: number;
}

/** 离线操作同步结果 */
export interface SyncResult {
  /** 成功同步的操作 ID 列表 */
  succeeded: string[];
  /** 失败的操作（包含 ID 和错误信息） */
  failed: Array<{ id: string; error: string }>;
  /** 因冲突（409）而失败的操作 ID 列表 */
  conflicts: string[];
}
```

- [ ] **Step 7: 编写 useOfflineStatus 测试**

```typescript
// frontend/src/hooks/__tests__/useOfflineStatus.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineStatus } from '../useOfflineStatus';

describe('useOfflineStatus', () => {
  beforeEach(() => {
    // 默认在线
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
    vi.clearAllMocks();
  });

  it('初始状态应反映 navigator.onLine', () => {
    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
  });

  it('offline 事件触发后应更新为离线状态', () => {
    const { result } = renderHook(() => useOfflineStatus());

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('online 事件触发后应恢复在线状态', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });

    const { result } = renderHook(() => useOfflineStatus());
    expect(result.current.isOnline).toBe(false);

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('网络状态变化时 lastChangedAt 应更新', () => {
    const { result } = renderHook(() => useOfflineStatus());
    const initialTime = result.current.lastChangedAt;

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.lastChangedAt).toBeGreaterThanOrEqual(initialTime);
  });
});
```

- [ ] **Step 8: 运行测试确认通过**

```bash
cd frontend && npx vitest run src/hooks/__tests__/useOfflineStatus.test.ts
```

Expected: 所有测试通过

- [ ] **Step 9: 编译确认**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 无 TypeScript 错误

- [ ] **Step 10: 提交**

```bash
git add frontend/public/offline.html frontend/vite.config.ts frontend/src/types/index.ts frontend/src/hooks/useOfflineStatus.ts frontend/src/components/layout/OfflineIndicator.tsx frontend/src/App.tsx frontend/src/hooks/__tests__/useOfflineStatus.test.ts
git commit -m "feat(pwa): vite-plugin-pwa 配置增强 + 离线回退页面 + 网络状态指示器"
```

---

### Task 2: 离线操作队列 (IndexedDB + Background Sync)

**目标:** 实现基于 IndexedDB 的离线操作队列，支持工单完成、审批和设备备注的离线存储，网络恢复后通过 Background Sync API 自动同步，并处理冲突检测。

**Files:**
- Create: `frontend/src/lib/offline.ts`
- Create: `frontend/src/hooks/useOfflineQueue.ts`
- Create: `frontend/src/hooks/__tests__/useOfflineQueue.test.ts`
- Create: `frontend/src/lib/__tests__/offline.test.ts`

- [ ] **Step 1: 安装 idb 依赖**

```bash
cd frontend && npm install idb
```

- [ ] **Step 2: 创建 IndexedDB 离线操作队列模块**

```typescript
// frontend/src/lib/offline.ts
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
   *
   * @param operation - 不含 id/timestamp/retryCount 的操作数据
   * @returns 完整的操作记录（含自动生成的 id 和时间戳）
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

  /**
   * 获取所有待同步操作（按时间升序排列）
   */
  async getAll(): Promise<PendingOperation[]> {
    const db = await getDB();
    const all = await db.getAll('pending-operations');
    return all.sort((a, b) => a.timestamp - b.timestamp);
  },

  /**
   * 获取待同步操作数量
   */
  async count(): Promise<number> {
    const db = await getDB();
    return db.count('pending-operations');
  },

  /**
   * 按 ID 获取单个操作
   */
  async get(id: string): Promise<PendingOperation | undefined> {
    const db = await getDB();
    return db.get('pending-operations', id);
  },

  /**
   * 删除指定操作（同步成功后调用）
   */
  async remove(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('pending-operations', id);
  },

  /**
   * 更新操作的重试次数
   */
  async incrementRetry(id: string): Promise<void> {
    const db = await getDB();
    const entry = await db.get('pending-operations', id);
    if (entry) {
      entry.retryCount += 1;
      await db.put('pending-operations', entry);
    }
  },

  /**
   * 清空所有待同步操作
   */
  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear('pending-operations');
  },

  /**
   * 同步所有待处理操作到服务器
   *
   * 逐条发送，支持以下场景：
   * - 200/201: 同步成功，从队列中移除
   * - 409 Conflict: 版本冲突，标记为冲突，从队列中移除
   * - 其他错误: 增加重试次数，超过最大重试次数则标记为失败
   *
   * @returns 同步结果（成功、失败、冲突的操作列表）
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
          // 200/201: 同步成功
          await this.remove(op.id);
          result.succeeded.push(op.id);
        } else if (response.status === 409) {
          // 409 Conflict: 版本冲突，移除并标记
          await this.remove(op.id);
          result.conflicts.push(op.id);
        } else {
          // 其他错误: 增加重试
          await this.incrementRetry(op.id);
          const current = await this.get(op.id);
          if (current && current.retryCount >= current.maxRetries) {
            await this.remove(op.id);
            result.failed.push({ id: op.id, error: `HTTP ${response.status}` });
          }
        }
      } catch {
        // 网络错误: 增加重试
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
   *
   * @param tag - 同步标签，默认 'offline-sync'
   * @returns 是否成功注册
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
```

- [ ] **Step 3: 创建 useOfflineQueue hook**

```typescript
// frontend/src/hooks/useOfflineQueue.ts
import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { offlineQueue } from '../lib/offline';
import { useOfflineStatus } from './useOfflineStatus';
import type { PendingOperation, OfflineOperationType, SyncResult } from '../types';

/**
 * 离线操作队列 Hook
 *
 * 提供离线操作的入队、同步、查询能力，并集成 TanStack Query 缓存刷新。
 * - 当网络离线时，变更操作自动入队
 * - 当网络恢复时，自动触发同步
 * - 同步成功后刷新相关查询缓存
 */
export function useOfflineQueue() {
  const queryClient = useQueryClient();
  const { isOnline } = useOfflineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  /** 刷新待处理数量 */
  const refreshCount = useCallback(async () => {
    const count = await offlineQueue.count();
    setPendingCount(count);
  }, []);

  /** 初始加载和网络恢复时刷新数量 */
  useEffect(() => {
    refreshCount();
  }, [refreshCount, isOnline]);

  /**
   * 将操作加入离线队列
   *
   * 离线时自动入队；在线时也先入队再立即同步，确保数据一致性。
   *
   * @param type - 操作类型
   * @param url - 请求 URL
   * @param method - HTTP 方法
   * @param body - 请求体对象
   */
  const enqueue = useCallback(
    async (type: OfflineOperationType, url: string, method: string, body: unknown) => {
      await offlineQueue.add({
        type,
        url,
        method,
        body: JSON.stringify(body),
      });
      await refreshCount();

      if (isOnline) {
        // 在线时立即尝试同步
        await syncNow();
      } else {
        // 离线时注册 Background Sync
        await offlineQueue.registerBackgroundSync();
      }
    },
    [isOnline, refreshCount],
  );

  /**
   * 立即同步所有待处理操作
   *
   * @returns 同步结果
   */
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    setIsSyncing(true);
    try {
      const result = await offlineQueue.sync();
      setLastSyncResult(result);
      await refreshCount();

      // 同步成功后刷新相关查询缓存
      if (result.succeeded.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
        queryClient.invalidateQueries({ queryKey: ['devices'] });
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
      }

      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient, refreshCount]);

  /**
   * 获取所有待处理操作
   */
  const getPending = useCallback(async (): Promise<PendingOperation[]> => {
    return offlineQueue.getAll();
  }, []);

  /**
   * 删除单个待处理操作（用户手动取消）
   */
  const removePending = useCallback(
    async (id: string) => {
      await offlineQueue.remove(id);
      await refreshCount();
    },
    [refreshCount],
  );

  return {
    /** 待处理操作数量 */
    pendingCount,
    /** 是否正在同步 */
    isSyncing,
    /** 最近一次同步结果 */
    lastSyncResult,
    /** 将操作加入队列 */
    enqueue,
    /** 立即同步 */
    syncNow,
    /** 获取所有待处理操作 */
    getPending,
    /** 删除单个待处理操作 */
    removePending,
    /** 刷新待处理数量 */
    refreshCount,
  };
}
```

- [ ] **Step 4: 编写 offline.ts 测试**

```typescript
// frontend/src/lib/__tests__/offline.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineQueue } from '../offline';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('offlineQueue', () => {
  beforeEach(async () => {
    mockFetch.mockReset();
    localStorageMock.clear();
    // 每个测试前清空 IndexedDB
    await offlineQueue.clear();
  });

  it('应成功添加操作到队列', async () => {
    const entry = await offlineQueue.add({
      type: 'work-order-complete',
      url: '/api/v1/work-orders/123/complete',
      method: 'PUT',
      body: JSON.stringify({ resolution: '已修复' }),
    });

    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeGreaterThan(0);
    expect(entry.retryCount).toBe(0);
    expect(entry.maxRetries).toBe(3);

    const all = await offlineQueue.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(entry.id);
  });

  it('应返回正确的操作数量', async () => {
    expect(await offlineQueue.count()).toBe(0);

    await offlineQueue.add({
      type: 'work-order-complete',
      url: '/api/v1/work-orders/1/complete',
      method: 'PUT',
      body: '{}',
    });
    await offlineQueue.add({
      type: 'device-note',
      url: '/api/v1/devices/1/notes',
      method: 'POST',
      body: '{}',
    });

    expect(await offlineQueue.count()).toBe(2);
  });

  it('应按时间升序返回操作列表', async () => {
    // 由于 IDB 操作很快，用延迟区分时间戳
    const first = await offlineQueue.add({
      type: 'work-order-complete',
      url: '/api/v1/work-orders/1/complete',
      method: 'PUT',
      body: '{}',
    });
    await new Promise((r) => setTimeout(r, 10));
    const second = await offlineQueue.add({
      type: 'device-note',
      url: '/api/v1/devices/1/notes',
      method: 'POST',
      body: '{}',
    });

    const all = await offlineQueue.getAll();
    expect(all[0].id).toBe(first.id);
    expect(all[1].id).toBe(second.id);
  });

  it('应成功删除指定操作', async () => {
    const entry = await offlineQueue.add({
      type: 'work-order-complete',
      url: '/api/v1/work-orders/1/complete',
      method: 'PUT',
      body: '{}',
    });

    expect(await offlineQueue.count()).toBe(1);
    await offlineQueue.remove(entry.id);
    expect(await offlineQueue.count()).toBe(0);
  });

  it('应成功清空所有操作', async () => {
    await offlineQueue.add({ type: 'work-order-complete', url: '/a', method: 'PUT', body: '{}' });
    await offlineQueue.add({ type: 'device-note', url: '/b', method: 'POST', body: '{}' });

    await offlineQueue.clear();
    expect(await offlineQueue.count()).toBe(0);
  });

  it('sync: 成功同步应从队列移除', async () => {
    localStorageMock.setItem('token', 'test-token');
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    const entry = await offlineQueue.add({
      type: 'work-order-complete',
      url: '/api/v1/work-orders/1/complete',
      method: 'PUT',
      body: JSON.stringify({ resolution: '已修复' }),
    });

    const result = await offlineQueue.sync();
    expect(result.succeeded).toContain(entry.id);
    expect(await offlineQueue.count()).toBe(0);
  });

  it('sync: 409 冲突应标记并移除', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 409 });

    const entry = await offlineQueue.add({
      type: 'work-order-complete',
      url: '/api/v1/work-orders/1/complete',
      method: 'PUT',
      body: '{}',
    });

    const result = await offlineQueue.sync();
    expect(result.conflicts).toContain(entry.id);
    expect(await offlineQueue.count()).toBe(0);
  });

  it('sync: 网络错误应增加重试，超过最大重试次数则标记失败', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const entry = await offlineQueue.add({
      type: 'work-order-complete',
      url: '/api/v1/work-orders/1/complete',
      method: 'PUT',
      body: '{}',
    });

    // 第一次同步：重试次数 0 → 1
    let result = await offlineQueue.sync();
    expect(result.failed).toHaveLength(0);
    expect(await offlineQueue.count()).toBe(1);

    // 增加重试到超过限制
    await offlineQueue.incrementRetry(entry.id);
    await offlineQueue.incrementRetry(entry.id);

    // 再次同步：重试次数 3 → 4（超过 maxRetries=3）
    mockFetch.mockRejectedValue(new Error('Network error'));
    result = await offlineQueue.sync();
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].id).toBe(entry.id);
  });
});
```

- [ ] **Step 5: 运行测试**

```bash
cd frontend && npx vitest run src/lib/__tests__/offline.test.ts
```

Expected: 所有测试通过（IndexedDB 在 jsdom 环境下需要 `fake-indexeddb` polyfill）

如果需要 polyfill：
```bash
npm install -D fake-indexeddb
```

在 `frontend/src/test/setup.ts` 中添加：
```typescript
import 'fake-indexeddb/auto';
```

- [ ] **Step 6: 提交**

```bash
git add frontend/src/lib/offline.ts frontend/src/hooks/useOfflineQueue.ts frontend/src/lib/__tests__/offline.test.ts frontend/package.json frontend/src/test/setup.ts
git commit -m "feat(offline): IndexedDB 离线操作队列 + Background Sync 注册"
```

---

### Task 3: 推送通知后端 (PushSubscription 实体 + PushNotificationService)

**目标:** 后端新增推送订阅实体、EF 配置、订阅管理服务和 Web Push 发送服务。与现有 SignalRNotificationService 集成，当告警触发或工单状态变更时同时发送推送通知。

**Files:**
- Create: `src/EquipAI.Core/Entities/PushSubscription.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/PushSubscriptionConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`
- Create: `src/EquipAI.Core/Interfaces/IPushNotificationService.cs`
- Create: `src/EquipAI.Application/Notifications/PushSubscriptionService.cs`
- Create: `src/EquipAI.Application/Notifications/PushNotificationService.cs`
- Create: `src/EquipAI.Application/Notifications/DTOs/PushSubscriptionDto.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`

- [ ] **Step 1: 安装 Web Push NuGet 包**

```bash
dotnet add src/EquipAI.WebAPI/EquipAI.WebAPI.csproj package WebPush
```

- [ ] **Step 2: 创建 PushSubscription 实体**

```csharp
// src/EquipAI.Core/Entities/PushSubscription.cs
namespace EquipAI.Core.Entities;

/// <summary>
/// Web Push 推送订阅实体
/// 存储浏览器端的推送订阅信息（endpoint + keys），用于发送 Web Push 通知
/// 一个用户可以有多个订阅（不同浏览器/设备）
/// </summary>
public class PushSubscription : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 订阅用户 ID
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// 推送端点 URL（由浏览器 Push 服务生成，全局唯一）
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// 客户端加密公钥（P-256 ECDH）
    /// </summary>
    public string P256dh { get; set; } = string.Empty;

    /// <summary>
    /// 认证密钥
    /// </summary>
    public string Auth { get; set; } = string.Empty;

    /// <summary>
    /// 用户代理标识（浏览器/设备信息，便于用户管理订阅）
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// 是否启用
    /// </summary>
    public bool IsActive { get; set; } = true;
}
```

- [ ] **Step 3: 创建 EF 配置**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/PushSubscriptionConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// PushSubscription 实体的 EF Core 配置
/// </summary>
public class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
{
    public void Configure(EntityTypeBuilder<PushSubscription> builder)
    {
        builder.ToTable("push_subscriptions");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.UserId).HasColumnName("user_id");
        builder.Property(e => e.Endpoint).HasColumnName("endpoint").HasMaxLength(500).IsRequired();
        builder.Property(e => e.P256dh).HasColumnName("p256dh").HasMaxLength(200).IsRequired();
        builder.Property(e => e.Auth).HasColumnName("auth").HasMaxLength(100).IsRequired();
        builder.Property(e => e.UserAgent).HasColumnName("user_agent").HasMaxLength(500);
        builder.Property(e => e.IsActive).HasColumnName("is_active");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        // Endpoint 全局唯一索引，防止同一订阅重复注册
        builder.HasIndex(e => e.Endpoint).IsUnique();
        // 租户+用户组合索引，查询某用户的所有订阅
        builder.HasIndex(e => new { e.TenantId, e.UserId });
    }
}
```

- [ ] **Step 4: 在 AppDbContext 中添加 DbSet**

在 `AppDbContext.cs` 的 DbSet 区域添加：

```csharp
/// <summary>
/// Web Push 推送订阅表
/// </summary>
public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();
```

- [ ] **Step 5: 创建推送通知服务接口**

```csharp
// src/EquipAI.Core/Interfaces/IPushNotificationService.cs
namespace EquipAI.Core.Interfaces;

/// <summary>
/// 推送通知服务接口
/// 负责管理浏览器推送订阅和发送 Web Push 通知
/// </summary>
public interface IPushNotificationService
{
    /// <summary>
    /// 注册推送订阅（新增或更新）
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="userId">用户 ID</param>
    /// <param name="endpoint">推送端点</param>
    /// <param name="p256dh">客户端加密公钥</param>
    /// <param name="auth">认证密钥</param>
    /// <param name="userAgent">用户代理标识</param>
    Task RegisterSubscriptionAsync(Guid tenantId, Guid userId,
        string endpoint, string p256dh, string auth, string? userAgent = null);

    /// <summary>
    /// 注销推送订阅
    /// </summary>
    /// <param name="userId">用户 ID</param>
    /// <param name="endpoint">推送端点</param>
    Task UnregisterSubscriptionAsync(Guid userId, string endpoint);

    /// <summary>
    /// 向指定用户的所有订阅发送推送通知
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="userId">目标用户 ID</param>
    /// <param name="title">通知标题</param>
    /// <param name="body">通知正文</param>
    /// <param name="url">点击通知后跳转的 URL（可选）</param>
    Task SendToUserAsync(Guid tenantId, Guid userId, string title, string body, string? url = null);

    /// <summary>
    /// 向指定租户的所有订阅发送推送通知（广播）
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="title">通知标题</param>
    /// <param name="body">通知正文</param>
    /// <param name="url">点击通知后跳转的 URL（可选）</param>
    Task SendToTenantAsync(Guid tenantId, string title, string body, string? url = null);
}
```

- [ ] **Step 6: 创建推送订阅 DTO**

```csharp
// src/EquipAI.Application/Notifications/DTOs/PushSubscriptionDto.cs
namespace EquipAI.Application.Notifications.DTOs;

/// <summary>
/// 注册推送订阅请求
/// </summary>
public record RegisterPushSubscriptionRequest
{
    /// <summary>推送端点 URL</summary>
    public string Endpoint { get; init; } = string.Empty;

    /// <summary>客户端加密公钥</summary>
    public string P256dh { get; init; } = string.Empty;

    /// <summary>认证密钥</summary>
    public string Auth { get; init; } = string.Empty;
}
```

- [ ] **Step 7: 创建推送通知服务实现**

```csharp
// src/EquipAI.Application/Notifications/PushNotificationService.cs
using System.Text.Json;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WebPush;

namespace EquipAI.Application.Notifications;

/// <summary>
/// Web Push 推送通知服务
/// 使用 VAPID 协议向浏览器推送通知
/// 支持指定用户推送和租户广播两种模式
/// </summary>
public class PushNotificationService : IPushNotificationService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<PushNotificationService> _logger;
    private readonly string _vapidSubject;
    private readonly string _vapidPublicKey;
    private readonly string _vapidPrivateKey;

    public PushNotificationService(
        AppDbContext dbContext,
        IConfiguration configuration,
        ILogger<PushNotificationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;

        // VAPID 密钥从配置中读取，可通过环境变量注入
        _vapidSubject = configuration["Vapid:Subject"]
            ?? "mailto:admin@equipsense.com";
        _vapidPublicKey = configuration["Vapid:PublicKey"]
            ?? throw new InvalidOperationException("VAPID 公钥未配置");
        _vapidPrivateKey = configuration["Vapid:PrivateKey"]
            ?? throw new InvalidOperationException("VAPID 私钥未配置");
    }

    /// <inheritdoc />
    public async Task RegisterSubscriptionAsync(Guid tenantId, Guid userId,
        string endpoint, string p256dh, string auth, string? userAgent = null)
    {
        // 查找是否已存在相同 endpoint 的订阅
        var existing = await _dbContext.PushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == endpoint);

        if (existing != null)
        {
            // 更新已有订阅（用户可能在同一设备重新登录）
            existing.TenantId = tenantId;
            existing.UserId = userId;
            existing.P256dh = p256dh;
            existing.Auth = auth;
            existing.UserAgent = userAgent;
            existing.IsActive = true;
        }
        else
        {
            // 新建订阅
            _dbContext.PushSubscriptions.Add(new Core.Entities.PushSubscription
            {
                TenantId = tenantId,
                UserId = userId,
                Endpoint = endpoint,
                P256dh = p256dh,
                Auth = auth,
                UserAgent = userAgent,
                IsActive = true,
            });
        }

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("推送订阅已注册: UserId={UserId}, Endpoint={Endpoint}", userId, endpoint);
    }

    /// <inheritdoc />
    public async Task UnregisterSubscriptionAsync(Guid userId, string endpoint)
    {
        var sub = await _dbContext.PushSubscriptions
            .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

        if (sub != null)
        {
            _dbContext.PushSubscriptions.Remove(sub);
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("推送订阅已注销: UserId={UserId}, Endpoint={Endpoint}", userId, endpoint);
        }
    }

    /// <inheritdoc />
    public async Task SendToUserAsync(Guid tenantId, Guid userId,
        string title, string body, string? url = null)
    {
        var subscriptions = await _dbContext.PushSubscriptions
            .Where(s => s.TenantId == tenantId && s.UserId == userId && s.IsActive)
            .ToListAsync();

        var payload = JsonSerializer.Serialize(new { title, body, url });
        await SendPayloadToSubscriptions(subscriptions, payload);
    }

    /// <inheritdoc />
    public async Task SendToTenantAsync(Guid tenantId,
        string title, string body, string? url = null)
    {
        var subscriptions = await _dbContext.PushSubscriptions
            .Where(s => s.TenantId == tenantId && s.IsActive)
            .ToListAsync();

        var payload = JsonSerializer.Serialize(new { title, body, url });
        await SendPayloadToSubscriptions(subscriptions, payload);
    }

    /// <summary>
    /// 向订阅列表批量发送推送载荷
    /// 自动清理无效订阅（410 Gone 响应）
    /// </summary>
    private async Task SendPayloadToSubscriptions(
        List<Core.Entities.PushSubscription> subscriptions, string payload)
    {
        var vapidDetails = new VapidDetails(_vapidSubject, _vapidPublicKey, _vapidPrivateKey);
        var webPushClient = new WebPushClient();

        foreach (var sub in subscriptions)
        {
            try
            {
                var pushSubscription = new WebPush.PushSubscription(
                    sub.Endpoint, sub.P256dh, sub.Auth);

                await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
            }
            catch (WebPushException ex)
            {
                // 410 Gone: 订阅已过期或被撤销，自动清理
                if (ex.StatusCode == System.Net.HttpStatusCode.Gone)
                {
                    _logger.LogWarning("推送订阅已过期，自动清理: Endpoint={Endpoint}", sub.Endpoint);
                    _dbContext.PushSubscriptions.Remove(sub);
                    await _dbContext.SaveChangesAsync();
                }
                else
                {
                    _logger.LogError(ex, "推送通知发送失败: Endpoint={Endpoint}", sub.Endpoint);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "推送通知发送异常: Endpoint={Endpoint}", sub.Endpoint);
            }
        }
    }
}
```

- [ ] **Step 8: 在 ServiceCollectionExtensions 注册服务**

在 `AddApplication` 方法中添加：

```csharp
// 推送通知服务（Scoped — 需要 DbContext）
services.AddScoped<IPushNotificationService, PushNotificationService>();
```

- [ ] **Step 9: 集成到 SignalRNotificationService**

修改 `SignalRNotificationService.cs`，在告警触发时同时发送推送通知：

```csharp
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace EquipAI.WebAPI.Services;

/// <summary>
/// SignalR 实时推送服务实现
/// 通过 IHubContext 向租户组推送告警和遥测数据更新
/// 同时调用 IPushNotificationService 向未在线用户发送 Web Push
/// </summary>
public class SignalRNotificationService : ISignalRNotificationService
{
    private readonly IHubContext<Hubs.IndustrialHub> _hubContext;
    private readonly IPushNotificationService _pushService;
    private readonly ILogger<SignalRNotificationService> _logger;

    public SignalRNotificationService(
        IHubContext<Hubs.IndustrialHub> hubContext,
        IPushNotificationService pushService,
        ILogger<SignalRNotificationService> logger)
    {
        _hubContext = hubContext;
        _pushService = pushService;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task SendAlertTriggeredAsync(Guid tenantId, Guid alertId, string alertCode,
        Guid deviceId, string metric, double value, string severity)
    {
        // 1. SignalR 实时推送给在线用户
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnAlertTriggered", new
            {
                alertId,
                alertCode,
                deviceId,
                metric,
                value,
                severity,
                occurredAt = DateTime.UtcNow
            });

        // 2. Web Push 推送给所有订阅用户（含未在线的）
        try
        {
            await _pushService.SendToTenantAsync(
                tenantId,
                "告警触发",
                $"指标 {metric} 达到 {value}，严重级别: {severity}",
                $"/alerts");
        }
        catch (Exception ex)
        {
            // 推送失败不影响 SignalR 实时推送
            _logger.LogWarning(ex, "Web Push 推送失败，告警 ID: {AlertId}", alertId);
        }
    }

    /// <inheritdoc />
    public async Task SendTelemetryUpdateAsync(Guid tenantId, Guid deviceId, string metric, double value)
    {
        // 遥测数据仅通过 SignalR 推送，不触发 Web Push（频率太高）
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnTelemetryUpdate", deviceId, metric, value);
    }

    /// <inheritdoc />
    public async Task SendAlertResolvedAsync(Guid tenantId, Guid alertId)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnAlertResolved", alertId);

        // 告警解决也发送推送
        try
        {
            await _pushService.SendToTenantAsync(
                tenantId,
                "告警已解决",
                $"告警已自动解决",
                $"/alerts");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Web Push 推送失败，告警 ID: {AlertId}", alertId);
        }
    }
}
```

- [ ] **Step 10: 生成 VAPID 密钥**

在开发环境中，使用以下方式生成 VAPID 密钥对：

```bash
# 使用 npx 生成
npx web-push generate-vapid-keys
```

将输出添加到 `appsettings.Development.json`：

```json
{
  "Vapid": {
    "Subject": "mailto:admin@equipsense.com",
    "PublicKey": "<生成的公钥>",
    "PrivateKey": "<生成的私钥>"
  }
}
```

生产环境通过环境变量注入：`Vapid__PublicKey`、`Vapid__PrivateKey`。

- [ ] **Step 11: 创建数据库迁移**

```bash
dotnet ef migrations add AddPushSubscriptions \
  --project src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj \
  --startup-project src/EquipAI.WebAPI/EquipAI.WebAPI.csproj
```

- [ ] **Step 12: 编译确认**

```bash
dotnet build EquipAI.slnx
```

Expected: 编译成功

- [ ] **Step 13: 提交**

```bash
git add src/EquipAI.Core/Entities/PushSubscription.cs \
  src/EquipAI.Core/Interfaces/IPushNotificationService.cs \
  src/EquipAI.Infrastructure/Data/Configurations/PushSubscriptionConfiguration.cs \
  src/EquipAI.Infrastructure/Data/AppDbContext.cs \
  src/EquipAI.Application/Notifications/ \
  src/EquipAI.WebAPI/Services/SignalRNotificationService.cs \
  src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat(push): PushSubscription 实体 + Web Push 推送通知服务 + SignalR 集成"
```

---

### Task 4: 推送通知 API + 前端集成 (VAPID + usePushNotifications hook)

**目标:** 后端添加推送订阅管理的 REST API；前端实现 VAPID 公钥获取、浏览器推送订阅注册/注销，以及推送权限请求的 hook。

**Files:**
- Create: `src/EquipAI.WebAPI/Controllers/PushSubscriptionsController.cs`
- Create: `frontend/src/lib/pushManager.ts`
- Create: `frontend/src/hooks/usePushNotifications.ts`
- Create: `frontend/src/hooks/__tests__/usePushNotifications.test.ts`

- [ ] **Step 1: 创建推送订阅 API Controller**

```csharp
// src/EquipAI.WebAPI/Controllers/PushSubscriptionsController.cs
using EquipAI.Application.Notifications.DTOs;
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 推送订阅管理 API
/// 提供浏览器推送订阅的注册、注销和 VAPID 公钥获取
/// </summary>
[ApiController]
[Route("api/v1/push")]
[Authorize]
public class PushSubscriptionsController : ControllerBase
{
    private readonly IPushNotificationService _pushService;
    private readonly ITenantContext _tenantContext;
    private readonly IConfiguration _configuration;

    public PushSubscriptionsController(
        IPushNotificationService pushService,
        ITenantContext tenantContext,
        IConfiguration configuration)
    {
        _pushService = pushService;
        _tenantContext = tenantContext;
        _configuration = configuration;
    }

    /// <summary>
    /// 获取 VAPID 公钥
    /// 前端使用此公钥注册浏览器推送订阅
    /// </summary>
    [HttpGet("vapid-public-key")]
    [AllowAnonymous]
    public ActionResult<string> GetVapidPublicKey()
    {
        var publicKey = _configuration["Vapid:PublicKey"];
        if (string.IsNullOrEmpty(publicKey))
        {
            return StatusCode(503, new { code = "PUSH_NOT_CONFIGURED", message = "推送服务未配置" });
        }

        return Ok(new { publicKey });
    }

    /// <summary>
    /// 注册推送订阅
    /// 浏览器通过 PushManager.subscribe() 获取订阅信息后调用此接口
    /// </summary>
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] RegisterPushSubscriptionRequest request)
    {
        var userId = _tenantContext.UserId;
        var tenantId = _tenantContext.TenantId;
        var userAgent = Request.Headers.UserAgent.ToString();

        await _pushService.RegisterSubscriptionAsync(
            tenantId, userId,
            request.Endpoint, request.P256dh, request.Auth,
            userAgent);

        return Ok(new { message = "推送订阅注册成功" });
    }

    /// <summary>
    /// 注销推送订阅
    /// 用户关闭推送通知或清除浏览器数据时调用
    /// </summary>
    [HttpDelete("subscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] UnregisterPushSubscriptionRequest request)
    {
        var userId = _tenantContext.UserId;

        await _pushService.UnregisterSubscriptionAsync(userId, request.Endpoint);

        return Ok(new { message = "推送订阅注销成功" });
    }
}

/// <summary>
/// 注销推送订阅请求
/// </summary>
public record UnregisterPushSubscriptionRequest
{
    /// <summary>推送端点 URL</summary>
    public string Endpoint { get; init; } = string.Empty;
}
```

- [ ] **Step 2: 创建前端推送管理模块**

```typescript
// frontend/src/lib/pushManager.ts
import api from './api';

/**
 * 推送订阅管理模块
 *
 * 封装浏览器 Push API 的订阅注册和注销逻辑，
 * 以及与后端 VAPID 公钥和订阅 API 的交互。
 */

/** VAPID 公钥响应 */
interface VapidKeyResponse {
  publicKey: string;
}

/** 浏览器 PushSubscription 转换为可传输格式 */
function subscriptionToServer(subscription: PushSubscription) {
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh!,
    auth: json.keys!.auth!,
  };
}

/**
 * 获取后端 VAPID 公钥
 */
export async function getVapidPublicKey(): Promise<string> {
  const { data } = await api.get<VapidKeyResponse>('/push/vapid-public-key');
  return data.publicKey;
}

/**
 * 注册浏览器推送订阅
 *
 * 流程：
 * 1. 获取 VAPID 公钥
 * 2. 向浏览器 PushManager 注册订阅
 * 3. 将订阅信息发送到后端保存
 *
 * @returns 注册成功后的 PushSubscription，失败返回 null
 */
export async function registerPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('浏览器不支持 Web Push');
    return null;
  }

  try {
    // 请求通知权限
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('用户拒绝了通知权限');
      return null;
    }

    // 获取 Service Worker registration
    const registration = await navigator.serviceWorker.ready;

    // 获取 VAPID 公钥
    const vapidKey = await getVapidPublicKey();

    // 将 base64 公钥转换为 Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    // 注册推送订阅
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // 发送到后端
    await api.post('/push/subscribe', subscriptionToServer(subscription));

    return subscription;
  } catch (error) {
    console.error('注册推送订阅失败:', error);
    return null;
  }
}

/**
 * 注销浏览器推送订阅
 *
 * 流程：
 * 1. 从浏览器 PushManager 取消订阅
 * 2. 通知后端删除订阅记录
 *
 * @param subscription - 要注销的订阅
 */
export async function unregisterPushSubscription(
  subscription: PushSubscription,
): Promise<void> {
  try {
    // 取消浏览器订阅
    await subscription.unsubscribe();

    // 通知后端
    await api.delete('/push/subscribe', {
      data: { endpoint: subscription.endpoint },
    });
  } catch (error) {
    console.error('注销推送订阅失败:', error);
  }
}

/**
 * 将 URL-safe Base64 字符串转换为 Uint8Array
 * VAPID 公钥从服务器传来是 base64 格式，需转换为浏览器要求的 Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
```

- [ ] **Step 3: 创建 usePushNotifications hook**

```typescript
// frontend/src/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from '../lib/pushManager';

/**
 * 推送通知 Hook
 *
 * 提供推送通知的订阅状态管理、注册和注销能力。
 * - permission: 当前通知权限状态
 * - isSupported: 浏览器是否支持推送通知
 * - isSubscribed: 当前是否已订阅
 * - subscribe: 注册推送订阅
 * - unsubscribe: 注销推送订阅
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  /** 浏览器是否支持推送通知 */
  const isSupported = typeof navigator !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window;

  /** 检查当前订阅状态 */
  const checkSubscription = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      setSubscription(existingSub);
      setIsSubscribed(!!existingSub);
    } catch {
      // Service Worker 未就绪，忽略
    }
  }, [isSupported]);

  /** 初始化时检查订阅状态 */
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  /**
   * 注册推送订阅
   *
   * 如果当前权限是 default，会弹出权限请求弹窗。
   * 如果权限已被拒绝，则无法注册。
   */
  const subscribe = useCallback(async () => {
    if (!isSupported) return false;

    if (Notification.permission === 'denied') {
      console.warn('通知权限已被拒绝，请在浏览器设置中手动开启');
      return false;
    }

    const sub = await registerPushSubscription();
    if (sub) {
      setSubscription(sub);
      setIsSubscribed(true);
      setPermission(Notification.permission);
      return true;
    }

    return false;
  }, [isSupported]);

  /**
   * 注销推送订阅
   */
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    await unregisterPushSubscription(subscription);
    setSubscription(null);
    setIsSubscribed(false);
  }, [subscription]);

  return {
    /** 当前通知权限状态 */
    permission,
    /** 浏览器是否支持推送通知 */
    isSupported,
    /** 当前是否已订阅推送 */
    isSubscribed,
    /** 注册推送订阅 */
    subscribe,
    /** 注销推送订阅 */
    unsubscribe,
    /** 刷新订阅状态 */
    checkSubscription,
  };
}
```

- [ ] **Step 4: 编写 usePushNotifications 测试**

```typescript
// frontend/src/hooks/__tests__/usePushNotifications.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock pushManager 模块
vi.mock('../../lib/pushManager', () => ({
  registerPushSubscription: vi.fn(),
  unregisterPushSubscription: vi.fn(),
}));

import { usePushNotifications } from '../usePushNotifications';
import { registerPushSubscription, unregisterPushSubscription } from '../../lib/pushManager';

const mockedRegister = vi.mocked(registerPushSubscription);
const mockedUnregister = vi.mocked(unregisterPushSubscription);

describe('usePushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('不支持推送时应设 isSupported=false', () => {
    // 临时移除 PushManager
    const originalPushManager = window.PushManager;
    // @ts-expect-error 测试用：模拟不支持 PushManager
    delete window.PushManager;

    const { result } = renderHook(() => usePushNotifications());
    expect(result.current.isSupported).toBe(false);

    // 恢复
    // @ts-expect-error 恢复 PushManager
    window.PushManager = originalPushManager;
  });

  it('subscribe 调用 registerPushSubscription 并更新状态', async () => {
    const mockSub = { endpoint: 'test-endpoint', unsubscribe: vi.fn() } as unknown as PushSubscription;
    mockedRegister.mockResolvedValueOnce(mockSub);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const success = await result.current.subscribe();
      expect(success).toBe(true);
    });

    expect(mockedRegister).toHaveBeenCalledOnce();
    expect(result.current.isSubscribed).toBe(true);
  });

  it('subscribe 失败时返回 false', async () => {
    mockedRegister.mockResolvedValueOnce(null);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      const success = await result.current.subscribe();
      expect(success).toBe(false);
    });

    expect(result.current.isSubscribed).toBe(false);
  });

  it('unsubscribe 调用 unregisterPushSubscription', async () => {
    const mockSub = { endpoint: 'test-endpoint', unsubscribe: vi.fn() } as unknown as PushSubscription;
    mockedRegister.mockResolvedValueOnce(mockSub);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.subscribe();
    });

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(mockedUnregister).toHaveBeenCalledWith(mockSub);
    expect(result.current.isSubscribed).toBe(false);
  });
});
```

- [ ] **Step 5: 运行测试**

```bash
cd frontend && npx vitest run src/hooks/__tests__/usePushNotifications.test.ts
```

Expected: 所有测试通过

- [ ] **Step 6: 后端编译确认**

```bash
dotnet build EquipAI.slnx
```

- [ ] **Step 7: 前端编译确认**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 8: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/PushSubscriptionsController.cs \
  frontend/src/lib/pushManager.ts \
  frontend/src/hooks/usePushNotifications.ts \
  frontend/src/hooks/__tests__/usePushNotifications.test.ts
git commit -m "feat(push): 推送订阅 API + 前端 VAPID 集成 + usePushNotifications hook"
```

---

### Task 5: 工单离线编辑集成 + 同步指示器

**目标:** 将离线操作队列集成到工单详情页，支持离线完成工单、审批通过/驳回、添加设备备注。提供离线操作指示器和手动同步按钮，让用户清晰了解离线状态和同步进度。

**Files:**
- Create: `frontend/src/components/workorder/OfflineSyncPanel.tsx`
- Create: `frontend/src/components/workorder/OfflineStatusBadge.tsx`
- Modify: `frontend/src/pages/WorkOrderDetailPage.tsx`
- Modify: `frontend/src/pages/SettingsPage.tsx` (推送通知设置入口)
- Create: `frontend/src/components/workorder/__tests__/OfflineSyncPanel.test.tsx`

- [ ] **Step 1: 创建离线同步面板组件**

```typescript
// frontend/src/components/workorder/OfflineSyncPanel.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, CloudOff, Check, AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import type { PendingOperation } from '../../types';

/** 操作类型的中文标签映射 */
const operationTypeLabels: Record<string, string> = {
  'work-order-complete': '完成工单',
  'work-order-accept': '验收通过',
  'work-order-reject': '验收驳回',
  'device-note': '设备备注',
};

/**
 * 离线同步面板
 *
 * 展示待同步操作列表，提供手动同步和取消操作的能力。
 * 集成到工单详情页，在离线状态下自动显示。
 */
export function OfflineSyncPanel() {
  const { t } = useTranslation();
  const { isOffline } = useOfflineStatus();
  const { pendingCount, isSyncing, lastSyncResult, syncNow, getPending, removePending } = useOfflineQueue();
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);

  /** 加载待同步操作列表 */
  useEffect(() => {
    const loadPending = async () => {
      const ops = await getPending();
      setPendingOps(ops);
    };
    loadPending();

    // 每 5 秒刷新一次
    const timer = setInterval(loadPending, 5000);
    return () => clearInterval(timer);
  }, [getPending, pendingCount]);

  /** 手动同步 */
  const handleSync = async () => {
    const result = await syncNow();

    // 同步完成后刷新列表
    const ops = await getPending();
    setPendingOps(ops);

    // 如果有冲突，提示用户
    if (result.conflicts.length > 0) {
      console.warn('存在同步冲突:', result.conflicts);
    }
  };

  if (pendingCount === 0 && !isOffline) return null;

  return (
    <Card className={isOffline ? 'border-orange-300 bg-orange-50' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isOffline ? (
            <CloudOff className="h-4 w-4 text-orange-500" />
          ) : (
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          )}
          {isOffline ? '离线操作队列' : '待同步操作'}
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-white">
              {pendingCount}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 同步结果提示 */}
        {lastSyncResult && (
          <div className="space-y-1 text-sm">
            {lastSyncResult.succeeded.length > 0 && (
              <p className="flex items-center gap-1 text-green-600">
                <Check className="h-3 w-3" />
                {lastSyncResult.succeeded.length} 项操作已同步成功
              </p>
            )}
            {lastSyncResult.conflicts.length > 0 && (
              <p className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                {lastSyncResult.conflicts.length} 项操作存在冲突（数据已被其他人修改）
              </p>
            )}
            {lastSyncResult.failed.length > 0 && (
              <p className="flex items-center gap-1 text-red-600">
                <X className="h-3 w-3" />
                {lastSyncResult.failed.length} 项操作同步失败
              </p>
            )}
          </div>
        )}

        {/* 待同步操作列表 */}
        {pendingOps.length > 0 ? (
          <div className="space-y-2">
            {pendingOps.map((op) => (
              <div
                key={op.id}
                className="flex items-center justify-between rounded border bg-background p-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {operationTypeLabels[op.type] ?? op.type}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(op.timestamp).toLocaleTimeString()}
                  </span>
                  {op.retryCount > 0 && (
                    <span className="text-xs text-orange-500">
                      已重试 {op.retryCount} 次
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePending(op.id)}
                  aria-label="取消操作"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无待同步操作</p>
        )}

        {/* 同步按钮 */}
        {!isOffline && pendingCount > 0 && (
          <Button onClick={handleSync} disabled={isSyncing} className="w-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? '同步中...' : '立即同步'}
          </Button>
        )}

        {isOffline && (
          <p className="text-xs text-muted-foreground">
            网络恢复后将自动同步所有操作
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 创建离线状态徽章组件**

```typescript
// frontend/src/components/workorder/OfflineStatusBadge.tsx
import { CloudOff, Wifi } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';

/**
 * 离线状态徽章
 *
 * 显示在工单标题旁，指示当前网络状态和待同步操作数。
 */
export function OfflineStatusBadge() {
  const { isOffline } = useOfflineStatus();
  const { pendingCount } = useOfflineQueue();

  if (!isOffline && pendingCount === 0) return null;

  if (isOffline) {
    return (
      <Badge variant="outline" className="gap-1 border-orange-300 text-orange-600">
        <CloudOff className="h-3 w-3" />
        离线 {pendingCount > 0 && `(${pendingCount} 待同步)`}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 border-blue-300 text-blue-600">
      <Wifi className="h-3 w-3" />
      {pendingCount} 待同步
    </Badge>
  );
}
```

- [ ] **Step 3: 修改工单详情页集成离线功能**

修改 `frontend/src/pages/WorkOrderDetailPage.tsx`，在关键位置集成离线能力：

1. 在文件顶部导入新增组件和 hook：
```typescript
import { OfflineSyncPanel } from '../components/workorder/OfflineSyncPanel';
import { OfflineStatusBadge } from '../components/workorder/OfflineStatusBadge';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
```

2. 在 `WorkOrderDetailPage` 函数体内添加 hook 调用：
```typescript
const { enqueue } = useOfflineQueue();
```

3. 在标题行（Badge 旁）添加 `<OfflineStatusBadge />`：
```tsx
<div className="ml-auto flex items-center gap-2">
  <OfflineStatusBadge />
  <Badge variant="outline">{statusLabels[workOrder.status] ?? workOrder.status}</Badge>
  <PriorityBadge priority={workOrder.priority} />
</div>
```

4. 在 `completeOrder.mutate` 调用处，包装为离线感知：
```typescript
// 在 InProgress 状态的完成按钮区域替换为：
<Button
  onClick={async () => {
    if (navigator.onLine) {
      completeOrder.mutate({ id: workOrder.id, resolution });
    } else {
      // 离线时将操作加入队列
      await enqueue(
        'work-order-complete',
        `/api/v1/work-orders/${workOrder.id}/complete`,
        'PUT',
        { id: workOrder.id, resolution },
      );
    }
  }}
  disabled={!resolution || completeOrder.isPending}
>
  {navigator.onLine ? t('workorder.complete') : '保存到离线队列'}
</Button>
```

5. 在页面底部（取消对话框之前）添加同步面板：
```tsx
{/* 离线同步面板 */}
<OfflineSyncPanel />
```

- [ ] **Step 4: 在设置页添加推送通知开关**

在 `frontend/src/pages/SettingsPage.tsx` 中添加推送通知设置区域（在已有设置项下方追加）：

```typescript
// 在设置页中导入
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

// 在组件内调用
const { isSupported: pushSupported, isSubscribed, subscribe, unsubscribe, permission } = usePushNotifications();
const { isOnline } = useOfflineStatus();

// 在设置页的卡片区域添加推送通知设置卡片
```

卡片内容：
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base">推送通知</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {!pushSupported ? (
      <p className="text-sm text-muted-foreground">当前浏览器不支持推送通知</p>
    ) : (
      <>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">浏览器推送通知</p>
            <p className="text-xs text-muted-foreground">
              在浏览器未打开时也能收到告警和工单通知
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            disabled={permission === 'denied'}
            onCheckedChange={async (checked) => {
              if (checked) {
                await subscribe();
              } else {
                await unsubscribe();
              }
            }}
          />
        </div>
        {permission === 'denied' && (
          <p className="text-xs text-orange-600">
            通知权限已被拒绝，请在浏览器设置中手动开启
          </p>
        )}
      </>
    )}
  </CardContent>
</Card>
```

- [ ] **Step 5: 编写 OfflineSyncPanel 测试**

```typescript
// frontend/src/components/workorder/__tests__/OfflineSyncPanel.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { OfflineSyncPanel } from '../OfflineSyncPanel';

// Mock hooks
const mockOfflineQueue = {
  pendingCount: 0,
  isSyncing: false,
  lastSyncResult: null,
  syncNow: vi.fn(),
  getPending: vi.fn(),
  removePending: vi.fn(),
  enqueue: vi.fn(),
  refreshCount: vi.fn(),
};

const mockOfflineStatus = {
  isOnline: true,
  isOffline: false,
  lastChangedAt: Date.now(),
};

vi.mock('../../../hooks/useOfflineQueue', () => ({
  useOfflineQueue: () => mockOfflineQueue,
}));

vi.mock('../../../hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => mockOfflineStatus,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('OfflineSyncPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOfflineQueue.pendingCount = 0;
    mockOfflineQueue.isSyncing = false;
    mockOfflineQueue.lastSyncResult = null;
    mockOfflineQueue.getPending.mockResolvedValue([]);
    mockOfflineStatus.isOnline = true;
    mockOfflineStatus.isOffline = false;
  });

  it('无待同步操作且在线时不渲染', async () => {
    const { container } = render(<OfflineSyncPanel />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(container.innerHTML).toBe('');
    });
  });

  it('有待同步操作时显示操作列表', async () => {
    mockOfflineQueue.pendingCount = 1;
    mockOfflineQueue.getPending.mockResolvedValue([
      {
        id: 'op-1',
        type: 'work-order-complete',
        url: '/api/v1/work-orders/1/complete',
        method: 'PUT',
        body: '{}',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      },
    ]);

    render(<OfflineSyncPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('完成工单')).toBeDefined();
    });
  });

  it('离线时显示离线提示', async () => {
    mockOfflineStatus.isOffline = true;
    mockOfflineQueue.pendingCount = 0;
    mockOfflineQueue.getPending.mockResolvedValue([]);

    render(<OfflineSyncPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/网络恢复后/)).toBeDefined();
    });
  });

  it('点击同步按钮调用 syncNow', async () => {
    mockOfflineQueue.pendingCount = 1;
    mockOfflineQueue.getPending.mockResolvedValue([
      {
        id: 'op-1',
        type: 'work-order-complete',
        url: '/a',
        method: 'PUT',
        body: '{}',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      },
    ]);
    mockOfflineQueue.syncNow.mockResolvedValue({
      succeeded: ['op-1'],
      failed: [],
      conflicts: [],
    });

    render(<OfflineSyncPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('立即同步')).toBeDefined();
    });

    fireEvent.click(screen.getByText('立即同步'));
    expect(mockOfflineQueue.syncNow).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 6: 运行测试**

```bash
cd frontend && npx vitest run src/components/workorder/__tests__/OfflineSyncPanel.test.tsx
```

Expected: 所有测试通过

- [ ] **Step 7: 编译确认**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 8: 构建确认（含 PWA 产物）**

```bash
cd frontend && npm run build
```

Expected: 构建成功，`dist/` 目录包含 `sw.js` 和 `manifest.webmanifest`

- [ ] **Step 9: 提交**

```bash
git add frontend/src/components/workorder/OfflineSyncPanel.tsx \
  frontend/src/components/workorder/OfflineStatusBadge.tsx \
  frontend/src/pages/WorkOrderDetailPage.tsx \
  frontend/src/pages/SettingsPage.tsx \
  frontend/src/components/workorder/__tests__/OfflineSyncPanel.test.tsx
git commit -m "feat(offline): 工单离线编辑 + 同步面板 + 推送通知设置"
```

---

## 完成标准

1. **PWA 安装**: 浏览器地址栏出现安装图标，A2HS 提示正常显示
2. **离线回退**: 断网后刷新页面显示离线回退页，已缓存页面正常访问
3. **离线编辑**: 断网时在工单详情页的操作自动存入队列，网络恢复后同步
4. **推送订阅**: 设置页可开关推送通知，订阅信息正确保存到后端
5. **推送到达**: 告警触发时，浏览器未打开也能收到推送通知
6. **同步指示器**: 工单页显示待同步数量，可手动触发同步，冲突和失败有明确提示
7. **全部测试通过**: `npm run test` + `dotnet test` 无失败用例
