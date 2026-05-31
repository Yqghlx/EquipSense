namespace EquipAI.Core.Interfaces;

/// <summary>
/// LLM 服务接口，封装大语言模型调用
/// </summary>
public interface ILLMService
{
    /// <summary>
    /// 发送分析请求到 LLM
    /// </summary>
    Task<LLMResponse> AnalyzeAsync(LLMRequest request, CancellationToken ct = default);
}

/// <summary>
/// LLM 请求
/// </summary>
/// <param name="SystemPrompt">系统提示词</param>
/// <param name="UserPrompt">用户提示词</param>
public record LLMRequest(string SystemPrompt, string UserPrompt);

/// <summary>
/// LLM 响应
/// </summary>
/// <param name="Content">响应内容</param>
/// <param name="Confidence">置信度</param>
/// <param name="Success">是否成功</param>
/// <param name="ErrorMessage">错误信息</param>
public record LLMResponse(string Content, double? Confidence, bool Success, string? ErrorMessage);
