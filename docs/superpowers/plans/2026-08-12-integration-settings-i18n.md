# 外部集成配置可靠性与国际化实施计划

> **目标：** 修复外部集成配置回填缺失导致的潜在配置覆盖，并统一四类集成的中英文界面。

## 全局约束

- 所有新增注释、文档和用户可见文案使用简体中文资源维护，中英文键集合必须一致。
- 不改变集成 API 路径、请求结构、连接测试和启停语义。
- 必须先看到英文/回填回归测试因现状缺陷失败，再实现生产代码。
- 必须通过前端全量测试、TypeScript、Lint、i18n 检查、生产构建和 `git diff --check`。

## 任务 1：建立回归测试

**文件：**

- 创建：`frontend/src/components/settings/__tests__/IntegrationSettings.i18n.test.tsx`

- [x] 覆盖四类标签页英文文案和已保存配置回填。
- [x] 覆盖禁用操作携带已回填配置，确认不会发送空配置覆盖线上值。
- [x] 运行定向测试确认当前实现 RED。

## 任务 2：实现回填与双语资源

**文件：**

- 修改：`frontend/src/components/settings/IntegrationSettings.tsx`
- 修改：`frontend/src/i18n/zh.json`
- 修改：`frontend/src/i18n/en.json`

- [x] 添加 `settings.integrations.*` 中英文资源。
- [x] 按字段白名单将已有集成配置安全回填到表单状态。
- [x] 将标签页、状态、按钮、字段、说明和测试结果改为翻译键。
- [x] 运行定向测试确认 GREEN。

## 任务 3：全量验证和基线同步

**文件：**

- 修改：`docs/LANDING_READINESS_REPORT.md`
- 修改：`docs/evaluation/00-INDEX.md`
- 修改：`docs/evaluation/14-测试策略与金字塔分析.md`
- 修改：`dogfood-output/report.md`

- [x] 运行前端全量质量门禁。
- [x] 检查差异、用户可见中文硬编码和 i18n 键集合。
- [x] 按真实输出同步测试数量和剩余部署阻断项。
