/**
 * 工单报表统计页面
 *
 * 展示工单的多维度统计：状态分布、类型分布、优先级分布、
 * 新建/完成趋势、平均完成时长、SLA 达成率。
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart } from '@/components/charts/PieChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { useWorkOrderStatistics } from '@/hooks/useWorkOrderStatistics';

/** 状态对应颜色 */
const statusColors: Record<string, string> = {
  PendingDispatch: '#94a3b8',
  Assigned: '#3b82f6',
  InProgress: '#f59e0b',
  Completed: '#22c55e',
  SubmittedForApproval: '#8b5cf6',
  Closed: '#6b7280',
  Cancelled: '#ef4444',
  Accepted: '#06b6d4',
  Rejected: '#f97316',
};

/** 优先级对应颜色 */
const priorityColors: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#22c55e',
};

/** 类型对应颜色 */
const typeColors: Record<string, string> = {
  Corrective: '#ef4444',
  Preventive: '#3b82f6',
  Predictive: '#8b5cf6',
};

export default function WorkOrderReportsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const { data: stats, isLoading } = useWorkOrderStatistics(period);

  const periods = [
    { value: 7 as const, label: t('common.7days', '7 天') },
    { value: 30 as const, label: t('common.30days', '30 天') },
    { value: 90 as const, label: t('common.90days', '90 天') },
  ];

  // 将后端分布数据转为饼图格式
  const toPieData = (dist: Record<string, number>, colors: Record<string, string>) =>
    Object.entries(dist).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#6b7280',
    }));

  // 趋势数据转换
  const toTrendData = (trend: Array<{ date: string; count: number }>) =>
    trend.map((p) => ({ time: p.date, value: p.count }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('common.loading', '加载中...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 + 时间选择器 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('workOrders.reports', '工单报表')}</h1>
        <div className="flex gap-2">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('workOrders.totalCount', '工单总数')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('workOrders.avgCompletion', '平均完成时长')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.avgCompletionHoursByPriority
                ? (
                    Object.values(stats.avgCompletionHoursByPriority).reduce(
                      (sum, v) => sum + v,
                      0
                    ) / (Object.keys(stats.avgCompletionHoursByPriority).length || 1)
                  ).toFixed(1)
                : '0'}{' '}
              h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {t('workOrders.slaRate', 'SLA 达成率')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.slaRateByPriority
                ? (
                    Object.values(stats.slaRateByPriority).reduce(
                      (sum, v) => sum + v,
                      0
                    ) / (Object.keys(stats.slaRateByPriority).length || 1)
                  ).toFixed(1)
                : '0'}
              %
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表网格 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('workOrders.byStatus', '按状态分布')}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && (
              <PieChart
                data={toPieData(stats.byStatus, statusColors)}
                height={280}
              />
            )}
          </CardContent>
        </Card>

        {/* 类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('workOrders.byType', '按类型分布')}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && (
              <PieChart
                data={toPieData(stats.byType, typeColors)}
                height={280}
              />
            )}
          </CardContent>
        </Card>

        {/* 新建/完成趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('workOrders.trend', '新建 / 完成趋势')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && (
              <>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t('workOrders.createdTrend', '新建')}
                  </p>
                  <TrendChart
                    data={toTrendData(stats.createdTrend)}
                    color="#3b82f6"
                    height={120}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {t('workOrders.completedTrend', '完成')}
                  </p>
                  <TrendChart
                    data={toTrendData(stats.completedTrend)}
                    color="#22c55e"
                    height={120}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* SLA 达成率仪表盘 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('workOrders.slaByPriority', 'SLA 达成率（按优先级）')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.slaRateByPriority && Object.keys(stats.slaRateByPriority).length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(stats.slaRateByPriority).map(([priority, rate]) => (
                  <div key={priority} className="text-center">
                    <p className="mb-1 text-xs text-muted-foreground">{priority}</p>
                    <GaugeChart
                      value={rate}
                      max={100}
                      color={priorityColors[priority] || '#6b7280'}
                      height={100}
                    />
                    <p className="mt-1 text-sm font-medium">{rate.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                {t('workOrders.noSlaData', '暂无 SLA 数据')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
