/**
 * 边缘网关监控面板
 *
 * 展示网关实时运行状态、采集指标概览和设备配置列表。
 */
import { useNavigate } from 'react-router-dom';
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

/** 状态中文标签 */
const statusLabels: Record<string, string> = {
  healthy: '运行中',
  unreachable: '不可达',
  offline: '离线',
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
function formatUptime(seconds?: number): string {
  if (!seconds) return '--';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}天 ${h}时 ${m}分`;
  if (h > 0) return `${h}时 ${m}分`;
  return `${m}分`;
}

export default function GatewayMonitorPage() {
  const navigate = useNavigate();
  const { data: status, isLoading: statusLoading, refetch } = useGatewayStatus();
  const { data: devices, isLoading: devicesLoading } = useGatewayDevices();

  const isLoading = statusLoading || devicesLoading;
  const isHealthy = status?.status === 'healthy';
  const metrics = status?.metrics;

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">网关监控</h1>
          <p className="text-sm text-muted-foreground">
            实时监控边缘网关运行状态和采集指标
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1 h-4 w-4" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/gateway')}>
            <Network className="mr-1 h-4 w-4" />
            设备管理
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
                      <p className="text-xs text-muted-foreground">网关状态</p>
                      <Badge variant="outline" className={statusStyles[status?.status ?? 'offline']}>
                        {statusLabels[status?.status ?? 'offline']}
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
              label="运行时长"
              value={formatUptime(status?.uptimeSeconds)}
              sub={status?.startedAt ? `启动于 ${new Date(status.startedAt).toLocaleString()}` : undefined}
              color="bg-blue-500/10"
            />

            {/* 采集次数 */}
            <MetricCard
              icon={<Activity className="h-5 w-5 text-purple-500" />}
              label="采集次数"
              value={metrics?.collections?.toLocaleString() ?? '--'}
              sub={metrics ? `错误 ${metrics.errors}` : undefined}
              color="bg-purple-500/10"
            />

            {/* 缓冲队列 */}
            <MetricCard
              icon={<Database className="h-5 w-5 text-orange-500" />}
              label="缓冲队列"
              value={metrics?.bufferQueueDepth?.toLocaleString() ?? '--'}
              sub={metrics ? `重传 ${metrics.replays}` : undefined}
              color="bg-orange-500/10"
            />
          </div>

          {/* 连接信息 */}
          {isHealthy && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">连接信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">后端 API</p>
                    <div className="flex items-center gap-1">
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-sm font-mono">{status?.backendUrl ?? '--'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">MQTT Broker</p>
                    <div className="flex items-center gap-1">
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-sm font-mono">{status?.mqttBroker ?? '--'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">安全模式</p>
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
                <CardTitle className="text-base">上传统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    icon={<ArrowUpCircle className="h-5 w-5 text-green-500" />}
                    label="上传成功"
                    value={metrics.uploads.toLocaleString()}
                    color="bg-green-500/10"
                  />
                  <MetricCard
                    icon={<ArrowDownCircle className="h-5 w-5 text-red-500" />}
                    label="上传失败"
                    value={metrics.uploadFailures.toLocaleString()}
                    color="bg-red-500/10"
                  />
                  <MetricCard
                    icon={<RefreshCw className="h-5 w-5 text-yellow-500" />}
                    label="断网重传"
                    value={metrics.replays.toLocaleString()}
                    color="bg-yellow-500/10"
                  />
                  <MetricCard
                    icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
                    label="错误率"
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
                  <p className="font-medium">网关{status?.status === 'unreachable' ? '不可达' : '离线'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {status?.message ?? '请确认边缘网关已启动并可访问'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 设备配置列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">已配置设备</CardTitle>
              <CardDescription>网关下共 {devices?.length ?? 0} 个采集设备</CardDescription>
            </CardHeader>
            <CardContent>
              {!devices?.length ? (
                <p className="text-center py-4 text-sm text-muted-foreground">暂无设备配置</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>设备名称</TableHead>
                      <TableHead>协议</TableHead>
                      <TableHead>采集间隔</TableHead>
                      <TableHead>状态</TableHead>
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
                            {d.enabled ? '启用' : '停用'}
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
