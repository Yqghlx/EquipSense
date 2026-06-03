# 测试体系补充设计

## 背景

项目已通过 v1.0.0 发布验证，但测试覆盖不足。当前 394 个测试用例（后端 301 + 前端 93），大量业务模块缺少测试保护。

**现有测试基础：**
- 后端：xUnit + Moq + FluentAssertions + InMemory EF Core + WebApplicationFactory
- 前端：Vitest + Testing Library + Playwright
- 集成测试：CustomWebApplicationFactory + FakeRedisService + 内存数据库
- E2E：Playwright（仅 auth.spec.ts）

**缺失项：**
- 5/6 中间件无测试（仅 InputSanitizationMiddleware 已覆盖）
- 14/19 控制器无集成测试
- SignalR Hub 无测试
- 21/23 前端 hooks 无测试
- 所有前端组件无测试
- E2E 仅覆盖登录流程

---

## 子计划 T1：后端中间件 + Hub 单元测试

### T1-1. SecurityHeadersMiddleware 测试

验证每个安全响应头正确添加（X-Content-Type-Options、X-Frame-Options、X-XSS-Protection、Referrer-Policy、Permissions-Policy、X-Permitted-Cross-Domain-Policies、Cache-Control）。

使用 `DefaultHttpContext` 构造请求上下文，调用中间件后检查 `context.Response.Headers`。

### T1-2. ExceptionHandlingMiddleware 测试

验证已知业务异常返回正确 HTTP 状态码和错误格式；未处理异常返回 500 + 通用错误消息。

### T1-3. TenantResolutionMiddleware 测试

验证从 JWT Claims 中提取 tenant_id/user_id/role 并存入 HttpContext.Items；无 token 时返回 401；token 中缺少必要 claim 时返回 401。

### T1-4. UsageLimitMiddleware 测试

验证配额检查逻辑：未超限时放行；超限时返回 403；仅对 POST/PUT 请求检查；跳过系统管理员。

Mock ISubscriptionService 返回配额状态。

### T1-5. PermissionMiddleware 测试（RequirePermissionAttribute 关联）

验证角色-权限矩阵匹配逻辑：有权限放行；无权限返回 403；系统管理员跳过检查。

### T1-6. IndustrialHub 单元测试

验证 Hub 的组管理逻辑：OnConnectedAsync 将连接加入租户组；OnDisconnectedAsync 清理连接。

使用 `Mock<IGroupManager>` 和 `Mock<HubCallerContext>` 模拟 SignalR 基础设施。

---

## 子计划 T2：后端控制器集成测试

**测试模式**：复用 `CustomWebApplicationFactory` + `SharedTestCollection`，每个控制器一个测试文件。

### T2-1. UsersController 测试

GET /api/v1/users（列表）、GET /api/v1/users/{id}（详情）、PUT /api/v1/users/{id}（更新）、DELETE（软删除）。

### T2-2. TenantsController 测试

GET /api/v1/tenants/current（当前租户信息）、PUT /api/v1/tenants/current（更新租户设置）。

### T2-3. TelemetryController 测试

GET /api/v1/telemetry/{deviceId}/latest（最新遥测）、GET /api/v1/telemetry/{deviceId}/history（历史查询，含时间范围参数）。

### T2-4. KnowledgeController 测试

GET 规则列表、POST 创建规则、PUT 更新规则、DELETE 删除规则、POST import/csv（CSV 导入）、GET export/json（JSON 导出）。

### T2-5. IntegrationController 测试

GET 集成配置列表、PUT 更新集成配置、POST {type}/test（测试连接）。Mock HttpClient 验证外部调用逻辑。

### T2-6. AlertsController 测试

GET 告警列表（含分页/过滤）、GET /alerts/{id}（详情）、PUT /alerts/{id}/acknowledge（确认告警）。

### T2-7. AnalysesController 测试

GET 分析报告列表、POST 触发分析。

### T2-8. ApprovalChainsController 测试

GET 审批链模板、POST 创建模板、PUT 更新模板、DELETE 删除模板。

### T2-9. DispatchController 测试

GET 派工推荐列表。

### T2-10. PushSubscriptionsController 测试

GET /push/vapid-public-key（公开端点）、POST /push/subscribe、DELETE /push/subscribe。

### T2-11. SystemController 测试

GET /api/v1/system/info 返回版本号和环境信息。

---

## 子计划 T3：前端 hooks + 关键组件单元测试

### T3-1. 业务 hooks 测试（21 个）

为每个业务 hook 编写测试，覆盖 loading/data/error 三个状态。模式：Mock api 模块 + renderHook + waitFor。

优先覆盖的 hooks（按业务重要性）：
- useKnowledge / useKnowledgeImport — 知识库 CRUD + 导入导出
- useWorkOrders / useWorkOrderDetail — 工单管理
- useDispatch / useSmartDispatch — 智能派工
- useAlerts — 告警列表
- useTelemetry — 遥测数据
- usePushNotifications — 推送通知
- useOfflineQueue — 离线队列
- useIntegration — 集成配置
- useApprovalChain — 审批链
- useSubscription — 订阅管理
- useRegister — 注册流程

### T3-2. 关键业务组件测试

使用 `@testing-library/react` 的 `render` + `screen` + `fireEvent` 测试组件交互：

- DeviceForm — 设备表单提交和校验
- RuleEditDialog — 知识规则编辑对话框
- OfflineSyncPanel — 离线同步面板
- OfflineStatusBadge — 离线状态徽章

---

## 子计划 T4：前端 E2E 业务流程测试

**测试模式**：复用现有 Playwright 配置 + 登录辅助函数。每个业务流程一个 spec 文件。

### T4-1. 设备管理流程（device.spec.ts）

登录 → 导航到设备列表 → 创建设备 → 查看设备详情 → 编辑设备 → 删除设备。

### T4-2. 告警管理流程（alert.spec.ts）

登录 → 导航到告警中心 → 查看告警列表 → 过滤告警 → 确认告警 → 查看告警规则 → 创建规则。

### T4-3. 工单管理流程（workorder.spec.ts）

登录 → 创建工单 → 查看工单列表 → 查看工单详情 → 更新工单状态。

### T4-4. 知识库管理流程（knowledge.spec.ts）

登录 → 导航到知识库 → 查看规则列表 → 创建规则 → 编辑规则 → 导出规则。

---

## 实施约束

1. **遵循现有模式**：单元测试用 InMemory DB + TestTenantContext；集成测试用 CustomWebApplicationFactory；前端用 Vitest + Testing Library
2. **不修改生产代码**：只为测试目的添加必要的 `internalsVisibleTo` 或测试辅助方法
3. **每个测试文件独立**：不依赖其他测试的执行顺序
4. **中文测试方法名**：与现有测试风格保持一致

## 验收标准

1. `dotnet test` 全部通过（后端 301 → ~480 用例）
2. `npm test` 全部通过（前端 93 → ~220 用例）
3. E2E 测试在 dev server 上可通过（4 个业务流程）
4. 无测试代码修改生产代码（仅测试文件新增）
