using EquipAI.Application.DTOs.Common;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Entities;
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
/// 正式知识规则控制器租户边界测试。
/// </summary>
public class KnowledgeRulesControllerTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Guid _dbTenantId = Guid.NewGuid();
    private readonly Guid _controllerTenantId = Guid.NewGuid();

    public KnowledgeRulesControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestKnowledgeRulesController_{Guid.NewGuid()}")
            .Options;

        _db = new AppDbContext(options, new TestTenantContext(_dbTenantId));
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task ToggleRuleAsync_其他租户规则_应返回不存在且不修改规则()
    {
        var rule = new KnowledgeRule
        {
            TenantId = _dbTenantId,
            DeviceType = "电机",
            Name = "其他租户规则",
            Conditions = "[]",
            Conclusion = "不应被切换",
            Enabled = true
        };
        _db.KnowledgeRules.Add(rule);
        await _db.SaveChangesAsync();

        var controller = CreateController();

        var result = await controller.ToggleRule(rule.Id);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
        rule.Enabled.Should().BeTrue();
        (await _db.KnowledgeRules
            .IgnoreQueryFilters()
            .SingleAsync(r => r.Id == rule.Id)).Enabled.Should().BeTrue();
    }

    [Fact]
    public async Task GetRulesAsync_其他租户规则_不应出现在列表中()
    {
        _db.KnowledgeRules.Add(new KnowledgeRule
        {
            TenantId = _dbTenantId,
            DeviceType = "电机",
            Name = "其他租户规则",
            Conditions = "[]",
            Conclusion = "不应被读取"
        });
        await _db.SaveChangesAsync();

        var controller = CreateController();

        var result = await controller.GetRules(new PagedQuery());

        var response = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var page = response.Value.Should()
            .BeOfType<PagedResult<KnowledgeRuleResponse>>()
            .Subject;
        page.Total.Should().Be(0);
        page.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task UpdateRuleAsync_其他租户规则_应返回不存在且不修改规则()
    {
        var rule = new KnowledgeRule
        {
            TenantId = _dbTenantId,
            DeviceType = "电机",
            Name = "其他租户规则",
            Conditions = "[]",
            Conclusion = "不应被更新",
            Version = 1
        };
        _db.KnowledgeRules.Add(rule);
        await _db.SaveChangesAsync();

        var controller = CreateController();

        var result = await controller.UpdateRule(
            rule.Id,
            new UpdateKnowledgeRuleRequest { Name = "越权更新" });

        result.Result.Should().BeOfType<NotFoundObjectResult>();
        rule.Name.Should().Be("其他租户规则");
        rule.Version.Should().Be(1);
    }

    [Fact]
    public async Task GetRuleVersionsAsync_其他租户规则_应返回不存在()
    {
        var rule = new KnowledgeRule
        {
            TenantId = _dbTenantId,
            DeviceType = "电机",
            Name = "其他租户规则",
            Conditions = "[]",
            Conclusion = "不应被读取"
        };
        _db.KnowledgeRules.Add(rule);
        await _db.SaveChangesAsync();

        var controller = CreateController();

        var result = await controller.GetRuleVersions(rule.Id);

        result.Result.Should().BeOfType<NotFoundObjectResult>();
    }

    private KnowledgeRulesController CreateController()
    {
        var controller = new KnowledgeRulesController(
            _db,
            conflictService: null!,
            importService: null!,
            versionService: null!,
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
