using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EquipAI.Application.Notifications;

/// <summary>
/// SMTP 配置选项
/// </summary>
public class SmtpOptions
{
    /// <summary>
    /// SMTP 服务器地址
    /// </summary>
    public string Host { get; set; } = string.Empty;

    /// <summary>
    /// SMTP 端口（默认 587）
    /// </summary>
    public int Port { get; set; } = 587;

    /// <summary>
    /// 发件人邮箱
    /// </summary>
    public string FromEmail { get; set; } = string.Empty;

    /// <summary>
    /// 发件人显示名称
    /// </summary>
    public string FromName { get; set; } = "EquipSense";

    /// <summary>
    /// SMTP 用户名
    /// </summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// SMTP 密码
    /// </summary>
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// 是否启用 SSL（默认 true）
    /// </summary>
    public bool EnableSsl { get; set; } = true;

    /// <summary>
    /// SMTP 配置是否完整。
    /// 只有基础连接参数和发件人地址均有效时，邮件 worker 才会领取任务。
    /// </summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Host)
        && Port is > 0 and <= 65535
        && MailAddress.TryCreate(FromEmail, out _);
}

/// <summary>
/// SMTP 邮件通知服务 — 通过 SMTP 协议发送告警、工单等通知邮件
/// </summary>
public class SmtpEmailNotificationService
{
    private readonly SmtpOptions _options;
    private readonly ISmtpMailSender _sender;
    private readonly ILogger<SmtpEmailNotificationService> _logger;

    public SmtpEmailNotificationService(
        IOptions<SmtpOptions> options,
        ISmtpMailSender sender,
        ILogger<SmtpEmailNotificationService> logger)
    {
        _options = options.Value;
        _sender = sender;
        _logger = logger;
    }

    /// <summary>
    /// SMTP 配置是否足以尝试发送邮件。
    /// </summary>
    public bool IsConfigured => _options.IsConfigured;

    /// <summary>
    /// 发送邮件
    /// </summary>
    /// <param name="to">收件人邮箱</param>
    /// <param name="subject">邮件主题</param>
    /// <param name="htmlBody">HTML 正文</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>SMTP 已接受发送时返回 true；配置缺失、地址无效或普通发送异常时返回 false。</returns>
    public async Task<bool> SendAsync(
        string to,
        string subject,
        string htmlBody,
        CancellationToken ct = default)
    {
        if (!_options.IsConfigured)
        {
            _logger.LogWarning("SMTP 未配置，跳过邮件发送");
            return false;
        }

        try
        {
            var recipient = new MailAddress(to);
            using var message = new MailMessage
            {
                From = new MailAddress(_options.FromEmail, _options.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
            };
            message.To.Add(recipient);

            await _sender.SendAsync(message, ct);
            _logger.LogInformation("邮件已发送");
            return true;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 停机或请求取消不能被伪装成普通 SMTP 故障，否则 worker 可能错误确认任务。
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "邮件发送失败");
            return false;
        }
    }
}
