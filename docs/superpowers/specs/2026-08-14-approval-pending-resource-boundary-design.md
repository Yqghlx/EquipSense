# 审批待办查询资源边界设计

## 背景

`ApprovalChainService.GetPendingApprovalsAsync` 当前先按租户、待审批状态和指定审批人条件查询，再将所有候选审批记录一次性加载到应用内存，最后用 `NormalizeRole` 兼容历史角色格式。对于未指定具体审批人的审批链，候选集合会随租户待验收工单数线性增长，可能造成请求内存峰值、较大的 EF 跟踪开销和长时间数据库结果集占用。

该方法由 `GET /api/v1/approval-chains/pending` 直接调用，前端当前消费完整的 `WorkOrderApprovalDto[]` 响应。审批待办是用户可见的工作流入口，不能通过简单 `Take(500)` 静默遗漏待办记录。

## 目标

在不改变现有接口签名和完整结果语义的前提下，将审批待办的数据库实体读取改为有界批次：

1. 每批最多从数据库读取 500 条审批记录。
2. 使用 `WorkOrderApproval.Id` 作为稳定的 keyset 游标，避免 `Skip/Take` 在数据变更时重复或跳过记录。
3. 使用 `AsNoTracking` 和 DTO 所需字段的最小投影，降低只读请求的跟踪开销。
4. 保留显式 `tenantId`、`Action == Pending`、`SpecificApproverId` 和角色规范化过滤语义。
5. 所有匹配的待办最终仍返回给现有 API；不静默截断、不修改前端响应格式。
6. 所有批次都接受调用方取消令牌。

## 非目标

- 本次不把接口改成公开 cursor 分页，不新增 `nextCursor` 响应字段。
- 本次不修改审批授权规则、角色规范化规则、指定审批人语义或审批状态机。
- 本次不把角色历史兼容逻辑强行下推为单一数据库大小写比较，避免不同数据库对分隔符和大小写的行为差异。
- 本次不修改真实生产凭据、`docker/.env`、部署环境或数据库迁移；现有复合索引保持不变。
- 本次不对审批模板列表做同样改造；模板配置规模和访问频率低于待办查询，另行评估。

## 方案

### 查询边界

服务先构造不含角色过滤的基础查询：

- 显式限定 `TenantId == tenantId`；
- 限定 `Action == ApprovalAction.Pending`；
- 限定 `SpecificApproverId == null || SpecificApproverId == approverId`；
- 使用 `AsNoTracking()`；
- 每批按 `Id` 升序读取最多 500 条；
- 后续批次追加 `Id > lastApprovalId`；
- 只投影 `WorkOrderApprovalDto` 所需字段。

每个批次读取后，继续在应用层调用既有 `NormalizeRole` 比较 `ExpectedRole`，将匹配记录映射为 DTO 并追加到完整结果列表。批次为空或数量小于 500 时结束；恰好 500 条时继续执行下一次查询，以确认没有后续记录。所有批次完成后按原有 `StepOrder` 升序返回，并以 `Id` 升序作为确定性次排序，保持用户待办的步骤顺序。

### 语义与安全

显式租户条件继续位于基础查询中，因此服务内部新 scope 不依赖当前请求的全局过滤器来决定结果范围。缺失角色仍在访问数据库前直接返回空列表；指定审批人筛选仍在数据库侧执行；角色历史格式仍在租户范围内规范化比较，不扩大数据可见性。

该设计只限制应用层单批实体/投影内存。由于现有返回类型要求一次返回完整数组，最终结果列表仍会随真实匹配数量增长；若未来需要限制 HTTP 响应体和端到端内存，应单独设计公开 cursor 分页 API，而不能在本次改动中静默截断。

## 测试策略

新增 SQLite 内存数据库回归测试，使用真实 `AppDbContext`、固定租户上下文和 `DbCommandInterceptor`：

- 种子 501 条同租户、待审批、同角色的审批记录，其中包含未指定审批人记录以覆盖主要大集合路径；
- 调用 `GetPendingApprovalsAsync`，断言返回 501 条且 ID 集合完整；
- 断言审批表 SELECT 恰好两次，并且每条 SQL 都包含 `LIMIT`；
- 在跨批次记录中混入 PascalCase、snake_case 和大小写差异，确认角色规范化仍返回全部匹配记录；
- 保留既有缺失角色、指定审批人和显式租户隔离回归。

验收还包括审批服务聚焦测试、全量单元/集成测试、Release 构建、生产脚本契约、Shell 语法和差异检查。

## 文档同步

验证通过后，更新当前状态段落和测试基线：

- `docs/evaluation/00-INDEX.md`
- `docs/evaluation/05-代码质量分析.md`
- `docs/evaluation/08-DevOps与CI_CD分析.md`
- `docs/evaluation/11-性能与可扩展性基准分析.md`
- `docs/evaluation/14-测试策略与金字塔分析.md`
- `docs/evaluation/S09-风险登记册.md`
- `docs/LANDING_READINESS_REPORT.md`

文档必须明确：本次是应用层批次资源边界，不替代真实 PostgreSQL 大租户查询计划、锁竞争、响应体大小和容量基线验收。

## 验收标准

- 新增回归在旧实现上因一次无 `LIMIT` 查询而失败。
- 改造后 501 条审批记录完整返回，数据库侧恰好跨越两个 500 条批次，且每批 SQL 含 `LIMIT`。
- 既有租户、指定审批人、角色规范化、缺失角色 fail-closed 语义全部通过。
- API 路由、HTTP 状态和 `List<WorkOrderApprovalDto>` 返回结构不变。
- 后端全量测试、Release 构建和生产脚本门禁通过。
- 不修改 `docker/.env`，不执行 Git 暂存、提交或推送。
