using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace EquipAI.Infrastructure.HealthChecks;

/// <summary>
/// LLM 配置状态健康检查
///
/// 只检查 LLM 是否配置（可选依赖，未配置属合法降级），不发真实 LLM 请求——LLM 按调用计费，
/// readinessProbe 每 10s 触发，发真实生成请求会持续消耗 token + 可能触发 LLM 限流影响真实根因分析。
/// LLM 真实可达性由实际分析请求验证（失败自动降级 L2 + 日志）。对比 MqttHealthCheck 用 TCP connect
/// 探活（几乎免费）合理；LLM 可选 + 按调用计费，用真实请求探活是反模式。
/// </summary>
public class LlmHealthCheck : IHealthCheck
{
    private readonly ILLMService _llmService;

    public LlmHealthCheck(ILLMService llmService)
    {
        _llmService = llmService;
    }

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken ct = default)
    {
        // LLM 是可选增强依赖：未配置时 AI 分析降级规则匹配（合法状态），不影响服务就绪。
        // 配置/未配置都视为 Healthy——可选依赖的配置状态不参与就绪判定，
        // 真实可达性由实际分析请求验证（失败自动降级 L2 + 日志）。
        var result = _llmService.IsConfigured
            ? HealthCheckResult.Healthy("LLM 已配置，端到端可用性由实际分析请求验证（失败自动降级）")
            : HealthCheckResult.Healthy("LLM 未配置，AI 分析降级规则匹配（正常状态）");

        return Task.FromResult(result);
    }
}
