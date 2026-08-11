import { describe, expect, it } from 'vitest';
import { getOfflineOwnerKey } from '../offline';

describe('getOfflineOwnerKey', () => {
  it('应使用租户和用户 ID 生成稳定且不含用户隐私的队列归属键', () => {
    expect(getOfflineOwnerKey({ tenantId: 'tenant-001', id: 'user-001' })).toBe('tenant-001:user-001');
  });

  it('缺少会话身份时应返回空值，阻止创建无归属操作', () => {
    expect(getOfflineOwnerKey(null)).toBeNull();
    expect(getOfflineOwnerKey({ tenantId: '', id: 'user-001' })).toBeNull();
    expect(getOfflineOwnerKey({ tenantId: 'tenant-001', id: '' })).toBeNull();
  });
});
