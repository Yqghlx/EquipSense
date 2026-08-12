# 设备对比页面实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已有设备对比 API 变成租户内只读用户可发现、可筛选、可解释的设备横向对比页面。

**Architecture:** 保留现有 `GET /api/v1/device-comparison` 默认“同类型全部设备”行为，新增可选重复 `deviceIds` 参数收窄到用户选择的 2–5 台设备。服务端显式叠加租户、设备类型和设备 ID 条件；前端新增懒加载页面与导航，复用现有设备列表、告警规则和对比 hook。页面展示统计快照，不新增趋势预测或告警写入。

**Tech Stack:** ASP.NET Core 8、EF Core、React 19、TypeScript strict、TanStack Query、React Router、react-i18next、Vitest、xUnit、FluentAssertions。

## Global Constraints

- 所有新增注释、测试描述和文档使用简体中文；用户可见文案同步维护 `zh.json` 与 `en.json`。
- 设备对比所有查询必须继续由后端认证租户上下文隔离；客户端不得传递 `tenantId`。
- 不改变无 `deviceIds` 的旧 API 语义；新增参数必须向后兼容。
- `deviceIds` 传入时只允许 2–5 个去重后的 UUID；跨租户/跨类型 ID 不得泄露存在性。
- 遥测查询保持批量读取，禁止恢复逐设备 N+1 查询。
- 不完整筛选条件不得触发对比 API；设备选择顺序变化不得产生重复查询缓存。
- 任何错误都必须和正常空态区分；有旧结果时错误刷新保留旧结果并显示重试。
- 前端验证命令均从 `frontend/` 执行，并通过 `check:i18n`、TypeScript、ESLint、全量 Vitest 和生产构建。

## Task 1: 先写后端 ID 过滤边界测试

**Files:**

- Modify: `tests/EquipAI.Tests.Unit/Analysis/DeviceComparisonServiceTests.cs`
- Modify: `tests/EquipAI.Tests.Integration/Controllers/DeviceComparisonControllerTests.cs`
- Read: `src/EquipAI.Application/Analysis/DeviceComparisonService.cs`
- Read: `src/EquipAI.WebAPI/Controllers/DeviceComparisonController.cs`

- [x] **Step 1: 增加服务层失败测试**

覆盖：传入 2 个选定设备只返回选定设备；传入同类型之外的设备不会进入结果；空/1 个/6 个 ID 被拒绝或得到明确参数异常；不传 ID 保留现有全类型行为。先运行聚焦测试，确认新契约因生产实现尚未支持而失败。

测试调用的目标签名为：

```csharp
Task<DeviceComparisonResult> CompareAsync(
    Guid tenantId,
    string deviceType,
    string metric,
    int hours = 24,
    IReadOnlyCollection<Guid>? deviceIds = null,
    CancellationToken ct = default);
```

- [x] **Step 2: 增加控制器参数校验测试**

验证重复 `deviceIds` 参数的最小/最大边界、非法 GUID 和超限返回 400；保留无认证 401 以及既有旧参数成功测试。

## Task 2: 实现后端可选设备筛选

**Files:**

- Modify: `src/EquipAI.Application/Analysis/DeviceComparisonService.cs`
- Modify: `src/EquipAI.WebAPI/Controllers/DeviceComparisonController.cs`
- Test: Task 1 files

- [x] **Step 1: 扩展接口与控制器绑定**

将 `IEnumerable<Guid>? deviceIds` 从控制器传入服务；控制器对去重后的数量、GUID 模型绑定和空值进行 fail-fast 校验，错误响应只包含字段名和范围，不回显租户或敏感信息。

控制器契约固定为：

```csharp
public async Task<ActionResult<DeviceComparisonResult>> Compare(
    [FromQuery] string deviceType,
    [FromQuery] string metric,
    [FromQuery] int hours = 24,
    [FromQuery] Guid[]? deviceIds = null,
    CancellationToken ct = default)
```

- [x] **Step 2: 在服务中叠加租户/类型/ID 条件**

设备候选查询先限定 `TenantId` 与 `Type`，有 `deviceIds` 时再限定 ID 集合；遥测查询复用筛选后的设备字典。若可见设备少于 2 台，返回现有业务消息，不透露被过滤设备是否存在。

- [x] **Step 3: 运行后端聚焦测试和 Release 构建**

运行设备对比服务/控制器测试，随后运行 `dotnet build EquipAI.sln --configuration Release --no-restore -m:1 --disable-build-servers`。

## Task 3: 先写前端 hook 和页面失败测试

**Files:**

- Create: `frontend/src/pages/__tests__/DeviceComparisonPage.i18n.test.tsx`
- Modify: `frontend/src/hooks/__tests__/useDeviceComparison.test.tsx`（若缺失则创建）
- Modify: `frontend/src/hooks/__tests__/useDevices.test.tsx`（若缺失则创建）
- Read: `frontend/src/pages/DeviceComparisonPage.tsx`

- [ ] **Step 1: 写 hook 契约测试**

验证 `deviceIds` 规范化排序、重复 ID 去重、查询字符串重复参数、条件不完整时禁用对比请求，以及设备列表 `deviceType` → `type`、`keyword` 映射。

前端 hook 契约固定为：

```ts
export interface DeviceComparisonQuery {
  deviceType?: string;
  metric?: string;
  hours?: number;
  deviceIds?: string[];
}

export function useDeviceComparison(params: DeviceComparisonQuery) { /* ... */ }
export function useDevices(
  query: PagedQuery & { status?: string; deviceType?: string; keyword?: string },
  options?: { enabled?: boolean },
) { /* ... */ }
```

- [ ] **Step 2: 写页面行为测试并观察红灯**

Mock 设备、模板、告警规则和对比 hook，覆盖英文标题/表头、2–5 选择限制、设备类型筛选、指标 datalist、时间窗口、加载/失败/缓存错误/数据不足/成功结果和无权限状态；页面尚不存在时确认得到缺失模块或行为断言红灯。

## Task 4: 实现前端页面与应用入口

**Files:**

- Create: `frontend/src/pages/DeviceComparisonPage.tsx`
- Modify: `frontend/src/hooks/useDeviceComparison.ts`
- Modify: `frontend/src/hooks/useDevices.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`
- Test: Task 3 files

- [ ] **Step 1: 实现查询 hook 的规范化与启用边界**

对 `deviceIds` 去重、排序后写入 query key 和 URL；`deviceType`、`metric`、`hours`、2–5 个 ID 不完整时 `enabled=false`。设备列表 hook 新增可选 `keyword` 和 `enabled`，同时保证旧调用默认行为不变。

对比请求的核心构造规则为：

```ts
const normalizedDeviceIds = [...new Set(params.deviceIds ?? [])].sort();
if (params.deviceType) search.set('deviceType', params.deviceType);
if (params.metric) search.set('metric', params.metric);
if (params.hours) search.set('hours', String(params.hours));
normalizedDeviceIds.forEach((id) => search.append('deviceIds', id));
```

`useDevices` 必须将 `query.deviceType` 写入 URL 的 `type`，将 `query.keyword` 写入 URL 的 `keyword`；未传 `options.enabled` 时保持原有启用行为。

- [ ] **Step 2: 实现页面筛选状态和候选选择**

加载模板/实际类型并去重；按类型查询最多 100 台设备，搜索框映射 `keyword`；支持 2–5 台选择，达到 5 台后禁用其它复选框。指标自由输入并用告警规则提供 datalist 建议，规则查询失败不阻断页面。

- [ ] **Step 3: 实现结果、错误和空态**

结果展示群体均值、标准差、窗口、设备名称/编码、平均/最新/最小/最大值、样本数、Z-Score 和异常 Badge；设备行导航到详情。区分加载、无候选、样本不足、请求失败和缓存错误；所有按钮和表格状态具备可访问语义。

- [ ] **Step 4: 注册路由、导航和双语资源**

添加懒加载 `/device-comparison` 路由和侧边栏 `deviceComparison` 入口，补齐静态 i18n 键；不改变现有导航权限模型，页面自身按 `device:read` 阻止无权限查询。

- [ ] **Step 5: 运行前端聚焦测试确认绿灯**

运行 `cd frontend && npm test -- --run src/pages/__tests__/DeviceComparisonPage.i18n.test.tsx src/hooks/__tests__/useDeviceComparison.test.tsx src/hooks/__tests__/useDevices.test.tsx`。

## Task 5: 更新文档并完成分层验证

**Files:**

- Modify: `docs/PHASE5_ROADMAP.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`
- Modify: `docs/evaluation/00-INDEX.md`
- Modify: `docs/evaluation/01-项目总览与综合评估.md`
- Modify: `docs/evaluation/14-测试策略与金字塔分析.md`

- [ ] **Step 1: 更新产品路线与质量证据**

记录设备对比页面已交付，明确趋势图、通知推送和生产真实凭据/证书/恢复演练仍未完成；统计数据必须以实际命令输出为准。

- [ ] **Step 2: 运行完整门禁**

运行后端单元/集成相关测试、Release build、生产脚本测试，以及前端 `check:i18n`、TypeScript、ESLint、全量 Vitest、生产构建。

- [ ] **Step 3: 任务级审查、差异检查和提交**

执行 `git diff --check`，确认无凭据、租户参数或无关文件变更；通过任务级审查后按 Conventional Commits 提交实现和证据更新。
