using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Models;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers.Knowledge;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// 候选知识规则控制器租户边界测试。
/// </summary>
public class PendingRulesControllerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Guid _dbTenantId = Guid.NewGuid();
    private readonly Guid _controllerTenantId = Guid.NewGuid();

    public PendingRulesControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestPendingRulesController_{Guid.NewGuid()}")
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_dbTenantId));
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task DeletePendingRuleAsync_其他租户候选规则_应返回不存在且不删除规则()
    {
        var pending = new PendingRule
        {
            TenantId = _dbTenantId,
            DeviceType = "电机",
            Name = "其他租户候选规则",
            Conditions = "[]",
            Conclusion = "不应被删除",
            ReviewStatus = ReviewStatus.Pending
        };
        _db.PendingRules.Add(pending);
        await _db.SaveChangesAsync();

        var controller = CreateController();

        var result = await controller.DeletePendingRule(pending.Id);

        result.Should().BeOfType<NotFoundObjectResult>();
        (await _db.PendingRules
            .IgnoreQueryFilters()
            .SingleAsync(r => r.Id == pending.Id)).Should().NotBeNull();
    }

    [Fact]
    public async Task GetPendingRulesAsync_其他租户候选规则_不应出现在列表中()
    {
        _db.PendingRules.Add(new PendingRule
        {
            TenantId = _dbTenantId,
            DeviceType = "电机",
            Name = "其他租户候选规则",
            Conditions = "[]",
            Conclusion = "不应被读取",
            ReviewStatus = ReviewStatus.Pending
        });
        await _db.SaveChangesAsync();

        var controller = CreateController();

        var result = await controller.GetPendingRules(new EquipAI.Application.DTOs.Common.PagedQuery());

        var response = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var page = response.Value.Should()
            .BeOfType<PagedResult<PendingRuleResponse>>()
            .Subject;
        page.Total.Should().Be(0);
        page.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task ApproveWithEditAsync_其他租户候选规则_应返回不存在且不修改规则()
    {
        var pending = new PendingRule
        {
            TenantId = _dbTenantId,
            DeviceType = "电机",
            Name = "其他租户候选规则",
            Conditions = "[]",
            Conclusion = "不应被编辑批准",
            ReviewStatus = ReviewStatus.Pending
        };
        _db.PendingRules.Add(pending);
        await _db.SaveChangesAsync();

        var controller = CreateController();

        var result = await controller.ApproveWithEdit(
            pending.Id,
            new ApproveWithEditRequest { AdjustedName = "越权编辑" });

        result.Should().BeOfType<NotFoundObjectResult>();
        pending.Name.Should().Be("其他租户候选规则");
        pending.ReviewStatus.Should().Be(ReviewStatus.Pending);
    }

    private PendingRulesController CreateController()
    {
        var controller = new PendingRulesController(
            _db,
            captureService: null!,
            tenantContext: new TestTenantContext(_controllerTenantId));
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        return controller;
    }

    /// <summary>
    /// 测试用租户上下文，用于故意构造 DbContext 与控制器租户不一致的场景。
    /// </summary>
    private sealed class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId)
        {
            TenantId = tenantId;
        }

        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
