using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit;

/// <summary>
/// AuditLogService 单元测试 — 验证审计日志的写入和分页查询
/// </summary>
public class AuditLogServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;

    public AuditLogServiceTests()
    {
        var dbName = $"AuditLogTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.NewGuid()));
        services.AddLogging();
        services.AddHttpContextAccessor();
        services.AddScoped<IAuditLogService, Application.Services.AuditLogService>();
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task LogAsync_应创建审计日志记录()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAuditLogService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        await service.LogAsync(tenantId, "Create", "Device", "dev-001", "创建设备");

        var logs = await db.UnfilteredSet<AuditLog>().Where(a => a.TenantId == tenantId).ToListAsync();
        logs.Should().HaveCount(1);
        logs[0].Action.Should().Be("Create");
        logs[0].ResourceType.Should().Be("Device");
        logs[0].ResourceId.Should().Be("dev-001");
        logs[0].Description.Should().Be("创建设备");
    }

    [Fact]
    public async Task LogAsync_未提供描述时应使用默认格式()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAuditLogService>();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        await service.LogAsync(tenantId, "Delete", "AlertRule", "rule-001");

        var logs = await db.UnfilteredSet<AuditLog>().Where(a => a.TenantId == tenantId).ToListAsync();
        logs.Should().HaveCount(1);
        logs[0].Description.Should().Be("Delete AlertRule");
    }

    [Fact]
    public async Task GetAuditLogsAsync_应返回分页结果()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAuditLogService>();
        var tenantId = Guid.NewGuid();

        for (int i = 0; i < 5; i++)
        {
            await service.LogAsync(tenantId, $"Action{i}", "Device");
        }

        var result = await service.GetAuditLogsAsync(tenantId, page: 1, pageSize: 3);
        result.Items.Should().HaveCount(3);
        result.Total.Should().Be(5);
        result.Page.Should().Be(1);
        result.PageSize.Should().Be(3);
    }

    [Fact]
    public async Task GetAuditLogsAsync_应只返回指定租户的日志()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IAuditLogService>();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        await service.LogAsync(tenantA, "Create", "Device");
        await service.LogAsync(tenantB, "Update", "Device");
        await service.LogAsync(tenantA, "Delete", "Device");

        var resultA = await service.GetAuditLogsAsync(tenantA);
        var resultB = await service.GetAuditLogsAsync(tenantB);

        resultA.Total.Should().Be(2);
        resultB.Total.Should().Be(1);
    }

    /// <summary>
    /// 测试用租户上下文 — 模拟 ITenantContext
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
