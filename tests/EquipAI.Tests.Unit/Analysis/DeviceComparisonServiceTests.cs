using System.Data.Common;
using System.Reflection;
using EquipAI.Application.Analysis;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// DeviceComparisonService 单元测试
///
/// 该服务对同类设备做横向对比，基于 Z-Score 异常检测发现"偏离群体均值 &gt; 2σ"的劣化设备。
/// 业务价值：当一群泵的振动平均值都是 5.0，唯独某台是 8.5，运维应优先检查这台
/// （即使它还没触发绝对阈值告警）。漏报会让运维错过早期劣化信号。
///
/// 测试维度：
/// 1. 同类设备不足 2 台 early return（无统计意义）
/// 2. 有遥测的设备不足 2 台 early return
/// 3. Z-Score 异常检测（|Z| &gt; 2 标记为异常）
/// 4. 标准差为 0 时防除零（所有设备值相同 → ZScore 全部为 0）
/// 5. 跨租户隔离（其他租户的设备不参与对比）
/// 6. 按偏离程度排序（异常设备排前面）
///
/// 注意：DeviceTelemetry 是 HasNoKey 实体，用 SQLite 内存 + ExecuteSqlRawAsync 绕过追踪器。
/// </summary>
public class DeviceComparisonServiceTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly SelectCommandCounter _selectCommandCounter = new();

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o
            .UseSqlite(_connection)
            .AddInterceptors(_selectCommandCounter));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _sp = services.BuildServiceProvider();

        using (var scope = _sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.EnsureCreatedAsync();
            // SQLite 启用外键约束，Device.TenantId 引用 tenants 表必须先植入
            db.Tenants.Add(new Tenant
            {
                Id = _tenantId,
                Name = "Test Tenant",
                Slug = "test-tenant",
                Plan = TenantPlan.Professional,
                Status = TenantStatus.Active,
                MaxDevices = 1000,
            });
            await db.SaveChangesAsync();
        }
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    private AppDbContext GetDb() => _sp.GetRequiredService<AppDbContext>();

    private DeviceComparisonService CreateService(AppDbContext db)
    {
        var logger = _sp.GetRequiredService<ILogger<DeviceComparisonService>>();
        return new DeviceComparisonService(db, logger);
    }

    /// <summary>
    /// 用原生 SQL 植入一条 DeviceTelemetry 记录
    /// （DeviceTelemetry 是 HasNoKey 实体，EF Core ChangeTracker 拒绝追踪）
    ///
    /// 注意：
    /// 1. tenant_id 必须是已存在的 Tenant.Id — SQLite EF Core provider 默认启用外键约束，
    ///    不匹配会让 INSERT 静默失败
    /// 2. 时间必须用 SpecifyKind(Utc) — provider 在写入时根据 Kind 决定存储格式，
    ///    Kind 不一致会让字符串比较错位，让"最近 N 小时"过滤失效
    /// </summary>
    private static async Task InsertTelemetryAsync(AppDbContext db, Guid tenantId, Guid deviceId,
        string metric, DateTime time, double value)
    {
        var utcTime = DateTime.SpecifyKind(time.ToUniversalTime(), DateTimeKind.Utc);

        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO device_telemetry (time, tenant_id, device_id, metric, value, quality, source) " +
            "VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
            utcTime, tenantId, deviceId,
            metric, value, "good", "test");
    }

    /// <summary>植入一台设备并返回其 Id（自动确保 Tenant 存在）</summary>
    private static async Task<Guid> SeedDeviceAsync(AppDbContext db, Guid tenantId,
        string deviceCode, string type, string name)
    {
        // SQLite 外键约束：Device.TenantId 必须先有对应 Tenant
        if (!await db.Tenants.AnyAsync(t => t.Id == tenantId))
        {
            db.Tenants.Add(new Tenant
            {
                Id = tenantId,
                Name = $"Tenant-{tenantId.ToString().Substring(0, 8)}",
                Slug = $"t-{tenantId.ToString().Substring(0, 8)}",
                Plan = TenantPlan.Professional,
                Status = TenantStatus.Active,
                MaxDevices = 1000,
            });
            await db.SaveChangesAsync();
        }

        var id = Guid.NewGuid();
        db.Devices.Add(new Device
        {
            Id = id,
            Name = name,
            Type = type,
            DeviceCode = deviceCode,
            TenantId = tenantId,
            Status = DeviceStatus.Online,
        });
        await db.SaveChangesAsync();
        return id;
    }

    /// <summary>
    /// 为设备植入 N 条等间隔遥测数据（最近 hours 小时，每小时一条，值恒定 = value）
    /// </summary>
    private static async Task SeedConstantTelemetryAsync(AppDbContext db, Guid tenantId, Guid deviceId,
        string metric, int hours, double value)
    {
        var now = DateTime.UtcNow;
        for (var i = 0; i < hours; i++)
        {
            await InsertTelemetryAsync(db, tenantId, deviceId, metric, now.AddHours(-i), value);
        }
    }

    // =========================================================================
    // Early return — 不足 2 台设备无统计意义
    // =========================================================================

    /// <summary>
    /// 同类型设备不足 2 台时返回"无法对比"提示
    ///
    /// Why：对比至少需要 2 个样本才能计算群体均值和标准差。
    /// 如果只有 1 台设备就计算 Z-Score，所有偏差都来自噪声，没有横向参考意义。
    /// </summary>
    [Fact]
    public async Task CompareAsync_同类设备不足2台_返回无法对比消息()
    {
        var db = GetDb();
        var service = CreateService(db);

        // 只植入 1 台设备
        await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "1# 空压机");

        var result = await service.CompareAsync(_tenantId, "air_compressor", "temperature");

        result.Devices.Should().BeEmpty("1 台设备无法做横向对比");
        result.Message.Should().Be("同类设备不足 2 台，无法对比");
        result.GroupMean.Should().Be(0, "未计算统计量");
    }

    /// <summary>服务层也必须拒绝无效时间窗口，防止绕过 HTTP 控制器后触发无界扫描。</summary>
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(8761)]
    public async Task CompareAsync_无效时间窗口_应拒绝(int hours)
    {
        var service = CreateService(GetDb());

        var act = () => service.CompareAsync(_tenantId, "air_compressor", "temperature", hours);

        await act.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }

    /// <summary>
    /// 未指定 deviceIds 时应保持现有"同类型全量对比"语义，避免新增可选参数后破坏旧调用方。
    /// </summary>
    [Fact]
    public async Task CompareAsync_未指定DeviceIds_保留同类型全量行为()
    {
        var db = GetDb();
        var service = CreateService(db);

        var d1 = await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "1#");
        var d2 = await SeedDeviceAsync(db, _tenantId, "AC-002", "air_compressor", "2#");
        var d3 = await SeedDeviceAsync(db, _tenantId, "AC-003", "air_compressor", "3#");
        await SeedDeviceAsync(db, _tenantId, "PM-001", "pump", "泵-1#");

        await SeedConstantTelemetryAsync(db, _tenantId, d1, "temperature", 4, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d2, "temperature", 4, 61.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d3, "temperature", 4, 62.0);

        var result = await CompareAsyncWithOptionalDeviceIds(service, "air_compressor", "temperature");

        result.Devices.Should().HaveCount(3, "不传 deviceIds 时应继续返回该类型全部设备");
        result.Devices.Should().OnlyContain(device => device.DeviceId == d1 || device.DeviceId == d2 || device.DeviceId == d3);
    }

    /// <summary>
    /// 指定 deviceIds 后应只返回被选择的同类型设备，避免页面勾选 2 台却混入未选设备。
    /// </summary>
    [Fact]
    public async Task CompareAsync_指定2个设备ID_仅返回选定设备()
    {
        var db = GetDb();
        var service = CreateService(db);

        var d1 = await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "1#");
        var d2 = await SeedDeviceAsync(db, _tenantId, "AC-002", "air_compressor", "2#");
        var d3 = await SeedDeviceAsync(db, _tenantId, "AC-003", "air_compressor", "3#");

        await SeedConstantTelemetryAsync(db, _tenantId, d1, "temperature", 4, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d2, "temperature", 4, 61.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d3, "temperature", 4, 62.0);

        var result = await CompareAsyncWithOptionalDeviceIds(
            service,
            "air_compressor",
            "temperature",
            deviceIds: [d1, d3]);

        result.Devices.Select(device => device.DeviceId)
            .Should()
            .BeEquivalentTo([d1, d3], "指定 deviceIds 后结果集应收缩为被勾选设备");
    }

    /// <summary>
    /// 同类型过滤仍是硬边界：即使调用方把其他类型设备 ID 一并传入，结果中也不能混入不同类型设备。
    /// </summary>
    [Fact]
    public async Task CompareAsync_指定列表包含其他类型设备_不会进入结果()
    {
        var db = GetDb();
        var service = CreateService(db);

        var d1 = await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "1#");
        var d2 = await SeedDeviceAsync(db, _tenantId, "AC-002", "air_compressor", "2#");
        var otherType = await SeedDeviceAsync(db, _tenantId, "PM-001", "pump", "泵-1#");

        await SeedConstantTelemetryAsync(db, _tenantId, d1, "temperature", 4, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d2, "temperature", 4, 61.0);
        await SeedConstantTelemetryAsync(db, _tenantId, otherType, "temperature", 4, 90.0);

        var result = await CompareAsyncWithOptionalDeviceIds(
            service,
            "air_compressor",
            "temperature",
            deviceIds: [d1, d2, otherType]);

        result.Devices.Select(device => device.DeviceId)
            .Should()
            .BeEquivalentTo([d1, d2], "不同类型设备即使被传入也不应进入 air_compressor 的对比结果");
    }

    /// <summary>
    /// 显式设备筛选也必须继续执行租户隔离，不能因为调用方传入了其他租户的同类型设备 ID 就越权读取。
    /// </summary>
    [Fact]
    public async Task CompareAsync_显式DeviceIds混入其他租户设备_只返回当前租户设备()
    {
        var db = GetDb();
        var service = CreateService(db);

        var currentDevice = await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "当前租户-1#");
        var currentDevice2 = await SeedDeviceAsync(db, _tenantId, "AC-002", "air_compressor", "当前租户-2#");
        var otherTenant = Guid.NewGuid();
        var otherTenantDevice = await SeedDeviceAsync(
            db,
            otherTenant,
            "AC-X1",
            "air_compressor",
            "其他租户-1#");

        await SeedConstantTelemetryAsync(db, _tenantId, currentDevice, "temperature", 4, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, currentDevice2, "temperature", 4, 61.0);
        await SeedConstantTelemetryAsync(db, otherTenant, otherTenantDevice, "temperature", 4, 200.0);

        var result = await CompareAsyncWithOptionalDeviceIds(
            service,
            "air_compressor",
            "temperature",
            deviceIds: [currentDevice, currentDevice2, otherTenantDevice]);

        result.Devices.Select(device => device.DeviceId)
            .Should()
            .BeEquivalentTo([currentDevice, currentDevice2], "显式筛选结果只能包含当前租户选中的设备")
            .And.NotContain(otherTenantDevice, "显式筛选不能读取其他租户的同类型设备");
    }

    /// <summary>
    /// 显式设备筛选至少需要 2 台且最多允许 5 台，否则前端筛选器和后端计算范围会失去意义。
    /// </summary>
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(6)]
    public async Task CompareAsync_DeviceIds数量越界_应抛出明确参数异常(int deviceCount)
    {
        var service = CreateService(GetDb());
        var deviceIds = Enumerable.Range(0, deviceCount).Select(_ => Guid.NewGuid()).ToArray();

        var act = () => CompareAsyncWithOptionalDeviceIds(
            service,
            "air_compressor",
            "temperature",
            deviceIds: deviceIds);

        var exception = await act.Should().ThrowAsync<ArgumentException>();
        exception.Which.ParamName.Should().Be("deviceIds");
    }

    /// <summary>
    /// 设备足够但无人上传遥测 → 返回"有遥测不足 2 台"
    ///
    /// Why：区分两种"无法对比"原因，便于运维判断是设备配置问题还是遥测链路问题。
    /// </summary>
    [Fact]
    public async Task CompareAsync_有遥测的设备不足2台_返回对应消息()
    {
        var db = GetDb();
        var service = CreateService(db);

        // 2 台设备，但只有 1 台有遥测
        var d1 = await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "1#");
        await SeedDeviceAsync(db, _tenantId, "AC-002", "air_compressor", "2#");
        await SeedConstantTelemetryAsync(db, _tenantId, d1, "temperature", 5, 60.0);

        var result = await service.CompareAsync(_tenantId, "air_compressor", "temperature");

        result.Message.Should().Be("有遥测数据的设备不足 2 台");
        result.Devices.Should().HaveCount(1, "1 台有数据的设备仍应返回摘要");
        result.GroupMean.Should().Be(0, "群体统计未计算");
    }

    // =========================================================================
    // Z-Score 异常检测 — 偏离均值 > 2σ 标记为异常
    // =========================================================================

    /// <summary>
    /// 关键场景：群体 5 台设备均值相似，1 台明显偏离 → 偏离设备标记为异常
    ///
    /// 数学约束：N 台设备中只有 1 台偏离时，其 Z-Score = (N-1)/sqrt(N)（可证）。
    /// N=5 时 Z ≈ 1.79（&lt; 2 不触发），N=6 时 Z ≈ 2.04（&gt; 2 触发）。
    /// 所以这里用 6 台（5 正常 + 1 严重偏离）构造，让 Z ≈ 2.24 严格大于阈值 2。
    /// </summary>
    [Fact]
    public async Task CompareAsync_偏离群体2σ的设备_标记为异常()
    {
        var db = GetDb();
        var service = CreateService(db);

        var d1 = await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "1#");
        var d2 = await SeedDeviceAsync(db, _tenantId, "AC-002", "air_compressor", "2#");
        var d3 = await SeedDeviceAsync(db, _tenantId, "AC-003", "air_compressor", "3#");
        var d4 = await SeedDeviceAsync(db, _tenantId, "AC-004", "air_compressor", "4#");
        var d5 = await SeedDeviceAsync(db, _tenantId, "AC-005", "air_compressor", "5#");
        var outlier = await SeedDeviceAsync(db, _tenantId, "AC-006", "air_compressor", "6#（疑似劣化）");

        // 5 台正常 + 1 台严重偏离
        await SeedConstantTelemetryAsync(db, _tenantId, d1, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d2, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d3, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d4, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d5, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, outlier, "temperature", 5, 100.0);

        var result = await service.CompareAsync(_tenantId, "air_compressor", "temperature");

        result.Message.Should().BeNull("对比成功");
        result.Devices.Should().HaveCount(6);
        // 5×60 + 1×100 = 400，μ = 400/6 ≈ 66.67
        result.GroupMean.Should().BeApproximately(66.67, 0.5);
        // σ = sqrt(((60-66.67)²×5 + (100-66.67)²)/6) = sqrt((222.2+1111.1)/6) ≈ 14.9
        result.GroupStdDev.Should().BeGreaterThan(13).And.BeLessThan(17);

        // 异常设备应排在首位，ZScore > 2，IsOutlier=true
        var top = result.Devices[0];
        top.DeviceId.Should().Be(outlier, "偏离最严重的应排在首位");
        top.ZScore.Should().BeGreaterThan(2.0, "Z = (100-66.67)/14.9 ≈ 2.24 > 2");
        top.IsOutlier.Should().BeTrue("ZScore > 2 应标记为异常");

        // 其他 5 台不应标记为异常
        var normalDevices = result.Devices.Skip(1).ToList();
        normalDevices.Should().AllSatisfy(d =>
        {
            d.IsOutlier.Should().BeFalse("正常设备不应被误判为异常");
            Math.Abs(d.ZScore).Should().BeLessThan(1, "正常设备的 Z-Score 应远离阈值 2");
        });
    }

    /// <summary>
    /// 所有设备值相同时，标准差为 0，ZScore 全部为 0，无异常
    ///
    /// Why：σ=0 时除法 (x-μ)/σ 会除零。生产代码用 groupStdDev &gt; 0.0001 守护此边界。
    /// 此测试锁定该守护行为，防止后续重构把守护条件改成错误的阈值。
    /// </summary>
    [Fact]
    public async Task CompareAsync_所有设备值相同_标准差为零_无异常()
    {
        var db = GetDb();
        var service = CreateService(db);

        var d1 = await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "1#");
        var d2 = await SeedDeviceAsync(db, _tenantId, "AC-002", "air_compressor", "2#");
        var d3 = await SeedDeviceAsync(db, _tenantId, "AC-003", "air_compressor", "3#");

        // 所有设备值都是 60.0
        await SeedConstantTelemetryAsync(db, _tenantId, d1, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d2, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d3, "temperature", 5, 60.0);

        var result = await service.CompareAsync(_tenantId, "air_compressor", "temperature");

        result.GroupStdDev.Should().BeApproximately(0, 0.001, "所有值相同时标准差为 0");
        result.Devices.Should().AllSatisfy(d =>
        {
            d.ZScore.Should().Be(0, "σ=0 时不应做除法，所有 ZScore 应为 0");
            d.IsOutlier.Should().BeFalse("无偏差时不应有异常");
        });
    }

    // =========================================================================
    // 时间窗口 — 只取最近 N 小时数据
    // =========================================================================

    /// <summary>
    /// 超出时间窗口的旧遥测不参与统计
    ///
    /// Why：用上周的数据对比今天的设备状态没意义。CompareAsync 默认取 24h，
    /// 应过滤掉更早的数据。如果时间过滤失效，会让"已修复"的设备仍被误判为异常。
    /// </summary>
    [Fact]
    public async Task CompareAsync_超出时间窗口的旧数据_不参与统计()
    {
        var db = GetDb();
        var service = CreateService(db);

        var d1 = await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "1#");
        var d2 = await SeedDeviceAsync(db, _tenantId, "AC-002", "air_compressor", "2#");

        // d1 最近 6h 是正常值 60，但 48h 前是异常值 90
        await SeedConstantTelemetryAsync(db, _tenantId, d1, "temperature", 6, 60.0);
        await InsertTelemetryAsync(db, _tenantId, d1, "temperature", DateTime.UtcNow.AddHours(-48), 90.0);

        // d2 最近 6h 也是 60
        await SeedConstantTelemetryAsync(db, _tenantId, d2, "temperature", 6, 60.0);

        // 只对比最近 24h → 旧数据被排除，两台设备均值相同，无异常
        var result = await service.CompareAsync(_tenantId, "air_compressor", "temperature", hours: 24);

        result.GroupMean.Should().BeApproximately(60, 0.1, "最近 24h 数据两台都是 60");
        result.GroupStdDev.Should().BeApproximately(0, 0.01);
        result.Devices.Should().AllSatisfy(d => d.IsOutlier.Should().BeFalse());
    }

    // =========================================================================
    // 跨租户隔离 — 多租户系统的核心不变量
    // =========================================================================

    /// <summary>
    /// 关键不变量：只对比当前租户的同类型设备，不串租户
    ///
    /// Why：A 租户的空压机和 B 租户的空压机不应放在一起对比（基线可能完全不同：
    /// A 是化工厂常年高温运行，B 是食品厂低温运行）。如果跨租户，结果毫无意义
    /// 且会泄露其他租户的设备数量信息。
    /// </summary>
    [Fact]
    public async Task CompareAsync_跨租户设备_不参与对比()
    {
        var db = GetDb();
        var service = CreateService(db);

        // 当前租户：2 台正常设备
        var d1 = await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "我的-1#");
        var d2 = await SeedDeviceAsync(db, _tenantId, "AC-002", "air_compressor", "我的-2#");
        await SeedConstantTelemetryAsync(db, _tenantId, d1, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d2, "temperature", 5, 60.0);

        // 其他租户：2 台异常设备（应被排除）
        var otherTenant = Guid.NewGuid();
        var d3 = await SeedDeviceAsync(db, otherTenant, "AC-X1", "air_compressor", "他人-1#");
        var d4 = await SeedDeviceAsync(db, otherTenant, "AC-X2", "air_compressor", "他人-2#");
        await SeedConstantTelemetryAsync(db, otherTenant, d3, "temperature", 5, 200.0);
        await SeedConstantTelemetryAsync(db, otherTenant, d4, "temperature", 5, 250.0);

        var result = await service.CompareAsync(_tenantId, "air_compressor", "temperature");

        result.Devices.Should().HaveCount(2, "应排除其他租户的设备");
        result.Devices.Should().OnlyContain(d => d.DeviceId == d1 || d.DeviceId == d2,
            "其他租户的设备 ID 不应出现在结果中");
        result.GroupMean.Should().BeApproximately(60, 0.1, "群体均值只来自当前租户的正常设备");
    }

    // =========================================================================
    // 排序 — 偏离程度大的排前面
    // =========================================================================

    /// <summary>
    /// 异常设备按 |ZScore| 降序排列
    ///
    /// Why：Dashboard 展示时运维优先看最严重的偏离，避免在一群正常设备中翻找异常。
    /// </summary>
    [Fact]
    public async Task CompareAsync_异常设备按偏离程度降序排列()
    {
        var db = GetDb();
        var service = CreateService(db);

        // 群体均值附近 3 台 + 2 台不同程度偏离
        var d1 = await SeedDeviceAsync(db, _tenantId, "AC-001", "air_compressor", "1#");
        var d2 = await SeedDeviceAsync(db, _tenantId, "AC-002", "air_compressor", "2#");
        var d3 = await SeedDeviceAsync(db, _tenantId, "AC-003", "air_compressor", "3#");
        var mild = await SeedDeviceAsync(db, _tenantId, "AC-M", "air_compressor", "轻度偏离");
        var severe = await SeedDeviceAsync(db, _tenantId, "AC-S", "air_compressor", "严重偏离");

        await SeedConstantTelemetryAsync(db, _tenantId, d1, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d2, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, d3, "temperature", 5, 60.0);
        await SeedConstantTelemetryAsync(db, _tenantId, mild, "temperature", 5, 70.0);    // 轻度偏离
        await SeedConstantTelemetryAsync(db, _tenantId, severe, "temperature", 5, 100.0); // 严重偏离

        var result = await service.CompareAsync(_tenantId, "air_compressor", "temperature");

        var zScores = result.Devices.Select(d => Math.Abs(d.ZScore)).ToList();
        zScores.Should().BeInDescendingOrder("偏离程度大的应排在前面");
        result.Devices[0].DeviceId.Should().Be(severe, "严重偏离的设备应排首位");
    }

    /// <summary>
    /// 对比查询应批量读取窗口内遥测，且最新值必须按时间而非数据库返回顺序确定。
    /// 旧实现每台设备单独查询一次，并直接取结果最后一行，设备数量增加会造成 N+1 查询且可能展示旧值。
    /// </summary>
    [Fact]
    public async Task CompareAsync_应批量读取遥测并按时间返回最新值()
    {
        var db = GetDb();
        var service = CreateService(db);
        var now = DateTime.UtcNow;
        var expectedLatest = new Dictionary<string, double>();

        for (var index = 1; index <= 3; index++)
        {
            var code = $"AC-{index:000}";
            var id = await SeedDeviceAsync(db, _tenantId, code, "air_compressor", $"{index}#");
            expectedLatest[code] = 70.0 + index;

            // 先插入较新的值，再插入旧值，专门验证不能用 ToList 后的最后一行冒充最新值。
            await InsertTelemetryAsync(db, _tenantId, id, "temperature", now.AddMinutes(-1), 70.0 + index);
            await InsertTelemetryAsync(db, _tenantId, id, "temperature", now.AddMinutes(-10), 10.0 + index);
        }

        _selectCommandCounter.Reset();
        var result = await service.CompareAsync(_tenantId, "air_compressor", "temperature");

        result.Devices.Should().HaveCount(3);
        result.Devices.Should().AllSatisfy(device =>
        {
            device.LatestValue.Should().BeApproximately(expectedLatest[device.DeviceCode], 0.01);
        });
        _selectCommandCounter.Count.Should().Be(2,
            "设备列表和窗口遥测应各执行一次查询，不能按设备逐个查询");
    }

    /// <summary>统计测试上下文执行的 SELECT 命令次数，防止批量分析退化为 N+1 查询。</summary>
    private sealed class SelectCommandCounter : DbCommandInterceptor
    {
        private int _count;

        public int Count => Volatile.Read(ref _count);

        public void Reset() => Interlocked.Exchange(ref _count, 0);

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            CountSelect(command);
            return result;
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            CountSelect(command);
            return ValueTask.FromResult(result);
        }

        private void CountSelect(DbCommand command)
        {
            if (command.CommandText.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
            {
                Interlocked.Increment(ref _count);
            }
        }
    }

    // =========================================================================
    // 测试辅助类
    // =========================================================================

    private async Task<DeviceComparisonResult> CompareAsyncWithOptionalDeviceIds(
        DeviceComparisonService service,
        string deviceType,
        string metric,
        int hours = 24,
        IReadOnlyCollection<Guid>? deviceIds = null,
        CancellationToken ct = default)
    {
        var method = typeof(DeviceComparisonService).GetMethod(
            nameof(DeviceComparisonService.CompareAsync),
            BindingFlags.Instance | BindingFlags.Public,
            binder: null,
            types:
            [
                typeof(Guid),
                typeof(string),
                typeof(string),
                typeof(int),
                typeof(IReadOnlyCollection<Guid>),
                typeof(CancellationToken)
            ],
            modifiers: null);

        if (method is null)
        {
            if (deviceIds is null)
            {
                return await service.CompareAsync(_tenantId, deviceType, metric, hours, ct);
            }

            throw new Xunit.Sdk.XunitException(
                "DeviceComparisonService.CompareAsync 尚未提供 deviceIds 参数签名，无法验证显式设备筛选契约。");
        }

        var invocation = method.Invoke(service, [_tenantId, deviceType, metric, hours, deviceIds, ct]);
        invocation.Should().BeAssignableTo<Task<DeviceComparisonResult>>();
        return await (Task<DeviceComparisonResult>)invocation!;
    }

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
