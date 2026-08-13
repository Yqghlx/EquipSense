using System.Net;
using System.Net.Http.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EquipAI.Application.Approvals.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Identity;
using EquipAI.Tests.Integration.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.DependencyInjection;

namespace EquipAI.Tests.Integration.Controllers;

/// <summary>
/// 审批授权 HTTP 集成测试。
/// 使用真实 JWT、租户解析、权限中间件和控制器，验证服务层授权规则没有在 HTTP 边界丢失。
/// </summary>
[Collection("SharedFactory")]
public class ApprovalAuthorizationIntegrationTests
{
    private static readonly Guid DefaultTenantId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    private readonly CustomWebApplicationFactory _factory;

    public ApprovalAuthorizationIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    /// <summary>
    /// 验证：角色和指定审批人均匹配时，HTTP 审批请求成功并持久化所有审批副作用。
    /// </summary>
    [Fact]
    public async Task Approve_WithMatchingRoleAndSpecificApprover_Returns200AndPersistsApproval()
    {
        var approverId = Guid.NewGuid();
        var (workOrderId, approvalId) = await SeedPendingApprovalAsync(
            expectedRole: "maintenance_lead",
            specificApproverId: approverId,
            tenantId: DefaultTenantId);
        var client = await CreateAuthenticatedClientAsync(
            approverId,
            DefaultTenantId,
            UserRole.MaintenanceLead);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/work-orders/{workOrderId}/approve",
            new ApprovalActionRequest("HTTP 集成测试通过"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var approval = await dbContext.WorkOrderApprovals
            .IgnoreQueryFilters()
            .SingleAsync(item => item.Id == approvalId);
        var workOrder = await dbContext.WorkOrders
            .IgnoreQueryFilters()
            .SingleAsync(item => item.Id == workOrderId);

        approval.Action.Should().Be(ApprovalAction.Approved);
        approval.ApproverId.Should().Be(approverId);
        approval.Comment.Should().Be("HTTP 集成测试通过");
        approval.ActedAt.Should().NotBeNull();
        workOrder.Status.Should().Be(WorkOrderStatus.Accepted);
    }

    /// <summary>
    /// 验证：具备端点权限但角色不匹配时，HTTP 审批请求返回 403 且不产生任何状态副作用。
    /// </summary>
    [Fact]
    public async Task Approve_WithWrongRole_Returns403AndDoesNotMutateState()
    {
        var actorId = Guid.NewGuid();
        var (workOrderId, approvalId) = await SeedPendingApprovalAsync(
            expectedRole: "maintenance_lead",
            specificApproverId: null,
            tenantId: DefaultTenantId);
        var client = await CreateAuthenticatedClientAsync(
            actorId,
            DefaultTenantId,
            UserRole.SystemAdmin);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/work-orders/{workOrderId}/approve",
            new ApprovalActionRequest("不应被接受"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        await AssertApprovalAndWorkOrderUnchangedAsync(
            approvalId,
            workOrderId,
            expectedAction: ApprovalAction.Pending,
            expectedStatus: WorkOrderStatus.SubmittedForApproval);
    }

    /// <summary>
    /// 验证：角色匹配但不是指定审批人时，HTTP 审批请求返回 403 且不产生任何状态副作用。
    /// </summary>
    [Fact]
    public async Task Approve_WithDifferentSpecificApprover_Returns403AndDoesNotMutateState()
    {
        var actorId = Guid.NewGuid();
        var designatedApproverId = Guid.NewGuid();
        var (workOrderId, approvalId) = await SeedPendingApprovalAsync(
            expectedRole: "maintenance_lead",
            specificApproverId: designatedApproverId,
            tenantId: DefaultTenantId);
        var client = await CreateAuthenticatedClientAsync(
            actorId,
            DefaultTenantId,
            UserRole.MaintenanceLead);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/work-orders/{workOrderId}/approve",
            new ApprovalActionRequest("指定审批人不匹配"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        await AssertApprovalAndWorkOrderUnchangedAsync(
            approvalId,
            workOrderId,
            expectedAction: ApprovalAction.Pending,
            expectedStatus: WorkOrderStatus.SubmittedForApproval);
    }

    /// <summary>
    /// 验证：驳回接口也执行指定审批人校验，越权时不能把工单改为返工状态。
    /// </summary>
    [Fact]
    public async Task Reject_WithDifferentSpecificApprover_Returns403AndDoesNotMutateState()
    {
        var actorId = Guid.NewGuid();
        var designatedApproverId = Guid.NewGuid();
        var (workOrderId, approvalId) = await SeedPendingApprovalAsync(
            expectedRole: "maintenance_lead",
            specificApproverId: designatedApproverId,
            tenantId: DefaultTenantId);
        var client = await CreateAuthenticatedClientAsync(
            actorId,
            DefaultTenantId,
            UserRole.MaintenanceLead);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/work-orders/{workOrderId}/reject-approval",
            new ApprovalActionRequest("指定审批人不匹配"));

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        await AssertApprovalAndWorkOrderUnchangedAsync(
            approvalId,
            workOrderId,
            expectedAction: ApprovalAction.Pending,
            expectedStatus: WorkOrderStatus.SubmittedForApproval);
    }

    /// <summary>
    /// 验证：当前租户不能通过工单 ID 操作另一租户的审批记录，统一按资源不可见返回 404 且记录保持不变。
    /// </summary>
    [Fact]
    public async Task Approve_WithOtherTenant_ReturnsNotFoundAndDoesNotMutateState()
    {
        var actorId = Guid.NewGuid();
        var foreignTenantId = Guid.NewGuid();
        var (workOrderId, approvalId) = await SeedPendingApprovalAsync(
            expectedRole: "maintenance_lead",
            specificApproverId: actorId,
            tenantId: foreignTenantId);
        var client = await CreateAuthenticatedClientAsync(
            actorId,
            DefaultTenantId,
            UserRole.MaintenanceLead);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/work-orders/{workOrderId}/approve",
            new ApprovalActionRequest("跨租户审批"));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        await AssertApprovalAndWorkOrderUnchangedAsync(
            approvalId,
            workOrderId,
            expectedAction: ApprovalAction.Pending,
            expectedStatus: WorkOrderStatus.SubmittedForApproval);
    }

    /// <summary>
    /// 验证：待审批列表只返回当前租户、当前角色且指定给当前用户或未指定用户的记录。
    /// </summary>
    [Fact]
    public async Task PendingApprovals_ReturnsOnlyCurrentTenantRoleAndSpecificUserRecords()
    {
        var actorId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var otherTenantId = Guid.NewGuid();
        var matching = await SeedPendingApprovalAsync(
            expectedRole: "maintenance_lead",
            specificApproverId: actorId,
            tenantId: DefaultTenantId);
        var unassigned = await SeedPendingApprovalAsync(
            expectedRole: "maintenance_lead",
            specificApproverId: null,
            tenantId: DefaultTenantId);
        var otherUser = await SeedPendingApprovalAsync(
            expectedRole: "maintenance_lead",
            specificApproverId: otherUserId,
            tenantId: DefaultTenantId);
        var otherRole = await SeedPendingApprovalAsync(
            expectedRole: "system_admin",
            specificApproverId: actorId,
            tenantId: DefaultTenantId);
        var otherTenant = await SeedPendingApprovalAsync(
            expectedRole: "maintenance_lead",
            specificApproverId: actorId,
            tenantId: otherTenantId);
        var client = await CreateAuthenticatedClientAsync(
            actorId,
            DefaultTenantId,
            UserRole.MaintenanceLead);

        var response = await client.GetAsync("/api/v1/approval-chains/pending");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var pending = await response.Content.ReadFromJsonAsync<List<WorkOrderApprovalDto>>();
        pending.Should().NotBeNull();
        pending!.Select(item => item.Id)
            .Should()
            .Contain(new[] { matching.ApprovalId, unassigned.ApprovalId })
            .And.NotContain(new[]
            {
                otherUser.ApprovalId,
                otherRole.ApprovalId,
                otherTenant.ApprovalId
            });
    }

    /// <summary>
    /// 验证：缺少角色声明的有效 JWT 在 HTTP 层按既有权限中间件语义返回 401，不会放宽待审批列表范围。
    /// </summary>
    [Fact]
    public async Task PendingApprovals_WithoutRoleClaim_Returns401()
    {
        var client = await CreateAuthenticatedClientWithoutRoleAsync(
            Guid.NewGuid(),
            DefaultTenantId);

        var response = await client.GetAsync("/api/v1/approval-chains/pending");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// 创建带有审批记录的最小工单，避免测试依赖异步事件或前置 UI 流程。
    /// </summary>
    private async Task<(Guid WorkOrderId, Guid ApprovalId)> SeedPendingApprovalAsync(
        string expectedRole,
        Guid? specificApproverId,
        Guid tenantId)
    {
        await _factory.CreateClientWithSeedAsync();

        var workOrder = new WorkOrder
        {
            TenantId = tenantId,
            WorkOrderCode = $"HTTP-{Guid.NewGuid():N}"[..30],
            Title = "审批 HTTP 集成测试工单",
            Type = WorkOrderType.Corrective,
            Status = WorkOrderStatus.SubmittedForApproval,
            Priority = WorkOrderPriority.High,
            DeviceId = Guid.NewGuid()
        };
        var approval = new WorkOrderApproval
        {
            TenantId = tenantId,
            WorkOrderId = workOrder.Id,
            StepOrder = 1,
            ExpectedRole = expectedRole,
            SpecificApproverId = specificApproverId,
            Action = ApprovalAction.Pending
        };

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        dbContext.WorkOrders.Add(workOrder);
        dbContext.WorkOrderApprovals.Add(approval);
        await dbContext.SaveChangesAsync();

        return (workOrder.Id, approval.Id);
    }

    /// <summary>
    /// 重新读取审批记录和工单，确认拒绝请求没有修改任何敏感状态字段。
    /// </summary>
    private async Task AssertApprovalAndWorkOrderUnchangedAsync(
        Guid approvalId,
        Guid workOrderId,
        ApprovalAction expectedAction,
        WorkOrderStatus expectedStatus)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var approval = await dbContext.WorkOrderApprovals
            .IgnoreQueryFilters()
            .SingleAsync(item => item.Id == approvalId);
        var workOrder = await dbContext.WorkOrders
            .IgnoreQueryFilters()
            .SingleAsync(item => item.Id == workOrderId);

        approval.Action.Should().Be(expectedAction);
        approval.ApproverId.Should().BeNull();
        approval.Comment.Should().BeNull();
        approval.ActedAt.Should().BeNull();
        workOrder.Status.Should().Be(expectedStatus);
    }

    /// <summary>
    /// 使用生产同源 JWT 服务生成带租户和角色声明的 HTTP 客户端。
    /// </summary>
    private async Task<HttpClient> CreateAuthenticatedClientAsync(
        Guid userId,
        Guid tenantId,
        UserRole role)
    {
        var client = await _factory.CreateClientWithSeedAsync();
        using var scope = _factory.Services.CreateScope();
        var jwtService = scope.ServiceProvider.GetRequiredService<JwtTokenService>();
        var token = jwtService.GenerateAccessToken(new User
        {
            Id = userId,
            TenantId = tenantId,
            Role = role,
            Username = $"approval-http-{userId:N}",
            TokenVersion = 0
        });

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    /// <summary>
    /// 构造一个缺少 role 声明但仍使用测试环境签名密钥签发的 JWT，覆盖 HTTP fail-closed 边界。
    /// </summary>
    private async Task<HttpClient> CreateAuthenticatedClientWithoutRoleAsync(
        Guid userId,
        Guid tenantId)
    {
        var client = await _factory.CreateClientWithSeedAsync();
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes("integration-test-jwt-secret-at-least-32-characters"));
        var token = new JwtSecurityToken(
            issuer: "EquipAI",
            audience: "EquipAI",
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim("tenant_id", tenantId.ToString()),
                new Claim("username", $"approval-http-{userId:N}"),
                new Claim("token_version", "0"),
                new Claim("must_change_password", "false"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            ],
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                "Bearer",
                new JwtSecurityTokenHandler().WriteToken(token));
        return client;
    }
}
