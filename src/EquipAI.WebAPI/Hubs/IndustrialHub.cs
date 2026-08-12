using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EquipAI.WebAPI.Hubs;

/// <summary>
/// 工业设备实时推送 Hub
/// 已认证用户连接后自动加入其租户组和租户内用户组，断开时自动清理。
/// 租户隔离通过 SignalR Group 实现：tenant:{tenantId}；用户定向通知使用
/// tenant:{tenantId}:user:{userId}，避免同租户用户相互收到私有通知。
/// </summary>
[Authorize]
public class IndustrialHub : Hub
{
    private readonly ITenantContext _tenantContext;

    public IndustrialHub(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 客户端连接时，自动加入其所属租户的 SignalR 组
    /// 租户 ID 从 JWT Token 中解析
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var tenantId = _tenantContext.TenantId;
        if (tenantId != Guid.Empty)
        {
            var cancellationToken = Context.ConnectionAborted;
            await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant:{tenantId}", cancellationToken);

            var userId = _tenantContext.UserId;
            if (userId != Guid.Empty)
            {
                await Groups.AddToGroupAsync(
                    Context.ConnectionId,
                    GetUserGroupName(tenantId, userId),
                    cancellationToken);
            }
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// 客户端断开时，自动从租户组中移除
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var tenantId = _tenantContext.TenantId;
        if (tenantId != Guid.Empty)
        {
            var cancellationToken = Context.ConnectionAborted;
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"tenant:{tenantId}", cancellationToken);

            var userId = _tenantContext.UserId;
            if (userId != Guid.Empty)
            {
                await Groups.RemoveFromGroupAsync(
                    Context.ConnectionId,
                    GetUserGroupName(tenantId, userId),
                    cancellationToken);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// 构造租户限定的用户组名称，防止相同用户 ID 在不同租户间发生组名碰撞。
    /// </summary>
    private static string GetUserGroupName(Guid tenantId, Guid userId)
        => $"tenant:{tenantId}:user:{userId}";
}
