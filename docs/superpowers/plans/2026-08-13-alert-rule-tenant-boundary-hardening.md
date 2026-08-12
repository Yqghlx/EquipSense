# 告警规则显式租户边界加固实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让告警规则列表、详情、更新、删除和启停操作显式匹配当前租户，阻止跨租户修改或停用告警规则。

**Architecture:** 保留 `AppDbContext` 全局租户过滤器作为纵深防御，同时在 `AlertRuleService` 的列表与按 ID 查询中加入 `_tenantContext.TenantId` 条件。创建规则继续由服务显式写入当前租户 ID，Controller 契约和规则 DTO 不变。

**Tech Stack:** .NET 8、EF Core 8、xUnit、FluentAssertions、InMemory provider、AutoMapper。

## Global Constraints

- 所有新增注释、测试说明和文档使用简体中文。
- 不修改真实凭据、证书、数据库卷或 `docker/.env`。
- 不改变 Controller 路由、状态码、服务方法签名或规则创建逻辑。
- 先写红测复现 `FindAsync` 跟踪实体风险，再修改生产代码；完成前运行聚焦测试、完整单元测试和 Release 编译。

---

### Task 1: 建立告警规则跨租户回归测试

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Alerts/AlertRuleServiceTests.cs`

**Interfaces:**
- Consumes: `AlertRuleService.ListAsync`、`GetAsync`、`UpdateAsync`、`DeleteAsync`、`ToggleAsync`。
- Produces: 5 个跨租户回归测试和 1 个创建归属正向测试，覆盖列表、详情、更新、删除、启停与创建。

- [x] **Step 1: Write the failing tests**

使用固定 `ITenantContext`、InMemory `AppDbContext` 和真实 `MappingProfile`；实体保存后仍在同一上下文中，以复现旧 `FindAsync` 跟踪路径：

```csharp
[Fact]
public async Task ListAsync_上下文租户与服务租户不一致_不应返回上下文租户规则()
{
    await using var db = CreateDb(out var contextTenantId);
    var serviceTenantId = Guid.NewGuid();
    db.AlertRules.Add(CreateRule(contextTenantId, "上下文租户规则"));
    await db.SaveChangesAsync();
    var service = CreateService(db, serviceTenantId);

    var result = await service.ListAsync(new PagedQuery { Page = 1, PageSize = 20 });

    result.Items.Should().BeEmpty("规则列表必须显式绑定当前租户");
}

[Fact]
public async Task GetAsync_其他租户规则_应返回null()
{
    await using var db = CreateDb(out var contextTenantId);
    var serviceTenantId = Guid.NewGuid();
    var rule = CreateRule(contextTenantId, "不可读取规则");
    db.AlertRules.Add(rule);
    await db.SaveChangesAsync();
    var service = CreateService(db, serviceTenantId);

    var result = await service.GetAsync(rule.Id);

    result.Should().BeNull();
}

[Fact]
public async Task UpdateAsync_其他租户规则_应抛出KeyNotFoundException且保持原数据()
{
    await using var db = CreateDb(out var contextTenantId);
    var serviceTenantId = Guid.NewGuid();
    var rule = CreateRule(contextTenantId, "不可修改规则");
    db.AlertRules.Add(rule);
    await db.SaveChangesAsync();
    var service = CreateService(db, serviceTenantId);

    var act = () => service.UpdateAsync(rule.Id, new UpdateAlertRuleRequest { Name = "越权修改" });

    await act.Should().ThrowAsync<KeyNotFoundException>();
    (await db.AlertRules.IgnoreQueryFilters().AsNoTracking().SingleAsync(r => r.Id == rule.Id))
        .Name.Should().Be("不可修改规则");
}

[Fact]
public async Task DeleteAsync_其他租户规则_应抛出KeyNotFoundException且保留原数据()
{
    await using var db = CreateDb(out var contextTenantId);
    var serviceTenantId = Guid.NewGuid();
    var rule = CreateRule(contextTenantId, "不可删除规则");
    db.AlertRules.Add(rule);
    await db.SaveChangesAsync();
    var service = CreateService(db, serviceTenantId);

    var act = () => service.DeleteAsync(rule.Id);

    await act.Should().ThrowAsync<KeyNotFoundException>();
    (await db.AlertRules.IgnoreQueryFilters().AsNoTracking().AnyAsync(r => r.Id == rule.Id))
        .Should().BeTrue();
}

[Fact]
public async Task ToggleAsync_其他租户规则_应返回null且保持启用状态()
{
    await using var db = CreateDb(out var contextTenantId);
    var serviceTenantId = Guid.NewGuid();
    var rule = CreateRule(contextTenantId, "不可停用规则");
    db.AlertRules.Add(rule);
    await db.SaveChangesAsync();
    var service = CreateService(db, serviceTenantId);

    var result = await service.ToggleAsync(rule.Id);

    result.Should().BeNull();
    (await db.AlertRules.IgnoreQueryFilters().AsNoTracking().SingleAsync(r => r.Id == rule.Id))
        .Enabled.Should().BeTrue();
}

[Fact]
public async Task CreateAsync_应写入当前租户()
{
    await using var db = CreateDb(out var tenantId);
    var service = CreateService(db, tenantId);

    var result = await service.CreateAsync(new CreateAlertRuleRequest
    {
        Name = "当前租户新规则",
        Metric = "temperature",
        RuleType = "threshold",
        Operator = "GreaterThan",
        Threshold = 90m,
        Severity = "high",
    });

    result.Name.Should().Be("当前租户新规则");
    (await db.AlertRules.IgnoreQueryFilters().AsNoTracking().SingleAsync(r => r.Id == result.Id))
        .TenantId.Should().Be(tenantId);
}
```

- [x] **Step 2: Run tests to verify they fail**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~AlertRuleServiceTests" --no-restore`

Expected: 5 个新增测试失败，旧实现会返回/修改/删除/停用被跟踪的其他租户规则，列表会返回上下文租户规则。

实际证据：修复前 5 个跨租户测试均失败；详情、更新、删除和启停命中了其他租户的已跟踪实体，列表返回了上下文租户规则。

### Task 2: 在告警规则服务中加入显式租户谓词

**Files:**
- Modify: `src/EquipAI.Application/Alerts/AlertRuleService.cs:13-120`

**Interfaces:**
- Consumes: Task 1 红测和 `_tenantContext.TenantId`。
- Produces: 列表、详情、更新、删除、启停均显式匹配 `TenantId == _tenantContext.TenantId`。

- [x] **Step 1: Write minimal implementation**

使用以下查询形态替换规则定位：

```csharp
var rules = _dbContext.AlertRules
    .Where(r => r.TenantId == _tenantContext.TenantId)
    .AsQueryable();

var rule = await _dbContext.AlertRules
    .FirstOrDefaultAsync(
        r => r.Id == id && r.TenantId == _tenantContext.TenantId,
        ct);
```

更新、删除和启停复用同一复合谓词；保留原异常、null 返回契约和 DTO 映射。

- [x] **Step 2: Run focused tests to verify they pass**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~AlertRuleServiceTests" --no-restore`

Expected: 新增规则服务测试全部通过。

实际证据：`AlertRuleServiceTests` 6/6 通过，包含 5 个跨租户回归测试和 1 个创建归属测试。

### Task 3: 完整验证、审查和提交

**Files:**
- No additional source files.

**Interfaces:**
- Consumes: Task 2 实现和测试。
- Produces: 聚焦测试、完整单元测试和 Release 编译证据。

- [x] **Step 1: Run complete unit tests**

Run: `dotnet test tests/EquipAI.Tests.Unit --no-restore -nodeReuse:false -maxcpucount:1`

Expected: 0 failed。

实际证据：完整单元测试 1522/1522 通过。

- [x] **Step 2: Build Release solution**

Run: `dotnet build EquipAI.sln --configuration Release --no-restore -nodeReuse:false -maxcpucount:1 -p:BuildInParallel=false -v:minimal`

Expected: 0 errors，0 warnings。

实际证据：单节点 Release 方案构建成功，0 Warning、0 Error。

- [x] **Step 3: Review and commit**

Run: `git -c core.fsmonitor=false diff --check`；确认差异仅涉及告警规则租户谓词、对应测试和本计划文档后，使用提交信息 `fix(security): enforce tenant boundary in alert rules` 提交。

实际证据：独立审查 Approved，`git diff --check` 通过；已提交为 `a967def`（`fix(security): enforce tenant boundary in alert rules`）。
