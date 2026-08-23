import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { TrendChart } from '../components/charts/TrendChart';
import { PieChart } from '../components/charts/PieChart';
import { SeverityBadge } from '../components/alert/SeverityBadge';
import TrendWarningsCard from '../components/analysis/TrendWarningsCard';
import { useDashboardStats, useOee } from '../hooks/useDashboard';
import { useAlerts } from '../hooks/useAlerts';
import { useGlobalStats } from '../hooks/useTenantsAdmin';
import { useAuthStore } from '../stores/authStore';
import { getWorkOrderStatusLabels } from '../utils/workorder';
import { Button } from '../components/ui/button';
import {
  Wrench, AlertTriangle, ClipboardList, Activity,
  Building2, Users, Snowflake, RefreshCw,
} from 'lucide-react';
/** 告警严重级别对应的颜色映射 */
const severityColors: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Normal: '#eab308',
  Low: '#6b7280',
};

/** 工单状态对应的 Badge 变体颜色 */
const workOrderStatusVariant: Record<string, string> = {
  PendingDispatch: 'bg-yellow-500/10 text-yellow-600',
  Assigned: 'bg-blue-500/10 text-blue-600',
  InProgress: 'bg-indigo-500/10 text-indigo-600',
  Completed: 'bg-green-500/10 text-green-600',
  SubmittedForApproval: 'bg-purple-500/10 text-purple-600',
  Accepted: 'bg-emerald-500/10 text-emerald-600',
  Rejected: 'bg-red-500/10 text-red-600',
  Closed: 'bg-gray-500/10 text-gray-600',
  Cancelled: 'bg-gray-500/10 text-gray-500',
};

/**
 * 仪表盘页
 *
 * 展示系统概览：设备可用率、告警/工单趋势、告警级别分布、工单状态分布。
 * 统计卡片可点击跳转到对应的管理页面。
 */
export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isSystemAdmin = user?.role === 'SystemAdmin';

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useDashboardStats();
  const { data: oee, isError: oeeError, refetch: refetchOee } = useOee();
  const {
    data: alertsData,
    isLoading: alertsLoading,
    isError: alertsError,
    refetch: refetchAlerts,
  } = useAlerts({ page: 1, pageSize: 10 }, { status: 'active' });
  const statsFailed = statsError && !stats;
  const alertsFailed = alertsError && !alertsData;
  const alertsEmpty = Boolean(alertsData && alertsData.items.length === 0);
  const { data: globalStats } = useGlobalStats({ enabled: isSystemAdmin });
  const workOrderStatusLabels = getWorkOrderStatusLabels(t);

  /** 统计卡片配置（可点击跳转） */
  const statCards = [
    { label: t('device.online'), value: stats?.onlineDevices ?? '-', icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10', link: '/devices' },
    { label: t('alert.active'), value: stats?.activeAlerts ?? '-', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', link: '/alerts' },
    { label: t('dashboard.pendingWorkOrders'), value: stats?.pendingWorkOrders ?? '-', icon: ClipboardList, color: 'text-yellow-500', bg: 'bg-yellow-500/10', link: '/work-orders' },
    { label: t('dashboard.deviceAvailability'), value: stats != null ? `${stats.availability}%` : '-', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10', link: '/devices' },
  ];

  /** 设备状态分布饼图数据 */
  const devicePieData = stats
    ? [
        { name: t('device.online'), value: stats.onlineDevices, color: '#3b82f6' },
        { name: t('device.offline'), value: Math.max(0, stats.totalDevices - stats.onlineDevices), color: '#6b7280' },
      ]
    : [];

  /** 告警级别分布饼图数据 */
  const severityPieData = stats
    ? Object.entries(stats.alertsBySeverity).map(([severity, count]) => ({
        name: severity,
        value: count,
        color: severityColors[severity] ?? '#6b7280',
      }))
    : [];

  /** 告警趋势折线图数据 */
  const alertTrendData = (stats?.alertTrend ?? []).map((p) => ({
    time: p.date,
    value: p.count,
  }));

  /** 工单趋势折线图数据 */
  const workOrderTrendData = (stats?.workOrderTrend ?? []).map((p) => ({
    time: p.date,
    value: p.count,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>

      {/* system_admin 全局统计卡片 */}
      {isSystemAdmin && globalStats && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-primary">{t('admin.globalStats.title')}</h3>
            <div className="grid gap-4 md:grid-cols-6">
              <GlobalStatItem icon={<Building2 className="h-4 w-4" />} label={t('admin.globalStats.totalTenants')} value={String(globalStats.totalTenants)} />
              <GlobalStatItem icon={<Building2 className="h-4 w-4 text-green-500" />} label={t('admin.globalStats.activeTenants')} value={String(globalStats.activeTenants)} />
              <GlobalStatItem icon={<Building2 className="h-4 w-4 text-blue-500" />} label={t('admin.globalStats.trialTenants')} value={String(globalStats.trialTenants)} />
              <GlobalStatItem icon={<Snowflake className="h-4 w-4 text-red-500" />} label={t('admin.globalStats.frozenTenants')} value={String(globalStats.frozenTenants)} />
              <GlobalStatItem icon={<Wrench className="h-4 w-4" />} label={t('admin.globalStats.totalDevices')} value={String(globalStats.totalDevices)} />
              <GlobalStatItem icon={<Users className="h-4 w-4" />} label={t('admin.globalStats.totalUsers')} value={String(globalStats.totalUsers)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计加载失败必须显式提示，不能把网络错误画成空看板 */}
      {statsFailed && (
        <LoadFailedBanner onRetry={() => { void refetchStats(); }} />
      )}

      {/* 新客户引导：仅在统计成功且设备/告警/工单全为 0 时显示 */}
      {stats && !statsFailed && !statsLoading && stats.totalDevices === 0
        && stats.activeAlerts === 0 && stats.pendingWorkOrders === 0 && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-lg bg-primary/15 p-2">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {t('dashboard.welcome.title', '欢迎使用 EquipSense')}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('dashboard.welcome.subtitle', '完成以下三步，开启工业设备智能监控之旅')}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <button
                onClick={() => navigate('/devices')}
                className="flex flex-col items-start gap-1 rounded-lg border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="text-xs font-medium text-primary">1</span>
                <span className="text-sm font-medium">
                  {t('dashboard.welcome.step1.title', '添加设备')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('dashboard.welcome.step1.desc', '注册 PLC、CNC、空压机等工业设备')}
                </span>
              </button>
              <button
                onClick={() => navigate('/alert-rules')}
                className="flex flex-col items-start gap-1 rounded-lg border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="text-xs font-medium text-primary">2</span>
                <span className="text-sm font-medium">
                  {t('dashboard.welcome.step2.title', '配置告警规则')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('dashboard.welcome.step2.desc', '设置阈值、组合、基线三级告警')}
                </span>
              </button>
              <button
                onClick={() => navigate('/device-setup')}
                className="flex flex-col items-start gap-1 rounded-lg border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="text-xs font-medium text-primary">3</span>
                <span className="text-sm font-medium">
                  {t('dashboard.welcome.step3.title', '接入遥测数据')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t('dashboard.welcome.step3.desc', '通过 MQTT 或边缘网关接入实时数据')}
                </span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片（可点击跳转） */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, link }) => (
          <Card
            key={label}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => navigate(link)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-3 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{statsLoading && !stats ? t('common.loading') : value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* OEE 设备综合效率看板 */}
      {oeeError && !oee && (
        <LoadFailedBanner onRetry={() => { void refetchOee(); }} />
      )}
      {oee && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{t('dashboard.oee.title', '设备综合效率 (OEE)')}</h3>
                {oee.isApproximate && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50" title={
                    oee.approximationNotes
                      ? Object.entries(oee.approximationNotes).map(([k, v]) => `${k}: ${v}`).join('\n')
                      : t('dashboard.oee.approximateHint', '基于实时状态的近似估算')
                  }>
                    {t('dashboard.oee.approximate', '近似估算')}
                  </Badge>
                )}
                {oee.hasInsufficientData && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                    {t('dashboard.oee.insufficientData', '数据不足')}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.oee.formula', 'OEE = 可用率 × 性能 × 质量')}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {/* 综合 OEE */}
              <div className="flex flex-col items-center justify-center rounded-lg border bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground mb-1">{t('dashboard.oee.overall', '综合 OEE')}</p>
                <p className={`text-3xl font-bold ${oee.oee >= 85 ? 'text-green-600' : oee.oee >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {oee.oee}%
                </p>
              </div>
              {/* 可用率 */}
              <OeeDimension
                label={t('dashboard.oee.availability', '可用率')}
                value={oee.availability}
                hint={t('dashboard.oee.availabilityHint', '{{online}}/{{total}} 在线', { online: oee.onlineDevices, total: oee.totalDevices })}
              />
              {/* 性能 */}
              <OeeDimension
                label={t('dashboard.oee.performance', '性能')}
                value={oee.performance}
                hint={t('dashboard.oee.performanceHint', '产能达标率')}
              />
              {/* 质量 */}
              <OeeDimension
                label={t('dashboard.oee.quality', '质量')}
                value={oee.quality}
                hint={t('dashboard.oee.qualityHint', '无严重故障占比')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 趋势预警：复用已有分析查询，帮助用户在告警发生前安排维护 */}
      <TrendWarningsCard />

      {/* 统计失败时不渲染空图，避免把加载失败当成“暂无数据” */}
      {!statsFailed && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <PieChart title={t('dashboard.deviceStatusDistribution')} data={devicePieData} height={280} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <PieChart title={t('dashboard.alertSeverityDistribution')} data={severityPieData} height={280} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <TrendChart title={t('dashboard.alertTrends')} data={alertTrendData} color="#ef4444" height={280} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <TrendChart title={t('dashboard.workOrderTrend')} data={workOrderTrendData} color="#3b82f6" height={280} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 工单状态分布 + 最近告警 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 工单状态分布 */}
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-base font-semibold">{t('dashboard.workOrderStatusDistribution')}</h3>
            {statsLoading && !stats ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : statsFailed ? (
              <LoadFailedBanner compact onRetry={() => { void refetchStats(); }} />
            ) : stats && Object.keys(stats.workOrdersByStatus).length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(stats.workOrdersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-md border p-2.5">
                    <Badge className={workOrderStatusVariant[status] ?? 'bg-gray-500/10 text-gray-600'}>
                      {workOrderStatusLabels[status] ?? status}
                    </Badge>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>

        {/* 最近告警列表 */}
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-base font-semibold">{t('dashboard.recentAlerts')}</h3>
            <div className="space-y-2">
              {alertsLoading && !alertsData ? (
                <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
              ) : alertsFailed ? (
                <LoadFailedBanner compact onRetry={() => { void refetchAlerts(); }} />
              ) : alertsEmpty ? (
                <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
              ) : (
                alertsData?.items.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div className="flex items-center gap-3">
                      <SeverityBadge severity={alert.severity} />
                      <div>
                        <p className="text-sm font-medium">{alert.deviceId.slice(0, 8)}… — {alert.metric}</p>
                        <p className="text-xs text-muted-foreground">{new Date(alert.occurredAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{alert.value}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** 查询失败横幅：与列表页一致，失败必须可重试，不能伪装成空数据。 */
function LoadFailedBanner({ onRetry, compact = false }: { onRetry: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col items-center gap-2 text-center ${compact ? 'py-6' : 'py-4'}`}>
      <AlertTriangle className="h-6 w-6 text-amber-500" />
      <p className="text-sm text-muted-foreground">{t('common.loadFailed')}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        {t('common.retry')}
      </Button>
    </div>
  );
}

/** 全局统计项组件 — 用于 system_admin 仪表盘顶部的统计数据展示 */
function GlobalStatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** OEE 单维度展示（数值 + 进度条），复用项目内联进度条风格 */
function OeeDimension({ label, value, hint }: { label: string; value: number; hint: string }) {
  const color = value >= 85 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold mb-2">{value}%</p>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-1">
        <div className={`h-full transition-all ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
