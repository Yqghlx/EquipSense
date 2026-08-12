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

    /// <summary>
    /// 初始化可注入聊天服务的实例，供单元测试验证取消与超时边界。
    /// </summary>
    /// <param name="chatService">聊天完成服务替身。</param>
    /// <param name="logger">日志记录器。</param>
    /// <param name="apiKey">用于启用调用路径的测试密钥。</param>
    /// <param name="timeoutSeconds">请求超时时间（秒）。</param>
    internal SemanticKernelLLMService(
        IChatCompletionService chatService,
        ILogger<SemanticKernelLLMService> logger,
        string apiKey,
        int timeoutSeconds)
    {
        _chatService = chatService ?? throw new ArgumentNullException(nameof(chatService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _apiKey = apiKey;
        _timeoutSeconds = timeoutSeconds;
    }

    /// <inheritdoc />
    /// LLM 已配置（ApiKey 非空）即视为启用；未配置时上层降级规则匹配，属合法状态
    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

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
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // 调用方或宿主主动取消必须继续传播，不能伪装成 LLM 超时并触发后续业务降级。
            throw;
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
