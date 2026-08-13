using EquipAI.WebAPI.Metrics;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Metrics;

/// <summary>
/// 验证 OpenTelemetry 端点在不同宿主环境中的启动边界。
/// </summary>
public sealed class OpenTelemetryConfigurationValidatorTests
{
    /// <summary>
    /// 生产环境缺少 OTLP 端点时必须拒绝启动，避免退回 Console exporter。
    /// </summary>
    [Fact]
    public void Production_缺少Otlp端点时必须拒绝启动()
    {
        var act = () => OpenTelemetryConfigurationValidator.ValidateForEnvironment(null, "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*OTEL_EXPORTER_OTLP_ENDPOINT*");
    }

    /// <summary>
    /// 生产环境配置非 HTTP(S) 端点时必须拒绝启动。
    /// </summary>
    [Theory]
    [InlineData("ftp://telemetry.example.com:4317")]
    [InlineData("http://")]
    [InlineData("http://user:password@telemetry.example.com:4317")]
    [InlineData("https://telemetry.example.com:4317/otlp\t")]
    public void Production_非法Otlp端点时必须拒绝启动(string endpoint)
    {
        var act = () => OpenTelemetryConfigurationValidator.ValidateForEnvironment(endpoint, "Production");

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*OTEL_EXPORTER_OTLP_ENDPOINT*");
    }

    /// <summary>
    /// 生产环境使用有效 HTTP(S) 端点时应通过启动门禁。
    /// </summary>
    [Theory]
    [InlineData("http://jaeger:4317")]
    [InlineData("https://otel-collector.example.com:4317")]
    public void Production_有效Otlp端点时应通过启动门禁(string endpoint)
    {
        var act = () => OpenTelemetryConfigurationValidator.ValidateForEnvironment(endpoint, "Production");

        act.Should().NotThrow();
    }

    /// <summary>
    /// 开发和测试环境缺少端点时保留 Console exporter 的本地开发体验。
    /// </summary>
    [Theory]
    [InlineData("Development")]
    [InlineData("Testing")]
    public void 非生产环境_缺少Otlp端点时允许启动(string environmentName)
    {
        var act = () => OpenTelemetryConfigurationValidator.ValidateForEnvironment(null, environmentName);

        act.Should().NotThrow();
    }
}
