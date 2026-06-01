import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { PriorityBadge } from '../components/workorder/PriorityBadge';
import {
  useWorkOrder,
  useStartWorkOrder,
  useCompleteWorkOrder,
  useAcceptWorkOrder,
  useRejectWorkOrder,
  useCloseWorkOrder,
  useCancelWorkOrder,
} from '../hooks/useWorkOrders';
import type { WorkOrder } from '../types';



/**
 * 工单详情页
 *
 * 展示工单基本信息、状态流转操作按钮、关联信息和审计日志。
 * 根据工单当前状态动态显示可执行的操作按钮。
 */
export default function WorkOrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /** 工单状态对应的中文标签（匹配后端 PascalCase 枚举序列化） */
  const statusLabels: Record<string, string> = {
    PendingDispatch: t('workorder.status.pendingDispatch'),
    Assigned: t('workorder.status.assigned'),
    InProgress: t('workorder.status.inProgress'),
    Completed: t('workorder.status.completed'),
    Accepted: t('workorder.status.accepted'),
    Rejected: t('workorder.status.rejected'),
    Closed: t('workorder.status.closed'),
    Cancelled: t('workorder.status.cancelled'),
  };
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [resolution, setResolution] = useState('');

  const { data: workOrder, isLoading } = useWorkOrder(id ?? '');
  const startOrder = useStartWorkOrder();
  const completeOrder = useCompleteWorkOrder();
  const acceptOrder = useAcceptWorkOrder();
  const rejectOrder = useRejectWorkOrder();
  const closeOrder = useCloseWorkOrder();
  const cancelOrder = useCancelWorkOrder();

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>;
  if (!workOrder) return <div className="py-20 text-center text-muted-foreground">{t('common.noData')}</div>;

  return (
    <div className="space-y-6">
      {/* 头部：返回按钮 + 标题 + 状态/优先级 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/work-orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{workOrder.title}</h1>
          <p className="text-sm text-muted-foreground">{workOrder.workOrderCode}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline">{statusLabels[workOrder.status] ?? workOrder.status}</Badge>
          <PriorityBadge priority={workOrder.priority} />
        </div>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
          <div><p className="text-sm text-muted-foreground">{t('common.type')}</p><p className="font-medium">{workOrder.type}</p></div>
          <div>
            <p className="text-sm text-muted-foreground">{t('common.status')}</p>
            <Badge variant="outline">{statusLabels[workOrder.status]}</Badge>
          </div>
          <div><p className="text-sm text-muted-foreground">{t('workorder.assignedTo')}</p><p className="font-medium">{workOrder.assignedTo ?? '-'}</p></div>
          <div><p className="text-sm text-muted-foreground">{t('workorder.dueDate')}</p><p className="font-medium">{workOrder.dueDate ?? '-'}</p></div>
          <div><p className="text-sm text-muted-foreground">{t('common.createdAt')}</p><p className="font-medium">{new Date(workOrder.createdAt).toLocaleString()}</p></div>
          {workOrder.completedAt && (
            <div><p className="text-sm text-muted-foreground">{t('workorder.completedAt')}</p><p className="font-medium">{new Date(workOrder.completedAt).toLocaleString()}</p></div>
          )}
        </CardContent>
      </Card>

      {/* 状态流转操作按钮 */}
      <ActionButtons
        workOrder={workOrder}
        onStart={() => startOrder.mutate(workOrder.id)}
        onAccept={() => acceptOrder.mutate(workOrder.id)}
        onReject={(reason) => rejectOrder.mutate({ id: workOrder.id, reason })}
        onClose={() => closeOrder.mutate(workOrder.id)}
        onCancel={() => setCancelDialogOpen(true)}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* 关联信息：根因描述 + 解决措施 */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t('workorder.relatedInfo')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {workOrder.rootCause ? (
              <div>
                <p className="text-sm text-muted-foreground">{t('workorder.rootCause')}</p>
                <p className="mt-1 text-sm">{workOrder.rootCause}</p>
              </div>
            ) : null}
            {workOrder.resolution ? (
              <div>
                <p className="text-sm text-muted-foreground">{t('workorder.resolution')}</p>
                <p className="mt-1 text-sm">{workOrder.resolution}</p>
              </div>
            ) : null}
            {!workOrder.rootCause && !workOrder.resolution && (
              <p className="text-sm text-muted-foreground">{t('workorder.noRelatedInfo')}</p>
            )}
          </CardContent>
        </Card>

        {/* 审计日志时间线 */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t('workorder.operationRecords')}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('workorder.noOperationRecords')}</p>
          </CardContent>
        </Card>
      </div>

      {/* 执行中状态：填写解决措施区域 */}
      {workOrder.status === 'InProgress' && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('workorder.fillResolution')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder={t('workorder.describeResolution')}
              rows={3}
            />
            <Button
              onClick={() => completeOrder.mutate({ id: workOrder.id, resolution })}
              disabled={!resolution || completeOrder.isPending}
            >
              {t('workorder.complete')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 取消工单对话框 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('workorder.cancel')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t('workorder.cancelReason')}</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={t('workorder.enterCancelReason')}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button
                variant="destructive"
                disabled={!cancelReason}
                onClick={() => {
                  cancelOrder.mutate({ id: workOrder.id, reason: cancelReason });
                  setCancelDialogOpen(false);
                }}
              >
                {t('workorder.confirmCancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** 操作按钮组件属性 */
interface ActionButtonsProps {
  /** 当前工单数据 */
  workOrder: WorkOrder;
  /** 开始执行回调 */
  onStart: () => void;
  /** 验收通过回调 */
  onAccept: () => void;
  /** 验收不通过回调（附带原因） */
  onReject: (reason: string) => void;
  /** 关闭工单回调 */
  onClose: () => void;
  /** 取消工单回调 */
  onCancel: () => void;
}

/**
 * 工单状态操作按钮组件
 *
 * 根据工单当前状态动态显示可用的操作按钮。
 * 状态流转规则：
 * - pending_dispatch / dispatched → 开始执行 / 取消
 * - in_progress → 取消（完成操作在独立区域）
 * - completed → 验收通过 / 验收不通过
 * - accepted → 关闭
 */
function ActionButtons({ workOrder, onStart, onAccept, onReject, onClose, onCancel }: ActionButtonsProps) {
  const { t } = useTranslation();
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  /** 各状态对应的可用按钮配置 */
  const buttons: Record<string, Array<{ label: string; action: () => void; variant?: 'default' | 'outline' | 'destructive' }>> = {
    PendingDispatch: [{ label: t('workorder.dispatch'), action: onStart }],
    Assigned: [{ label: t('workorder.startExecution'), action: onStart }],
    InProgress: [],
    Completed: [
      { label: t('workorder.accept'), action: onAccept },
      { label: t('workorder.reject'), action: () => setShowReject(true), variant: 'outline' },
    ],
    Accepted: [{ label: t('workorder.close'), action: onClose }],
    Rejected: [],
    Closed: [],
    Cancelled: [],
  };

  const available = buttons[workOrder.status] ?? [];

  // 非 terminal 状态添加取消按钮
  if (available.length === 0 && workOrder.status !== 'cancelled' && workOrder.status !== 'closed') {
    available.push({ label: t('workorder.cancel'), action: onCancel, variant: 'destructive' });
  }

  if (available.length === 0 && !showReject) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        {available.map((btn) => (
          <Button key={btn.label} variant={btn.variant ?? 'default'} onClick={btn.action}>
            {btn.label}
          </Button>
        ))}
        {/* 验收不通过原因输入区 */}
        {showReject && (
          <div className="flex w-full items-center gap-2">
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('workorder.rejectReasonPlaceholder')}
              className="flex-1"
            />
            <Button size="sm" disabled={!rejectReason} onClick={() => { onReject(rejectReason); setShowReject(false); }}>{t('common.submit')}</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>{t('common.cancel')}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
