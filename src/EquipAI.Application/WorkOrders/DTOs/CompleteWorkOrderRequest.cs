namespace EquipAI.Application.WorkOrders.DTOs;

/// <summary>
/// 完成工单请求
/// </summary>
public class CompleteWorkOrderRequest
{
    /// <summary>
    /// 解决措施
    /// </summary>
    public string Resolution { get; set; } = string.Empty;

    /// <summary>
    /// 维修执行报告（详细维修过程）。知识沉淀生成故障案例 Solution 时优先使用本字段，为空则降级到 Resolution。
    /// 原为死字段（完成/提交工单时从不写入，详见回归 #252）。
    /// </summary>
    public string? ExecutionReport { get; set; }

    /// <summary>
    /// 使用零件（JSON 数组字符串）。知识沉淀记入故障案例 PartsUsed，并供备件成本核算。
    /// 原为死字段（完成/提交工单时从不写入，详见回归 #252）。
    /// </summary>
    public string? RequiredParts { get; set; }
}
