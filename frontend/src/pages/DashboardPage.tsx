import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { TrendChart } from '../components/charts/TrendChart';
import { PieChart } from '../components/charts/PieChart';
import { SeverityBadge } from '../components/alert/SeverityBadge';
import { useDashboardStats } from '../hooks/useDashboard';
import { useAlerts } from '../hooks/useAlerts';
import { useGlobalStats } from '../hooks/useTenantsAdmin';
import { useAuthStore } from '../stores/authStore';
import {
  Wrench, AlertTriangle, ClipboardList, Activity,
  Building2, Users, Snowflake,
} from 'lucide-react';
/** 告警严重级别对应的颜色映射 */
const severityColors: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Normal: '#eab308',
  Low: '#6b7280',
};

/** 工单状态对应的中文标签 */
const workOrderStatusLabels: Record<string, string> = {
  PendingDispatch: '待派工',
  Assigned: '已派工',
  InProgress: '执行中',
  Completed: '已完成',
  SubmittedForApproval: '待审批',
  Accepted: '已验收',
  Rejected: '已驳回',
  Closed: '已关闭',
  Cancelled: '已取消',
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

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: alertsData } = useAlerts({ page: 1, pageSize: 10 }, { status: 'active' });
  const { data: globalStats } = useGlobalStats();

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
                <p className="text-2xl font-bold">{statsLoading ? '...' : value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 图表区域：设备状态 + 告警级别分布 */}
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

      {/* 趋势图：告警 + 工单 */}
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

      {/* 工单状态分布 + 最近告警 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 工单状态分布 */}
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-base font-semibold">{t('dashboard.workOrderStatusDistribution')}</h3>
            {stats && Object.keys(stats.workOrdersByStatus).length > 0 ? (
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
              {alertsData?.items.length === 0 ? (
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
