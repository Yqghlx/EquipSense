namespace EquipAI.Application.Analysis.DTOs;

/// <summary>
/// 手动触发分析请求
/// </summary>
public class CreateAnalysisRequest
{
    public Guid AlertId { get; set; }
}
