import { clientsClaim } from 'workbox-core';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkOnly } from 'workbox-strategies';
import { getOfflineOwnerKey, offlineQueue } from './lib/offline';

interface PrecacheManifestEntry {
  /** 由 vite-plugin-pwa 在构建时注入的资源路径。 */
  url: string;
  /** 资源内容版本；没有版本号的资源由 Workbox 按 URL 管理。 */
  revision?: string | null;
}

interface ExtendableEventLike extends Event {
  /** 延长 Service Worker 事件生命周期，直到异步工作完成。 */
  waitUntil(promise: Promise<unknown>): void;
}

interface BackgroundSyncEventLike extends ExtendableEventLike {
  /** Background Sync 注册时传入的标签。 */
  tag: string;
}

declare const self: typeof globalThis & {
  /** vite-plugin-pwa 在 injectManifest 阶段替换的预缓存清单。 */
  __WB_MANIFEST: PrecacheManifestEntry[];
};

/** 旧版本曾使用的认证 API 缓存名称。 */
export const LEGACY_API_CACHE_NAME = 'api-cache';
const BACKGROUND_SYNC_TAG_PREFIX = 'offline-sync-';

clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 导航请求离线回退；API 和 SignalR 请求必须回源，不能返回 HTML。
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/offline.html'), {
    denylist: [/^\/api/, /^\/hubs/],
  }),
);

// 认证 API 只允许网络访问。Workbox 正则匹配完整 URL，故不能使用 ^/api 锚定路径。
registerRoute(
  /\/api\/v1\//i,
  new NetworkOnly({ fetchOptions: { credentials: 'include' } }),
  'GET',
);

// 静态字体和图片可以缓存；认证 API 路由先注册，避免同名静态后缀请求落入资源缓存。
registerRoute(
  /\.(?:woff2|woff|ttf|otf|eot)$/,
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

/**
 * 从 Background Sync 标签恢复队列归属键。
 *
 * 标签只携带租户和用户 UUID；真正同步前仍会通过 /auth/me 校验 Cookie，
 * 防止浏览器在切换账号后执行上一账号的离线操作。
 */
function getOwnerKeyFromSyncTag(tag: string): string | null {
  if (!tag.startsWith(BACKGROUND_SYNC_TAG_PREFIX)) return null;

  try {
    const ownerKey = decodeURIComponent(tag.slice(BACKGROUND_SYNC_TAG_PREFIX.length));
    return ownerKey || null;
  } catch {
    return null;
  }
}

/** 确认当前 HttpOnly Cookie 对应的用户仍是队列所属用户。 */
async function isOwnerAuthenticated(ownerKey: string): Promise<boolean> {
  try {
    const response = await fetch('/api/v1/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!response.ok) return false;

    const user = await response.json() as { tenantId?: string; id?: string };
    if (typeof user.tenantId !== 'string' || typeof user.id !== 'string') return false;
    return getOfflineOwnerKey({ tenantId: user.tenantId, id: user.id }) === ownerKey;
  } catch {
    return false;
  }
}

/** 清理旧认证缓存；新 Service Worker 激活前后都不允许遗留 API 响应继续存在。 */
self.addEventListener('activate', (event) => {
  (event as ExtendableEventLike).waitUntil(
    caches.delete(LEGACY_API_CACHE_NAME),
  );
});

/**
 * 页面关闭后由浏览器触发离线队列同步。
 *
 * 先逐次确认 /auth/me 的租户和用户，再调用共享 IndexedDB 队列；认证失败或账号切换
 * 会安全保留队列，待原用户重新登录后由页面 Hook 继续同步。
 */
self.addEventListener('sync', (event) => {
  const syncEvent = event as unknown as BackgroundSyncEventLike;
  const ownerKey = getOwnerKeyFromSyncTag(syncEvent.tag);
  if (!ownerKey) return;

  syncEvent.waitUntil(
    offlineQueue.sync(ownerKey, {
      isOwnerActive: () => isOwnerAuthenticated(ownerKey),
    }),
  );
});
