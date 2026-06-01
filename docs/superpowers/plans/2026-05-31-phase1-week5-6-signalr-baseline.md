# Phase 1 Week 5-6: SignalR 实时推送 & 基线告警引擎 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Week 3-4 的阈值告警基础上，完成基线告警（L3）、telemetry_hourly 连续聚合视图、SignalR Hub 实时推送，使系统能基于历史统计数据触发告警，并通过 WebSocket 实时推送到前端。

**Architecture:** 分层构建，从底层数据到顶层推送：(1) 数据层 — telemetry_hourly 连续聚合视图 + metric_baselines 表 + AlertRule/Baseline 枚举扩展；(2) 服务层 — BaselineCalculationService 后台计算 + BaselineEvaluator L3 评估器；(3) 推送层 — SignalR Hub + NotificationService + AlertEventHandler 集成。

**Tech Stack:** C# / .NET 8, EF Core 8 + Npgsql, TimescaleDB 连续聚合, SignalR, xUnit + FluentAssertions + Moq

**Spec:** `docs/superpowers/specs/2026-05-31-phase1-week5-6-signalr-baseline-design.md`

---

## 文件结构总览

```
新增文件：

src/EquipAI.Core/
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

src/EquipAI.WebAPI/
├── Hubs/
│   └── IndustrialHub.cs                   — SignalR Hub
├── Services/
│   └── SignalRNotificationService.cs      — SignalR 推送服务实现

tests/EquipAI.Tests.Unit/
├── Alerts/
│   └── BaselineEvaluatorTests.cs          — 基线评估器单元测试

修改文件：

src/EquipAI.Core/Enums/RuleType.cs                        — 新增 Baseline 枚举值
src/EquipAI.Core/Entities/AlertRule.cs                     — 新增 BaselineStddevMultiplier
src/EquipAI.Core/Interfaces/IAlertRuleEvaluator.cs         — DeviceContext 新增 Baseline 属性
src/EquipAI.Infrastructure/Data/AppDbContext.cs            — 新增 MetricBaseline DbSet
src/EquipAI.Infrastructure/Data/TimescaleDbSetup.cs        — 新增 telemetry_hourly 视图
src/EquipAI.Application/Alerts/AlertEvaluationService.cs   — 集成基线查询
src/EquipAI.Application/Alerts/Handlers/AlertEventHandler.cs   — 扩展 SignalR 推送
src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs — 注册新服务
src/EquipAI.WebAPI/Program.cs                              — SignalR 注册 + Hub 映射
src/EquipAI.WebAPI/appsettings.json                        — SignalR 配置节
src/EquipAI.Application/Alerts/DTOs/AlertRuleDto.cs        — 新增 BaselineStddevMultiplier
src/EquipAI.Application/Alerts/DTOs/CreateAlertRuleRequest.cs — 新增 BaselineStddevMultiplier
src/EquipAI.Application/Mapping/MappingProfile.cs          — 新增 MetricBaseline 映射（如需）
```

---

### Task 1: RuleType 枚举新增 Baseline

**Files:**
- Modify: `src/EquipAI.Core/Enums/RuleType.cs`

- [ ] **Step 1: 在 RuleType 枚举中新增 Baseline 值**

```csharp
namespace EquipAI.Core.Enums;

/// <summary>
/// 告警规则类型
/// </summary>
public enum RuleType
{
    /// <summary>
    /// 静态阈值 — 单指标超过固定阈值时触发
    /// </summary>
    Threshold,

    /// <summary>
    /// 组合条件 — 多个指标同时满足条件时触发
    /// </summary>
    Combined,

    /// <summary>
    /// 动态基线 — 基于历史统计数据的均值±N倍标准差触发
    /// 需要 100+ 样本才启用
    /// </summary>
    Baseline
}
```

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.Core/EquipAI.Core.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Core/Enums/RuleType.cs
git commit -m "feat: add Baseline enum value to RuleType"
```

---

### Task 2: AlertRule 实体新增 BaselineStddevMultiplier

**Files:**
- Modify: `src/EquipAI.Core/Entities/AlertRule.cs`

- [ ] **Step 1: 在 AlertRule 实体中添加 BaselineStddevMultiplier 属性**

在 `Conditions` 属性之后、`Severity` 属性之前新增：

```csharp
    /// <summary>
    /// 基线标准差倍数，仅 Baseline 类型使用（默认 3.0，即 3σ 规则）
    /// </summary>
    public decimal? BaselineStddevMultiplier { get; set; }
```

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.Core/EquipAI.Core.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Core/Entities/AlertRule.cs
git commit -m "feat: add BaselineStddevMultiplier to AlertRule entity"
```

---

### Task 3: MetricBaseline 实体

**Files:**
- Create: `src/EquipAI.Core/Entities/MetricBaseline.cs`

- [ ] **Step 1: 创建 MetricBaseline 实体**

```csharp
namespace EquipAI.Core.Entities;

/// <summary>
/// 指标基线数据实体，存储基于历史遥测数据计算的统计基线
/// 由 BaselineCalculationService 定期从 telemetry_hourly 聚合更新
/// BaselineEvaluator 读取基线判断当前值是否偏离历史正常范围
/// </summary>
public class MetricBaseline : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 设备 ID
    /// </summary>
    public Guid DeviceId { get; set; }

    /// <summary>
    /// 指标名称（如 temperature、vibration）
    /// </summary>
    public string Metric { get; set; } = string.Empty;

    /// <summary>
    /// 基线统计周期的起始时间
    /// </summary>
    public DateTime PeriodStart { get; set; }

    /// <summary>
    /// 基线统计周期的结束时间
    /// </summary>
    public DateTime PeriodEnd { get; set; }

    /// <summary>
    /// 均值
    /// </summary>
    public double? AvgValue { get; set; }

    /// <summary>
    /// 标准差
    /// </summary>
    public double? StdDev { get; set; }

    /// <summary>
    /// 最小值
    /// </summary>
    public double? MinValue { get; set; }

    /// <summary>
    /// 最大值
    /// </summary>
    public double? MaxValue { get; set; }

    /// <summary>
    /// 95 百分位值
    /// </summary>
    public double? P95Value { get; set; }

    /// <summary>
    /// 样本数量
    /// </summary>
    public int? SampleCount { get; set; }

    /// <summary>
    /// 最后更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.Core/EquipAI.Core.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Core/Entities/MetricBaseline.cs
git commit -m "feat: add MetricBaseline entity for baseline alerting"
```

---

### Task 4: DeviceContext 新增 Baseline 属性

**Files:**
- Modify: `src/EquipAI.Core/Interfaces/IAlertRuleEvaluator.cs`

- [ ] **Step 1: 在 DeviceContext 类中添加 Baseline 属性**

在 `Metrics` 属性之后、`GetMetricValue` 方法之前新增：

```csharp
    /// <summary>
    /// 当前指标的基线数据（BaselineEvaluator 使用）
    /// </summary>
    public MetricBaseline? Baseline { get; set; }
```

需要添加 `using EquipAI.Core.Entities;` 引用（如果尚未引用）。

完整 DeviceContext 类应为：

```csharp
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 设备上下文，提供评估时需要的设备全量指标数据
/// CombinedEvaluator 需要同时查看多个指标的值
/// BaselineEvaluator 需要 Baseline 历史统计数据
/// </summary>
public class DeviceContext
{
    /// <summary>
    /// 指标名称到数值的映射
    /// </summary>
    public Dictionary<string, double> Metrics { get; } = new();

    /// <summary>
    /// 当前指标的基线数据（BaselineEvaluator 使用）
    /// </summary>
    public MetricBaseline? Baseline { get; set; }

    /// <summary>
    /// 获取指定指标的值，不存在时返回 null
    /// </summary>
    public double? GetMetricValue(string metric)
    {
        return Metrics.TryGetValue(metric, out var value) ? value : null;
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.Core/EquipAI.Core.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Core/Interfaces/IAlertRuleEvaluator.cs
git commit -m "feat: add Baseline property to DeviceContext"
```

---

### Task 5: MetricBaseline EF 配置 + DbContext 注册

**Files:**
- Create: `src/EquipAI.Infrastructure/Data/Configurations/MetricBaselineConfiguration.cs`
- Modify: `src/EquipAI.Infrastructure/Data/AppDbContext.cs`

- [ ] **Step 1: 创建 MetricBaselineConfiguration**

```csharp
using EquipAI.Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EquipAI.Infrastructure.Data.Configurations;

/// <summary>
/// MetricBaseline 实体的 EF Core 配置
/// 映射到 metric_baselines 表，配置唯一约束和列映射
/// </summary>
public class MetricBaselineConfiguration : IEntityTypeConfiguration<MetricBaseline>
{
    public void Configure(EntityTypeBuilder<MetricBaseline> builder)
    {
        builder.ToTable("metric_baselines");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id).HasColumnName("id");
        builder.Property(e => e.TenantId).HasColumnName("tenant_id");
        builder.Property(e => e.DeviceId).HasColumnName("device_id");
        builder.Property(e => e.Metric).HasColumnName("metric").HasMaxLength(100);
        builder.Property(e => e.PeriodStart).HasColumnName("period_start");
        builder.Property(e => e.PeriodEnd).HasColumnName("period_end");
        builder.Property(e => e.AvgValue).HasColumnName("avg_value");
        builder.Property(e => e.StdDev).HasColumnName("std_dev");
        builder.Property(e => e.MinValue).HasColumnName("min_value");
        builder.Property(e => e.MaxValue).HasColumnName("max_value");
        builder.Property(e => e.P95Value).HasColumnName("p95_value");
        builder.Property(e => e.SampleCount).HasColumnName("sample_count");
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at");

        // 唯一约束：同一租户同一设备同一指标只有一条基线
        builder.HasIndex(e => new { e.TenantId, e.DeviceId, e.Metric }).IsUnique();
    }
}
```

- [ ] **Step 2: 在 AppDbContext 中添加 MetricBaseline DbSet**

在 `DeviceTelemetry` DbSet 之后新增：

```csharp
    /// <summary>
    /// 指标基线数据表
    /// </summary>
    public DbSet<Core.Entities.MetricBaseline> MetricBaselines => Set<Core.Entities.MetricBaseline>();
```

- [ ] **Step 3: 在 AlertRuleConfiguration 中添加 BaselineStddevMultiplier 列映射**

打开 `src/EquipAI.Infrastructure/Data/Configurations/AlertRuleConfiguration.cs`，在 `conditions` 列映射之后添加：

```csharp
        builder.Property(e => e.BaselineStddevMultiplier).HasColumnName("baseline_stddev_multiplier");
```

- [ ] **Step 4: 编译验证**

Run: `dotnet build src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 5: 提交**

```bash
git add src/EquipAI.Infrastructure/Data/Configurations/MetricBaselineConfiguration.cs \
        src/EquipAI.Infrastructure/Data/AppDbContext.cs \
        src/EquipAI.Infrastructure/Data/Configurations/AlertRuleConfiguration.cs
git commit -m "feat: add MetricBaseline EF configuration and DbContext registration"
```

---

### Task 6: EF Core 迁移 — metric_baselines 表 + alert_rules 新列

**Files:**
- Create: 自动生成的迁移文件

- [ ] **Step 1: 创建迁移**

Run: `dotnet ef migrations add AddMetricBaselinesAndBaselineStddev --project src/EquipAI.Infrastructure --startup-project src/EquipAI.WebAPI --output-dir Data/Migrations`
Expected: Build succeeded, 迁移文件已创建

- [ ] **Step 2: 检查生成的迁移文件**

打开生成的迁移文件，确认包含：
- `metric_baselines` 表创建（含唯一索引 `IX_metric_baselines_tenant_id_device_id_metric`）
- `alert_rules` 表新增 `baseline_stddev_multiplier` 列

- [ ] **Step 3: 编译验证**

Run: `dotnet build`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Infrastructure/Data/Migrations/
git commit -m "feat: add EF Core migration for metric_baselines and alert_rules baseline column"
```

---

### Task 7: telemetry_hourly 连续聚合视图

**Files:**
- Modify: `src/EquipAI.Infrastructure/Data/TimescaleDbSetup.cs`

- [ ] **Step 1: 在 TimescaleDbSetup.InitializeAsync 末尾添加 telemetry_hourly 视图创建**

在 `InitializeAsync` 方法的 `_logger.LogInformation("TimescaleDB 压缩和保留策略已配置");` 之前，添加以下代码：

```csharp
            // 创建 telemetry_hourly 连续聚合视图（幂等）
            await _dbContext.Database.ExecuteSqlRawAsync("""
                CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry_hourly
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
                GROUP BY 1, 2, 3, 4
                WITH NO DATA;
                """, cancellationToken);

            _logger.LogInformation("telemetry_hourly 连续聚合视图已创建");

            // 添加连续聚合刷新策略（每小时刷新一次，刷新 3 小时前到 1 小时前的数据）
            await _dbContext.Database.ExecuteSqlRawAsync("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM timescaledb_information.jobs
                        WHERE proc_name = 'policy_refresh_continuous_aggregate'
                        AND hypertable_name = 'telemetry_hourly'
                    ) THEN
                        PERFORM add_continuous_aggregate_policy('telemetry_hourly',
                            start_offset => INTERVAL '3 hours',
                            end_offset => INTERVAL '1 hour',
                            schedule_interval => INTERVAL '1 hour');
                    END IF;
                END $$;
                """, cancellationToken);

            _logger.LogInformation("telemetry_hourly 刷新策略已配置");
```

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.Infrastructure/EquipAI.Infrastructure.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Infrastructure/Data/TimescaleDbSetup.cs
git commit -m "feat: add telemetry_hourly continuous aggregate view to TimescaleDbSetup"
```

---

### Task 8: IBaselineCalculationService 接口 + BaselineCalculationService 实现

**Files:**
- Create: `src/EquipAI.Core/Interfaces/IBaselineCalculationService.cs`
- Create: `src/EquipAI.Application/Alerts/BaselineCalculationService.cs`

- [ ] **Step 1: 创建 IBaselineCalculationService 接口**

```csharp
namespace EquipAI.Core.Interfaces;

/// <summary>
/// 基线计算服务接口
/// 从 telemetry_hourly 视图聚合历史统计数据，写入 metric_baselines 表
/// </summary>
public interface IBaselineCalculationService
{
    /// <summary>
    /// 执行一次基线计算（从最近 7 天的小时聚合数据计算基线）
    /// </summary>
    Task CalculateBaselinesAsync(CancellationToken cancellationToken = default);
}
```

- [ ] **Step 2: 创建 BaselineCalculationService 实现**

```csharp
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Alerts;

/// <summary>
/// 基线计算后台服务
/// 定期从 telemetry_hourly 连续聚合视图查询最近 7 天的统计数据，
/// 按 tenant_id, device_id, metric 聚合后 UPSERT 到 metric_baselines 表。
/// 仅当样本数量 >= 100 时才写入基线（确保统计意义）。
/// </summary>
public class BaselineCalculationService : BackgroundService, IBaselineCalculationService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BaselineCalculationService> _logger;

    public BaselineCalculationService(
        IServiceScopeFactory scopeFactory,
        ILogger<BaselineCalculationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // 首次延迟 30 秒等待应用完全启动
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CalculateBaselinesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "基线计算执行失败");
            }

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }

    /// <inheritdoc />
    public async Task CalculateBaselinesAsync(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // 从 telemetry_hourly 查询最近 7 天的统计数据，按设备+指标聚合
        var sql = """
            SELECT
                tenant_id,
                device_id,
                metric,
                NOW() - INTERVAL '7 days' AS period_start,
                NOW() AS period_end,
                AVG(avg_value) AS avg_value,
                STDDEV(avg_value) AS std_dev,
                MIN(min_value) AS min_value,
                MAX(max_value) AS max_value,
                PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY avg_value) AS p95_value,
                SUM(sample_count)::INT AS sample_count
            FROM telemetry_hourly
            WHERE bucket >= NOW() - INTERVAL '7 days'
            GROUP BY tenant_id, device_id, metric
            HAVING SUM(sample_count) >= 100
            """;

        var baselines = await dbContext.Database.SqlQueryRaw<BaselineRow>(sql).ToListAsync(cancellationToken);

        if (baselines.Count == 0)
        {
            _logger.LogDebug("暂无满足条件的基线数据（需要 7 天内 100+ 样本）");
            return;
        }

        // UPSERT 到 metric_baselines 表
        foreach (var row in baselines)
        {
            var upsertSql = """
                INSERT INTO metric_baselines (id, tenant_id, device_id, metric, period_start, period_end,
                    avg_value, std_dev, min_value, max_value, p95_value, sample_count, updated_at, created_at)
                VALUES (gen_random_uuid(), {0}, {1}, {2}, {3}, {4},
                    {5}, {6}, {7}, {8}, {9}, {10}, NOW(), NOW())
                ON CONFLICT (tenant_id, device_id, metric)
                DO UPDATE SET
                    period_start = EXCLUDED.period_start,
                    period_end = EXCLUDED.period_end,
                    avg_value = EXCLUDED.avg_value,
                    std_dev = EXCLUDED.std_dev,
                    min_value = EXCLUDED.min_value,
                    max_value = EXCLUDED.max_value,
                    p95_value = EXCLUDED.p95_value,
                    sample_count = EXCLUDED.sample_count,
                    updated_at = NOW()
                """;

            await dbContext.Database.ExecuteSqlRawAsync(upsertSql,
                [row.TenantId, row.DeviceId, row.Metric, row.PeriodStart, row.PeriodEnd,
                 row.AvgValue, row.StdDev, row.MinValue, row.MaxValue, row.P95Value, row.SampleCount],
                cancellationToken);
        }

        _logger.LogInformation("基线计算完成，已更新 {Count} 条基线记录", baselines.Count);
    }

    /// <summary>
    /// telemetry_hourly 聚合查询的内部结果行
    /// </summary>
    private class BaselineRow
    {
        public Guid TenantId { get; set; }
        public Guid DeviceId { get; set; }
        public string Metric { get; set; } = string.Empty;
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public double? AvgValue { get; set; }
        public double? StdDev { get; set; }
        public double? MinValue { get; set; }
        public double? MaxValue { get; set; }
        public double? P95Value { get; set; }
        public int SampleCount { get; set; }
    }
}
```

- [ ] **Step 3: 编译验证**

Run: `dotnet build src/EquipAI.Application/EquipAI.Application.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Core/Interfaces/IBaselineCalculationService.cs \
        src/EquipAI.Application/Alerts/BaselineCalculationService.cs
git commit -m "feat: add BaselineCalculationService for hourly baseline recalculation"
```

---

### Task 9: BaselineEvaluator 基线评估器（TDD）

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Alerts/BaselineEvaluatorTests.cs`
- Create: `src/EquipAI.Application/Alerts/Evaluators/BaselineEvaluator.cs`

- [ ] **Step 1: 编写 BaselineEvaluator 单元测试**

```csharp
using EquipAI.Application.Alerts.Evaluators;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Alerts;

public class BaselineEvaluatorTests
{
    private readonly BaselineEvaluator _evaluator = new();

    /// <summary>
    /// 辅助方法：创建默认基线（均值 50、标准差 5、样本数 200）
    /// </summary>
    private static MetricBaseline CreateBaseline(
        double avgValue = 50.0,
        double stdDev = 5.0,
        int sampleCount = 200)
    {
        return new MetricBaseline
        {
            AvgValue = avgValue,
            StdDev = stdDev,
            SampleCount = sampleCount
        };
    }

    /// <summary>
    /// 辅助方法：创建 Baseline 类型的告警规则
    /// </summary>
    private static AlertRule CreateRule(double multiplier = 3.0)
    {
        return new AlertRule
        {
            RuleType = RuleType.Baseline,
            BaselineStddevMultiplier = (decimal)multiplier
        };
    }

    [Fact]
    public void Evaluate_DeviationExceedsMultiplier_ReturnsTrue()
    {
        // 均值 50，标准差 5，3σ → 超过 50 + 15 = 65 即触发
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 200);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(70.0, rule, context);

        result.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_DeviationEqualsMultiplier_ReturnsFalse()
    {
        // 偏离度恰好等于倍数时不触发（严格大于）
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 200);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        // 偏离度 = |65 - 50| / 5 = 3.0，恰好等于倍数
        var result = _evaluator.Evaluate(65.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_DeviationBelowMultiplier_ReturnsFalse()
    {
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 200);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        // 偏离度 = |60 - 50| / 5 = 2.0 < 3.0
        var result = _evaluator.Evaluate(60.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_BelowAverageDeviationExceedsMultiplier_ReturnsTrue()
    {
        // 低于均值的偏离也应触发
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 200);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        // 偏离度 = |30 - 50| / 5 = 4.0 > 3.0
        var result = _evaluator.Evaluate(30.0, rule, context);

        result.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_NoBaseline_ReturnsFalse()
    {
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = null };

        var result = _evaluator.Evaluate(70.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_NullContext_ReturnsFalse()
    {
        var rule = CreateRule(multiplier: 3.0);

        var result = _evaluator.Evaluate(70.0, rule, null);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_SampleCountBelow100_ReturnsFalse()
    {
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 99);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(70.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_StdDevZero_ReturnsFalse()
    {
        // 标准差为 0 意味着常量指标，基线不适用
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 0.0, sampleCount: 200);
        var rule = CreateRule(multiplier: 3.0);
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(70.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void Evaluate_NullMultiplier_ReturnsFalse()
    {
        var baseline = CreateBaseline(avgValue: 50.0, stdDev: 5.0, sampleCount: 200);
        var rule = new AlertRule
        {
            RuleType = RuleType.Baseline,
            BaselineStddevMultiplier = null
        };
        var context = new DeviceContext { Baseline = baseline };

        var result = _evaluator.Evaluate(70.0, rule, context);

        result.Should().BeFalse();
    }

    [Fact]
    public void RuleType_IsBaseline()
    {
        _evaluator.RuleType.Should().Be(RuleType.Baseline);
    }
}
```

- [ ] **Step 2: 运行测试，确认全部失败**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "BaselineEvaluator" -v n`
Expected: 10 FAILED（编译错误，BaselineEvaluator 类不存在）

- [ ] **Step 3: 实现 BaselineEvaluator**

```csharp
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;

namespace EquipAI.Application.Alerts.Evaluators;

/// <summary>
/// 基线评估器（L3 告警）
/// 基于历史统计数据的均值±N倍标准差判断是否偏离正常范围
/// 需满足以下条件才能触发：
/// - 基线数据存在且样本数 >= 100
/// - 标准差不为 0（常量指标不适用）
/// - 规则配置了标准差倍数
/// - 当前值偏离均值超过 N 倍标准差
/// </summary>
public class BaselineEvaluator : IAlertRuleEvaluator
{
    public RuleType RuleType => RuleType.Baseline;

    public bool Evaluate(double value, AlertRule rule, DeviceContext? context = null)
    {
        // 无上下文或无基线数据 → 不触发
        if (context?.Baseline == null)
            return false;

        var baseline = context.Baseline;

        // 样本数不足 → 数据不具备统计意义，不启用基线
        if (baseline.SampleCount < 100)
            return false;

        // 标准差为 0 → 常量指标，基线不适用，避免除零
        if (baseline.StdDev == 0 || baseline.StdDev == null)
            return false;

        // 未配置标准差倍数 → 规则不完整
        if (rule.BaselineStddevMultiplier == null)
            return false;

        // 计算偏离度（当前值与均值之差的绝对值 / 标准差）
        var deviation = Math.Abs(value - (baseline.AvgValue ?? 0)) / baseline.StdDev.Value;

        return deviation > (double)rule.BaselineStddevMultiplier;
    }
}
```

- [ ] **Step 4: 运行测试，确认全部通过**

Run: `dotnet test tests/EquipAI.Tests.Unit --filter "BaselineEvaluator" -v n`
Expected: 10 PASSED

- [ ] **Step 5: 提交**

```bash
git add tests/EquipAI.Tests.Unit/Alerts/BaselineEvaluatorTests.cs \
        src/EquipAI.Application/Alerts/Evaluators/BaselineEvaluator.cs
git commit -m "feat: add BaselineEvaluator with TDD (10 tests passing)"
```

---

### Task 10: AlertEvaluationService 集成基线查询

**Files:**
- Modify: `src/EquipAI.Application/Alerts/AlertEvaluationService.cs`

- [ ] **Step 1: 在 EvaluateForDeviceAsync 方法中添加基线数据查询**

在 `var rules = await dbContext.AlertRules...ToListAsync();` 之前（即规则查询之前），添加基线查询：

```csharp
        // 查询当前设备当前指标的基线数据，供 BaselineEvaluator 使用
        var baseline = await dbContext.Set<Core.Entities.MetricBaseline>()
            .FirstOrDefaultAsync(b =>
                b.TenantId == tenantId &&
                b.DeviceId == deviceId &&
                b.Metric == metric, cancellationToken);

        if (baseline != null)
        {
            context.Baseline = baseline;
        }
```

注意：需要添加 `using EquipAI.Core.Entities;` 到 using 部分。

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.Application/EquipAI.Application.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 运行所有已有单元测试确认无回归**

Run: `dotnet test tests/EquipAI.Tests.Unit -v n`
Expected: 全部 PASSED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Application/Alerts/AlertEvaluationService.cs
git commit -m "feat: integrate baseline query into AlertEvaluationService"
```

---

### Task 11: ISignalRNotificationService 接口 + SignalRNotificationService 实现

**Files:**
- Create: `src/EquipAI.Core/Interfaces/ISignalRNotificationService.cs`
- Create: `src/EquipAI.WebAPI/Services/SignalRNotificationService.cs`

- [ ] **Step 1: 创建 ISignalRNotificationService 接口（Core 层）**

```csharp
using EquipAI.Application.Alerts.DTOs;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// SignalR 实时推送服务接口
/// 定义告警和遥测数据的实时推送能力
/// </summary>
public interface ISignalRNotificationService
{
    /// <summary>
    /// 推送告警触发事件到租户组
    /// </summary>
    Task SendAlertTriggeredAsync(Guid tenantId, AlertDto alert);

    /// <summary>
    /// 推送遥测数据更新到租户组
    /// </summary>
    Task SendTelemetryUpdateAsync(Guid tenantId, Guid deviceId, string metric, double value);

    /// <summary>
    /// 推送告警解决事件到租户组
    /// </summary>
    Task SendAlertResolvedAsync(Guid tenantId, Guid alertId);
}
```

- [ ] **Step 2: 创建 SignalRNotificationService 实现（WebAPI 层）**

先确认 `src/EquipAI.WebAPI/Services/` 目录是否存在，不存在则创建。

```csharp
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace EquipAI.WebAPI.Services;

/// <summary>
/// SignalR 实时推送服务实现
/// 通过 IHubContext 向租户组推送告警和遥测数据更新
/// 租户隔离：每条消息仅推送到对应租户的 SignalR 组
/// </summary>
public class SignalRNotificationService : ISignalRNotificationService
{
    private readonly IHubContext<Hubs.IndustrialHub> _hubContext;

    public SignalRNotificationService(IHubContext<Hubs.IndustrialHub> hubContext)
    {
        _hubContext = hubContext;
    }

    /// <inheritdoc />
    public async Task SendAlertTriggeredAsync(Guid tenantId, AlertDto alert)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnAlertTriggered", alert);
    }

    /// <inheritdoc />
    public async Task SendTelemetryUpdateAsync(Guid tenantId, Guid deviceId, string metric, double value)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnTelemetryUpdate", deviceId, metric, value);
    }

    /// <inheritdoc />
    public async Task SendAlertResolvedAsync(Guid tenantId, Guid alertId)
    {
        await _hubContext.Clients.Group($"tenant:{tenantId}")
            .SendAsync("OnAlertResolved", alertId);
    }
}
```

- [ ] **Step 3: 编译验证（此处暂时会失败，因为 IndustrialHub 尚未创建，在 Task 12 中创建）**

如果单独编译会因 IndustrialHub 不存在而失败，这是预期行为。先跳过编译验证，等 Task 12 完成。

- [ ] **Step 4: 提交（与 Task 12 一起提交，或先保存不提交）**

暂时不提交，等 Task 12 完成后一起提交。

---

### Task 12: IndustrialHub SignalR Hub

**Files:**
- Create: `src/EquipAI.WebAPI/Hubs/IndustrialHub.cs`

- [ ] **Step 1: 创建 IndustrialHub**

先确认 `src/EquipAI.WebAPI/Hubs/` 目录是否存在，不存在则创建。

```csharp
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EquipAI.WebAPI.Hubs;

/// <summary>
/// 工业设备实时推送 Hub
/// 已认证用户连接后自动加入其租户组，断开时自动清理
/// 租户隔离通过 SignalR Group 实现：tenant:{tenantId}
/// </summary>
[Authorize]
public class IndustrialHub : Hub
{
    private readonly ITenantContext _tenantContext;

    public IndustrialHub(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 客户端连接时，自动加入其所属租户的 SignalR 组
    /// 租户 ID 从 JWT Token 中解析
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var tenantId = _tenantContext.TenantId;
        if (tenantId != Guid.Empty)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant:{tenantId}");
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// 客户端断开时，自动从租户组中移除
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var tenantId = _tenantContext.TenantId;
        if (tenantId != Guid.Empty)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"tenant:{tenantId}");
        }

        await base.OnDisconnectedAsync(exception);
    }
}
```

- [ ] **Step 2: 编译验证（Task 11 + Task 12 一起）**

Run: `dotnet build src/EquipAI.WebAPI/EquipAI.WebAPI.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交（Task 11 + Task 12 一起）**

```bash
git add src/EquipAI.Core/Interfaces/ISignalRNotificationService.cs \
        src/EquipAI.WebAPI/Services/SignalRNotificationService.cs \
        src/EquipAI.WebAPI/Hubs/IndustrialHub.cs
git commit -m "feat: add SignalR Hub, notification service interface and implementation"
```

---

### Task 13: AlertEventHandler 集成 SignalR 推送

**Files:**
- Modify: `src/EquipAI.Application/Alerts/Handlers/AlertEventHandler.cs`

- [ ] **Step 1: 扩展 AlertEventHandler，注入 ISignalRNotificationService 并在告警触发时推送**

将 AlertEventHandler 修改为：

```csharp
using AutoMapper;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Alerts.Handlers;

/// <summary>
/// 告警触发事件处理器
/// 1. 记录日志
/// 2. 通过 SignalR 实时推送到前端
/// </summary>
public class AlertEventHandler : IEventHandler<AlertTriggeredEvent>
{
    private readonly ILogger<AlertEventHandler> _logger;
    private readonly ISignalRNotificationService _notificationService;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMapper _mapper;

    public AlertEventHandler(
        ILogger<AlertEventHandler> logger,
        ISignalRNotificationService notificationService,
        IServiceScopeFactory scopeFactory,
        IMapper mapper)
    {
        _logger = logger;
        _notificationService = notificationService;
        _scopeFactory = scopeFactory;
        _mapper = mapper;
    }

    /// <inheritdoc />
    public async Task HandleAsync(AlertTriggeredEvent @event, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "告警已触发: AlertId={AlertId}, 设备={DeviceId}, 指标={Metric}, 值={Value}, 级别={Severity}",
            @event.AlertId, @event.DeviceId, @event.Metric, @event.Value, @event.Severity);

        // 查询告警实体并映射为 DTO 用于推送
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<Infrastructure.Data.AppDbContext>();

        var alert = await dbContext.Alerts.FindAsync(new object[] { @event.AlertId }, cancellationToken);
        if (alert != null)
        {
            var alertDto = _mapper.Map<AlertDto>(alert);
            await _notificationService.SendAlertTriggeredAsync(@event.TenantId, alertDto);
            _logger.LogDebug("告警已通过 SignalR 推送: AlertId={AlertId}", @event.AlertId);
        }
    }
}
```

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.Application/EquipAI.Application.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.Application/Alerts/Handlers/AlertEventHandler.cs
git commit -m "feat: integrate SignalR push into AlertEventHandler"
```

---

### Task 14: DTO 扩展 — AlertRuleDto 和 CreateAlertRuleRequest 新增基线字段

**Files:**
- Modify: `src/EquipAI.Application/Alerts/DTOs/AlertRuleDto.cs`
- Modify: `src/EquipAI.Application/Alerts/DTOs/CreateAlertRuleRequest.cs`

- [ ] **Step 1: AlertRuleDto 新增 BaselineStddevMultiplier**

在 `Conditions` 属性之后、`Severity` 属性之前新增：

```csharp
    public decimal? BaselineStddevMultiplier { get; set; }
```

- [ ] **Step 2: CreateAlertRuleRequest 新增 BaselineStddevMultiplier**

在 `Conditions` 属性之后、`Severity` 属性之前新增：

```csharp
    public decimal? BaselineStddevMultiplier { get; set; }
```

- [ ] **Step 3: 编译验证**

Run: `dotnet build src/EquipAI.Application/EquipAI.Application.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.Application/Alerts/DTOs/AlertRuleDto.cs \
        src/EquipAI.Application/Alerts/DTOs/CreateAlertRuleRequest.cs
git commit -m "feat: add BaselineStddevMultiplier to alert rule DTOs"
```

---

### Task 15: ServiceCollectionExtensions 注册新服务

**Files:**
- Modify: `src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs`

- [ ] **Step 1: 在 AddInfrastructure 中注册 SignalR 和 BaselineCalculationService**

在 `AddInfrastructure` 方法的 `// TimescaleDB 初始化服务` 注释行之前，添加：

```csharp
        // SignalR 实时推送服务（Scoped — 可注入 Scoped 的 ITenantContext）
        services.AddScoped<ISignalRNotificationService, Services.SignalRNotificationService>();
```

在 `AddApplication` 方法中，在 `// 告警评估器` 区域的 `CombinedEvaluator` 注册之后添加：

```csharp
        services.AddSingleton<IAlertRuleEvaluator, BaselineEvaluator>();
```

在 `// 告警评估服务` 之后添加：

```csharp
        // 基线计算后台服务
        services.AddHostedService<BaselineCalculationService>();
```

需要在文件顶部添加必要的 using：

```csharp
using EquipAI.Application.Alerts.Evaluators;
using EquipAI.Core.Interfaces;
```

（检查是否已存在这些 using，避免重复）

- [ ] **Step 2: 编译验证**

Run: `dotnet build src/EquipAI.WebAPI/EquipAI.WebAPI.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 3: 提交**

```bash
git add src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs
git commit -m "feat: register BaselineEvaluator, BaselineCalculationService and SignalR services"
```

---

### Task 16: Program.cs SignalR 注册 + Hub 映射

**Files:**
- Modify: `src/EquipAI.WebAPI/Program.cs`

- [ ] **Step 1: 在 builder.Services.AddControllers() 之后添加 SignalR 注册**

```csharp
    builder.Services.AddSignalR(options =>
    {
        options.KeepAliveInterval = TimeSpan.FromSeconds(15);
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    });
```

- [ ] **Step 2: 在 app.MapControllers() 之后添加 Hub 映射**

```csharp
    app.MapHub<EquipAI.WebAPI.Hubs.IndustrialHub>("/hubs/industrial");
```

- [ ] **Step 3: 编译验证**

Run: `dotnet build src/EquipAI.WebAPI/EquipAI.WebAPI.csproj`
Expected: BUILD SUCCEEDED

- [ ] **Step 4: 提交**

```bash
git add src/EquipAI.WebAPI/Program.cs
git commit -m "feat: register SignalR and map IndustrialHub endpoint"
```

---

### Task 17: appsettings.json 新增 SignalR 配置节

**Files:**
- Modify: `src/EquipAI.WebAPI/appsettings.json`

- [ ] **Step 1: 在 `Mqtt` 配置节之后、`AllowedHosts` 之前新增 SignalR 配置**

```json
  "SignalR": {
    "HubPath": "/hubs/industrial",
    "KeepAliveIntervalSeconds": 15,
    "ClientTimeoutIntervalSeconds": 30
  },
```

- [ ] **Step 2: 提交**

```bash
git add src/EquipAI.WebAPI/appsettings.json
git commit -m "feat: add SignalR configuration section to appsettings"
```

---

### Task 18: 全量编译 + 测试验证

**Files:**
- 无新增文件

- [ ] **Step 1: 全量编译**

Run: `dotnet build`
Expected: BUILD SUCCEEDED，0 错误 0 警告

- [ ] **Step 2: 运行全部单元测试**

Run: `dotnet test tests/EquipAI.Tests.Unit -v n`
Expected: 全部 PASSED（包含之前的 43 个 + 新增的 10 个 BaselineEvaluator 测试 = 53 个）

- [ ] **Step 3: 如有测试失败，修复后重新运行**

---

## 自检清单

| 规格要求 | 对应任务 |
|---------|---------|
| RuleType.Baseline 枚举值 | Task 1 |
| AlertRule.BaselineStddevMultiplier 字段 | Task 2 |
| MetricBaseline 实体 | Task 3 |
| DeviceContext.Baseline 属性 | Task 4 |
| MetricBaseline EF 配置 + DbSet | Task 5 |
| metric_baselines 表迁移 | Task 6 |
| telemetry_hourly 连续聚合视图 | Task 7 |
| BaselineCalculationService | Task 8 |
| BaselineEvaluator (L3) | Task 9 |
| AlertEvaluationService 基线集成 | Task 10 |
| ISignalRNotificationService 接口 | Task 11 |
| SignalRNotificationService 实现 | Task 11 |
| IndustrialHub | Task 12 |
| AlertEventHandler SignalR 推送 | Task 13 |
| DTO 扩展 (BaselineStddevMultiplier) | Task 14 |
| DI 注册 | Task 15 |
| SignalR 注册 + Hub 映射 | Task 16 |
| appsettings.json SignalR 配置 | Task 17 |
