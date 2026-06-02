using EquipAI.Application.Alerts.Handlers;
using EquipAI.Application.Analysis.Handlers;
using EquipAI.Application.Knowledge;
using EquipAI.Application.WorkOrders.Handlers;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.HealthChecks;
using EquipAI.Infrastructure.Middleware;
using EquipAI.Infrastructure.Seeding;
using EquipAI.WebAPI.Extensions;
using EquipAI.WebAPI.Middleware;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // 配置 Serilog 日志，从 appsettings.json 中读取日志级别和输出目标
    builder.Host.UseSerilog((context, config) =>
    {
        config.ReadFrom.Configuration(context.Configuration)
              .WriteTo.Console();
    });

    // 注册 HTTP 上下文访问器，供中间件和服务获取当前请求上下文
    builder.Services.AddHttpContextAccessor();

    // 分层注册：基础设施层 → 应用层 → 认证 → Swagger
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.AddApplication();
    builder.Services.AddJwtAuthentication(builder.Configuration);
    builder.Services.AddSwagger();
    builder.Services.AddControllers();
    builder.Services.AddSignalR(options =>
    {
        options.KeepAliveInterval = TimeSpan.FromSeconds(15);
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    });

    // 健康检查：PostgreSQL、Redis、MQTT、LLM 连通性
    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("Default")!, name: "postgresql")
        .AddRedis(builder.Configuration["Redis:ConnectionString"]!, name: "redis")
        .AddCheck<MqttHealthCheck>("mqtt", tags: new[] { "infra" })
        .AddCheck<LlmHealthCheck>(
            "llm", tags: new[] { "infra" }, timeout: TimeSpan.FromSeconds(5));

    // CORS：允许前端域名携带凭据（SignalR WebSocket 需要 AllowCredentials）
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    var app = builder.Build();

    // 注册事件订阅：遥测数据 → 告警评估
    var eventBus = app.Services.GetRequiredService<IEventBus>();
    eventBus.Subscribe<TelemetryReceivedEvent, TelemetryEventHandler>();
    eventBus.Subscribe<AlertTriggeredEvent, AlertEventHandler>();
    eventBus.Subscribe<AlertTriggeredEvent, RootCauseAnalysisHandler>();
    eventBus.Subscribe<AlertTriggeredEvent, WorkOrderAutoCreateHandler>();
    eventBus.Subscribe<AnalysisCompletedEvent, WorkOrderAnalysisHandler>();
    eventBus.Subscribe<WorkOrderStatusChangedEvent, KnowledgeCaptureHandler>();
    eventBus.Subscribe<WorkOrderStatusChangedEvent, WorkOrderIntegrationHandler>();

    // 中间件管线（顺序很重要，决定请求的处理流程）
    // 1. 全局异常处理 — 最外层捕获所有未处理异常
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    // 1.5 安全响应头 — 为所有响应添加 X-Content-Type-Options、X-Frame-Options 等安全头
    app.UseMiddleware<SecurityHeadersMiddleware>();
    // 1.6 输入净化 — 检查请求体中的 XSS 攻击模式（script 标签、事件处理器等）
    app.UseMiddleware<InputSanitizationMiddleware>();
    // 2. 请求日志记录 — 记录每个请求的方法、路径、耗时和状态码
    app.UseSerilogRequestLogging();
    // 3. CORS — 跨域处理，在认证之前执行
    app.UseCors();
    // 3.5 IP 限流 — 固定窗口策略，每 IP 每分钟 60 次请求，在 CORS 之后、认证之前执行
    app.UseRateLimiter();
    // 4. JWT 认证 — 解析并验证 Bearer Token，填充 context.User
    app.UseAuthentication();
    // 5. 租户解析 — 从 JWT Claims 中提取租户信息，存入 HttpContext.Items（必须在认证之后）
    app.UseMiddleware<TenantResolutionMiddleware>();
    // 5.5 用量限制 — 在创建资源前检查租户配额（必须在租户解析之后、权限校验之前）
    app.UseMiddleware<UsageLimitMiddleware>();
    // 6. 权限校验 — 基于角色和权限标识的细粒度访问控制
    app.UseMiddleware<PermissionMiddleware>();
    // 7. 授权 — ASP.NET Core 内置的 [Authorize] 特性支持
    app.UseAuthorization();

    // 开发环境启用 Swagger UI
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.MapControllers();
    app.MapHub<EquipAI.WebAPI.Hubs.IndustrialHub>("/hubs/industrial");
    app.MapHealthChecks("/health");
    app.MapHealthChecks("/health/detail", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        ResponseWriter = async (context, report) =>
        {
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new
            {
                status = report.Status.ToString(),
                duration = report.TotalDuration.TotalMilliseconds,
                checks = report.Entries.Select(e => new
                {
                    name = e.Key,
                    status = e.Value.Status.ToString(),
                    description = e.Value.Description,
                    duration = e.Value.Duration.TotalMilliseconds
                })
            }, new System.Text.Json.JsonSerializerOptions
            {
                PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
            });
            await context.Response.WriteAsync(result);
        }
    });

    // 种子数据初始化：开发环境或传入 --seed 参数时执行
    if (args.Contains("--seed") || app.Environment.IsDevelopment())
    {
        using (var scope = app.Services.CreateScope())
        {
            var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
            await seeder.SeedAsync();
        }
    }

    // TimescaleDB 初始化：创建超级表、配置压缩和保留策略
    if (args.Contains("--seed") || app.Environment.IsDevelopment())
    {
        using (var scope = app.Services.CreateScope())
        {
            var timescaleSetup = scope.ServiceProvider.GetRequiredService<TimescaleDbSetup>();
            await timescaleSetup.InitializeAsync();
        }
    }

    Log.Information("EquipAI 后端服务启动成功");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "服务启动失败");
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>
/// 将 Program 类声明为 public，允许集成测试项目通过 WebApplicationFactory 访问
/// </summary>
public partial class Program { }
