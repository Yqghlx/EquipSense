using System.Net.Mail;

namespace EquipAI.Application.Notifications;

/// <summary>
/// SMTP 发送器抽象，隔离网络客户端，便于在不访问真实邮件服务器的情况下测试投递逻辑。
/// 调用方负责释放传入的 <see cref="MailMessage"/>。
/// </summary>
public interface ISmtpMailSender
{
    /// <summary>
    /// 将邮件交给 SMTP 服务器发送。
    /// </summary>
    Task SendAsync(MailMessage message, CancellationToken ct = default);
}
