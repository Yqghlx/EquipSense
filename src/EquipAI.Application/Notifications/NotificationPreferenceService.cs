using System.Text.Json;
using System.Text.Json.Serialization;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Notifications;

/// <summary>
/// 通知偏好设置强类型模型
/// 结构：按通知类型 → 渠道开关映射
/// </summary>
public class NotificationPreferences
{
    /// <summary>
    /// 告警通知偏好
    /// </summary>
    [JsonPropertyName("alert")]
    public ChannelPreference Alert { get; set; } = new();

    /// <summary>
    /// 工单通知偏好
    /// </summary>
    [JsonPropertyName("workorder")]
    public ChannelPreference WorkOrder { get; set; } = new();

    /// <summary>
    /// 系统通知偏好
    /// </summary>
    [JsonPropertyName("system")]
    public ChannelPreference System { get; set; } = new();

    /// <summary>
    /// 获取指定通知类型的渠道偏好
    /// </summary>
    public ChannelPreference GetByType(string notificationType) => notificationType.ToLowerInvariant() switch
    {
        "alert" => Alert,
        "workorder" or "work_order" => WorkOrder,
        _ => System,
    };
}

/// <summary>
/// 渠道偏好 — 控制每个通知渠道的开关
/// </summary>
public class ChannelPreference
{
    /// <summary>
    /// SignalR 实时推送（默认开启）
    /// </summary>
    [JsonPropertyName("signalr")]
    public bool SignalR { get; set; } = true;

    /// <summary>
    /// Web Push 浏览器推送（默认开启）
    /// </summary>
    [JsonPropertyName("push")]
    public bool Push { get; set; } = true;

    /// <summary>
    /// 邮件通知（默认关闭，需要配置 SMTP）
    /// </summary>
    [JsonPropertyName("email")]
    public bool Email { get; set; } = false;
}

/// <summary>
/// 通知偏好设置服务 — 读写用户的 NotificationPrefs JSONB 字段
/// </summary>
public class NotificationPreferenceService
{
    private readonly AppDbContext _db;
    private readonly ILogger<NotificationPreferenceService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public NotificationPreferenceService(AppDbContext db, ILogger<NotificationPreferenceService> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// 获取用户通知偏好
    /// </summary>
    public async Task<NotificationPreferences> GetAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) return new NotificationPreferences();

        return ParsePrefs(user.NotificationPrefs);
    }

    /// <summary>
    /// 更新用户通知偏好
    /// </summary>
    public async Task<NotificationPreferences> UpdateAsync(Guid userId, NotificationPreferences prefs, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user == null) throw new KeyNotFoundException("用户不存在");

        user.NotificationPrefs = JsonSerializer.Serialize(prefs, JsonOptions);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("用户 {UserId} 更新了通知偏好", userId);
        return prefs;
    }

    /// <summary>
    /// 检查用户是否启用了指定通知类型和渠道
    /// </summary>
    public async Task<bool> IsEnabledAsync(Guid userId, string notificationType, string channel, CancellationToken ct = default)
    {
        var prefs = await GetAsync(userId, ct);
        var channelPrefs = prefs.GetByType(notificationType);

        return channel.ToLowerInvariant() switch
        {
            "signalr" => channelPrefs.SignalR,
            "push" => channelPrefs.Push,
            "email" => channelPrefs.Email,
            _ => true, // 未知渠道默认开启
        };
    }

    /// <summary>
    /// 解析 JSONB 字符串为强类型偏好对象
    /// </summary>
    private static NotificationPreferences ParsePrefs(string json)
    {
        if (string.IsNullOrWhiteSpace(json) || json == "{}")
            return new NotificationPreferences();

        try
        {
            return JsonSerializer.Deserialize<NotificationPreferences>(json, JsonOptions) ?? new NotificationPreferences();
        }
        catch
        {
            return new NotificationPreferences();
        }
    }
}
