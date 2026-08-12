using EquipAI.Infrastructure.AI;
using EquipAI.Core.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Moq;

namespace EquipAI.Tests.Unit.Infrastructure;

/// <summary>
/// LLM 调用取消与超时边界测试。
/// </summary>
public sealed class SemanticKernelLLMServiceTests
{
    [Fact]
    public async Task AnalyzeAsync_调用方取消时应继续传播取消而不是伪装成超时响应()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        var chatService = new Mock<IChatCompletionService>();
        chatService
            .Setup(service => service.GetChatMessageContentsAsync(
                It.IsAny<ChatHistory>(),
                It.IsAny<PromptExecutionSettings?>(),
                It.IsAny<Kernel?>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException(cts.Token));

        var service = new SemanticKernelLLMService(
            chatService.Object,
            NullLogger<SemanticKernelLLMService>.Instance,
            "test-api-key",
            timeoutSeconds: 30);

        var action = () => service.AnalyzeAsync(
            new LLMRequest("系统提示", "用户提示"),
            cts.Token);

        await action.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task AnalyzeAsync_服务自身超时时应返回可降级响应()
    {
        var chatService = new Mock<IChatCompletionService>();
        chatService
            .Setup(service => service.GetChatMessageContentsAsync(
                It.IsAny<ChatHistory>(),
                It.IsAny<PromptExecutionSettings?>(),
                It.IsAny<Kernel?>(),
                It.IsAny<CancellationToken>()))
            .Returns(async (
                ChatHistory _,
                PromptExecutionSettings? _,
                Kernel? _,
                CancellationToken cancellationToken) =>
            {
                await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
                return (IReadOnlyList<ChatMessageContent>)Array.Empty<ChatMessageContent>();
            });

        var service = new SemanticKernelLLMService(
            chatService.Object,
            NullLogger<SemanticKernelLLMService>.Instance,
            "test-api-key",
            timeoutSeconds: 0);

        var response = await service.AnalyzeAsync(new LLMRequest("系统提示", "用户提示"));

        response.Success.Should().BeFalse();
        response.ErrorMessage.Should().Contain("请求超时");
    }
}
