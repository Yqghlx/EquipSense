using System.Text.Json;
using System.Text.Json.Serialization;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
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
    /// 获取指定通知类型的渠道偏好（仅服务内部使用，外部消费者应通过 IsEnabledAsync 判断）
    /// </summary>
    internal ChannelPreference GetByType(string notificationType) => notificationType.ToLowerInvariant() switch
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
    /// <summary>偏好筛选单批最多读取的用户数，避免调用方传入超大候选集合。</summary>
    private const int PreferenceBatchSize = 500;

    private readonly AppDbContext _db;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<NotificationPreferenceService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public NotificationPreferenceService(
        AppDbContext db,
        ITenantContext tenantContext,
        ILogger<NotificationPreferenceService> logger)
    {
        _db = db;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// 获取用户通知偏好
    /// </summary>
    public async Task<NotificationPreferences> GetAsync(Guid userId, CancellationToken ct = default)
    {
        EnsureSelfServiceScope(userId);

        var user = await _db.Users
            .FirstOrDefaultAsync(
                candidate => candidate.Id == userId && candidate.TenantId == _tenantContext.TenantId,
                ct);
        if (user == null) return new NotificationPreferences();

        return Normalize(ParsePrefs(user.NotificationPrefs));
    }

    /// <summary>
    /// 更新用户通知偏好
    /// </summary>
    public async Task<NotificationPreferences> UpdateAsync(Guid userId, NotificationPreferences prefs, CancellationToken ct = default)
    {
        EnsureSelfServiceScope(userId);

        var user = await _db.Users
            .FirstOrDefaultAsync(
                candidate => candidate.Id == userId && candidate.TenantId == _tenantContext.TenantId,
                ct);
        if (user == null) throw new KeyNotFoundException("用户不存在");

        var normalized = Normalize(prefs);
        user.NotificationPrefs = JsonSerializer.Serialize(normalized, JsonOptions);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("用户 {UserId} 更新了通知偏好", userId);
        return normalized;
    }

    /// <summary>
    /// 校验自助偏好设置只能操作当前认证用户所在租户的账号。
    ///
    /// 为什么：控制器当前从租户上下文传入 userId，但应用服务可能被其他入口复用；
    /// 在服务边界再次绑定身份，可避免错误参数让一个用户读取或修改同租户其他用户的偏好。
    /// 后台通知分发使用 GetEnabledUserIdsAsync 的显式租户/候选用户路径，不复用此校验。
    /// </summary>
    private void EnsureSelfServiceScope(Guid userId)
    {
        if (_tenantContext.TenantId == Guid.Empty
            || _tenantContext.UserId == Guid.Empty
            || userId == Guid.Empty
            || userId != _tenantContext.UserId)
        {
            _logger.LogWarning(
                "通知偏好操作被拒绝：用户上下文不匹配，RequestedUserId={RequestedUserId}, CurrentUserId={CurrentUserId}, CurrentTenantId={CurrentTenantId}",
                userId,
                _tenantContext.UserId,
                _tenantContext.TenantId);
            throw new UnauthorizedAccessException("只能操作当前用户的通知偏好");
        }
    }

    /// <summary>
    /// 从候选用户中筛选出已启用指定通知类型和渠道的活动用户。
    /// 查询显式携带租户和候选 ID，避免后台通知分发依赖当前请求的全局租户过滤器。
    /// </summary>
    public async Task<IReadOnlySet<Guid>> GetEnabledUserIdsAsync(
        Guid tenantId,
        IReadOnlyCollection<Guid> candidateUserIds,
        string notificationType,
        string channel,
        CancellationToken ct = default)
    {
        var candidateIds = candidateUserIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToArray();

        if (tenantId == Guid.Empty || candidateIds.Length == 0)
            return new HashSet<Guid>();

        var enabledUserIds = new HashSet<Guid>();
        for (var offset = 0; offset < candidateIds.Length; offset += PreferenceBatchSize)
        {
            ct.ThrowIfCancellationRequested();

            var candidateBatch = candidateIds
                .Skip(offset)
                .Take(PreferenceBatchSize)
                .ToArray();
            var users = await _db.UnfilteredSet<User>()
                .Where(user => user.TenantId == tenantId
                    && user.IsActive
                    && candidateBatch.Contains(user.Id))
                .Select(user => new { user.Id, user.NotificationPrefs })
                .Take(candidateBatch.Length)
                .ToListAsync(ct);

            foreach (var user in users)
            {
                if (IsEnabled(
                        Normalize(ParsePrefs(user.NotificationPrefs)),
                        notificationType,
                        channel))
                {
                    enabledUserIds.Add(user.Id);
                }
            }
        }

        return enabledUserIds;
    }

    /// <summary>
    /// 检查用户是否启用了指定通知类型和渠道
    /// </summary>
    public async Task<bool> IsEnabledAsync(Guid userId, string notificationType, string channel, CancellationToken ct = default)
    {
        var prefs = await GetAsync(userId, ct);
        return IsEnabled(prefs, notificationType, channel);
    }

    /// <summary>
    /// 统一判断单个偏好对象的渠道状态。
    /// </summary>
    private static bool IsEnabled(NotificationPreferences prefs, string notificationType, string channel)
    {
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

    /// <summary>
    /// 规范化持久化配置：告警邮件已经接入可靠投递队列，工单和系统邮件仍未实现。
    /// 创建新对象而不是修改调用方对象，避免 API 层复用请求对象时产生隐式副作用。
    /// </summary>
    private static NotificationPreferences Normalize(NotificationPreferences prefs)
    {
        return new NotificationPreferences
        {
            Alert = NormalizeChannel(prefs.Alert, allowEmail: true),
            WorkOrder = NormalizeChannel(prefs.WorkOrder, allowEmail: false),
            System = NormalizeChannel(prefs.System, allowEmail: false),
        };
    }

    /// <summary>
    /// 复制单个渠道配置，并按通知类型决定邮件选项是否可用。
    /// </summary>
    private static ChannelPreference NormalizeChannel(ChannelPreference prefs, bool allowEmail)
    {
        return new ChannelPreference
        {
            SignalR = prefs.SignalR,
            Push = prefs.Push,
            Email = allowEmail && prefs.Email,
        };
    }
}
