using AutoMapper;
using EquipAI.Application.Alerts;
using EquipAI.Application.Alerts.DTOs;
using EquipAI.Application.DTOs.Common;
using EquipAI.Application.Mapping;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// 告警规则服务单元测试，重点验证按租户显式定位规则，防止跟踪实体路径造成跨租户越权。
/// </summary>
public sealed class AlertRuleServiceTests
{
    [Fact]
    public async Task ListAsync_上下文租户与服务租户不一致_不应返回上下文租户规则()
    {
        // Arrange：故意让 DbContext 的过滤器租户与服务租户不一致，验证显式业务谓词优先。
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        db.AlertRules.Add(CreateRule(contextTenantId, "上下文租户规则"));
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId);

        // Act
        var result = await service.ListAsync(new PagedQuery { Page = 1, PageSize = 20 });

        // Assert：旧实现会返回全局过滤器命中的上下文租户规则。
        result.Items.Should().BeEmpty("规则列表必须显式绑定当前租户");
    }

    [Fact]
    public async Task GetAsync_其他租户规则_应返回null()
    {
        // Arrange：实体已被当前上下文跟踪，复现 FindAsync 命中其他租户规则的路径。
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        var rule = CreateRule(contextTenantId, "不可读取规则");
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId);

        // Act
        var result = await service.GetAsync(rule.Id);

        // Assert
        result.Should().BeNull("当前租户不得读取其他租户的告警规则");
    }

    [Fact]
    public async Task UpdateAsync_其他租户规则_应抛出KeyNotFoundException且保持原数据()
    {
        // Arrange
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        var rule = CreateRule(contextTenantId, "不可修改规则");
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId);

        // Act
        var act = () => service.UpdateAsync(
            rule.Id,
            new UpdateAlertRuleRequest { Name = "越权修改" });

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
        var persisted = await db.AlertRules.IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(r => r.Id == rule.Id);
        persisted.Name.Should().Be("不可修改规则");
    }

    [Fact]
    public async Task DeleteAsync_其他租户规则_应抛出KeyNotFoundException且保留原数据()
    {
        // Arrange
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        var rule = CreateRule(contextTenantId, "不可删除规则");
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId);

        // Act
        var act = () => service.DeleteAsync(rule.Id);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>();
        var exists = await db.AlertRules.IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(r => r.Id == rule.Id);
        exists.Should().BeTrue("其他租户规则不得被删除");
    }

    [Fact]
    public async Task ToggleAsync_其他租户规则_应返回null且保持启用状态()
    {
        // Arrange
        await using var db = CreateDb(out var contextTenantId);
        var serviceTenantId = Guid.NewGuid();
        var rule = CreateRule(contextTenantId, "不可停用规则");
        db.AlertRules.Add(rule);
        await db.SaveChangesAsync();
        var service = CreateService(db, serviceTenantId);

        // Act
        var result = await service.ToggleAsync(rule.Id);

        // Assert
        result.Should().BeNull("其他租户规则不得被启停");
        var persisted = await db.AlertRules.IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(r => r.Id == rule.Id);
        persisted.Enabled.Should().BeTrue();
    }

    [Fact]
    public async Task CreateAsync_应写入当前租户()
    {
        // Arrange
        await using var db = CreateDb(out var tenantId);
        var service = CreateService(db, tenantId);

        // Act
        var result = await service.CreateAsync(new CreateAlertRuleRequest
        {
            Name = "当前租户新规则",
            Metric = "temperature",
            RuleType = "threshold",
            Operator = "GreaterThan",
            Threshold = 90m,
            Severity = "high",
        });

        // Assert：创建规则必须归属当前租户，防止后续修改误丢 TenantId。
        result.Name.Should().Be("当前租户新规则");
        var persisted = await db.AlertRules.IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(r => r.Id == result.Id);
        persisted.TenantId.Should().Be(tenantId);
    }

    private static AppDbContext CreateDb(out Guid tenantId)
    {
        tenantId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"AlertRuleService_{Guid.NewGuid()}")
            .Options;
        return new AppDbContext(options, new FixedTenantContext(tenantId));
    }

    private static AlertRuleService CreateService(AppDbContext db, Guid tenantId)
    {
        var mapperConfiguration = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            NullLoggerFactory.Instance);
        return new AlertRuleService(
            db,
            mapperConfiguration.CreateMapper(),
            new FixedTenantContext(tenantId));
    }

    private static AlertRule CreateRule(Guid tenantId, string name)
        => new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = name,
            Metric = "temperature",
            RuleType = RuleType.Threshold,
            Operator = "GreaterThan",
            Threshold = 90m,
            Severity = AlertSeverity.High,
            CooldownSeconds = 300,
            Enabled = true,
        };

    /// <summary>
    /// 固定租户上下文，用于验证服务显式租户谓词不依赖 DbContext 的过滤器状态。
    /// </summary>
    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode { get; } = "Shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.Empty;
    }
}
