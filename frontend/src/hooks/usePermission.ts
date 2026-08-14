/**
 * 权限辅助 Hook
 *
 * 提供基于用户角色的权限检查功能，用于控制按钮/菜单的可见性和可用状态。
 * 权限矩阵：
 * - SystemAdmin: 所有 CRUD
 * - MaintenanceLead: 设备 RW、告警 RW+配置、工单 RW+派工验收、知识库 RW+验证
 * - Technician: 设备 R、告警 R+确认、工单 R+执行、知识库 R
 * - Operator: 设备 R、告警 R+确认、工单 R、报表 R
 * - Viewer: 所有只读
 */
import { useAuthStore } from '../stores/authStore';

/** 用户角色类型 */
type UserRole = 'SystemAdmin' | 'MaintenanceLead' | 'Technician' | 'Operator' | 'Viewer';

/** 权限检查结果 */
export interface PermissionResult {
  /** 是否可以查看（由角色和模块共同决定） */
  canRead: boolean;
  /** 是否可以创建 */
  canCreate: boolean;
  /** 是否可以编辑 */
  canEdit: boolean;
  /** 是否可以删除 */
  canDelete: boolean;
  /** 是否可以执行特殊操作（如确认告警、执行工单） */
  canExecute: boolean;
  /** 是否可以配置（如告警规则配置） */
  canConfigure: boolean;
  /** 是否可以审批（如知识库规则审批） */
  canApprove: boolean;
  /** 是否可以触发 AI 分析 */
  canTriggerAI: boolean;
  /** 是否可以访问管理功能（如租户管理） */
  canManage: boolean;
}

/** 模块类型 */
type Module = 'device' | 'alert' | 'workOrder' | 'knowledge' | 'ai' | 'admin' | 'report';

/**
 * 权限检查 Hook
 *
 * 根据当前用户角色和目标模块返回权限检查结果。
 *
 * @param module - 目标模块
 * @returns 权限检查结果对象
 */
export function usePermission(module: Module): PermissionResult {
  const user = useAuthStore((s) => s.user);
  const role = user?.role as UserRole | undefined;

  // 默认权限：全部拒绝
  const defaultPermission: PermissionResult = {
    canRead: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExecute: false,
    canConfigure: false,
    canApprove: false,
    canTriggerAI: false,
    canManage: false,
  };

  if (!role) return defaultPermission;

  // 基础读权限按后端 RBAC 矩阵计算；特殊模块必须与后端权限矩阵保持一致，避免页面先发起必然 403 的请求。
  const base: PermissionResult = {
    ...defaultPermission,
    canRead: module === 'report'
      ? role !== 'Technician'
      : !(role === 'Operator' && module === 'knowledge'),
  };

  switch (role) {
    case 'SystemAdmin':
      // 系统管理员：全部权限
      return {
        ...base,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExecute: true,
        canConfigure: true,
        canApprove: true,
        canTriggerAI: true,
        canManage: true,
      };

    case 'MaintenanceLead':
      // 维保主管：设备 RW、告警 RW+配置、工单 RW+派工验收、知识库 RW+验证
      return {
        ...base,
        canCreate: module === 'device' || module === 'alert' || module === 'workOrder' || module === 'knowledge',
        canEdit: module === 'device' || module === 'alert' || module === 'workOrder' || module === 'knowledge',
        canDelete: module === 'device' || module === 'alert' || module === 'workOrder',
        canExecute: module === 'alert' || module === 'workOrder',
        canConfigure: module === 'alert',
        canApprove: module === 'knowledge',
        canTriggerAI: module === 'ai',
        canManage: false,
      };

    case 'Technician':
      // 技术员：设备 R、告警 R+确认、工单 R+执行、知识库 R
      return {
        ...base,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExecute: module === 'alert' || module === 'workOrder',
        canConfigure: false,
        canApprove: false,
        canTriggerAI: false,
        canManage: false,
      };

    case 'Operator':
      // 操作员：设备 R、告警 R+确认、工单 R
      return {
        ...base,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExecute: module === 'alert',
        canConfigure: false,
        canApprove: false,
        canTriggerAI: false,
        canManage: false,
      };

    case 'Viewer':
      // 观察者：全部只读
      return base;

    default:
      return defaultPermission;
  }
}

/**
 * 检查用户是否是系统管理员
 */
export function useIsSystemAdmin(): boolean {
  const user = useAuthStore((s) => s.user);
  return user?.role === 'SystemAdmin';
}

/**
 * 获取当前用户角色
 */
export function useUserRole(): UserRole | undefined {
  const user = useAuthStore((s) => s.user);
  return user?.role as UserRole | undefined;
}
