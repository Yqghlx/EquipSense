using EquipAI.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EquipAI.WebAPI.Hubs;

/// <summary>
/// 工业设备实时推送 Hub
/// 已认证用户连接后自动加入其租户组，断开时自动清理
/// 租户隔离通过 SignalR Group 实现：tenant:{tenantId}
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
            await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant:{tenantId}");
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
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"tenant:{tenantId}");
        }

        await base.OnDisconnectedAsync(exception);
    }
}
