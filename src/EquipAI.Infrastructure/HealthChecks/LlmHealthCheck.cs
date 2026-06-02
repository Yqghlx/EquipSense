using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.HealthChecks;

/// <summary>
/// LLM API 连通性健康检查
/// 通过发送轻量级探测请求验证 LLM 服务可用性
/// </summary>
public class LlmHealthCheck : IHealthCheck
{
    private readonly ILLMService _llmService;
    private readonly ILogger<LlmHealthCheck> _logger;

    public LlmHealthCheck(ILLMService llmService, ILogger<LlmHealthCheck> logger)
    {
        _llmService = llmService;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _llmService.AnalyzeAsync(
                new LLMRequest("系统健康检查", "请回复 OK"), ct);

            if (!result.Success)
            {
                return HealthCheckResult.Degraded($"LLM 服务返回失败: {result.ErrorMessage}");
            }

            return HealthCheckResult.Healthy("LLM 服务正常");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LLM 健康检查失败");
            return HealthCheckResult.Degraded($"LLM 服务不可达: {ex.Message}");
        }
    }
}
