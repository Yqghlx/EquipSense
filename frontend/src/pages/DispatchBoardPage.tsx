/**
 * 智能派工看板页面
 *
 * 左侧展示待派工工单列表，右侧展示基于技能匹配和负载均衡的
 * 技术人员推荐。支持一键派工操作，派工后自动刷新工单和推荐数据。
 *
 * 工业现场考量：
 * - 派工通常发生在故障现场（车间/移动端），布局采用单列→双列响应式，
 *   手机和平板都能单手操作；
 * - 现场网络不稳，加载失败必须显式提示并提供"重试"，避免主管误以为"没有工单"；
 * - 派工是关键操作，必须给成功/失败反馈，否则主管不确定是否已派单，可能重复派工。
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, RefreshCw, Clock, ClipboardList, Users, AlertTriangle } from 'lucide-react';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useDispatchRecommendations, useAssignFromRecommendation } from '../hooks/useDispatch';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PriorityBadge } from '../components/workorder/PriorityBadge';
import { useNotificationStore } from '../stores/notificationStore';
import type { WorkOrder } from '../types';

/** 综合匹配度对应的进度条颜色（越高越绿，便于主管一眼识别最佳人选） */
function matchBarColor(score: number): string {
  if (score >= 0.7) return 'bg-green-500';
  if (score >= 0.5) return 'bg-blue-500';
  return 'bg-amber-500';
}

/** 判断工单是否已超过 SLA 截止时间 */
function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < Date.now();
}

/** 紧凑格式化截止时间（MM-DD HH:mm），适合卡片内展示 */
function formatDue(dueDate?: string): string {
  if (!dueDate) return '';
  const d = new Date(dueDate);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DispatchBoardPage() {
  const { t } = useTranslation();
  const pushNotification = useNotificationStore((s) => s.push);
  const [selectedWoId, setSelectedWoId] = useState<string>();

  // 查询待派工状态的工单列表（仅取第一页，派工场景下待派工通常不会太多）
  const {
    data: workOrdersData,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useWorkOrders(
    { page: 1, pageSize: 20, sort: 'createdAt', order: 'desc' },
    { status: 'PendingDispatch' },
  );

  // 查询选中工单的派工推荐
  const {
    data: recommendations,
    isLoading: recsLoading,
    isError: recsError,
    refetch: refetchRecs,
  } = useDispatchRecommendations(selectedWoId);
  const assignMutation = useAssignFromRecommendation();

  const pendingOrders: WorkOrder[] = workOrdersData?.items ?? [];
  const selectedOrder = pendingOrders.find((wo) => wo.id === selectedWoId);

  /**
   * 执行派工：成功后提示 + 清空选中工单（该工单将离开待派工列表），
   * 失败时提示重试。反馈通过通知中心给出，确保主管明确知道操作结果。
   */
  const handleAssign = (technicianUserId: string, technicianName: string) => {
    if (!selectedWoId) return;
    assignMutation.mutate(
      { workOrderId: selectedWoId, technicianUserId },
      {
        onSuccess: () => {
          pushNotification({
            type: 'workorder',
            title: t('dispatch.assignSuccess'),
            message: `${selectedOrder?.title ?? ''} → ${technicianName}`,
            link: selectedWoId ? `/work-orders/${selectedWoId}` : undefined,
          });
          setSelectedWoId(undefined);
        },
        onError: () => {
          pushNotification({
            type: 'system',
            title: t('dispatch.assignFailed'),
            message: selectedOrder?.title ?? '',
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">{t('dispatch.title')}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左侧：待派工工单列表 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dispatch.pendingOrders')}</h2>

          {/* 加载态 */}
          {ordersLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.loading')}
            </div>
          ) : ordersError ? (
            /* 错误态：现场网络差时明确提示并可重试，避免误判为"无工单" */
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="text-sm text-muted-foreground">{t('common.loadFailed')}</p>
                <Button variant="outline" size="sm" onClick={() => refetchOrders()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('common.retry')}
                </Button>
              </CardContent>
            </Card>
          ) : pendingOrders.length === 0 ? (
            /* 空态：引导说明待派工工单的来源，避免主管困惑 */
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t('dispatch.noPending')}</p>
                <p className="max-w-xs text-xs text-muted-foreground/70">{t('dispatch.pendingHint')}</p>
              </CardContent>
            </Card>
          ) : (
            pendingOrders.map((wo) => {
              const overdue = isOverdue(wo.dueDate);
              return (
                <Card
                  key={wo.id}
                  className={`cursor-pointer transition-colors ${selectedWoId === wo.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedWoId(wo.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{wo.title}</p>
                        <p className="text-sm text-muted-foreground">{wo.workOrderCode}</p>
                        {/* SLA 截止时间：超期标红提醒优先派工 */}
                        {wo.dueDate && (
                          <p
                            className={`mt-1 flex items-center gap-1 text-xs ${
                              overdue ? 'font-medium text-red-500' : 'text-muted-foreground'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {overdue ? t('dispatch.overdue') : t('dispatch.slaDue')}：{formatDue(wo.dueDate)}
                          </p>
                        )}
                      </div>
                      <PriorityBadge priority={wo.priority} />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* 右侧：推荐技术人员 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dispatch.recommendations')}</h2>

          {/* 选中工单上下文：让主管在右侧仍能看到正在派的是哪个工单 */}
          {selectedOrder && (
            <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              <div className="min-w-0">
                <span className="text-muted-foreground">{t('dispatch.selectedOrder')}：</span>
                <span className="ml-1 truncate font-medium">{selectedOrder.title}</span>
              </div>
              <PriorityBadge priority={selectedOrder.priority} />
            </div>
          )}

          {/* 未选工单 */}
          {!selectedWoId ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t('dispatch.selectOrder')}</p>
              </CardContent>
            </Card>
          ) : recsLoading ? (
            /* 推荐生成中（后端需做技能匹配计算，可能有短暂延迟） */
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('dispatch.generatingRecs')}
            </div>
          ) : recsError ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <p className="text-sm text-muted-foreground">{t('dispatch.loadRecsFailed')}</p>
                <Button variant="outline" size="sm" onClick={() => refetchRecs()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('common.retry')}
                </Button>
              </CardContent>
            </Card>
          ) : !recommendations?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t('dispatch.noTechnicians')}</p>
              </CardContent>
            </Card>
          ) : (
            recommendations.map((rec, idx) => (
              <Card key={rec.technicianUserId}>
                <CardContent className="space-y-3 p-4">
                  {/* 排名、姓名、匹配度 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                      <span className="font-medium">{rec.name}</span>
                      {idx === 0 && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                          {t('dispatch.topMatch')}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{(rec.totalScore * 100).toFixed(0)}%</span>
                      <span className="ml-1 text-xs text-muted-foreground">{t('dispatch.match')}</span>
                    </div>
                  </div>

                  {/* 综合匹配度进度条：颜色随分数变化，辅助快速决策 */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${matchBarColor(rec.totalScore)}`}
                      style={{ width: `${Math.round(rec.totalScore * 100)}%` }}
                    />
                  </div>

                  {/* 评分明细 */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('dispatch.skillScore')}</span>
                      <p className="font-medium">{(rec.skillScore * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('dispatch.loadScore')}</span>
                      <p className="font-medium">{(rec.loadScore * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('dispatch.activeWork')}</span>
                      <p className="font-medium">{rec.activeWorkCount}</p>
                    </div>
                  </div>

                  {/* 推荐理由 */}
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>

                  {/* 派工按钮：加载中显示 Spinner 并禁用，防止重复派工 */}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleAssign(rec.technicianUserId, rec.name)}
                    disabled={assignMutation.isPending}
                  >
                    {assignMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('dispatch.assigning')}
                      </>
                    ) : (
                      t('dispatch.assign')
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
