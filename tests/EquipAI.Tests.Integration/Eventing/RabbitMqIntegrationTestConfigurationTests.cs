using EquipAI.Infrastructure.Messaging;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Eventing;

/// <summary>
/// 验证真实 RabbitMQ 集成测试的连接配置边界。
/// </summary>
public sealed class RabbitMqIntegrationTestConfigurationTests
{
    /// <summary>
    /// 未配置测试 vhost 时必须使用专用命名空间，避免误连默认 vhost。
    /// </summary>
    [Fact]
    public void 未配置测试vhost时使用专用vhost而不是默认vhost()
    {
        var options = RabbitMqIntegrationTestConfiguration.CreateOptions(
            new Dictionary<string, string?>());

        options.VirtualHost.Should().Be("/equipai_test");
    }

    /// <summary>
    /// CI 或本地隔离环境显式指定 vhost 时必须保持调用方配置。
    /// </summary>
    [Fact]
    public void 显式配置测试vhost时原样传递()
    {
        var options = RabbitMqIntegrationTestConfiguration.CreateOptions(
            new Dictionary<string, string?>
            {
                ["RABBITMQ_TEST_VHOST"] = "/ci-isolated",
            });

        options.VirtualHost.Should().Be("/ci-isolated");
    }
}
