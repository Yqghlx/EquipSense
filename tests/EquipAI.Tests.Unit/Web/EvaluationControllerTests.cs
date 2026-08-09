using EquipAI.Application.Evaluation;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// EvaluationController 安全边界测试。
/// 评估标准答案只服务于开发/测试或显式配置的内部生产评估任务，不能保留公开匿名写入口。
/// </summary>
public class EvaluationControllerTests
{
    private static readonly Guid ConfiguredTenantId = Guid.NewGuid();
    private const string IngestionApiKey = "evaluation-ingestion-key-at-least-32-characters";

    [Fact]
    public async Task ReportGroundTruth_生产默认关闭_返回404()
    {
        await using var sut = CreateSut(
            environmentName: "Production",
            settings: new Dictionary<string, string?>());

        var result = await sut.Controller.ReportGroundTruth(CreateReport(), CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
        (await sut.Db.GroundTruthEntries.IgnoreQueryFilters().CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task ReportGroundTruth_生产启用但密钥错误_返回401()
    {
        await using var sut = CreateSut(
            environmentName: "Production",
            settings: new Dictionary<string, string?>
            {
                ["Evaluation:AllowGroundTruthIngestion"] = "true",
                ["Evaluation:IngestionApiKey"] = IngestionApiKey,
                ["Evaluation:TenantId"] = ConfiguredTenantId.ToString(),
            },
            requestApiKey: "wrong-key");

        var result = await sut.Controller.ReportGroundTruth(CreateReport(), CancellationToken.None);

        result.Should().BeOfType<UnauthorizedObjectResult>();
        (await sut.Db.GroundTruthEntries.IgnoreQueryFilters().CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task ReportGroundTruth_生产启用_使用服务端配置租户写入()
    {
        await using var sut = CreateSut(
            environmentName: "Production",
            settings: new Dictionary<string, string?>
            {
                ["Evaluation:AllowGroundTruthIngestion"] = "true",
                ["Evaluation:IngestionApiKey"] = IngestionApiKey,
                ["Evaluation:TenantId"] = ConfiguredTenantId.ToString(),
            },
            requestApiKey: IngestionApiKey,
            contextTenantId: Guid.NewGuid());

        var result = await sut.Controller.ReportGroundTruth(CreateReport(), CancellationToken.None);

        result.Should().BeOfType<OkObjectResult>();
        var entries = await sut.Db.GroundTruthEntries.IgnoreQueryFilters().ToListAsync();
        entries.Should().ContainSingle();
        entries[0].TenantId.Should().Be(ConfiguredTenantId);
    }

    private static GroundTruthReport CreateReport() => new()
    {
        RunId = "security-test-run",
        DeviceId = Guid.NewGuid(),
        DeviceCode = "TEST-001",
        ScenarioName = "security-test",
        Events =
        [
            new GroundTruthEventReport
            {
                FaultType = "bearing_wear",
                ExpectedRootCause = "轴承磨损",
                ExpectedSeverity = "high",
                AffectedMetrics = ["vibration"],
                InjectedAt = DateTime.UtcNow,
            }
        ],
    };

    private static Sut CreateSut(
        string environmentName,
        Dictionary<string, string?> settings,
        string? requestApiKey = null,
        Guid? contextTenantId = null)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
        var environment = new Mock<IHostEnvironment>();
        environment.SetupGet(e => e.EnvironmentName).Returns(environmentName);

        var tenantContext = new TestTenantContext(contextTenantId ?? Guid.Empty);
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"EvaluationController_{Guid.NewGuid():N}")
            .Options;
        var db = new AppDbContext(options, tenantContext);
        var service = new EvaluationService(db, NullLogger<EvaluationService>.Instance);
        var controller = new EvaluationController(service, tenantContext, configuration, environment.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext(),
            },
        };
        if (requestApiKey is not null)
        {
            controller.ControllerContext.HttpContext.Request.Headers["X-Evaluation-Api-Key"] = requestApiKey;
        }

        return new Sut(controller, db);
    }

    private sealed record Sut(EvaluationController Controller, AppDbContext Db) : IAsyncDisposable
    {
        public async ValueTask DisposeAsync() => await Db.DisposeAsync();
    }

    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Database";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
