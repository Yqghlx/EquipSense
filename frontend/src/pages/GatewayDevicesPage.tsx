/**
 * 网关设备管理页面
 *
 * 展示网关下所有已配置设备的列表，支持查看配置、启停、编辑和删除。
 * 新建设备跳转到 /device-setup 向导页面。
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Pencil,
  Plug,
  Radio,
  Network,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  useGatewayDevices,
  useDeleteGatewayDevice,
  useUpdateGatewayDevice,
  useTestConnection,
} from '../hooks/useGatewayDevices';
import { formatDate } from '../lib/utils';

/** 协议显示映射 */
const protocolMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  opcua: { label: 'OPC UA', icon: <Plug className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-600' },
  'modbus-tcp': { label: 'Modbus TCP', icon: <Network className="h-4 w-4" />, color: 'bg-green-500/10 text-green-600' },
  'modbus-rtu': { label: 'Modbus RTU', icon: <Radio className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-600' },
};

export default function GatewayDevicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: devices, isLoading, refetch } = useGatewayDevices();
  const deleteMutation = useDeleteGatewayDevice();
  const updateMutation = useUpdateGatewayDevice();
  const testConnMutation = useTestConnection();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<{
    id: string;
    deviceName: string;
    connectionConfig: string;
    dataPoints: string;
    pollIntervalMs: number;
  } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  /** 切换设备启停 */
  const toggleEnabled = (id: string, current: boolean) => {
    updateMutation.mutate({ id, enabled: !current });
  };

  /** 确认删除 */
  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
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

  /** 测试连接 */
  const runTestConnection = (protocol: string, connectionConfig: string) => {
    setTestResult(null);
    testConnMutation.mutate(
      { protocol, connectionConfig },
      {
        onSuccess: (result) => setTestResult(result),
        onError: () => setTestResult({ success: false, message: '连接测试请求失败' }),
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">网关设备管理</h1>
          <p className="text-sm text-muted-foreground">
            管理边缘网关下的采集设备配置，支持 OPC UA、Modbus TCP/RTU 协议
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-1 h-4 w-4" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/gateway/monitor')}>
            <Network className="mr-1 h-4 w-4" />
            监控面板
          </Button>
          <Button size="sm" onClick={() => navigate('/device-setup')}>
            <Plus className="mr-1 h-4 w-4" />
            新建设备
          </Button>
        </div>
      </div>

      {/* 设备列表 */}
      <Card>
        <CardHeader>
          <CardTitle>设备列表</CardTitle>
          <CardDescription>
            当前已配置 {devices?.length ?? 0} 个网关设备
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !devices?.length ? (
            <div className="text-center py-8">
              <Network className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">暂无网关设备配置</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/device-setup')}>
                <Plus className="mr-1 h-4 w-4" />
                添加第一个设备
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>设备名称</TableHead>
                  <TableHead>协议</TableHead>
                  <TableHead>采集间隔</TableHead>
                  <TableHead>数据点数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const proto = protocolMeta[device.protocol] ?? {
                    label: device.protocol,
                    icon: <Plug className="h-4 w-4" />,
                    color: 'bg-gray-500/10 text-gray-600',
                  };
                  const dpCount = (() => {
                    try {
                      const parsed = JSON.parse(device.dataPoints);
                      return typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
                    } catch { return 0; }
                  })();

                  return (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.deviceName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={proto.color}>
                          {proto.icon}
                          <span className="ml-1">{proto.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{device.pollIntervalMs}ms</TableCell>
                      <TableCell>{dpCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={device.enabled}
                            onCheckedChange={() => toggleEnabled(device.id, device.enabled)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {device.enabled ? '已启用' : '已停用'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(device.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t("common.testConnection", "测试连接")}
                            onClick={() => runTestConnection(device.protocol, device.connectionConfig)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t("common.edit", "编辑")}
                            onClick={() =>
                              setEditTarget({
                                id: device.id,
                                deviceName: device.deviceName,
                                connectionConfig: device.connectionConfig,
                                dataPoints: device.dataPoints,
                                pollIntervalMs: device.pollIntervalMs,
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title={t("common.delete", "删除")}
                            onClick={() => setDeleteTarget(device.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 连接测试结果提示 */}
      {testResult && (
        <Card className={testResult.success ? 'border-green-500/30' : 'border-red-500/30'}>
          <CardContent className="flex items-center gap-2 py-3">
            <Badge variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? '连接成功' : '连接失败'}
            </Badge>
            <span className="text-sm">{testResult.message}</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setTestResult(null)}>
              关闭
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除该网关设备配置吗？删除后边缘网关将停止采集该设备数据，此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑网关设备</DialogTitle>
            <DialogDescription>修改设备配置信息，保存后边缘网关将在下次配置拉取时生效</DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>设备名称</Label>
                <Input
                  value={editTarget.deviceName}
                  onChange={(e) => setEditTarget({ ...editTarget, deviceName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>采集间隔（毫秒）</Label>
                <Input
                  type="number"
                  value={editTarget.pollIntervalMs}
                  onChange={(e) => setEditTarget({ ...editTarget, pollIntervalMs: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>连接配置（JSON）</Label>
                <Textarea
                  className="font-mono text-xs"
                  rows={4}
                  value={editTarget.connectionConfig}
                  onChange={(e) => setEditTarget({ ...editTarget, connectionConfig: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>数据点映射（JSON）</Label>
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
            <Button variant="outline" onClick={() => setEditTarget(null)}>取消</Button>
            <Button onClick={saveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
