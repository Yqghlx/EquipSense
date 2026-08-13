using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Server.Kestrel.Https;
using Microsoft.AspNetCore.HttpOverrides;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using EquipAI.Application.Alerts.Handlers;
using EquipAI.Application.Analysis.Handlers;
using EquipAI.Application.Knowledge;
using EquipAI.Application.WorkOrders.Handlers;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Core.Security;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.HealthChecks;
using EquipAI.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using EquipAI.Infrastructure.Middleware;
using EquipAI.Infrastructure.Seeding;
using EquipAI.Infrastructure.Services;
using EquipAI.Infrastructure.Security;
using EquipAI.Application.Security;
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

    // 提升 ThreadPool 最小线程数 — 默认等于 CPU 核心数（容器内通常 2-4）
    // 遇到突发并发（如 200 VUs）时，新线程会以 1 个/秒的速度缓慢启动，导致请求堆积
    // 工业场景写入 + SignalR 推送需要更高的小并发处理能力，预设 50 个 worker / IOCP
    // 避免 .NET ThreadPool 饥饿。该设置是全局的，需在 host build 前调用。
    ThreadPool.SetMinThreads(workerThreads: 50, completionPortThreads: 50);

    // 配置 Serilog 日志，从 appsettings.json 中读取日志级别和输出目标
    // Console 和 Seq sink 均在配置文件中定义，此处不再重复添加
    builder.Host.UseSerilog((context, config) =>
    {
        config.ReadFrom.Configuration(context.Configuration);
    });

    // 注册 HTTP 上下文访问器，供中间件和服务获取当前请求上下文
    builder.Services.AddHttpContextAccessor();

    // 生产环境通常由 Nginx 终止 TLS 并转发 X-Forwarded-* 头。
    // 先注册可信代理网段，后续在请求管线最前面还原真实客户端 IP，
    // 这样登录限流不会把所有用户误判成同一个 Docker 代理地址。
    builder.Services.AddTrustedForwardedHeaders(builder.Configuration);

    // 生产环境必须启用 WAF 并从绝对路径加载外部规则；实际文件存在性、权限和内容
    // 由 WafRuleProvider 在 HostedService 启动阶段再次校验，避免只通过配置门禁却没有规则。
    WafRuleConfiguration.ValidateForEnvironment(
        builder.Configuration,
        builder.Environment.EnvironmentName);

    // 在注册任何事件发布后台服务前完成配置校验，避免未知 Provider 或生产弱配置静默降级。
    MfaPolicyValidator.ValidateForEnvironment(
        builder.Configuration,
        builder.Environment.EnvironmentName);
    TotpSecretProtectionValidator.ValidateForEnvironment(
        builder.Configuration,
        builder.Environment.EnvironmentName);
    PiiProtectionValidator.ValidateForEnvironment(
        builder.Configuration,
        builder.Environment.EnvironmentName);
    var certificateMonitoringOptions = builder.Configuration
        .GetSection(CertificateMonitoringOptions.SectionName)
        .Get<CertificateMonitoringOptions>() ?? new CertificateMonitoringOptions();
    CertificateMonitoringOptionsValidator.ValidateForEnvironment(
        certificateMonitoringOptions,
        builder.Environment.EnvironmentName);
    EventBusConfiguration.ValidateForEnvironment(
        builder.Configuration,
        builder.Environment.EnvironmentName);
    FileStorageConfiguration.Validate(
        builder.Configuration,
        builder.Environment.EnvironmentName);
    AutoMapperLicenseConfigurationValidator.Validate(
        builder.Environment.EnvironmentName,
        builder.Configuration["AutoMapper:LicenseKey"]);
    if (builder.Environment.IsProduction()
        && EventBusConfiguration.ResolveProvider(builder.Configuration) == EventBusProvider.InMemory)
    {
        // 这是显式 break-glass 场景：允许进程继续运行，但必须留下最高级别审计信号。
        Log.Fatal("生产环境已显式启用 InMemory 事件总线，应急期间进程重启会丢失未处理事件");
    }

    // 分层注册：基础设施层 → 应用层 → 认证 → Swagger
    builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);
    builder.Services.AddApplication(builder.Configuration);
    builder.Services.AddJwtAuthentication(builder.Configuration);
    builder.Services.AddSwagger();
    builder.Services.AddControllers(options =>
    {
        // 全局审计日志 Filter：自动记录所有非 GET 写操作（设备/工单/告警/用户/规则的增删改）
        options.Filters.Add<EquipAI.WebAPI.Middleware.AuditActionFilter>();
    });
    // mTLS 双向认证配置（Phase 4 安全加固）
    // 边缘网关上传数据时携带客户端证书，后端验证证书合法性
    // 开发环境默认关闭（MTLS_ENABLED=false），生产环境开启需配置证书路径
    var mtlsEnabled = builder.Configuration.GetValue("Mtls:Enabled", false);
    if (mtlsEnabled)
    {
        var certPath = builder.Configuration["Mtls:ServerCertPath"];
        var keyPath = builder.Configuration["Mtls:ServerKeyPath"];
        var caPath = builder.Configuration["Mtls:CaCertPath"];

        if (!string.IsNullOrEmpty(certPath) && !string.IsNullOrEmpty(keyPath))
        {
            builder.WebHost.ConfigureKestrel(options =>
            {
                options.ConfigureHttpsDefaults(httpsOptions =>
                {
                    httpsOptions.ServerCertificate = X509Certificate2.CreateFromPemFile(certPath, keyPath);
                    // 要求客户端提供证书（mTLS 核心）
                    httpsOptions.ClientCertificateMode = ClientCertificateMode.RequireCertificate;
                    // 用自定义验证回调信任我们的 CA 签发的证书
                    if (!string.IsNullOrEmpty(caPath))
                    {
                        var caCert = new X509Certificate2(caPath);
                        httpsOptions.ClientCertificateValidation = (cert, chain, errors) =>
                        {
                            // 验证客户端证书是否由我们的 CA 签发
                            chain!.ChainPolicy.ExtraStore.Add(caCert);
                            chain.ChainPolicy.RevocationMode = X509RevocationMode.NoCheck;
                            return chain.Build(cert);
                        };
                    }
                });
            });
        }
    }

    builder.Services.AddSignalR(options =>
    {
        options.KeepAliveInterval = TimeSpan.FromSeconds(15);
        options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    });

    // OpenTelemetry 分布式链路追踪 + 指标 — 自动 instrument：
    //   - ASP.NET Core 入站请求（每个 HTTP 请求一个根 span）
    //   - HttpClient 出站调用（LLM API / Webhook 推送等）
    //   - EF Core 数据库查询（Npgsql 自动埋点，定位慢 SQL）
    //   - .NET Runtime（GC / ThreadPool / 内存 / CPU）— 补充 prometheus-net 未覆盖的运行时维度
    //
    // Exporter 策略：
    //   - 开发环境（OTEL_EXPORTER 未配置）：Console exporter，trace/metric 直接打到日志
    //   - 生产环境（OTEL_EXPORTER=otlp）：OTLP exporter 推送到 Jaeger/Tempo/Prometheus
    //
    // 与 prometheus-net 的关系：
    //   - prometheus-net 暴露 /metrics（HTTP pull），覆盖业务指标（设备/告警/工单计数）+ HTTP 请求时长
    //   - OTel Metrics 通过 OTLP push，补充 .NET Runtime 指标（GC / ThreadPool），与 trace 关联可在 Jaeger 中查看
    var otllEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];
    builder.Services.AddOpenTelemetry()
        .WithTracing(tracing =>
        {
            tracing
                .AddAspNetCoreInstrumentation(opts =>
                {
                    opts.RecordException = true;
                    opts.EnrichWithHttpRequest = (activity, request) =>
                    {
                        activity.SetTag("http.user_agent", request.Headers.UserAgent.ToString());
                    };
                })
                .AddHttpClientInstrumentation()
                // EF Core instrumentation：每次 DB 查询生成 span，含 SQL 文本和耗时
                // 用于定位慢查询（如 N+1 问题、缺索引的全表扫描等）
                .AddEntityFrameworkCoreInstrumentation(opts =>
                {
                    opts.SetDbStatementForText = true;  // 记录 SQL 文本（注意 PII）
                    opts.SetDbStatementForStoredProcedure = true;
                });

            if (!string.IsNullOrEmpty(otllEndpoint))
            {
                // 生产：OTLP gRPC 推送到 Jaeger / Tempo / OTel Collector
                tracing.AddOtlpExporter(opts =>
                {
                    opts.Endpoint = new Uri(otllEndpoint);
                    // 默认协议 gRPC（兼容 Jaeger 4317）
                });
                Log.Information("[OTel] Trace OTLP exporter 已启用 → {Endpoint}", otllEndpoint);
            }
            else
            {
                // 开发：Console 输出，trace 直接可见
                tracing.AddConsoleExporter();
                Log.Information("[OTel] Trace Console exporter 已启用（开发模式）");
            }
        })
        .WithMetrics(metrics =>
        {
            // .NET Runtime 自动指标：process.runtime.dotnet.*
            // 包含 GC heap / Gen0-2 collections / ThreadPool queue length / JIT / Loader 堆等
            // 用于排查内存泄漏、ThreadPool 饥饿、GC 停顿等运行时问题
            metrics.AddRuntimeInstrumentation();

            // ASP.NET Core / HttpClient 的指标由 .NET 8 内置 System.Diagnostics.Metrics 自动产生
            // （http.server.request.duration / http.client.request.duration），
            // OTel SDK 会自动捕获，无需手动 AddInstrumentation

            // 自定义 Meter（业务侧用 System.Diagnostics.Metrics 埋点的指标会自动采集）
            // 当前业务指标通过 prometheus-net 暴露，未走 OTel Meter；后续可逐步迁移
            // metrics.AddMeter("EquipAI.Business");

            if (!string.IsNullOrEmpty(otllEndpoint))
            {
                metrics.AddOtlpExporter(opts =>
                {
                    opts.Endpoint = new Uri(otllEndpoint);
                });
                Log.Information("[OTel] Metrics OTLP exporter 已启用 → {Endpoint}", otllEndpoint);
            }
            else
            {
                // 开发环境：用 Console 看运行时指标（默认 10 秒导出一次）
                metrics.AddConsoleExporter();
                Log.Information("[OTel] Metrics Console exporter 已启用（开发模式，仅运行时指标）");
            }
        });

    // 健康检查：三级探针 — startup(仅DB) / liveness(DB+Redis) / ready(全部)
    // replica-postgresql 只挂 ready tag（不挂 startup/liveness）：
    // 只读副本故障不应阻止应用启动，也不应让 k8s/docker 误判应用不存活（主库仍可用）
    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("Default")!, name: "postgresql", tags: new[] { "startup", "liveness", "ready" })
        .AddRedis(builder.Configuration["Redis:ConnectionString"]!, name: "redis", tags: new[] { "liveness", "ready" })
        .AddCheck<MqttHealthCheck>("mqtt", tags: new[] { "ready" })
        .AddCheck<LlmHealthCheck>("llm", tags: new[] { "ready" }, timeout: TimeSpan.FromSeconds(5))
        .AddNpgSql(
            builder.Configuration.GetConnectionString("ReadOnly") ?? builder.Configuration.GetConnectionString("Default")!,
            name: "replica-postgresql",
            tags: new[] { "ready" });

    // 业务指标采集后台服务 — 每 30 秒从数据库采集 Gauge 指标
    builder.Services.AddHostedService<BusinessMetricsCollector>();
    // 生产证书生命周期监控 — 只读公钥证书并周期性暴露到 Prometheus
    builder.Services.Configure<CertificateMonitoringOptions>(
        builder.Configuration.GetSection(CertificateMonitoringOptions.SectionName));
    builder.Services.AddSingleton<CertificateMetricsReader>();
    builder.Services.AddSingleton<ICertificateMetricsSink, PrometheusCertificateMetricsSink>();
    builder.Services.AddSingleton<CertificateMetricsCollector>(serviceProvider =>
        new CertificateMetricsCollector(
            serviceProvider.GetRequiredService<IOptions<CertificateMonitoringOptions>>().Value,
            serviceProvider.GetRequiredService<CertificateMetricsReader>(),
            serviceProvider.GetRequiredService<ICertificateMetricsSink>(),
            serviceProvider.GetRequiredService<ILogger<CertificateMetricsCollector>>()));
    builder.Services.AddHostedService(serviceProvider =>
        serviceProvider.GetRequiredService<CertificateMetricsCollector>());
    // 网关心跳监控 — 每 30 秒检查超时网关并标记 offline
    builder.Services.AddHostedService<EquipAI.WebAPI.Services.GatewayHeartbeatMonitor>();
    // 设备状态监控 — 每 30 秒扫描 LastSeenAt 超时设备标记 offline（配合 TelemetryEventHandler 的上线逻辑）
    builder.Services.AddHostedService<EquipAI.WebAPI.Services.DeviceStatusMonitor>();

    // CORS：允许前端域名携带凭据（SignalR WebSocket 需要 AllowCredentials）
    // 从配置中读取允许的域名列表，未配置时使用默认值（仅开发/测试环境有效）
    var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
    // 生产环境必须显式配置允许的前端域名，防止 CORS 回退到 localhost 或空列表
    // 开发环境（Development）和集成测试环境（Testing）跳过此校验
    var skipCorsValidation = builder.Environment.IsDevelopment() || builder.Environment.IsEnvironment("Testing");
    if (!skipCorsValidation && corsOrigins.Length == 0)
    {
        Log.Fatal("生产环境未配置 CORS 允许的前端域名（Cors:Origins），请在 appsettings.Production.json 或环境变量 Cors__Origins__0 中设置");
        throw new InvalidOperationException("CORS 配置缺失，生产环境必须显式指定允许的前端域名");
    }
    // 开发/测试环境未配置时使用 localhost 默认值
    var effectiveOrigins = corsOrigins.Length > 0 ? corsOrigins : new[] { "http://localhost:5173" };
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins(effectiveOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    var app = builder.Build();

    // 生产环境启动校验：拒绝不安全的占位符 JWT 密钥
    var jwtSecret = builder.Configuration["Jwt:Secret"] ?? string.Empty;
    var insecureSecrets = new[] { "请修改为随机密钥-至少32个字符!!", "your-secret-key", "change-me", "secret" };
    if (!app.Environment.IsDevelopment()
        && !app.Environment.IsEnvironment("Testing")
        && (string.IsNullOrWhiteSpace(jwtSecret)
            || jwtSecret.Length < 32
            || insecureSecrets.Contains(jwtSecret, StringComparer.OrdinalIgnoreCase)))
    {
        Log.Fatal("JWT 密钥不安全（长度不足 32 位或为占位符值），请修改 .env 中的 JWT_SECRET 后重新启动");
        throw new InvalidOperationException("JWT 密钥不安全，应用拒绝启动。请在环境变量中设置至少 32 位的随机密钥");
    }

    // 生产环境启动校验：拒绝公开的网关认证密钥，避免设备配置接口被默认凭据保护。
    var gatewayAuthKey = builder.Configuration["Gateway:AuthKey"] ?? string.Empty;
    var insecureGatewayKeys = new[]
    {
        "SET_VIA_USER_SECRETS",
        "equipai-gateway-dev-key-2024",
        "PLEASE_CHANGE_THIS_TO_ASCII_STRONG_KEY_AT_LEAST_32_CHARS"
    };
    if (!app.Environment.IsDevelopment()
        && !app.Environment.IsEnvironment("Testing")
        && (string.IsNullOrWhiteSpace(gatewayAuthKey)
            || gatewayAuthKey.Length < 32
            || insecureGatewayKeys.Contains(gatewayAuthKey, StringComparer.OrdinalIgnoreCase)))
    {
        Log.Fatal("网关认证密钥不安全（长度不足 32 位或为占位符值），请修改 .env 中的 GATEWAY_AUTH_KEY 后重新启动");
        throw new InvalidOperationException("网关认证密钥不安全，应用拒绝启动。请在环境变量中设置至少 32 位的随机密钥");
    }

    // 生产浏览器认证默认只通过 HttpOnly Cookie 建立会话。
    // 如果启用机器客户端响应体令牌，必须使用独立的长随机 API Key，不能复用其他凭据。
    var machineAuthApiKey = builder.Configuration["Auth:MachineApiKey"];
    if (app.Environment.IsProduction()
        && !string.IsNullOrWhiteSpace(machineAuthApiKey)
        && (machineAuthApiKey.Contains("PLEASE_CHANGE", StringComparison.OrdinalIgnoreCase)
            || machineAuthApiKey.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase)
            || machineAuthApiKey.Contains("SET_VIA_ENVIRONMENT", StringComparison.OrdinalIgnoreCase)
            || machineAuthApiKey.Contains("请修改", StringComparison.Ordinal)
            || machineAuthApiKey.Length < 32
            || machineAuthApiKey.Any(character => character < 0x21 || character > 0x7E)))
    {
        Log.Fatal("Auth:MachineApiKey 不安全，必须为至少 32 位的可打印 ASCII 字符串");
        throw new InvalidOperationException(
            "生产机器客户端 API Key 必须为至少 32 位的可打印 ASCII 字符串");
    }

    // 生产网关认证不仅需要共享密钥，还必须绑定唯一的租户和网关标识。
    // 仅验证 AuthKey 会允许持钥方伪造请求体，读取或注册任意租户的网关配置。
    var boundGatewayTenantId = builder.Configuration["Gateway:TenantId"];
    var boundGatewayId = builder.Configuration["Gateway:Id"];
    if (app.Environment.IsProduction()
        && (!Guid.TryParse(boundGatewayTenantId, out var parsedBoundGatewayTenantId)
            || parsedBoundGatewayTenantId == Guid.Empty
            || string.IsNullOrWhiteSpace(boundGatewayId)))
    {
        Log.Fatal("生产环境未配置有效的 Gateway:TenantId 或 Gateway:Id，网关身份绑定已拒绝启动");
        throw new InvalidOperationException(
            "生产环境必须配置 Gateway:TenantId（有效 UUID）和 Gateway:Id，防止网关认证跨租户伪造");
    }

    var gatewayAllowedHosts = builder.Configuration
        .GetSection("Gateway:AllowedHosts")
        .Get<string[]>()
        ?.SelectMany(value => value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        .Where(value => !string.IsNullOrWhiteSpace(value) && value != "*")
        .ToArray()
        ?? [];
    if (app.Environment.IsProduction() && gatewayAllowedHosts.Length == 0)
    {
        Log.Fatal("生产环境未配置 Gateway:AllowedHosts，后端网关代理已拒绝启动");
        throw new InvalidOperationException("生产环境必须配置 Gateway:AllowedHosts 精确主机白名单");
    }

    // 评估标准答案上报是内部测试能力，生产默认关闭；显式开启时必须同时绑定固定租户和独立密钥。
    // 这样即使评估 API Key 泄露，也不会允许调用方通过请求体伪造任意租户并污染评估数据。
    var evaluationIngestionEnabled = builder.Configuration.GetValue("Evaluation:AllowGroundTruthIngestion", false);
    if (app.Environment.IsProduction() && evaluationIngestionEnabled)
    {
        var evaluationApiKey = builder.Configuration["Evaluation:IngestionApiKey"];
        var evaluationTenantId = builder.Configuration["Evaluation:TenantId"];
        if (string.IsNullOrWhiteSpace(evaluationApiKey)
            || evaluationApiKey.Length < 32
            || !Guid.TryParse(evaluationTenantId, out var parsedEvaluationTenantId)
            || parsedEvaluationTenantId == Guid.Empty)
        {
            Log.Fatal("生产评估上报已开启，但 Evaluation:IngestionApiKey 或 Evaluation:TenantId 无效");
            throw new InvalidOperationException(
                "生产评估上报配置不完整：请同时设置至少 32 位的 Evaluation:IngestionApiKey 和有效的 Evaluation:TenantId");
        }
    }

    // ASP.NET Core 不会展开 JSON 中的 ${VAR} 占位符；生产配置必须由环境变量覆盖连接串，
    // 否则服务会以字面量占位符连接基础设施并在重试后才失败，部署排障成本很高。
    var defaultConnectionString = builder.Configuration.GetConnectionString("Default") ?? string.Empty;
    var readOnlyConnectionString = builder.Configuration.GetConnectionString("ReadOnly") ?? string.Empty;
    var redisConnectionString = builder.Configuration["Redis:ConnectionString"] ?? string.Empty;
    var hasUnresolvedConnectionPlaceholder =
        defaultConnectionString.Contains("SET_VIA_ENVIRONMENT", StringComparison.Ordinal)
        || readOnlyConnectionString.Contains("SET_VIA_ENVIRONMENT", StringComparison.Ordinal)
        || redisConnectionString.Contains("SET_VIA_ENVIRONMENT", StringComparison.Ordinal)
        || defaultConnectionString.Contains("${", StringComparison.Ordinal)
        || readOnlyConnectionString.Contains("${", StringComparison.Ordinal)
        || redisConnectionString.Contains("${", StringComparison.Ordinal);
    if (!app.Environment.IsDevelopment()
        && !app.Environment.IsEnvironment("Testing")
        && (string.IsNullOrWhiteSpace(defaultConnectionString) || hasUnresolvedConnectionPlaceholder))
    {
        Log.Fatal("生产环境基础设施连接配置未解析，请通过 ConnectionStrings__Default、ConnectionStrings__ReadOnly 和 Redis__ConnectionString 注入真实值");
        throw new InvalidOperationException("生产环境基础设施连接配置缺失或仍包含占位符，应用拒绝启动");
    }

    // MQTT 安全配置在启动阶段校验，避免生产服务先启动后才在后台重连中暴露配置错误。
    var mqttOptions = builder.Configuration.GetSection("Mqtt").Get<MqttOptions>() ?? new MqttOptions();
    MqttSecurityConfigurationValidator.Validate(
        componentName: "Mqtt",
        environmentName: app.Environment.EnvironmentName,
        port: mqttOptions.Port,
        useTls: mqttOptions.UseTls,
        allowUntrustedCertificates: mqttOptions.AllowUntrustedCertificates,
        caCertificatePath: mqttOptions.CaCertificatePath,
        username: mqttOptions.Username,
        password: mqttOptions.Password);

    // 生产环境 HTTPS 安全（当不在反向代理之后时启用）
    // BEHIND_PROXY=true 时由 Nginx 负责 TLS 终止，后端不需要 HTTPS 重定向
    var behindProxy = builder.Configuration["BEHIND_PROXY"]?.Equals("true", StringComparison.OrdinalIgnoreCase) == true;
    if (behindProxy)
    {
        // 必须在 HSTS、请求日志、限流和审计之前执行，确保后续中间件看到的是
        // 经过可信代理校验后的 Scheme、RemoteIpAddress，而不是代理容器地址。
        app.UseForwardedHeaders();
    }

    if (!behindProxy && !app.Environment.IsDevelopment())
    {
        app.UseHsts();
        app.UseHttpsRedirection();
    }

    // 注册事件订阅：遥测数据 → 告警评估
    // 订阅必须登记在 RabbitMQ 单例传输层；生产业务代码解析到的 IEventBus 是事务 Outbox 包装器。
    var eventBus = app.Services.GetRequiredService<IEventBusTransport>();
    eventBus.Subscribe<TelemetryReceivedEvent, TelemetryEventHandler>();
    eventBus.Subscribe<AlertTriggeredEvent, AlertEventHandler>();
    eventBus.Subscribe<AlertTriggeredEvent, RootCauseAnalysisHandler>();
    eventBus.Subscribe<AlertTriggeredEvent, WorkOrderAutoCreateHandler>();
    eventBus.Subscribe<AlertAcknowledgedEvent, AlertStatusNotificationHandler>();
    eventBus.Subscribe<AlertResolvedEvent, AlertStatusNotificationHandler>();
    eventBus.Subscribe<AnalysisCompletedEvent, WorkOrderAnalysisHandler>();
    eventBus.Subscribe<WorkOrderStatusChangedEvent, KnowledgeCaptureHandler>();
    eventBus.Subscribe<WorkOrderStatusChangedEvent, WorkOrderIntegrationHandler>();
    eventBus.Subscribe<WorkOrderCreatedEvent, WorkOrderNotificationHandler>();
    eventBus.Subscribe<WorkOrderStatusChangedEvent, WorkOrderNotificationHandler>();

    // MQTT 的连接生命周期由 MqttBackgroundService.StopAsync 统一管理。
    // 不再额外注册 ApplicationStopping 同步回调，避免重复断开、停机竞态和 sync-over-async 阻塞。

    // 中间件管线（顺序很重要，决定请求的处理流程）
    // 1. 全局异常处理 — 最外层捕获所有未处理异常
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    // 1.5 安全响应头 — 为所有响应添加 X-Content-Type-Options、X-Frame-Options 等安全头
    app.UseMiddleware<SecurityHeadersMiddleware>();
    // 1.6 WAF（Web 应用防火墙）— SQL 注入/路径遍历/命令注入/XSS 综合拦截（Phase 4 安全加固）
    app.UseMiddleware<WafMiddleware>();
    // 1.7 输入净化 — 检查请求体中的 XSS 攻击模式（script 标签、事件处理器等）
    app.UseMiddleware<InputSanitizationMiddleware>();
    // 1.7 Prometheus HTTP 指标 — 自动记录每个请求的耗时和状态码
    app.UseHttpMetrics();
    // 2. 请求日志记录 — 记录每个请求的方法、路径、耗时和状态码
    app.UseSerilogRequestLogging();
    // 3. CORS — 跨域处理，在认证之前执行
    app.UseCors();
    // 3.5 JWT 认证 — 必须先于全局限流，才能让限流器读取 tenant_id，
    // 否则所有已认证请求都会错误地退化为按代理 IP 共用一个限流桶。
    app.UseAuthentication();
    // 3.55 强制改密门禁 — 认证成功后先限制业务 API，避免客户端绕过前端直接访问数据。
    app.UseMiddleware<PasswordChangeRequiredMiddleware>();
    // 3.6 租户解析 — 从 JWT Claims 中提取租户信息，存入 HttpContext.Items（认证之后）
    app.UseMiddleware<TenantResolutionMiddleware>();
    // 3.7 IP/租户限流 — 未认证请求按真实客户端 IP，已认证请求按 tenant_id
    // 测试环境和 CI E2E 测试禁用限流，避免高频测试请求被拦截
    var disableRateLimiting = RateLimitingConfiguration.ShouldDisable(
        app.Environment.EnvironmentName,
        app.Configuration);
    if (!disableRateLimiting)
    {
        app.UseRateLimiter();
    }
    // 4. 用量限制 — 在创建资源前检查租户配额（必须在租户解析之后、权限校验之前）
    app.UseMiddleware<UsageLimitMiddleware>();
    // 5. 权限校验 — 基于角色和权限标识的细粒度访问控制
    app.UseMiddleware<PermissionMiddleware>();
    // 6. 授权 — ASP.NET Core 内置的 [Authorize] 特性支持
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

    // 生产/开发环境统一先执行 EF Core 迁移，再初始化种子数据和 TimescaleDB。
    // 蓝绿发布时新旧后端可能并行启动，必须让三步初始化共享同一把 PostgreSQL 会话锁，
    // 避免两个实例同时创建迁移、种子数据或 TimescaleDB 策略。
    // Testing 环境由集成测试夹具使用 SQLite EnsureCreatedAsync 创建 schema。
    var shouldSeed = args.Contains("--seed") || app.Environment.IsDevelopment() || app.Environment.IsProduction();
    if (DatabaseInitializationPolicy.ShouldApplyMigrations(app.Environment.EnvironmentName) || shouldSeed)
    {
        using var initializationScope = app.Services.CreateScope();
        var db = initializationScope.ServiceProvider.GetRequiredService<AppDbContext>();
        await using var initializationLock = await DatabaseInitializationLock.AcquireAsync(db);

        try
        {
            if (DatabaseInitializationPolicy.ShouldApplyMigrations(app.Environment.EnvironmentName))
            {
                Log.Information("正在检查数据库迁移...");
                await db.Database.MigrateAsync();
                Log.Information("数据库迁移完成");

                // EF ValueConverter 只接受新密文；历史数据库中的明文必须在 Seeder 和业务查询前完成回填。
                var piiMigration = initializationScope.ServiceProvider
                    .GetRequiredService<UserPiiMigrationService>();
                await piiMigration.MigrateLegacyValuesAsync();
            }

            if (shouldSeed)
            {
                // 种子数据：插入初始用户、角色、租户等基础数据
                var seeder = initializationScope.ServiceProvider.GetRequiredService<DataSeeder>();
                await seeder.SeedAsync();

                // TimescaleDB：创建超级表、配置压缩和保留策略
                var timescaleSetup = initializationScope.ServiceProvider.GetRequiredService<TimescaleDbSetup>();
                await timescaleSetup.InitializeAsync();
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "数据库启动初始化失败，服务拒绝启动");
            throw;
        }
    }

    Log.Information("EquipAI 后端服务启动成功");

    // 配置缺失警告 — 生产环境应配置以下项
    var smtpHost = builder.Configuration["Smtp:Host"];
    if (string.IsNullOrEmpty(smtpHost))
        Log.Warning("SMTP 未配置，邮件通知功能不可用。请在 appsettings 或环境变量中设置 Smtp 节");

    var vapidSubject = builder.Configuration["Vapid:Subject"];
    if (string.IsNullOrEmpty(vapidSubject))
        Log.Warning("VAPID 未配置，浏览器推送通知功能不可用。请设置 Vapid:Subject / PublicKey / PrivateKey");

    var mqttBroker = builder.Configuration["Mqtt:Host"];
    if (string.IsNullOrEmpty(mqttBroker))
        Log.Warning("MQTT Broker 未配置，遥测数据接收功能不可用。请设置 Mqtt:Host");

    var llmKey = builder.Configuration["LLM:ApiKey"];
    if (string.IsNullOrEmpty(llmKey))
        Log.Warning("LLM API Key 未配置，AI 分析将降级为规则匹配模式。设置 LLM:ApiKey 以启用完整 AI 诊断");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "服务启动失败");
    Environment.ExitCode = 1;
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>
/// 将 Program 类声明为 public，允许集成测试项目通过 WebApplicationFactory 访问
/// </summary>
public partial class Program { }
