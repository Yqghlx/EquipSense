import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermission, useIsSystemAdmin, useUserRole } from '../usePermission';

/**
 * usePermission Hook 测试
 *
 * 验证基于用户角色的权限检查逻辑，覆盖全部 5 个角色 + 未登录 + 未知角色 + useUserRole。
 * 权限矩阵参照 AGENTS.md RBAC 表：
 *   SystemAdmin   — 所有 CRUD
 *   MaintenanceLead — 设备/告警/工单/知识库 RW，告警可配置，知识库可审批
 *   Technician    — 设备/知识库 R，告警/工单 R+执行
 *   Operator      — 设备/告警/工单 R，告警可确认
 *   Viewer        — 全部只读
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

  describe('维保主管（MaintenanceLead）', () => {
    it('设备模块：可读/创建/编辑/删除，但不能审批', () => {
      setMockUser('MaintenanceLead');
      const { result } = renderHook(() => usePermission('device'));
      const p = result.current;
      expect(p.canRead).toBe(true);
      expect(p.canCreate).toBe(true);
      expect(p.canEdit).toBe(true);
      expect(p.canDelete).toBe(true);
      expect(p.canApprove).toBe(false);
      expect(p.canManage).toBe(false);
    });

    it('告警模块：RW + 可配置 + 可执行', () => {
      setMockUser('MaintenanceLead');
      const { result } = renderHook(() => usePermission('alert'));
      const p = result.current;
      expect(p.canCreate).toBe(true);
      expect(p.canEdit).toBe(true);
      expect(p.canDelete).toBe(true);
      expect(p.canExecute).toBe(true);
      expect(p.canConfigure).toBe(true);
    });

    it('工单模块：可删除但不可配置（派工验收走 canExecute）', () => {
      setMockUser('MaintenanceLead');
      const { result } = renderHook(() => usePermission('workOrder'));
      const p = result.current;
      expect(p.canCreate).toBe(true);
      expect(p.canEdit).toBe(true);
      expect(p.canDelete).toBe(true);
      expect(p.canExecute).toBe(true);
      expect(p.canConfigure).toBe(false);
    });

    it('知识库模块：可创建/编辑/审批，但不能删除', () => {
      setMockUser('MaintenanceLead');
      const { result } = renderHook(() => usePermission('knowledge'));
      const p = result.current;
      expect(p.canCreate).toBe(true);
      expect(p.canEdit).toBe(true);
      expect(p.canApprove).toBe(true);
      expect(p.canDelete).toBe(false);
    });

    it('AI 模块：可触发分析但不可管理', () => {
      setMockUser('MaintenanceLead');
      const { result } = renderHook(() => usePermission('ai'));
      const p = result.current;
      expect(p.canTriggerAI).toBe(true);
      expect(p.canManage).toBe(false);
    });

    it('admin 模块：全部 false（仅读）', () => {
      setMockUser('MaintenanceLead');
      const { result } = renderHook(() => usePermission('admin'));
      const p = result.current;
      expect(p.canRead).toBe(true);
      expect(p.canCreate).toBe(false);
      expect(p.canManage).toBe(false);
    });
  });

  describe('操作员（Operator）', () => {
    it('告警模块：只读 + 可确认（canExecute）', () => {
      setMockUser('Operator');
      const { result } = renderHook(() => usePermission('alert'));
      const p = result.current;
      expect(p.canRead).toBe(true);
      expect(p.canExecute).toBe(true);
      expect(p.canCreate).toBe(false);
      expect(p.canConfigure).toBe(false);
    });

    it('工单模块：只读，不可执行（区别于技术员）', () => {
      setMockUser('Operator');
      const { result } = renderHook(() => usePermission('workOrder'));
      const p = result.current;
      expect(p.canRead).toBe(true);
      expect(p.canExecute).toBe(false);
      expect(p.canCreate).toBe(false);
    });

    it('设备模块：只读', () => {
      setMockUser('Operator');
      const { result } = renderHook(() => usePermission('device'));
      const p = result.current;
      expect(p.canRead).toBe(true);
      expect(p.canCreate).toBe(false);
      expect(p.canDelete).toBe(false);
    });
  });

  describe('观察者（Viewer）', () => {
    it('所有模块全部只读，无任何写权限', () => {
      setMockUser('Viewer');
      const modules = ['device', 'alert', 'workOrder', 'knowledge', 'ai', 'admin'] as const;
      for (const mod of modules) {
        const { result } = renderHook(() => usePermission(mod));
        const p = result.current;
        expect(p.canRead).toBe(true);
        expect(p.canCreate).toBe(false);
        expect(p.canEdit).toBe(false);
        expect(p.canDelete).toBe(false);
        expect(p.canExecute).toBe(false);
        expect(p.canConfigure).toBe(false);
        expect(p.canApprove).toBe(false);
        expect(p.canTriggerAI).toBe(false);
        expect(p.canManage).toBe(false);
      }
    });
  });

  describe('未知角色（default 分支）', () => {
    it('应返回全 false 的默认权限', () => {
      setMockUser('SuperUser'); // 不在枚举内的角色
      const { result } = renderHook(() => usePermission('device'));
      const p = result.current;
      expect(p.canRead).toBe(false);
      expect(p.canCreate).toBe(false);
      expect(p.canManage).toBe(false);
    });
  });

  describe('useUserRole', () => {
    it('已登录用户应返回其角色', () => {
      setMockUser('Technician');
      const { result } = renderHook(() => useUserRole());
      expect(result.current).toBe('Technician');
    });

    it('未登录用户应返回 undefined', () => {
      setMockUser(undefined);
      const { result } = renderHook(() => useUserRole());
      expect(result.current).toBeUndefined();
    });
  });
});
