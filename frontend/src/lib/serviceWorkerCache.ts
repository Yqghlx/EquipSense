/**
 * 旧版本 Service Worker 曾使用的认证 API 缓存名称。
 * 新版本不再缓存 `/api/v1/`，但已安装旧版本的浏览器仍可能保留该 Cache Storage。
 */
export const LEGACY_API_CACHE_NAME = 'api-cache';

/**
 * 删除旧版本留下的认证 API 缓存。
 *
 * Cache Storage 属于浏览器可选能力；不存在该能力或目标缓存时视为安全完成，
 * 只有删除操作抛错才返回失败，供首屏会话恢复做 fail-closed 判断。
 */
export async function clearLegacyApiCache(): Promise<boolean> {
  // 没有 Cache API 时不可能存在该缓存，避免阻断不支持 PWA 的浏览器。
  if (typeof caches === 'undefined') return true;

  try {
    // delete 返回 false 只表示缓存本来不存在，不是清理失败。
    await caches.delete(LEGACY_API_CACHE_NAME);
    return true;
  } catch {
    return false;
  }
}
