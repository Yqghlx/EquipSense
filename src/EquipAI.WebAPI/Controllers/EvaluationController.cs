using EquipAI.Application.Evaluation;
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// AI 诊断评估控制器
/// 接收模拟器上报的标准答案（ground truth），并提供诊断准确率评估查询
///
/// 注意：上报端点使用 AllowAnonymous 便于模拟器工具直接调用（开发阶段简化）
/// 生产环境应加 API Key 认证
/// </summary>
[ApiController]
[Route("api/v1/evaluation")]
public class EvaluationController : ControllerBase
{
    private readonly EvaluationService _evaluationService;
    private readonly ITenantContext _tenantContext;

    public EvaluationController(EvaluationService evaluationService, ITenantContext tenantContext)
    {
        _evaluationService = evaluationService;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 接收模拟器上报的标准答案（允许匿名，模拟器工具无需登录）
    /// </summary>
    [HttpPost("ground-truth")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ReportGroundTruth([FromBody] GroundTruthReport report, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(report.RunId) || report.Events.Count == 0)
            return BadRequest(new { code = 400, message = "runId 和 events 不能为空" });

        // 上报端点无 HttpContext 租户信息，使用 ground truth 携带的设备编码推断租户
        // 简化处理：归属默认租户（模拟器和种子设备同租户）
        var tenantId = _tenantContext.TenantId == Guid.Empty
            ? Guid.Parse("11111111-1111-1111-1111-111111111111")
            : _tenantContext.TenantId;

        var count = await _evaluationService.IngestReportAsync(report, tenantId, ct);
        return Ok(new { received = count, runId = report.RunId });
    }

    /// <summary>
    /// 查询诊断评估结果（对比 ground truth 与 analyses 表的 AI 实际诊断）
    /// </summary>
    /// <param name="runId">可选：指定批次 ID，不传则评估全部</param>
    [HttpGet("result")]
    [Authorize]
    [ProducesResponseType(typeof(EvaluationResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<EvaluationResult>> GetResult([FromQuery] string? runId, CancellationToken ct)
    {
        var result = await _evaluationService.EvaluateAsync(runId, _tenantContext.TenantId, ct);
        return Ok(result);
    }
}
