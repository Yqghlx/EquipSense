# Phase 1 Week 5-6: SignalR 实时推送 & 基线告警引擎 设计规格

> 日期：2026-05-31
> 范围：SignalR Hub 实时推送、telemetry_hourly 连续聚合视图、metric_baselines 基线数据、BaselineEvaluator L3 告警
> 参考：`docs/FINAL_TECHNICAL_DESIGN.md`

## 目标

在 Week 3-4 的阈值告警基础上，完成告警引擎的核心增强：
- 基线告警（L3）能基于历史统计数据正确触发
- telemetry_hourly 连续聚合视图自动维护小时级统计
- SignalR 实时推送告警和遥测更新到前端
- 所有告警结果通过 Hub 按租户隔离推送

**不包含**：AI 根因分析（Level 1-3）、工单管理、知识库、前端 Hook（留待 Week 7-8+）

## 构建策略

分层构建，从底层数据到顶层推送：
1. **数据层**：telemetry_hourly 视图 + metric_baselines 表 + AlertRule 扩展
2. **服务层**：BaselineCalculationService + BaselineEvaluator
3. **推送层**：SignalR Hub + NotificationService + 事件集成

## 文件结构

```
新增文件：

src/EquipAI.Core/
├── Enums/
│   └── RuleType.cs                        — 新增 Baseline 枚举值
├── Entities/
│   └── MetricBaseline.cs                  — 基线数据实体
├── Interfaces/
│   ├── IBaselineCalculationService.cs     — 基线计算服务接口
│   └── ISignalRNotificationService.cs     — SignalR 推送服务接口

src/EquipAI.Application/
├── Alerts/
│   ├── BaselineCalculationService.cs      — 后台基线计算服务
│   ├── Evaluators/
│   │   └── BaselineEvaluator.cs           — 基线评估器（L3）

src/EquipAI.Infrastructure/
├── Data/
│   ├── Configurations/
│   │   └── MetricBaselineConfiguration.cs — 基线表 EF 配置
│   ├── TimescaleDbSetup.cs                — 扩展：telemetry_hourly 视图

src/EquipAI.WebAPI/
├── Hubs/
│   └── IndustrialHub.cs                   — SignalR Hub
├── Services/
│   └── SignalRNotificationService.cs      — SignalR 推送服务实现

修改文件：

src/EquipAI.Core/Enums/RuleType.cs                      — 新增 Baseline
src/EquipAI.Core/Entities/AlertRule.cs                   — 新增 BaselineStddevMultiplier
src/EquipAI.Core/Interfaces/IAlertRuleEvaluator.cs       — DeviceContext 新增 Baseline 属性
src/EquipAI.Infrastructure/Data/AppDbContext.cs          — 新增 MetricBaseline DbSet
src/EquipAI.Application/Alerts/AlertEvaluationService.cs — 集成基线查询
src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs — 注册新服务
src/EquipAI.Application/Alerts/Handlers/AlertEventHandler.cs   — 扩展：SignalR 推送
src/EquipAI.WebAPI/Program.cs                            — SignalR 注册 + Hub 映射
src/EquipAI.WebAPI/appsettings.json                      — SignalR 配置节
```

## 第一部分：数据层

### telemetry_hourly 连续聚合视图

```sql
CREATE MATERIALIZED VIEW telemetry_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    tenant_id,
    device_id,
    metric,
    AVG(value) AS avg_value,
    STDDEV(value) AS std_dev,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    COUNT(*) AS sample_count,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) AS p95_value
FROM device_telemetry
WHERE value IS NOT NULL
GROUP BY 1, 2, 3, 4;

SELECT add_continuous_aggregate_policy('telemetry_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
```

由 TimescaleDbSetup 在应用启动时幂等创建。

### metric_baselines 表

```sql
CREATE TABLE metric_baselines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    device_id       UUID NOT NULL,
    metric          VARCHAR(100) NOT NULL,
    period_start    TIMESTAMPTZ NOT NULL,
    period_end      TIMESTAMPTZ NOT NULL,
    avg_value       DOUBLE PRECISION,
    std_dev         DOUBLE PRECISION,
    min_value       DOUBLE PRECISION,
    max_value       DOUBLE PRECISION,
    p95_value       DOUBLE PRECISION,
    sample_count    INT,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL,
    UNIQUE(tenant_id, device_id, metric)
);
```

**MetricBaseline 实体**（继承 BaseEntity）：
- TenantId, DeviceId, Metric
- PeriodStart, PeriodEnd
- AvgValue, StdDev, MinValue, MaxValue, P95Value, SampleCount
- UpdatedAt

### AlertRule 实体扩展

新增字段：
```csharp
/// <summary>
/// 基线标准差倍数，仅 Baseline 类型使用（默认 3.0，即 3σ 规则）
/// </summary>
public decimal? BaselineStddevMultiplier { get; set; }
```

### RuleType 枚举扩展

新增值：
```csharp
/// <summary>
/// 动态基线 — 基于历史统计数据的均值±N倍标准差触发
/// 需要 100+ 样本才启用
/// </summary>
Baseline
```

### DeviceContext 扩展

```csharp
/// <summary>
/// 当前指标的基线数据（BaselineEvaluator 使用）
/// </summary>
public MetricBaseline? Baseline { get; set; }
```

## 第二部分：服务层

### BaselineCalculationService

```csharp
public class BaselineCalculationService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await CalculateBaselinesAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    private async Task CalculateBaselinesAsync(CancellationToken ct)
    {
        // 从 telemetry_hourly 查询最近 7 天的统计数据
        // 按 tenant_id, device_id, metric 聚合
        // 计算 avg, stddev, min, max, p95, count
        // 仅当 sample_count >= 100 时写入
        // UPSERT 到 metric_baselines
    }
}
```

关键实现细节：
- 通过 `IServiceScopeFactory` 创建作用域获取 `AppDbContext`
- 查询 SQL：直接使用 `FromSqlRaw` 查询 `telemetry_hourly`（非 EF 实体）
- UPSERT 使用 PostgreSQL `ON CONFLICT ... DO UPDATE`
- 首次执行延迟 30 秒等待应用完全启动

### BaselineEvaluator

```csharp
public class BaselineEvaluator : IAlertRuleEvaluator
{
    public RuleType RuleType => RuleType.Baseline;

    public bool Evaluate(double value, AlertRule rule, DeviceContext? context = null)
    {
        if (context?.Baseline == null || context.Baseline.SampleCount < 100)
            return false;

        if (rule.BaselineStddevMultiplier == null || context.Baseline.StdDev == 0)
            return false;

        var deviation = Math.Abs(value - context.Baseline.AvgValue) / context.Baseline.StdDev;
        return deviation > (double)rule.BaselineStddevMultiplier;
    }
}
```

关键规则：
- 基线不存在 → 返回 false（降级为阈值告警，不触发基线规则）
- sample_count < 100 → 返回 false（数据不足，不启用基线）
- stddev = 0 → 返回 false（避免除零，常量指标不适用基线）
- 默认倍数 3.0（3σ 规则，约 99.7% 置信区间）

### AlertEvaluationService 集成

在 `EvaluateForDeviceAsync` 方法中，评估器调用之前新增：
```csharp
// 查询当前指标的基线数据
var baseline = await dbContext.Set<Core.Entities.MetricBaseline>()
    .FirstOrDefaultAsync(b =>
        b.TenantId == tenantId &&
        b.DeviceId == deviceId &&
        b.Metric == metric, cancellationToken);

// 将基线数据注入 DeviceContext
if (baseline != null)
{
    context.Baseline = baseline;
}
```

## 第三部分：推送层

### IndustrialHub

```csharp
[Authorize]
public class IndustrialHub : Hub
{
    private readonly ITenantContext _tenantContext;

    public IndustrialHub(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    public override async Task OnConnectedAsync()
    {
        var tenantId = _tenantContext.TenantId;
        await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant:{tenantId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var tenantId = _tenantContext.TenantId;
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"tenant:{tenantId}");
        await base.OnDisconnectedAsync(exception);
    }
}
```

关键约束：
- `[Authorize]` 确保只有已认证用户可连接
- 连接时从 JWT 解析 tenantId，自动加入租户组
- 断开时自动清理组成员

### SignalRNotificationService

```csharp
public interface ISignalRNotificationService
{
    Task SendAlertTriggeredAsync(Guid tenantId, AlertDto alert);
    Task SendTelemetryUpdateAsync(Guid tenantId, Guid deviceId, string metric, double value);
    Task SendAlertResolvedAsync(Guid tenantId, Guid alertId);
}

public class SignalRNotificationService : ISignalRNotificationService
{
    private readonly IHubContext<IndustrialHub> _hubContext;

    public async Task SendAlertTriggeredAsync(Guid tenantId, AlertDto alert)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnAlertTriggered", alert);
    }

    public async Task SendTelemetryUpdateAsync(Guid tenantId, Guid deviceId, string metric, double value)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnTelemetryUpdate", deviceId, metric, value);
    }

    public async Task SendAlertResolvedAsync(Guid tenantId, Guid alertId)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnAlertResolved", alertId);
    }
}
```

### 事件集成

**AlertEventHandler 扩展**：
- 注入 `ISignalRNotificationService`
- 收到 `AlertTriggeredEvent` 时，映射为 `AlertDto` 并调用 `SendAlertTriggeredAsync`

**TelemetryEventHandler 扩展**（可选）：
- 遥测更新推送可通过配置开关控制
- 默认不推送（高频场景可能产生大量消息）

### 配置

**appsettings.json** 新增：
```json
"SignalR": {
    "HubPath": "/hubs/industrial",
    "KeepAliveIntervalSeconds": 15,
    "ClientTimeoutIntervalSeconds": 30
}
```

**Program.cs** 新增：
```csharp
builder.Services.AddSignalR(options =>
{
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// 在 MapControllers 之后
app.MapHub<IndustrialHub>("/hubs/industrial");
```

## 数据库迁移

新增表：
- `metric_baselines`

新增视图：
- `telemetry_hourly`（TimescaleDB 连续聚合）

修改表：
- `alert_rules` 新增 `baseline_stddev_multiplier` 列

## 测试范围

### 单元测试

- **BaselineEvaluatorTests**：
  - 偏离度 > 倍数时触发
  - 偏离度 <= 倍数时不触发
  - 基线不存在返回 false
  - sample_count < 100 返回 false
  - stddev = 0 返回 false
  - BaselineStddevMultiplier 为 null 返回 false

- **SignalRNotificationServiceTests**（可选，使用 Mock）：
  - 验证 SendAlertTriggeredAsync 调用 HubContext

### 集成测试

- SignalR Hub 连接 + 租户组隔离
- 基线计算流程：telemetry_hourly → metric_baselines

## 不包含在 Week 5-6

- AI 根因分析（Week 7-8）
- 工单管理（Week 7-8）
- 知识库（Phase 2）
- React 前端 useSignalR Hook
- TanStack Query 缓存失效联动
- 告警 Toast 通知 UI
