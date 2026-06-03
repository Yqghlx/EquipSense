/**
 * 工单相关共享工具函数
 *
 * 提供工单状态标签映射等公共逻辑，供多个页面复用，
 * 避免在各个组件中重复定义相同的映射关系。
 */

/**
 * 获取工单状态标签映射表
 *
 * 根据当前语言环境返回工单状态枚举值对应的显示文本。
 * 匹配后端 PascalCase 枚举序列化格式。
 *
 * @param t - i18next 翻译函数
 * @returns 状态键到显示文本的映射对象
 */
export function getWorkOrderStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    PendingDispatch: t('workorder.status.pendingDispatch'),
    Assigned: t('workorder.status.assigned'),
    InProgress: t('workorder.status.inProgress'),
    SubmittedForApproval: t('workorder.status.submittedForApproval'),
    Completed: t('workorder.status.completed'),
    Accepted: t('workorder.status.accepted'),
    Rejected: t('workorder.status.rejected'),
    Closed: t('workorder.status.closed'),
    Cancelled: t('workorder.status.cancelled'),
  };
}
