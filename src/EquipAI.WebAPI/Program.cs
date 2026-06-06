using EquipAI.Application.Alerts.Handlers;
using EquipAI.Application.Analysis.Handlers;
using EquipAI.Application.Knowledge;
using EquipAI.Application.WorkOrders.Handlers;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.HealthChecks;
using Microsoft.EntityFrameworkCore;
using EquipAI.Infrastructure.Middleware;
using EquipAI.Infrastructure.Seeding;
using EquipAI.WebAPI.Extensions;
using EquipAI.WebAPI.Metrics;
using EquipAI.WebAPI.Middleware;
using Prometheus;
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
    // API 响应输出缓存（减少重复查询对数据库的压力）
    builder.Services.AddOutputCache(options =>
    {
        options.AddBasePolicy(policy => policy.Expire(TimeSpan.FromSeconds(30)));
        options.AddPolicy("Devices", policy => policy.Expire(TimeSpan.FromMinutes(2)).Tag("devices"));
        options.AddPolicy("AlertRules", policy => policy.Expire(TimeSpan.FromMinutes(5)).Tag("alert-rules"));
        options.AddPolicy("TenantConfig", policy => policy.Expire(TimeSpan.FromMinutes(10)).Tag("tenant-config"));
    });
    builder.Services.AddSignalR(options =>
    {
        options.KeepAliveInterval = TimeSpan.FromSeconds(15);
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    });

    // 健康检查：三级探针 — startup(仅DB) / liveness(DB+Redis) / ready(全部)
    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("Default")!, name: "postgresql", tags: new[] { "startup", "liveness", "ready" })
        .AddRedis(builder.Configuration["Redis:ConnectionString"]!, name: "redis", tags: new[] { "liveness", "ready" })
        .AddCheck<MqttHealthCheck>("mqtt", tags: new[] { "ready" })
        .AddCheck<LlmHealthCheck>("llm", tags: new[] { "ready" }, timeout: TimeSpan.FromSeconds(5));

    // 业务指标采集后台服务 — 每 30 秒从数据库采集 Gauge 指标
    builder.Services.AddHostedService<BusinessMetricsCollector>();

    // CORS：允许前端域名携带凭据（SignalR WebSocket 需要 AllowCredentials）
    // 从配置中读取允许的域名列表，未配置时使用默认值
    var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? new[] { "http://localhost:5173" };
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    var app = builder.Build();

    // 生产环境启动校验：拒绝不安全的占位符 JWT 密钥
    var jwtSecret = builder.Configuration["Jwt:Secret"] ?? string.Empty;
    var insecureSecrets = new[] { "请修改为随机密钥-至少32个字符!!", "your-secret-key", "change-me", "secret" };
    if (!app.Environment.IsDevelopment() && (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32 || insecureSecrets.Contains(jwtSecret, StringComparer.OrdinalIgnoreCase)))
    {
        Log.Fatal("JWT 密钥不安全（长度不足 32 位或为占位符值），请修改 .env 中的 JWT_SECRET 后重新启动");
        throw new InvalidOperationException("JWT 密钥不安全，应用拒绝启动。请在环境变量中设置至少 32 位的随机密钥");
    }

    // 生产环境 HTTPS 安全（当不在反向代理之后时启用）
    // BEHIND_PROXY=true 时由 Nginx 负责 TLS 终止，后端不需要 HTTPS 重定向
    var behindProxy = builder.Configuration["BEHIND_PROXY"]?.Equals("true", StringComparison.OrdinalIgnoreCase) == true;
    if (!behindProxy && !app.Environment.IsDevelopment())
    {
        app.UseHsts();
        app.UseHttpsRedirection();
    }

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
    // 1.7 Prometheus HTTP 指标 — 自动记录每个请求的耗时和状态码
    app.UseHttpMetrics();
    // 2. 请求日志记录 — 记录每个请求的方法、路径、耗时和状态码
    app.UseSerilogRequestLogging();
    // 3. CORS — 跨域处理，在认证之前执行
    app.UseCors();
    // 3.5 IP 限流 — 固定窗口策略，每 IP 每分钟 60 次请求，在 CORS 之后、认证之前执行
    // 测试环境禁用限流，避免高频测试请求被拦截
    if (!app.Environment.IsEnvironment("Testing"))
    {
        app.UseRateLimiter();
    }
    // 3.6 输出缓存 — 对 GET 请求的响应进行短期缓存
    app.UseOutputCache();
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
    // Prometheus 指标端点 — 映射 /metrics 供 Prometheus 抓取
    app.MapMetrics();
    // 启动探针：仅检查数据库连接（Docker start_period 使用）
    app.MapHealthChecks("/health/startup", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("startup"),
        ResponseWriter = async (context, report) =>
        {
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new
            {
                status = report.Status.ToString(),
                checks = report.Entries.Select(e => new { name = e.Key, status = e.Value.Status.ToString() })
            }, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });
            await context.Response.WriteAsync(result);
        }
    });

    // 存活探针：检查数据库 + Redis
    app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("liveness"),
        ResponseWriter = async (context, report) =>
        {
            context.Response.ContentType = "application/json";
            var result = System.Text.Json.JsonSerializer.Serialize(new
            {
                status = report.Status.ToString(),
                checks = report.Entries.Select(e => new { name = e.Key, status = e.Value.Status.ToString() })
            }, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });
            await context.Response.WriteAsync(result);
        }
    });

    // 就绪探针：检查所有依赖（数据库 + Redis + MQTT + LLM）
    app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
    {
        Predicate = check => check.Tags.Contains("ready"),
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
            }, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });
            await context.Response.WriteAsync(result);
        }
    });

    // 种子数据初始化 + TimescaleDB 初始化：首次启动自动执行，确保生产环境有基础数据
    if (args.Contains("--seed") || app.Environment.IsDevelopment() || app.Environment.IsProduction())
    {
        using (var scope = app.Services.CreateScope())
        {
            // 种子数据：插入初始用户、角色、租户等基础数据
            var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
            await seeder.SeedAsync();

            // TimescaleDB：创建超级表、配置压缩和保留策略
            var timescaleSetup = scope.ServiceProvider.GetRequiredService<TimescaleDbSetup>();
            await timescaleSetup.InitializeAsync();
        }
    }

    // 数据库迁移：仅在显式传入 --migrate 参数时执行
    // 注意：DataSeeder 使用 EnsureCreatedAsync 创建 schema，与 Migrate 不兼容
    // 如果需要使用迁移模式，应在第一次部署前删除 EnsureCreatedAsync 的调用
    if (args.Contains("--migrate"))
    {
        using var migrateScope = app.Services.CreateScope();
        var db = migrateScope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            Log.Information("正在检查数据库迁移...");
            db.Database.Migrate();
            Log.Information("数据库迁移完成");
        }
        catch (Exception ex)
        {
            Log.Error(ex, "数据库迁移失败");
            throw;
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
