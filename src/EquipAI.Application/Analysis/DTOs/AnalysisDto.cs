namespace EquipAI.Application.Analysis.DTOs;

/// <summary>
/// 分析结果 DTO
/// </summary>
public class AnalysisDto
{
    public Guid Id { get; set; }
    public Guid AlertId { get; set; }
    public Guid DeviceId { get; set; }
    public string Level { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double? Confidence { get; set; }
    public double? DataQualityScore { get; set; }
    public string? RootCause { get; set; }
    public string? Suggestion { get; set; }
    public long? ProcessingTimeMs { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
