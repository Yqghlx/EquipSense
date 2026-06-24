namespace EquipAI.Core.Interfaces;

/// <summary>
/// SignalR 实时推送服务接口
/// 定义告警和遥测数据的实时推送能力
/// </summary>
public interface ISignalRNotificationService
{
    /// <summary>
    /// 推送告警触发事件到租户组
    /// </summary>
    Task SendAlertTriggeredAsync(Guid tenantId, Guid alertId, string alertCode,
        Guid deviceId, string metric, double value, string severity);

    /// <summary>
    /// 推送遥测数据更新到租户组
    /// </summary>
    Task SendTelemetryUpdateAsync(Guid tenantId, Guid deviceId, string metric, double value);

    /// <summary>
    /// 推送告警解决事件到租户组
    /// </summary>
    Task SendAlertResolvedAsync(Guid tenantId, Guid alertId);

    /// <summary>
    /// 推送工单创建事件到租户组
    /// </summary>
    Task SendWorkOrderCreatedAsync(Guid tenantId, Guid workOrderId, Guid deviceId,
        string title, string priority);

    /// <summary>
    /// 推送工单状态变更事件到租户组
    /// </summary>
    Task SendWorkOrderStatusChangedAsync(Guid tenantId, Guid workOrderId,
        string oldStatus, string newStatus);

    /// <summary>
    /// 推送工单 AI 根因分析完成事件到租户组
    ///
    /// 业务意义：告警自动建单后异步触发 AI 根因分析（L1-L4 降级），分析完成后工单详情页须实时
    /// 展示根因与建议。若不推送，用户停留在工单详情页时根因区域一直空白/旧值，必须手动刷新——
    /// 对「告警→自动建单→跳转详情页→等分析」的核心流程体验极差（AI 根因是产品核心卖点）。
    /// 轻量推送：仅 SignalR（在线刷新详情页），不持久化通知/不发 Web Push（分析结果非紧急打扰事项）。
    /// </summary>
    Task SendWorkOrderAnalysisUpdatedAsync(Guid tenantId, Guid workOrderId);

    /// <summary>
    /// 推送 AI 候选规则产生事件到租户组
    ///
    /// 业务意义：告警高置信度分析（RootCauseAnalysisHandler）或工单关闭高置信度沉淀
    /// （KnowledgeCaptureService）自动产生 PendingRule（AI 候选规则）写入 pending_rules，
    /// 等待专家审核。若不推送，停留在「知识库审核」页面的专家看不到新候选（须手动刷新）——
    /// AI 知识自学习闭环实时性缺失，候选规则积压无人知。
    /// 轻量推送：仅 SignalR（在线刷新审核列表），不持久化通知/不发 Web Push（候选规则非紧急打扰事项）。
    /// </summary>
    Task SendPendingRuleCreatedAsync(Guid tenantId);

    /// <summary>
    /// 推送工单 SLA 超时升级事件到租户组
    ///
    /// 业务意义：SLA 超时后系统自动升级优先级，但如果不通知，主管完全不知情。
    /// 此方法确保主管收到推送 + 持久化通知 + Web Push（即使离线也能看到）。
    /// </summary>
    /// <param name="oldPriority">升级前优先级</param>
    /// <param name="newPriority">升级后优先级</param>
    Task SendWorkOrderEscalatedAsync(Guid tenantId, Guid workOrderId, string workOrderCode,
        string title, string oldPriority, string newPriority);

    /// <summary>
    /// 推送设备离线事件到租户组
    ///
    /// 业务意义：设备超过阈值无遥测即视为通信中断（设备故障/网络故障/网关故障），
    /// 是工业监控的基本告警。若不通知，运维完全不知情——设备离线不产生遥测，
    /// 不触发阈值告警，故必须有独立离线通知。此方法确保运维收到推送 + 持久化通知 + Web Push。
    /// </summary>
    Task SendDeviceOfflineAsync(Guid tenantId, Guid deviceId, string deviceCode, string deviceName);

    /// <summary>
    /// 推送网关离线事件到租户组
    ///
    /// 业务意义：网关是数据采集入口，离线=该网关下所有设备数据断，是 P0 工业事件（比单设备离线更严重，
    /// 影响整条产线/整个车间）。GatewayHeartbeatMonitor 检测到心跳超时即标记 offline，但若不通知，
    /// 运维完全不知情（直到手动查看网关列表）——数据采集已断而无人响应。此方法确保运维收到推送 +
    /// 持久化通知 + Web Push（与设备离线 #232 对称）。
    /// </summary>
    Task SendGatewayOfflineAsync(Guid tenantId, Guid gatewayId, string gatewayCode, string gatewayName);
}
