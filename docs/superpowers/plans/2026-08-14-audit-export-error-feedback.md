# Audit Log Export Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让审计日志 CSV 导出失败可被用户感知，并在请求结束后可靠恢复导出按钮。

**Architecture:** 在 `AuditLogsPage` 内维护单次导出的 `isExporting` 状态；导出失败由页面调用 Sonner 显示通用本地化 Toast。后端 API、下载数据和筛选参数不变。

**Tech Stack:** React 19、TypeScript strict、react-i18next、Sonner、Vitest、Testing Library、现有中英文 JSON 资源。

## Global Constraints

- 所有新增代码注释、日志和文档使用简体中文。
- 不把后端原始异常文本展示给用户。
- i18n 键必须同时存在于 `frontend/src/i18n/zh.json` 和 `frontend/src/i18n/en.json`。
- 不降低现有覆盖率、Lint 或类型检查门禁。
- 本仓库当前工作树不执行提交、暂存或推送。

---

### Task 1: 为导出失败和忙碌状态编写失败测试

**Files:**
- Modify: `frontend/src/pages/__tests__/AuditLogsPage.i18n.test.tsx`
- Test: `frontend/src/pages/__tests__/AuditLogsPage.i18n.test.tsx`

**Interfaces:**
- Consumes: 当前页面已有的 `exportAuditLogsCsv` mock、页面导出按钮和 `sonner`。
- Produces: 对“Promise 拒绝显示 Toast”和“Promise 未完成时按钮禁用”的可观察行为断言。

- [ ] **Step 1: 增加 Sonner 测试替身和失败场景**

在现有测试文件中增加：

```tsx
const mockedToastError = vi.fn();

vi.mock('sonner', () => ({
  toast: { error: mockedToastError },
}));
```

新增测试使用一个可控 Promise，断言点击后按钮被禁用；随后让 Promise reject，断言 `toast.error` 收到英文 `audit.exportFailed` 文案，最后断言按钮恢复可用。

- [ ] **Step 2: 运行聚焦测试确认当前实现失败**

Run:

```bash
cd frontend && npx vitest run src/pages/__tests__/AuditLogsPage.i18n.test.tsx
```

Expected: FAIL，因为当前页面没有导入 `toast`、没有 `isExporting` 状态，也不会显示失败提示或禁用按钮。

### Task 2: 实现页面级导出反馈

**Files:**
- Modify: `frontend/src/pages/AuditLogsPage.tsx`

**Interfaces:**
- Consumes: `exportAuditLogsCsv` Promise、`useTranslation`、Sonner `toast.error`。
- Produces: 导出按钮的禁用/加载状态和失败 Toast。

- [ ] **Step 1: 增加最小状态和错误处理**

将导出处理改为：

```tsx
const [isExporting, setIsExporting] = useState(false);

const handleExport = async () => {
  setIsExporting(true);
  try {
    await exportAuditLogsCsv({ action: actionFilter, resourceType: resourceFilter });
  } catch {
    toast.error(t('audit.exportFailed'));
  } finally {
    setIsExporting(false);
  }
};
```

按钮使用 `disabled={isExporting}` 和 `aria-busy={isExporting}`；忙碌时显示 `Loader2` 旋转图标与 `audit.exporting` 文案，否则保持原有下载图标和 `common.export` 文案。

- [ ] **Step 2: 运行聚焦测试确认通过**

Run:

```bash
cd frontend && npx vitest run src/pages/__tests__/AuditLogsPage.i18n.test.tsx
```

Expected: PASS，导出失败提示出现，按钮在 Promise 完成后恢复可用。

### Task 3: 补齐双语资源并完成回归验证

**Files:**
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`
- Modify: `CHANGELOG.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`

**Interfaces:**
- Consumes: 页面使用的 `audit.exporting` 和 `audit.exportFailed` 键。
- Produces: 完整中英文用户文案和可审计的变更记录。

- [ ] **Step 1: 添加固定双语文案**

```json
// zh.json
"exporting": "导出中...",
"exportFailed": "审计日志导出失败，请检查网络或权限后重试"

// en.json
"exporting": "Exporting...",
"exportFailed": "Failed to export audit logs. Check your network or permissions and try again."
```

两个键都放在 `audit` 对象内，保持资源结构一致。

- [ ] **Step 2: 运行前端全量门禁**

Run:

```bash
cd frontend
npx tsc -p tsconfig.json --noEmit
npm run lint
npm run check:i18n
npm run test -- --coverage
npm run build
```

Expected: 类型检查、Lint、i18n、全部 Vitest、覆盖率门禁和生产构建均退出码为 0。

- [ ] **Step 3: 运行差异检查**

Run:

```bash
git -c core.fsmonitor=false -c core.untrackedCache=false diff --check
```

Expected: 无空白错误。
