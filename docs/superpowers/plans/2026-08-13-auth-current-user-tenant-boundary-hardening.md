# AuthService 已认证用户操作租户边界加固计划

## 目标

确保已认证请求只能操作当前租户内的用户记录，同时保留登录、MFA 挑战、刷新令牌、密码重置和公开注册等无租户上下文流程的既有语义。

## 范围

- `SetupMfaAsync`
- `ConfirmMfaSetupAsync`
- `RegenerateMfaRecoveryCodesAsync`
- `DisableMfaAsync`
- `ChangePasswordAsync`
- `LogoutAsync`

## 实施步骤

1. 在认证服务单元测试中加入跨租户用户写入红测，先确认旧实现会错误修改其他租户用户。
2. 注入 `ITenantContext`，为上述已认证操作增加当前用户身份校验；涉及数据库的用户查询同时增加 `UserId + TenantId` 显式条件。
3. 运行认证服务聚焦测试、后端全量单元测试和 Release 构建。
4. 复核登录/MFA 挑战/刷新/忘记密码/重置/注册流程，确认其全局查找仍有明确凭据绑定，不因本次改动被错误收窄。

## 验证证据

- 红测：已验证旧实现的 5 个跨租户写入用例失败。
- 修复后聚焦测试：已通过 59/59（含身份匹配正向路径）。
- 全量测试与构建：单元测试已通过 1580/1580（Debug/Release）；`dotnet build EquipAI.sln -c Release --no-restore -m:1 -p:UseSharedCompilation=false` 通过，0 warning、0 error。
- 独立审查：已批准，无 Blocker；按建议将身份校验前置到 Redis/分布式锁之前。
