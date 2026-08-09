using EquipAI.Application.Analysis;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// DeviceHealthService 单元测试
/// 验证健康度评分计算逻辑：
/// - 在线无告警设备 → 高分
/// - 有 Critical 告警 → 大幅扣分
/// - Offline 设备 → 状态分降低
/// - 等级划分阈值（85/70/50）
/// </summary>
public class DeviceHealthServiceTests
{
    /// <summary>构造 InMemory AppDbContext 并可选预填数据</summary>
    private static async Task<(AppDbContext db, DeviceHealthService svc)> CreateAsync(
        Func<AppDbContext, Task>? seed = null)
    {
        var dbName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddLogging();
        // AppDbContext 构造依赖 ITenantContext
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.Empty));
        var sp = services.BuildServiceProvider();
        var db = sp.GetRequiredService<AppDbContext>();

        if (seed is not null)
            await seed(db);

        var svc = new DeviceHealthService(db, Mock.Of<ILogger<DeviceHealthService>>());
        return (db, svc);
    }

    /// <summary>测试用租户上下文</summary>
    private sealed class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Database";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    private static Device CreateDevice(Guid id, DeviceStatus status = DeviceStatus.Online) => new()
    {
        Id = id,
        TenantId = Guid.Empty,
        DeviceCode = "AC-001",
        Name = "Test",
        Type = "空压机",
        Status = status,
        HealthScore = 100,
    };

    [Fact]
    public void GetHealthLevel_Should_Classify_Correctly()
    {
        DeviceHealthService.GetHealthLevel(90).Should().Be("Healthy");
        DeviceHealthService.GetHealthLevel(85).Should().Be("Healthy");
        DeviceHealthService.GetHealthLevel(75).Should().Be("Good");
        DeviceHealthService.GetHealthLevel(70).Should().Be("Good");
        DeviceHealthService.GetHealthLevel(60).Should().Be("Warning");
        DeviceHealthService.GetHealthLevel(50).Should().Be("Warning");
        DeviceHealthService.GetHealthLevel(30).Should().Be("Critical");
        DeviceHealthService.GetHealthLevel(0).Should().Be("Critical");
    }

    [Fact]
    public async Task Online_Device_No_Alerts_Should_Score_High()
    {
        var deviceId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Devices.AddAsync(CreateDevice(deviceId, DeviceStatus.Online));
            await ctx.SaveChangesAsync();
        });

        var score = await svc.CalculateHealthScoreAsync(deviceId);

        score.Should().NotBeNull();
        // 在线(100*0.3) + 无告警(100*0.4) + 无遥测给中性分(70*0.3) = 91
        score.Should().BeApproximately(91.0, 0.5);
        DeviceHealthService.GetHealthLevel(score!.Value).Should().Be("Healthy");
    }

    [Fact]
    public async Task Critical_Alert_Should_Significantly_Reduce_Score()
    {
        var deviceId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Devices.AddAsync(CreateDevice(deviceId, DeviceStatus.Online));
            await ctx.Alerts.AddAsync(new Alert
            {
                DeviceId = deviceId,
                TenantId = Guid.Empty,
                Severity = AlertSeverity.Critical,
                Status = AlertStatus.Active,
                Metric = "oil_temperature",
                Message = "test",
                OccurredAt = DateTime.UtcNow.AddDays(-1),
            });
            await ctx.SaveChangesAsync();
        });

        var score = await svc.CalculateHealthScoreAsync(deviceId);

        score.Should().NotBeNull();
        // 一条 Critical 活跃告警：扣 25 + 5(活跃) = 30，告警分=70
        // 总分 = 100*0.3 + 70*0.4 + 70*0.3 = 30+28+21 = 79
        score.Should().BeApproximately(79.0, 0.5);
        DeviceHealthService.GetHealthLevel(score!.Value).Should().Be("Good");
    }

    [Fact]
    public async Task Offline_Device_Should_Lose_Status_Points()
    {
        var deviceId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Devices.AddAsync(CreateDevice(deviceId, DeviceStatus.Offline));
            await ctx.SaveChangesAsync();
        });

        var score = await svc.CalculateHealthScoreAsync(deviceId);

        score.Should().NotBeNull();
        // Offline 状态分=50：50*0.3 + 100*0.4 + 70*0.3 = 15+40+21 = 76
        score.Should().BeApproximately(76.0, 0.5);
    }

    [Fact]
    public async Task Many_Critical_Alerts_Should_Be_Clamped_To_Zero_Minimum()
    {
        var deviceId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Devices.AddAsync(CreateDevice(deviceId, DeviceStatus.Offline));
            // 5 条 Critical 活跃告警，扣分远超 100
            for (var i = 0; i < 5; i++)
            {
                await ctx.Alerts.AddAsync(new Alert
                {
                    DeviceId = deviceId,
                    TenantId = Guid.Empty,
                    Severity = AlertSeverity.Critical,
                    Status = AlertStatus.Active,
                    Metric = "m",
                    Message = "test",
                    OccurredAt = DateTime.UtcNow.AddDays(-1),
                });
            }
            await ctx.SaveChangesAsync();
        });

        var score = await svc.CalculateHealthScoreAsync(deviceId);

        score.Should().NotBeNull();
        score.Should().BeGreaterThanOrEqualTo(0);
        score.Should().BeLessOrEqualTo(50); // 严重故障应进入 Critical 区间
    }

    [Fact]
    public async Task Nonexistent_Device_Should_Return_Null()
    {
        var (db, svc) = await CreateAsync();
        var score = await svc.CalculateHealthScoreAsync(Guid.NewGuid());
        score.Should().BeNull();
    }

    [Fact]
    public async Task UpdateHealthScore_Should_Persist_To_Db()
    {
        var deviceId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Devices.AddAsync(CreateDevice(deviceId, DeviceStatus.Online));
            await ctx.SaveChangesAsync();
        });

        await svc.UpdateHealthScoreAsync(deviceId);

        var stored = await db.Devices.Where(d => d.Id == deviceId).Select(d => d.HealthScore).FirstAsync();
        stored.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Alerts_Outside_Window_Should_Not_Count()
    {
        var deviceId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Devices.AddAsync(CreateDevice(deviceId, DeviceStatus.Online));
            // 8 天前的告警（超出 7 天评估窗口）
            await ctx.Alerts.AddAsync(new Alert
            {
                DeviceId = deviceId,
                TenantId = Guid.Empty,
                Severity = AlertSeverity.Critical,
                Status = AlertStatus.Active,
                Metric = "m",
                Message = "old",
                OccurredAt = DateTime.UtcNow.AddDays(-8),
            });
            await ctx.SaveChangesAsync();
        });

        var score = await svc.CalculateHealthScoreAsync(deviceId);
        // 窗口外告警不计，分数应与无告警一致（91）
        score.Should().BeApproximately(91.0, 0.5);
    }
}
