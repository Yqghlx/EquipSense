using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.HealthChecks;
using FluentAssertions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Moq;

namespace EquipAI.Tests.Unit.HealthChecks;

/// <summary>
/// LlmHealthCheck 单元测试
///
/// 回归 #239：LLM 健康检查不得发真实 LLM 请求（按调用计费，readinessProbe 每 10s 触发会持续
/// 烧 token + 限流风险）。改为配置检查：配置/未配置都 Healthy（LLM 可选依赖，真实可达性由
/// 实际分析请求降级验证）。
/// </summary>
public class LlmHealthCheckTests
{
    [Theory]
    [InlineData(true, "已配置")]
    [InlineData(false, "未配置")]
    public async Task CheckHealthAsync_只检查配置状态_不发真实请求且都Healthy(bool configured, string label)
    {
        // mock ILLMService：IsConfigured 返回指定值；AnalyzeAsync 若被调用抛异常（应永不调用）
        var llmMock = new Mock<ILLMService>();
        llmMock.SetupGet(x => x.IsConfigured).Returns(configured);
        llmMock.Setup(x => x.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("健康检查不得发真实 LLM 请求"));

        var hc = new LlmHealthCheck(llmMock.Object);

        var result = await hc.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy,
            $"LLM 是可选增强依赖，{label} 都不应影响服务就绪（未配置属合法降级）");
        llmMock.Verify(
            x => x.AnalyzeAsync(It.IsAny<LLMRequest>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "健康检查不得发真实 LLM 请求（按调用计费，readinessProbe 每 10s 触发会持续烧 token）");
    }
}
