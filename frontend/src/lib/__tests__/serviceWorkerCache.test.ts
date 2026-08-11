import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LEGACY_API_CACHE_NAME, clearLegacyApiCache } from '../serviceWorkerCache';

describe('serviceWorkerCache', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('应删除旧版本遗留的认证 API 缓存', async () => {
    const deleteCache = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('caches', { delete: deleteCache });

    await expect(clearLegacyApiCache()).resolves.toBe(true);
    expect(deleteCache).toHaveBeenCalledWith(LEGACY_API_CACHE_NAME);
  });

  it('浏览器不支持 Cache API 时应安全跳过清理', async () => {
    vi.stubGlobal('caches', undefined);

    await expect(clearLegacyApiCache()).resolves.toBe(true);
  });

  it('旧缓存不存在时也视为清理完成', async () => {
    vi.stubGlobal('caches', {
      delete: vi.fn().mockResolvedValue(false),
    });

    await expect(clearLegacyApiCache()).resolves.toBe(true);
  });

  it('Cache API 清理失败时应返回失败，让应用启动门禁阻断会话恢复', async () => {
    vi.stubGlobal('caches', {
      delete: vi.fn().mockRejectedValue(new Error('storage unavailable')),
    });

    await expect(clearLegacyApiCache()).resolves.toBe(false);
  });
});
