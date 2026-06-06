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

    /// <summary>
    /// SMTP 是否已配置
    /// </summary>
    public bool IsConfigured => _options.IsConfigured;
}

/// <summary>
/// 邮件模板 — 生成告警、工单等通知的 HTML 邮件内容
/// </summary>
public static class EmailTemplates
{
    /// <summary>
    /// 生成告警通知邮件 HTML
    /// </summary>
    public static string AlertNotification(string deviceName, string metric, string severity, string value, string? suggestion = null)
    {
        var severityColor = severity switch
        {
            "Critical" => "#dc2626",
            "Warning" => "#f59e0b",
            _ => "#3b82f6",
        };

        return $@"
<!DOCTYPE html>
<html><body style='font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
<div style='border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;'>
  <div style='background: {severityColor}; color: white; padding: 16px 20px;'>
    <h2 style='margin:0;'>EquipSense 告警通知</h2>
  </div>
  <div style='padding: 20px;'>
    <table style='width:100%; border-collapse:collapse;'>
      <tr><td style='padding:8px 0; color:#6b7280;'>设备名称</td><td style='padding:8px 0; font-weight:600;'>{deviceName}</td></tr>
      <tr><td style='padding:8px 0; color:#6b7280;'>监控指标</td><td style='padding:8px 0; font-weight:600;'>{metric}</td></tr>
      <tr><td style='padding:8px 0; color:#6b7280;'>告警级别</td><td style='padding:8px 0;'><span style='color:{severityColor}; font-weight:600;'>{severity}</span></td></tr>
      <tr><td style='padding:8px 0; color:#6b7280;'>当前值</td><td style='padding:8px 0; font-weight:600;'>{value}</td></tr>
    </table>
    {(suggestion != null ? $"<div style='margin-top:16px; padding:12px; background:#f0f9ff; border-radius:6px;'><strong>处理建议：</strong>{suggestion}</div>" : "")}
  </div>
  <div style='padding:12px 20px; background:#f9fafb; font-size:12px; color:#9ca3af;'>
    此邮件由 EquipSense 系统自动发送，请勿回复
  </div>
</div>
</body></html>";
    }

    /// <summary>
    /// 生成工单通知邮件 HTML
    /// </summary>
    public static string WorkOrderNotification(string orderTitle, string action, string assignee, string? description = null)
    {
        return $@"
<!DOCTYPE html>
<html><body style='font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
<div style='border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;'>
  <div style='background: #3b82f6; color: white; padding: 16px 20px;'>
    <h2 style='margin:0;'>EquipSense 工单通知</h2>
  </div>
  <div style='padding: 20px;'>
    <table style='width:100%; border-collapse:collapse;'>
      <tr><td style='padding:8px 0; color:#6b7280;'>工单标题</td><td style='padding:8px 0; font-weight:600;'>{orderTitle}</td></tr>
      <tr><td style='padding:8px 0; color:#6b7280;'>操作</td><td style='padding:8px 0; font-weight:600;'>{action}</td></tr>
      <tr><td style='padding:8px 0; color:#6b7280;'>负责人</td><td style='padding:8px 0; font-weight:600;'>{assignee}</td></tr>
    </table>
    {(description != null ? $"<div style='margin-top:16px; padding:12px; background:#f0f9ff; border-radius:6px;'><strong>描述：</strong>{description}</div>" : "")}
  </div>
  <div style='padding:12px 20px; background:#f9fafb; font-size:12px; color:#9ca3af;'>
    此邮件由 EquipSense 系统自动发送，请勿回复
  </div>
</div>
</body></html>";
    }
}
