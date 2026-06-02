/**
 * 智能派工看板页面
 *
 * 左侧展示待派工工单列表，右侧展示基于技能匹配和负载均衡的
 * 技术人员推荐。支持一键派工操作，派工后自动刷新工单和推荐数据。
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { useDispatchRecommendations, useAssignFromRecommendation } from '../hooks/useDispatch';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import type { WorkOrder } from '../types';

export default function DispatchBoardPage() {
  const { t } = useTranslation();
  const [selectedWoId, setSelectedWoId] = useState<string>();

  // 查询待派工状态的工单列表
  const { data: workOrdersData } = useWorkOrders(
    { page: 1, pageSize: 20, sort: 'createdAt', order: 'desc' },
    { status: 'PendingDispatch' },
  );

  // 查询选中工单的派工推荐
  const { data: recommendations } = useDispatchRecommendations(selectedWoId);
  const assignMutation = useAssignFromRecommendation();

  const pendingOrders: WorkOrder[] = workOrdersData?.items ?? [];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{t('dispatch.title')}</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：待派工工单列表 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dispatch.pendingOrders')}</h2>
          {pendingOrders.map((wo) => (
            <Card
              key={wo.id}
              className={`cursor-pointer transition-colors ${selectedWoId === wo.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedWoId(wo.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{wo.title}</p>
                    <p className="text-sm text-muted-foreground">{wo.workOrderCode}</p>
                  </div>
                  <Badge
                    variant={
                      wo.priority === 'Urgent' || wo.priority === 'Critical'
                        ? 'destructive'
                        : wo.priority === 'High'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {wo.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingOrders.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">{t('dispatch.noPending')}</p>
          )}
        </div>

        {/* 右侧：推荐技术人员 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('dispatch.recommendations')}</h2>
          {!selectedWoId ? (
            <p className="py-8 text-center text-muted-foreground">{t('dispatch.selectOrder')}</p>
          ) : !recommendations?.length ? (
            <p className="py-8 text-center text-muted-foreground">{t('dispatch.noTechnicians')}</p>
          ) : (
            recommendations.map((rec, idx) => (
              <Card key={rec.technicianUserId}>
                <CardContent className="space-y-3 p-4">
                  {/* 排名、姓名、匹配度 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                      <span className="font-medium">{rec.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{(rec.totalScore * 100).toFixed(0)}%</span>
                      <span className="ml-1 text-xs text-muted-foreground">{t('dispatch.match')}</span>
                    </div>
                  </div>

                  {/* 评分明细 */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      {t('dispatch.skillScore')}：{(rec.skillScore * 100).toFixed(0)}%
                    </div>
                    <div>
                      {t('dispatch.loadScore')}：{(rec.loadScore * 100).toFixed(0)}%
                    </div>
                    <div>
                      {t('dispatch.activeWork')}：{rec.activeWorkCount}
                    </div>
                  </div>

                  {/* 推荐理由 */}
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>

                  {/* 派工按钮 */}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      assignMutation.mutate({
                        workOrderId: selectedWoId,
                        technicianUserId: rec.technicianUserId,
                      })
                    }
                    disabled={assignMutation.isPending}
                  >
                    {t('dispatch.assign')}
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
