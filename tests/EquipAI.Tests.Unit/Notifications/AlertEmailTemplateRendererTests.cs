using EquipAI.Application.Notifications;
using EquipAI.Core.Entities;
using FluentAssertions;
using Xunit;

namespace EquipAI.Tests.Unit.Notifications;

/// <summary>
/// 告警邮件正文的安全编码测试。
/// </summary>
public sealed class AlertEmailTemplateRendererTests
{
    [Fact]
    public void 动态通知字段必须HTML编码且保留站内链接()
    {
        var notification = new Notification
        {
            Title = "<script>alert(1)</script>",
            Content = "设备 <img src=x onerror=alert(1)> 异常",
            Link = "/alerts?alertId=abc&from=email",
        };

        var html = AlertEmailTemplateRenderer.Render(notification, "zh-CN");

        html.Should().Contain("&lt;script&gt;");
        html.Should().Contain("&lt;img");
        html.Should().NotContain("<script>");
        html.Should().NotContain("<img src=x");
        html.Should().Contain("/alerts?alertId=abc&amp;from=email");
    }
}
