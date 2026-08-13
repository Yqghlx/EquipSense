using System.ComponentModel.DataAnnotations;

namespace EquipAI.Application.Fmea.DTOs;

/// <summary>
/// FMEA 表单可选的知识规则摘要。
/// 只暴露选择器所需的最小字段，避免把规则条件和诊断结论扩散到不必要的页面。
/// </summary>
public class FmeaKnowledgeRuleOptionResponse
{
    /// <summary>知识规则 ID。</summary>
    public Guid Id { get; set; }

    /// <summary>规则适用的设备类型。</summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>规则名称。</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>规则是否启用。</summary>
    public bool Enabled { get; set; }

    /// <summary>是否为系统租户提供的行业预置规则。</summary>
    public bool IsSystemPreset { get; set; }
}

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
