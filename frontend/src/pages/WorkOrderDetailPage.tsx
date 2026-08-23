import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { PriorityBadge } from '../components/workorder/PriorityBadge';
import { SlaCountdown } from '../components/workorder/SlaCountdown';
import { ApprovalProgressPanel } from '../components/workorder/ApprovalProgressPanel';
import { StatusTimeline } from '../components/workorder/StatusTimeline';
import { OfflineSyncPanel } from '../components/workorder/OfflineSyncPanel';
import AttachmentUpload from '../components/workorder/AttachmentUpload';
import { OfflineStatusBadge } from '../components/workorder/OfflineStatusBadge';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import {
  useWorkOrder,
  useWorkOrderLogs,
  useStartWorkOrder,
  useCompleteWorkOrder,
  useAcceptWorkOrder,
  useRejectWorkOrder,
  useCloseWorkOrder,
  useCancelWorkOrder,
} from '../hooks/useWorkOrders';
import { useTechnicians, useAssignFromRecommendation } from '../hooks/useDispatch';
import {
  useWorkOrderApprovals,
  useSubmitWorkOrder,
} from '../hooks/useApprovals';
import { getWorkOrderStatusLabels, isTerminalWorkOrderStatus } from '../utils/workorder';
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

  /** 工单状态对应的中文标签（使用共享工具函数，匹配后端 PascalCase 枚举序列化） */
  const statusLabels = getWorkOrderStatusLabels(t);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [resolution, setResolution] = useState('');
  // 维修执行报告/使用零件：完成或提交验收时填写，是知识沉淀 FaultCase.Solution/PartsUsed 的数据源（回归 #252：
  // 原前端只传 resolution，后端 ExecutionReport/RequiredParts 永远为空 → Solution 永远降级、PartsUsed 永远空）
  const [executionReport, setExecutionReport] = useState('');
  const [requiredParts, setRequiredParts] = useState('');
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');

  const { data: workOrder, isLoading, isError, refetch } = useWorkOrder(id ?? '');
  const { data: logs = [], isLoading: logsLoading } = useWorkOrderLogs(id ?? '');
  const { data: approvals } = useWorkOrderApprovals(id);
  const startOrder = useStartWorkOrder();
  const completeOrder = useCompleteWorkOrder();
  const acceptOrder = useAcceptWorkOrder();
  const rejectOrder = useRejectWorkOrder();
  const closeOrder = useCloseWorkOrder();
  const cancelOrder = useCancelWorkOrder();
  const submitOrder = useSubmitWorkOrder();
  const { enqueue } = useOfflineQueue();
  const { data: technicians } = useTechnicians(true);
  const assignOrder = useAssignFromRecommendation();

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>;
  if (isError && !workOrder) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-muted-foreground">{t('common.loadFailed')}</p>
        <Button variant="outline" size="sm" onClick={() => { void refetch(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('common.retry')}
        </Button>
      </div>
    );
  }
  if (!workOrder) return <div className="py-20 text-center text-muted-foreground">{t('common.noData')}</div>;

  const actionPending = startOrder.isPending
    || completeOrder.isPending
    || acceptOrder.isPending
    || rejectOrder.isPending
    || closeOrder.isPending
    || cancelOrder.isPending
    || submitOrder.isPending;

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
          <OfflineStatusBadge />
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
          <div>
            <p className="text-sm text-muted-foreground">{t('workorder.assignedTo')}</p>
            <p className="font-medium">
              {workOrder.assignedToName
                ?? (workOrder.assignedTo ? t('workorder.unknownAssignee') : '-')}
            </p>
          </div>
          <div><p className="text-sm text-muted-foreground">{t('workorder.dueDate')}</p><div className="font-medium"><SlaCountdown dueDate={workOrder.dueDate} createdAt={workOrder.createdAt} status={workOrder.status} showRawDateWhenTerminal /></div></div>
          <div><p className="text-sm text-muted-foreground">{t('common.createdAt')}</p><p className="font-medium">{new Date(workOrder.createdAt).toLocaleString()}</p></div>
          {workOrder.completedAt && (
            <div><p className="text-sm text-muted-foreground">{t('workorder.completedAt')}</p><p className="font-medium">{new Date(workOrder.completedAt).toLocaleString()}</p></div>
          )}
          {workOrder.actualHours != null && workOrder.actualHours > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">{t('workorder.actualHours')}</p>
              <p className="font-medium">
                {workOrder.actualHours < 1
                  ? t('workorder.slaMinutes', { count: Math.round(workOrder.actualHours * 60) })
                  : t('workorder.slaHours', { count: Math.round(workOrder.actualHours * 10) / 10 })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 状态流转操作按钮 */}
      <ActionButtons
        workOrder={workOrder}
        hasApprovals={(approvals?.length ?? 0) > 0}
        actionPending={actionPending}
        onDispatch={() => setDispatchDialogOpen(true)}
        onStart={async () => {
          try {
            await startOrder.mutateAsync(workOrder.id);
            toast.success(t('workorder.startSuccess'));
          } catch {
            toast.error(t('workorder.startFailed'));
          }
        }}
        onAccept={async () => {
          try {
            await acceptOrder.mutateAsync(workOrder.id);
            toast.success(t('workorder.acceptSuccess'));
          } catch {
            toast.error(t('workorder.acceptFailed'));
          }
        }}
        onReject={async (reason) => {
          await rejectOrder.mutateAsync({ id: workOrder.id, reason });
          toast.success(t('workorder.rejectSuccess'));
        }}
        onClose={async () => {
          try {
            await closeOrder.mutateAsync(workOrder.id);
            toast.success(t('workorder.closeSuccess'));
          } catch {
            toast.error(t('workorder.closeFailed'));
          }
        }}
        onCancel={() => setCancelDialogOpen(true)}
        onSubmitForApproval={async () => {
          try {
            await submitOrder.mutateAsync({
              id: workOrder.id,
              resolution,
              executionReport,
              requiredParts,
            });
            toast.success(t('workorder.submitSuccess'));
          } catch {
            toast.error(t('workorder.submitFailed'));
          }
        }}
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
            {workOrder.executionReport ? (
              <div>
                <p className="text-sm text-muted-foreground">{t('workorder.executionReport')}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{workOrder.executionReport}</p>
              </div>
            ) : null}
            {workOrder.requiredParts ? (
              <div>
                <p className="text-sm text-muted-foreground">{t('workorder.requiredParts')}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{workOrder.requiredParts}</p>
              </div>
            ) : null}
            {!workOrder.rootCause && !workOrder.resolution && !workOrder.executionReport && !workOrder.requiredParts && (
              <p className="text-sm text-muted-foreground">{t('workorder.noRelatedInfo')}</p>
            )}
          </CardContent>
        </Card>

        {/* 审计日志时间线 */}
        <Card>
          <CardHeader><CardTitle className="text-base">{t('workorder.operationRecords')}</CardTitle></CardHeader>
          <CardContent>
            {logsLoading
              ? <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              : <StatusTimeline logs={logs} />}
          </CardContent>
        </Card>
      </div>

      {/* 执行中状态：填写解决措施区域 */}
      {workOrder.status === 'InProgress' && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('workorder.fillResolution')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('workorder.resolution')}</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder={t('workorder.describeResolution')}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('workorder.executionReport')}</Label>
              <Textarea
                value={executionReport}
                onChange={(e) => setExecutionReport(e.target.value)}
                placeholder={t('workorder.executionReportPlaceholder')}
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('workorder.requiredParts')}</Label>
              <Textarea
                value={requiredParts}
                onChange={(e) => setRequiredParts(e.target.value)}
                placeholder={t('workorder.requiredPartsPlaceholder')}
                rows={2}
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  if (navigator.onLine) {
                    await completeOrder.mutateAsync({ id: workOrder.id, resolution, executionReport, requiredParts });
                    toast.success(t('workorder.completeSuccess'));
                  } else {
                    await enqueue(
                      'work-order-complete',
                      `/api/v1/work-orders/${workOrder.id}/complete`,
                      'PUT',
                      { id: workOrder.id, resolution, executionReport, requiredParts },
                    );
                    toast.success(t('workorder.offlineSaveSuccess'));
                  }
                } catch {
                  toast.error(t('workorder.completeFailed'));
                }
              }}
              disabled={!resolution || completeOrder.isPending}
              aria-busy={completeOrder.isPending}
            >
              {navigator.onLine ? t('workorder.complete') : t('workorder.offlineSave')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 待审批状态：审批进度面板 */}
      {workOrder.status === 'SubmittedForApproval' && approvals && approvals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('workorder.approvalProgressTitle')}</CardTitle></CardHeader>
          <CardContent>
            <ApprovalProgressPanel
              workOrderId={workOrder.id}
              approvals={approvals}
            />
          </CardContent>
        </Card>
      )}

      {/* 工单附件 */}
      {id && (
        <AttachmentUpload
          workOrderId={id}
          canEdit={workOrder?.status !== 'Closed' && workOrder?.status !== 'Cancelled'}
        />
      )}

      {/* 离线同步面板 */}
      <OfflineSyncPanel />

      {/* 派工对话框 */}
      <Dialog open={dispatchDialogOpen} onOpenChange={setDispatchDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('workorder.dispatch')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t('workorder.selectTechnician')}</Label>
              {technicians && technicians.length > 0 ? (
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {technicians.map((tech) => (
                    <button
                      key={tech.userId}
                      type="button"
                      className={`w-full rounded-md border p-3 text-left transition-colors ${selectedTechnician === tech.userId ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                      onClick={() => setSelectedTechnician(tech.userId)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{tech.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {t('workorder.activeWorkCount', { count: tech.activeWorkCount })}
                        </span>
                      </div>
                      {Array.isArray(tech.skills) && tech.skills.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {tech.skills.map((s) => (
                            <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-xs">{s}</span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">{t('workorder.noTechnicians')}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDispatchDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button
                disabled={!selectedTechnician || assignOrder.isPending}
                onClick={() => {
                  assignOrder.mutate(
                    { workOrderId: workOrder.id, technicianUserId: selectedTechnician },
                    {
                      onSuccess: () => {
                        toast.success(t('workorder.dispatchSuccess'));
                        setDispatchDialogOpen(false);
                        setSelectedTechnician('');
                      },
                      onError: (err) => {
                        toast.error(t('common.error'), { description: err.message });
                      },
                    },
                  );
                }}
              >
                {t('workorder.confirmDispatch')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                disabled={!cancelReason || cancelOrder.isPending}
                aria-busy={cancelOrder.isPending}
                onClick={async () => {
                  try {
                    await cancelOrder.mutateAsync({ id: workOrder.id, reason: cancelReason });
                    toast.success(t('workorder.cancelSuccess'));
                    setCancelDialogOpen(false);
                    setCancelReason('');
                  } catch {
                    toast.error(t('workorder.cancelFailed'));
                  }
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
  /** 派工回调 */
  onDispatch: () => void;
  /** 开始执行回调 */
  onStart: () => void | Promise<void>;
  /** 验收通过回调 */
  onAccept: () => void | Promise<void>;
  /** 验收不通过回调（附带原因）；失败时应抛出，以便保留原因输入框 */
  onReject: (reason: string) => void | Promise<void>;
  /** 关闭工单回调 */
  onClose: () => void | Promise<void>;
  /** 取消工单回调 */
  onCancel: () => void;
  /** 提交验收（发起审批流程）回调 */
  onSubmitForApproval: () => void | Promise<void>;
  /** 任意状态变更请求进行中 */
  actionPending?: boolean;
  /** 是否已有审批记录；无审批链时 SubmittedForApproval 仍需提供验收入口 */
  hasApprovals?: boolean;
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
function ActionButtons({ workOrder, onDispatch, onStart, onAccept, onReject, onClose, onCancel, onSubmitForApproval, actionPending = false, hasApprovals = false }: ActionButtonsProps) {
  const { t } = useTranslation();
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  /** 各状态对应的可用按钮配置 */
  const buttons: Record<string, Array<{ label: string; action: () => void; variant?: 'default' | 'outline' | 'destructive' }>> = {
    PendingDispatch: [{ label: t('workorder.dispatch'), action: onDispatch }],
    Assigned: [{ label: t('workorder.startExecution'), action: onStart }],
    InProgress: [{ label: t('workorder.submitForApproval'), action: onSubmitForApproval }],
    SubmittedForApproval: hasApprovals
      ? []
      : [{ label: t('workorder.accept'), action: onAccept }],
    Completed: [
      { label: t('workorder.accept'), action: onAccept },
      { label: t('workorder.reject'), action: () => setShowReject(true), variant: 'outline' },
    ],
    Accepted: [{ label: t('workorder.close'), action: onClose }],
    Rejected: [],
    Closed: [],
    Cancelled: [],
  };

  /** 创建按钮数组副本，防止后续 push 操作修改原始常量数组 */
  const available = [...(buttons[workOrder.status] ?? [])];

  // 非终态且当前没有其它操作时补充取消按钮；必须按 PascalCase 比较，避免 Closed 被误判为仍可取消
  if (available.length === 0 && !isTerminalWorkOrderStatus(workOrder.status)) {
    available.push({ label: t('workorder.cancel'), action: onCancel, variant: 'destructive' });
  }

  if (available.length === 0 && !showReject) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        {available.map((btn) => (
          <Button
            key={btn.label}
            variant={btn.variant ?? 'default'}
            disabled={actionPending}
            aria-busy={actionPending}
            onClick={() => { void btn.action(); }}
          >
            {actionPending ? t('common.loading') : btn.label}
          </Button>
        ))}
        {/* 验收不通过原因输入区：失败时保留输入，避免用户重填原因 */}
        {showReject && (
          <div className="flex w-full items-center gap-2">
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('workorder.rejectReasonPlaceholder')}
              className="flex-1"
            />
            <Button
              size="sm"
              disabled={!rejectReason || actionPending}
              onClick={async () => {
                try {
                  await onReject(rejectReason);
                  setShowReject(false);
                } catch {
                  toast.error(t('workorder.rejectFailed'));
                }
              }}
            >
              {t('common.submit')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>{t('common.cancel')}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
