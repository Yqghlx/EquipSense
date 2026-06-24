using AutoMapper;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// AlertsController 单元测试
/// 重点验证告警确认/解决操作的审计字段（AcknowledgedBy/ResolvedBy）记录的是操作用户 ID 而非租户 ID。
/// 回归：原实现写入 _tenantContext.TenantId（全租户共享同一 GUID），导致审计追溯完全失效。
/// </summary>
public class AlertsControllerTests
{
    private readonly Guid _tenantId = Guid.NewGuid();
    // 故意与租户 ID 不同，便于断言区分「写成了用户 ID」还是「误写成了租户 ID」
    private readonly Guid _userId = Guid.NewGuid();

    /// <summary>
    /// 构造测试用 DbContext + AlertsController，并 seed 一个 Active 告警
    /// </summary>
    private static async Task<(AppDbContext db, AlertsController controller)> CreateSutAsync(
        Guid tenantId, Guid userId, Alert alert)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"AlertCtrl_{Guid.NewGuid()}")
            .Options;
        var db = new AppDbContext(options, new FixedTenantContext(tenantId, userId));
        db.Alerts.Add(alert);
        await db.SaveChangesAsync();

        // Acknowledge/Resolve 末尾调用 _mapper.Map&lt;AlertDto&gt;，mock 返回空 DTO 即可
        var mapperMock = new Mock<IMapper>();
        mapperMock.Setup(m => m.Map<AlertDto>(It.IsAny<Alert>())).Returns(new AlertDto());
        // DataExportService 仅在导出端点使用，确认/解决路径不调用它，传入真实实例即可（构造仅需 db）
        var exportService = new DataExportService(db);

        var controller = new AlertsController(db, mapperMock.Object, new FixedTenantContext(tenantId, userId), exportService);
        return (db, controller);
    }

    /// <summary>
    /// 构造一个 Active 状态的告警（满足 Acknowledge/Resolve 的前置状态校验）
    /// </summary>
    private Alert MakeAlert(Guid id, Guid tenantId) => new()
    {
        Id = id,
        TenantId = tenantId,
        AlertCode = "AL-TEST-001",
        DeviceId = Guid.NewGuid(),
        Severity = AlertSeverity.High,
        Status = AlertStatus.Active,
        Metric = "temperature",
        Value = 95m
    };

    [Fact]
    public async Task AcknowledgeAlert_应记录操作用户ID而非租户ID()
    {
        var alertId = Guid.NewGuid();
        var (db, controller) = await CreateSutAsync(_tenantId, _userId, MakeAlert(alertId, _tenantId));

        await controller.AcknowledgeAlert(alertId, null);

        var updated = await db.Alerts.FindAsync(alertId);
        updated.Should().NotBeNull();
        // 确认人必须记录操作用户 ID。原实现写 _tenantContext.TenantId（全租户共享同一 GUID），
        // 致审计「谁确认了这条 Critical 告警」无法回答——与 WorkOrdersController 一致地用 UserId
        updated!.AcknowledgedBy.Should().Be(_userId, "确认人应记录操作用户 ID");
        updated.AcknowledgedBy.Should().NotBe(_tenantId, "记录租户 ID 会使全租户所有确认操作归因到同一 GUID，审计追溯失效");
    }

    [Fact]
    public async Task ResolveAlert_应记录操作用户ID而非租户ID()
    {
        var alertId = Guid.NewGuid();
        var (db, controller) = await CreateSutAsync(_tenantId, _userId, MakeAlert(alertId, _tenantId));

        await controller.ResolveAlert(alertId, new ResolveAlertRequest { Resolution = "已更换传感器" });

        var updated = await db.Alerts.FindAsync(alertId);
        updated.Should().NotBeNull();
        // 解决人必须记录操作用户 ID（与 Acknowledge 对称）
        updated!.ResolvedBy.Should().Be(_userId, "解决人应记录操作用户 ID");
        updated.ResolvedBy.Should().NotBe(_tenantId, "记录租户 ID 会使全租户所有解决操作归因到同一 GUID，审计追溯失效");
    }

    /// <summary>
    /// 固定 TenantId/UserId 的测试替身（UserId 可控，区别于 WorkOrderServiceTests 的随机 UserId）
    /// </summary>
    private class FixedTenantContext : ITenantContext
    {
        public FixedTenantContext(Guid tenantId, Guid userId)
        {
            TenantId = tenantId;
            UserId = userId;
        }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; }
    }
}
