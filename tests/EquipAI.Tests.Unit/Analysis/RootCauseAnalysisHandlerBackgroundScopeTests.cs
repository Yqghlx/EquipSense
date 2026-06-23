using EquipAI.Application.Analysis.Handlers;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// RootCauseAnalysisHandler 在【后台事件处理器】场景（无 HttpContext）下的回归测试。
///
/// 生产链路：AlertTriggeredEvent 由后台事件管线消费，处理器内 <c>IServiceScopeFactory.CreateScope()</c>
/// 解析出的 <see cref="AppDbContext"/> 其 <see cref="ITenantContext"/> 走 DI 回退分支
/// （<c>ServiceCollectionExtensions</c> 的 <c>AddScoped&lt;ITenantContext&gt;</c> 末尾
/// <c>return new TenantContext(Guid.Empty, ...)</c>）→ <c>TenantId == Guid.Empty</c>。
/// 此时若用【默认查询过滤器】查基线，过滤器恒为 <c>TenantId == Guid.Empty</c>，查不到任何真实租户的基线，
/// baseline 恒为 null → 根因分析四级降级链中的 L3 统计分析永不触发，且 L1 LLM 诊断失去历史基线上下文
/// （<c>RootCauseAnalysisEngine.LLMDiagnosisAsync</c> 的 baselineInfo 恒为空）。
///
/// 关键：<b>InMemory provider 不强制 EF Core 全局查询过滤器</b>——既有测试
/// <c>HandleAsync_有基线数据时应传递给AnalysisService</c> 因此误绿（用未设 TenantId 的基线 + 非空租户
/// 上下文，过滤器本应排除却仍命中）。必须用 SQLite 复刻生产过滤行为才能抓到此 bug。
/// </summary>
public class RootCauseAnalysisHandlerBackgroundScopeTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();
    }

    public async Task DisposeAsync() => await _connection.DisposeAsync();

    /// <summary>
    /// 构造 AppDbContext，其 <see cref="ITenantContext"/> 复刻后台 scope 的 DI 回退：<c>TenantId == Guid.Empty</c>。
    /// 用 SQLite 而非 InMemory，确保 EF Core 全局租户查询过滤器被真实执行（生产 PG 行为）。
    /// </summary>
    private async Task<AppDbContext> CreateBackgroundDbContextAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        var db = new AppDbContext(options, new BackgroundTenantContext());
        await db.Database.EnsureCreatedAsync();
        return db;
    }

    /// <summary>
    /// 装配一个直接持有后台 DbContext 的处理器（跳过真实 DI，scope 工厂返回同一 DbContext）。
    /// </summary>
    private static RootCauseAnalysisHandler CreateHandler(
        AppDbContext db, Mock<IAnalysisService> analysisMock, Mock<IEventBus> eventBusMock)
    {
        var spMock = new Mock<IServiceProvider>();
        spMock.Setup(sp => sp.GetService(typeof(AppDbContext))).Returns(db);
        var scopeMock = new Mock<IServiceScope>();
        scopeMock.SetupGet(s => s.ServiceProvider).Returns(spMock.Object);
        var scopeFactoryMock = new Mock<IServiceScopeFactory>();
        scopeFactoryMock.Setup(f => f.CreateScope()).Returns(scopeMock.Object);

        return new RootCauseAnalysisHandler(
            LoggerFactory.Create(_ => { }).CreateLogger<RootCauseAnalysisHandler>(),
            analysisMock.Object, eventBusMock.Object, scopeFactoryMock.Object);
    }

    [Fact]
    public async Task HandleAsync_后台scope应按事件租户查到基线并传给分析引擎()
    {
        // 复刻生产后台 scope：DbContext 的 ITenantContext.TenantId == Guid.Empty（DI 回退）
        var db = await CreateBackgroundDbContextAsync();

        var tenantId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();

        // 真实租户的基线（生产中由 BaselineCalculationService 定期写入 metric_baselines）
        db.MetricBaselines.Add(new MetricBaseline
        {
            TenantId = tenantId, DeviceId = deviceId, Metric = "temperature",
            AvgValue = 45.0, StdDev = 5.0, SampleCount = 100,
            PeriodStart = DateTime.UtcNow.AddDays(-7), PeriodEnd = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var analysisMock = new Mock<IAnalysisService>();
        analysisMock.Setup(a => a.AnalyzeAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<double>(), It.IsAny<MetricBaseline?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Core.Entities.Analysis
            {
                TenantId = tenantId, AlertId = Guid.NewGuid(),
                Confidence = 0.8, RootCause = "x", Suggestion = "y", Level = AnalysisLevel.L3
            });

        var eventBusMock = new Mock<IEventBus>();
        eventBusMock
            .Setup(e => e.PublishAsync(It.IsAny<AnalysisCompletedEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var handler = CreateHandler(db, analysisMock, eventBusMock);

        var evt = new AlertTriggeredEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow, TenantId: tenantId,
            AlertId: Guid.NewGuid(), DeviceId: deviceId,
            RuleId: Guid.NewGuid(), Metric: "temperature", Value: 100.0, Severity: "High");

        // 处理器内部对 SaveChanges 异常有兜底（分析结果落库/候选规则生成可能因 FK 缺失抛错并被吞），
        // 但 AnalyzeAsync 的调用在落库之前发生，不受影响——这正是本用例要验证的关键点。
        var act = async () => await handler.HandleAsync(evt, CancellationToken.None);
        await act.Should().NotThrowAsync();

        // 关键回归断言：分析引擎应收到【非空】且 TenantId 正确的 baseline。
        // 修复前：后台 Guid.Empty 过滤器排除了真实租户基线 → 传 null → 本断言失败。
        analysisMock.Verify(a => a.AnalyzeAsync(
            tenantId, evt.AlertId, deviceId, "temperature", evt.Value,
            It.Is<MetricBaseline?>(b => b != null && b.TenantId == tenantId),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    /// <summary>复刻后台事件处理器中 <see cref="ITenantContext"/> 的 DI 回退：空租户上下文。</summary>
    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
