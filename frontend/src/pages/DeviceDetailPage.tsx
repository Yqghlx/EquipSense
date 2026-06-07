import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plug, Network, Radio, Loader2, RefreshCw, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { DeviceStatusBadge } from '../components/device/DeviceStatusBadge';
import { TrendChart } from '../components/charts/TrendChart';
import { SeverityBadge } from '../components/alert/SeverityBadge';
import { DataQualityOverviewCard } from '../components/dataquality/DataQualityOverview';
import { useDevice, useUpdateDevice } from '../hooks/useDevices';
import { useTelemetry, type TelemetryDataPoint } from '../hooks/useTelemetry';
import { useAlerts } from '../hooks/useAlerts';
import {
  useGatewayDevices,
  useUpdateGatewayDevice,
  useDeleteGatewayDevice,
  useTestConnection,
  useCreateGatewayDevice,
} from '../hooks/useGatewayDevices';
import { formatDate } from '../lib/utils';
import type { Device } from '../types';

/** 协议显示映射 */
const protocolMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  opcua: { label: 'OPC UA', icon: <Plug className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
  'modbus-tcp': { label: 'Modbus TCP', icon: <Network className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
  'modbus-rtu': { label: 'Modbus RTU', icon: <Radio className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-600' },
};

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

      {/* Tab 布局：概览 + 连接配置 */}
      <Tabs defaultValue="overview" className="flex gap-6 items-start">
        <TabsList className="flex flex-col w-44 shrink-0 bg-muted/50 p-1 gap-0.5">
          <TabsTrigger value="overview" className="w-full justify-start px-3">{t('device.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="connection" className="w-full justify-start px-3">{t('device.tabs.connection')}</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0 space-y-4">
          {/* 概览 Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* 设备基本信息卡片（支持行内编辑） */}
              <DeviceInfoCard device={device} />

              {/* 遥测数据趋势图 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{t('device.telemetryTrends')}</CardTitle>
                  <div className="flex gap-2">
                    <Select value={selectedMetric} onValueChange={(v) => { if (v) setSelectedMetric(v); }}>
                      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temperature">{t('telemetry.temperature')}</SelectItem>
                        <SelectItem value="pressure">{t('telemetry.pressure')}</SelectItem>
                        <SelectItem value="vibration">{t('telemetry.vibration')}</SelectItem>
                        <SelectItem value="humidity">{t('telemetry.humidity')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={timeRange} onValueChange={(v) => { if (v) setTimeRange(v); }}>
                      <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">{t('time.1hour')}</SelectItem>
                        <SelectItem value="6h">{t('time.6hours')}</SelectItem>
                        <SelectItem value="24h">{t('time.24hours')}</SelectItem>
                        <SelectItem value="7d">{t('time.7days')}</SelectItem>
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

              {/* 数据质量 + 最近告警（双列布局） */}
              <div className="grid gap-6 lg:grid-cols-2">
                <DataQualityOverviewCard deviceId={device.id} />
                <Card>
                  <CardHeader><CardTitle className="text-base">{t('device.recentAlerts')}</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('alert.alertCode')}</TableHead>
                          <TableHead>{t('alert.metric')}</TableHead>
                          <TableHead>{t('alert.value')}</TableHead>
                          <TableHead>{t('alert.severity')}</TableHead>
                          <TableHead>{t('common.status')}</TableHead>
                          <TableHead>{t('common.time')}</TableHead>
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
            </div>
          </TabsContent>

          {/* 连接配置 Tab */}
          <TabsContent value="connection">
            <ConnectionConfigPanel deviceId={device.id} deviceName={device.name} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ============================================================================
// 连接配置子组件
// ============================================================================

/** 连接配置面板属性 */
interface ConnectionConfigPanelProps {
  deviceId: string;
  deviceName: string;
}

/**
 * 连接配置面板
 *
 * 展示当前设备关联的网关采集配置，支持编辑、测试连接和启停操作。
 * 如果设备尚未关联网关设备配置，显示提示信息。
 */
function ConnectionConfigPanel({ deviceId, deviceName }: ConnectionConfigPanelProps) {
  const { t } = useTranslation();
  const { data: gatewayDevices, isLoading } = useGatewayDevices();
  const updateMutation = useUpdateGatewayDevice();
  const deleteMutation = useDeleteGatewayDevice();
  const testConnMutation = useTestConnection();
  const createMutation = useCreateGatewayDevice();

  /** 查找当前设备关联的网关设备配置 */
  const gwDevice = gatewayDevices?.find((d) => d.deviceId === deviceId);

  const [editTarget, setEditTarget] = useState<{
    id: string;
    deviceName: string;
    connectionConfig: string;
    dataPoints: string;
    pollIntervalMs: number;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  /** 切换启停 */
  const toggleEnabled = (id: string, current: boolean) => {
    updateMutation.mutate({ id, enabled: !current });
  };

  /** 测试连接 */
  const runTestConnection = (protocol: string, connectionConfig: string) => {
    setTestResult(null);
    testConnMutation.mutate(
      { protocol, connectionConfig },
      {
        onSuccess: (result) => setTestResult(result),
        onError: () => setTestResult({ success: false, message: t('device.connection.testFailed') }),
      },
    );
  };

  /** 保存编辑 */
  const saveEdit = () => {
    if (!editTarget) return;
    updateMutation.mutate(
      {
        id: editTarget.id,
        deviceName: editTarget.deviceName,
        connectionConfig: editTarget.connectionConfig,
        dataPoints: editTarget.dataPoints,
        pollIntervalMs: editTarget.pollIntervalMs,
      },
      { onSettled: () => setEditTarget(null) },
    );
  };

  /** 确认删除 */
  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /** 未关联网关设备配置时，显示创建表单 */
  if (!gwDevice) {
    return <CreateConnectionPanel deviceId={deviceId} deviceName={deviceName} createMutation={createMutation} testConnMutation={testConnMutation} />;
  }

  const proto = protocolMeta[gwDevice.protocol] ?? {
    label: gwDevice.protocol,
    icon: <Plug className="h-4 w-4" />,
    color: 'bg-gray-500/10 text-gray-600',
  };

  const dpCount = (() => {
    try {
      const parsed = JSON.parse(gwDevice.dataPoints);
      return typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
    } catch { return 0; }
  })();

  return (
    <div className="space-y-4">
      {/* 连接配置信息卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t('device.connection.title')}</CardTitle>
              <CardDescription className="mt-1">{t('device.connection.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => runTestConnection(gwDevice.protocol, gwDevice.connectionConfig)}
                disabled={testConnMutation.isPending}
              >
                {testConnMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
                {t('device.connection.testConnection')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditTarget({
                id: gwDevice.id,
                deviceName: gwDevice.deviceName,
                connectionConfig: gwDevice.connectionConfig,
                dataPoints: gwDevice.dataPoints,
                pollIntervalMs: gwDevice.pollIntervalMs,
              })}>
                <Pencil className="mr-1 h-4 w-4" />
                {t('common.edit')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('device.connection.deviceName')}</p>
              <p className="font-medium">{gwDevice.deviceName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('device.connection.protocol')}</p>
              <Badge variant="outline" className={proto.color}>
                {proto.icon}
                <span className="ml-1">{proto.label}</span>
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('device.connection.pollInterval')}</p>
              <p className="font-medium">{gwDevice.pollIntervalMs}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('device.connection.dataPoints')}</p>
              <p className="font-medium">{dpCount}</p>
            </div>
          </div>

          {/* 启停状态 */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <Switch
              checked={gwDevice.enabled}
              onCheckedChange={() => toggleEnabled(gwDevice.id, gwDevice.enabled)}
            />
            <span className="text-sm text-muted-foreground">
              {gwDevice.enabled ? t('device.connection.enabled') : t('device.connection.disabled')}
            </span>
            <span className="text-xs text-muted-foreground">
              ({t('device.connection.gatewayId')}: {gwDevice.gatewayId})
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(gwDevice.id)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {t('common.delete')}
            </Button>
          </div>

          {/* 连接配置详情 */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('device.connection.connectionConfig')}</p>
              <pre className="rounded bg-muted p-3 text-xs font-mono overflow-auto max-h-48">
                {(() => { try { return JSON.stringify(JSON.parse(gwDevice.connectionConfig), null, 2); } catch { return gwDevice.connectionConfig; } })()}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('device.connection.dataPointMapping')}</p>
              <pre className="rounded bg-muted p-3 text-xs font-mono overflow-auto max-h-48">
                {(() => { try { return JSON.stringify(JSON.parse(gwDevice.dataPoints), null, 2); } catch { return gwDevice.dataPoints; } })()}
              </pre>
            </div>
          </div>

          {/* 创建时间 */}
          <p className="text-xs text-muted-foreground">{t('device.connection.createdAt')}: {formatDate(gwDevice.createdAt)}</p>
        </CardContent>
      </Card>

      {/* 连接测试结果 */}
      {testResult && (
        <Card className={testResult.success ? 'border-green-500/30' : 'border-red-500/30'}>
          <CardContent className="flex items-center gap-2 py-3">
            <Badge variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? t('device.connection.testSuccess') : t('device.connection.testFailed')}
            </Badge>
            <span className="text-sm">{testResult.message}</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setTestResult(null)}>
              {t('common.close')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('device.connection.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('device.connection.deleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('device.connection.editTitle')}</DialogTitle>
            <DialogDescription>{t('device.connection.editDescription')}</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('device.connection.deviceName')}</Label>
                <Input
                  value={editTarget.deviceName}
                  onChange={(e) => setEditTarget({ ...editTarget, deviceName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('device.connection.pollInterval')}</Label>
                <Input
                  type="number"
                  value={editTarget.pollIntervalMs}
                  onChange={(e) => setEditTarget({ ...editTarget, pollIntervalMs: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('device.connection.connectionConfig')}</Label>
                <Textarea
                  className="font-mono text-xs"
                  rows={4}
                  value={editTarget.connectionConfig}
                  onChange={(e) => setEditTarget({ ...editTarget, connectionConfig: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('device.connection.dataPointMapping')}</Label>
                <Textarea
                  className="font-mono text-xs"
                  rows={4}
                  value={editTarget.dataPoints}
                  onChange={(e) => setEditTarget({ ...editTarget, dataPoints: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>{t('common.cancel')}</Button>
            <Button onClick={saveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// 创建连接配置面板（设备未关联网关设备时显示）
// ============================================================================

/** 创建面板属性 */
interface CreateConnectionPanelProps {
  deviceId: string;
  deviceName: string;
  createMutation: ReturnType<typeof useCreateGatewayDevice>;
  testConnMutation: ReturnType<typeof useTestConnection>;
}

/** 默认连接配置模板 */
const defaultConfigs: Record<string, string> = {
  opcua: JSON.stringify({ endpoint: 'opc.tcp://localhost:4840', securityMode: 'None' }, null, 2),
  'modbus-tcp': JSON.stringify({ host: '192.168.1.100', port: 502, unitId: 1 }, null, 2),
  'modbus-rtu': JSON.stringify({ port: '/dev/ttyUSB0', baudRate: 9600, parity: 'none', unitId: 1 }, null, 2),
};

/** 默认数据点模板 */
const defaultDataPoints = JSON.stringify({ temperature: '400001', pressure: '400002' }, null, 2);

/**
 * 创建连接配置面板
 *
 * 当设备尚未关联网关采集配置时显示，提供完整的创建表单。
 * 创建时自动将 deviceId 关联到当前设备。
 */
function CreateConnectionPanel({ deviceId, deviceName, createMutation, testConnMutation }: CreateConnectionPanelProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    protocol: 'opcua',
    connectionConfig: defaultConfigs.opcua,
    dataPoints: defaultDataPoints,
    pollIntervalMs: 3000,
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  /** 切换协议时更新连接配置模板 */
  const handleProtocolChange = (protocol: string) => {
    setForm({
      ...form,
      protocol,
      connectionConfig: defaultConfigs[protocol] ?? '{}',
    });
  };

  /** 提交创建，自动使用当前设备名称 */
  const handleCreate = () => {
    createMutation.mutate({
      deviceName,
      protocol: form.protocol,
      connectionConfig: form.connectionConfig,
      dataPoints: form.dataPoints,
      pollIntervalMs: form.pollIntervalMs,
      deviceId,
    });
  };

  /** 测试连接 */
  const runTest = () => {
    setTestResult(null);
    testConnMutation.mutate(
      { protocol: form.protocol, connectionConfig: form.connectionConfig },
      {
        onSuccess: (result) => setTestResult(result),
        onError: () => setTestResult({ success: false, message: t('device.connection.testFailed') }),
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('device.connection.createTitle')}</CardTitle>
          <CardDescription>{t('device.connection.createDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 协议选择 */}
          <div className="space-y-2">
            <Label>{t('device.connection.protocol')}</Label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(protocolMeta).map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleProtocolChange(key)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                    form.protocol === key
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {meta.icon}
                  <span>{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 采集间隔 */}
          <div className="space-y-2">
            <Label>{t('device.connection.pollInterval')}</Label>
            <Input
              type="number"
              min={100}
              value={form.pollIntervalMs}
              onChange={(e) => setForm({ ...form, pollIntervalMs: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">{t('device.connection.pollIntervalHint')}</p>
          </div>

          {/* 连接配置 */}
          <div className="space-y-2">
            <Label>{t('device.connection.connectionConfig')}</Label>
            <Textarea
              className="font-mono text-xs"
              rows={4}
              value={form.connectionConfig}
              onChange={(e) => setForm({ ...form, connectionConfig: e.target.value })}
            />
          </div>

          {/* 数据点映射 */}
          <div className="space-y-2">
            <Label>{t('device.connection.dataPointMapping')}</Label>
            <Textarea
              className="font-mono text-xs"
              rows={4}
              value={form.dataPoints}
              onChange={(e) => setForm({ ...form, dataPoints: e.target.value })}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {t('device.connection.createAndLink')}
            </Button>
            <Button variant="outline" onClick={runTest} disabled={testConnMutation.isPending}>
              {testConnMutation.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
              {t('device.connection.testConnection')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 测试结果 */}
      {testResult && (
        <Card className={testResult.success ? 'border-green-500/30' : 'border-red-500/30'}>
          <CardContent className="flex items-center gap-2 py-3">
            <Badge variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? t('device.connection.testSuccess') : t('device.connection.testFailed')}
            </Badge>
            <span className="text-sm">{testResult.message}</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setTestResult(null)}>
              {t('common.close')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// 设备基本信息卡片（支持行内编辑）
// ============================================================================

/** 设备信息卡片属性 */
interface DeviceInfoCardProps {
  device: Device;
}

/**
 * 设备基本信息卡片
 *
 * 默认显示只读信息，点击编辑按钮后字段变为输入框，支持行内修改保存。
 * 只编辑 Device 类型中实际存在且用户可修改的字段：name、type、model、manufacturer。
 * status 和 healthScore 为系统维护，始终只读。
 */
function DeviceInfoCard({ device }: DeviceInfoCardProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateDevice();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', type: '', model: '', manufacturer: '' });

  /** 进入编辑模式 */
  const startEdit = () => {
    setForm({
      name: device.name ?? '',
      type: device.type ?? '',
      model: device.model ?? '',
      manufacturer: device.manufacturer ?? '',
    });
    setEditing(true);
  };

  /** 保存修改 */
  const saveEdit = () => {
    updateMutation.mutate(
      {
        id: device.id,
        deviceCode: device.deviceCode,
        name: form.name,
        type: form.type,
        model: form.model || undefined,
        manufacturer: form.manufacturer || undefined,
      },
      { onSettled: () => setEditing(false) },
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium text-muted-foreground">{t('device.basicInfo')}</span>
        {editing ? (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={saveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
      <CardContent className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
        {editing ? (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('device.name')}</Label>
              <Input className="h-8 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('device.type')}</Label>
              <Input className="h-8 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('device.model')}</Label>
              <Input className="h-8 text-sm" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('device.manufacturer')}</Label>
              <Input className="h-8 text-sm" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('common.status')}</Label>
              <div className="mt-1"><DeviceStatusBadge status={device.status} /></div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('device.healthScore')}</Label>
              <p className="mt-1 font-medium">{device.healthScore}</p>
            </div>
          </>
        ) : (
          <>
            <div><p className="text-sm text-muted-foreground">{t('device.name')}</p><p className="font-medium">{device.name}</p></div>
            <div><p className="text-sm text-muted-foreground">{t('device.type')}</p><p className="font-medium">{device.type}</p></div>
            <div><p className="text-sm text-muted-foreground">{t('device.model')}</p><p className="font-medium">{device.model ?? '-'}</p></div>
            <div><p className="text-sm text-muted-foreground">{t('device.manufacturer')}</p><p className="font-medium">{device.manufacturer ?? '-'}</p></div>
            <div><p className="text-sm text-muted-foreground">{t('common.status')}</p><DeviceStatusBadge status={device.status} /></div>
            <div><p className="text-sm text-muted-foreground">{t('device.healthScore')}</p><p className="font-medium">{device.healthScore}</p></div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
