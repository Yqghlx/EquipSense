# Phase 1 前端 — 子计划 C：工单 + AI 分析 + 设置页面 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现工单管理（列表+详情+完整生命周期操作）、AI 分析页面、系统设置页面。完成后前端功能完整覆盖后端所有 API。

**Architecture:** 在子计划 A/B 基础之上，延续「数据层 → 组件层 → 页面层」模式。工单详情页是核心复杂页面，包含状态流转按钮区和审计时间线；AI 分析页面展示置信度可视化和根因分析结果；设置页面采用 Tab 布局覆盖用户/角色/LLM/系统参数。

**Tech Stack:** React 19, TypeScript, TanStack Query v5, ECharts, React Hook Form + Zod, shadcn/ui

**Depends on:** 子计划 A（基础设施），子计划 B（共享组件如 SeverityBadge）

**Spec:** `docs/superpowers/specs/2026-06-01-phase1-frontend-design.md`

---

## 文件结构（子计划 C）

```
新增文件：

frontend/src/
├── hooks/
│   ├── useWorkOrders.ts       — 工单 CRUD + 生命周期 Hooks
│   └── useAnalyses.ts         — 分析查询 + 触发 Hook
├── components/
│   ├── workorder/
│   │   ├── WorkOrderForm.tsx   — 工单新建表单
│   │   ├── PriorityBadge.tsx   — 优先级徽标
│   │   └── StatusTimeline.tsx  — 审计日志时间线
│   └── analysis/
│       ├── AnalysisDetail.tsx  — 分析详情展开面板
│       └── ConfidenceMeter.tsx — 置信度可视化
└── pages/
    ├── WorkOrderListPage.tsx   — 工单列表
    ├── WorkOrderDetailPage.tsx — 工单详情（含状态操作）
    ├── AnalysesPage.tsx        — AI 分析列表
    └── SettingsPage.tsx        — 系统设置（4 个 Tab）
```

---

### Task 1: 工单 + 分析 TanStack Query Hooks

**Files:**
- Create: `frontend/src/hooks/useWorkOrders.ts`
- Create: `frontend/src/hooks/useAnalyses.ts`

- [ ] **Step 1: 创建工单 Hooks**

`frontend/src/hooks/useWorkOrders.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  WorkOrder, WorkOrderLog, PagedResult, PagedQuery,
  CreateWorkOrderRequest, AssignWorkOrderRequest, CompleteWorkOrderRequest,
} from '../types';

interface WorkOrderFilters {
  status?: string;
  priority?: string;
  deviceId?: string;
}

export function useWorkOrders(query: PagedQuery, filters?: WorkOrderFilters) {
  return useQuery({
    queryKey: ['work-orders', query, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.sort) params.set('sort', query.sort);
      if (query.order) params.set('order', query.order);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.deviceId) params.set('deviceId', filters.deviceId);
      const { data } = await api.get<PagedResult<WorkOrder>>('/work-orders?' + params);
      return data;
    },
  });
}

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ['work-orders', id],
    queryFn: async () => {
      const { data } = await api.get<WorkOrder>(`/work-orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useWorkOrderLogs(workOrderId: string) {
  return useQuery({
    queryKey: ['work-orders', workOrderId, 'logs'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderLog[]>(`/work-orders/${workOrderId}/logs`);
      return data;
    },
    enabled: !!workOrderId,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateWorkOrderRequest) => {
      const { data } = await api.post<WorkOrder>('/work-orders', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

export function useAssignWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: AssignWorkOrderRequest & { id: string }) => {
      await api.put(`/work-orders/${id}/assign`, req);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
    },
  });
}

export function useStartWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/work-orders/${id}/start`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
    },
  });
}

export function useCompleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: CompleteWorkOrderRequest & { id: string }) => {
      await api.put(`/work-orders/${id}/complete`, req);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
    },
  });
}

export function useAcceptWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/work-orders/${id}/accept`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
    },
  });
}

export function useRejectWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.put(`/work-orders/${id}/reject`, { reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
    },
  });
}

export function useCloseWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/work-orders/${id}/close`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
    },
  });
}

export function useCancelWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.put(`/work-orders/${id}/cancel`, { reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
    },
  });
}
```

- [ ] **Step 2: 创建分析 Hooks**

`frontend/src/hooks/useAnalyses.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Analysis, PagedResult, PagedQuery, CreateAnalysisRequest } from '../types';

interface AnalysisFilters {
  deviceId?: string;
  level?: string;
  status?: string;
}

export function useAnalyses(query: PagedQuery, filters?: AnalysisFilters) {
  return useQuery({
    queryKey: ['analyses', query, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (filters?.deviceId) params.set('deviceId', filters.deviceId);
      if (filters?.level) params.set('level', filters.level);
      if (filters?.status) params.set('status', filters.status);
      const { data } = await api.get<PagedResult<Analysis>>('/analyses?' + params);
      return data;
    },
  });
}

export function useAnalysis(id: string) {
  return useQuery({
    queryKey: ['analyses', id],
    queryFn: async () => {
      const { data } = await api.get<Analysis>(`/analyses/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useTriggerAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateAnalysisRequest) => {
      const { data } = await api.post<Analysis>('/analyses', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
  });
}
```

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/hooks/useWorkOrders.ts frontend/src/hooks/useAnalyses.ts
git commit -m "feat: add TanStack Query hooks for work orders and analyses

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: 工单业务组件

**Files:**
- Create: `frontend/src/components/workorder/PriorityBadge.tsx`
- Create: `frontend/src/components/workorder/WorkOrderForm.tsx`
- Create: `frontend/src/components/workorder/StatusTimeline.tsx`

- [ ] **Step 1: 创建 PriorityBadge**

`frontend/src/components/workorder/PriorityBadge.tsx`:
```tsx
import { Badge } from '../ui/badge';
import { useTranslation } from 'react-i18next';

const priorityStyles: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const priorityLabels: Record<string, string> = {
  critical: '紧急',
  high: '高',
  normal: '普通',
  low: '低',
};

interface PriorityBadgeProps {
  priority: string;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge variant="outline" className={priorityStyles[priority] ?? ''}>
      {priorityLabels[priority] ?? priority}
    </Badge>
  );
}
```

- [ ] **Step 2: 创建 WorkOrderForm**

`frontend/src/components/workorder/WorkOrderForm.tsx`:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { CreateWorkOrderRequest } from '../../types';

const workOrderSchema = z.object({
  title: z.string().min(1, '请输入标题'),
  type: z.string().min(1, '请选择类型'),
  priority: z.string().min(1, '请选择优先级'),
  deviceId: z.string().min(1, '请选择设备'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

interface WorkOrderFormProps {
  onSubmit: (data: CreateWorkOrderRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  devices?: Array<{ id: string; name: string }>;
}

export function WorkOrderForm({ onSubmit, onCancel, loading, devices = [] }: WorkOrderFormProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
  });

  const handleFormSubmit = (data: WorkOrderFormData) => {
    onSubmit({
      ...data,
      description: data.description ?? '',
      dueDate: data.dueDate,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>标题</Label>
        <Input {...register('title')} placeholder="工单标题" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>类型</Label>
          <Select onValueChange={(v) => setValue('type', v)}>
            <SelectTrigger><SelectValue placeholder="选择类型" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="corrective">纠正性维护</SelectItem>
              <SelectItem value="preventive">预防性维护</SelectItem>
              <SelectItem value="predictive">预测性维护</SelectItem>
              <SelectItem value="inspection">巡检</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>优先级</Label>
          <Select onValueChange={(v) => setValue('priority', v)}>
            <SelectTrigger><SelectValue placeholder="选择优先级" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">紧急</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="normal">普通</SelectItem>
              <SelectItem value="low">低</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && <p className="text-sm text-destructive">{errors.priority.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>设备</Label>
        <Select onValueChange={(v) => setValue('deviceId', v)}>
          <SelectTrigger><SelectValue placeholder="选择设备" /></SelectTrigger>
          <SelectContent>
            {devices.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.deviceId && <p className="text-sm text-destructive">{errors.deviceId.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>描述</Label>
        <Textarea {...register('description')} placeholder="问题描述..." rows={3} />
      </div>
      <div className="space-y-2">
        <Label>截止日期</Label>
        <Input type="date" {...register('dueDate')} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}>{loading ? t('common.loading') : t('common.save')}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: 创建 StatusTimeline**

`frontend/src/components/workorder/StatusTimeline.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import type { WorkOrderLog } from '../../types';

interface StatusTimelineProps {
  logs: WorkOrderLog[];
}

const actionLabels: Record<string, string> = {
  created: '创建工单',
  assigned: '派工',
  started: '开始执行',
  completed: '完成',
  accepted: '验收通过',
  rejected: '验收不通过',
  closed: '关闭',
  cancelled: '取消',
};

export function StatusTimeline({ logs }: StatusTimelineProps) {
  if (logs.length === 0) return <p className="text-sm text-muted-foreground">暂无操作记录</p>;

  return (
    <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
      {logs.map((log) => (
        <div key={log.id} className="relative">
          <div className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-primary bg-background" />
          <div className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{actionLabels[log.action] ?? log.action}</span>
              <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            {(log.oldStatus || log.newStatus) && (
              <p className="mt-1 text-xs text-muted-foreground">
                {log.oldStatus && `${log.oldStatus} → `}{log.newStatus}
              </p>
            )}
            {log.note && <p className="mt-1 text-sm">{log.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/workorder/
git commit -m "feat: add work order components - PriorityBadge, WorkOrderForm and StatusTimeline

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: 工单列表页

**Files:**
- Create: `frontend/src/pages/WorkOrderListPage.tsx`
- Modify: `frontend/src/App.tsx` — 替换工单列表路由占位

- [ ] **Step 1: 创建 WorkOrderListPage**

`frontend/src/pages/WorkOrderListPage.tsx`:
```tsx
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
import type { CreateWorkOrderRequest } from '../types';

const statusLabels: Record<string, string> = {
  pending_dispatch: '待派工',
  dispatched: '已派工',
  in_progress: '执行中',
  completed: '已完成',
  accepted: '已验收',
  rejected: '验收不通过',
  closed: '已关闭',
  cancelled: '已取消',
};

export default function WorkOrderListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useWorkOrders({ page, pageSize: 20 }, { status: status || undefined });
  const createWorkOrder = useCreateWorkOrder();
  const { data: devicesData } = useDevices({ page: 1, pageSize: 100 });

  const devices = devicesData?.items ?? [];

  const filteredItems = data?.items.filter(
    (wo) => !search || wo.title.includes(search) || wo.workOrderCode.includes(search),
  ) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('workorder.title')}</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />{t('common.create')}
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t('common.search') + '...'} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="pending_dispatch">待派工</SelectItem>
            <SelectItem value="dispatched">已派工</SelectItem>
            <SelectItem value="in_progress">执行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="accepted">已验收</SelectItem>
            <SelectItem value="rejected">验收不通过</SelectItem>
            <SelectItem value="closed">已关闭</SelectItem>
            <SelectItem value="cancelled">已取消</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('workorder.code')}</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('workorder.priority')}</TableHead>
                <TableHead>{t('common.createdAt')}</TableHead>
                <TableHead>截止日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
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
          {data && data.total > 20 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>共 {data.total} 条</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
                <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)}>下一页</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>新建工单</DialogTitle></DialogHeader>
          <WorkOrderForm
            devices={devices}
            onSubmit={async (req) => { await createWorkOrder.mutateAsync(req); setDialogOpen(false); }}
            onCancel={() => setDialogOpen(false)}
            loading={createWorkOrder.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: 更新 App.tsx 路由**

在 `frontend/src/App.tsx` 中：
1. 添加 `import WorkOrderListPage from './pages/WorkOrderListPage';`
2. 将 `/work-orders` 路由的占位元素替换为 `<WorkOrderListPage />`

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/WorkOrderListPage.tsx frontend/src/App.tsx
git commit -m "feat: add WorkOrderListPage with search, filter and create dialog

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: 工单详情页

**Files:**
- Create: `frontend/src/pages/WorkOrderDetailPage.tsx`
- Modify: `frontend/src/App.tsx` — 替换工单详情路由占位

- [ ] **Step 1: 创建 WorkOrderDetailPage**

`frontend/src/pages/WorkOrderDetailPage.tsx`:
```tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { PriorityBadge } from '../components/workorder/PriorityBadge';
import { StatusTimeline } from '../components/workorder/StatusTimeline';
import { useWorkOrder, useWorkOrderLogs, useAssignWorkOrder, useStartWorkOrder, useCompleteWorkOrder, useAcceptWorkOrder, useRejectWorkOrder, useCloseWorkOrder, useCancelWorkOrder } from '../hooks/useWorkOrders';
import type { WorkOrder } from '../types';

const statusLabels: Record<string, string> = {
  pending_dispatch: '待派工',
  dispatched: '已派工',
  in_progress: '执行中',
  completed: '已完成',
  accepted: '已验收',
  rejected: '验收不通过',
  closed: '已关闭',
  cancelled: '已取消',
};

export default function WorkOrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [resolution, setResolution] = useState('');

  const { data: workOrder, isLoading } = useWorkOrder(id ?? '');
  const { data: logs } = useWorkOrderLogs(id ?? '');
  const assignOrder = useAssignWorkOrder();
  const startOrder = useStartWorkOrder();
  const completeOrder = useCompleteWorkOrder();
  const acceptOrder = useAcceptWorkOrder();
  const rejectOrder = useRejectWorkOrder();
  const closeOrder = useCloseWorkOrder();
  const cancelOrder = useCancelWorkOrder();

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>;
  if (!workOrder) return <div className="py-20 text-center text-muted-foreground">{t('common.noData')}</div>;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/work-orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{workOrder.title}</h1>
          <p className="text-sm text-muted-foreground">{workOrder.workOrderCode}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline">{statusLabels[workOrder.status] ?? workOrder.status}</Badge>
          <PriorityBadge priority={workOrder.priority} />
        </div>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
          <div><p className="text-sm text-muted-foreground">类型</p><p className="font-medium">{workOrder.type}</p></div>
          <div><p className="text-sm text-muted-foreground">{t('common.status')}</p><Badge variant="outline">{statusLabels[workOrder.status]}</Badge></div>
          <div><p className="text-sm text-muted-foreground">派工人</p><p className="font-medium">{workOrder.assignedTo ?? '-'}</p></div>
          <div><p className="text-sm text-muted-foreground">截止日期</p><p className="font-medium">{workOrder.dueDate ?? '-'}</p></div>
          <div><p className="text-sm text-muted-foreground">{t('common.createdAt')}</p><p className="font-medium">{new Date(workOrder.createdAt).toLocaleString()}</p></div>
          {workOrder.completedAt && (
            <div><p className="text-sm text-muted-foreground">完成时间</p><p className="font-medium">{new Date(workOrder.completedAt).toLocaleString()}</p></div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮区 */}
      <ActionButtons workOrder={workOrder} onStart={() => startOrder.mutate(workOrder.id)} onAccept={() => acceptOrder.mutate(workOrder.id)} onReject={(reason) => rejectOrder.mutate({ id: workOrder.id, reason })} onClose={() => closeOrder.mutate(workOrder.id)} onCancel={() => setCancelDialogOpen(true)} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* 关联信息 */}
        <Card>
          <CardHeader><CardTitle className="text-base">关联信息</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {workOrder.rootCause ? (
              <div>
                <p className="text-sm text-muted-foreground">根因描述</p>
                <p className="mt-1 text-sm">{workOrder.rootCause}</p>
              </div>
            ) : null}
            {workOrder.resolution ? (
              <div>
                <p className="text-sm text-muted-foreground">解决措施</p>
                <p className="mt-1 text-sm">{workOrder.resolution}</p>
              </div>
            ) : null}
            {!workOrder.rootCause && !workOrder.resolution && (
              <p className="text-sm text-muted-foreground">暂无关联信息</p>
            )}
          </CardContent>
        </Card>

        {/* 审计日志 */}
        <Card>
          <CardHeader><CardTitle className="text-base">操作记录</CardTitle></CardHeader>
          <CardContent>
            <StatusTimeline logs={logs ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* 完成操作对话框 */}
      {(workOrder.status === 'in_progress') && (
        <Card>
          <CardHeader><CardTitle className="text-base">填写解决措施</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="描述解决措施..." rows={3} />
            <Button onClick={() => completeOrder.mutate({ id: workOrder.id, resolution })} disabled={!resolution || completeOrder.isPending}>
              {t('workorder.complete')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 取消对话框 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>取消工单</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>取消原因</Label>
              <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="请输入取消原因..." rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button variant="destructive" disabled={!cancelReason} onClick={() => { cancelOrder.mutate({ id: workOrder.id, reason: cancelReason }); setCancelDialogOpen(false); }}>
                确认取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ActionButtonsProps {
  workOrder: WorkOrder;
  onStart: () => void;
  onAccept: () => void;
  onReject: (reason: string) => void;
  onClose: () => void;
  onCancel: () => void;
}

function ActionButtons({ workOrder, onStart, onAccept, onReject, onClose, onCancel }: ActionButtonsProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  const buttons: Record<string, Array<{ label: string; action: () => void; variant?: 'default' | 'outline' | 'destructive' }>> = {
    pending_dispatch: [{ label: '派工', action: onStart }],
    dispatched: [{ label: '开始执行', action: onStart }],
    in_progress: [],
    completed: [
      { label: '验收通过', action: onAccept },
      { label: '验收不通过', action: () => setShowReject(true), variant: 'outline' },
    ],
    accepted: [{ label: '关闭', action: onClose }],
    rejected: [],
    closed: [],
    cancelled: [],
  };

  const available = buttons[workOrder.status] ?? [];
  if (available.length === 0 && workOrder.status !== 'cancelled' && workOrder.status !== 'closed') {
    available.push({ label: '取消工单', action: onCancel, variant: 'destructive' });
  }

  if (available.length === 0 && !showReject) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        {available.map((btn) => (
          <Button key={btn.label} variant={btn.variant ?? 'default'} onClick={btn.action}>
            {btn.label}
          </Button>
        ))}
        {showReject && (
          <div className="flex w-full items-center gap-2">
            <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="不通过原因..." className="flex-1" />
            <Button size="sm" disabled={!rejectReason} onClick={() => { onReject(rejectReason); setShowReject(false); }}>提交</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>取消</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 更新 App.tsx 路由**

在 `frontend/src/App.tsx` 中：
1. 添加 `import WorkOrderDetailPage from './pages/WorkOrderDetailPage';`
2. 将 `/work-orders/:id` 路由的占位元素替换为 `<WorkOrderDetailPage />`

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/WorkOrderDetailPage.tsx frontend/src/App.tsx
git commit -m "feat: add WorkOrderDetailPage with full lifecycle actions and audit timeline

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: AI 分析组件 + 页面

**Files:**
- Create: `frontend/src/components/analysis/ConfidenceMeter.tsx`
- Create: `frontend/src/components/analysis/AnalysisDetail.tsx`
- Create: `frontend/src/pages/AnalysesPage.tsx`
- Modify: `frontend/src/App.tsx` — 替换分析路由占位

- [ ] **Step 1: 创建 ConfidenceMeter**

`frontend/src/components/analysis/ConfidenceMeter.tsx`:
```tsx
import { GaugeChart } from '../charts/GaugeChart';

interface ConfidenceMeterProps {
  confidence: number;
  size?: 'sm' | 'md';
}

export function ConfidenceMeter({ confidence, size = 'md' }: ConfidenceMeterProps) {
  const percentage = Math.round(confidence * 100);
  const color = percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444';
  const height = size === 'sm' ? 120 : 200;

  return <GaugeChart value={percentage} color={color} height={height} />;
}
```

- [ ] **Step 2: 创建 AnalysisDetail**

`frontend/src/components/analysis/AnalysisDetail.tsx`:
```tsx
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ConfidenceMeter } from './ConfidenceMeter';
import type { Analysis } from '../../types';

interface AnalysisDetailProps {
  analysis: Analysis;
}

const levelLabels: Record<string, string> = {
  L1: 'L1 — 规则匹配',
  L2: 'L2 — 统计分析',
  L3: 'L3 — LLM 深度分析',
};

const statusLabels: Record<string, string> = {
  pending: '等待中',
  running: '分析中',
  completed: '已完成',
  failed: '失败',
};

export function AnalysisDetail({ analysis }: AnalysisDetailProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{levelLabels[analysis.level] ?? analysis.level}</Badge>
        <Badge variant="outline">{statusLabels[analysis.status] ?? analysis.status}</Badge>
        {analysis.processingTimeMs && (
          <span className="text-xs text-muted-foreground">耗时 {analysis.processingTimeMs}ms</span>
        )}
      </div>

      {analysis.confidence != null && (
        <Card>
          <CardContent className="flex items-center gap-6 p-4">
            <ConfidenceMeter confidence={analysis.confidence} size="sm" />
            <div>
              <p className="text-sm font-medium">置信度</p>
              <p className="text-2xl font-bold">{Math.round(analysis.confidence * 100)}%</p>
              {analysis.dataQualityScore != null && (
                <p className="text-xs text-muted-foreground">数据质量评分: {Math.round(analysis.dataQualityScore * 100)}%</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis.rootCause && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">根因分析</p>
            <p className="text-sm whitespace-pre-wrap">{analysis.rootCause}</p>
          </CardContent>
        </Card>
      )}

      {analysis.suggestion && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">建议措施</p>
            <p className="text-sm whitespace-pre-wrap">{analysis.suggestion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 创建 AnalysesPage**

`frontend/src/pages/AnalysesPage.tsx`:
```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { AnalysisDetail } from '../components/analysis/AnalysisDetail';
import { useAnalyses, useTriggerAnalysis } from '../hooks/useAnalyses';
import { useAlerts } from '../hooks/useAlerts';
import type { Analysis } from '../types';

const levelLabels: Record<string, string> = { L1: 'L1', L2: 'L2', L3: 'L3' };
const statusLabels: Record<string, string> = { pending: '等待中', running: '分析中', completed: '已完成', failed: '失败' };

export default function AnalysesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState('');

  const { data, isLoading } = useAnalyses(
    { page, pageSize: 20 },
    { level: level || undefined, status: status || undefined },
  );
  const triggerAnalysis = useTriggerAnalysis();
  const { data: alertsData } = useAlerts({ page: 1, pageSize: 50 }, { status: 'active' });

  const handleTrigger = async () => {
    if (!selectedAlertId) return;
    await triggerAnalysis.mutateAsync({ alertId: selectedAlertId });
    setTriggerDialogOpen(false);
    setSelectedAlertId('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('analysis.title')}</h1>
        <Button onClick={() => setTriggerDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />手动触发
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={level} onValueChange={(v) => { setLevel(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-28"><SelectValue placeholder="分析级别" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="L1">L1</SelectItem>
            <SelectItem value="L2">L2</SelectItem>
            <SelectItem value="L3">L3</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-28"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="running">分析中</SelectItem>
            <SelectItem value="pending">等待中</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>设备</TableHead>
              <TableHead>级别</TableHead>
              <TableHead>置信度</TableHead>
              <TableHead>数据质量</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>耗时</TableHead>
              <TableHead>完成时间</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
            ) : (
              data?.items.map((analysis) => (
                <>
                  <TableRow key={analysis.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}>
                    <TableCell className="font-mono text-xs">{analysis.id.slice(0, 8)}</TableCell>
                    <TableCell>{analysis.deviceId.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant="outline">{levelLabels[analysis.level] ?? analysis.level}</Badge></TableCell>
                    <TableCell>{analysis.confidence != null ? `${Math.round(analysis.confidence * 100)}%` : '-'}</TableCell>
                    <TableCell>{analysis.dataQualityScore != null ? `${Math.round(analysis.dataQualityScore * 100)}%` : '-'}</TableCell>
                    <TableCell><Badge variant="outline">{statusLabels[analysis.status] ?? analysis.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{analysis.processingTimeMs ? `${analysis.processingTimeMs}ms` : '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{analysis.completedAt ? new Date(analysis.completedAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>
                      {expandedId === analysis.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </TableCell>
                  </TableRow>
                  {expandedId === analysis.id && (
                    <TableRow key={`${analysis.id}-detail`}>
                      <TableCell colSpan={9} className="bg-muted/30 p-4">
                        <AnalysisDetail analysis={analysis} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={triggerDialogOpen} onOpenChange={setTriggerDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>手动触发分析</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={selectedAlertId} onValueChange={setSelectedAlertId}>
              <SelectTrigger><SelectValue placeholder="选择告警" /></SelectTrigger>
              <SelectContent>
                {alertsData?.items.map((alert) => (
                  <SelectItem key={alert.id} value={alert.id}>
                    {alert.alertCode} — {alert.metric} = {alert.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTriggerDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button disabled={!selectedAlertId || triggerAnalysis.isPending} onClick={handleTrigger}>
                {triggerAnalysis.isPending ? t('common.loading') : '触发分析'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 4: 更新 App.tsx 路由**

在 `frontend/src/App.tsx` 中：
1. 添加 `import AnalysesPage from './pages/AnalysesPage';`
2. 将 `/analyses` 路由的占位元素替换为 `<AnalysesPage />`

- [ ] **Step 5: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add frontend/src/components/analysis/ frontend/src/pages/AnalysesPage.tsx frontend/src/App.tsx
git commit -m "feat: add AI analysis page with confidence meter, detail expansion and manual trigger

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: 系统设置页

**Files:**
- Create: `frontend/src/pages/SettingsPage.tsx`
- Modify: `frontend/src/App.tsx` — 替换设置路由占位

- [ ] **Step 1: 创建 SettingsPage**

`frontend/src/pages/SettingsPage.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

const roles = ['system_admin', 'maintenance_lead', 'technician', 'operator', 'viewer'];
const permissions = ['设备管理', '告警管理', '工单管理', '知识库', '报表', 'AI 分析'];

// RBAC 权限矩阵（只读展示）
const rbacMatrix: Record<string, Record<string, string>> = {
  system_admin:     { '设备管理': 'CRUD', '告警管理': 'CRUD', '工单管理': 'CRUD', '知识库': 'CRUD', '报表': 'R', 'AI 分析': 'CRUD' },
  maintenance_lead: { '设备管理': 'RW', '告警管理': 'RW+配置', '工单管理': 'RW+派工验收', '知识库': 'RW+验证', '报表': 'R', 'AI 分析': 'R' },
  technician:       { '设备管理': 'R', '告警管理': 'R+确认', '工单管理': 'R+执行', '知识库': 'R', '报表': '-', 'AI 分析': 'R+查询' },
  operator:         { '设备管理': 'R', '告警管理': 'R+确认', '工单管理': 'R', '知识库': '-', '报表': 'R', 'AI 分析': 'R+查询' },
  viewer:           { '设备管理': 'R', '告警管理': 'R', '工单管理': 'R', '知识库': 'R', '报表': 'R', 'AI 分析': '-' },
};

const roleLabels: Record<string, string> = {
  system_admin: '系统管理员',
  maintenance_lead: '维保主管',
  technician: '技术员',
  operator: '操作员',
  viewer: '观察者',
};

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">{t('settings.users')}</TabsTrigger>
          <TabsTrigger value="roles">{t('settings.roles')}</TabsTrigger>
          <TabsTrigger value="llm">{t('settings.llm')}</TabsTrigger>
          <TabsTrigger value="system">{t('settings.system')}</TabsTrigger>
        </TabsList>

        {/* 用户管理 */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.users')}</CardTitle>
              <CardDescription>管理系统用户账号</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户名</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      用户管理功能需要后端 /api/v1/users API 完整实现
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 角色权限 */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.roles')}</CardTitle>
              <CardDescription>RBAC 权限矩阵（只读）</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>权限 / 角色</TableHead>
                    {roles.map((role) => (
                      <TableHead key={role}>{roleLabels[role]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm}>
                      <TableCell className="font-medium">{perm}</TableCell>
                      {roles.map((role) => (
                        <TableCell key={role}>
                          <Badge variant="outline" className={
                            rbacMatrix[role][perm].includes('CRUD') ? 'border-green-500/30 text-green-500' :
                            rbacMatrix[role][perm].includes('RW') ? 'border-blue-500/30 text-blue-500' :
                            rbacMatrix[role][perm] === 'R' ? 'border-gray-500/30 text-gray-500' :
                            'border-red-500/30 text-red-500'
                          }>
                            {rbacMatrix[role][perm]}
                          </Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM 配置 */}
        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.llm')}</CardTitle>
              <CardDescription>配置 LLM 服务参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>模型 ID</Label>
                  <Input defaultValue="glm-5" placeholder="模型标识" />
                </div>
                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input defaultValue="https://dashscope.aliyuncs.com/api/v1" placeholder="API 端点" />
                </div>
                <div className="space-y-2">
                  <Label>超时时间（秒）</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>最大 Token 数</Label>
                  <Input type="number" defaultValue="4096" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>{t('common.save')}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统参数 */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.system')}</CardTitle>
              <CardDescription>全局系统参数配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>告警冷却时间（秒）</Label>
                  <Input type="number" defaultValue="300" />
                </div>
                <div className="space-y-2">
                  <Label>聚合窗口（分钟）</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>最大聚合次数</Label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label>数据保留天数</Label>
                  <Input type="number" defaultValue="90" />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button>{t('common.save')}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: 更新 App.tsx 路由**

在 `frontend/src/App.tsx` 中：
1. 添加 `import SettingsPage from './pages/SettingsPage';`
2. 将 `/settings` 路由的占位元素替换为 `<SettingsPage />`

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/SettingsPage.tsx frontend/src/App.tsx
git commit -m "feat: add SettingsPage with users, RBAC matrix, LLM config and system params

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## 自检清单

| 规格要求 | 对应任务 |
|---------|---------|
| 工单 Hooks（CRUD + 生命周期操作） | Task 1 |
| 分析 Hooks（查询 + 手动触发） | Task 1 |
| PriorityBadge 组件 | Task 2 |
| WorkOrderForm 组件 | Task 2 |
| StatusTimeline 组件 | Task 2 |
| 工单列表页（搜索 + 筛选 + 新建） | Task 3 |
| 工单详情页（状态操作 + 审计时间线） | Task 4 |
| ConfidenceMeter 组件 | Task 5 |
| AnalysisDetail 组件 | Task 5 |
| AI 分析页（筛选 + 展开详情 + 手动触发） | Task 5 |
| 设置页（用户/角色/LLM/系统 4 个 Tab） | Task 6 |
