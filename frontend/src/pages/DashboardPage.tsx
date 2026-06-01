import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../components/ui/card';
import { TrendChart } from '../components/charts/TrendChart';
import { PieChart } from '../components/charts/PieChart';
import { SeverityBadge } from '../components/alert/SeverityBadge';
import { useDevices } from '../hooks/useDevices';
import { useAlerts } from '../hooks/useAlerts';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { Wrench, AlertTriangle, ClipboardList, Activity } from 'lucide-react';

/**
 * 仪表盘页
 *
 * 展示系统概览：在线设备数、活跃告警数、待处理工单数、设备可用率。
 * 包含设备状态分布饼图、告警趋势折线图和最近告警列表。
 */
export default function DashboardPage() {
  const { t } = useTranslation();

  const { data: devicesData } = useDevices({ page: 1, pageSize: 1 });
  const { data: onlineDevices } = useDevices({ page: 1, pageSize: 1, status: 'online' });
  const { data: alertsData } = useAlerts({ page: 1, pageSize: 10 }, { status: 'triggered' });
  const { data: workOrdersData } = useWorkOrders({ page: 1, pageSize: 1 }, { status: 'pending' });

  const totalDevices = devicesData?.total ?? 0;
  const onlineCount = onlineDevices?.total ?? 0;
  const availability = totalDevices > 0 ? ((onlineCount / totalDevices) * 100).toFixed(1) : '0';

  /** 统计卡片数据 */
  const stats = [
    { label: t('device.online'), value: onlineCount, icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('alert.active'), value: alertsData?.total ?? 0, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: '待处理工单', value: workOrdersData?.total ?? 0, icon: ClipboardList, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: '设备可用率', value: `${availability}%`, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  /** 设备状态分布饼图数据 */
  const devicePieData = [
    { name: t('device.online'), value: onlineCount, color: '#3b82f6' },
    { name: t('device.offline'), value: Math.max(0, totalDevices - onlineCount), color: '#6b7280' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-3 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 图表区域：饼图 + 趋势图 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <PieChart title="设备状态分布" data={devicePieData} height={280} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendChart title="告警趋势（最近 7 天）" data={[]} height={280} />
          </CardContent>
        </Card>
      </div>

      {/* 最近告警列表 */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 text-base font-semibold">最近告警</h3>
          <div className="space-y-2">
            {alertsData?.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            ) : (
              alertsData?.items.slice(0, 10).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="flex items-center gap-3">
                    <SeverityBadge severity={alert.severity} />
                    <div>
                      <p className="text-sm font-medium">{alert.deviceName} — {alert.metric}</p>
                      <p className="text-xs text-muted-foreground">{new Date(alert.triggeredAt).toLocaleString()}</p>
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
  );
}
