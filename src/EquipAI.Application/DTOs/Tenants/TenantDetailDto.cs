namespace EquipAI.Application.DTOs.Tenants;

/// <summary>
/// 租户详情 DTO，包含基础信息 + 资源用量统计
/// </summary>
public class TenantDetailDto : TenantDto
{
    /// <summary>活跃告警数</summary>
    public int ActiveAlertCount { get; set; }

    /// <summary>待处理工单数</summary>
    public int PendingWorkOrderCount { get; set; }

    /// <summary>本月 AI 分析次数</summary>
    public int MonthlyAnalysisCount { get; set; }

    /// <summary>管理员用户名</summary>
    public string AdminUsername { get; set; } = string.Empty;

    /// <summary>管理员邮箱</summary>
    public string? AdminEmail { get; set; }
}
