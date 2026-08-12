using AutoMapper;
using EquipAI.Application.Alerts;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.Mapping;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// 告警查询与状态变更服务单元测试，验证告警数据和状态命令的显式租户边界。
/// </summary>
public sealed class AlertQueryServiceTests
{
    [Fact]
    public async Task ListAsync_上下文租户与服务租户不一致_不应返回告警()
    {
        // Arrange：故意让 DbContext 的过滤器租户与服务租户不一致，验证显式业务谓词优先。
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        db.Alerts.Add(CreateAlert(contextTenantId));
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId, out _);

        // Act
        var result = await service.ListAsync(new PagedQuery { Page = 1, PageSize = 20 });

        // Assert：旧实现会返回全局过滤器命中的上下文租户告警。
        result.Items.Should().BeEmpty("告警列表必须显式绑定当前租户");
    }

    [Fact]
    public async Task GetAsync_其他租户告警_应返回null()
    {
        // Arrange：实体已被当前上下文跟踪，复现 FindAsync 命中其他租户告警的路径。
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        var alert = CreateAlert(contextTenantId);
        db.Alerts.Add(alert);
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId, out _);

        // Act
        var result = await service.GetAsync(alert.Id);

        // Assert
        result.Should().BeNull("当前租户不得读取其他租户的告警详情");
    }

    [Fact]
    public async Task AcknowledgeAsync_其他租户告警_应返回不存在且不改变状态()
    {
        // Arrange
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        var alert = CreateAlert(contextTenantId);
        db.Alerts.Add(alert);
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId, out var eventBus);

        // Act
        var (result, error) = await service.AcknowledgeAsync(alert.Id, "越权确认");

        // Assert：越权命令按不存在处理，不能改变状态或发布事件。
        result.Should().BeNull();
        error.Should().Be("告警不存在");
        var persisted = await db.Alerts.IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(a => a.Id == alert.Id);
        persisted.Status.Should().Be(AlertStatus.Active);
        eventBus.Verify(
            e => e.PublishAsync(
                It.IsAny<AlertAcknowledgedEvent>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ResolveAsync_其他租户告警_应返回不存在且不改变状态()
    {
        // Arrange
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        var alert = CreateAlert(contextTenantId);
        db.Alerts.Add(alert);
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId, out var eventBus);

        // Act
        var (result, error) = await service.ResolveAsync(alert.Id, "越权解决");

        // Assert：越权命令按不存在处理，不能改变状态或发布事件。
        result.Should().BeNull();
        error.Should().Be("告警不存在");
        var persisted = await db.Alerts.IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(a => a.Id == alert.Id);
        persisted.Status.Should().Be(AlertStatus.Active);
        eventBus.Verify(
            e => e.PublishAsync(
                It.IsAny<AlertResolvedEvent>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static AppDbContext CreateDb(out Guid tenantId)
    {
        tenantId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"AlertQueryService_{Guid.NewGuid()}")
            .Options;
        return new AppDbContext(options, new FixedTenantContext(tenantId));
    }

    private static AlertQueryService CreateService(
        AppDbContext db,
        Guid tenantId,
        out Mock<IEventBus> eventBus)
    {
        var mapperConfiguration = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            NullLoggerFactory.Instance);
        var mapper = mapperConfiguration.CreateMapper();
        eventBus = new Mock<IEventBus>();
        eventBus
            .Setup(e => e.PublishAsync(
                It.IsAny<AlertAcknowledgedEvent>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        eventBus
            .Setup(e => e.PublishAsync(
                It.IsAny<AlertResolvedEvent>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new AlertQueryService(
            db,
            mapper,
            new FixedTenantContext(tenantId),
            eventBus.Object);
    }

    private static Alert CreateAlert(Guid tenantId)
        => new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            AlertCode = $"ALT-{Guid.NewGuid():N}",
            DeviceId = Guid.NewGuid(),
            Severity = AlertSeverity.High,
            Status = AlertStatus.Active,
            Metric = "temperature",
            Value = 95m,
            Threshold = 90m,
            OccurredAt = DateTime.UtcNow,
        };

    /// <summary>
    /// 固定租户上下文，用于验证服务显式租户谓词不依赖 DbContext 的过滤器状态。
    /// </summary>
    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode { get; } = "Shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
