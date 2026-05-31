namespace EquipAI.Core.Enums;

/// <summary>
/// 工单运行模式枚举，支持三种可插拔模式
/// </summary>
public enum WorkOrderMode
{
    /// <summary>独立模式 — 平台内置完整工单流程</summary>
    Independent,

    /// <summary>集成中枢模式 — 对接外部工单系统（如 Maximo）</summary>
    IntegrationHub,

    /// <summary>纯触发器模式 — 仅发送 Webhook/消息通知</summary>
    TriggerOnly
}
