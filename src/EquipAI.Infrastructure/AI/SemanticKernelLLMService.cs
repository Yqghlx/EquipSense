using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace EquipAI.Infrastructure.AI;

/// <summary>
/// 基于 Semantic Kernel 的 LLM 服务实现
/// 通过 OpenAI 兼容接口连接 DashScope（通义千问）
/// 支持 30 秒超时和错误降级
/// </summary>
public class SemanticKernelLLMService : ILLMService
{
    private readonly IChatCompletionService _chatService;
    private readonly ILogger<SemanticKernelLLMService> _logger;
    private readonly int _timeoutSeconds;
    // 缓存 ApiKey 用于 AnalyzeAsync 快速失败检测
    // 没配 ApiKey 时直接返回错误，避免每次都发 HTTP 请求再等 401 响应（实测每次浪费 ~4s）
    private readonly string _apiKey;

    public SemanticKernelLLMService(IConfiguration configuration, ILogger<SemanticKernelLLMService> logger)
    {
        _logger = logger;
        _timeoutSeconds = configuration.GetValue("Llm:TimeoutSeconds", 30);

        _apiKey = configuration["Llm:ApiKey"] ?? "";
        var modelId = configuration["Llm:ModelId"] ?? "qwen-plus";
        var endpoint = configuration["Llm:Endpoint"] ?? "https://dashscope.aliyuncs.com/compatible-mode/v1";

        var builder = Kernel.CreateBuilder();
        builder.AddOpenAIChatCompletion(
            modelId: modelId,
            apiKey: _apiKey,
            endpoint: new Uri(endpoint));
        var kernel = builder.Build();
        _chatService = kernel.GetRequiredService<IChatCompletionService>();
    }

    /// <inheritdoc />
    public async Task<LLMResponse> AnalyzeAsync(LLMRequest request, CancellationToken ct = default)
    {
        // 未配置 ApiKey 时立即失败，跳过 HTTP 往返
        // 上层调用方（RootCauseAnalysisHandler）会降级为规则匹配，不影响业务功能
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            return new LLMResponse("", null, false, "未配置 LLM ApiKey（Llm:ApiKey），跳过 LLM 调用");
        }

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(_timeoutSeconds));

        try
        {
            var chatHistory = new ChatHistory();
            chatHistory.AddSystemMessage(request.SystemPrompt);
            chatHistory.AddUserMessage(request.UserPrompt);

            var response = await _chatService.GetChatMessageContentAsync(chatHistory, cancellationToken: cts.Token);

            _logger.LogInformation("LLM 响应成功，长度: {Length}", response.Content?.Length ?? 0);

            return new LLMResponse(
                Content: response.Content ?? "",
                Confidence: null,
                Success: true,
                ErrorMessage: null);
        }
        catch (OperationCanceledException) when (cts.Token.IsCancellationRequested)
        {
            _logger.LogWarning("LLM 请求超时（{Timeout}s）", _timeoutSeconds);
            return new LLMResponse("", null, false, $"请求超时（{_timeoutSeconds}秒）");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LLM 请求失败");
            return new LLMResponse("", null, false, ex.Message);
        }
    }
}
