# 审批链配置国际化实施计划

> **目标：** 将审批链配置面板完整接入中英文资源，并提升图标操作的可访问性。

## 全局约束

- 所有新增注释、文档和用户可见文案使用简体中文资源维护，中英文键集合必须一致。
- 不改变审批链 API、表单提交、展开、编辑和删除行为。
- 必须先看到英文回归测试因硬编码中文失败，再实现生产代码。
- 必须通过前端全量测试、TypeScript、Lint、i18n 检查、生产构建和 `git diff --check`。

## 任务 1：建立英文回归测试

**文件：**

- 创建：`frontend/src/components/settings/__tests__/ApprovalChainSettings.i18n.test.tsx`

- [ ] 编写审批链列表、步骤明细和新建对话框的英文断言。
- [ ] 运行定向测试确认当前硬编码文案导致 RED。

## 任务 2：实现双语资源与组件改造

**文件：**

- 修改：`frontend/src/components/settings/ApprovalChainSettings.tsx`
- 修改：`frontend/src/i18n/zh.json`
- 修改：`frontend/src/i18n/en.json`

- [ ] 添加 `settings.approvalChain.*` 中英文资源。
- [ ] 将状态、字段、按钮、占位符和映射标签改为翻译键。
- [ ] 为编辑和删除图标按钮补充翻译后的 `aria-label`。
- [ ] 运行定向测试确认 GREEN。

## 任务 3：全量验证和基线同步

**文件：**

- 修改：`docs/LANDING_READINESS_REPORT.md`
- 修改：`docs/evaluation/00-INDEX.md`
- 修改：`docs/evaluation/14-测试策略与金字塔分析.md`
- 修改：`dogfood-output/report.md`

- [ ] 运行前端全量质量门禁。
- [ ] 检查差异、用户可见中文硬编码和 i18n 键集合。
- [ ] 按真实输出同步测试数量和剩余部署阻断项。
