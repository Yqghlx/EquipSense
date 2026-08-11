/**
 * 边缘网关监控面板
 *
 * 展示网关实时运行状态、采集指标概览和设备配置列表。
 */
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Database,
  Loader2,
  Network,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useGatewayDevices } from '../hooks/useGatewayDevices';
import { useGatewayStatus } from '../hooks/useGatewayStatus';

/** 状态徽章颜色 */
const statusStyles: Record<string, string> = {
  healthy: 'bg-green-500/10 text-green-600 border-green-500/30',
  unreachable: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  offline: 'bg-red-500/10 text-red-600 border-red-500/30',
};

/** 状态翻译键 */
const statusLabelKeys: Record<string, string> = {
  healthy: 'gatewayMonitor.statusHealthy',
  unreachable: 'gatewayMonitor.statusUnreachable',
  offline: 'gatewayMonitor.statusOffline',
};

/** 指标卡片 */
function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2 ${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/** 格式化运行时间 */
function formatUptime(
  seconds: number | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!seconds) return t('gatewayMonitor.uptimeUnknown');
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return t('gatewayMonitor.uptimeDays', { days: d, hours: h, minutes: m });
  if (h > 0) return t('gatewayMonitor.uptimeHours', { hours: h, minutes: m });
  return t('gatewayMonitor.uptimeMinutes', { minutes: m });
}

export default function GatewayMonitorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { gatewayId } = useParams<{ gatewayId: string }>();
  const { data: status, isLoading: statusLoading, refetch } = useGatewayStatus(gatewayId);
  const { data: devices, isLoading: devicesLoading } = useGatewayDevices();

  const isLoading = statusLoading || devicesLoading;
  const isHealthy = status?.status === 'healthy';
  const metrics = status?.metrics;

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/gateways')}>
              ←
            </Button>
            <h1 className="text-2xl font-bold">{t('gatewayMonitor.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {gatewayId
              ? t('gatewayMonitor.gatewayLabel', { id: gatewayId })
              : t('gatewayMonitor.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1 h-4 w-4" />
            {t('gatewayMonitor.refresh')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/devices')}>
            <Network className="mr-1 h-4 w-4" />
            {t('gatewayMonitor.deviceManagement')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* 状态概览 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 网关状态 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isHealthy ? (
                      <Server className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">{t('gatewayMonitor.status')}</p>
                      <Badge variant="outline" className={statusStyles[status?.status ?? 'offline']}>
                        {t(statusLabelKeys[status?.status ?? 'offline'] ?? 'gatewayMonitor.statusOffline')}
                      </Badge>
                    </div>
                  </div>
                </div>
                {status?.gatewayId && (
                  <p className="mt-2 text-xs text-muted-foreground">ID: {status.gatewayId}</p>
                )}
              </CardContent>
            </Card>

            {/* 运行时长 */}
            <MetricCard
              icon={<Clock className="h-5 w-5 text-blue-500" />}
              label={t('gatewayMonitor.uptime')}
              value={formatUptime(status?.uptimeSeconds, t)}
              sub={status?.startedAt
                ? t('gatewayMonitor.startedAt', { time: new Date(status.startedAt).toLocaleString() })
                : undefined}
              color="bg-blue-500/10"
            />

            {/* 采集次数 */}
            <MetricCard
              icon={<Activity className="h-5 w-5 text-purple-500" />}
              label={t('gatewayMonitor.collectCount')}
              value={metrics?.collections?.toLocaleString() ?? '--'}
              sub={metrics ? t('gatewayMonitor.errors', { count: metrics.errors }) : undefined}
              color="bg-purple-500/10"
            />

            {/* 缓冲队列 */}
            <MetricCard
              icon={<Database className="h-5 w-5 text-orange-500" />}
              label={t('gatewayMonitor.bufferQueue')}
              value={metrics?.bufferQueueDepth?.toLocaleString() ?? '--'}
              sub={metrics ? t('gatewayMonitor.replays', { count: metrics.replays }) : undefined}
              color="bg-orange-500/10"
            />
          </div>

          {/* 连接信息 */}
          {isHealthy && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('gatewayMonitor.connectionInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t('gatewayMonitor.backendApi')}</p>
                    <div className="flex items-center gap-1">
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-sm font-mono">{status?.backendUrl ?? '--'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t('gatewayMonitor.mqttBroker')}</p>
                    <div className="flex items-center gap-1">
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-sm font-mono">{status?.mqttBroker ?? '--'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t('gatewayMonitor.securityMode')}</p>
                    <Badge variant="outline">{status?.securityMode ?? 'None'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 上传统计 */}
          {metrics && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('gatewayMonitor.uploadStats')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    icon={<ArrowUpCircle className="h-5 w-5 text-green-500" />}
                    label={t('gatewayMonitor.uploadSuccess')}
                    value={metrics.uploads.toLocaleString()}
                    color="bg-green-500/10"
                  />
                  <MetricCard
                    icon={<ArrowDownCircle className="h-5 w-5 text-red-500" />}
                    label={t('gatewayMonitor.uploadFailed')}
                    value={metrics.uploadFailures.toLocaleString()}
                    color="bg-red-500/10"
                  />
                  <MetricCard
                    icon={<RefreshCw className="h-5 w-5 text-yellow-500" />}
                    label={t('gatewayMonitor.offlineRetry')}
                    value={metrics.replays.toLocaleString()}
                    color="bg-yellow-500/10"
                  />
                  <MetricCard
                    icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
                    label={t('gatewayMonitor.errorRate')}
                    value={
                      metrics.collections > 0
                        ? ((metrics.errors / metrics.collections) * 100).toFixed(2) + '%'
                        : '0%'
                    }
                    color="bg-orange-500/10"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 离线提示 */}
          {!isHealthy && (
            <Card className="border-yellow-500/30">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <WifiOff className="h-12 w-12 text-yellow-500/60" />
                <div className="text-center">
                  <p className="font-medium">
                    {t(statusLabelKeys[status?.status ?? 'offline'] ?? 'gatewayMonitor.statusOffline')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {status?.message ?? t('gatewayMonitor.offlineMessage')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 设备配置列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('gatewayMonitor.configuredDevices')}</CardTitle>
              <CardDescription>{t('gatewayMonitor.deviceCount', { count: devices?.length ?? 0 })}</CardDescription>
            </CardHeader>
            <CardContent>
              {!devices?.length ? (
                <p className="text-center py-4 text-sm text-muted-foreground">{t('gatewayMonitor.noDevices')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('gatewayMonitor.deviceName')}</TableHead>
                      <TableHead>{t('gatewayMonitor.protocol')}</TableHead>
                      <TableHead>{t('gatewayMonitor.pollInterval')}</TableHead>
                      <TableHead>{t('gatewayMonitor.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.deviceName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{d.protocol.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{d.pollIntervalMs}ms</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={d.enabled ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-500'}>
                            {d.enabled ? t('gatewayMonitor.enabled') : t('gatewayMonitor.disabled')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
