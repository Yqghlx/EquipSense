# Phase 1 前端 — 子计划 B：设备 + 告警页面 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现仪表盘、设备管理（列表+详情）、告警中心、告警规则页面，包含 ECharts 图表组件、所有相关 Hooks 和业务组件。完成后能浏览设备、查看告警、配置规则。

**Architecture:** 在子计划 A 的基础设施之上，按「数据层 → 组件层 → 页面层」顺序构建。先补全后端遥测查询 API，再创建 TanStack Query Hooks 和 ECharts 图表组件，最后组装各页面。每个页面都是独立可运行的增量。

**Tech Stack:** React 19, TypeScript, TanStack Query v5, ECharts (echarts-for-react), React Hook Form + Zod, shadcn/ui

**Depends on:** 子计划 A（项目骨架 + 基础设施）

**Spec:** `docs/superpowers/specs/2026-06-01-phase1-frontend-design.md`

---

## 文件结构（子计划 B）

```
新增/修改文件：

后端（遥测查询 API 补全）：
├── src/EquipAI.Application/Telemetry/TelemetryQueryService.cs  — 遥测数据查询服务
├── src/EquipAI.WebAPI/Controllers/TelemetryController.cs        — 新增 GET 端点

前端：
frontend/src/
├── hooks/
│   ├── useDevices.ts          — 设备 CRUD Hooks
│   ├── useTelemetry.ts        — 遥测数据 Hook
│   ├── useAlerts.ts           — 告警查询 + 操作 Hooks
│   └── useAlertRules.ts       — 告警规则 CRUD Hooks
├── components/
│   ├── charts/
│   │   ├── TrendChart.tsx     — 折线/面积趋势图
│   │   ├── PieChart.tsx       — 饼图
│   │   └── GaugeChart.tsx     — 仪表盘图
│   ├── device/
│   │   ├── DeviceForm.tsx     — 设备新建/编辑表单
│   │   └── DeviceStatusBadge.tsx — 设备状态徽标
│   └── alert/
│       ├── AlertDetailDrawer.tsx — 告警详情抽屉
│       └── SeverityBadge.tsx     — 告警级别徽标
└── pages/
    ├── DashboardPage.tsx       — 仪表盘
    ├── DeviceListPage.tsx      — 设备列表
    ├── DeviceDetailPage.tsx    — 设备详情
    ├── AlertCenterPage.tsx     — 告警中心
    └── AlertRulesPage.tsx      — 告警规则配置
```

---

### Task 1: 后端 — 遥测数据查询 API

**Files:**
- Create: `src/EquipAI.Application/Telemetry/TelemetryQueryService.cs`
- Modify: `src/EquipAI.WebAPI/Controllers/TelemetryController.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`

- [ ] **Step 1: 创建遥测查询 DTO**

在 `src/EquipAI.Application/Telemetry/` 下新建 `TelemetryQueryService.cs`:

```csharp
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Telemetry;

/// <summary>
/// 遥测数据查询 DTO
/// </summary>
public record TelemetryDataPoint(DateTime Timestamp, double Value);

/// <summary>
/// 遥测数据查询服务
/// </summary>
public class TelemetryQueryService
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<TelemetryQueryService> _logger;

    public TelemetryQueryService(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        ILogger<TelemetryQueryService> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// 查询设备遥测历史数据
    /// </summary>
    public async Task<List<TelemetryDataPoint>> QueryAsync(
        Guid deviceId, string metric, DateTime startTime, DateTime endTime)
    {
        _logger.LogInformation("查询设备 {DeviceId} 指标 {Metric} 的遥测数据", deviceId, metric);

        return await _dbContext.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId
                     && t.TenantId == _tenantContext.TenantId
                     && t.Metric == metric
                     && t.Time >= startTime
                     && t.Time <= endTime)
            .OrderBy(t => t.Time)
            .Select(t => new TelemetryDataPoint(t.Time, t.Value ?? 0))
            .ToListAsync();
    }

    /// <summary>
    /// 查询设备最新遥测数据
    /// </summary>
    public async Task<Dictionary<string, double>> GetLatestAsync(Guid deviceId)
    {
        var metrics = await _dbContext.DeviceTelemetry
            .Where(t => t.DeviceId == deviceId
                     && t.TenantId == _tenantContext.TenantId)
            .GroupBy(t => t.Metric)
            .Select(g => new { Metric = g.Key, Value = g.Max(t => t.Time) })
            .ToListAsync();

        var result = new Dictionary<string, double>();
        foreach (var m in metrics)
        {
            var latestPoint = await _dbContext.DeviceTelemetry
                .Where(t => t.DeviceId == deviceId
                         && t.TenantId == _tenantContext.TenantId
                         && t.Metric == m.Metric
                         && t.Time == m.Value)
                .Select(t => t.Value ?? 0)
                .FirstOrDefaultAsync();
            result[m.Metric] = latestPoint;
        }

        return result;
    }
}
```

- [ ] **Step 2: 修改 TelemetryController 添加 GET 端点**

在 `src/EquipAI.WebAPI/Controllers/TelemetryController.cs` 中添加 GET 端点:

```csharp
// 在已有的 TelemetryController 类中添加以下方法：

/// <summary>
/// 查询设备遥测历史数据
/// </summary>
[HttpGet("{deviceId:guid}")]
public async Task<IActionResult> GetTelemetry(
    Guid deviceId,
    [FromQuery] string? metric,
    [FromQuery] DateTime? startTime,
    [FromQuery] DateTime? endTime)
{
    var end = endTime ?? DateTime.UtcNow;
    var start = startTime ?? end.AddHours(-1);

    if (string.IsNullOrEmpty(metric))
    {
        // 返回最新数据
        var latest = await _queryService.GetLatestAsync(deviceId);
        return Ok(latest);
    }

    var data = await _queryService.QueryAsync(deviceId, metric, start, end);
    return Ok(data);
}
```

需要在 Controller 中注入 `TelemetryQueryService`:
```csharp
private readonly TelemetryQueryService _queryService;

// 构造函数中添加:
public TelemetryController(..., TelemetryQueryService queryService)
{
    _queryService = queryService;
}
```

- [ ] **Step 3: 注册服务**

在 `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` 中添加:
```csharp
services.AddScoped<Application.Telemetry.TelemetryQueryService>();
```

- [ ] **Step 4: 编译验证**

```bash
cd src/EquipAI.WebAPI && dotnet build
```
Expected: 编译成功，无错误

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Application/Telemetry/TelemetryQueryService.cs src/EquipAI.WebAPI/Controllers/TelemetryController.cs src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat: add telemetry query API endpoint for frontend charts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: TanStack Query Hooks（设备 + 遥测 + 告警 + 告警规则）

**Files:**
- Create: `frontend/src/hooks/useDevices.ts`
- Create: `frontend/src/hooks/useTelemetry.ts`
- Create: `frontend/src/hooks/useAlerts.ts`
- Create: `frontend/src/hooks/useAlertRules.ts`

- [ ] **Step 1: 创建设备 Hooks**

`frontend/src/hooks/useDevices.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Device, PagedResult, PagedQuery, CreateDeviceRequest } from '../types';

export function useDevices(query: PagedQuery & { status?: string; deviceType?: string }) {
  return useQuery({
    queryKey: ['devices', query],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.sort) params.set('sort', query.sort);
      if (query.order) params.set('order', query.order);
      if (query.status) params.set('status', query.status);
      if (query.deviceType) params.set('deviceType', query.deviceType);
      const { data } = await api.get<PagedResult<Device>>('/devices?' + params);
      return data;
    },
  });
}

export function useDevice(id: string) {
  return useQuery({
    queryKey: ['devices', id],
    queryFn: async () => {
      const { data } = await api.get<Device>(`/devices/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateDeviceRequest) => {
      const { data } = await api.post<Device>('/devices', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: CreateDeviceRequest & { id: string }) => {
      const { data } = await api.put<Device>(`/devices/${id}`, req);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['devices', variables.id] });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
```

- [ ] **Step 2: 创建遥测数据 Hook**

`frontend/src/hooks/useTelemetry.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface TelemetryDataPoint {
  timestamp: string;
  value: number;
}

export function useTelemetry(
  deviceId: string,
  metric?: string,
  startTime?: string,
  endTime?: string,
) {
  return useQuery({
    queryKey: ['telemetry', deviceId, metric, startTime, endTime],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (metric) params.set('metric', metric);
      if (startTime) params.set('startTime', startTime);
      if (endTime) params.set('endTime', endTime);
      const { data } = await api.get<TelemetryDataPoint[] | Record<string, number>>(
        `/telemetry/${deviceId}?${params}`,
      );
      return data;
    },
    enabled: !!deviceId,
    staleTime: 10_000,
  });
}
```

- [ ] **Step 3: 创建告警 Hooks**

`frontend/src/hooks/useAlerts.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Alert, PagedResult, PagedQuery } from '../types';

interface AlertFilters {
  status?: string;
  severity?: string;
  deviceId?: string;
}

export function useAlerts(query: PagedQuery, filters?: AlertFilters) {
  return useQuery({
    queryKey: ['alerts', query, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.sort) params.set('sort', query.sort);
      if (query.order) params.set('order', query.order);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.severity) params.set('severity', filters.severity);
      if (filters?.deviceId) params.set('deviceId', filters.deviceId);
      const { data } = await api.get<PagedResult<Alert>>('/alerts?' + params);
      return data;
    },
  });
}

export function useAlert(id: string) {
  return useQuery({
    queryKey: ['alerts', id],
    queryFn: async () => {
      const { data } = await api.get<Alert>(`/alerts/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/alerts/${id}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/alerts/${id}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

- [ ] **Step 4: 创建告警规则 Hooks**

`frontend/src/hooks/useAlertRules.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { AlertRule, PagedResult, PagedQuery, CreateAlertRuleRequest } from '../types';

export function useAlertRules(query: PagedQuery & { keyword?: string }) {
  return useQuery({
    queryKey: ['alert-rules', query],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.keyword) params.set('keyword', query.keyword);
      const { data } = await api.get<PagedResult<AlertRule>>('/alert-rules?' + params);
      return data;
    },
  });
}

export function useAlertRule(id: string) {
  return useQuery({
    queryKey: ['alert-rules', id],
    queryFn: async () => {
      const { data } = await api.get<AlertRule>(`/alert-rules/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateAlertRuleRequest) => {
      const { data } = await api.post<AlertRule>('/alert-rules', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

export function useUpdateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: CreateAlertRuleRequest & { id: string }) => {
      const { data } = await api.put<AlertRule>(`/alert-rules/${id}`, req);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      queryClient.invalidateQueries({ queryKey: ['alert-rules', variables.id] });
    },
  });
}

export function useDeleteAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/alert-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}
```

- [ ] **Step 5: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add frontend/src/hooks/useDevices.ts frontend/src/hooks/useTelemetry.ts frontend/src/hooks/useAlerts.ts frontend/src/hooks/useAlertRules.ts
git commit -m "feat: add TanStack Query hooks for devices, telemetry, alerts and alert rules

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: ECharts 图表组件

**Files:**
- Create: `frontend/src/components/charts/TrendChart.tsx`
- Create: `frontend/src/components/charts/PieChart.tsx`
- Create: `frontend/src/components/charts/GaugeChart.tsx`

- [ ] **Step 1: 创建 TrendChart**

`frontend/src/components/charts/TrendChart.tsx`:
```tsx
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../hooks/useTheme';

interface TrendChartProps {
  title?: string;
  data: Array<{ time: string; value: number }>;
  color?: string;
  height?: number;
}

export function TrendChart({ title, data, color = '#3b82f6', height = 300 }: TrendChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const option = {
    backgroundColor: 'transparent',
    title: title
      ? { text: title, textStyle: { color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 14 } }
      : undefined,
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: isDark ? '#1e293b' : '#fff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    grid: { left: 50, right: 20, top: title ? 40 : 20, bottom: 30 },
    xAxis: {
      type: 'time' as const,
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
    },
    series: [
      {
        type: 'line' as const,
        data: data.map((d) => [d.time, d.value]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '05' },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
```

- [ ] **Step 2: 创建 PieChart**

`frontend/src/components/charts/PieChart.tsx`:
```tsx
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../hooks/useTheme';

interface PieDataItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  title?: string;
  data: PieDataItem[];
  height?: number;
}

const defaultColors = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6'];

export function PieChart({ title, data, height = 300 }: PieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const option = {
    backgroundColor: 'transparent',
    title: title
      ? { text: title, textStyle: { color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 14 } }
      : undefined,
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: isDark ? '#1e293b' : '#fff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    legend: {
      bottom: 0,
      textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 },
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: isDark ? '#0f172a' : '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color ?? defaultColors[i % defaultColors.length] },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
```

- [ ] **Step 3: 创建 GaugeChart**

`frontend/src/components/charts/GaugeChart.tsx`:
```tsx
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../hooks/useTheme';

interface GaugeChartProps {
  value: number;
  max?: number;
  title?: string;
  color?: string;
  height?: number;
}

export function GaugeChart({ value, max = 100, title, color = '#3b82f6', height = 200 }: GaugeChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge' as const,
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max,
        progress: { show: true, width: 12, itemStyle: { color } },
        axisLine: { lineStyle: { width: 12, color: [[1, isDark ? '#1e293b' : '#e2e8f0']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: !!title, offsetCenter: [0, '70%'], fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' },
        detail: {
          valueAnimation: true,
          fontSize: 24,
          fontWeight: 'bold',
          color: isDark ? '#e2e8f0' : '#1e293b',
          offsetCenter: [0, '30%'],
          formatter: `{value}${max === 100 ? '%' : ''}`,
        },
        data: [{ value, name: title }],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
```

- [ ] **Step 4: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/charts/
git commit -m "feat: add ECharts components - TrendChart, PieChart and GaugeChart

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: 设备 + 告警业务组件

**Files:**
- Create: `frontend/src/components/device/DeviceStatusBadge.tsx`
- Create: `frontend/src/components/device/DeviceForm.tsx`
- Create: `frontend/src/components/alert/SeverityBadge.tsx`
- Create: `frontend/src/components/alert/AlertDetailDrawer.tsx`

- [ ] **Step 1: 创建 DeviceStatusBadge**

`frontend/src/components/device/DeviceStatusBadge.tsx`:
```tsx
import { Badge } from '../ui/badge';
import { useTranslation } from 'react-i18next';

const statusStyles: Record<string, string> = {
  online: 'bg-green-500/10 text-green-500 border-green-500/20',
  offline: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  maintenance: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

interface DeviceStatusBadgeProps {
  status: string;
}

export function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const { t } = useTranslation();
  const label = t(`device.${status}` as 'device.online' | 'device.offline' | 'device.maintenance');
  return (
    <Badge variant="outline" className={statusStyles[status] ?? ''}>
      {label}
    </Badge>
  );
}
```

- [ ] **Step 2: 创建 DeviceForm**

`frontend/src/components/device/DeviceForm.tsx`:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Device, CreateDeviceRequest } from '../../types';

const deviceSchema = z.object({
  deviceCode: z.string().min(1, '请输入设备编码'),
  name: z.string().min(1, '请输入设备名称'),
  deviceType: z.string().min(1, '请选择设备类型'),
  location: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

const deviceTypes = ['pump', 'motor', 'valve', 'sensor', 'plc', 'other'];

interface DeviceFormProps {
  device?: Device;
  onSubmit: (data: CreateDeviceRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeviceForm({ device, onSubmit, onCancel, loading }: DeviceFormProps) {
  const { t } = useTranslation();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: device
      ? { deviceCode: device.deviceCode, name: device.name, deviceType: device.deviceType, location: device.location }
      : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>{t('device.deviceCode')}</Label>
        <Input {...register('deviceCode')} placeholder={t('device.deviceCode')} />
        {errors.deviceCode && <p className="text-sm text-destructive">{errors.deviceCode.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{t('device.name')}</Label>
        <Input {...register('name')} placeholder={t('device.name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{t('device.type')}</Label>
        <Select defaultValue={device?.deviceType} onValueChange={(v) => setValue('deviceType', v)}>
          <SelectTrigger><SelectValue placeholder={t('device.type')} /></SelectTrigger>
          <SelectContent>
            {deviceTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.deviceType && <p className="text-sm text-destructive">{errors.deviceType.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{t('device.location')}</Label>
        <Input {...register('location')} placeholder={t('device.location')} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading}>{loading ? t('common.loading') : t('common.save')}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: 创建 SeverityBadge**

`frontend/src/components/alert/SeverityBadge.tsx`:
```tsx
import { Badge } from '../ui/badge';
import { useTranslation } from 'react-i18next';

const severityStyles: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

interface SeverityBadgeProps {
  severity: string;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={severityStyles[severity] ?? ''}>
      {t(`alert.${severity}` as 'alert.critical' | 'alert.high' | 'alert.normal' | 'alert.low')}
    </Badge>
  );
}
```

- [ ] **Step 4: 创建 AlertDetailDrawer**

`frontend/src/components/alert/AlertDetailDrawer.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { SeverityBadge } from './SeverityBadge';
import type { Alert } from '../../types';

interface AlertDetailDrawerProps {
  alert: Alert | null;
  open: boolean;
  onClose: () => void;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
}

export function AlertDetailDrawer({ alert, open, onClose, onAcknowledge, onResolve }: AlertDetailDrawerProps) {
  const { t } = useTranslation();

  if (!alert) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{alert.alertCode}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={alert.severity} />
            <Badge variant="outline">{t(`alert.${alert.status}` as 'alert.active' | 'alert.acknowledged' | 'alert.resolved')}</Badge>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t('device.name')}</p>
              <p className="font-medium">{alert.deviceName ?? '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('alert.metric')}</p>
              <p className="font-medium">{alert.metric}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('alert.value')}</p>
              <p className="font-medium">{alert.value}</p>
            </div>
            <div>
              <p className="text-muted-foreground">阈值</p>
              <p className="font-medium">-</p>
            </div>
            <div>
              <p className="text-muted-foreground">触发时间</p>
              <p className="font-medium">{new Date(alert.triggeredAt).toLocaleString()}</p>
            </div>
            {alert.acknowledgedAt && (
              <div>
                <p className="text-muted-foreground">确认时间</p>
                <p className="font-medium">{new Date(alert.acknowledgedAt).toLocaleString()}</p>
              </div>
            )}
            {alert.resolvedAt && (
              <div>
                <p className="text-muted-foreground">解决时间</p>
                <p className="font-medium">{new Date(alert.resolvedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
          {alert.status === 'active' && (
            <div className="flex gap-2 pt-2">
              {onAcknowledge && (
                <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert.id)}>
                  {t('alert.acknowledge')}
                </Button>
              )}
              {onResolve && (
                <Button size="sm" onClick={() => onResolve(alert.id)}>
                  {t('alert.resolve')}
                </Button>
              )}
            </div>
          )}
          {alert.status === 'acknowledged' && onResolve && (
            <div className="pt-2">
              <Button size="sm" onClick={() => onResolve(alert.id)}>
                {t('alert.resolve')}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 5: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 6: 提交**

```bash
git add frontend/src/components/device/ frontend/src/components/alert/
git commit -m "feat: add device and alert components - forms, badges and detail drawer

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: 设备列表页

**Files:**
- Create: `frontend/src/pages/DeviceListPage.tsx`
- Modify: `frontend/src/App.tsx` — 替换设备路由占位

- [ ] **Step 1: 创建 DeviceListPage**

`frontend/src/pages/DeviceListPage.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DeviceStatusBadge } from '../components/device/DeviceStatusBadge';
import { DeviceForm } from '../components/device/DeviceForm';
import { useDevices, useCreateDevice, useUpdateDevice, useDeleteDevice } from '../hooks/useDevices';
import type { CreateDeviceRequest, Device } from '../types';

export default function DeviceListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | undefined>();

  const { data, isLoading } = useDevices({ page, pageSize: 20, status: status || undefined });
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  const handleSubmit = async (req: CreateDeviceRequest) => {
    if (editingDevice) {
      await updateDevice.mutateAsync({ ...req, id: editingDevice.id });
    } else {
      await createDevice.mutateAsync(req);
    }
    setDialogOpen(false);
    setEditingDevice(undefined);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('common.confirm') + '?')) {
      await deleteDevice.mutateAsync(id);
    }
  };

  const filteredDevices = data?.items.filter(
    (d) => !search || d.name.includes(search) || d.deviceCode.includes(search),
  ) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('device.title')}</h1>
        <Button onClick={() => { setEditingDevice(undefined); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />{t('common.create')}
        </Button>
      </div>

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
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="online">{t('device.online')}</SelectItem>
            <SelectItem value="offline">{t('device.offline')}</SelectItem>
            <SelectItem value="maintenance">{t('device.maintenance')}</SelectItem>
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
                <TableHead>{t('device.deviceCode')}</TableHead>
                <TableHead>{t('device.name')}</TableHead>
                <TableHead>{t('device.type')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('device.lastCommunicatedAt')}</TableHead>
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
                    <TableCell>{device.deviceType}</TableCell>
                    <TableCell><DeviceStatusBadge status={device.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.lastCommunicatedAt ? new Date(device.lastCommunicatedAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/devices/${device.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingDevice(device); setDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(device.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
    </div>
  );
}
```

- [ ] **Step 2: 更新 App.tsx 路由**

在 `frontend/src/App.tsx` 中：
1. 添加 `import DeviceListPage from './pages/DeviceListPage';`
2. 将 `/devices` 路由的占位元素替换为 `<DeviceListPage />`

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/DeviceListPage.tsx frontend/src/App.tsx
git commit -m "feat: add DeviceListPage with CRUD, search and filter

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: 设备详情页

**Files:**
- Create: `frontend/src/pages/DeviceDetailPage.tsx`
- Modify: `frontend/src/App.tsx` — 替换设备详情路由占位

- [ ] **Step 1: 创建 DeviceDetailPage**

`frontend/src/pages/DeviceDetailPage.tsx`:
```tsx
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
    ? (telemetry as TelemetryDataPoint[]).map((p) => ({ time: p.timestamp, value: p.value }))
    : [];

  return (
    <div className="space-y-6">
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

      {/* 设备基本信息 */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
          <div><p className="text-sm text-muted-foreground">{t('device.type')}</p><p className="font-medium">{device.deviceType}</p></div>
          <div><p className="text-sm text-muted-foreground">{t('device.location')}</p><p className="font-medium">{device.location ?? '-'}</p></div>
          <div><p className="text-sm text-muted-foreground">{t('common.status')}</p><DeviceStatusBadge status={device.status} /></div>
          <div><p className="text-sm text-muted-foreground">{t('device.lastCommunicatedAt')}</p><p className="font-medium">{device.lastCommunicatedAt ? new Date(device.lastCommunicatedAt).toLocaleString() : '-'}</p></div>
        </CardContent>
      </Card>

      {/* 遥测数据趋势图 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">遥测趋势</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="temperature">温度</SelectItem>
                <SelectItem value="pressure">压力</SelectItem>
                <SelectItem value="vibration">振动</SelectItem>
                <SelectItem value="humidity">湿度</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
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

      {/* 最近告警 */}
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
                    <TableCell className="text-sm text-muted-foreground">{new Date(alert.triggeredAt).toLocaleString()}</TableCell>
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
```

- [ ] **Step 2: 更新 App.tsx 路由**

在 `frontend/src/App.tsx` 中：
1. 添加 `import DeviceDetailPage from './pages/DeviceDetailPage';`
2. 将 `/devices/:id` 路由的占位元素替换为 `<DeviceDetailPage />`

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/DeviceDetailPage.tsx frontend/src/App.tsx
git commit -m "feat: add DeviceDetailPage with telemetry charts and alert list

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: 告警中心页

**Files:**
- Create: `frontend/src/pages/AlertCenterPage.tsx`
- Modify: `frontend/src/App.tsx` — 替换告警路由占位

- [ ] **Step 1: 创建 AlertCenterPage**

`frontend/src/pages/AlertCenterPage.tsx`:
```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { AlertDetailDrawer } from '../components/alert/AlertDetailDrawer';
import { SeverityBadge } from '../components/alert/SeverityBadge';
import { useAlerts, useAcknowledgeAlert, useResolveAlert } from '../hooks/useAlerts';
import type { Alert } from '../types';

export default function AlertCenterPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useAlerts(
    { page, pageSize: 20 },
    { status: status || undefined, severity: severity || undefined },
  );
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  const handleRowClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('alert.title')}</h1>

      <div className="flex gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">{t('alert.active')}</SelectItem>
            <SelectItem value="acknowledged">{t('alert.acknowledged')}</SelectItem>
            <SelectItem value="resolved">{t('alert.resolved')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={(v) => { setSeverity(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder={t('alert.severity')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="critical">{t('alert.critical')}</SelectItem>
            <SelectItem value="high">{t('alert.high')}</SelectItem>
            <SelectItem value="normal">{t('alert.normal')}</SelectItem>
            <SelectItem value="low">{t('alert.low')}</SelectItem>
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
                <TableHead>{t('alert.alertCode')}</TableHead>
                <TableHead>{t('device.name')}</TableHead>
                <TableHead>{t('alert.metric')}</TableHead>
                <TableHead>{t('alert.value')}</TableHead>
                <TableHead>{t('alert.severity')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>触发时间</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
              ) : (
                data?.items.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(alert)}
                  >
                    <TableCell className="font-mono text-sm">{alert.alertCode}</TableCell>
                    <TableCell>{alert.deviceName ?? '-'}</TableCell>
                    <TableCell>{alert.metric}</TableCell>
                    <TableCell>{alert.value}</TableCell>
                    <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-sm">
                        {t(`alert.${alert.status}` as 'alert.active' | 'alert.acknowledged' | 'alert.resolved')}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(alert.triggeredAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {alert.status === 'active' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => acknowledgeAlert.mutate(alert.id)}>
                              {t('alert.acknowledge')}
                            </Button>
                            <Button size="sm" onClick={() => resolveAlert.mutate(alert.id)}>
                              {t('alert.resolve')}
                            </Button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button size="sm" onClick={() => resolveAlert.mutate(alert.id)}>
                            {t('alert.resolve')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
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

      <AlertDetailDrawer
        alert={selectedAlert}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAcknowledge={(id) => { acknowledgeAlert.mutate(id); setDrawerOpen(false); }}
        onResolve={(id) => { resolveAlert.mutate(id); setDrawerOpen(false); }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 更新 App.tsx 路由**

在 `frontend/src/App.tsx` 中：
1. 添加 `import AlertCenterPage from './pages/AlertCenterPage';`
2. 将 `/alerts` 路由的占位元素替换为 `<AlertCenterPage />`

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/AlertCenterPage.tsx frontend/src/App.tsx
git commit -m "feat: add AlertCenterPage with filter, drawer and actions

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: 告警规则页

**Files:**
- Create: `frontend/src/pages/AlertRulesPage.tsx`
- Modify: `frontend/src/App.tsx` — 替换告警规则路由占位

- [ ] **Step 1: 创建 AlertRulesPage**

`frontend/src/pages/AlertRulesPage.tsx`:
```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { SeverityBadge } from '../components/alert/SeverityBadge';
import { Badge } from '../components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule } from '../hooks/useAlertRules';
import type { CreateAlertRuleRequest, AlertRule } from '../types';

const ruleSchema = z.object({
  name: z.string().min(1, '请输入规则名称'),
  metric: z.string().min(1, '请输入指标名称'),
  ruleType: z.enum(['threshold', 'composite', 'baseline']),
  operator: z.string().optional(),
  threshold: z.coerce.number().optional(),
  baselineStddevMultiplier: z.coerce.number().optional(),
  severity: z.enum(['critical', 'high', 'normal', 'low']),
  cooldownSeconds: z.coerce.number().min(0),
  autoCreateWorkorder: z.boolean(),
  enabled: z.boolean(),
});

type RuleFormData = z.infer<typeof ruleSchema>;

export default function AlertRulesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | undefined>();

  const { data, isLoading } = useAlertRules({ page, pageSize: 20, keyword: keyword || undefined });
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();
  const deleteRule = useDeleteAlertRule();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.alertRules')}</h1>
        <Button onClick={() => { setEditingRule(undefined); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />{t('common.create')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 max-w-sm" placeholder={t('common.search') + '...'} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>指标</TableHead>
              <TableHead>条件</TableHead>
              <TableHead>级别</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
            ) : (
              data?.items.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell><Badge variant="outline">{rule.ruleType}</Badge></TableCell>
                  <TableCell>{rule.metric}</TableCell>
                  <TableCell className="text-sm">
                    {rule.ruleType === 'threshold' && `${rule.operator} ${rule.threshold}`}
                    {rule.ruleType === 'baseline' && `${rule.baselineStddevMultiplier}σ`}
                    {rule.ruleType === 'composite' && '多条件'}
                  </TableCell>
                  <TableCell><SeverityBadge severity={rule.severity} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.enabled} disabled />
                      <span className="text-sm">{rule.enabled ? '启用' : '禁用'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingRule(rule); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (window.confirm(t('common.confirm') + '?')) deleteRule.mutate(rule.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <RuleDialog
        open={dialogOpen}
        rule={editingRule}
        onClose={() => { setDialogOpen(false); setEditingRule(undefined); }}
        onSubmit={async (req) => {
          if (editingRule) {
            await updateRule.mutateAsync({ ...req, id: editingRule.id });
          } else {
            await createRule.mutateAsync(req);
          }
          setDialogOpen(false);
          setEditingRule(undefined);
        }}
        loading={createRule.isPending || updateRule.isPending}
      />
    </div>
  );
}

interface RuleDialogProps {
  open: boolean;
  rule?: AlertRule;
  onClose: () => void;
  onSubmit: (req: CreateAlertRuleRequest) => Promise<void>;
  loading?: boolean;
}

function RuleDialog({ open, rule, onClose, onSubmit, loading }: RuleDialogProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: rule
      ? {
          name: rule.name, metric: rule.metric, ruleType: rule.ruleType as 'threshold',
          operator: rule.operator ?? '', threshold: rule.threshold,
          baselineStddevMultiplier: rule.baselineStddevMultiplier,
          severity: rule.severity as 'normal', cooldownSeconds: rule.cooldownSeconds,
          autoCreateWorkorder: rule.autoCreateWorkorder, enabled: rule.enabled,
        }
      : { ruleType: 'threshold', severity: 'normal', cooldownSeconds: 300, autoCreateWorkorder: false, enabled: true },
  });

  const ruleType = watch('ruleType');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{rule ? t('common.edit') : t('common.create')}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>名称</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>规则类型</Label>
              <Select value={ruleType} onValueChange={(v) => setValue('ruleType', v as RuleFormData['ruleType'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="threshold">阈值</SelectItem>
                  <SelectItem value="composite">组合</SelectItem>
                  <SelectItem value="baseline">基线</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>指标</Label>
              <Input {...register('metric')} />
            </div>
          </div>
          {ruleType === 'threshold' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>运算符</Label>
                <Select onValueChange={(v) => setValue('operator', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GreaterThan">大于</SelectItem>
                    <SelectItem value="LessThan">小于</SelectItem>
                    <SelectItem value="GreaterThanOrEqual">大于等于</SelectItem>
                    <SelectItem value="LessThanOrEqual">小于等于</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>阈值</Label>
                <Input type="number" {...register('threshold')} />
              </div>
            </div>
          )}
          {ruleType === 'baseline' && (
            <div className="space-y-2">
              <Label>标准差倍数</Label>
              <Input type="number" step="0.5" {...register('baselineStddevMultiplier')} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>告警级别</Label>
              <Select value={watch('severity')} onValueChange={(v) => setValue('severity', v as RuleFormData['severity'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">紧急</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="normal">普通</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>冷却时间（秒）</Label>
              <Input type="number" {...register('cooldownSeconds')} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={watch('autoCreateWorkorder')} onCheckedChange={(v) => setValue('autoCreateWorkorder', v)} />
              <Label className="text-sm">自动创建工单</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={watch('enabled')} onCheckedChange={(v) => setValue('enabled', v)} />
              <Label className="text-sm">启用</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={loading}>{loading ? t('common.loading') : t('common.save')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

注意：`RuleDialog` 组件内部使用了 `t` 但没有通过 props 传递。需要在 `RuleDialog` 组件内添加 `const { t } = useTranslation();`。

- [ ] **Step 2: 更新 App.tsx 路由**

在 `frontend/src/App.tsx` 中：
1. 添加 `import AlertRulesPage from './pages/AlertRulesPage';`
2. 将 `/alert-rules` 路由的占位元素替换为 `<AlertRulesPage />`

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/AlertRulesPage.tsx frontend/src/App.tsx
git commit -m "feat: add AlertRulesPage with CRUD and dynamic form based on rule type

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: 仪表盘页

**Files:**
- Create: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/App.tsx` — 替换仪表盘路由占位

- [ ] **Step 1: 创建 DashboardPage**

`frontend/src/pages/DashboardPage.tsx`:
```tsx
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../components/ui/card';
import { TrendChart } from '../components/charts/TrendChart';
import { PieChart } from '../components/charts/PieChart';
import { SeverityBadge } from '../components/alert/SeverityBadge';
import { useDevices } from '../hooks/useDevices';
import { useAlerts } from '../hooks/useAlerts';
import { useWorkOrders } from '../hooks/useWorkOrders';
import { Wrench, AlertTriangle, ClipboardList, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { t } = useTranslation();

  const { data: devicesData } = useDevices({ page: 1, pageSize: 1 });
  const { data: onlineDevices } = useDevices({ page: 1, pageSize: 1, status: 'online' });
  const { data: alertsData } = useAlerts({ page: 1, pageSize: 10 }, { status: 'active' });
  const { data: workOrdersData } = useWorkOrders({ page: 1, pageSize: 1 }, { status: 'pending_dispatch' });

  const totalDevices = devicesData?.total ?? 0;
  const onlineCount = onlineDevices?.total ?? 0;
  const availability = totalDevices > 0 ? ((onlineCount / totalDevices) * 100).toFixed(1) : '0';

  const stats = [
    { label: t('device.online'), value: onlineCount, icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('alert.active'), value: alertsData?.total ?? 0, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: '待处理工单', value: workOrdersData?.total ?? 0, icon: ClipboardList, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: '设备可用率', value: `${availability}%`, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  // 设备状态分布
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

      {/* 图表区域 */}
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

      {/* 最近告警 */}
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
```

注意：`useWorkOrders` Hook 在子计划 C 中定义，这里提前引用。如果编译失败，可以先将仪表盘中工单统计部分注释掉，或在子计划 A 的 hooks 目录中创建一个临时空 Hook。建议在本任务前先完成子计划 C Task 1 的 useWorkOrders Hook。

- [ ] **Step 2: 更新 App.tsx 路由**

在 `frontend/src/App.tsx` 中：
1. 添加 `import DashboardPage from './pages/DashboardPage';`
2. 将 `/dashboard` 路由的占位元素替换为 `<DashboardPage />`

- [ ] **Step 3: 编译验证**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 提交**

```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/App.tsx
git commit -m "feat: add DashboardPage with stats cards, charts and recent alerts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## 自检清单

| 规格要求 | 对应任务 |
|---------|---------|
| 遥测数据查询 API（后端补全） | Task 1 |
| ECharts 图表组件（TrendChart + PieChart + GaugeChart） | Task 3 |
| 设备 Hooks（useDevices, useTelemetry） | Task 2 |
| 告警 Hooks（useAlerts, useAlertRules） | Task 2 |
| 设备组件（DeviceForm, DeviceStatusBadge） | Task 4 |
| 告警组件（SeverityBadge, AlertDetailDrawer） | Task 4 |
| 设备列表页（搜索 + 筛选 + DataTable + CRUD） | Task 5 |
| 设备详情页（基本信息 + 遥测趋势图 + 告警列表） | Task 6 |
| 告警中心页（筛选 + 操作 + 详情抽屉） | Task 7 |
| 告警规则页（列表 + 新建/编辑表单 + 启用/禁用） | Task 8 |
| 仪表盘（统计卡片 + 趋势图 + 饼图 + 最近告警） | Task 9 |

## 已知依赖

- **DashboardPage 引用 useWorkOrders**：该 Hook 在子计划 C Task 1 中定义。执行时建议先完成子计划 C 的 useWorkOrders Hook，或临时注释仪表盘中工单统计部分。
- **AlertRulesPage RuleDialog**：内部组件需要独立调用 `useTranslation()`，计划中已标注。
- **遥测图表数据**：依赖后端 Task 1 的 GET 端点。无数据时图表显示"暂无数据"占位。
