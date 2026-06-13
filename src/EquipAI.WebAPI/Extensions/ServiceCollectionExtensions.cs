using System.Text;
using EquipAI.Application.Notifications;
using EquipAI.Application.Alerts;
using EquipAI.Application.Dashboard;
using EquipAI.Application.Alerts.Evaluators;
using EquipAI.Application.Alerts.Handlers;
using EquipAI.Application.Analysis;
using EquipAI.Application.Analysis.Handlers;
using EquipAI.Application.Approvals;
using EquipAI.Application.Eventing;
using EquipAI.Application.Knowledge;
using EquipAI.Application.Interfaces;
using EquipAI.Application.Mapping;
using EquipAI.Application.Services;
using EquipAI.Infrastructure.Seeding;
using EquipAI.Application.Telemetry;
using EquipAI.Application.WorkOrders;
using EquipAI.Application.WorkOrders.Handlers;
using EquipAI.Application.WorkOrders.Integration;
using EquipAI.Application.WorkOrders.Router;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.AI;
using EquipAI.Infrastructure.Cache;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Data.Repositories;
using EquipAI.Infrastructure.Identity;
using EquipAI.Infrastructure.Messaging;
using EquipAI.Infrastructure.Middleware;
using EquipAI.Infrastructure.Tenant;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Threading.RateLimiting;

namespace EquipAI.WebAPI.Extensions;

/// <summary>
/// IServiceCollection 扩展方法，提供基础设施层、应用层、认证和 Swagger 的统一注册
/// 将 DI 注册逻辑从 Program.cs 中抽离，保持入口文件简洁
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// 注册基础设施层服务：数据库上下文、Redis、JWT、仓储和租户上下文
    /// </summary>
    /// <param name="services">DI 服务集合</param>
    /// <param name="configuration">应用配置</param>
    public static void AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // 注册数据库上下文，使用 Npgsql 连接 PostgreSQL
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Default"));
        });

        // 租户上下文注册为 Scoped，从 HttpContext.Items["TenantContext"] 中获取
        // TenantResolutionMiddleware 在管道中先于业务逻辑执行，将解析好的 ITenantContext 存入 HttpContext.Items
        services.AddScoped<ITenantContext>(sp =>
        {
            var httpContextAccessor = sp.GetRequiredService<IHttpContextAccessor>();
            var httpContext = httpContextAccessor.HttpContext;

            if (httpContext?.Items.TryGetValue(TenantResolutionMiddleware.TenantContextKey, out var tenantCtx) == true
                && tenantCtx is ITenantContext tc)
            {
                return tc;
            }

            // 未认证用户（如登录接口）返回默认的空租户上下文
            // 此场景下 EF Core 全局过滤器会匹配不到任何数据，符合安全预期
            return new TenantContext(Guid.Empty, "Shared", false, Guid.Empty);
        });

        // Redis 缓存服务，Singleton 生命周期，整个应用共享一个连接
        services.AddSingleton<RedisService>();

        // JWT 令牌服务，Singleton 生命周期，无状态服务
        services.AddSingleton<JwtTokenService>();

        // 通用仓储注册，Scoped 生命周期，随请求创建和释放
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        // 文件存储服务（本地文件系统实现，后续可替换为 S3/MinIO）
        services.AddScoped<Core.Interfaces.IFileStorageService, Infrastructure.Services.LocalFileStorageService>();

        // MQTT 配置选项
        services.Configure<MqttOptions>(configuration.GetSection("Mqtt"));

        // SMTP 邮件通知配置
        services.Configure<SmtpOptions>(configuration.GetSection("Smtp"));

        // MQTT 客户端服务（Singleton — 共享连接）
        services.AddSingleton<MqttClientService>();

        // MQTT 消息处理器（Singleton — 无状态）
        services.AddSingleton<MqttMessageHandler>();

        // MQTT 后台订阅服务（随应用启动/停止）
        services.AddHostedService<MqttBackgroundService>();

        // LLM 服务（Singleton — Semantic Kernel 内部有状态管理）
        services.AddSingleton<Core.Interfaces.ILLMService, SemanticKernelLLMService>();

        // SignalR 实时推送服务（Scoped — 可注入 Scoped 的 ITenantContext）
        services.AddScoped<Core.Interfaces.ISignalRNotificationService, Services.SignalRNotificationService>();

        // TimescaleDB 初始化服务
        services.AddScoped<TimescaleDbSetup>();
        services.AddScoped<DataSeeder>();

        // IP 限流 — 使用 ASP.NET Core 8 内置 RateLimiter
        // 固定窗口策略：每 IP 每分钟最多 60 次请求
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddFixedWindowLimiter("fixed", opt =>
            {
                opt.PermitLimit = 60;
                opt.Window = TimeSpan.FromMinutes(1);
                opt.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.OldestFirst;
                opt.QueueLimit = 0;
            });
            // 登录端点专用限流：每 IP 每分钟最多 10 次，防御暴力破解
            options.AddFixedWindowLimiter("auth", opt =>
            {
                opt.PermitLimit = 10;
                opt.Window = TimeSpan.FromMinutes(1);
                opt.QueueLimit = 0;
            });
        });
    }

    /// <summary>
    /// 注册应用层服务：业务服务、RBAC、事件总线和 AutoMapper
    /// </summary>
    /// <param name="services">DI 服务集合</param>
    public static void AddApplication(this IServiceCollection services)
    {
        // 业务服务注册为 Scoped，随请求创建，支持注入 Scoped 的 DbContext
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IDeviceService, DeviceService>();
        services.AddScoped<DeviceImportService>();

        // RBAC 权限校验服务注册为 Singleton，内部使用静态权限矩阵，无状态
        services.AddSingleton<IRbacService, RbacService>();

        // 事件总线注册为 Singleton，内部维护 Channel 和后台消费任务
        services.AddSingleton<IEventBus, InMemoryEventBus>();

        // AutoMapper 映射配置，扫描 MappingProfile 所在程序集
        services.AddAutoMapper(typeof(MappingProfile).Assembly);

        // 遥测数据服务（Singleton — 内部维护定时器和队列）
        services.AddSingleton<ITelemetryService, TelemetryService>();

        // 遥测数据查询服务（Scoped — 需要 DbContext）
        services.AddScoped<TelemetryQueryService>();

        // 告警评估器（多个实现，通过 RuleType 区分）
        services.AddSingleton<IAlertRuleEvaluator, ThresholdEvaluator>();
        services.AddSingleton<IAlertRuleEvaluator, CombinedEvaluator>();
        services.AddSingleton<IAlertRuleEvaluator, BaselineEvaluator>();

        // 告警聚合器（Singleton — 内存状态）
        services.AddSingleton<IAlertAggregator, AlertAggregator>();

        // 告警评估服务（Scoped — 需要 DbContext）
        services.AddScoped<IAlertEvaluationService, AlertEvaluationService>();

        // 内存缓存（供 DataQualityService 等服务使用）
        services.AddMemoryCache();

        // 数据质量服务（Singleton — 通过 IDbContextFactory 创建独立 DbContext）
        services.AddSingleton<Core.Interfaces.IDataQualityService, DataQualityService>();

        // 根因分析引擎
        services.AddScoped<Core.Interfaces.IAnalysisService, RootCauseAnalysisEngine>();

        // L2 规则引擎诊断（Scoped — 需要 DbContext 查询知识库规则）
        services.AddScoped<Core.Interfaces.IRuleEngineAnalysisService, RuleEngineAnalysisService>();

        // L4 ML.NET 异常检测（Singleton — MLContext 内部线程安全，通过 IServiceScopeFactory 创建独立作用域）
        services.AddSingleton<Core.Interfaces.IMlAnomalyDetectionService, MlAnomalyDetectionService>();

        // 规则准确率追踪（Scoped — 需要 DbContext 更新规则统计）
        services.AddScoped<Core.Interfaces.IRuleAccuracyTracker, RuleAccuracyTracker>();

        // 工单服务
        services.AddScoped<IWorkOrderService, WorkOrderService>();

        // 工单统计服务 — 聚合工单多维度统计（分布、趋势、SLA）
        services.AddScoped<WorkOrderStatisticsService>();

        // 审批链服务 — 管理审批链模板和工单多级审批流程
        services.AddScoped<IApprovalChainService, ApprovalChainService>();

        // 智能派工服务 — 基于技能匹配 + 负载均衡推荐最佳技术人员
        services.AddScoped<ISmartDispatchService, SmartDispatchService>();

        // 知识沉淀服务（Scoped — 内部通过 IServiceScopeFactory 创建独立作用域）
        services.AddScoped<KnowledgeCaptureService>();

        // 知识规则冲突检测服务（Scoped — 需要 DbContext）
        services.AddScoped<KnowledgeConflictService>();

        // 知识规则版本管理服务（Scoped — 需要 DbContext）
        services.AddScoped<KnowledgeVersionService>();

        // 知识规则导入导出服务（Scoped — 需要 DbContext）— 支持 CSV/JSON 批量导入导出
        services.AddScoped<KnowledgeImportService>();

        // 订阅管理服务 — 检查租户配额限制（设备数量、用户数量）
        services.AddScoped<ISubscriptionService, SubscriptionService>();

        // 账单服务 — 管理租户订阅账单生成和查询
        services.AddScoped<BillingService>();

        // 订阅到期检查后台服务 — 每 6 小时检查到期状态，自动降级/冻结
        services.AddHostedService<SubscriptionExpiryService>();

        // 工单外部集成 — 多个 IWorkOrderIntegration 实现，通过 GetServices 解析后按 IntegrationType 匹配
        // 注册命名 HttpClient 工厂，统一超时配置，避免集成类自行 new HttpClient()
        services.AddHttpClient("WorkOrderIntegration", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
        });
        services.AddScoped<IWorkOrderIntegration, WebhookIntegration>();
        services.AddScoped<IWorkOrderIntegration, DingTalkIntegration>();
        services.AddScoped<IWorkOrderIntegration, FeishuIntegration>();
        services.AddScoped<IWorkOrderIntegration, EamIntegration>();

        // 集成路由服务 — 统一管理外部集成的推送分发、重试和日志记录
        services.AddScoped<IntegrationRouter>();
        services.AddScoped<WorkOrderIntegrationHandler>();

        // 事件处理器
        services.AddScoped<RootCauseAnalysisHandler>();
        services.AddScoped<WorkOrderAutoCreateHandler>();
        services.AddScoped<WorkOrderAnalysisHandler>();
        services.AddScoped<KnowledgeCaptureHandler>();
        services.AddScoped<WorkOrderNotificationHandler>();

        // 基线计算后台服务
        services.AddHostedService<BaselineCalculationService>();

        // 遥测数据清理后台服务
        services.AddHostedService<TelemetryCleanupService>();

        // 审计日志服务 — 记录系统敏感操作（登录、权限变更、数据修改等）
        services.AddScoped<IAuditLogService, AuditLogService>();

        // 推送通知服务
        services.AddScoped<IPushNotificationService, PushNotificationService>();

        // 通知偏好设置服务 — 读写用户 NotificationPrefs JSONB 字段
        services.AddScoped<NotificationPreferenceService>();

        // SMTP 邮件通知服务 — 通过 SMTP 协议发送告警/工单邮件（需配置 Smtp 节）
        services.AddScoped<SmtpEmailNotificationService>();

        // 事件处理器
        services.AddScoped<TelemetryEventHandler>();
        services.AddScoped<AlertEventHandler>();
        services.AddScoped<DashboardStatsService>();
    }

    /// <summary>
    /// 注册 JWT Bearer 认证，使用 HMAC-SHA256 对称密钥签名
    /// </summary>
    /// <param name="services">DI 服务集合</param>
    /// <param name="configuration">应用配置</param>
    public static void AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var secret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT 密钥未配置，请在 appsettings 中设置 Jwt:Secret");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            // 禁止 JWT 处理器自动将短声明名映射为完整 URI（如 role → ClaimTypes.Role）
            // 保持 JWT 中的声明名不变，以便中间件用 FindFirst("role") 直接查找
            options.MapInboundClaims = false;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = configuration["Jwt:Issuer"] ?? "EquipAI",
                ValidateAudience = true,
                ValidAudience = configuration["Jwt:Audience"] ?? "EquipAI",
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                // 要求 Token 必须有过期时间且未过期
                ValidateLifetime = true,
                // 时钟偏移设为 0，精确校验过期时间
                ClockSkew = TimeSpan.Zero
            };

            // SignalR WebSocket 连接无法通过 HTTP Header 传递 JWT，
            // 改为从 query string 的 access_token 参数读取（仅限 /hubs 路径）
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });
    }

    /// <summary>
    /// 注册 Swagger/OpenAPI 文档生成器和 Bearer 认证安全定义
    /// </summary>
    /// <param name="services">DI 服务集合</param>
    public static void AddSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "EquipAI API",
                Version = "v1",
                Description = "工业设备智能监控与预测维护平台 API"
            });

            // 定义 Bearer Token 安全方案，用于 Swagger UI 中的「Authorize」按钮
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer"
            });

            // 全局要求所有接口使用 Bearer 认证（可在具体接口上用 AllowAnonymous 覆盖）
            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });
    }
}
