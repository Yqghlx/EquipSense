# CSV 导出反馈统一 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一五个 CSV 导出入口的失败反馈、忙碌状态和单飞请求行为，消除用户无法判断导出是否失败的问题。

**Architecture:** 新增 `ExportButton` 共享组件，负责导出 Promise 的忙碌状态、失败 Toast、`aria-busy` 和单飞闸门；页面只提供筛选参数、导出函数和本地化文案。后端接口、导出文件内容和既有业务禁用条件不变。

**Tech Stack:** React 19、TypeScript strict、Sonner、Lucide、Testing Library、Vitest、react-i18next。

## Global Constraints

- 所有新增代码注释和文案使用简体中文，英文文案必须同步维护。
- 不把后端异常对象、响应体或凭据内容展示给用户。
- 导出函数签名、请求参数、文件名和后端接口保持不变。
- 不降低 TypeScript、ESLint、i18n、Vitest、覆盖率或生产构建门禁。
- 不修改 `docker/.env`，不执行 Git 暂存、提交或推送。

---

### Task 1: 编写共享导出按钮的失败回归

**Files:**
- Create: `frontend/src/components/ui/ExportButton.tsx`
- Create: `frontend/src/components/ui/__tests__/ExportButton.test.tsx`

**Interfaces:**
- Consumes: 现有 `Button` 组件、Sonner `toast.error` 和调用方传入的 `() => Promise<void>`。
- Produces: `ExportButtonProps` 和默认导出组件，提供 `onExport`、`label`、`exportingLabel`、`errorMessage`、`disabled`、`onBusyChange`、`variant`、`size`、`className`、`title` 属性。

- [x] **Step 1: 写失败测试**

在组件测试中 mock `sonner`，使用可控 Promise 覆盖：

```tsx
it('导出进行中只允许一个请求并在失败后恢复按钮', async () => {
  const user = userEvent.setup();
  let rejectExport!: (reason?: unknown) => void;
  const onExport = vi.fn(() => new Promise<void>((_, reject) => {
    rejectExport = reject;
  }));

  render(
    <ExportButton
      onExport={onExport}
      label="导出"
      exportingLabel="导出中"
      errorMessage="导出失败"
    />,
  );

  const button = screen.getByRole('button', { name: '导出' });
  await user.click(button);
  await user.click(button);
  expect(onExport).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute('aria-busy', 'true');

  rejectExport(new Error('network unavailable'));
  await waitFor(() => {
    expect(mockedToastError).toHaveBeenCalledWith('导出失败');
    expect(button).toBeEnabled();
  });
});
```

另加成功路径，确认 Promise 完成后不调用错误 Toast 且按钮恢复；另加外部 `disabled` 路径，确认业务禁用条件仍阻止点击。

- [x] **Step 2: 运行聚焦测试确认旧实现失败**

运行：

```bash
cd frontend && npx vitest run src/components/ui/__tests__/ExportButton.test.tsx
```

预期：因共享组件文件尚不存在而编译失败；若测试替身或路径错误，先修正测试使失败原因指向待实现的组件。

### Task 2: 实现共享导出组件

**Files:**
- Create: `frontend/src/components/ui/ExportButton.tsx`
- Test: `frontend/src/components/ui/__tests__/ExportButton.test.tsx`

**Interfaces:**
- Consumes: Task 1 的失败测试和 `frontend/src/components/ui/button.tsx` 的 `Button` API。
- Produces: 五个页面可复用的导出按钮，统一处理加载、错误和重复点击。

- [x] **Step 1: 增加最小实现**

实现下列核心逻辑，图标和状态由组件统一渲染：

```tsx
const [isExporting, setIsExporting] = useState(false);
const inFlightRef = useRef(false);

const handleClick = () => {
  if (disabled || inFlightRef.current) return;

  inFlightRef.current = true;
  setIsExporting(true);
  void (async () => {
    try {
      await onExport();
    } catch {
      toast.error(errorMessage);
    } finally {
      inFlightRef.current = false;
      setIsExporting(false);
    }
  })();
};
```

按钮必须使用 `disabled={disabled || isExporting}`、`aria-busy={isExporting}`，忙碌时显示 `Loader2` 和 `exportingLabel`，否则显示 `Download` 和 `label`；开始和结束时分别调用可选的 `onBusyChange(true/false)`，供同一页面的多个导出按钮共享禁用状态。组件不接触异常对象内容。

- [x] **Step 2: 运行聚焦测试确认通过**

运行：

```bash
cd frontend && npx vitest run src/components/ui/__tests__/ExportButton.test.tsx
```

预期：成功、失败、重复点击和外部禁用场景全部通过。

### Task 3: 接线设备、告警和工单导出入口

**Files:**
- Modify: `frontend/src/pages/DeviceListPage.tsx`
- Modify: `frontend/src/pages/AlertCenterPage.tsx`
- Modify: `frontend/src/pages/WorkOrderListPage.tsx`
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`

**Interfaces:**
- Consumes: `ExportButton`、现有 `exportDevicesCsv`、`exportWorkOrdersCsv` 和告警页面导出函数。
- Produces: 三个页面的筛选参数原样传递、失败可见、请求中不可重复点击的导出入口。

- [x] **Step 1: 增加双语文案**

在两个语言文件对应对象中加入：

```json
// zh.json
"device": { "exporting": "导出中...", "exportFailed": "设备导出失败，请检查网络或权限后重试。" }
"alert": { "exporting": "导出中...", "exportFailed": "告警导出失败，请检查网络或权限后重试。" }
"workorder": { "exporting": "导出中...", "exportFailed": "工单导出失败，请检查网络或权限后重试。" }

// en.json
"device": { "exporting": "Exporting...", "exportFailed": "Failed to export devices. Check your network or permissions and try again." }
"alert": { "exporting": "Exporting...", "exportFailed": "Failed to export alerts. Check your network or permissions and try again." }
"workorder": { "exporting": "Exporting...", "exportFailed": "Failed to export work orders. Check your network or permissions and try again." }
```

保持现有对象其他字段和排序不变，不覆盖已有键。

- [x] **Step 2: 接入共享按钮并运行聚焦门禁**

三个页面分别将原导出 `<Button>` 替换为：

```tsx
<ExportButton
  onExport={() => exportDevicesCsv({ status: status || undefined })}
  label={t('common.export', '导出')}
  exportingLabel={t('device.exporting')}
  errorMessage={t('device.exportFailed')}
  title={t('common.exportTip', '最多导出 10000 条')}
  variant="outline"
  size="sm"
/>
```

告警和工单分别使用自身导出函数及对应 i18n 键；告警页保留现有 `status`、`severity` 参数，工单页保留现有 `status` 参数。

运行：

```bash
cd frontend && npx vitest run src/components/ui/__tests__/ExportButton.test.tsx src/pages/__tests__/AuditLogsPage.i18n.test.tsx src/pages/__tests__/ReportsPage.test.tsx
```

预期：共享组件和已有审计/报表导出行为全部通过，TypeScript 能编译三处页面接线。

### Task 4: 统一审计日志和运营报表并完成全量验证

**Files:**
- Modify: `frontend/src/pages/AuditLogsPage.tsx`
- Modify: `frontend/src/pages/ReportsPage.tsx`
- Modify: `frontend/src/pages/__tests__/AuditLogsPage.i18n.test.tsx`
- Modify: `frontend/src/pages/__tests__/ReportsPage.test.tsx`
- Modify: `CHANGELOG.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`

**Interfaces:**
- Consumes: Task 2 的共享按钮和既有审计/报表本地化文案。
- Produces: 五个页面共享同一导出行为实现，现有业务断言继续覆盖 API 参数、日期边界、错误反馈和权限状态。

- [x] **Step 1: 替换已有页面的重复状态逻辑**

审计日志将 `isExporting`、`handleExport`、`Loader2` 和直接 `toast` 移除，改用 `ExportButton` 并传入现有 `audit.exporting`、`audit.exportFailed`。运营报表的 `runExport` 和直接 `toast` 移除；本月和自定义范围按钮各使用 `ExportButton`，自定义按钮额外传入 `disabled={Boolean(rangeError)}`，保持同一页两个按钮共享忙碌状态的原行为。

- [x] **Step 2: 更新页面回归断言**

保留审计日志的筛选参数断言、失败恢复断言和报表的日期边界/权限断言；将共享组件的错误 Toast mock 保持在页面测试中，确保真实页面仍传入正确的文案键。必要时补充报表自定义导出失败后按钮恢复断言，覆盖两个导出入口。

- [x] **Step 3: 运行前端全量门禁**

运行：

```bash
cd frontend
npx tsc -p tsconfig.json --noEmit
npm run lint
npm run check:i18n
npm run test -- --coverage
npm run build
```

预期：类型检查、严格 ESLint、双语键覆盖、全量 Vitest/覆盖率和生产构建均退出码为 0。

- [x] **Step 4: 同步就绪证据并做最终差异检查**

在 `CHANGELOG.md` 和 `docs/LANDING_READINESS_REPORT.md` 当前状态段落记录五个导出入口统一了忙碌、失败和单飞行为，不把这项前端回归写成真实生产外部联调证据。运行：

```bash
git -c core.fsmonitor=false -c core.untrackedCache=false diff --check
```

预期：无空白错误，且不修改 `docker/.env`。

本计划的改动保留在当前工作区供审阅，不执行 Git 暂存、提交或推送。
