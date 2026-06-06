import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermission, useIsSystemAdmin } from '../usePermission';

/**
 * usePermission Hook 测试
 *
 * 验证基于用户角色的权限检查逻辑，包括：
 * - 系统管理员拥有所有权限
 * - 技术员只有部分权限
 * - useIsSystemAdmin 正确判断
 * - 未登录用户无任何权限
 */

// Mock auth store，模拟不同角色的用户状态
const mockAuthStore = vi.fn();
vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector(mockAuthStore()),
}));

/** 创建指定角色的 mock store 状态 */
function setMockUser(role: string | undefined) {
  mockAuthStore.mockReturnValue({
    user: role ? { role } : null,
  });
}

describe('usePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('管理员角色应拥有所有权限', () => {
    setMockUser('SystemAdmin');

    // 测试多个模块，系统管理员在任何模块下都应拥有完整权限
    const modules = ['device', 'alert', 'workOrder', 'knowledge', 'ai', 'admin'] as const;
    for (const mod of modules) {
      const { result } = renderHook(() => usePermission(mod));
      const perm = result.current;

      expect(perm.canRead).toBe(true);
      expect(perm.canCreate).toBe(true);
      expect(perm.canEdit).toBe(true);
      expect(perm.canDelete).toBe(true);
      expect(perm.canExecute).toBe(true);
      expect(perm.canConfigure).toBe(true);
      expect(perm.canApprove).toBe(true);
      expect(perm.canTriggerAI).toBe(true);
      expect(perm.canManage).toBe(true);
    }
  });

  it('技术员角色应只有部分权限', () => {
    setMockUser('Technician');

    const { result: devicePerm } = renderHook(() => usePermission('device'));
    // 技术员对设备：只读，不能创建/编辑/删除
    expect(devicePerm.current.canRead).toBe(true);
    expect(devicePerm.current.canCreate).toBe(false);
    expect(devicePerm.current.canEdit).toBe(false);
    expect(devicePerm.current.canDelete).toBe(false);

    const { result: alertPerm } = renderHook(() => usePermission('alert'));
    // 技术员对告警：可读+可执行（确认告警），但不能配置
    expect(alertPerm.current.canRead).toBe(true);
    expect(alertPerm.current.canExecute).toBe(true);
    expect(alertPerm.current.canConfigure).toBe(false);

    const { result: workOrderPerm } = renderHook(() => usePermission('workOrder'));
    // 技术员对工单：可读+可执行（执行工单）
    expect(workOrderPerm.current.canRead).toBe(true);
    expect(workOrderPerm.current.canExecute).toBe(true);
    expect(workOrderPerm.current.canCreate).toBe(false);

    const { result: knowledgePerm } = renderHook(() => usePermission('knowledge'));
    // 技术员对知识库：只读
    expect(knowledgePerm.current.canRead).toBe(true);
    expect(knowledgePerm.current.canApprove).toBe(false);
  });

  it('useIsSystemAdmin 系统管理员应返回 true', () => {
    setMockUser('SystemAdmin');
    const { result } = renderHook(() => useIsSystemAdmin());
    expect(result.current).toBe(true);

    // 非管理员角色应返回 false
    setMockUser('Technician');
    const { result: result2 } = renderHook(() => useIsSystemAdmin());
    expect(result2.current).toBe(false);
  });

  it('未登录用户应无任何权限', () => {
    // 设置为未登录状态（user 为 null）
    setMockUser(undefined);

    const { result } = renderHook(() => usePermission('device'));
    const perm = result.current;

    // 未登录用户所有权限都应为 false
    expect(perm.canRead).toBe(false);
    expect(perm.canCreate).toBe(false);
    expect(perm.canEdit).toBe(false);
    expect(perm.canDelete).toBe(false);
    expect(perm.canExecute).toBe(false);
    expect(perm.canConfigure).toBe(false);
    expect(perm.canApprove).toBe(false);
    expect(perm.canTriggerAI).toBe(false);
    expect(perm.canManage).toBe(false);
  });
});
