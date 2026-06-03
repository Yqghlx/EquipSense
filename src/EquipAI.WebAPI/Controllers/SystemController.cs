using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 系统信息控制器 — 返回版本号和运行环境信息（需认证）
/// </summary>
[ApiController]
[Route("api/v1/system")]
[Authorize]
public class SystemController(IHostEnvironment env) : ControllerBase
{
    /// <summary>
    /// 获取系统版本和构建信息
    /// </summary>
    [HttpGet("info")]
    public IActionResult GetInfo()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var version = assembly.GetName().Version?.ToString() ?? "1.0.0";
        var informationalVersion = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion ?? version;

        return Ok(new
        {
            version = informationalVersion.Split('+')[0],
            environment = env.EnvironmentName,
            uptime = DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime()
        });
    }
}
