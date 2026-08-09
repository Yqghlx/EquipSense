using System.Security.Cryptography;
using System.Text;
using EquipAI.Application.Evaluation;
using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// AI 诊断评估控制器
/// 接收模拟器上报的标准答案（ground truth），并提供诊断准确率评估查询
///
/// 标准答案上报仅在开发/测试环境默认开放；生产环境必须显式开启、配置 API Key 和固定租户，
/// 防止匿名写入、跨租户污染和通过评估接口泄露工业诊断数据。
/// </summary>
[ApiController]
[Route("api/v1/evaluation")]
public class EvaluationController : ControllerBase
{
    private readonly EvaluationService _evaluationService;
    private readonly ITenantContext _tenantContext;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;

    private const string DefaultEvaluationTenantId = "11111111-1111-1111-1111-111111111111";
    private const string ApiKeyHeaderName = "X-Evaluation-Api-Key";
    private const int MaxEventsPerReport = 1000;
    private const int MaxRunIdLength = 128;

    public EvaluationController(
        EvaluationService evaluationService,
        ITenantContext tenantContext,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        _evaluationService = evaluationService;
        _tenantContext = tenantContext;
        _configuration = configuration;
        _environment = environment;
    }

    /// <summary>
    /// 接收模拟器上报的标准答案。
    /// 开发/测试环境允许模拟器直接调用；生产环境必须显式开启并使用内部 API Key。
    /// </summary>
    [HttpPost("ground-truth")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ReportGroundTruth([FromBody] GroundTruthReport report, CancellationToken ct)
    {
        var accessError = ValidateIngestionAccess();
        if (accessError is not null)
            return accessError;

        if (report is null
            || string.IsNullOrWhiteSpace(report.RunId)
            || report.RunId.Length > MaxRunIdLength
            || report.DeviceId == Guid.Empty
            || report.Events is null
            || report.Events.Count == 0
            || report.Events.Count > MaxEventsPerReport)
        {
            return BadRequest(new
            {
                code = 400,
                message = $"runId、有效 deviceId 和 1-{MaxEventsPerReport} 条 events 为必填项，runId 最长 {MaxRunIdLength} 个字符"
            });
        }

        if (report.Events.Any(e => string.IsNullOrWhiteSpace(e.FaultType)
            || string.IsNullOrWhiteSpace(e.ExpectedRootCause)))
        {
            return BadRequest(new { code = 400, message = "每条 event 必须包含 faultType 和 expectedRootCause" });
        }

        var tenantId = ResolveIngestionTenantId();
        if (tenantId is null)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                code = "EVALUATION_NOT_CONFIGURED",
                message = "生产评估上报未配置固定租户"
            });
        }

        var count = await _evaluationService.IngestReportAsync(report, tenantId.Value, ct);
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

    /// <summary>
    /// 验证标准答案上报权限。
    /// 生产默认关闭该内部接口；启用时使用独立 API Key，避免复用 JWT 或网关密钥扩大泄露影响面。
    /// </summary>
    private IActionResult? ValidateIngestionAccess()
    {
        if (_environment.IsDevelopment() || _environment.IsEnvironment("Testing"))
            return null;

        if (!_configuration.GetValue("Evaluation:AllowGroundTruthIngestion", false))
            return NotFound();

        var configuredKey = _configuration["Evaluation:IngestionApiKey"];
        if (string.IsNullOrWhiteSpace(configuredKey) || configuredKey.Length < 32)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                code = "EVALUATION_NOT_CONFIGURED",
                message = "生产评估上报密钥未配置"
            });
        }

        var requestKey = Request.Headers[ApiKeyHeaderName].FirstOrDefault();
        if (string.IsNullOrEmpty(requestKey)
            || !CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(requestKey),
                Encoding.UTF8.GetBytes(configuredKey)))
        {
            return Unauthorized(new { code = 401, message = "评估上报密钥无效" });
        }

        return null;
    }

    /// <summary>
    /// 解析标准答案归属租户。
    /// 生产使用部署配置固定租户，不能信任匿名请求体或任意查询参数传入的租户 ID。
    /// </summary>
    private Guid? ResolveIngestionTenantId()
    {
        if (_environment.IsDevelopment() || _environment.IsEnvironment("Testing"))
        {
            return _tenantContext.TenantId == Guid.Empty
                ? Guid.Parse(DefaultEvaluationTenantId)
                : _tenantContext.TenantId;
        }

        return Guid.TryParse(_configuration["Evaluation:TenantId"], out var tenantId)
               && tenantId != Guid.Empty
            ? tenantId
            : null;
    }
}
