using System.Text.Json;
using FluentAssertions;

namespace EquipAI.Tests.Integration.Eventing;

/// <summary>
/// 验证 RabbitMQ management connection 选择的 vhost 隔离边界。
/// </summary>
public sealed class RabbitMqManagementConnectionSelectorTests
{
    /// <summary>
    /// 同名连接存在多个 vhost 时只能选择目标 vhost 的连接。
    /// </summary>
    [Fact]
    public void 同名连接存在多个vhost时只选择目标vhost()
    {
        using var document = JsonDocument.Parse("""
            [
              {"name":"wrong","vhost":"/","client_properties":{"connection_name":"EquipSense.EventBus"}},
              {"name":"target","vhost":"/equipai_test","client_properties":{"connection_name":"EquipSense.EventBus"}}
            ]
            """);

        RabbitMqManagementConnectionSelector.FindConnectionName(
                document.RootElement,
                "EquipSense.EventBus",
                "/equipai_test")
            .Should().Be("target");
    }

    /// <summary>
    /// 缺少 vhost 字段时不能证明连接属于测试环境，必须拒绝选择。
    /// </summary>
    [Fact]
    public void 缺少vhost时不得选择连接()
    {
        using var document = JsonDocument.Parse("""
            [{"name":"unknown","client_properties":{"connection_name":"EquipSense.EventBus"}}]
            """);

        RabbitMqManagementConnectionSelector.FindConnectionName(
                document.RootElement,
                "EquipSense.EventBus",
                "/equipai_test")
            .Should().BeNull();
    }
}
