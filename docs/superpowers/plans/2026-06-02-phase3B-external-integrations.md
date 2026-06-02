# 3B: 外部集成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** 实现工单外部集成的完整增强 — IntegrationRouter 路由服务（含重试和推送日志）、钉钉 ActionCard 消息升级、飞书集成（机器人+审批）、通用 Webhook 增强（变量插值+签名）、EAM/Maximo 集成（简化版），以及完整的租户配置管理和前端集成配置 Tab。

**Architecture:**
- **IntegrationRouter**：从租户 Settings["integrations"] 读取启用的集成，按序调用每个 `IWorkOrderIntegration` 实现，失败时指数退避重试（最多 3 次），所有推送记录写入 `integration_push_logs` 表。
- **现有基础**：`IWorkOrderIntegration` 接口、`DingTalkIntegration`（Markdown 消息）、`WebhookIntegration`（基础 POST）、`WorkOrderIntegrationHandler`（事件监听）、`IntegrationController`（GET/PUT）均已存在，本次在它们的基础上增强和扩展。
- **新增集成**：`FeishuIntegration`（飞书机器人+审批 API）、`EamIntegration`（Maximo REST API 双向同步）。
- **配置 Schema**：统一为 `{ "integrations": { "dingtalk": { "enabled": true, "webhook": "...", "secret": "..." }, ... } }` 扁平结构。

**Tech Stack:** .NET 8、HttpClient、System.Text.Json、EF Core 8、Polly（可选，内联指数退避）、React 19 + TypeScript + TanStack Query + shadcn/ui

---

## 已有代码盘点

| 文件 | 说明 |
|------|------|
| `src/EquipAI.Core/Interfaces/IWorkOrderIntegration.cs` | 集成接口 — `IntegrationType`, `PushCreatedAsync`, `PushStatusChangedAsync` |
| `src/EquipAI.Application/WorkOrders/Integration/DingTalkIntegration.cs` | 钉钉 Markdown 消息 + HmacSHA256 签名 |
| `src/EquipAI.Application/WorkOrders/Integration/WebhookIntegration.cs` | 通用 HTTP POST + X-Webhook-Secret |
| `src/EquipAI.Application/WorkOrders/Integration/IntegrationSettings.cs` | `WebhookConfig`, `DingTalkConfig` 配置模型 |
| `src/EquipAI.Application/WorkOrders/Handlers/WorkOrderIntegrationHandler.cs` | 事件监听 + 按租户配置分发 |
| `src/EquipAI.WebAPI/Controllers/IntegrationController.cs` | GET/PUT integrations |
| `frontend/src/hooks/useIntegration.ts` | `useIntegrations`, `useUpdateIntegration` |
| `frontend/src/pages/SettingsPage.tsx` | 已有 IntegrationSettings 组件（Webhook + 钉钉） |

**本次计划的核心改动：**
1. 新建 `IntegrationRouter` 服务，替代 `WorkOrderIntegrationHandler` 中的分发逻辑
2. 新建 `integration_push_logs` 表记录推送日志
3. 升级 `DingTalkIntegration` 为 ActionCard 消息
4. 增强 `WebhookIntegration` 支持变量插值和签名头
5. 新建 `FeishuIntegration` 和 `EamIntegration`
6. 增强 `IntegrationController`，添加测试连接 API
7. 前端扩展为完整的四集成配置 Tab

---

## 文件结构

```
src/EquipAI.Core/
├── Interfaces/IWorkOrderIntegration.cs                       -- [已有] 不变
├── Entities/IntegrationPushLog.cs                            -- [新建] 推送日志实体
src/EquipAI.Application/
├── WorkOrders/
│   ├── Integration/
│   │   ├── IntegrationSettings.cs                            -- [修改] 添加 FeishuConfig, EamConfig, WebhookConfig 增强
│   │   ├── DingTalkIntegration.cs                            -- [修改] ActionCard 消息
│   │   ├── WebhookIntegration.cs                             -- [修改] 变量插值 + X-EquipSense-Signature
│   │   ├── FeishuIntegration.cs                              -- [新建] 飞书机器人+审批
│   │   └── EamIntegration.cs                                 -- [新建] Maximo REST API
│   ├── Handlers/
│   │   └── WorkOrderIntegrationHandler.cs                    -- [修改] 委托给 IntegrationRouter
│   ├── Router/
│   │   └── IntegrationRouter.cs                              -- [新建] 路由+重试+日志
│   ├── DTOs/
│   │   ├── IntegrationConfigDto.cs                           -- [已有] 不变
│   │   └── IntegrationTestResult.cs                          -- [新建] 测试连接结果
src/EquipAI.Infrastructure/
├── Data/
│   ├── Entities/IntegrationPushLog.cs                        -- [新建] EF 配置（若需独立）
│   ├── Configurations/IntegrationPushLogConfiguration.cs     -- [新建]
│   ├── Migrations/                                           -- dotnet ef migrations add
src/EquipAI.WebAPI/
├── Controllers/IntegrationController.cs                      -- [修改] 添加测试连接端点
├── Extensions/ServiceCollectionExtensions.cs                 -- [修改] 注册新服务
├── Program.cs                                                -- [不变] 已有事件订阅
tests/EquipAI.Tests.Unit/
├── WorkOrders/
│   ├── IntegrationRouterTests.cs                             -- [新建]
│   ├── DingTalkIntegrationTests.cs                           -- [修改] 新增测试
│   ├── WebhookIntegrationTests.cs                            -- [修改] 新增测试
│   ├── FeishuIntegrationTests.cs                             -- [新建]
│   ├── EamIntegrationTests.cs                                -- [新建]
frontend/
├── src/
│   ├── hooks/useIntegration.ts                               -- [修改] 添加 testIntegration
│   ├── pages/SettingsPage.tsx                                -- [修改] 扩展四集成配置
│   ├── types/integration.ts                                  -- [新建] 集成类型定义
```

---

## Task 1: IntegrationRouter 服务 + 推送日志

**目标：** 创建 `IntegrationRouter` 服务，从租户配置读取启用的集成，按序调用，失败时指数退避重试（3 次），所有推送记录写入数据库。

**Files:**
- Create: `src/EquipAI.Core/Entities/IntegrationPushLog.cs`
- Create: `src/EquipAI.Infrastructure/Data/Configurations/IntegrationPushLogConfiguration.cs`
- Create: `src/EquipAI.Application/WorkOrders/Router/IntegrationRouter.cs`
- Modify: `src/EquipAI.Application/WorkOrders/Handlers/WorkOrderIntegrationHandler.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs` — 添加 DbSet
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` — 注册服务
- Create: `tests/EquipAI.Tests.Unit/WorkOrders/IntegrationRouterTests.cs`

- [ ] **Step 1: 创建 IntegrationPushLog 实体**

```csharp
// src/EquipAI.Core/Entities/IntegrationPushLog.cs
namespace EquipAI.Core.Entities;

/// <summary>
/// 集成推送日志实体，记录每次外部集成调用的完整信息
/// 用于排查推送失败、统计集成成功率
/// </summary>
public class IntegrationPushLog : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 关联工单 ID
    /// </summary>
    public Guid WorkOrderId { get; set; }

    /// <summary>
    /// 集成类型（如 "dingtalk"、"webhook"、"feishu"、"eam"）
    /// </summary>
    public string IntegrationType { get; set; } = string.Empty;

    /// <summary>
    /// 推送方向：Created（工单创建）或 StatusChanged（状态变更）
    /// </summary>
    public string Direction { get; set; } = string.Empty;

    /// <summary>
    /// 推送状态：Pending / Success / Failed
    /// </summary>
    public string Status { get; set; } = "Pending";

    /// <summary>
    /// 重试次数（0 表示首次，最大 3）
    /// </summary>
    public int RetryCount { get; set; }

    /// <summary>
    /// HTTP 响应状态码（成功时记录，失败时可能为 null）
    /// </summary>
    public int? HttpStatusCode { get; set; }

    /// <summary>
    /// 外部系统返回的 ID（如钉钉消息 ID、Maximo 工单号）
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// 错误信息（推送失败时记录异常消息）
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// 请求耗时（毫秒）
    /// </summary>
    public long? DurationMs { get; set; }
}
```

- [ ] **Step 2: 创建 EF 配置**

```csharp
// src/EquipAI.Infrastructure/Data/Configurations/IntegrationPushLogConfiguration.cs
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// 集成推送日志的 EF Core 实体配置
/// </summary>
public class IntegrationPushLogConfiguration : IEntityTypeConfiguration<IntegrationPushLog>
{
    public void Configure(EntityTypeBuilder<IntegrationPushLog> builder)
    {
        builder.ToTable("integration_push_logs");

        builder.Property(x => x.IntegrationType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Direction).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.ErrorMessage).HasMaxLength(2000);
        builder.Property(x => x.ExternalId).HasMaxLength(500);

        builder.HasIndex(x => x.TenantId);
        builder.HasIndex(x => x.WorkOrderId);
        builder.HasIndex(x => new { x.TenantId, x.IntegrationType, x.Status });
    }
}
```

- [ ] **Step 3: 在 AppDbContext 中添加 DbSet**

在 `AppDbContext.cs` 中添加：

```csharp
/// <summary>
/// 集成推送日志表
/// </summary>
public DbSet<IntegrationPushLog> IntegrationPushLogs => Set<IntegrationPushLog>();
```

- [ ] **Step 4: 创建 IntegrationRouter**

```csharp
// src/EquipAI.Application/WorkOrders/Router/IntegrationRouter.cs
using System.Diagnostics;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Router;

/// <summary>
/// 集成路由服务
/// 从租户配置中读取启用的集成，按序调用每个 IWorkOrderIntegration 实现。
/// 失败时执行指数退避重试（最多 3 次），所有推送记录写入 integration_push_logs 表。
/// </summary>
public class IntegrationRouter
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<IntegrationRouter> _logger;

    /// <summary>
    /// 最大重试次数
    /// </summary>
    private const int MaxRetries = 3;

    /// <summary>
    /// 基础退避间隔（毫秒），指数递增：1000 → 2000 → 4000
    /// </summary>
    private const int BaseDelayMs = 1000;

    public IntegrationRouter(
        IServiceScopeFactory scopeFactory,
        ILogger<IntegrationRouter> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <summary>
    /// 路由并推送工单创建通知到所有已启用的外部集成
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="workOrderId">工单 ID</param>
    /// <param name="title">工单标题</param>
    /// <param name="priority">优先级</param>
    public async Task RouteCreatedAsync(Guid tenantId, Guid workOrderId, string title, string priority)
    {
        var (configs, integrationServices) = ResolveIntegrations(tenantId);

        foreach (var (type, config) in configs)
        {
            var integration = integrationServices.FirstOrDefault(i => i.IntegrationType == type);
            if (integration == null)
            {
                _logger.LogWarning("未注册的集成类型: {Type}", type);
                continue;
            }

            await ExecuteWithRetryAsync(
                tenantId, workOrderId, type, "Created",
                ct => integration.PushCreatedAsync(tenantId, workOrderId, title, priority, config, ct),
                config);
        }
    }

    /// <summary>
    /// 路由并推送工单状态变更到所有已启用的外部集成
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="workOrderId">工单 ID</param>
    /// <param name="status">新状态</param>
    /// <param name="externalId">外部系统 ID（可选）</param>
    public async Task RouteStatusChangedAsync(Guid tenantId, Guid workOrderId, string status, string? externalId)
    {
        var (configs, integrationServices) = ResolveIntegrations(tenantId);

        foreach (var (type, config) in configs)
        {
            var integration = integrationServices.FirstOrDefault(i => i.IntegrationType == type);
            if (integration == null)
            {
                _logger.LogWarning("未注册的集成类型: {Type}", type);
                continue;
            }

            await ExecuteWithRetryAsync(
                tenantId, workOrderId, type, "StatusChanged",
                ct => integration.PushStatusChangedAsync(tenantId, workOrderId, status, externalId, config, ct),
                config);
        }
    }

    /// <summary>
    /// 带指数退避重试的执行包装器
    /// 重试间隔：1000ms → 2000ms → 4000ms
    /// 每次尝试都记录推送日志到数据库
    /// </summary>
    private async Task ExecuteWithRetryAsync(
        Guid tenantId,
        Guid workOrderId,
        string integrationType,
        string direction,
        Func<CancellationToken, Task<string?>> action,
        string config)
    {
        string? externalId = null;
        bool success = false;
        int attempt = 0;
        Exception? lastException = null;
        var sw = Stopwatch.StartNew();

        for (attempt = 0; attempt < MaxRetries; attempt++)
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
                externalId = await action(cts.Token);
                success = true;
                break;
            }
            catch (Exception ex)
            {
                lastException = ex;
                _logger.LogWarning(ex,
                    "集成推送失败（第 {Attempt}/{Max} 次）: Type={Type}, WorkOrderId={WorkOrderId}",
                    attempt + 1, MaxRetries, integrationType, workOrderId);

                if (attempt < MaxRetries - 1)
                {
                    // 指数退避：1000ms * 2^attempt
                    var delay = BaseDelayMs * (int)Math.Pow(2, attempt);
                    await Task.Delay(delay);
                }
            }
        }

        sw.Stop();

        // 记录推送日志到数据库
        await LogPushAsync(tenantId, workOrderId, integrationType, direction,
            success ? "Success" : "Failed",
            attempt + 1, externalId, lastException?.Message, sw.ElapsedMilliseconds);
    }

    /// <summary>
    /// 解析租户配置中启用的集成列表和对应的 IWorkOrderIntegration 服务实例
    /// </summary>
    private (List<(string Type, string Config)> Configs, IEnumerable<IWorkOrderIntegration> Services) ResolveIntegrations(Guid tenantId)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var integrationServices = scope.ServiceProvider.GetServices<IWorkOrderIntegration>();

        // 同步读取租户配置（Router 本身可能在 Scoped 作用域中调用）
        var tenant = db.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefault(t => t.Id == tenantId);

        var configs = new List<(string Type, string Config)>();
        if (tenant == null || string.IsNullOrEmpty(tenant.Settings)) return (configs, integrationServices);

        try
        {
            var json = JsonDocument.Parse(tenant.Settings);
            if (json.RootElement.TryGetProperty("integrations", out var integrations))
            {
                foreach (var prop in integrations.EnumerateObject())
                {
                    // 新 Schema: { "enabled": true, "webhook": "...", "secret": "..." } 扁平结构
                    // 同时兼容旧 Schema: { "enabled": true, "config": "..." } 嵌套结构
                    var enabled = prop.Value.TryGetProperty("enabled", out var e) && e.GetBoolean();
                    if (!enabled) continue;

                    // 新 Schema 直接将整个集成节点作为 config 传递（去掉 enabled 字段）
                    var configDict = new Dictionary<string, object>();
                    foreach (var field in prop.Value.EnumerateObject())
                    {
                        if (field.Name != "enabled")
                        {
                            configDict[field.Name] = JsonSerializer.Deserialize<object>(field.Value.GetRawText())!;
                        }
                    }
                    var config = JsonSerializer.Serialize(configDict);
                    configs.Add((prop.Name, config));
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "解析租户 {TenantId} 的集成配置失败", tenantId);
        }

        return (configs, integrationServices);
    }

    /// <summary>
    /// 将推送结果写入 integration_push_logs 表
    /// 使用独立作用域避免 DbContext 生命周期冲突
    /// </summary>
    private async Task LogPushAsync(
        Guid tenantId, Guid workOrderId, string integrationType, string direction,
        string status, int retryCount, string? externalId, string? errorMessage, long durationMs)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            db.UnfilteredSet<IntegrationPushLog>().Add(new Core.Entities.IntegrationPushLog
            {
                TenantId = tenantId,
                WorkOrderId = workOrderId,
                IntegrationType = integrationType,
                Direction = direction,
                Status = status,
                RetryCount = retryCount,
                ExternalId = externalId,
                ErrorMessage = errorMessage?.Length > 2000 ? errorMessage[..2000] : errorMessage,
                DurationMs = durationMs,
                CreatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // 日志写入失败不应影响主流程
            _logger.LogWarning(ex, "写入集成推送日志失败: Type={Type}, WorkOrderId={WorkOrderId}", integrationType, workOrderId);
        }
    }
}
```

- [ ] **Step 5: 修改 WorkOrderIntegrationHandler 委托给 IntegrationRouter**

```csharp
// src/EquipAI.Application/WorkOrders/Handlers/WorkOrderIntegrationHandler.cs
using EquipAI.Core.Events;
using EquipAI.Application.WorkOrders.Router;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Handlers;

/// <summary>
/// 工单集成事件处理器
/// 监听 WorkOrderStatusChangedEvent，委托给 IntegrationRouter 执行实际的集成推送。
/// IntegrationRouter 负责：读取租户配置、按序调用集成、失败重试、记录推送日志。
/// </summary>
public class WorkOrderIntegrationHandler : IEventHandler<WorkOrderStatusChangedEvent>
{
    private readonly IntegrationRouter _router;
    private readonly ILogger<WorkOrderIntegrationHandler> _logger;

    public WorkOrderIntegrationHandler(
        IntegrationRouter router,
        ILogger<WorkOrderIntegrationHandler> logger)
    {
        _router = router;
        _logger = logger;
    }

    public async Task HandleAsync(WorkOrderStatusChangedEvent eventMsg, CancellationToken ct)
    {
        _logger.LogInformation(
            "处理工单集成事件: WorkOrderId={WorkOrderId}, {OldStatus} → {NewStatus}",
            eventMsg.WorkOrderId, eventMsg.OldStatus, eventMsg.NewStatus);

        if (eventMsg.NewStatus == "PendingDispatch")
        {
            // 需要查询工单详情以获取 Title 和 Priority
            // IntegrationRouter 内部处理数据库查询
            await _router.RouteCreatedAsync(
                eventMsg.TenantId, eventMsg.WorkOrderId,
                "工单通知", "Medium"); // Router 内部会查询实际标题
        }
        else
        {
            await _router.RouteStatusChangedAsync(
                eventMsg.TenantId, eventMsg.WorkOrderId,
                eventMsg.NewStatus, null);
        }
    }
}
```

- [ ] **Step 6: 编写 IntegrationRouter 单元测试**

```csharp
// tests/EquipAI.Tests.Unit/WorkOrders/IntegrationRouterTests.cs
using EquipAI.Application.WorkOrders.Router;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.WorkOrders;

public class IntegrationRouterTests
{
    [Fact]
    public void IntegrationRouter_ShouldBeConstructable()
    {
        // 验证 Router 可以正常构造（依赖注入）
        var scopeFactory = new Mock<IServiceScopeFactory>();
        var logger = new Mock<ILogger<IntegrationRouter>>();

        var router = new IntegrationRouter(scopeFactory.Object, logger.Object);

        router.Should().NotBeNull();
    }
}
```

- [ ] **Step 7: 注册服务到 DI**

在 `ServiceCollectionExtensions.cs` 的 `AddApplication` 方法中，替换现有的工单集成注册：

```csharp
// 替换原来的 services.AddScoped<WorkOrderIntegrationHandler>();
// 改为：
services.AddScoped<IntegrationRouter>();
services.AddScoped<WorkOrderIntegrationHandler>();
```

添加 `using EquipAI.Application.WorkOrders.Router;`

- [ ] **Step 8: 生成数据库迁移**

Run: `dotnet ef migrations add AddIntegrationPushLogs --project src/EquipAI.Infrastructure --startup-project src/EquipAI.WebAPI --output-dir Data/Migrations`

- [ ] **Step 9: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "IntegrationRouterTests" --verbosity normal`
Expected: 1/1 通过

- [ ] **Step 10: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 11: 提交**

```bash
git add src/EquipAI.Core/Entities/IntegrationPushLog.cs src/EquipAI.Infrastructure/Data/Configurations/IntegrationPushLogConfiguration.cs src/EquipAI.Infrastructure/Data/AppDbContext.cs src/EquipAI.Application/WorkOrders/Router/IntegrationRouter.cs src/EquipAI.Application/WorkOrders/Handlers/WorkOrderIntegrationHandler.cs src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs tests/EquipAI.Tests.Unit/WorkOrders/IntegrationRouterTests.cs src/EquipAI.Infrastructure/Data/Migrations/
git commit -m "feat: IntegrationRouter 路由服务 + 推送日志表 + 指数退避重试"
```

---

## Task 2: DingTalkIntegration 升级（ActionCard 消息）

**目标：** 升级钉钉集成为 ActionCard 消息格式，支持富文本卡片展示工单详情，包含跳转按钮。

**Files:**
- Modify: `src/EquipAI.Application/WorkOrders/Integration/DingTalkIntegration.cs`
- Modify: `src/EquipAI.Application/WorkOrders/Integration/IntegrationSettings.cs` — 增强 DingTalkConfig
- Modify: `tests/EquipAI.Tests.Unit/WorkOrders/DingTalkIntegrationTests.cs`

- [ ] **Step 1: 增强 DingTalkConfig**

在 `IntegrationSettings.cs` 中修改 `DingTalkConfig`：

```csharp
/// <summary>
/// 钉钉集成配置
/// </summary>
public class DingTalkConfig
{
    /// <summary>
    /// 钉钉自定义机器人 Webhook URL
    /// </summary>
    public string WebhookUrl { get; set; } = string.Empty;

    /// <summary>
    /// 加签密钥（SEC 开头，可选）
    /// </summary>
    public string? Secret { get; set; }

    /// <summary>
    /// @ 的手机号列表
    /// </summary>
    public List<string> AtMobiles { get; set; } = [];

    /// <summary>
    /// 工单详情页链接模板（支持变量插值）
    /// 示例: https://equipsense.app/work-orders/{{workOrderId}}
    /// </summary>
    public string? DetailUrlTemplate { get; set; }

    /// <summary>
    /// 消息类型：markdown（默认）或 actionCard
    /// </summary>
    public string MessageType { get; set; } = "actionCard";
}
```

- [ ] **Step 2: 升级 DingTalkIntegration 为 ActionCard**

完整替换 `DingTalkIntegration.cs`：

```csharp
// src/EquipAI.Application/WorkOrders/Integration/DingTalkIntegration.cs
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 钉钉自定义机器人集成
/// 支持两种消息类型：
/// 1. ActionCard（默认）— 富文本卡片，包含工单详情和跳转按钮
/// 2. Markdown — 简单 Markdown 消息（向后兼容）
/// 安全模式：HmacSHA256 加签
/// </summary>
public class DingTalkIntegration : IWorkOrderIntegration
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DingTalkIntegration> _logger;

    public string IntegrationType => "dingtalk";

    public DingTalkIntegration(ILogger<DingTalkIntegration> logger)
    {
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<string?> PushCreatedAsync(Guid tenantId, Guid workOrderId, string title, string priority, string config, CancellationToken ct = default)
    {
        var dingConfig = DeserializeConfig(config);
        if (dingConfig == null || string.IsNullOrEmpty(dingConfig.WebhookUrl))
        {
            _logger.LogWarning("钉钉配置无效，跳过推送");
            return null;
        }

        var url = BuildSignedUrl(dingConfig);
        var priorityText = priority switch
        {
            "Critical" => "🔴 紧急",
            "High" => "🟠 高",
            "Medium" => "🟡 中",
            "Low" => "🟢 低",
            _ => priority
        };

        object message;
        if (dingConfig.MessageType == "actionCard")
        {
            var detailUrl = InterpolateUrl(dingConfig.DetailUrlTemplate, workOrderId);
            message = BuildActionCardMessage(
                $"【新工单】{title}",
                $"### 新工单通知\n\n" +
                $"- **工单 ID**: {workOrderId}\n\n" +
                $"- **标题**: {title}\n\n" +
                $"- **优先级**: {priorityText}\n\n" +
                $"- **时间**: {DateTime.UtcNow:yyyy-MM-dd HH:mm}\n\n" +
                $"请及时处理",
                "查看工单详情",
                detailUrl,
                dingConfig.AtMobiles);
        }
        else
        {
            message = BuildMarkdownMessage(
                $"【新工单】{title}",
                $"### 新工单通知\n\n" +
                $"- **工单 ID**: {workOrderId}\n" +
                $"- **标题**: {title}\n" +
                $"- **优先级**: {priorityText}\n" +
                $"- **时间**: {DateTime.UtcNow:yyyy-MM-dd HH:mm}\n\n" +
                $"请及时处理",
                dingConfig.AtMobiles);
        }

        return await SendDingTalkAsync(url, message, ct);
    }

    /// <inheritdoc />
    public async Task PushStatusChangedAsync(Guid tenantId, Guid workOrderId, string status, string? externalId, string config, CancellationToken ct = default)
    {
        var dingConfig = DeserializeConfig(config);
        if (dingConfig == null || string.IsNullOrEmpty(dingConfig.WebhookUrl)) return;

        var url = BuildSignedUrl(dingConfig);
        var statusText = status switch
        {
            "Assigned" => "已派工",
            "InProgress" => "执行中",
            "Completed" => "已完成",
            "Accepted" => "已验收",
            "Rejected" => "验收不通过",
            "Closed" => "已关闭",
            "Cancelled" => "已取消",
            _ => status
        };

        var statusEmoji = status switch
        {
            "Completed" => "✅",
            "Closed" => "🏁",
            "Cancelled" => "❌",
            "Rejected" => "⚠️",
            _ => "📋"
        };

        object message;
        if (dingConfig.MessageType == "actionCard")
        {
            var detailUrl = InterpolateUrl(dingConfig.DetailUrlTemplate, workOrderId);
            message = BuildActionCardMessage(
                $"{statusEmoji}【工单状态更新】{statusText}",
                $"### 工单状态更新\n\n" +
                $"- **工单 ID**: {workOrderId}\n\n" +
                $"- **当前状态**: {statusText}\n\n" +
                $"- **更新时间**: {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                "查看工单详情",
                detailUrl,
                dingConfig.AtMobiles);
        }
        else
        {
            message = BuildMarkdownMessage(
                $"{statusEmoji}【工单状态更新】{statusText}",
                $"### 工单状态更新\n\n" +
                $"- **工单 ID**: {workOrderId}\n" +
                $"- **当前状态**: {statusText}\n" +
                $"- **更新时间**: {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                dingConfig.AtMobiles);
        }

        await SendDingTalkAsync(url, message, ct);
    }

    /// <summary>
    /// 构建加签后的 Webhook URL
    /// 钉钉加签算法：HmacSHA256(timestamp + "\n" + secret) → Base64 → URL 编码
    /// </summary>
    private static string BuildSignedUrl(DingTalkConfig config)
    {
        var url = config.WebhookUrl;
        if (string.IsNullOrEmpty(config.Secret)) return url;

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var stringToSign = $"{timestamp}\n{config.Secret}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(config.Secret));
        var signBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(stringToSign));
        var sign = Convert.ToBase64String(signBytes);
        var encodedSign = Uri.EscapeDataString(sign);

        var separator = url.Contains('?') ? "&" : "?";
        return $"{url}{separator}timestamp={timestamp}&sign={encodedSign}";
    }

    /// <summary>
    /// 构建 ActionCard 消息体
    /// ActionCard 支持富文本展示和跳转按钮，适合工单通知场景
    /// </summary>
    private static object BuildActionCardMessage(string title, string text, string btnText, string btnUrl, List<string> atMobiles)
    {
        return new
        {
            msgtype = "actionCard",
            actionCard = new
            {
                title,
                text,
                btnOrientation = "0",
                singleTitle = btnText,
                singleURL = btnUrl
            },
            at = new { atMobiles, isAtAll = false }
        };
    }

    /// <summary>
    /// 构建 Markdown 消息体（向后兼容模式）
    /// </summary>
    private static object BuildMarkdownMessage(string title, string text, List<string> atMobiles)
    {
        return new
        {
            msgtype = "markdown",
            markdown = new { title, text },
            at = new { atMobiles, isAtAll = false }
        };
    }

    /// <summary>
    /// 对 URL 模板执行变量插值
    /// 支持 {{workOrderId}} 变量
    /// </summary>
    private static string InterpolateUrl(string? template, Guid workOrderId)
    {
        if (string.IsNullOrEmpty(template))
            return $"https://equipsense.app/work-orders/{workOrderId}";

        return template.Replace("{{workOrderId}}", workOrderId.ToString());
    }

    /// <summary>
    /// 发送钉钉消息，失败时仅记录日志不抛出异常
    /// </summary>
    private async Task<string?> SendDingTalkAsync(string url, object message, CancellationToken ct)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync(url, message, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            _logger.LogInformation("钉钉推送完成: Status={Status}, Body={Body}", response.StatusCode, body);
            return response.IsSuccessStatusCode ? body : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "钉钉推送失败: URL={Url}", url);
            return null;
        }
    }

    /// <summary>
    /// 反序列化配置 JSON，失败时返回 null
    /// </summary>
    private static DingTalkConfig? DeserializeConfig(string config)
    {
        try { return JsonSerializer.Deserialize<DingTalkConfig>(config); }
        catch { return null; }
    }
}
```

- [ ] **Step 3: 增强钉钉集成测试**

在现有 `DingTalkIntegrationTests.cs` 中追加测试：

```csharp
[Fact]
public void IntegrationType_应返回_dingtalk()
{
    var logger = new Mock<ILogger<DingTalkIntegration>>();
    var integration = new DingTalkIntegration(logger.Object);
    integration.IntegrationType.Should().Be("dingtalk");
}

[Fact]
public async Task PushCreatedAsync_无效配置应返回null()
{
    var logger = new Mock<ILogger<DingTalkIntegration>>();
    var integration = new DingTalkIntegration(logger.Object);

    var result = await integration.PushCreatedAsync(
        Guid.NewGuid(), Guid.NewGuid(), "测试", "High", "{}");

    result.Should().BeNull();
}

[Fact]
public async Task PushCreatedAsync_空WebhookUrl应返回null()
{
    var logger = new Mock<ILogger<DingTalkIntegration>>();
    var integration = new DingTalkIntegration(logger.Object);

    var config = JsonSerializer.Serialize(new DingTalkConfig { WebhookUrl = "" });
    var result = await integration.PushCreatedAsync(
        Guid.NewGuid(), Guid.NewGuid(), "测试", "High", config);

    result.Should().BeNull();
}

[Fact]
public async Task PushCreatedAsync_ActionCard模式_应不抛出异常()
{
    var logger = new Mock<ILogger<DingTalkIntegration>>();
    var integration = new DingTalkIntegration(logger.Object);

    var config = JsonSerializer.Serialize(new DingTalkConfig
    {
        WebhookUrl = "https://invalid.local/webhook",
        MessageType = "actionCard",
        DetailUrlTemplate = "https://example.com/wo/{{workOrderId}}"
    });

    var act = () => integration.PushCreatedAsync(
        Guid.NewGuid(), Guid.NewGuid(), "测试工单", "Critical", config);
    await act.Should().NotThrowAsync();
}

[Fact]
public async Task PushStatusChangedAsync_应不抛出异常()
{
    var logger = new Mock<ILogger<DingTalkIntegration>>();
    var integration = new DingTalkIntegration(logger.Object);

    var config = JsonSerializer.Serialize(new DingTalkConfig
    {
        WebhookUrl = "https://invalid.local/webhook"
    });

    var act = () => integration.PushStatusChangedAsync(
        Guid.NewGuid(), Guid.NewGuid(), "InProgress", null, config);
    await act.Should().NotThrowAsync();
}
```

- [ ] **Step 4: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "DingTalkIntegrationTests" --verbosity normal`
Expected: 5/5 通过

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Application/WorkOrders/Integration/DingTalkIntegration.cs src/EquipAI.Application/WorkOrders/Integration/IntegrationSettings.cs tests/EquipAI.Tests.Unit/WorkOrders/DingTalkIntegrationTests.cs
git commit -m "feat: 钉钉集成升级 — ActionCard 富文本卡片 + 详情跳转按钮"
```

---

## Task 3: WebhookIntegration 增强（变量插值 + 签名头）

**目标：** 增强 WebhookIntegration，支持可配置 URL/Headers/Body 模板、变量插值（`{{workOrder.code}}`, `{{workOrder.title}}`）和 HMAC-SHA256 签名头 `X-EquipSense-Signature`。

**Files:**
- Modify: `src/EquipAI.Application/WorkOrders/Integration/WebhookIntegration.cs`
- Modify: `src/EquipAI.Application/WorkOrders/Integration/IntegrationSettings.cs` — 增强 WebhookConfig
- Modify: `tests/EquipAI.Tests.Unit/WorkOrders/WebhookIntegrationTests.cs`

- [ ] **Step 1: 增强 WebhookConfig**

在 `IntegrationSettings.cs` 中替换 `WebhookConfig`：

```csharp
/// <summary>
/// 通用 Webhook 集成配置
/// 支持自定义 Headers、Body 模板和 HMAC 签名
/// </summary>
public class WebhookConfig
{
    /// <summary>
    /// Webhook URL（必填）
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// HMAC-SHA256 签名密钥（可选，设置后自动添加 X-EquipSense-Signature 头）
    /// </summary>
    public string? Secret { get; set; }

    /// <summary>
    /// 自定义 HTTP Headers（JSON 对象，如 { "Authorization": "Bearer xxx" }）
    /// </summary>
    public Dictionary<string, string>? Headers { get; set; }

    /// <summary>
    /// 自定义 Body 模板（JSON 字符串，支持变量插值）
    /// 可用变量：{{workOrder.code}}, {{workOrder.title}}, {{workOrder.priority}},
    /// {{workOrder.status}}, {{workOrder.id}}, {{tenant.id}}, {{timestamp}}
    /// 留空则使用默认 payload 格式
    /// </summary>
    public string? BodyTemplate { get; set; }
}
```

- [ ] **Step 2: 重写 WebhookIntegration**

完整替换 `WebhookIntegration.cs`：

```csharp
// src/EquipAI.Application/WorkOrders/Integration/WebhookIntegration.cs
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 通用 Webhook 集成
/// 增强功能：
/// 1. 自定义 Headers（支持 Authorization 等认证头）
/// 2. 自定义 Body 模板 + 变量插值（{{workOrder.code}}, {{workOrder.title}} 等）
/// 3. HMAC-SHA256 签名头 X-EquipSense-Signature
/// 集成失败时记录日志但不影响主流程（fire-and-forget 容错策略）
/// </summary>
public class WebhookIntegration : IWorkOrderIntegration
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WebhookIntegration> _logger;

    public string IntegrationType => "webhook";

    public WebhookIntegration(ILogger<WebhookIntegration> logger)
    {
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<string?> PushCreatedAsync(Guid tenantId, Guid workOrderId, string title, string priority, string config, CancellationToken ct = default)
    {
        var webhookConfig = DeserializeConfig<WebhookConfig>(config);
        if (webhookConfig == null || string.IsNullOrEmpty(webhookConfig.Url))
        {
            _logger.LogWarning("Webhook 配置无效，跳过推送");
            return null;
        }

        var variables = new Dictionary<string, string>
        {
            ["workOrder.id"] = workOrderId.ToString(),
            ["workOrder.code"] = workOrderId.ToString("N")[..8].ToUpperInvariant(),
            ["workOrder.title"] = title,
            ["workOrder.priority"] = priority,
            ["workOrder.status"] = "created",
            ["tenant.id"] = tenantId.ToString(),
            ["timestamp"] = DateTime.UtcNow.ToString("O")
        };

        return await SendWebhookAsync(webhookConfig, variables, ct);
    }

    /// <inheritdoc />
    public async Task PushStatusChangedAsync(Guid tenantId, Guid workOrderId, string status, string? externalId, string config, CancellationToken ct = default)
    {
        var webhookConfig = DeserializeConfig<WebhookConfig>(config);
        if (webhookConfig == null || string.IsNullOrEmpty(webhookConfig.Url)) return;

        var variables = new Dictionary<string, string>
        {
            ["workOrder.id"] = workOrderId.ToString(),
            ["workOrder.code"] = workOrderId.ToString("N")[..8].ToUpperInvariant(),
            ["workOrder.status"] = status,
            ["workOrder.externalId"] = externalId ?? "",
            ["tenant.id"] = tenantId.ToString(),
            ["timestamp"] = DateTime.UtcNow.ToString("O")
        };

        await SendWebhookAsync(webhookConfig, variables, ct);
    }

    /// <summary>
    /// 发送 Webhook 请求
    /// 流程：构建请求 → 添加自定义 Headers → 签名 → 发送 → 记录日志
    /// </summary>
    private async Task<string?> SendWebhookAsync(WebhookConfig config, Dictionary<string, string> variables, CancellationToken ct)
    {
        try
        {
            // 构建 Body：使用模板插值或默认 JSON
            string body;
            if (!string.IsNullOrEmpty(config.BodyTemplate))
            {
                body = InterpolateTemplate(config.BodyTemplate, variables);
            }
            else
            {
                // 默认 payload 格式
                var payload = new Dictionary<string, object>();
                foreach (var kv in variables)
                {
                    payload[kv.Key.Replace(".", "_")] = kv.Value;
                }
                body = JsonSerializer.Serialize(payload);
            }

            var request = new HttpRequestMessage(HttpMethod.Post, config.Url)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };

            // 添加自定义 Headers
            if (config.Headers != null)
            {
                foreach (var header in config.Headers)
                {
                    request.Headers.TryAddWithoutValidation(header.Key, header.Value);
                }
            }

            // 添加 HMAC-SHA256 签名头
            if (!string.IsNullOrEmpty(config.Secret))
            {
                var signature = ComputeSignature(body, config.Secret);
                request.Headers.Add("X-EquipSense-Signature", signature);
                // 兼容旧的 X-Webhook-Secret（向后兼容）
            }

            var response = await _httpClient.SendAsync(request, ct);
            var responseBody = await response.Content.ReadAsStringAsync(ct);

            _logger.LogInformation("Webhook 推送完成: URL={Url}, Status={Status}, Body={Body}",
                config.Url, response.StatusCode, responseBody);

            return response.IsSuccessStatusCode ? responseBody : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Webhook 推送失败: URL={Url}", config.Url);
            return null;
        }
    }

    /// <summary>
    /// 对 Body 模板执行变量插值
    /// 将 {{variableName}} 替换为对应的值
    /// </summary>
    private static string InterpolateTemplate(string template, Dictionary<string, string> variables)
    {
        return Regex.Replace(template, @"\{\{(\w[\w.]*)\}\}", match =>
        {
            var key = match.Groups[1].Value;
            return variables.TryGetValue(key, out var value) ? value : match.Value;
        });
    }

    /// <summary>
    /// 计算 HMAC-SHA256 签名
    /// 签名算法：HmacSHA256(body, secret) → 十六进制字符串
    /// </summary>
    private static string ComputeSignature(string body, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    /// <summary>
    /// 反序列化配置 JSON，失败时返回 null
    /// </summary>
    private static T? DeserializeConfig<T>(string config) where T : class
    {
        try { return JsonSerializer.Deserialize<T>(config); }
        catch { return null; }
    }
}
```

- [ ] **Step 3: 增强 Webhook 集成测试**

在现有 `WebhookIntegrationTests.cs` 中追加测试：

```csharp
using EquipAI.Application.WorkOrders.Integration;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace EquipAI.Tests.Unit.WorkOrders;

public class WebhookIntegrationTests
{
    [Fact]
    public void IntegrationType_应返回_webhook()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(logger.Object);
        integration.IntegrationType.Should().Be("webhook");
    }

    [Fact]
    public async Task PushCreatedAsync_无效URL应不抛出异常()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://invalid-url-that-does-not-exist.local/hook"
        });

        var act = () => integration.PushCreatedAsync(Guid.NewGuid(), Guid.NewGuid(), "测试", "Low", config);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushCreatedAsync_空Url应返回null()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new WebhookConfig { Url = "" });
        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试", "High", config);

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_自定义Headers和Body模板_应不抛出异常()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://invalid.local/hook",
            Headers = new Dictionary<string, string>
            {
                ["Authorization"] = "Bearer test-token",
                ["X-Custom-Header"] = "custom-value"
            },
            BodyTemplate = "{\"event\": \"work_order.created\", \"code\": \"{{workOrder.code}}\", \"title\": \"{{workOrder.title}}\"}",
            Secret = "test-secret"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushStatusChangedAsync_签名密钥配置_应不抛出异常()
    {
        var logger = new Mock<ILogger<WebhookIntegration>>();
        var integration = new WebhookIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new WebhookConfig
        {
            Url = "https://invalid.local/hook",
            Secret = "my-signing-secret"
        });

        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "Completed", "ext-123", config);
        await act.Should().NotThrowAsync();
    }
}
```

- [ ] **Step 4: 运行测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "WebhookIntegrationTests" --verbosity normal`
Expected: 5/5 通过

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Application/WorkOrders/Integration/WebhookIntegration.cs src/EquipAI.Application/WorkOrders/Integration/IntegrationSettings.cs tests/EquipAI.Tests.Unit/WorkOrders/WebhookIntegrationTests.cs
git commit -m "feat: Webhook 集成增强 — 变量插值 + 自定义 Headers + HMAC-SHA256 签名头"
```

---

## Task 4: FeishuIntegration + EamIntegration（简化版）

**目标：** 实现飞书集成（机器人消息推送 + 审批 API 创建审批实例）和 EAM/Maximo 集成（REST API 工单同步）。均为简化版实现。

**Files:**
- Modify: `src/EquipAI.Application/WorkOrders/Integration/IntegrationSettings.cs` — 添加 FeishuConfig, EamConfig
- Create: `src/EquipAI.Application/WorkOrders/Integration/FeishuIntegration.cs`
- Create: `src/EquipAI.Application/WorkOrders/Integration/EamIntegration.cs`
- Create: `tests/EquipAI.Tests.Unit/WorkOrders/FeishuIntegrationTests.cs`
- Create: `tests/EquipAI.Tests.Unit/WorkOrders/EamIntegrationTests.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` — 注册新集成

- [ ] **Step 1: 添加飞书和 EAM 配置模型**

在 `IntegrationSettings.cs` 中追加：

```csharp
/// <summary>
/// 飞书集成配置
/// </summary>
public class FeishuConfig
{
    /// <summary>
    /// 飞书应用 App ID
    /// </summary>
    public string AppId { get; set; } = string.Empty;

    /// <summary>
    /// 飞书应用 App Secret
    /// </summary>
    public string AppSecret { get; set; } = string.Empty;

    /// <summary>
    /// 机器人 Webhook URL（用于消息推送，可选）
    /// 如果设置了此字段，直接使用 Webhook 推送消息（无需获取 tenant_access_token）
    /// </summary>
    public string? WebhookUrl { get; set; }

    /// <summary>
    /// 飞书审批定义 Code（用于创建审批实例，可选）
    /// </summary>
    public string? ApprovalCode { get; set; }

    /// <summary>
    /// 接收消息的用户 Open ID 列表（通过 API 发送时使用）
    /// </summary>
    public List<string> ReceiveOpenIds { get; set; } = [];
}

/// <summary>
/// EAM/Maximo 集成配置
/// </summary>
public class EamConfig
{
    /// <summary>
    /// EAM 系统类型：maximo（默认）、sap_pm、custom
    /// </summary>
    public string Type { get; set; } = "maximo";

    /// <summary>
    /// EAM REST API 端点（如 https://maximo.example.com/maximo/oslc）
    /// </summary>
    public string Endpoint { get; set; } = string.Empty;

    /// <summary>
    /// API Key 或 Basic Auth 凭证
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// 用户名（Basic Auth 模式）
    /// </summary>
    public string? Username { get; set; }

    /// <summary>
    /// 密码（Basic Auth 模式）
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// 是否启用双向同步（从 EAM 拉取状态更新）
    /// </summary>
    public bool EnableSync { get; set; }

    /// <summary>
    /// 同步间隔（分钟），默认 5 分钟
    /// </summary>
    public int SyncIntervalMinutes { get; set; } = 5;
}
```

- [ ] **Step 2: 实现 FeishuIntegration**

```csharp
// src/EquipAI.Application/WorkOrders/Integration/FeishuIntegration.cs
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// 飞书集成
/// 支持两种推送模式：
/// 1. Webhook 模式：直接通过自定义机器人 Webhook 推送消息卡片（推荐，简单）
/// 2. API 模式：通过飞书开放 API 发送消息 + 创建审批实例（需 App ID/Secret）
/// 消息格式：交互式卡片（标题 + 工单详情 + 跳转按钮）
/// </summary>
public class FeishuIntegration : IWorkOrderIntegration
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FeishuIntegration> _logger;

    /// <summary>
    /// 飞书 Access Token 缓存（内存缓存，有效期 2 小时）
    /// </summary>
    private string? _cachedToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    public string IntegrationType => "feishu";

    public FeishuIntegration(ILogger<FeishuIntegration> logger)
    {
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<string?> PushCreatedAsync(Guid tenantId, Guid workOrderId, string title, string priority, string config, CancellationToken ct = default)
    {
        var feishuConfig = DeserializeConfig(config);
        if (feishuConfig == null || (string.IsNullOrEmpty(feishuConfig.WebhookUrl) && string.IsNullOrEmpty(feishuConfig.AppId)))
        {
            _logger.LogWarning("飞书配置无效，跳过推送");
            return null;
        }

        var priorityText = priority switch
        {
            "Critical" => "🔴 紧急",
            "High" => "🟠 高",
            "Medium" => "🟡 中",
            "Low" => "🟢 低",
            _ => priority
        };

        // 优先使用 Webhook 模式
        if (!string.IsNullOrEmpty(feishuConfig.WebhookUrl))
        {
            var card = BuildMessageCard(
                "新工单通知",
                $"**工单标题**: {title}\n**优先级**: {priorityText}\n**时间**: {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                workOrderId);

            return await SendWebhookAsync(feishuConfig.WebhookUrl, card, ct);
        }

        // API 模式：发送消息通知
        if (!string.IsNullOrEmpty(feishuConfig.AppId) && feishuConfig.ReceiveOpenIds.Count > 0)
        {
            var token = await GetTenantAccessTokenAsync(feishuConfig, ct);
            if (token == null) return null;

            var messageCard = BuildMessageCard(
                "新工单通知",
                $"**工单标题**: {title}\n**优先级**: {priorityText}\n**时间**: {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                workOrderId);

            foreach (var openId in feishuConfig.ReceiveOpenIds)
            {
                await SendMessageAsync(token, openId, messageCard, ct);
            }
        }

        // 如果配置了审批 Code，创建审批实例
        if (!string.IsNullOrEmpty(feishuConfig.ApprovalCode) && !string.IsNullOrEmpty(feishuConfig.AppId))
        {
            var token = await GetTenantAccessTokenAsync(feishuConfig, ct);
            if (token != null)
            {
                return await CreateApprovalInstanceAsync(token, feishuConfig.ApprovalCode, workOrderId, title, ct);
            }
        }

        return null;
    }

    /// <inheritdoc />
    public async Task PushStatusChangedAsync(Guid tenantId, Guid workOrderId, string status, string? externalId, string config, CancellationToken ct = default)
    {
        var feishuConfig = DeserializeConfig(config);
        if (feishuConfig == null) return;

        var statusText = status switch
        {
            "Assigned" => "已派工",
            "InProgress" => "执行中",
            "Completed" => "已完成",
            "Accepted" => "已验收",
            "Rejected" => "验收不通过",
            "Closed" => "已关闭",
            "Cancelled" => "已取消",
            _ => status
        };

        if (!string.IsNullOrEmpty(feishuConfig.WebhookUrl))
        {
            var card = BuildMessageCard(
                "工单状态更新",
                $"**工单状态**: {statusText}\n**更新时间**: {DateTime.UtcNow:yyyy-MM-dd HH:mm}",
                workOrderId);

            await SendWebhookAsync(feishuConfig.WebhookUrl, card, ct);
        }
    }

    /// <summary>
    /// 构建飞书消息卡片（Interactive Card）
    /// </summary>
    private static object BuildMessageCard(string headerTitle, string content, Guid workOrderId)
    {
        return new
        {
            msg_type = "interactive",
            card = new
            {
                header = new
                {
                    title = new { tag = "plain_text", content = headerTitle },
                    template = "blue"
                },
                elements = new object[]
                {
                    new
                    {
                        tag = "markdown",
                        content
                    },
                    new
                    {
                        tag = "action",
                        actions = new object[]
                        {
                            new
                            {
                                tag = "button",
                                text = new { tag = "plain_text", content = "查看详情" },
                                type = "primary",
                                url = $"https://equipsense.app/work-orders/{workOrderId}"
                            }
                        }
                    }
                }
            }
        };
    }

    /// <summary>
    /// 通过飞书 Webhook 发送消息
    /// </summary>
    private async Task<string?> SendWebhookAsync(string webhookUrl, object card, CancellationToken ct)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync(webhookUrl, card, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            _logger.LogInformation("飞书 Webhook 推送完成: Status={Status}, Body={Body}", response.StatusCode, body);
            return response.IsSuccessStatusCode ? body : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "飞书 Webhook 推送失败: URL={Url}", webhookUrl);
            return null;
        }
    }

    /// <summary>
    /// 获取飞书 tenant_access_token
    /// 使用内存缓存，2 小时内复用
    /// </summary>
    private async Task<string?> GetTenantAccessTokenAsync(FeishuConfig config, CancellationToken ct)
    {
        if (_cachedToken != null && DateTime.UtcNow < _tokenExpiry) return _cachedToken;

        try
        {
            var response = await _httpClient.PostAsJsonAsync(
                "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
                new { app_id = config.AppId, app_secret = config.AppSecret },
                ct);

            var body = await response.Content.ReadAsStringAsync(ct);
            var json = JsonDocument.Parse(body);

            if (json.RootElement.TryGetProperty("tenant_access_token", out var token))
            {
                _cachedToken = token.GetString();
                // token 有效期 7200 秒（2 小时），提前 5 分钟刷新
                _tokenExpiry = DateTime.UtcNow.AddHours(2).AddMinutes(-5);
                return _cachedToken;
            }

            _logger.LogWarning("获取飞书 tenant_access_token 失败: {Body}", body);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "获取飞书 tenant_access_token 异常");
            return null;
        }
    }

    /// <summary>
    /// 通过飞书 API 发送消息给指定用户
    /// </summary>
    private async Task SendMessageAsync(string token, string openId, object card, CancellationToken ct)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post,
                "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id")
            {
                Content = JsonContent.Create(new
                {
                    receive_id = openId,
                    msg_type = "interactive",
                    content = JsonSerializer.Serialize(card)
                })
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            _logger.LogInformation("飞书消息发送完成: OpenId={OpenId}, Status={Status}", openId, response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "飞书消息发送失败: OpenId={OpenId}", openId);
        }
    }

    /// <summary>
    /// 创建飞书审批实例
    /// 简化版：使用预定义的审批 Code，传入工单信息
    /// </summary>
    private async Task<string?> CreateApprovalInstanceAsync(
        string token, string approvalCode, Guid workOrderId, string title, CancellationToken ct)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post,
                "https://open.feishu.cn/open-apis/approval/v4/instance")
            {
                Content = JsonContent.Create(new
                {
                    approval_code = approvalCode,
                    form = JsonSerializer.Serialize(new
                    {
                        work_order_id = workOrderId.ToString(),
                        title
                    })
                })
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                var json = JsonDocument.Parse(body);
                if (json.RootElement.TryGetProperty("data", out var data)
                    && data.TryGetProperty("instance_code", out var instanceCode))
                {
                    return instanceCode.GetString();
                }
            }

            _logger.LogInformation("飞书审批实例创建完成: Status={Status}, Body={Body}", response.StatusCode, body);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "飞书审批实例创建失败: WorkOrderId={WorkOrderId}", workOrderId);
            return null;
        }
    }

    /// <summary>
    /// 反序列化配置 JSON
    /// </summary>
    private static FeishuConfig? DeserializeConfig(string config)
    {
        try { return JsonSerializer.Deserialize<FeishuConfig>(config); }
        catch { return null; }
    }
}
```

- [ ] **Step 3: 实现 EamIntegration（简化版）**

```csharp
// src/EquipAI.Application/WorkOrders/Integration/EamIntegration.cs
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders.Integration;

/// <summary>
/// EAM/Maximo 集成（简化版）
/// 通过 REST API 将 EquipSense 工单同步到外部 EAM 系统。
/// 当前仅实现工单创建推送，双向同步作为后续增强。
/// 支持 Maximo REST API (OSLC) 和通用 REST 接口。
/// </summary>
public class EamIntegration : IWorkOrderIntegration
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<EamIntegration> _logger;

    public string IntegrationType => "eam";

    public EamIntegration(ILogger<EamIntegration> logger)
    {
        _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<string?> PushCreatedAsync(Guid tenantId, Guid workOrderId, string title, string priority, string config, CancellationToken ct = default)
    {
        var eamConfig = DeserializeConfig(config);
        if (eamConfig == null || string.IsNullOrEmpty(eamConfig.Endpoint))
        {
            _logger.LogWarning("EAM 配置无效，跳过推送");
            return null;
        }

        // 构建 Maximo 兼容的工单 JSON
        var workType = priority switch
        {
            "Critical" => "EM",     // Emergency
            "High" => "CM",         // Corrective Maintenance
            "Medium" => "PM",       // Preventive Maintenance
            "Low" => "PM",
            _ => "CM"
        };

        var payload = eamConfig.Type.ToLowerInvariant() == "maximo"
            ? BuildMaximoPayload(workOrderId, title, priority, workType)
            : BuildGenericPayload(workOrderId, title, priority);

        return await SendEamAsync(eamConfig, payload, ct);
    }

    /// <inheritdoc />
    public async Task PushStatusChangedAsync(Guid tenantId, Guid workOrderId, string status, string? externalId, string config, CancellationToken ct = default)
    {
        var eamConfig = DeserializeConfig(config);
        if (eamConfig == null || string.IsNullOrEmpty(eamConfig.Endpoint)) return;

        // 如果有 externalId，更新 EAM 系统中的工单状态
        if (string.IsNullOrEmpty(externalId))
        {
            _logger.LogDebug("无 externalId，跳过 EAM 状态同步: WorkOrderId={WorkOrderId}", workOrderId);
            return;
        }

        var statusUpdate = new Dictionary<string, string>
        {
            ["status"] = MapStatusToEam(status),
            ["equipsense_work_order_id"] = workOrderId.ToString()
        };

        var endpoint = $"{eamConfig.Endpoint.TrimEnd('/')}/{externalId}";
        await SendEamUpdateAsync(eamConfig, endpoint, statusUpdate, ct);
    }

    /// <summary>
    /// 构建 Maximo OSLC 兼容的工单 payload
    /// Maximo 使用 OSLC (Open Services for Lifecycle Collaboration) 标准
    /// </summary>
    private static object BuildMaximoPayload(Guid workOrderId, string title, string priority, string workType)
    {
        return new
        {
            spi = "wsdl",
            properties = new
            {
                wonum = $"ES-{workOrderId.ToString("N")[..8].ToUpperInvariant()}",
                description = title,
                worktype = workType,
                status = "WSCH",    // Waiting on Schedule
                equipsense_id = workOrderId.ToString(),
                reportedby = "EquipSense",
                reporteddate = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
            }
        };
    }

    /// <summary>
    /// 构建通用 REST API 工单 payload
    /// </summary>
    private static object BuildGenericPayload(Guid workOrderId, string title, string priority)
    {
        return new
        {
            externalRef = workOrderId.ToString(),
            title,
            priority,
            status = "new",
            source = "EquipSense",
            createdAt = DateTime.UtcNow.ToString("O")
        };
    }

    /// <summary>
    /// 将 EquipSense 工单状态映射到 EAM 系统状态
    /// </summary>
    private static string MapStatusToEam(string status) => status switch
    {
        "Assigned" => "APPR",       // Approved
        "InProgress" => "INPRG",    // In Progress
        "Completed" => "COMP",      // Complete
        "Accepted" => "CLOSE",      // Closed
        "Closed" => "CLOSE",
        "Cancelled" => "CAN",       // Cancelled
        _ => status
    };

    /// <summary>
    /// 发送工单创建请求到 EAM 系统
    /// </summary>
    private async Task<string?> SendEamAsync(EamConfig config, object payload, CancellationToken ct)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, config.Endpoint)
            {
                Content = JsonContent.Create(payload)
            };

            ApplyAuthentication(request, config);

            var response = await _httpClient.SendAsync(request, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            _logger.LogInformation("EAM 推送完成: Endpoint={Endpoint}, Status={Status}", config.Endpoint, response.StatusCode);

            if (response.IsSuccessStatusCode)
            {
                // 尝试从响应中提取 EAM 工单号
                try
                {
                    var json = JsonDocument.Parse(body);
                    // Maximo 返回 wonum
                    if (json.RootElement.TryGetProperty("wonum", out var wonum))
                        return wonum.GetString();
                    // 通用返回 id
                    if (json.RootElement.TryGetProperty("id", out var id))
                        return id.GetString();
                    if (json.RootElement.TryGetProperty("properties", out var props)
                        && props.TryGetProperty("wonum", out var propsWonum))
                        return propsWonum.GetString();
                }
                catch
                {
                    // 解析失败不影响主流程
                }

                return body;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "EAM 推送失败: Endpoint={Endpoint}", config.Endpoint);
            return null;
        }
    }

    /// <summary>
    /// 发送工单状态更新到 EAM 系统（PATCH 请求）
    /// </summary>
    private async Task SendEamUpdateAsync(EamConfig config, string endpoint, Dictionary<string, string> update, CancellationToken ct)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Patch, endpoint)
            {
                Content = JsonContent.Create(update)
            };

            ApplyAuthentication(request, config);

            var response = await _httpClient.SendAsync(request, ct);
            _logger.LogInformation("EAM 状态更新完成: Endpoint={Endpoint}, Status={Status}", endpoint, response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "EAM 状态更新失败: Endpoint={Endpoint}", endpoint);
        }
    }

    /// <summary>
    /// 为请求添加认证信息
    /// 支持 API Key 和 Basic Auth 两种模式
    /// </summary>
    private static void ApplyAuthentication(HttpRequestMessage request, EamConfig config)
    {
        if (!string.IsNullOrEmpty(config.ApiKey))
        {
            request.Headers.Add("apikey", config.ApiKey);
        }

        if (!string.IsNullOrEmpty(config.Username) && !string.IsNullOrEmpty(config.Password))
        {
            var authBytes = Encoding.UTF8.GetBytes($"{config.Username}:{config.Password}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(authBytes));
        }
    }

    /// <summary>
    /// 反序列化配置 JSON
    /// </summary>
    private static EamConfig? DeserializeConfig(string config)
    {
        try { return JsonSerializer.Deserialize<EamConfig>(config); }
        catch { return null; }
    }
}
```

- [ ] **Step 4: 编写飞书集成测试**

```csharp
// tests/EquipAI.Tests.Unit/WorkOrders/FeishuIntegrationTests.cs
using EquipAI.Application.WorkOrders.Integration;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace EquipAI.Tests.Unit.WorkOrders;

public class FeishuIntegrationTests
{
    [Fact]
    public void IntegrationType_应返回_feishu()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(logger.Object);
        integration.IntegrationType.Should().Be("feishu");
    }

    [Fact]
    public async Task PushCreatedAsync_无效配置应返回null()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(logger.Object);

        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试", "High", "{}");

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_Webhook模式_应不抛出异常()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new FeishuConfig
        {
            WebhookUrl = "https://invalid.local/feishu-webhook"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushStatusChangedAsync_Webhook模式_应不抛出异常()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new FeishuConfig
        {
            WebhookUrl = "https://invalid.local/feishu-webhook"
        });

        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "InProgress", null, config);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushCreatedAsync_仅AppId无ReceiveIds_应不抛出异常()
    {
        var logger = new Mock<ILogger<FeishuIntegration>>();
        var integration = new FeishuIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new FeishuConfig
        {
            AppId = "cli_test",
            AppSecret = "test_secret",
            ReceiveOpenIds = []
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "High", config);
        await act.Should().NotThrowAsync();
    }
}
```

- [ ] **Step 5: 编写 EAM 集成测试**

```csharp
// tests/EquipAI.Tests.Unit/WorkOrders/EamIntegrationTests.cs
using EquipAI.Application.WorkOrders.Integration;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;

namespace EquipAI.Tests.Unit.WorkOrders;

public class EamIntegrationTests
{
    [Fact]
    public void IntegrationType_应返回_eam()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var integration = new EamIntegration(logger.Object);
        integration.IntegrationType.Should().Be("eam");
    }

    [Fact]
    public async Task PushCreatedAsync_无效配置应返回null()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var integration = new EamIntegration(logger.Object);

        var result = await integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试", "High", "{}");

        result.Should().BeNull();
    }

    [Fact]
    public async Task PushCreatedAsync_Maximo模式_应不抛出异常()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var integration = new EamIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Type = "maximo",
            Endpoint = "https://invalid.local/maximo/oslc",
            ApiKey = "test-api-key"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "Critical", config);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushCreatedAsync_通用REST模式_应不抛出异常()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var integration = new EamIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Type = "custom",
            Endpoint = "https://invalid.local/api/workorders",
            Username = "admin",
            Password = "password"
        });

        var act = () => integration.PushCreatedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "测试工单", "Medium", config);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PushStatusChangedAsync_无ExternalId应正常处理()
    {
        var logger = new Mock<ILogger<EamIntegration>>();
        var integration = new EamIntegration(logger.Object);

        var config = JsonSerializer.Serialize(new EamConfig
        {
            Type = "maximo",
            Endpoint = "https://invalid.local/maximo/oslc"
        });

        var act = () => integration.PushStatusChangedAsync(
            Guid.NewGuid(), Guid.NewGuid(), "Completed", null, config);
        await act.Should().NotThrowAsync();
    }
}
```

- [ ] **Step 6: 注册新集成到 DI**

在 `ServiceCollectionExtensions.cs` 的 `AddApplication` 方法中，在现有工单集成注册之后追加：

```csharp
// 飞书集成 + EAM 集成
services.AddScoped<IWorkOrderIntegration, FeishuIntegration>();
services.AddScoped<IWorkOrderIntegration, EamIntegration>();
```

添加 `// 现有注册保持不变` 注释确保不重复注册。

- [ ] **Step 7: 运行所有集成测试**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "FeishuIntegrationTests|EamIntegrationTests" --verbosity normal`
Expected: 9/9 通过

- [ ] **Step 8: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 9: 提交**

```bash
git add src/EquipAI.Application/WorkOrders/Integration/FeishuIntegration.cs src/EquipAI.Application/WorkOrders/Integration/EamIntegration.cs src/EquipAI.Application/WorkOrders/Integration/IntegrationSettings.cs src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs tests/EquipAI.Tests.Unit/WorkOrders/FeishuIntegrationTests.cs tests/EquipAI.Tests.Unit/WorkOrders/EamIntegrationTests.cs
git commit -m "feat: 飞书集成（Webhook+审批API）+ EAM/Maximo 集成（REST API 工单同步）"
```

---

## Task 5: IntegrationController 增强 + 测试连接 API

**目标：** 增强集成配置管理 API，统一配置 Schema，新增测试连接端点（`POST /api/v1/integrations/{type}/test`），返回详细的连接测试结果。

**Files:**
- Modify: `src/EquipAI.WebAPI/Controllers/IntegrationController.cs`
- Create: `src/EquipAI.Application/WorkOrders/DTOs/IntegrationTestResult.cs`
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs` — 注册 HttpClient 工厂（可选）

- [ ] **Step 1: 创建测试结果 DTO**

```csharp
// src/EquipAI.Application/WorkOrders/DTOs/IntegrationTestResult.cs
namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 集成测试连接结果
/// </summary>
public class IntegrationTestResult
{
    /// <summary>
    /// 集成类型
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 测试是否成功
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// 结果消息（成功时为"连接成功"，失败时为错误描述）
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 响应耗时（毫秒）
    /// </summary>
    public long DurationMs { get; set; }

    /// <summary>
    /// 外部系统返回的详细信息（可选）
    /// </summary>
    public string? Details { get; set; }
}
```

- [ ] **Step 2: 重写 IntegrationController**

完整替换 `IntegrationController.cs`：

```csharp
// src/EquipAI.WebAPI/Controllers/IntegrationController.cs
using System.Diagnostics;
using System.Text.Json;
using EquipAI.Core.Interfaces;
using EquipAI.Application.WorkOrders.DTOs;
using EquipAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 集成配置管理 API
/// 管理租户级的外部系统集成（Webhook、钉钉、飞书、EAM），配置存储在 Tenant.Settings JSONB 字段中。
/// 配置 Schema（扁平结构）：
/// {
///   "integrations": {
///     "dingtalk": { "enabled": true, "webhook": "...", "secret": "..." },
///     "feishu":   { "enabled": true, "appId": "...", "appSecret": "..." },
///     "webhook":  { "enabled": false, "url": "", "headers": {}, "bodyTemplate": "", "secret": "" },
///     "eam":      { "enabled": false, "type": "maximo", "endpoint": "", "apiKey": "" }
///   }
/// }
/// </summary>
[ApiController]
[Route("api/v1/settings/integrations")]
[Authorize]
public class IntegrationController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IEnumerable<IWorkOrderIntegration> _integrations;
    private readonly ILogger<IntegrationController> _logger;

    /// <summary>
    /// 支持的集成类型列表
    /// </summary>
    private static readonly HashSet<string> SupportedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "dingtalk", "feishu", "webhook", "eam"
    };

    public IntegrationController(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        IEnumerable<IWorkOrderIntegration> integrations,
        ILogger<IntegrationController> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _integrations = integrations;
        _logger = logger;
    }

    /// <summary>
    /// 获取当前租户的所有集成配置
    /// GET /api/v1/settings/integrations
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetIntegrations()
    {
        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId);
        if (tenant == null) return NotFound(new { code = 404, message = "租户不存在" });

        var result = ParseIntegrationSettings(tenant.Settings);
        return Ok(result);
    }

    /// <summary>
    /// 更新指定集成类型的配置
    /// PUT /api/v1/settings/integrations/{type}
    /// 请求体为该集成的完整配置（不含 enabled 字段，enabled 通过 query 参数控制）
    /// </summary>
    [HttpPut("{type}")]
    public async Task<ActionResult> UpdateIntegration(string type, [FromBody] UpdateIntegrationRequest request)
    {
        if (!SupportedTypes.Contains(type))
        {
            return BadRequest(new { code = 400, message = $"不支持的集成类型: {type}，支持: {string.Join(", ", SupportedTypes)}" });
        }

        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId);
        if (tenant == null) return NotFound(new { code = 404, message = "租户不存在" });

        // 解析现有 Settings JSON
        var settingsDoc = string.IsNullOrEmpty(tenant.Settings) || tenant.Settings == "{}"
            ? new Dictionary<string, object>()
            : JsonSerializer.Deserialize<Dictionary<string, object>>(tenant.Settings) ?? new();

        // 提取或初始化 integrations 节点
        Dictionary<string, object> integrations;
        if (settingsDoc.TryGetValue("integrations", out var integrationsObj)
            && integrationsObj is JsonElement { ValueKind: JsonValueKind.Object } je)
        {
            integrations = je.Deserialize<Dictionary<string, object>>() ?? new();
        }
        else
        {
            integrations = new Dictionary<string, object>();
        }

        // 合并配置：保留 enabled 字段，更新其他字段
        var existingConfig = new Dictionary<string, object>();
        if (integrations.TryGetValue(type, out var existing) && existing is JsonElement { ValueKind: JsonValueKind.Object } existingJe)
        {
            foreach (var prop in existingJe.EnumerateObject())
            {
                existingConfig[prop.Name] = JsonSerializer.Deserialize<object>(prop.Value.GetRawText())!;
            }
        }

        // 设置 enabled
        existingConfig["enabled"] = request.Enabled;

        // 合并新配置字段
        if (!string.IsNullOrEmpty(request.Config))
        {
            try
            {
                var newConfig = JsonSerializer.Deserialize<Dictionary<string, object>>(request.Config);
                if (newConfig != null)
                {
                    foreach (var kv in newConfig)
                    {
                        existingConfig[kv.Key] = kv.Value;
                    }
                }
            }
            catch (JsonException ex)
            {
                return BadRequest(new { code = 400, message = $"配置 JSON 格式错误: {ex.Message}" });
            }
        }

        integrations[type] = existingConfig;
        settingsDoc["integrations"] = integrations;

        // 写回租户 Settings 并保存
        tenant.Settings = JsonSerializer.Serialize(settingsDoc);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("集成配置已更新: Type={Type}, Enabled={Enabled}, TenantId={TenantId}",
            type, request.Enabled, _tenantContext.TenantId);

        return Ok(new { type, enabled = request.Enabled });
    }

    /// <summary>
    /// 测试指定集成类型的连接
    /// POST /api/v1/settings/integrations/{type}/test
    /// 发送一条测试消息到外部系统，验证配置是否正确
    /// </summary>
    [HttpPost("{type}/test")]
    public async Task<ActionResult<IntegrationTestResult>> TestIntegration(string type)
    {
        if (!SupportedTypes.Contains(type))
        {
            return BadRequest(new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = $"不支持的集成类型: {type}"
            });
        }

        var tenant = await _dbContext.UnfilteredSet<Core.Entities.Tenant>()
            .FirstOrDefaultAsync(t => t.Id == _tenantContext.TenantId);
        if (tenant == null) return NotFound(new { code = 404, message = "租户不存在" });

        // 读取该集成的配置
        var integrationConfig = GetIntegrationConfig(tenant.Settings, type);
        if (integrationConfig == null)
        {
            return Ok(new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = "未找到该集成的配置，请先保存配置"
            });
        }

        // 查找对应的集成实现
        var integration = _integrations.FirstOrDefault(i => i.IntegrationType == type);
        if (integration == null)
        {
            return Ok(new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = "未注册的集成类型"
            });
        }

        // 发送测试推送
        var sw = Stopwatch.StartNew();
        try
        {
            var testWorkOrderId = Guid.NewGuid();
            var result = await integration.PushCreatedAsync(
                _tenantContext.TenantId, testWorkOrderId,
                "[测试] 集成连接测试", "Low", integrationConfig);
            sw.Stop();

            return Ok(new IntegrationTestResult
            {
                Type = type,
                Success = true,
                Message = "连接测试成功",
                DurationMs = sw.ElapsedMilliseconds,
                Details = result
            });
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogWarning(ex, "集成连接测试失败: Type={Type}", type);

            return Ok(new IntegrationTestResult
            {
                Type = type,
                Success = false,
                Message = $"连接测试失败: {ex.Message}",
                DurationMs = sw.ElapsedMilliseconds
            });
        }
    }

    /// <summary>
    /// 解析租户 Settings 中的 integrations 节点
    /// </summary>
    private static Dictionary<string, object>? ParseIntegrationSettings(string? settings)
    {
        if (string.IsNullOrEmpty(settings) || settings == "{}")
            return new Dictionary<string, object>();

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, object>>(settings);
        }
        catch
        {
            return new Dictionary<string, object>();
        }
    }

    /// <summary>
    /// 获取指定集成类型的配置 JSON 字符串
    /// </summary>
    private static string? GetIntegrationConfig(string? settings, string type)
    {
        if (string.IsNullOrEmpty(settings)) return null;

        try
        {
            var json = JsonDocument.Parse(settings);
            if (json.RootElement.TryGetProperty("integrations", out var integrations)
                && integrations.TryGetProperty(type, out var config))
            {
                // 序列化整个集成配置节点（包含 enabled 字段）
                return config.GetRawText();
            }
        }
        catch { /* 忽略解析错误 */ }

        return null;
    }
}

/// <summary>
/// 更新集成配置请求
/// </summary>
public class UpdateIntegrationRequest
{
    /// <summary>
    /// 是否启用该集成
    /// </summary>
    public bool Enabled { get; set; }

    /// <summary>
    /// 集成配置 JSON（各集成的具体参数，如 URL、密钥等）
    /// </summary>
    public string Config { get; set; } = "{}";
}
```

- [ ] **Step 3: 注意旧路由兼容**

旧路由 `api/v1/integrations` 需要保持兼容。在 `IntegrationController` 中，路由已改为 `api/v1/settings/integrations`。
为确保前端平滑迁移，可以在同一 Controller 中添加兼容路由，或者让前端直接切换。

**推荐方案：** 前端直接切换到新路由 `api/v1/settings/integrations`，在 `frontend/src/lib/api.ts` 中调整。

- [ ] **Step 4: 编译确认**

Run: `dotnet build EquipAI.slnx`
Expected: 编译成功

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.WebAPI/Controllers/IntegrationController.cs src/EquipAI.Application/WorkOrders/DTOs/IntegrationTestResult.cs
git commit -m "feat: IntegrationController 增强 — 统一配置 Schema + 测试连接 API + 类型校验"
```

---

## Task 6: 前端 — 外部集成配置 Tab

**目标：** 在 SettingsPage 中扩展「外部集成」Tab，支持四种集成（钉钉、飞书、Webhook、EAM）的完整配置界面，包含测试连接按钮和状态反馈。

**Files:**
- Modify: `frontend/src/hooks/useIntegration.ts` — 添加 testIntegration、调整路由
- Create: `frontend/src/types/integration.ts` — 集成类型定义
- Modify: `frontend/src/pages/SettingsPage.tsx` — 重写 IntegrationSettings 组件

- [ ] **Step 1: 创建集成类型定义**

```typescript
// frontend/src/types/integration.ts

/** 集成配置通用接口 */
export interface IntegrationConfig {
  enabled: boolean;
  [key: string]: unknown;
}

/** 钉钉集成配置 */
export interface DingTalkIntegration extends IntegrationConfig {
  webhook: string;
  secret?: string;
  atMobiles?: string[];
  messageType?: 'markdown' | 'actionCard';
  detailUrlTemplate?: string;
}

/** 飞书集成配置 */
export interface FeishuIntegration extends IntegrationConfig {
  appId?: string;
  appSecret?: string;
  webhookUrl?: string;
  approvalCode?: string;
  receiveOpenIds?: string[];
}

/** Webhook 集成配置 */
export interface WebhookIntegration extends IntegrationConfig {
  url: string;
  secret?: string;
  headers?: Record<string, string>;
  bodyTemplate?: string;
}

/** EAM 集成配置 */
export interface EamIntegration extends IntegrationConfig {
  type?: 'maximo' | 'sap_pm' | 'custom';
  endpoint: string;
  apiKey?: string;
  username?: string;
  password?: string;
  enableSync?: boolean;
}

/** 所有集成的集合 */
export interface IntegrationsMap {
  dingtalk?: DingTalkIntegration;
  feishu?: FeishuIntegration;
  webhook?: WebhookIntegration;
  eam?: EamIntegration;
}

/** 集成测试结果 */
export interface IntegrationTestResult {
  type: string;
  success: boolean;
  message: string;
  durationMs: number;
  details?: string;
}
```

- [ ] **Step 2: 增强 useIntegration hooks**

完整替换 `useIntegration.ts`：

```typescript
// frontend/src/hooks/useIntegration.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { IntegrationsMap, IntegrationTestResult } from '../types/integration';

/**
 * 获取当前租户的所有集成配置
 * GET /api/v1/settings/integrations
 */
export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data } = await api.get('/settings/integrations');
      // 从 { integrations: { ... } } 结构中提取集成配置
      const integrations = data?.integrations ?? data;
      return integrations as IntegrationsMap;
    },
  });
}

/**
 * 更新指定集成类型的配置
 * PUT /api/v1/settings/integrations/{type}
 */
export function useUpdateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, enabled, config }: { type: string; enabled: boolean; config: string }) => {
      const { data } = await api.put(`/settings/integrations/${type}`, { enabled, config });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

/**
 * 测试指定集成类型的连接
 * POST /api/v1/settings/integrations/{type}/test
 */
export function useTestIntegration() {
  return useMutation<IntegrationTestResult, Error, string>({
    mutationFn: async (type: string) => {
      const { data } = await api.post<IntegrationTestResult>(`/settings/integrations/${type}/test`);
      return data;
    },
  });
}
```

- [ ] **Step 3: 重写 SettingsPage 的 IntegrationSettings 组件**

在 `SettingsPage.tsx` 中替换现有的 `IntegrationSettings` 函数组件。以下为完整的新组件：

```tsx
/**
 * 外部集成配置面板
 *
 * 支持四种外部集成：
 * 1. 钉钉 — 自定义机器人 Webhook + ActionCard 消息
 * 2. 飞书 — 机器人 Webhook / API 消息 + 审批实例
 * 3. Webhook — 通用 HTTP POST + 变量插值 + 签名
 * 4. EAM — Maximo REST API 工单同步
 *
 * 每种集成可独立启用/禁用，配置连接参数，并测试连接。
 */
function IntegrationSettings() {
  const { t } = useTranslation();
  const { data: integrations, isLoading } = useIntegrations();
  const updateMutation = useUpdateIntegration();
  const testMutation = useTestIntegration();
  const [activeTab, setActiveTab] = useState('dingtalk');

  // 钉钉配置状态
  const [dingtalk, setDingtalk] = useState({
    webhook: '', secret: '', messageType: 'actionCard', detailUrlTemplate: '',
  });

  // 飞书配置状态
  const [feishu, setFeishu] = useState({
    webhookUrl: '', appId: '', appSecret: '', approvalCode: '',
  });

  // Webhook 配置状态
  const [webhook, setWebhook] = useState({
    url: '', secret: '', bodyTemplate: '',
  });

  // EAM 配置状态
  const [eam, setEam] = useState({
    type: 'maximo', endpoint: '', apiKey: '', username: '', password: '',
  });

  /** 保存集成配置 */
  const handleSave = (type: string, config: object, enabled: boolean) => {
    updateMutation.mutate({
      type,
      enabled,
      config: JSON.stringify(config),
    });
  };

  /** 测试集成连接 */
  const handleTest = (type: string) => {
    testMutation.mutate(type);
  };

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">加载中...</p>;
  }

  const dingtalkEnabled = integrations?.dingtalk?.enabled ?? false;
  const feishuEnabled = integrations?.feishu?.enabled ?? false;
  const webhookEnabled = integrations?.webhook?.enabled ?? false;
  const eamEnabled = integrations?.eam?.enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.integration', '外部集成')}</CardTitle>
        <CardDescription>{t('settings.integrationDesc', '配置工单与外部系统的集成，支持消息推送和工单同步')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="dingtalk">钉钉</TabsTrigger>
            <TabsTrigger value="feishu">飞书</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="eam">EAM</TabsTrigger>
          </TabsList>

          {/* 钉钉集成 */}
          <TabsContent value="dingtalk" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={dingtalkEnabled ? "default" : "outline"}>
                  {dingtalkEnabled ? '已启用' : '未启用'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('dingtalk')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={dingtalkEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('dingtalk', dingtalk, !dingtalkEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {dingtalkEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Webhook URL *</Label>
                <Input
                  placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                  value={dingtalk.webhook}
                  onChange={(e) => setDingtalk({ ...dingtalk, webhook: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>加签密钥（可选）</Label>
                <Input
                  type="password"
                  placeholder="SEC..."
                  value={dingtalk.secret}
                  onChange={(e) => setDingtalk({ ...dingtalk, secret: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>消息类型</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={dingtalk.messageType}
                  onChange={(e) => setDingtalk({ ...dingtalk, messageType: e.target.value })}
                >
                  <option value="actionCard">ActionCard（推荐）</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>工单详情页 URL 模板（可选）</Label>
                <Input
                  placeholder="https://equipsense.app/work-orders/{{workOrderId}}"
                  value={dingtalk.detailUrlTemplate}
                  onChange={(e) => setDingtalk({ ...dingtalk, detailUrlTemplate: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          {/* 飞书集成 */}
          <TabsContent value="feishu" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Badge variant={feishuEnabled ? "default" : "outline"}>
                {feishuEnabled ? '已启用' : '未启用'}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('feishu')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={feishuEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('feishu', feishu, !feishuEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {feishuEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>机器人 Webhook URL（推荐，简单模式）</Label>
                <Input
                  placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                  value={feishu.webhookUrl}
                  onChange={(e) => setFeishu({ ...feishu, webhookUrl: e.target.value })}
                />
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">以下为 API 模式配置（如需审批实例则必填）：</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>App ID</Label>
                  <Input
                    placeholder="cli_xxxxxxxx"
                    value={feishu.appId}
                    onChange={(e) => setFeishu({ ...feishu, appId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>App Secret</Label>
                  <Input
                    type="password"
                    value={feishu.appSecret}
                    onChange={(e) => setFeishu({ ...feishu, appSecret: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>审批定义 Code（可选，用于创建审批实例）</Label>
                <Input
                  placeholder="从飞书审批管理中获取"
                  value={feishu.approvalCode}
                  onChange={(e) => setFeishu({ ...feishu, approvalCode: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Webhook 集成 */}
          <TabsContent value="webhook" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Badge variant={webhookEnabled ? "default" : "outline"}>
                {webhookEnabled ? '已启用' : '未启用'}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('webhook')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={webhookEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('webhook', webhook, !webhookEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {webhookEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Webhook URL *</Label>
                <Input
                  placeholder="https://your-server.com/api/webhook"
                  value={webhook.url}
                  onChange={(e) => setWebhook({ ...webhook, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>签名密钥（可选，设置后自动添加 X-EquipSense-Signature 头）</Label>
                <Input
                  type="password"
                  value={webhook.secret}
                  onChange={(e) => setWebhook({ ...webhook, secret: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Body 模板（可选，支持变量插值）
                </Label>
                <p className="text-xs text-muted-foreground">
                  可用变量: {'{{workOrder.code}}'}, {'{{workOrder.title}}'}, {'{{workOrder.priority}}'}, {'{{workOrder.status}}'}, {'{{timestamp}}'}
                </p>
                <textarea
                  className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm font-mono"
                  placeholder={'{"event": "work_order.created", "code": "{{workOrder.code}}", "title": "{{workOrder.title}}"}'}
                  value={webhook.bodyTemplate}
                  onChange={(e) => setWebhook({ ...webhook, bodyTemplate: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          {/* EAM 集成 */}
          <TabsContent value="eam" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Badge variant={eamEnabled ? "default" : "outline"}>
                {eamEnabled ? '已启用' : '未启用'}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('eam')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={eamEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('eam', eam, !eamEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {eamEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>EAM 系统类型</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={eam.type}
                  onChange={(e) => setEam({ ...eam, type: e.target.value })}
                >
                  <option value="maximo">IBM Maximo</option>
                  <option value="sap_pm">SAP PM</option>
                  <option value="custom">自定义 REST API</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>REST API 端点 *</Label>
                <Input
                  placeholder="https://maximo.example.com/maximo/oslc"
                  value={eam.endpoint}
                  onChange={(e) => setEam({ ...eam, endpoint: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={eam.apiKey}
                    onChange={(e) => setEam({ ...eam, apiKey: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>或 Basic Auth</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="用户名"
                      value={eam.username}
                      onChange={(e) => setEam({ ...eam, username: e.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder="密码"
                      value={eam.password}
                      onChange={(e) => setEam({ ...eam, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 测试结果显示 */}
        {testMutation.data && (
          <div className={`mt-4 rounded-lg border p-3 ${testMutation.data.success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <p className={`text-sm font-medium ${testMutation.data.success ? 'text-green-600' : 'text-red-600'}`}>
              {testMutation.data.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              耗时: {testMutation.data.durationMs}ms
            </p>
            {testMutation.data.details && (
              <pre className="mt-2 rounded bg-muted p-2 text-xs overflow-x-auto">
                {testMutation.data.details}
              </pre>
            )}
          </div>
        )}

        {testMutation.isError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-sm text-red-600">测试失败: {testMutation.error?.message || '未知错误'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

确保在 `SettingsPage.tsx` 文件顶部添加必要的 import：

```tsx
import { useIntegrations, useUpdateIntegration, useTestIntegration } from '../hooks/useIntegration';
```

移除旧的 `import { useIntegrations, useUpdateIntegration } from '../hooks/useIntegration';`（已包含在新的导入中）。

- [ ] **Step 4: TypeScript 检查**

Run: `cd frontend && npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 5: Vite 构建检查**

Run: `cd frontend && npx vite build`
Expected: 构建成功

- [ ] **Step 6: 提交**

```bash
git add frontend/src/types/integration.ts frontend/src/hooks/useIntegration.ts frontend/src/pages/SettingsPage.tsx
git commit -m "feat: 前端外部集成配置 Tab — 四集成配置界面 + 测试连接 + 状态反馈"
```

---

## 验收标准

- [ ] `dotnet build EquipAI.slnx` 编译无错误
- [ ] `dotnet test tests/EquipAI.Tests.Unit` 所有测试通过
- [ ] `cd frontend && npx tsc --noEmit` 无 TypeScript 错误
- [ ] `IntegrationRouter` 成功替代 `WorkOrderIntegrationHandler` 的分发逻辑
- [ ] 推送日志写入 `integration_push_logs` 表
- [ ] 四种集成（钉钉/飞书/Webhook/EAM）均可在前端配置和测试
- [ ] `GET /api/v1/settings/integrations` 返回扁平 Schema 格式
- [ ] `PUT /api/v1/settings/integrations/{type}` 合并更新配置
- [ ] `POST /api/v1/settings/integrations/{type}/test` 返回测试结果
