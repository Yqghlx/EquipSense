using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace EquipAI.Application.Notifications;

/// <summary>
/// 基于系统 SMTP 客户端的生产发送器。
/// </summary>
public sealed class SmtpMailSender : ISmtpMailSender
{
    private static readonly TimeSpan SendTimeout = TimeSpan.FromSeconds(10);
    private readonly SmtpOptions _options;

    /// <summary>
    /// 初始化 SMTP 发送器。
    /// </summary>
    public SmtpMailSender(IOptions<SmtpOptions> options)
    {
        _options = options.Value;
    }

    /// <inheritdoc />
    public async Task SendAsync(MailMessage message, CancellationToken ct = default)
    {
        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.EnableSsl,
            Credentials = new NetworkCredential(_options.Username, _options.Password),
            Timeout = (int)SendTimeout.TotalMilliseconds,
        };

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(SendTimeout);
        try
        {
            await client.SendMailAsync(message, timeoutCts.Token);
        }
        catch (OperationCanceledException exception)
            when (!ct.IsCancellationRequested && timeoutCts.IsCancellationRequested)
        {
            throw new TimeoutException("SMTP 发送超过 10 秒超时", exception);
        }
    }
}
