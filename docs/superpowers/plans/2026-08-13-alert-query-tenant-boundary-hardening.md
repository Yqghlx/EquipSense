# 告警查询与状态变更显式租户边界加固实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让告警列表、详情、确认和解决操作显式绑定当前租户，防止跨租户告警泄露、错误确认或错误解决。

**Architecture:** 保留 `AppDbContext` 全局租户过滤器作为纵深防御；在 `AlertQueryService` 的列表和状态变更资源定位中加入 `_tenantContext.TenantId` 条件。事件仍只在成功变更后发布，异常、状态校验和 Controller 契约保持不变。

**Tech Stack:** .NET 8、EF Core 8、xUnit、FluentAssertions、InMemory provider、Moq。

## Global Constraints

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 不改变 `AlertQueryService` 公开方法签名、事件类型、错误文本或告警状态机。
- 先写红测确认 `FindAsync` 跟踪实体风险，再修改生产代码；完成前运行聚焦测试、完整单元测试和 Release 编译。

---

### Task 1: 建立告警跨租户回归测试

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Alerts/AlertQueryServiceTests.cs`

**Interfaces:**
- Consumes: `AlertQueryService.ListAsync`、`GetAsync`、`AcknowledgeAsync`、`ResolveAsync`。
- Produces: 4 个跨租户回归测试，覆盖列表、详情、确认和解决；确认/解决测试同时保证不会发布事件。

- [x] **Step 1: Write the failing tests**

使用 DbContext 租户 A 与服务租户 B 不一致的固定上下文；告警保存后继续复用同一上下文，旧 `FindAsync` 会命中已跟踪的租户 A 告警：

```csharp
[Fact]
public async Task ListAsync_上下文租户与服务租户不一致_不应返回告警()
{
    await using var db = CreateDb(out var contextTenantId);
    var serviceTenantId = Guid.NewGuid();
    db.Alerts.Add(CreateAlert(contextTenantId));
    await db.SaveChangesAsync();
    var service = CreateService(db, serviceTenantId, out _);

    var result = await service.ListAsync(new PagedQuery { Page = 1, PageSize = 20 });

    result.Items.Should().BeEmpty("告警列表必须显式绑定当前租户");
}

[Fact]
public async Task GetAsync_其他租户告警_应返回null()
{
    await using var db = CreateDb(out var contextTenantId);
    var serviceTenantId = Guid.NewGuid();
    var alert = CreateAlert(contextTenantId);
    db.Alerts.Add(alert);
    await db.SaveChangesAsync();
    var service = CreateService(db, serviceTenantId, out _);

    var result = await service.GetAsync(alert.Id);

    result.Should().BeNull();
}

[Fact]
public async Task AcknowledgeAsync_其他租户告警_应返回不存在且不改变状态()
{
    await using var db = CreateDb(out var contextTenantId);
    var serviceTenantId = Guid.NewGuid();
    var alert = CreateAlert(contextTenantId);
    db.Alerts.Add(alert);
    await db.SaveChangesAsync();
    var service = CreateService(db, serviceTenantId, out var eventBus);

    var (result, error) = await service.AcknowledgeAsync(alert.Id, "越权确认");

    result.Should().BeNull();
    error.Should().Be("告警不存在");
    (await db.Alerts.IgnoreQueryFilters().AsNoTracking().SingleAsync(a => a.Id == alert.Id))
        .Status.Should().Be(AlertStatus.Active);
    eventBus.Verify(
        e => e.PublishAsync(It.IsAny<AlertAcknowledgedEvent>(), It.IsAny<CancellationToken>()),
        Times.Never);
}

[Fact]
public async Task ResolveAsync_其他租户告警_应返回不存在且不改变状态()
{
    await using var db = CreateDb(out var contextTenantId);
    var serviceTenantId = Guid.NewGuid();
    var alert = CreateAlert(contextTenantId);
    db.Alerts.Add(alert);
    await db.SaveChangesAsync();
    var service = CreateService(db, serviceTenantId, out var eventBus);

    var (result, error) = await service.ResolveAsync(alert.Id, "越权解决");

    result.Should().BeNull();
    error.Should().Be("告警不存在");
    (await db.Alerts.IgnoreQueryFilters().AsNoTracking().SingleAsync(a => a.Id == alert.Id))
        .Status.Should().Be(AlertStatus.Active);
    eventBus.Verify(
        e => e.PublishAsync(It.IsAny<AlertResolvedEvent>(), It.IsAny<CancellationToken>()),
        Times.Never);
}
```

- [x] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~AlertQueryServiceTests" --no-restore`

结果：旧实现下 4 个测试全部失败；列表和详情会返回其他租户告警，确认和解决会修改其状态。

### Task 2: 在告警查询与状态变更中加入显式租户谓词

**Files:**
- Modify: `src/EquipAI.Application/Alerts/AlertQueryService.cs:35-130`

**Interfaces:**
- Consumes: Task 1 红测和 `_tenantContext.TenantId`。
- Produces: 列表、详情、确认、解决均显式匹配 `TenantId == _tenantContext.TenantId`。

- [x] **Step 1: Write minimal implementation**

使用以下查询形态替换告警定位：

```csharp
var alerts = _dbContext.Alerts
    .Where(a => a.TenantId == _tenantContext.TenantId)
    .AsQueryable();

var alert = await _dbContext.Alerts
    .FirstOrDefaultAsync(
        a => a.Id == id && a.TenantId == _tenantContext.TenantId,
        ct);
```

确认/解决复用同一复合谓词；仅在找到合法告警并通过状态检查后发布原有事件。

- [x] **Step 2: Run focused tests to verify they pass**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~AlertQueryServiceTests" --no-restore`

结果：4/4 通过；确认/解决测试分别按具体事件类型验证 `Times.Never`，并确认告警仍为 `Active`。

### Task 3: 完整验证、审查和提交

**Files:**
- No additional source files.

**Interfaces:**
- Consumes: Task 2 实现和测试。
- Produces: 聚焦测试、完整单元测试和 Release 编译证据。

- [x] **Step 1: Run complete unit tests**

Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore -nodeReuse:false -maxcpucount:1`

结果：1,526/1,526 通过，0 失败。首次最终运行曾出现一次测试宿主瞬态崩溃，原命令重跑后完整通过。

- [x] **Step 2: Build Release solution**

Run: `dotnet build EquipAI.sln --configuration Release --no-restore -nodeReuse:false -maxcpucount:1 -p:BuildInParallel=false -v:minimal`

结果：Build succeeded，0 errors，0 warnings。

- [x] **Step 3: Review and commit**

结果：`git -c core.fsmonitor=false diff --check` 通过；独立审查结论为 Approved、无 Blocker。审查指出的泛型事件验证盲点已改为按 `AlertAcknowledgedEvent` / `AlertResolvedEvent` 分别验证。本计划随提交信息 `fix(security): enforce tenant boundary in alert query service` 一并提交。
