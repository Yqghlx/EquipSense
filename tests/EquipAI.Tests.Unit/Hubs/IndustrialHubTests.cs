using EquipAI.Core.Interfaces;
using EquipAI.WebAPI.Hubs;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;

namespace EquipAI.Tests.Unit.Hubs;

/// <summary>
/// IndustrialHub 单元测试
/// 验证 SignalR Hub 的租户组管理逻辑：
/// - 连接时自动加入 tenant:{tenantId} 组
/// - 断开时自动从 tenant:{tenantId} 组移除
/// - 异常断开时也能正确移除
/// </summary>
public class IndustrialHubTests : IDisposable
{
    private readonly Mock<ITenantContext> _tenantContextMock;
    private readonly Mock<IGroupManager> _groupsMock;
    private readonly Mock<HubCallerContext> _callerContextMock;
    private readonly IndustrialHub _hub;

    public IndustrialHubTests()
    {
        _tenantContextMock = new Mock<ITenantContext>();
        _groupsMock = new Mock<IGroupManager>();
        _callerContextMock = new Mock<HubCallerContext>();

        // 创建 Hub 实例并注入依赖
        _hub = new IndustrialHub(_tenantContextMock.Object)
        {
            Context = _callerContextMock.Object,
            Groups = _groupsMock.Object
        };
    }

    /// <summary>
    /// 测试结束后释放 Hub 资源
    /// </summary>
    public void Dispose()
    {
        _hub.Dispose();
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// 验证：有效租户 ID 的客户端连接时，应将其加入 tenant:{tenantId} 组
    /// </summary>
    [Fact]
    public async Task OnConnectedAsync_有效租户Id_应将连接加入租户组()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var connectionId = "connection-123";

        _tenantContextMock.SetupGet(t => t.TenantId).Returns(tenantId);
        _callerContextMock.SetupGet(c => c.ConnectionId).Returns(connectionId);

        _groupsMock
            .Setup(g => g.AddToGroupAsync(connectionId, $"tenant:{tenantId}", default))
            .Returns(Task.CompletedTask);

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsMock.Verify(
            g => g.AddToGroupAsync(connectionId, $"tenant:{tenantId}", default),
            Times.Once,
            "连接时应将客户端加入对应的租户组");
    }

    /// <summary>
    /// 验证：租户 ID 为空（Guid.Empty）时，不应将连接加入任何组
    /// </summary>
    [Fact]
    public async Task OnConnectedAsync_租户Id为空_不应加入任何组()
    {
        // Arrange
        _tenantContextMock.SetupGet(t => t.TenantId).Returns(Guid.Empty);
        _callerContextMock.SetupGet(c => c.ConnectionId).Returns("connection-456");

        // Act
        await _hub.OnConnectedAsync();

        // Assert
        _groupsMock.Verify(
            g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "租户 ID 为空时不应执行任何组操作");
    }

    /// <summary>
    /// 验证：有效租户 ID 的客户端断开连接时，应将其从 tenant:{tenantId} 组移除
    /// </summary>
    [Fact]
    public async Task OnDisconnectedAsync_有效租户Id_应将连接从租户组移除()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var connectionId = "connection-789";

        _tenantContextMock.SetupGet(t => t.TenantId).Returns(tenantId);
        _callerContextMock.SetupGet(c => c.ConnectionId).Returns(connectionId);

        _groupsMock
            .Setup(g => g.RemoveFromGroupAsync(connectionId, $"tenant:{tenantId}", default))
            .Returns(Task.CompletedTask);

        // Act
        await _hub.OnDisconnectedAsync(exception: null);

        // Assert
        _groupsMock.Verify(
            g => g.RemoveFromGroupAsync(connectionId, $"tenant:{tenantId}", default),
            Times.Once,
            "断开连接时应将客户端从租户组中移除");
    }

    /// <summary>
    /// 验证：租户 ID 为空（Guid.Empty）时断开连接，不应执行任何组移除操作
    /// </summary>
    [Fact]
    public async Task OnDisconnectedAsync_租户Id为空_不应执行组移除()
    {
        // Arrange
        _tenantContextMock.SetupGet(t => t.TenantId).Returns(Guid.Empty);
        _callerContextMock.SetupGet(c => c.ConnectionId).Returns("connection-empty");

        // Act
        await _hub.OnDisconnectedAsync(exception: null);

        // Assert
        _groupsMock.Verify(
            g => g.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "租户 ID 为空时断开连接不应执行任何组移除操作");
    }

    /// <summary>
    /// 验证：即使传入异常参数（非正常断开），仍应将连接从租户组移除
    /// 确保异常断开时也能正确清理组资源
    /// </summary>
    [Fact]
    public async Task OnDisconnectedAsync_带有异常参数_仍应将连接从租户组移除()
    {
        // Arrange
        var tenantId = Guid.NewGuid();
        var connectionId = "connection-abnormal";

        _tenantContextMock.SetupGet(t => t.TenantId).Returns(tenantId);
        _callerContextMock.SetupGet(c => c.ConnectionId).Returns(connectionId);

        _groupsMock
            .Setup(g => g.RemoveFromGroupAsync(connectionId, $"tenant:{tenantId}", default))
            .Returns(Task.CompletedTask);

        // 模拟异常断开场景
        var disconnectException = new Exception("客户端连接超时断开");

        // Act
        await _hub.OnDisconnectedAsync(disconnectException);

        // Assert
        _groupsMock.Verify(
            g => g.RemoveFromGroupAsync(connectionId, $"tenant:{tenantId}", default),
            Times.Once,
            "异常断开时也应将客户端从租户组中正确移除");
    }
}
