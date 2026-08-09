using System.Reflection;
using EquipAI.Infrastructure.Middleware;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.Mvc.Routing;
using Xunit;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// RBAC 权限标注回归测试。
///
/// 起因：PermissionMiddleware（src/EquipAI.WebAPI/Middleware/PermissionMiddleware.cs）对**未标注**
/// <c>[RequirePermission]</c> 的端点**直接放行**（仅检查认证，不限角色）。因此 RBAC 五角色矩阵的执行
/// 完全依赖每个敏感端点都标注了权限。多个写操作 Controller 历史漏标注 → 只读 Viewer 都能：
/// - <c>DeviceConfigController.QuickRegister</c> 建设备（应 device:create）；
/// - <c>IntegrationController</c> 读取集成配置摘要（应 tenant:read）并篡改
///   集成配置、触发外部推送（应 tenant:update）—— P0 凭证访问/篡改；
/// - <c>DispatchController.UpsertTechnician</c> 改技术人员画像（应 workorder:dispatch）。
///
/// 本测试把"这些端点必须标注正确权限"锁定为回归不变量——若未来有人误删 <c>[RequirePermission]</c>，
/// 测试立即捕获越权回退。PermissionMiddleware 的运行时行为（有标注则按角色挡）由
/// <c>PermissionMiddlewareTests</c> 覆盖，本测试补齐"端点标注"这一层。
///
/// 注意：以下 Controller 属于**自助/匿名**端点，豁免 RBAC（非漏标注）：
/// - AuthController：登录/注册/MFA/刷新等认证入口（未认证或自助）；
/// - NotificationsController：用户读写自己的通知（按 userId 过滤）；
/// - PushSubscriptionsController：用户管理自己的 Web Push 订阅；
/// - EvaluationController：开发阶段 AllowAnonymous 上报 ground truth（待独立加 API Key 认证，非 RBAC）。
/// </summary>
public class RequirePermissionAnnotationTests
{
    /// <summary>
    /// 敏感写操作端点必须标注正确的 [RequirePermission]，防低权限角色越权。
    /// </summary>
    [Theory]
    [InlineData(typeof(DeviceConfigController), nameof(DeviceConfigController.QuickRegister), "device:create")]
    [InlineData(typeof(IntegrationController), nameof(IntegrationController.GetIntegrations), "tenant:read")]
    [InlineData(typeof(IntegrationController), nameof(IntegrationController.UpdateIntegration), "tenant:update")]
    [InlineData(typeof(IntegrationController), nameof(IntegrationController.TestIntegration), "tenant:update")]
    [InlineData(typeof(DispatchController), nameof(DispatchController.UpsertTechnician), "workorder:dispatch")]
    public void 敏感端点_应标注正确的RequirePermission防越权(
        Type controllerType, string methodName, string expectedPermission)
    {
        var method = controllerType.GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance);
        method.Should().NotBeNull();

        var attr = method!.GetCustomAttribute<RequirePermissionAttribute>();
        attr.Should().NotBeNull(
            $"{controllerType.Name}.{methodName} 必须标注 [RequirePermission]，否则 PermissionMiddleware " +
            "直接放行，低权限角色（如 Viewer）可越权操作");

        attr!.Permission.Should().Be(expectedPermission,
            $"{controllerType.Name}.{methodName} 应标注「{expectedPermission}」权限");
    }

    /// <summary>
    /// 护栏：扫描所有非豁免 Controller 的写操作（POST/PUT/DELETE/PATCH），断言每个都标注了
    /// [RequirePermission]（方法级或类级）。捕获未来新增端点漏标注导致的越权。
    /// </summary>
    [Fact]
    public void 所有非豁免Controller的写操作_应标注RequirePermission防越权()
    {
        // Controller 级豁免：认证入口（AuthController）/ 用户自助通知（NotificationsController，按 userId 过滤）
        // / 用户自助推送订阅（PushSubscriptionsController）。
        // 标注 [AllowAnonymous] 的写方法（网关 X-Gateway-Auth-Key 自助注册、模拟器匿名上报）在下方方法级豁免。
        var exempt = new HashSet<string>(StringComparer.Ordinal)
        {
            nameof(AuthController),
            nameof(NotificationsController),
            nameof(PushSubscriptionsController)
        };

        var controllerAssembly = typeof(DevicesController).Assembly;
        var controllers = controllerAssembly.GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t)
                        && !t.IsAbstract
                        && !exempt.Contains(t.Name));

        var missing = new List<string>();
        foreach (var ctrl in controllers)
        {
            // 写操作 = 标注了 HttpPost/HttpPut/HttpDelete/HttpPatch（排除 HttpGet 读操作）
            var writeMethods = ctrl.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(m =>
                {
                    var attrs = m.GetCustomAttributes(true).ToList();
                    // 写操作 = 标注了 HttpPost/HttpPut/HttpDelete/HttpPatch（排除 HttpGet 读操作）
                    var isWrite = attrs.Any(a => a is HttpMethodAttribute verb && !verb.HttpMethods.Contains("GET"));
                    // 豁免 [AllowAnonymous] 方法：这些端点有意不走 JWT/RBAC（如网关用 X-Gateway-Auth-Key
                    // 自助注册、模拟器匿名上报 ground truth），用非 JWT 认证模型，[RequirePermission] 不适用
                    var isAllowAnonymous = attrs.Any(a => a is AllowAnonymousAttribute);
                    return isWrite && !isAllowAnonymous;
                });

            foreach (var method in writeMethods)
            {
                // 方法级或类级任一标注即视为受保护
                var hasPermission = method.GetCustomAttribute<RequirePermissionAttribute>() != null
                                    || ctrl.GetCustomAttribute<RequirePermissionAttribute>() != null;
                if (!hasPermission)
                {
                    missing.Add($"{ctrl.Name}.{method.Name}");
                }
            }
        }

        missing.Should().BeEmpty(
            "以下写操作端点未标注 [RequirePermission]，PermissionMiddleware 会直接放行导致越权（任意认证角色均可调用）：{0}",
            string.Join(", ", missing));
    }

    /// <summary>
    /// 租户私有查询不得使用输出缓存。当前输出缓存位于认证中间件之前，Cookie 认证请求不能依赖
    /// Authorization 请求头自动跳过缓存来保证租户隔离。
    /// </summary>
    [Theory]
    [InlineData(typeof(DevicesController), nameof(DevicesController.GetDevices))]
    [InlineData(typeof(AlertsController), nameof(AlertsController.GetAlerts))]
    [InlineData(typeof(AuditLogsController), nameof(AuditLogsController.GetAuditLogs))]
    public void 租户私有查询_不得启用OutputCache(Type controllerType, string methodName)
    {
        var method = controllerType.GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance);
        method.Should().NotBeNull();
        method!.GetCustomAttribute<OutputCacheAttribute>().Should().BeNull(
            $"{controllerType.Name}.{methodName} 返回租户私有数据，不得在认证前使用输出缓存");
    }
}
