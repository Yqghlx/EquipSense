namespace EquipAI.Application.DTOs.Common;

/// <summary>
/// 统一错误响应 DTO，API 异常时返回此结构
/// </summary>
public class ErrorResponse
{
    /// <summary>
    /// 错误代码（如 "VALIDATION_ERROR"、"NOT_FOUND" 等）
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// 面向用户的错误描述信息
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// 错误详细信息（如验证错误列表、异常堆栈等）
    /// </summary>
    public object? Details { get; set; }
}
