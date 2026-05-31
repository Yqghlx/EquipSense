using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;

namespace EquipAI.Core.Events;

/// <summary>
/// 分析完成事件，由 RootCauseAnalysisEngine 在分析完成后发布
/// 供工单模块更新根因信息
/// </summary>
public record AnalysisCompletedEvent(
    Guid EventId,
    DateTime OccurredAt,
    Guid TenantId,
    Guid AnalysisId,
    Guid AlertId,
    Guid DeviceId,
    string Metric,
    AnalysisLevel Level,
    double? Confidence,
    string? RootCause,
    string? Suggestion
) : IIntegrationEvent;
