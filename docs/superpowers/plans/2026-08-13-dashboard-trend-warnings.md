# 仪表盘趋势预警卡片实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有趋势预警 API 变成仪表盘上可发现、可操作且不会把加载失败误显示为空数据的运维入口。

**Architecture:** 新建无状态展示组件 `TrendWarningsCard`，组件只依赖现有 `useTrendWarnings` hook、i18n 和路由导航。Dashboard 负责布局挂载；不新增 API 端点、不产生重复请求，Dashboard 挂载卡片时会增加一次已有 hook 请求。租户切换继续依赖现有 `authStore` 清空 Query 缓存，不向 hook 引入 `tenantId`。组件按预测天数排序并将风险时间窗口编码为文本、Badge 和左侧色条。

**Tech Stack:** React 19、TypeScript strict、TanStack Query、React Router、react-i18next、TailwindCSS、Vitest、Testing Library。

## Global Constraints

- 所有新增注释、文案和测试描述使用简体中文；界面文案必须同时维护 `zh.json` 与 `en.json`。
- 前端不得向趋势接口拼接 `tenantId`；继续由后端租户上下文保证隔离，并依赖现有 `authStore` 在会话切换时清空 Query 缓存。
- 不引入新依赖，不新增 API 端点，不改变 `TrendAnalysisResult` 的字段或后端预测语义。
- 必须先运行聚焦测试确认红灯，再写生产组件代码；任何网络错误都必须和正常空状态区分。
- `isError` 时始终显示错误和重试；有旧数据时保留旧数据，但错误时不得显示正常空态。
- 所有方向与风险翻译键必须通过静态 `t('...')` 调用暴露给 `check-i18n`，不能使用动态模板字符串键。
- 验证命令明确在前端目录执行：`cd frontend && ...`。
- 遵守现有 CI 门禁：`npm run check:i18n`、`npx tsc -p tsconfig.json --noEmit`、`npx eslint src/ --max-warnings 1`、`npm test`、`npm run build`。

## 文件结构

- 创建：`frontend/src/components/analysis/TrendWarningsCard.tsx`，负责趋势预警的排序、风险呈现、加载/空/错误状态和设备详情导航。
- 创建：`frontend/src/components/analysis/__tests__/TrendWarningsCard.test.tsx`，隔离验证组件行为、运行时脏数据、i18n 和可访问性。
- 修改：`frontend/src/pages/DashboardPage.tsx`，在 OEE 与图表区域之间挂载卡片。
- 修改：`frontend/src/pages/__tests__/DashboardPage.i18n.test.tsx`，补充趋势 hook mock 和英文文案契约。
- 修改：`frontend/src/i18n/zh.json`、`frontend/src/i18n/en.json`，增加 `dashboard.trendWarnings.*` 双语键。
- 修改：`docs/PHASE5_ROADMAP.md`，记录趋势预警已有用户入口，明确独立趋势页仍不在本切片范围内。

## Task 1: 写趋势预警卡片的失败测试

**Files:**

- Create: `frontend/src/components/analysis/__tests__/TrendWarningsCard.test.tsx`
- Read: `frontend/src/hooks/useTrendAnalysis.ts`

**Interfaces:**

- Consumes: `TrendAnalysisResult` 与 `useTrendWarnings()` 的 `{ data, isLoading, isError, refetch }` 返回值。
- Produces: 组件必须在有数据、空数据、加载失败和导航场景下提供稳定可查询的 DOM 语义。

- [x] **Step 1: 写失败测试并观察红灯**

建立 mock `useTrendWarnings`、`useNavigate` 和 `useTranslation`，使用合法 GUID 构造数据。覆盖排序/截断、导航、空态、加载态、任意错误态、缓存旧数据、无估算风险、非法身份字段、二级 heading 和英文单复数。组件尚不存在时先得到缺失生产模块的红灯；这是功能缺失证据，组件创建后再由行为断言驱动实现。

- [x] **Step 2: 运行聚焦测试确认红灯**

Run: `cd frontend && npm test -- --run src/components/analysis/__tests__/TrendWarningsCard.test.tsx`

Observed: 组件创建前 Vitest 报告无法解析缺失的 `../TrendWarningsCard`；组件创建后聚焦测试进入行为断言并最终通过。

## Task 2: 实现卡片组件并通过聚焦测试

**Files:**

- Create: `frontend/src/components/analysis/TrendWarningsCard.tsx`
- Test: `frontend/src/components/analysis/__tests__/TrendWarningsCard.test.tsx`

**Interfaces:**

- Consumes: `useTrendWarnings()`；`TrendAnalysisResult` 中的 `deviceId`、`metric`、`currentValue`、`threshold`、`daysToThreshold`、`trendDirection`。
- Produces: `export default function TrendWarningsCard()`；每条有效记录是可聚焦的 `<button type="button">`，点击只导航到 `/devices/{deviceId}`。

- [x] **Step 1: 添加最小生产实现**

实现以下确定性规则：

```ts
const MAX_VISIBLE_WARNINGS = 5;

const sortedWarnings = [...warnings].sort((a, b) =>
  (a.daysToThreshold ?? Number.POSITIVE_INFINITY)
  - (b.daysToThreshold ?? Number.POSITIVE_INFINITY),
);
const visibleWarnings = sortedWarnings.slice(0, MAX_VISIBLE_WARNINGS);
const remainingCount = Math.max(0, sortedWarnings.length - visibleWarnings.length);
```

运行时先过滤 `deviceId` 与 `metric` 非空字符串；只接受有限数字用于显示和排序，无效数字显示 `—`。风险分级为四档：有限且 `<=1` 为 `critical`，有限且 `<=3` 为 `warning`，有限且 `>3` 为 `info`，null/非有限数字为中性的 `noEstimate`。方向与风险文案使用静态 `t('...')` 分支，避免 i18n 门禁漏检。卡片提供二级 heading 语义、`role="status"` 加载态、`role="alert"` 错误态、可调用 `refetch` 的重试按钮；错误时若有旧数据继续展示旧数据，但不显示正常空态。预警行带完整 `aria-label` 和可见焦点样式。

- [x] **Step 2: 运行聚焦测试确认绿灯**

Run: `cd frontend && npm test -- --run src/components/analysis/__tests__/TrendWarningsCard.test.tsx`

Observed: 9 个组件测试通过，覆盖初始红灯、错误态修复和生产脏数据边界。

## Task 3: 接入 Dashboard 并补齐双语资源

**Files:**

- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/pages/__tests__/DashboardPage.i18n.test.tsx`
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`

**Interfaces:**

- Consumes: `TrendWarningsCard` 默认导出组件和新增 `dashboard.trendWarnings.*` 键。
- Produces: 登录后的 Dashboard 在 OEE 卡片后、趋势图前显示趋势预警卡片；现有统计、告警和工单区域行为不变。

- [x] **Step 1: 扩展 Dashboard 测试契约**

在现有 `DashboardPage.i18n.test.tsx` 中 mock `useTrendWarnings` 为成功空数据，并把新增标题和空态文案加入英文翻译表；断言渲染 Dashboard 后能找到英文趋势预警标题/空态，且查不到中文“趋势预警”常量。测试不发起网络请求。

- [x] **Step 2: 运行 Dashboard 测试确认新增契约先红灯**

Run: `cd frontend && npm test -- --run src/pages/__tests__/DashboardPage.i18n.test.tsx`

Expected: FAIL，原因是 Dashboard 尚未挂载 `TrendWarningsCard` 或新增英文文案尚未存在。

- [x] **Step 3: 挂载卡片并添加 i18n**

在 `DashboardPage.tsx` 导入并挂载 `TrendWarningsCard`。在中英文资源中同步添加这些静态键：`title`、`description`、`count`、`empty`、`loadFailed`、`retry`、`more`、`currentValue`、`threshold`、`oneDay`、`days`、`noEstimate`、`direction.up`、`direction.down`、`direction.stable`、`direction.unknown`、`risk.critical`、`risk.warning`、`risk.info`、`risk.noEstimate`、`openDevice`。使用插值表达数量和天数，不能在组件中写中文或英文常量。

- [x] **Step 4: 运行 Dashboard 与组件聚焦测试确认绿灯**

Run: `cd frontend && npm test -- --run src/pages/__tests__/DashboardPage.i18n.test.tsx src/components/analysis/__tests__/TrendWarningsCard.test.tsx`

Expected: 相关测试全部通过，英文界面不出现中文趋势文案。

## Task 4: 更新路线图并完成分层验证

**Files:**

- Modify: `docs/PHASE5_ROADMAP.md`

- [x] **Step 1: 更新路线图事实状态**

在趋势预警条目中记录“后端分析、前端 hook 和仪表盘预警卡片已接入”；同时明确独立趋势分析页、设备名称富化和通知推送仍是单独后续范围，避免文档把“有接口”或“有卡片”夸大为完整分析中心。

- [x] **Step 2: 运行前端完整质量门禁**

按顺序执行：

```bash
cd frontend && npm run check:i18n
cd frontend && npx tsc -p tsconfig.json --noEmit
cd frontend && npx eslint src/ --max-warnings 1
cd frontend && npm test
cd frontend && npm run build
```

Expected: i18n 键完整，TypeScript 退出码为 0，ESLint 0 error 且最多 1 warning，Vitest 全部通过，生产构建退出码为 0。

- [ ] **Step 3: 检查差异并提交**

Run: `git diff --check`、`git -c core.fsmonitor=false status --short`。

确认只有本计划列出的组件、测试、i18n、Dashboard、路线图和设计/计划文件发生变化后，提交：

```bash
git add docs/superpowers/specs/2026-08-13-dashboard-trend-warnings-design.md docs/superpowers/plans/2026-08-13-dashboard-trend-warnings.md docs/PHASE5_ROADMAP.md frontend/src/components/analysis/TrendWarningsCard.tsx frontend/src/components/analysis/__tests__/TrendWarningsCard.test.tsx frontend/src/pages/DashboardPage.tsx frontend/src/pages/__tests__/DashboardPage.i18n.test.tsx frontend/src/i18n/zh.json frontend/src/i18n/en.json
git commit -m "feat: expose trend warnings on dashboard"
```
