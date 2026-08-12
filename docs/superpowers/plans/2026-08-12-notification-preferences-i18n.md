# 通知偏好设置国际化实施计划

> **目标：** 统一通知偏好设置的中英文文案，并保留所有开关和浏览器推送行为。

## 全局约束

- 所有新增注释、文档和用户可见文案使用简体中文资源维护，中英文键集合必须一致。
- 不改变通知偏好更新 API、开关禁用条件和订阅回调。
- 必须先看到英文回归测试因现状硬编码失败，再实现生产代码。
- 必须通过前端全量测试、TypeScript、Lint、i18n 检查、生产构建和 `git diff --check`。

## 任务 1：建立英文回归测试

**文件：**

- 创建：`frontend/src/components/settings/__tests__/NotificationPreferenceCard.i18n.test.tsx`

- [x] 覆盖加载、偏好矩阵和 Push 状态的英文文案。
- [x] 覆盖浏览器不支持与权限拒绝提示。
- [x] 运行定向测试确认当前实现 RED。

## 任务 2：实现双语资源与组件改造

**文件：**

- 修改：`frontend/src/components/settings/NotificationPreferenceCard.tsx`
- 修改：`frontend/src/i18n/zh.json`
- 修改：`frontend/src/i18n/en.json`

- [x] 添加 `notifications.preferences.*` 中英文资源。
- [x] 将通知类型、渠道和状态提示改为翻译键。
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
