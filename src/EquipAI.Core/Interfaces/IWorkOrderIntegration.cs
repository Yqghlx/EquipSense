using EquipAI.Core.Enums;

namespace EquipAI.Core.Interfaces;

/// <summary>
/// 工单外部系统集成接口
/// 工单状态变更时通过此接口推送信息到外部系统（钉钉、飞书、Webhook 等）
/// </summary>
public interface IWorkOrderIntegration
{
    /// <summary>
    /// 集成类型标识（如 "webhook"、"dingtalk"、"feishu"）
    /// </summary>
    string IntegrationType { get; }

    /// <summary>
    /// 推送工单创建通知到外部系统
    /// </summary>
    Task<string?> PushCreatedAsync(Guid tenantId, Guid workOrderId, string title, string priority, string config, CancellationToken ct = default);

    /// <summary>
    /// 推送工单状态变更到外部系统
    /// 返回值表示外部系统是否返回成功响应；普通外部故障由适配器转换为 false，取消信号继续传播
    /// </summary>
    Task<bool> PushStatusChangedAsync(Guid tenantId, Guid workOrderId, string status, string? externalId, string config, CancellationToken ct = default);
}
