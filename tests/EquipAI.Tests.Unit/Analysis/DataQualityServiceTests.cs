using EquipAI.Application.Analysis;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

public class DataQualityServiceTests
{
    private readonly DataQualityService _service;

    public DataQualityServiceTests()
    {
        // 创建 InMemory 数据库的 ServiceProvider，通过 IServiceScopeFactory 注入
        var tenantContext = new TestTenantContext();
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase($"TestDataQuality_{Guid.NewGuid()}"));
        services.AddSingleton<EquipAI.Core.Interfaces.ITenantContext>(tenantContext);
        var serviceProvider = services.BuildServiceProvider();

        var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();
        var cache = new MemoryCache(new MemoryCacheOptions());
        var logger = LoggerFactory.Create(builder => { }).CreateLogger<DataQualityService>();

        _service = new DataQualityService(scopeFactory, cache, logger);
    }

    [Fact]
    public async Task CalculateScoreAsync_WithNoData_ReturnsNull()
    {
        // 无数据时返回 null（样本不足）
        var score = await _service.CalculateScoreAsync(
            Guid.NewGuid(), Guid.NewGuid(), "temperature");

        score.Should().BeNull();
    }

    [Fact]
    public async Task CalculateReportAsync_WithNoData_ReturnsNull()
    {
        var report = await _service.CalculateReportAsync(
            Guid.NewGuid(), Guid.NewGuid(), "temperature");

        report.Should().BeNull();
    }

    [Fact]
    public async Task CalculateOverviewAsync_WithNoData_ReturnsEmptyList()
    {
        var reports = await _service.CalculateOverviewAsync(
            Guid.NewGuid(), Guid.NewGuid());

        reports.Should().BeEmpty();
    }

    /// <summary>
    /// 测试用租户上下文，提供空的租户 ID
    /// </summary>
    private class TestTenantContext : EquipAI.Core.Interfaces.ITenantContext
    {
        public Guid TenantId { get; } = Guid.NewGuid();
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
