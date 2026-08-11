# 通知中心与待审批页面国际化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 为通知中心和待审批页面补齐中英文资源，消除核心运维流程中的硬编码中文，并用页面级回归测试保护语言切换。

**架构：** 保持现有 React 页面、TanStack Query hooks 和业务 mutation 不变，仅在展示层通过 `useTranslation()` 读取页面命名空间。角色和过滤值映射到稳定翻译键，动态数量与审批步骤使用 i18next 插值。

**技术栈：** React 19、TypeScript strict、react-i18next、Vitest、Testing Library、TanStack Query、Vite。

## 全局约束

- 所有新增注释、文档和用户可见日志使用简体中文。
- `zh.json` 与 `en.json` 的键集合必须完全一致。
- 不改变 API、权限、查询参数、mutation 或路由行为。
- 遵循 TDD：先看到回归测试因硬编码中文失败，再实现翻译。
- 前端门禁必须满足：TypeScript 0 错误、Lint 0 error 且 warning 不超过 CI 阈值、i18n 完整、生产构建成功。

---

### 任务 1：建立英文页面回归测试

**文件：**
- 修改：`frontend/src/pages/__tests__/PendingApprovalsPage.test.tsx`
- 创建：`frontend/src/pages/__tests__/NotificationsPages.i18n.test.tsx`

**接口：**
- 使用现有页面和 hooks mock，不新增生产接口。
- 英文测试翻译器根据键返回稳定英文文本，并支持 `{{count}}`、`{{step}}` 和 `{{id}}` 插值。

- [x] **步骤 1：先修改测试期待英文用户可见文本**

  在待审批测试的翻译 mock 中加入页面键的英文映射，并将空状态、角色、审批状态、驳回按钮和对话框断言改为英文；新增通知中心测试覆盖标题、筛选标签、表头、空状态和操作提示。

- [x] **步骤 2：运行定向测试确认 RED**

  运行：

  ```bash
  npm test -- --run src/pages/__tests__/PendingApprovalsPage.test.tsx src/pages/__tests__/NotificationsPages.i18n.test.tsx
  ```

  预期：失败，失败原因应是页面仍渲染硬编码中文，而不是测试配置或导入错误。

### 任务 2：实现页面翻译与资源

**文件：**
- 修改：`frontend/src/pages/NotificationsPage.tsx`
- 修改：`frontend/src/pages/PendingApprovalsPage.tsx`
- 修改：`frontend/src/i18n/zh.json`
- 修改：`frontend/src/i18n/en.json`

**接口：**
- `NotificationsPage` 使用 `notifications.*` 键。
- `PendingApprovalsPage` 使用 `pendingApprovals.*` 键。
- 未知审批角色显示后端传入的原始值，已知角色显示对应翻译。

- [x] **步骤 1：补齐中英文资源键**

  为两种语言添加同构的页面命名空间，动态文本使用例如：

  ```json
  {
    "pendingApprovals": {
      "count": "共 {{count}} 条待审批",
      "step": "第 {{step}} 级",
      "rejectDescription": "驳回第 {{step}} 级审批（工单 {{id}}...）"
    }
  }
  ```

- [x] **步骤 2：替换通知中心用户可见硬编码**

  将筛选项改为 `value` 保持不变、`label: t('notifications.filter...')` 动态生成；标题、空状态、表头和按钮 `title` 全部使用翻译键。

- [x] **步骤 3：替换待审批页面用户可见硬编码**

  将角色映射从中文字符串改为翻译键映射；步骤、状态、按钮、空状态和驳回对话框全部使用 `t`，保留未知角色的原始值。

- [x] **步骤 4：运行定向测试确认 GREEN**

  运行同任务 1 的定向命令，预期所有相关测试通过。

### 任务 3：全量质量验证和文档同步

**文件：**
- 修改：`docs/LANDING_READINESS_REPORT.md`
- 修改：`docs/evaluation/00-INDEX.md`
- 修改：`docs/evaluation/14-测试策略与金字塔分析.md`

- [x] **步骤 1：运行前端全量门禁**

  ```bash
  npm test -- --run
  npx tsc -p tsconfig.json --noEmit
  npm run lint
  npm run check:i18n
  npm run build
  ```

- [x] **步骤 2：运行差异检查**

  ```bash
  git -c core.fsmonitor=false diff --check
  ```

- [x] **步骤 3：更新质量基线**

  只同步实际命令输出中的测试文件数、用例数和 i18n 键数；保留真实 Docker 凭据和证书阻断项，不把隔离环境结果表述为正式生产上线。
