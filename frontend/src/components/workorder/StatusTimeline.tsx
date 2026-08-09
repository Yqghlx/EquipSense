import { useTranslation } from 'react-i18next';
import type { WorkOrderLog } from '../../types';
import { getWorkOrderStatusLabels } from '../../utils/workorder';

interface StatusTimelineProps {
  /** 工单流转日志列表 */
  logs: WorkOrderLog[];
}

/** 操作类型对应的翻译键映射 */
const actionLabelKeys: Record<string, string> = {
  created: 'workorder.action.created',
  assigned: 'workorder.action.assigned',
  started: 'workorder.action.started',
  completed: 'workorder.action.completed',
  accepted: 'workorder.action.accepted',
  rejected: 'workorder.action.rejected',
  closed: 'workorder.action.closed',
  cancelled: 'workorder.action.cancelled',
  statuschanged: 'workorder.action.statusChanged',
  commentadded: 'workorder.action.commentAdded',
};

/**
 * 工单状态时间线组件
 *
 * 以垂直时间线形式展示工单的所有状态流转记录，
 * 每条记录显示操作类型、时间、状态变化和备注。
 */
export function StatusTimeline({ logs }: StatusTimelineProps) {
  const { t } = useTranslation();
  const statusLabels = getWorkOrderStatusLabels(t);

  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('workorder.noOperationRecords')}</p>;
  }

  return (
    <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
      {logs.map((log) => {
        // 后端枚举按 PascalCase 序列化，旧测试数据和离线缓存可能是小写；统一归一化后再查翻译键。
        const actionLabelKey = actionLabelKeys[log.action.toLowerCase()];
        const oldStatusLabel = log.oldStatus
          ? (statusLabels[log.oldStatus] ?? log.oldStatus)
          : undefined;
        const newStatusLabel = log.newStatus
          ? (statusLabels[log.newStatus] ?? log.newStatus)
          : undefined;

        return <div key={log.id} className="relative">
          {/* 时间线节点圆点 */}
          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-primary bg-background" />
          {/* 日志卡片 */}
          <div className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{actionLabelKey ? t(actionLabelKey) : log.action}</span>
              <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            {/* 状态变化展示 */}
            {(log.oldStatus || log.newStatus) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {oldStatusLabel && `${oldStatusLabel} → `}{newStatusLabel}
              </p>
            )}
            {/* 备注信息 */}
            {log.note && <p className="mt-1 text-sm">{log.note}</p>}
          </div>
        </div>;
      })}
    </div>
  );
}
