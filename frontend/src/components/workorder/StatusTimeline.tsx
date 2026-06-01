import type { WorkOrderLog } from '../../types';

interface StatusTimelineProps {
  /** 工单流转日志列表 */
  logs: WorkOrderLog[];
}

/** 操作类型对应的中文标签 */
const actionLabels: Record<string, string> = {
  created: '创建工单',
  assigned: '派工',
  started: '开始执行',
  completed: '完成',
  accepted: '验收通过',
  rejected: '验收不通过',
  closed: '关闭',
  cancelled: '取消',
};

/**
 * 工单状态时间线组件
 *
 * 以垂直时间线形式展示工单的所有状态流转记录，
 * 每条记录显示操作类型、时间、状态变化和备注。
 */
export function StatusTimeline({ logs }: StatusTimelineProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无操作记录</p>;
  }

  return (
    <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
      {logs.map((log) => (
        <div key={log.id} className="relative">
          {/* 时间线节点圆点 */}
          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-primary bg-background" />
          {/* 日志卡片 */}
          <div className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{actionLabels[log.action] ?? log.action}</span>
              <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            {/* 状态变化展示 */}
            {(log.oldStatus || log.newStatus) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {log.oldStatus && `${log.oldStatus} → `}{log.newStatus}
              </p>
            )}
            {/* 备注信息 */}
            {log.note && <p className="mt-1 text-sm">{log.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
