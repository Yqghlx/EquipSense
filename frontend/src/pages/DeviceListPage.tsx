import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2, Eye, Upload, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DeviceStatusBadge } from '../components/device/DeviceStatusBadge';
import { DeviceForm } from '../components/device/DeviceForm';
import DeviceImportPreviewDialog from '../components/device/DeviceImportPreviewDialog';
import { useDevices, useCreateDevice, useUpdateDevice, useDeleteDevice, exportDevicesCsv } from '../hooks/useDevices';
import { usePermission } from '../hooks/usePermission';
import type { CreateDeviceRequest, Device } from '../types';

/**
 * 设备列表页
 *
 * 功能：搜索、按状态过滤、分页浏览、新建/编辑/删除设备。
 * 点击行或查看按钮可跳转到设备详情页。
 */
export default function DeviceListPage() {
  const { t } = useTranslation();
  const perm = usePermission('device');
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | undefined>();
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useDevices({ page, pageSize: 20, status: status || undefined });
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  /** 提交设备表单（新建或编辑） */
  const handleSubmit = async (req: CreateDeviceRequest) => {
    if (editingDevice) {
      await updateDevice.mutateAsync({ ...req, id: editingDevice.id });
    } else {
      await createDevice.mutateAsync(req);
    }
    setDialogOpen(false);
    setEditingDevice(undefined);
  };

  /** 删除设备（需用户确认） */
  const handleDelete = async (id: string) => {
    if (window.confirm(t('common.confirm') + '?')) {
      await deleteDevice.mutateAsync(id);
    }
  };

  /** 根据搜索关键字在客户端过滤设备列表 */
  const filteredDevices = data?.items.filter(
    (d) => !search || d.name.includes(search) || d.deviceCode.includes(search),
  ) ?? [];

  return (
    <div className="space-y-4">
      {/* 页头：标题 + 操作按钮 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('device.title')}</h1>
        <div className="flex items-center gap-2">
          {perm.canCreate && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setImportFile(f); setImportOpen(true); }
                  e.target.value = '';
                }}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />{t('device.import', '导入')}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportDevicesCsv({ status: status || undefined })}
            title={t('common.exportTip', '最多导出 10000 条')}
          >
            <Download className="mr-2 h-4 w-4" />{t('common.export', '导出')}
          </Button>
          <Button onClick={() => { setEditingDevice(undefined); setDialogOpen(true); }} disabled={!perm.canCreate}>
            <Plus className="mr-2 h-4 w-4" />{t('common.create')}
          </Button>
        </div>
      </div>

      {/* 搜索栏 + 状态过滤 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => { if (v !== null) { setStatus(v === 'all' ? '' : v); setPage(1); } }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="Online">{t('device.online')}</SelectItem>
            <SelectItem value="Offline">{t('device.offline')}</SelectItem>
            <SelectItem value="Maintenance">{t('device.maintenance')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 设备列表表格或加载状态 */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('device.deviceCode')}</TableHead>
                <TableHead>{t('device.name')}</TableHead>
                <TableHead>{t('device.type')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('device.model')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => (
                  <TableRow key={device.id} className="cursor-pointer" onClick={() => navigate(`/devices/${device.id}`)}>
                    <TableCell className="font-mono text-sm">{device.deviceCode}</TableCell>
                    <TableCell>{device.name}</TableCell>
                    <TableCell>{device.type}</TableCell>
                    <TableCell><DeviceStatusBadge status={device.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.model ?? '-'}
                    </TableCell>
                    <TableCell>
                      {/* 操作按钮区域：阻止行点击事件冒泡 */}
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/devices/${device.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingDevice(device); setDialogOpen(true); }} disabled={!perm.canEdit}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(device.id)} disabled={!perm.canDelete}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 分页控制 */}
          {data && data.total > 20 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('common.totalItems', { count: data.total })}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.previous')}</Button>
                <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>{t('common.next')}</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 新建/编辑设备对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDevice ? t('common.edit') : t('common.create')}</DialogTitle>
          </DialogHeader>
          <DeviceForm
            device={editingDevice}
            onSubmit={handleSubmit}
            onCancel={() => { setDialogOpen(false); setEditingDevice(undefined); }}
            loading={createDevice.isPending || updateDevice.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* 设备批量导入预览对话框 */}
      <DeviceImportPreviewDialog
        open={importOpen}
        onClose={() => { setImportOpen(false); setImportFile(null); }}
        file={importFile}
      />
    </div>
  );
}
