using EquipAI.Application.Notifications;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Net.Mail;
using Xunit;

namespace EquipAI.Tests.Unit.Notifications;

/// <summary>
/// SMTP 服务结果和取消语义测试。
/// </summary>
public sealed class SmtpEmailNotificationServiceTests
{
    [Fact]
    public async Task SMTP未配置时应返回失败且不调用发送器()
    {
        var sender = new Mock<ISmtpMailSender>();
        var service = CreateService(new SmtpOptions(), sender);

        var result = await service.SendAsync("user@example.com", "测试", "<p>正文</p>");

        result.Should().BeFalse();
        sender.Verify(
            item => item.SendAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task 有效配置和邮箱发送成功时应返回成功()
    {
        var sender = new Mock<ISmtpMailSender>();
        sender.Setup(item => item.SendAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var service = CreateService(new SmtpOptions
        {
            Host = "smtp.example.com",
            FromEmail = "noreply@example.com",
        }, sender);

        var result = await service.SendAsync("user@example.com", "测试", "<p>正文</p>");

        result.Should().BeTrue();
        sender.Verify(
            item => item.SendAsync(
                It.Is<MailMessage>(message => message.To.Single().Address == "user@example.com"
                    && message.Subject == "测试"
                    && message.IsBodyHtml),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task 无效邮箱地址应返回失败且不调用发送器()
    {
        var sender = new Mock<ISmtpMailSender>();
        var service = CreateService(new SmtpOptions
        {
            Host = "smtp.example.com",
            FromEmail = "noreply@example.com",
        }, sender);

        var result = await service.SendAsync("not-an-email", "测试", "<p>正文</p>");

        result.Should().BeFalse();
        sender.Verify(
            item => item.SendAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task 普通SMTP异常应转换为失败结果()
    {
        var sender = new Mock<ISmtpMailSender>();
        sender.Setup(item => item.SendAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new SmtpException("连接失败"));
        var service = CreateService(new SmtpOptions
        {
            Host = "smtp.example.com",
            FromEmail = "noreply@example.com",
        }, sender);

        var result = await service.SendAsync("user@example.com", "测试", "<p>正文</p>");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task 已取消的发送必须继续传播取消异常()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();
        var sender = new Mock<ISmtpMailSender>();
        sender.Setup(item => item.SendAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException(cts.Token));
        var service = CreateService(new SmtpOptions
        {
            Host = "smtp.example.com",
            FromEmail = "noreply@example.com",
        }, sender);

        var act = () => service.SendAsync("user@example.com", "测试", "<p>正文</p>", cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    private static SmtpEmailNotificationService CreateService(
        SmtpOptions options,
        Mock<ISmtpMailSender> sender)
    {
        return new SmtpEmailNotificationService(
            Options.Create(options),
            sender.Object,
            NullLogger<SmtpEmailNotificationService>.Instance);
    }
}
