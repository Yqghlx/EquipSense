import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DeviceStatusBadge } from '../components/device/DeviceStatusBadge';
import { TrendChart } from '../components/charts/TrendChart';
import { SeverityBadge } from '../components/alert/SeverityBadge';
import { useDevice } from '../hooks/useDevices';
import { useTelemetry, type TelemetryDataPoint } from '../hooks/useTelemetry';
import { useAlerts } from '../hooks/useAlerts';

/**
 * 设备详情页
 *
 * 展示设备基本信息、遥测数据趋势图和最近告警列表。
 * 支持切换指标和时间范围来查看不同的遥测趋势。
 */

/** 根据时间范围标识计算起始时间的 ISO 字符串 */
function getTimeRangeStart(range: string): string {
  const now = new Date();
  switch (range) {
    case '1h': return new Date(now.getTime() - 3600000).toISOString();
    case '6h': return new Date(now.getTime() - 21600000).toISOString();
    case '24h': return new Date(now.getTime() - 86400000).toISOString();
    case '7d': return new Date(now.getTime() - 604800000).toISOString();
    default: return new Date(now.getTime() - 3600000).toISOString();
  }
}

export default function DeviceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeRange, setTimeRange] = useState('1h');

  const { data: device, isLoading } = useDevice(id ?? '');
  const { data: telemetry } = useTelemetry(
    id ?? '',
    selectedMetric,
    getTimeRangeStart(timeRange),
    new Date().toISOString(),
  );
  const { data: alertsData } = useAlerts({ page: 1, pageSize: 20 }, { deviceId: id });

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>;
  if (!device) return <div className="py-20 text-center text-muted-foreground">{t('common.noData')}</div>;

  /** 将遥测数据转换为图表可用的格式（注意：实际 hook 返回 time 字段而非 timestamp） */
  const chartData = Array.isArray(telemetry)
    ? (telemetry as TelemetryDataPoint[]).map((p) => ({ time: p.time, value: p.value }))
    : [];

  return (
    <div className="space-y-6">
      {/* 页头：返回按钮 + 设备名称 + 状态 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/devices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{device.name}</h1>
          <p className="text-sm text-muted-foreground">{device.deviceCode}</p>
        </div>
        <div className="ml-auto"><DeviceStatusBadge status={device.status} /></div>
      </div>

      {/* 设备基本信息卡片 */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
          <div><p className="text-sm text-muted-foreground">{t('device.type')}</p><p className="font-medium">{device.type}</p></div>
          <div><p className="text-sm text-muted-foreground">型号</p><p className="font-medium">{device.model ?? '-'}</p></div>
          <div><p className="text-sm text-muted-foreground">{t('common.status')}</p><DeviceStatusBadge status={device.status} /></div>
          <div><p className="text-sm text-muted-foreground">健康评分</p><p className="font-medium">{device.healthScore}</p></div>
        </CardContent>
      </Card>

      {/* 遥测数据趋势图（支持指标和时间范围切换） */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">遥测趋势</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedMetric} onValueChange={(v) => { if (v) setSelectedMetric(v); }}>
              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="temperature">温度</SelectItem>
                <SelectItem value="pressure">压力</SelectItem>
                <SelectItem value="vibration">振动</SelectItem>
                <SelectItem value="humidity">湿度</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={(v) => { if (v) setTimeRange(v); }}>
              <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 小时</SelectItem>
                <SelectItem value="6h">6 小时</SelectItem>
                <SelectItem value="24h">24 小时</SelectItem>
                <SelectItem value="7d">7 天</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <TrendChart data={chartData} height={300} />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">{t('common.noData')}</div>
          )}
        </CardContent>
      </Card>

      {/* 最近告警列表 */}
      <Card>
        <CardHeader><CardTitle className="text-base">最近告警</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('alert.alertCode')}</TableHead>
                <TableHead>{t('alert.metric')}</TableHead>
                <TableHead>{t('alert.value')}</TableHead>
                <TableHead>{t('alert.severity')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertsData?.items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
              ) : (
                alertsData?.items.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-mono text-sm">{alert.alertCode}</TableCell>
                    <TableCell>{alert.metric}</TableCell>
                    <TableCell>{alert.value}</TableCell>
                    <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                    <TableCell><Badge variant="outline">{alert.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(alert.occurredAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
