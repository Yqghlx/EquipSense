# 仪表盘趋势预警卡片实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有趋势预警 API 变成仪表盘上可发现、可操作且不会把加载失败误显示为空数据的运维入口。

**Architecture:** 新建无状态展示组件 `TrendWarningsCard`，组件只依赖现有 `useTrendWarnings` hook、i18n 和路由导航。Dashboard 负责布局挂载；不改变后端 DTO、趋势算法、租户边界或请求数量。组件按预测天数排序并将风险时间窗口编码为文本、Badge 和左侧色条。

**Tech Stack:** React 19、TypeScript strict、TanStack Query、React Router、react-i18next、TailwindCSS、Vitest、Testing Library。

## Global Constraints

- 所有新增注释、文案和测试描述使用简体中文；界面文案必须同时维护 `zh.json` 与 `en.json`。
- 前端不得向趋势接口拼接 `tenantId`；继续由后端租户上下文保证隔离。
- 不引入新依赖，不新增 API，不改变 `TrendAnalysisResult` 的字段或后端预测语义。
- 必须先运行聚焦测试确认红灯，再写生产组件代码；任何网络错误都必须和正常空状态区分。
- 遵守现有 CI 门禁：`npx tsc -p tsconfig.json --noEmit`、`npx eslint src/ --max-warnings 1`、`npm run check:i18n`、`npm test`、`npm run build`。

## 文件结构

- 创建：`frontend/src/components/analysis/TrendWarningsCard.tsx`，负责趋势预警卡片的排序、风险呈现、加载/空/错误状态和设备详情导航。
- 创建：`frontend/src/components/analysis/__tests__/TrendWarningsCard.test.tsx`，隔离验证组件行为、i18n 和可访问性。
- 修改：`frontend/src/pages/DashboardPage.tsx`，在 OEE 与图表区域之间挂载卡片。
- 修改：`frontend/src/pages/__tests__/DashboardPage.i18n.test.tsx`，补充趋势 hook mock 和英文文案契约。
- 修改：`frontend/src/i18n/zh.json`、`frontend/src/i18n/en.json`，增加 `dashboard.trendWarnings.*` 双语键。
- 修改：`docs/PHASE5_ROADMAP.md`，记录趋势预警已有用户入口，明确独立趋势页仍不在本切片范围内。

### Task 1: 写趋势预警卡片的失败测试

**Files:**

- Create: `frontend/src/components/analysis/__tests__/TrendWarningsCard.test.tsx`
- Read: `frontend/src/hooks/useTrendAnalysis.ts`

**Interfaces:**

- Consumes: `TrendAnalysisResult` 与 `useTrendWarnings()` 的 `{ data, isLoading, isError, refetch }` 返回值。
- Produces: 组件必须在有数据、空数据、加载失败和导航场景下提供稳定可查询的 DOM 语义。

- [ ] **Step 1: 写失败测试**

建立以下测试替身：mock `useTrendWarnings`、`useNavigate`、`useTranslation`；翻译函数返回测试用英文文案。准备 7 条预警，其中 6 条有 `daysToThreshold`，排序后第一条为 0.5 天、最后一条为 6 天，另有一条 `null` 预计值。测试至少断言：

```tsx
it('按越阈值时间排序并最多展示五条预警', () => {
  mockedUseTrendWarnings.mockReturnValue({
    data: createWarnings(), isLoading: false, isError: false, refetch: vi.fn(),
  } as never);

  render(<TrendWarningsCard />);

  expect(screen.getAllByRole('button', { name: /open device/i })).toHaveLength(5);
  expect(screen.getAllByRole('button', { name: /open device/i })[0]).toHaveTextContent('0.5');
  expect(screen.getByText(/2 more/i)).toBeInTheDocument();
});

it('点击预警行跳转到设备详情', async () => {
  const navigate = vi.fn();
  mockedUseNavigate.mockReturnValue(navigate);
  mockedUseTrendWarnings.mockReturnValue({
    data: [createWarning({ deviceId: 'device-123', metric: 'temperature' })],
    isLoading: false, isError: false, refetch: vi.fn(),
  } as never);

  render(<TrendWarningsCard />);
  await userEvent.click(screen.getByRole('button', { name: /temperature.*device-123/i }));

  expect(navigate).toHaveBeenCalledWith('/devices/device-123');
});
```

另写 3 个独立用例：空数组显示正常空状态且不显示失败提示；加载失败显示 `role="alert"` 和重试按钮，点击重试调用 `refetch`；英文翻译下趋势方向和风险时间不出现中文常量。

- [ ] **Step 2: 运行聚焦测试确认红灯**

Run: `npm test -- --run src/components/analysis/__tests__/TrendWarningsCard.test.tsx`

Expected: FAIL，原因是 `TrendWarningsCard.tsx` 尚不存在或尚未提供预期的按钮、空态和错误态，而不是测试文件导入错误。

### Task 2: 实现卡片组件并通过聚焦测试

**Files:**

- Create: `frontend/src/components/analysis/TrendWarningsCard.tsx`
- Test: `frontend/src/components/analysis/__tests__/TrendWarningsCard.test.tsx`

**Interfaces:**

- Consumes: `useTrendWarnings()`；`TrendAnalysisResult` 中的 `deviceId`、`metric`、`currentValue`、`threshold`、`daysToThreshold`、`trendDirection`。
- Produces: `export default function TrendWarningsCard(): JSX.Element`；每条有效记录是可聚焦的 `<button type="button">`，点击只导航到 `/devices/{deviceId}`。

- [ ] **Step 1: 添加最小生产实现**

实现以下确定性规则：

```ts
const MAX_VISIBLE_WARNINGS = 5;

const sortedWarnings = [...(data ?? [])].sort((a, b) =>
  (a.daysToThreshold ?? Number.POSITIVE_INFINITY)
  - (b.daysToThreshold ?? Number.POSITIVE_INFINITY),
);
const visibleWarnings = sortedWarnings.slice(0, MAX_VISIBLE_WARNINGS);
const remainingCount = Math.max(0, sortedWarnings.length - visibleWarnings.length);
```

只接受有限数字用于显示；无效数值显示 `—`。风险分级为 `days <= 1`、`days <= 3`、其他/无预计值三档；每档同时有 i18n 文本和颜色类。趋势方向通过 `上升`/`下降`/`平稳` 和对应英文值映射到 `up`/`down`/`stable`，未知值使用 `unknown`，避免英文界面泄漏中文后端枚举。

卡片必须有语义标题、加载中的 `role="status"`、错误态的 `role="alert"`，重试按钮调用 hook 返回的 `refetch`。预警行的 `aria-label` 至少包含指标和设备 ID，按钮使用 `focus-visible` 样式；无数据时使用正常空状态。

- [ ] **Step 2: 运行聚焦测试确认绿灯**

Run: `npm test -- --run src/components/analysis/__tests__/TrendWarningsCard.test.tsx`

Expected: 所有趋势预警组件测试通过，且没有未处理的 React 警告。

### Task 3: 接入 Dashboard 并补齐双语资源

**Files:**

- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/pages/__tests__/DashboardPage.i18n.test.tsx`
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`

**Interfaces:**

- Consumes: `TrendWarningsCard` 默认导出组件和新增 `dashboard.trendWarnings.*` 键。
- Produces: 登录后的 Dashboard 在 OEE 卡片后、趋势图前显示趋势预警卡片；现有统计、告警和工单区域行为不变。

- [ ] **Step 1: 扩展 Dashboard 测试契约**

在现有 `DashboardPage.i18n.test.tsx` 中 mock `useTrendWarnings` 为成功空数据，并把新增标题、空态、趋势方向和状态文案加入英文翻译表；断言渲染 Dashboard 后能找到英文趋势预警标题/空态，且查不到中文“趋势预警”常量。

- [ ] **Step 2: 运行 Dashboard 测试确认新增契约先红灯**

Run: `npm test -- --run src/pages/__tests__/DashboardPage.i18n.test.tsx`

Expected: FAIL，原因是 Dashboard 尚未挂载 `TrendWarningsCard` 或新增英文文案尚未存在。

- [ ] **Step 3: 挂载卡片并添加 i18n**

在 `DashboardPage.tsx` 导入并挂载 `TrendWarningsCard`。在中英文资源中同步添加这些键：`title`、`description`、`count`、`empty`、`loadFailed`、`retry`、`more`、`currentValue`、`threshold`、`days`、`noEstimate`、`direction.up`、`direction.down`、`direction.stable`、`direction.unknown`、`risk.critical`、`risk.warning`、`risk.info`、`openDevice`。使用插值表达数量和天数，不能在组件中写中文或英文常量。

- [ ] **Step 4: 运行 Dashboard 测试确认绿灯**

Run: `npm test -- --run src/pages/__tests__/DashboardPage.i18n.test.tsx src/components/analysis/__tests__/TrendWarningsCard.test.tsx`

Expected: 相关测试全部通过，英文界面不出现中文趋势文案。

### Task 4: 更新路线图并完成分层验证

**Files:**

- Modify: `docs/PHASE5_ROADMAP.md`

- [ ] **Step 1: 更新路线图事实状态**

在趋势预警条目中记录“后端分析、前端 hook 和仪表盘预警卡片已接入”；同时明确独立趋势分析页、设备名称富化和通知推送仍是单独后续范围，避免文档把“有接口”或“有卡片”夸大为完整分析中心。

- [ ] **Step 2: 运行前端完整质量门禁**

按顺序执行：

```bash
npm run check:i18n
npx tsc -p tsconfig.json --noEmit
npx eslint src/ --max-warnings 1
npm test
npm run build
```

Expected: i18n 键完整，TypeScript 退出码为 0，ESLint 0 error 且最多 1 warning，Vitest 全部通过，生产构建退出码为 0。

- [ ] **Step 3: 检查差异并提交**

Run: `git diff --check`、`git -c core.fsmonitor=false status --short`。

确认只有本计划列出的组件、测试、i18n、Dashboard 和路线图文件发生变化后，提交：

```bash
git add docs/superpowers/specs/2026-08-13-dashboard-trend-warnings-design.md docs/superpowers/plans/2026-08-13-dashboard-trend-warnings.md docs/PHASE5_ROADMAP.md frontend/src/components/analysis/TrendWarningsCard.tsx frontend/src/components/analysis/__tests__/TrendWarningsCard.test.tsx frontend/src/pages/DashboardPage.tsx frontend/src/pages/__tests__/DashboardPage.i18n.test.tsx frontend/src/i18n/zh.json frontend/src/i18n/en.json
git commit -m "feat: expose trend warnings on dashboard"
```
