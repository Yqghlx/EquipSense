/**
 * 审批进度面板组件
 *
 * 以时间线形式展示工单的审批流程进度。
 * 每个审批步骤以圆点+连接线形式呈现，支持当前审批人执行通过/驳回操作。
 *
 * 状态显示规则：
 * - 已通过 → 绿色圆点 + ✓ 图标
 * - 待审批（当前步骤）→ 蓝色圆点 + 通过/驳回按钮
 * - 等待中（后续步骤）→ 灰色圆点
 * - 已驳回 → 红色圆点 + ✗ 图标
 */
import { useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { useApproveWorkOrder, useRejectApproval } from '../../hooks/useApprovals';
import type { WorkOrderApprovalDto } from '../../types';

/** 审批进度面板属性 */
interface ApprovalProgressPanelProps {
  /** 工单唯一标识 */
  workOrderId: string;
  /** 审批记录列表（按 stepOrder 排序） */
  approvals: WorkOrderApprovalDto[];
}

/** 角色对应的中文标签映射 */
const roleLabels: Record<string, string> = {
  system_admin: '系统管理员',
  maintenance_lead: '维修主管',
  technician: '技术员',
  operator: '操作员',
  viewer: '查看者',
};

/**
 * 获取审批动作对应的显示信息
 *
 * 根据审批状态返回圆点样式、图标和状态文本。
 */
function getStepDisplay(action: string, isCurrent: boolean) {
  switch (action) {
    case 'Approved':
      return {
        dotClass: 'bg-green-500 border-green-500 text-white',
        icon: <Check className="h-3 w-3" />,
        statusText: '已通过',
        statusClass: 'text-green-600',
      };
    case 'Rejected':
      return {
        dotClass: 'bg-red-500 border-red-500 text-white',
        icon: <X className="h-3 w-3" />,
        statusText: '已驳回',
        statusClass: 'text-red-600',
      };
    case 'Pending':
      if (isCurrent) {
        return {
          dotClass: 'bg-blue-500 border-blue-500 text-white animate-pulse',
          icon: <Clock className="h-3 w-3" />,
          statusText: '待审批',
          statusClass: 'text-blue-600',
        };
      }
      return {
        dotClass: 'bg-muted border-muted-foreground/30 text-muted-foreground',
        icon: <Clock className="h-3 w-3" />,
        statusText: '等待中',
        statusClass: 'text-muted-foreground',
      };
    default:
      return {
        dotClass: 'bg-muted border-muted-foreground/30',
        icon: null,
        statusText: '未知',
        statusClass: 'text-muted-foreground',
      };
  }
}

/**
 * 审批进度面板组件
 *
 * 以垂直时间线展示审批流程，当前步骤支持通过/驳回操作。
 * 驳回时可填写驳回原因。
 */
export function ApprovalProgressPanel({ workOrderId, approvals }: ApprovalProgressPanelProps) {
  const [rejectingStep, setRejectingStep] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [approveComment, setApproveComment] = useState('');

  const approveMutation = useApproveWorkOrder();
  const rejectMutation = useRejectApproval();

  // 找到第一个 Pending 步骤，即为当前步骤
  const currentStepOrder = approvals.find((a) => a.action === 'Pending')?.stepOrder ?? -1;

  // 检查是否有步骤已被驳回，则后续步骤不再可操作
  const hasRejected = approvals.some((a) => a.action === 'Rejected');

  /** 处理审批通过 */
  const handleApprove = () => {
    approveMutation.mutate(
      { id: workOrderId, comment: approveComment || undefined },
      { onSettled: () => setApproveComment('') },
    );
  };

  /** 处理审批驳回 */
  const handleReject = () => {
    rejectMutation.mutate(
      { id: workOrderId, comment: rejectComment || undefined },
      {
        onSettled: () => {
          setRejectingStep(null);
          setRejectComment('');
        },
      },
    );
  };

  if (approvals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        暂无审批记录
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {approvals.map((approval, index) => {
        const isCurrent = approval.stepOrder === currentStepOrder && !hasRejected;
        const display = getStepDisplay(approval.action, isCurrent);
        const isLast = index === approvals.length - 1;

        return (
          <div key={approval.id} className="relative flex gap-4">
            {/* 左侧时间线 */}
            <div className="flex flex-col items-center">
              {/* 圆点节点 */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${display.dotClass}`}
              >
                {display.icon}
              </div>
              {/* 连接线 */}
              {!isLast && (
                <div className="w-px flex-1 bg-border" />
              )}
            </div>

            {/* 右侧内容区 */}
            <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  第 {approval.stepOrder} 级审批
                </span>
                <Badge variant="outline" className={display.statusClass}>
                  {display.statusText}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {roleLabels[approval.expectedRole] ?? approval.expectedRole}
                </span>
              </div>

              {/* 审批时间和意见 */}
              {approval.actedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(approval.actedAt).toLocaleString()}
                </p>
              )}
              {approval.comment && (
                <p className="mt-1 text-sm text-muted-foreground">
                  意见：{approval.comment}
                </p>
              )}

              {/* 当前待审批步骤：显示通过/驳回操作 */}
              {isCurrent && (
                <div className="mt-3 space-y-2 rounded-md border border-blue-200 bg-blue-50/50 p-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      审批意见（可选）
                    </label>
                    <Textarea
                      value={approveComment}
                      onChange={(e) => setApproveComment(e.target.value)}
                      placeholder="填写审批意见..."
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      通过
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRejectingStep(approval.stepOrder)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      驳回
                    </Button>
                  </div>

                  {/* 驳回原因输入区 */}
                  {rejectingStep === approval.stepOrder && (
                    <div className="space-y-2 rounded-md border border-red-200 bg-red-50/50 p-3">
                      <label className="text-xs font-medium text-red-600">
                        驳回原因
                      </label>
                      <Textarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        placeholder="请填写驳回原因..."
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject()}
                          disabled={rejectMutation.isPending}
                        >
                          确认驳回
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRejectingStep(null);
                            setRejectComment('');
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
