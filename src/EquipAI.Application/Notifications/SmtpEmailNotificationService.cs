using System.Net;
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
    /// SMTP 配置是否完整
    /// </summary>
    public bool IsConfigured => !string.IsNullOrEmpty(Host) && !string.IsNullOrEmpty(FromEmail);
}

/// <summary>
/// SMTP 邮件通知服务 — 通过 SMTP 协议发送告警、工单等通知邮件
/// </summary>
public class SmtpEmailNotificationService
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailNotificationService> _logger;

    public SmtpEmailNotificationService(IOptions<SmtpOptions> options, ILogger<SmtpEmailNotificationService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// 发送邮件
    /// </summary>
    /// <param name="to">收件人邮箱</param>
    /// <param name="subject">邮件主题</param>
    /// <param name="htmlBody">HTML 正文</param>
    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        if (!_options.IsConfigured)
        {
            _logger.LogWarning("SMTP 未配置，跳过邮件发送（收件人：{To}，主题：{Subject}）", to, subject);
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_options.FromEmail, _options.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true,
            };
            message.To.Add(to);

            using var client = new SmtpClient(_options.Host, _options.Port)
            {
                EnableSsl = _options.EnableSsl,
                Credentials = new NetworkCredential(_options.Username, _options.Password),
                Timeout = 10000,
            };

            await client.SendMailAsync(message);
            _logger.LogInformation("邮件已发送：{To}，主题：{Subject}", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "邮件发送失败：{To}，主题：{Subject}", to, subject);
        }
    }
}
