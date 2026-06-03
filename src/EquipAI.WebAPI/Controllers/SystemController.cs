using System.Reflection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 系统信息控制器 — 返回版本号、构建时间、运行环境等
/// </summary>
[ApiController]
[Route("api/v1/system")]
public class SystemController(IHostEnvironment env) : ControllerBase
{
    /// <summary>
    /// 获取系统版本和构建信息（需认证）
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
