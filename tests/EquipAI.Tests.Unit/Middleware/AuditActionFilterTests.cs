using System.Reflection;
using EquipAI.Core.Interfaces;
using EquipAI.WebAPI.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using Moq;

namespace EquipAI.Tests.Unit.Middleware;

/// <summary>
/// AuditActionFilter 单元测试
/// 验证全局审计 Filter 的行为：
/// - GET/HEAD/OPTIONS 不审计
/// - POST→Create / PUT→Update / DELETE→Delete 自动推断
/// - Controller 名推断资源类型（DevicesController→Device）
/// - [Audit] 特性覆盖自动推断
/// - [SkipAudit] 跳过
/// - 审计失败不中断业务
/// </summary>
public class AuditActionFilterTests
{
    private readonly Mock<IAuditLogService> _auditMock = new();
    private readonly AuditActionFilter _filter;

    public AuditActionFilterTests()
    {
        _filter = new AuditActionFilter(
            _auditMock.Object,
            Mock.Of<ILogger<AuditActionFilter>>());
    }

    /// <summary>构造 ActionExecutingContext + ActionExecutedContext 对</summary>
    private (ActionExecutingContext executing, ActionExecutedContext executed) CreateContext(
        string httpMethod,
        string controllerName,
        string actionName,
        Type controllerType,
        MethodInfo methodInfo,
        int statusCode = 200,
        Dictionary<string, object?>? routeValues = null)
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = httpMethod;
        httpContext.Response.StatusCode = statusCode;

        var actionDescriptor = new ControllerActionDescriptor
        {
            ControllerTypeInfo = controllerType.GetTypeInfo(),
            ControllerName = controllerName,
            ActionName = actionName,
            MethodInfo = methodInfo,
            RouteValues = new Dictionary<string, string?>
            {
                ["controller"] = controllerName,
                ["action"] = actionName,
            },
        };

        var routeData = new RouteData();
        foreach (var (key, value) in routeValues ?? new())
            routeData.Values[key] = value;

        var actionContext = new ActionContext(httpContext, routeData, actionDescriptor);

        // 把路由参数放进 ActionArguments，Filter 的 ResolveResourceId 会从 *Id 命名参数提取
        var actionArgs = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        foreach (var (key, value) in routeValues ?? new())
            actionArgs[key] = value;

        var executing = new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            actionArgs,
            new object());

        var executed = new ActionExecutedContext(executing, new List<IFilterMetadata>(), new object())
        {
            HttpContext = httpContext,
        };

        return (executing, executed);
    }

    [Fact]
    public async Task Get_Request_Should_Not_Audit()
    {
        var (executing, executed) = CreateContext(
            "GET", "Devices", "GetDevices",
            typeof(DevicesController),
            typeof(DevicesController).GetMethod(nameof(DevicesController.GetDevices))!);

        await _filter.OnActionExecutionAsync(executing, () => Task.FromResult(executed));

        _auditMock.Verify(
            x => x.LogFromContextAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "GET 请求不应记录审计日志");
    }

    [Theory]
    [InlineData("POST", "Create")]
    [InlineData("PUT", "Update")]
    [InlineData("PATCH", "Update")]
    [InlineData("DELETE", "Delete")]
    public async Task Write_Methods_Should_Audit_With_Inferred_Action(string method, string expectedAction)
    {
        var methodInfo = typeof(DevicesController).GetMethod(nameof(DevicesController.CreateDevice))!;
        var (executing, executed) = CreateContext(
            method, "Devices", "CreateDevice",
            typeof(DevicesController), methodInfo);

        string? capturedAction = null;
        string? capturedResource = null;
        _auditMock.Setup(x => x.LogFromContextAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, string?, string?, CancellationToken>((a, r, _, _, _) =>
            {
                capturedAction = a;
                capturedResource = r;
            })
            .Returns(Task.CompletedTask);

        await _filter.OnActionExecutionAsync(executing, () => Task.FromResult(executed));

        _auditMock.Verify(
            x => x.LogFromContextAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Once);
        capturedAction.Should().Be(expectedAction);
        capturedResource.Should().Be("Device"); // DevicesController → Device
    }

    [Fact]
    public async Task Audit_Attribute_Should_Override_Inference()
    {
        var (executing, executed) = CreateContext(
            "PUT", "WorkOrders", "Assign",
            typeof(WorkOrdersController),
            typeof(WorkOrdersController).GetMethod(nameof(WorkOrdersController.Assign))!);

        string? capturedAction = null;
        string? capturedResource = null;
        _auditMock.Setup(x => x.LogFromContextAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, string?, string?, CancellationToken>((a, r, _, _, _) =>
            {
                capturedAction = a;
                capturedResource = r;
            })
            .Returns(Task.CompletedTask);

        await _filter.OnActionExecutionAsync(executing, () => Task.FromResult(executed));

        capturedAction.Should().Be("Dispatch"); // 不是推断的 "Update"
        capturedResource.Should().Be("WorkOrder");
    }

    [Fact]
    public async Task SkipAudit_Attribute_Should_Skip()
    {
        var (executing, executed) = CreateContext(
            "POST", "Auth", "Refresh",
            typeof(AuthController),
            typeof(AuthController).GetMethod(nameof(AuthController.Refresh))!);

        await _filter.OnActionExecutionAsync(executing, () => Task.FromResult(executed));

        _auditMock.Verify(
            x => x.LogFromContextAsync(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "[SkipAudit] 标注的操作不应审计");
    }

    [Fact]
    public async Task Resource_Id_Should_Be_Extracted_From_Route()
    {
        var (executing, executed) = CreateContext(
            "DELETE", "Devices", "DeleteDevice",
            typeof(DevicesController),
            typeof(DevicesController).GetMethod(nameof(DevicesController.DeleteDevice))!,
            routeValues: new Dictionary<string, object?> { ["deviceId"] = Guid.Parse("33333333-3333-3333-3333-333333333333") });

        string? capturedId = null;
        _auditMock.Setup(x => x.LogFromContextAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, string?, string?, CancellationToken>((_, _, id, _, _) => capturedId = id)
            .Returns(Task.CompletedTask);

        await _filter.OnActionExecutionAsync(executing, () => Task.FromResult(executed));

        capturedId.Should().Be("33333333-3333-3333-3333-333333333333");
    }

    [Fact]
    public async Task Create_Operation_Should_Extract_ResourceId_From_Response()
    {
        // 创建操作（POST /resources）既无路由 id，方法参数又是 [FromBody] request（不以 Id 结尾），
        // 传统两步取不到 resourceId。修复后从响应结果（ObjectResult.Value 的 DTO）反射 Id 字段，
        // 使创建审计可追溯具体创建了哪个资源（否则审计只记"Create Device — 成功"而无 resourceId）。
        var (executing, executed) = CreateContext(
            "POST", "Devices", "CreateDevice",
            typeof(DevicesController),
            typeof(DevicesController).GetMethod(nameof(DevicesController.CreateDevice))!);

        // 模拟 Controller 返回新创建资源的 DTO（含 Id），如 CreatedAtAction(dto)
        var newDeviceId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        executed.Result = new ObjectResult(new { Id = newDeviceId });

        string? capturedId = null;
        _auditMock.Setup(x => x.LogFromContextAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, string?, string?, CancellationToken>((_, _, id, _, _) => capturedId = id)
            .Returns(Task.CompletedTask);

        await _filter.OnActionExecutionAsync(executing, () => Task.FromResult(executed));

        capturedId.Should().Be(newDeviceId.ToString(),
            "创建操作必须从响应 DTO 提取新资源 Id 填充 resourceId，否则审计无法追溯具体创建了哪个资源");
    }

    [Fact]
    public async Task Description_Should_Indicate_Failure_With_Status_Code()
    {
        var (executing, executed) = CreateContext(
            "POST", "Devices", "CreateDevice",
            typeof(DevicesController),
            typeof(DevicesController).GetMethod(nameof(DevicesController.CreateDevice))!,
            statusCode: 500);

        string? capturedDesc = null;
        _auditMock.Setup(x => x.LogFromContextAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, string?, string?, CancellationToken>((_, _, _, desc, _) => capturedDesc = desc)
            .Returns(Task.CompletedTask);

        await _filter.OnActionExecutionAsync(executing, () => Task.FromResult(executed));

        capturedDesc.Should().Contain("失败");
        capturedDesc.Should().Contain("500");
    }

    [Fact]
    public async Task Audit_Failure_Should_Not_Break_Business_Logic()
    {
        _auditMock.Setup(x => x.LogFromContextAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(),
                It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("DB down"));

        var (executing, executed) = CreateContext(
            "POST", "Devices", "CreateDevice",
            typeof(DevicesController),
            typeof(DevicesController).GetMethod(nameof(DevicesController.CreateDevice))!);

        // 不应抛异常
        var act = async () => await _filter.OnActionExecutionAsync(executing, () => Task.FromResult(executed));
        await act.Should().NotThrowAsync();
    }

    // ===== 测试用桩 Controller，提供 MethodInfo 和特性 =====
    private class DevicesController : ControllerBase
    {
        [HttpGet] public IActionResult GetDevices() => Ok();
        [HttpPost] public IActionResult CreateDevice() => Ok();
        [HttpDelete("{id:guid}")] public IActionResult DeleteDevice(Guid id) => Ok();
    }

    private class WorkOrdersController : ControllerBase
    {
        [HttpPut("{id:guid}/assign")]
        [Audit("Dispatch", "WorkOrder")]
        public IActionResult Assign(Guid id) => Ok();
    }

    private class AuthController : ControllerBase
    {
        [HttpPost("refresh")]
        [SkipAudit]
        public IActionResult Refresh() => Ok();
    }
}
