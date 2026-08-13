using System.Net;
using EquipAI.Core.Entities;

namespace EquipAI.Application.Notifications;

/// <summary>
/// 告警邮件 HTML 模板渲染器。
/// </summary>
public static class AlertEmailTemplateRenderer
{
    /// <summary>
    /// 将站内通知渲染为安全的告警邮件正文。
    /// </summary>
    /// <param name="notification">站内通知</param>
    /// <param name="language">用户语言，当前支持 zh-CN 和 en-US 文案</param>
    public static string Render(Notification notification, string? language)
    {
        var isEnglish = string.Equals(language, "en-US", StringComparison.OrdinalIgnoreCase);
        var title = WebUtility.HtmlEncode(notification.Title);
        var content = WebUtility.HtmlEncode(notification.Content ?? string.Empty)
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace("\n", "<br />", StringComparison.Ordinal);
        var link = WebUtility.HtmlEncode(GetSafeRelativeLink(notification.Link));
        var linkText = isEnglish ? "Open alert in EquipSense" : "在 EquipSense 中查看告警";

        return $"""
            <!doctype html>
            <html lang="{(isEnglish ? "en" : "zh-CN")}">
              <body style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.6;color:#1f2937">
                <h2>{title}</h2>
                <p>{content}</p>
                <p><a href="{link}">{linkText}</a></p>
                <hr />
                <p style="color:#6b7280;font-size:12px">EquipSense</p>
              </body>
            </html>
            """;
    }

    /// <summary>
    /// 邮件链接只允许应用内部绝对路径，避免通知字段被利用为 javascript/data 链接。
    /// </summary>
    private static string GetSafeRelativeLink(string? link)
    {
        if (string.IsNullOrWhiteSpace(link)
            || !link.StartsWith("/", StringComparison.Ordinal)
            || link.StartsWith("//", StringComparison.Ordinal)
            || link.Contains('\r')
            || link.Contains('\n'))
        {
            return "/";
        }

        return link;
    }
}
