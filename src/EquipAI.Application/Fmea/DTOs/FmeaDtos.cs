using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.Fmea.DTOs;

/// <summary>
/// FMEA 故障模式响应 DTO
/// </summary>
public class FmeaEntryResponse
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    public string FailureMode { get; set; } = string.Empty;
    public string Cause { get; set; } = string.Empty;
    public string Effect { get; set; } = string.Empty;
    public string Detection { get; set; } = string.Empty;
    public string RecommendedAction { get; set; } = string.Empty;
    public int Severity { get; set; }
    public int Occurrence { get; set; }
    public int Detectability { get; set; }
    public int Rpn { get; set; }
    public Guid? KnowledgeRuleId { get; set; }
    public Guid CreatedBy { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// 创建 FMEA 条目请求
/// </summary>
public class CreateFmeaEntryRequest
{
    [Required]
    [StringLength(100)]
    public string DeviceType { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string FailureMode { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Cause { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Effect { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Detection { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string RecommendedAction { get; set; } = string.Empty;

    [Range(1, 10)]
    public int Severity { get; set; }

    [Range(1, 10)]
    public int Occurrence { get; set; }

    [Range(1, 10)]
    public int Detectability { get; set; }

    public Guid? KnowledgeRuleId { get; set; }
}

/// <summary>
/// 更新 FMEA 条目请求
/// </summary>
public class UpdateFmeaEntryRequest : CreateFmeaEntryRequest
{
}
