import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { PriorityBadge } from '../components/workorder/PriorityBadge';
import { WorkOrderForm } from '../components/workorder/WorkOrderForm';
import { useWorkOrders, useCreateWorkOrder } from '../hooks/useWorkOrders';
import { useDevices } from '../hooks/useDevices';
import { getWorkOrderStatusLabels } from '../utils/workorder';
import type { CreateWorkOrderRequest } from '../types';


/**
 * 工单列表页
 *
 * 展示工单分页列表，支持搜索、状态筛选和新建工单弹窗。
 * 点击行跳转至工单详情页。
 */
export default function WorkOrderListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  /** 工单状态对应的中文标签（使用共享工具函数，匹配后端 PascalCase 枚举序列化） */
  const statusLabels = getWorkOrderStatusLabels(t);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useWorkOrders({ page, pageSize: 20 }, { status: status || undefined });
  const createWorkOrder = useCreateWorkOrder();
  const { data: devicesData } = useDevices({ page: 1, pageSize: 100 });

  const devices = devicesData?.items ?? [];

  /** 前端搜索过滤（按标题或工单编码） */
  const filteredItems = data?.items.filter(
    (wo) => !search || wo.title.includes(search) || wo.workOrderCode.includes(search),
  ) ?? [];

  return (
    <div className="space-y-4">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('workorder.title')}</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />{t('common.create')}
        </Button>
      </div>

      {/* 搜索和筛选栏 */}
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
        <Select value={status} onValueChange={(v) => { if (v != null) { setStatus(v === 'all' ? '' : v); setPage(1); } }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="PendingDispatch">{t('workorder.status.pendingDispatch')}</SelectItem>
            <SelectItem value="Assigned">{t('workorder.status.assigned')}</SelectItem>
            <SelectItem value="InProgress">{t('workorder.status.inProgress')}</SelectItem>
            <SelectItem value="Completed">{t('workorder.status.completed')}</SelectItem>
            <SelectItem value="Accepted">{t('workorder.status.accepted')}</SelectItem>
            <SelectItem value="Rejected">{t('workorder.status.rejected')}</SelectItem>
            <SelectItem value="Closed">{t('workorder.status.closed')}</SelectItem>
            <SelectItem value="Cancelled">{t('workorder.status.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 工单表格 */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('workorder.code')}</TableHead>
                <TableHead>{t('workorder.titleField')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('workorder.priority')}</TableHead>
                <TableHead>{t('common.createdAt')}</TableHead>
                <TableHead>{t('workorder.dueDate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.noData')}</TableCell>
                </TableRow>
              ) : (
                filteredItems.map((wo) => (
                  <TableRow key={wo.id} className="cursor-pointer" onClick={() => navigate(`/work-orders/${wo.id}`)}>
                    <TableCell className="font-mono text-sm">{wo.workOrderCode}</TableCell>
                    <TableCell className="font-medium">{wo.title}</TableCell>
                    <TableCell><Badge variant="outline">{statusLabels[wo.status] ?? wo.status}</Badge></TableCell>
                    <TableCell><PriorityBadge priority={wo.priority} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(wo.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{wo.dueDate ?? '-'}</TableCell>
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

      {/* 新建工单弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('workorder.create')}</DialogTitle></DialogHeader>
          <WorkOrderForm
            devices={devices}
            onSubmit={async (req: CreateWorkOrderRequest) => {
              await createWorkOrder.mutateAsync(req);
              setDialogOpen(false);
            }}
            onCancel={() => setDialogOpen(false)}
            loading={createWorkOrder.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
