using EquipAI.Application.Evaluation;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Evaluation;

/// <summary>
/// EvaluationService 单元测试
///
/// 该服务对比模拟器上报的标准答案（ground truth）与 analyses 表的实际 AI 诊断，
/// 计算命中率。核心测试维度：
///
/// - IngestReportAsync 批次去重（防重复上报）
/// - EvaluateAsync 漏报/命中/误诊 三态判定
/// - 10 分钟匹配时间窗的边界（窗口内/外）
/// - 6 种故障类型关键词映射（轴承/润滑/气阀/过载/堵塞/传感器）
/// - DateTime.Kind.Unspecified 安全转换（PG timestamptz 兼容）
/// </summary>
public class EvaluationServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly Guid _tenantId = Guid.NewGuid();

    public EvaluationServiceTests()
    {
        var dbName = $"EvalTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _sp = services.BuildServiceProvider();
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();

    private AppDbContext GetDb() => _sp.GetRequiredService<AppDbContext>();

    private EvaluationService CreateService(AppDbContext db)
    {
        var logger = _sp.GetRequiredService<ILogger<EvaluationService>>();
        return new EvaluationService(db, logger);
    }

    /// <summary>
    /// 构造一份标准测试用的 GroundTruthReport
    /// </summary>
    private static GroundTruthReport CreateReport(Guid deviceId, string runId, DateTime injectedAt,
        string faultType = "bearing_wear", string expectedRootCause = "轴承磨损")
        => new()
        {
            RunId = runId,
            DeviceId = deviceId,
            DeviceCode = "AC-001",
            ScenarioName = "test-scenario",
            Events = new List<GroundTruthEventReport>
            {
                new()
                {
                    FaultType = faultType,
                    ExpectedRootCause = expectedRootCause,
                    ExpectedSeverity = "high",
                    AffectedMetrics = new List<string> { "vibration" },
                    InjectedAt = injectedAt,
                }
            }
        };

    /// <summary>
    /// 构造一条 Analysis 记录（模拟 AI 诊断结果）
    /// 注意：用完全限定名 EquipAI.Core.Entities.Analysis，因为 Evaluation 命名空间下
    /// 可能存在名为 Analysis 的子命名空间导致解析歧义
    /// </summary>
    private static EquipAI.Core.Entities.Analysis CreateAnalysis(Guid deviceId, Guid tenantId, DateTime createdAt,
        string rootCause, double confidence = 0.9, AnalysisLevel level = AnalysisLevel.L2)
        => new()
        {
            DeviceId = deviceId,
            TenantId = tenantId,
            AlertId = Guid.NewGuid(),
            Level = level,
            Status = AnalysisStatus.Completed,
            Confidence = confidence,
            RootCause = rootCause,
            CreatedAt = createdAt,
        };

    // =========================================================================
    // IngestReportAsync — 标准答案上报
    // =========================================================================

    /// <summary>
    /// 首次上报应写入所有事件，返回写入条数
    /// </summary>
    [Fact]
    public async Task IngestReportAsync_首次上报_写入所有事件_返回条数()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();
        var report = CreateReport(deviceId, "run-001", DateTime.UtcNow);
        report.Events.Add(new GroundTruthEventReport
        {
            FaultType = "overload",
            ExpectedRootCause = "过载",
            ExpectedSeverity = "critical",
            AffectedMetrics = new List<string> { "current" },
            InjectedAt = DateTime.UtcNow,
        });

        var count = await service.IngestReportAsync(report, _tenantId);

        count.Should().Be(2, "首次上报应返回写入的事件数");
        var entries = await db.GroundTruthEntries.IgnoreQueryFilters().ToListAsync();
        entries.Should().HaveCount(2);
        entries.Should().AllSatisfy(e =>
        {
            e.RunId.Should().Be("run-001");
            e.TenantId.Should().Be(_tenantId);
        });
    }

    /// <summary>
    /// 相同 runId 二次上报应跳过，避免模拟器重复发请求导致数据膨胀
    /// </summary>
    [Fact]
    public async Task IngestReportAsync_相同RunId_二次上报_跳过_返回零()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();
        var report = CreateReport(deviceId, "run-dup", DateTime.UtcNow);

        // 首次
        var first = await service.IngestReportAsync(report, _tenantId);
        first.Should().Be(1);

        // 二次相同 runId
        var second = await service.IngestReportAsync(report, _tenantId);
        second.Should().Be(0, "相同 runId 不应重复写入");

        var entries = await db.GroundTruthEntries.IgnoreQueryFilters().ToListAsync();
        entries.Should().HaveCount(1, "去重后仍只有 1 条");
    }

    // =========================================================================
    // EvaluateAsync — 漏报（无 analysis）
    // =========================================================================

    /// <summary>
    /// 漏报场景：ground truth 存在但 analyses 表中无对应记录
    ///
    /// 业务意义：AI 没响应（如 LLM API 不可用、规则未匹配、ML 模型未训练），
    /// 这是评估 AI 诊断覆盖率的关键指标
    /// </summary>
    [Fact]
    public async Task EvaluateAsync_无Analysis记录_判定为漏报()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();
        await service.IngestReportAsync(CreateReport(deviceId, "run-miss", DateTime.UtcNow), _tenantId);

        // 不创建任何 analysis
        var result = await service.EvaluateAsync("run-miss", _tenantId);

        result.TotalFaults.Should().Be(1);
        result.MissedCount.Should().Be(1, "无 analysis 应记为漏报（Matched=null）");
        result.MatchedCount.Should().Be(0);
        result.MismatchedCount.Should().Be(0);
        result.Details.Should().ContainSingle(d => d.Matched == null);
    }

    // =========================================================================
    // EvaluateAsync — 命中（关键词匹配）
    // =========================================================================

    /// <summary>
    /// 命中场景：analysis 的 RootCause 包含预期根因的核心关键词
    ///
    /// 关键词映射：expected "轴承磨损" → keywords ["轴承","磨损"]
    /// 任何关键词出现在 AI 诊断中都算命中（容忍 AI 用词差异）
    /// </summary>
    [Fact]
    public async Task EvaluateAsync_Analysis包含核心关键词_判定为命中()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();
        var injectTime = DateTime.UtcNow.AddMinutes(-5);

        // 注入故障
        await service.IngestReportAsync(CreateReport(deviceId, "run-hit", injectTime,
            expectedRootCause: "轴承磨损"), _tenantId);

        // 模拟 AI 诊断 — 含关键词 "轴承"
        db.Analyses.Add(CreateAnalysis(deviceId, _tenantId, injectTime.AddMinutes(2),
            rootCause: "设备振动异常，疑似轴承故障，建议停机检查"));
        await db.SaveChangesAsync();

        var result = await service.EvaluateAsync("run-hit", _tenantId);

        result.MatchedCount.Should().Be(1, "AI 诊断含'轴承'应判定为命中");
        result.MismatchedCount.Should().Be(0);
        result.MissedCount.Should().Be(0);
        result.HitRate.Should().Be(1.0);
        result.Details.Single().Matched.Should().BeTrue();
    }

    /// <summary>
    /// 误诊场景：analysis 存在但 RootCause 不含任何核心关键词
    ///
    /// 业务意义：AI 有响应但诊断方向错了（如本应诊断"轴承"却诊断为"润滑"），
    /// 这是评估 AI 诊断质量（不仅是覆盖率）的关键指标
    /// </summary>
    [Fact]
    public async Task EvaluateAsync_Analysis不含关键词_判定为误诊()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();
        var injectTime = DateTime.UtcNow.AddMinutes(-5);

        await service.IngestReportAsync(CreateReport(deviceId, "run-mis", injectTime,
            expectedRootCause: "轴承磨损"), _tenantId);

        // AI 诊断完全不相关 — 既不含"轴承"也不含"磨损"
        db.Analyses.Add(CreateAnalysis(deviceId, _tenantId, injectTime.AddMinutes(2),
            rootCause: "环境温度过高，建议加强通风"));
        await db.SaveChangesAsync();

        var result = await service.EvaluateAsync("run-mis", _tenantId);

        result.MismatchedCount.Should().Be(1, "AI 有响应但诊断不匹配应记为误诊（Matched=false）");
        result.MatchedCount.Should().Be(0);
        result.MissedCount.Should().Be(0);
        result.Details.Single().Matched.Should().BeFalse();
    }

    /// <summary>
    /// 空 RootCause 应判定为误诊（不算漏报，因为 analysis 存在）
    /// </summary>
    [Fact]
    public async Task EvaluateAsync_Analysis空RootCause_判定为误诊()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();
        var injectTime = DateTime.UtcNow.AddMinutes(-5);

        await service.IngestReportAsync(CreateReport(deviceId, "run-empty", injectTime), _tenantId);

        db.Analyses.Add(CreateAnalysis(deviceId, _tenantId, injectTime.AddMinutes(1),
            rootCause: ""));  // 空 RootCause
        await db.SaveChangesAsync();

        var result = await service.EvaluateAsync("run-empty", _tenantId);

        result.MismatchedCount.Should().Be(1, "analysis 存在但 RootCause 空应判定为误诊而非漏报");
        result.MissedCount.Should().Be(0);
    }

    // =========================================================================
    // 时间窗边界 — 10 分钟窗口的包含/排除
    // =========================================================================

    /// <summary>
    /// 边界场景：analysis 时间恰在 10 分钟窗口内（如 9 分 59 秒后）
    ///
    /// Why：模拟器和 AI 评估之间有时延（如 LLM 调用 5-10 秒 + 规则匹配 1 秒），
    /// 10 分钟窗口是经验值。窗口太窄会漏算正常 AI 响应，太宽会把后续无关分析也算进去。
    /// </summary>
    [Fact]
    public async Task EvaluateAsync_Analysis在10分钟窗口内_匹配()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();
        var injectTime = DateTime.UtcNow.AddMinutes(-30);

        await service.IngestReportAsync(CreateReport(deviceId, "run-in-window", injectTime), _tenantId);

        // analysis 在故障注入后 9 分钟（窗口内）
        db.Analyses.Add(CreateAnalysis(deviceId, _tenantId, injectTime.AddMinutes(9),
            rootCause: "轴承故障"));
        await db.SaveChangesAsync();

        var result = await service.EvaluateAsync("run-in-window", _tenantId);

        result.MatchedCount.Should().Be(1, "analysis 在 10 分钟窗口内应匹配");
        result.MissedCount.Should().Be(0);
    }

    /// <summary>
    /// 边界场景：analysis 时间在 10 分钟窗口外（如 11 分钟后）
    ///
    /// Why：锁定窗口外的 analysis 不被错误地匹配到该 ground truth。
    /// 如果窗口逻辑失效，所有历史 analysis 都会被算作命中，命中率虚高。
    /// </summary>
    [Fact]
    public async Task EvaluateAsync_Analysis在10分钟窗口外_不匹配_判定为漏报()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();
        var injectTime = DateTime.UtcNow.AddMinutes(-30);

        await service.IngestReportAsync(CreateReport(deviceId, "run-out-window", injectTime), _tenantId);

        // analysis 在故障注入后 11 分钟（窗口外）
        db.Analyses.Add(CreateAnalysis(deviceId, _tenantId, injectTime.AddMinutes(11),
            rootCause: "轴承故障"));
        await db.SaveChangesAsync();

        var result = await service.EvaluateAsync("run-out-window", _tenantId);

        result.MissedCount.Should().Be(1, "窗口外的 analysis 不应匹配，应记为漏报");
        result.MatchedCount.Should().Be(0);
    }

    // =========================================================================
    // 关键词映射 — 6 种故障类型的核心关键词覆盖
    // =========================================================================

    /// <summary>
    /// 数据驱动测试：覆盖 6 种故障类型的关键词映射
    ///
    /// 模拟器剧本与关键词映射必须对齐，否则即使 AI 诊断正确也会被判误诊。
    /// 此测试用 Theory 锁定每种故障的预期关键词集合。
    /// </summary>
    [Theory]
    [InlineData("轴承磨损", "设备轴承需要更换")]            // 关键词：轴承
    [InlineData("轴承磨损", "明显磨损现象")]                // 关键词：磨损
    [InlineData("润滑", "润滑油位不足")]                    // 关键词：润滑
    [InlineData("润滑", "油泵故障")]                        // 关键词：油泵
    [InlineData("气阀泄漏", "阀片密封失效")]                // 关键词：阀片/密封
    [InlineData("气阀泄漏", "管路泄漏")]                    // 关键词：泄漏
    [InlineData("过载", "电机负载过高")]                    // 关键词：负载
    [InlineData("过载", "电流超出额定值")]                  // 关键词：电流
    [InlineData("排气系统堵塞", "过滤器堵塞")]              // 关键词：过滤器/堵塞
    [InlineData("排气系统堵塞", "排气不畅")]                // 关键词：排气
    [InlineData("传感器漂移", "传感器读数异常")]            // 关键词：传感器
    [InlineData("传感器漂移", "需要校准")]                  // 关键词：校准
    public async Task EvaluateAsync_各种故障类型_关键词映射正确_判定为命中(
        string expectedRootCause, string aiDiagnosis)
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();
        var injectTime = DateTime.UtcNow.AddMinutes(-5);

        await service.IngestReportAsync(CreateReport(deviceId, $"run-{Guid.NewGuid():N}", injectTime,
            expectedRootCause: expectedRootCause), _tenantId);

        db.Analyses.Add(CreateAnalysis(deviceId, _tenantId, injectTime.AddMinutes(1),
            rootCause: aiDiagnosis));
        await db.SaveChangesAsync();

        // 用空 runId 让 EvaluateAsync 查询所有 truth（每个测试只播种一条）
        var result = await service.EvaluateAsync(null, _tenantId);

        result.MatchedCount.Should().Be(1,
            $"expected '{expectedRootCause}' 应与 AI 诊断 '{aiDiagnosis}' 通过关键词映射命中");
    }

    // =========================================================================
    // DateTime.Kind 转换 — PG timestamptz 兼容
    // =========================================================================

    /// <summary>
    /// 关键不变量：InjectedAt 反序列化后 Kind 可能是 Unspecified，
    /// EvaluationService 用 DateTime.SpecifyKind(...Utc) 转换避免 PG timestamptz 报错
    ///
    /// 此测试不直接验证 Kind 转换（InMemory DB 不强制），但通过端到端流程
    /// 确认 Unspecified Kind 不会破坏查询。生产环境 PG 才会真正暴露此问题。
    /// </summary>
    [Fact]
    public async Task EvaluateAsync_InjectedAt为UnspecifiedKind_不应破坏查询()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();

        // 构造 Unspecified Kind 的 InjectedAt（模拟 JSON 反序列化结果）
        var unspecifiedTime = new DateTime(2026, 6, 23, 10, 0, 0, DateTimeKind.Unspecified);
        await service.IngestReportAsync(CreateReport(deviceId, "run-unspecified", unspecifiedTime), _tenantId);

        // analysis 时间与 InjectedAt 相同（窗口内）
        db.Analyses.Add(CreateAnalysis(deviceId, _tenantId, unspecifiedTime.AddMinutes(1),
            rootCause: "轴承故障"));
        await db.SaveChangesAsync();

        var act = async () => await service.EvaluateAsync("run-unspecified", _tenantId);
        await act.Should().NotThrowAsync("Unspecified Kind 不应让查询抛异常");

        var result = await service.EvaluateAsync("run-unspecified", _tenantId);
        result.MatchedCount.Should().Be(1, "时间应正确比较，analysis 在窗口内");
    }

    // =========================================================================
    // 多故障类型聚合 — ByFaultType 字典按类型统计
    // =========================================================================

    /// <summary>
    /// 多故障场景：3 条 ground truth（2 命中 + 1 漏报）按类型应正确聚合
    ///
    /// Why：评估报告里的"按故障类型命中率"是改进 AI 模型的主要依据
    /// （如发现"润滑"类命中率低，优先补充润滑相关规则）
    /// </summary>
    [Fact]
    public async Task EvaluateAsync_多故障混合_按类型正确聚合()
    {
        var db = GetDb();
        var service = CreateService(db);
        var deviceId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        // 3 条 ground truth：2 轴承磨损 + 1 过载
        var report = new GroundTruthReport
        {
            RunId = "run-multi",
            DeviceId = deviceId,
            DeviceCode = "AC-001",
            ScenarioName = "multi-test",
            Events = new List<GroundTruthEventReport>
            {
                new() { FaultType = "bearing_wear", ExpectedRootCause = "轴承磨损",
                    ExpectedSeverity = "high", AffectedMetrics = [], InjectedAt = now.AddMinutes(-10) },
                new() { FaultType = "bearing_wear", ExpectedRootCause = "轴承磨损",
                    ExpectedSeverity = "high", AffectedMetrics = [], InjectedAt = now.AddMinutes(-8) },
                new() { FaultType = "overload", ExpectedRootCause = "过载",
                    ExpectedSeverity = "critical", AffectedMetrics = [], InjectedAt = now.AddMinutes(-5) },
            }
        };
        await service.IngestReportAsync(report, _tenantId);

        // 为前 2 条故障（轴承磨损）创建 analysis（命中），第 3 条（过载）不创建（漏报）
        db.Analyses.Add(CreateAnalysis(deviceId, _tenantId, now.AddMinutes(-9), "轴承故障"));
        db.Analyses.Add(CreateAnalysis(deviceId, _tenantId, now.AddMinutes(-7), "轴承需要更换"));
        await db.SaveChangesAsync();

        var result = await service.EvaluateAsync("run-multi", _tenantId);

        result.TotalFaults.Should().Be(3);
        result.MatchedCount.Should().Be(2);
        result.MissedCount.Should().Be(1);

        // ByFaultType 聚合：bearing_wear 2/2 命中，overload 0/1 漏报
        var bearing = result.ByFaultType.Single(s => s.FaultType == "bearing_wear");
        bearing.Total.Should().Be(2);
        bearing.Hit.Should().Be(2);
        bearing.Missed.Should().Be(0);

        var overload = result.ByFaultType.Single(s => s.FaultType == "overload");
        overload.Total.Should().Be(1);
        overload.Hit.Should().Be(0);
        overload.Missed.Should().Be(1);
    }

    // =========================================================================
    // 测试辅助类
    // =========================================================================

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
