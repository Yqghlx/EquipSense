using System.IO;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using FluentAssertions;
using EquipAI.Infrastructure.Middleware;

namespace EquipAI.Tests.Unit.Middleware;

/// <summary>
/// ExceptionHandlingMiddleware 单元测试
/// 验证全局异常处理中间件对各类异常的正确映射和标准化响应格式
/// </summary>
public class ExceptionHandlingMiddlewareTests
{
    /// <summary>
    /// 模拟的日志记录器，用于构造中间件实例
    /// </summary>
    private readonly Mock<ILogger<ExceptionHandlingMiddleware>> _mockLogger;

    /// <summary>
    /// 默认的 HTTP 上下文，每个测试使用独立的实例
    /// </summary>
    private DefaultHttpContext _context;

    public ExceptionHandlingMiddlewareTests()
    {
        _mockLogger = new Mock<ILogger<ExceptionHandlingMiddleware>>();
        _context = CreateHttpContext();
    }

    /// <summary>
    /// 辅助方法：创建一个带有内存响应流的 DefaultHttpContext
    /// </summary>
    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        context.Request.Path = "/api/v1/test";
        return context;
    }

    /// <summary>
    /// 辅助方法：执行中间件并返回反序列化后的响应体
    /// </summary>
    /// <param name="nextBehavior">下一个中间件的行为（正常完成或抛出异常）</param>
    /// <returns>反序列化的错误响应对象</returns>
    private async Task<JsonElement> ExecuteMiddlewareAsync(Action<Mock<RequestDelegate>> nextBehavior)
    {
        var mockNext = new Mock<RequestDelegate>();
        nextBehavior(mockNext);

        var middleware = new ExceptionHandlingMiddleware(mockNext.Object, _mockLogger.Object);
        await middleware.InvokeAsync(_context);

        // 将响应流重置到起始位置以便读取
        _context.Response.Body.Seek(0, SeekOrigin.Begin);

        using var reader = new StreamReader(_context.Response.Body);
        var responseBody = await reader.ReadToEndAsync();

        return JsonDocument.Parse(responseBody).RootElement;
    }

    #region 无异常场景

    [Fact]
    public async Task 正常请求_应调用下一个中间件且不修改响应()
    {
        // Arrange
        var mockNext = new Mock<RequestDelegate>();
        mockNext
            .Setup(next => next(It.IsAny<HttpContext>()))
            .Returns(Task.CompletedTask);

        var middleware = new ExceptionHandlingMiddleware(mockNext.Object, _mockLogger.Object);

        // Act
        await middleware.InvokeAsync(_context);

        // Assert — 验证下一个中间件被调用且只调用一次
        mockNext.Verify(next => next(_context), Times.Once,
            "无异常时应将请求正常传递给下一个中间件");

        // Assert — 响应状态码应保持默认值（200）
        _context.Response.StatusCode.Should().Be(StatusCodes.Status200OK,
            "无异常时中间件不应修改响应状态码");
    }

    #endregion

    #region UnauthorizedAccessException → 401

    [Fact]
    public async Task UnauthorizedAccessException_应返回401未授权()
    {
        // Act
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new UnauthorizedAccessException("访问令牌无效"));
        });

        // Assert — 验证状态码映射
        _context.Response.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized,
            "UnauthorizedAccessException 应映射为 401");

        // Assert — 验证响应体中的 code 和 message
        response.GetProperty("code").GetInt32().Should().Be((int)HttpStatusCode.Unauthorized);
        response.GetProperty("message").GetString().Should().Be("未授权的访问");
    }

    #endregion

    #region KeyNotFoundException → 404

    [Fact]
    public async Task KeyNotFoundException_应返回404资源不存在()
    {
        // Act
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new KeyNotFoundException("设备 ID 不存在"));
        });

        // Assert — 验证状态码映射
        _context.Response.StatusCode.Should().Be((int)HttpStatusCode.NotFound,
            "KeyNotFoundException 应映射为 404");

        // Assert — 验证响应体中的 code 和 message
        response.GetProperty("code").GetInt32().Should().Be((int)HttpStatusCode.NotFound);
        response.GetProperty("message").GetString().Should().Be("请求的资源不存在");
    }

    #endregion

    #region InvalidOperationException → 409

    [Fact]
    public async Task InvalidOperationException_应返回409操作冲突()
    {
        // Act
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new InvalidOperationException("设备名称已存在"));
        });

        // Assert — 验证状态码映射
        _context.Response.StatusCode.Should().Be((int)HttpStatusCode.Conflict,
            "InvalidOperationException 应映射为 409");

        // Assert — 验证响应体中的 code 和 message
        response.GetProperty("code").GetInt32().Should().Be((int)HttpStatusCode.Conflict);
        response.GetProperty("message").GetString().Should().Be("操作冲突");
    }

    #endregion

    #region ArgumentException → 400

    [Fact]
    public async Task ArgumentException_应返回400请求参数无效()
    {
        // Act
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new ArgumentException("参数格式不正确"));
        });

        // Assert — 验证状态码映射
        _context.Response.StatusCode.Should().Be((int)HttpStatusCode.BadRequest,
            "ArgumentException 应映射为 400");

        // Assert — 验证响应体中的 code 和 message
        response.GetProperty("code").GetInt32().Should().Be((int)HttpStatusCode.BadRequest);
        response.GetProperty("message").GetString().Should().Be("请求参数无效");
    }

    [Fact]
    public async Task ArgumentNullException_作为ArgumentException子类_应返回400()
    {
        // Act — ArgumentNullException 是 ArgumentException 的子类，应被同一分支捕获
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new ArgumentNullException("deviceName", "设备名称不能为空"));
        });

        // Assert — 验证状态码映射
        _context.Response.StatusCode.Should().Be((int)HttpStatusCode.BadRequest,
            "ArgumentNullException 作为 ArgumentException 子类应映射为 400");

        response.GetProperty("code").GetInt32().Should().Be((int)HttpStatusCode.BadRequest);
        response.GetProperty("message").GetString().Should().Be("请求参数无效");
    }

    [Fact]
    public async Task ArgumentOutOfRangeException_作为ArgumentException子类_应返回400()
    {
        // Act — ArgumentOutOfRangeException 是 ArgumentException 的子类
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new ArgumentOutOfRangeException("page", "页码超出范围"));
        });

        // Assert — 验证状态码映射
        _context.Response.StatusCode.Should().Be((int)HttpStatusCode.BadRequest,
            "ArgumentOutOfRangeException 作为 ArgumentException 子类应映射为 400");

        response.GetProperty("code").GetInt32().Should().Be((int)HttpStatusCode.BadRequest);
        response.GetProperty("message").GetString().Should().Be("请求参数无效");
    }

    #endregion

    #region 未知异常 → 500

    [Fact]
    public async Task 未知异常_应返回500服务器内部错误()
    {
        // Act
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new Exception("数据库连接超时"));
        });

        // Assert — 验证状态码映射
        _context.Response.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError,
            "未知异常应映射为 500");

        // Assert — 验证响应体中的 code 和 message
        response.GetProperty("code").GetInt32().Should().Be((int)HttpStatusCode.InternalServerError);
        response.GetProperty("message").GetString().Should().Be("服务器内部错误",
            "未知异常不应泄露内部实现细节");
    }

    [Fact]
    public async Task 未知异常_响应消息不应包含异常原始信息()
    {
        // Act
        const string sensitiveMessage = "数据库连接字符串: Server=prod-db;Password=s3cret!";
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new Exception(sensitiveMessage));
        });

        // Assert — 确保不会将异常的原始消息暴露给客户端
        var message = response.GetProperty("message").GetString()!;
        message.Should().NotContain(sensitiveMessage,
            "响应消息不应包含异常的敏感内部信息");
        message.Should().Be("服务器内部错误",
            "未知异常应返回通用错误消息");
    }

    #endregion

    #region 响应格式验证

    [Fact]
    public async Task 异常响应_应为JSON格式并设置正确的ContentType()
    {
        // Act
        await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new ArgumentException("测试异常"));
        });

        // Assert — 验证 Content-Type 头
        _context.Response.ContentType.Should().Be("application/json",
            "异常响应应为 JSON 格式");
    }

    [Fact]
    public async Task 异常响应体_应包含code和message字段()
    {
        // Act
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new KeyNotFoundException("测试"));
        });

        // Assert — 验证响应体包含必需的字段
        response.TryGetProperty("code", out _).Should().BeTrue("响应体必须包含 code 字段");
        response.TryGetProperty("message", out _).Should().BeTrue("响应体必须包含 message 字段");
    }

    [Fact]
    public async Task 异常响应体_应使用驼峰命名序列化()
    {
        // Act
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new InvalidOperationException("测试"));
        });

        // Assert — 验证 JSON 属性名为驼峰格式（camelCase）
        // JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        // 源码中的匿名对象属性名为 PascalCase（code, message, details），
        // 但由于源码中这些属性名本身就是小写开头，CamelCase 策略不会改变它们
        response.TryGetProperty("code", out _).Should().BeTrue("应包含小写的 code 属性");
        response.TryGetProperty("message", out _).Should().BeTrue("应包含小写的 message 属性");
    }

    [Fact]
    public async Task 异常响应体_details字段应为null()
    {
        // Act
        var response = await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new ArgumentException("测试"));
        });

        // Assert — 源码中 details 被设置为 null
        response.TryGetProperty("details", out var detailsProp).Should().BeTrue("应包含 details 字段");
        detailsProp.ValueKind.Should().Be(JsonValueKind.Null,
            "details 字段应为 null");
    }

    #endregion

    #region 日志记录验证

    [Fact]
    public async Task 客户端异常_应以Warning级别记录日志()
    {
        // Arrange — 捕获日志调用参数
        LogLevel? actualLogLevel = null;
        _mockLogger
            .Setup(x => x.Log(
                It.IsAny<LogLevel>(),
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
            .Callback<LogLevel, EventId, object, Exception, object>(
                (logLevel, _, _, _, _) => actualLogLevel = logLevel);

        // Act — 触发 404 异常
        await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new KeyNotFoundException("测试"));
        });

        // Assert — 4xx 错误应使用 Warning 级别
        actualLogLevel.Should().Be(LogLevel.Warning,
            "4xx 异常应以 Warning 级别记录日志");
    }

    [Fact]
    public async Task 服务端异常_应以Error级别记录日志()
    {
        // Arrange — 捕获日志调用参数
        LogLevel? actualLogLevel = null;
        _mockLogger
            .Setup(x => x.Log(
                It.IsAny<LogLevel>(),
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
            .Callback<LogLevel, EventId, object, Exception, object>(
                (logLevel, _, _, _, _) => actualLogLevel = logLevel);

        // Act — 触发 500 异常
        await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new Exception("未知错误"));
        });

        // Assert — 5xx 错误应使用 Error 级别
        actualLogLevel.Should().Be(LogLevel.Error,
            "5xx 异常应以 Error 级别记录日志");
    }

    [Fact]
    public async Task 异常日志_应包含请求路径信息()
    {
        // Arrange — 捕获日志的状态对象
        object? logState = null;
        _mockLogger
            .Setup(x => x.Log(
                It.IsAny<LogLevel>(),
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
            .Callback<LogLevel, EventId, object, Exception, object>(
                (_, _, state, _, _) => logState = state);

        // Act
        await ExecuteMiddlewareAsync(mockNext =>
        {
            mockNext
                .Setup(next => next(It.IsAny<HttpContext>()))
                .ThrowsAsync(new InvalidOperationException("测试"));
        });

        // Assert — 日志格式化后的内容应包含请求路径
        // 源码中使用结构化日志："{StatusCode} - {Message}，路径：{Path}"
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<InvalidOperationException>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once,
            "异常应记录一次日志");

        // 通过日志格式化函数验证路径信息包含在日志中
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((state, _) => state.ToString()!.Contains("/api/v1/test")),
                It.IsAny<InvalidOperationException>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            "日志内容应包含请求路径");
    }

    #endregion
}
