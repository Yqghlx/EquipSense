# 规则准确率租户边界加固实施计划

## 目标

让规则准确率更新始终绑定工单关闭事件的租户，避免仅凭全局规则 UUID 修改其他租户的知识规则统计。

## 实施步骤

1. 添加跨租户规则准确率红测，验证旧接口会更新错误租户规则。
2. 将 `tenantId` 加入 `IRuleAccuracyTracker.RecordAsync` 接口，并在 `KnowledgeCaptureHandler` 中传入事件租户。
3. 在 `RuleAccuracyTracker` 查询中显式绑定 `TenantId`，同时保留后台 scope 所需的 `IgnoreQueryFilters`。
4. 更新正常路径、后台 scope 和 Handler Mock 测试；运行聚焦、全量单元、Release 构建和独立审查后提交。

## 验收标准

- 规则准确率更新不能跨租户修改同一规则 ID 对应的错误记录。
- 后台合法工单关闭事件仍能更新事件租户规则。
- 所有调用方都必须显式提供事件租户。
- 全量单元测试、Release 构建和独立审查通过。

## 验证记录

- 红测（旧实现）：当前租户调用会更新其他租户规则的 `SuccessCount`；修复后按 `tenantId + ruleId` 定位并拒绝。
- 规则准确率、后台 scope 和 KnowledgeCaptureHandler 聚焦测试：15/15 通过。
- 全量单元测试：1572/1572 通过。
- Release 构建：0 警告、0 错误。
