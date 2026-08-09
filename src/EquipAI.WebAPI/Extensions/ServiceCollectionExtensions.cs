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
using EquipAI.Infrastructure.HealthChecks;
using EquipAI.Infrastructure.Messaging;
using EquipAI.Infrastructure.Middleware;
using EquipAI.Infrastructure.Tenant;
using StackExchange.Redis;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Threading.RateLimiting;
using Microsoft.Extensions.Hosting;

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
        // EnableRetryOnFailure：对瞬时故障（网络抖动、连接池耗尽、锁超时）自动重试
        // 默认策略：最多重试 6 次，指数退避（初始 1 秒，最大 30 秒）
        // 注意：启用重试后，SaveChanges 中的非幂等操作需确保幂等性，否则会重复执行
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseNpgsql(
                configuration.GetConnectionString("Default"),
                npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 6,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorCodesToAdd: null));
        });

        // 只读副本 DbContext（CQRS 读路径）：独立连接串 ConnectionStrings:ReadOnly，
        // 默认退化为指向主库（未配置副本时行为零变化）。
        // NoTracking 跳过变更跟踪，复杂分析查询更快；SaveChanges 被重写为抛异常防误写。
        services.AddDbContext<AppReadDbContext>(options =>
        {
            options.UseNpgsql(
                configuration.GetConnectionString("ReadOnly") ?? configuration.GetConnectionString("Default"),
                npgsqlOptions => npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 6,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorCodesToAdd: null));
            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
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

        // Redis 连接多路复用器（Singleton），供分布式锁等共享同一连接池。
        // RedisService 内部自建连接以保持解耦；此处额外注册 IConnectionMultiplexer 供需要直接操作 Redis 的组件复用。
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var configuration = sp.GetRequiredService<IConfiguration>();
            var connectionString = configuration["Redis:ConnectionString"];
            if (string.IsNullOrEmpty(connectionString))
            {
                connectionString = "localhost:6379";
            }
            return ConnectionMultiplexer.Connect(connectionString);
        });

        // 告警聚合共享状态（Singleton），使用同一 Redis 连接保证多实例窗口计数一致。
        services.AddSingleton<IAlertAggregationStateStore, RedisAlertAggregationStateStore>();

        // 分布式锁提供者，供后台服务在多实例部署下互斥执行（单实例下锁恒可获取，行为不变）
        services.AddSingleton<IDistributedLockProvider, RedisDistributedLockProvider>();

        // JWT 令牌服务，Singleton 生命周期，无状态服务
        services.AddSingleton<JwtTokenService>();
        // TOTP 多因素认证服务（无状态，密钥通过参数传入，可安全作为单例）
        services.AddSingleton<EquipAI.Infrastructure.Identity.ITotpService, EquipAI.Infrastructure.Identity.TotpService>();
        // TOTP 密钥保护器（单例）：AES-GCM 密钥由外部配置注入，避免把可生成验证码的密钥明文写入数据库。
        services.AddSingleton<EquipAI.Infrastructure.Identity.ITotpSecretProtector>(sp =>
            new EquipAI.Infrastructure.Identity.TotpSecretProtector(
                sp.GetRequiredService<IConfiguration>(),
                sp.GetRequiredService<IHostEnvironment>()));

        // 通用仓储注册，Scoped 生命周期，随请求创建和释放
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        // 文件存储服务（本地文件系统实现，后续可替换为 S3/MinIO）
        services.AddScoped<Core.Interfaces.IFileStorageService, Infrastructure.Services.LocalFileStorageService>();

        // 租户可配置出站地址的 SSRF 防护策略，保存时与实际发送时均执行校验。
        services.AddSingleton<OutboundEndpointPolicy>();
        services.AddTransient<OutboundEndpointValidationHandler>();

        // MQTT 配置选项
        services.Configure<MqttOptions>(configuration.GetSection("Mqtt"));

        // SMTP 邮件通知配置
        services.Configure<SmtpOptions>(configuration.GetSection("Smtp"));

        // 事件总线实现必须由统一解析器确定，未知值直接失败，避免配置拼写错误静默降级。
        // RabbitMQ 总线以同一单例暴露为业务接口、托管服务和就绪状态，保证生命周期一致。
        var eventBusProvider = EventBusConfiguration.ResolveProvider(configuration);
        if (eventBusProvider == EventBusProvider.RabbitMQ)
        {
            services.Configure<RabbitMqOptions>(configuration.GetSection("EventBus:RabbitMq"));
            services.Configure<OutboxOptions>(configuration.GetSection("EventBus:Outbox"));
            services.AddSingleton<RabbitMqEventBus>();
            services.AddSingleton<IEventBusTransport>(provider => provider.GetRequiredService<RabbitMqEventBus>());
            services.AddScoped<IEventBus, TransactionalEventBus>();
            services.AddScoped<OutboxMessageStore>();
            services.AddScoped<InboxMessageStore>();
            services.AddSingleton<IRabbitMqConnectionState>(provider => provider.GetRequiredService<RabbitMqEventBus>());
            services.AddSingleton<IHostedService>(provider => provider.GetRequiredService<RabbitMqEventBus>());
            services.AddHostedService<OutboxDispatcher>();
            services.AddHealthChecks().AddCheck<RabbitMqHealthCheck>(
                "rabbitmq-eventbus",
                tags: ["ready"]);
        }
        else
        {
            services.AddSingleton<InMemoryEventBus>();
            services.AddSingleton<IEventBus>(provider => provider.GetRequiredService<InMemoryEventBus>());
            services.AddSingleton<IEventBusTransport>(provider => provider.GetRequiredService<InMemoryEventBus>());
        }

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

        // 多租户分层限流（v1.5 安全加固）— 使用 ASP.NET Core 8 内置 RateLimiter
        //
        // 三层防护（GlobalLimiter 与 Policy 叠加生效）：
        //   1. GlobalLimiter — 业务请求主防线
        //      - 已认证用户：按 tenant_id 分区，每租户每分钟 1000 次（防单租户拖垮系统）
        //      - 未认证请求：按 RemoteIpAddress 分区，每 IP 每分钟 60 次（防恶意扫描）
        //   2. AddPolicy("auth") — 登录端点专用，按 IP 每分钟 10 次（防暴力破解）
        //
        // Why per-tenant：工业客户常共享 NAT 出口，单租户的多客户端可能从同一 IP 出来，
        //   按 IP 限流会误伤；按 tenant_id 限流更贴合多租户"按订阅配额"的模型。
        //
        // 自动按环境区分：
        // - Production：强制开启限流（忽略 DISABLE_RATE_LIMITING，防暴力破解）
        // - Development / Testing：允许通过 DISABLE_RATE_LIMITING=true 关闭（E2E 测试需要）
        var env = configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production";
        var disableRateLimiting = env is not "Production" && configuration.GetValue("DisableRateLimiting", false);
        if (disableRateLimiting)
        {
            // E2E 测试模式：注册一个空限流器（所有请求放行）
            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.AddPolicy("fixed", context => RateLimitPartition.GetNoLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "default"));
                options.AddPolicy("auth", context => RateLimitPartition.GetNoLimiter(context.Connection.RemoteIpAddress?.ToString() ?? "default"));
                options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(_ =>
                    RateLimitPartition.GetNoLimiter("global"));
            });
            return;
        }
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // GlobalLimiter — 业务请求主防线（自动应用到所有未被 [EnableRateLimiting] 覆盖的请求）
            // 已认证 → 按 tenant_id 分区（1000/min）；未认证 → 按 IP 分区（60/min）
            options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            {
                // 优先用 JWT 中的 tenant_id（认证后的业务请求）
                var tenantClaim = httpContext.User.FindFirst("tenant_id")?.Value;
                if (!string.IsNullOrEmpty(tenantClaim))
                {
                    return RateLimitPartition.GetFixedWindowLimiter(tenantClaim, _ =>
                        new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 1000,             // 单租户每分钟 1000 次（约 16 QPS）
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0,                  // 超限立即拒绝，不排队（避免请求堆积）
                        });
                }

                // 未认证请求（如 /health、/swagger、未携带 token 的 GET）按 IP 限流
                var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter(ip, _ =>
                    new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 60,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                    });
            });

            // 兼容旧策略名（部分 Controller 仍引用 "fixed"）— 行为等价于 GlobalLimiter 的 IP 分支
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
    /// <param name="configuration">应用配置，用于注入 AutoMapper 许可证等运行时设置</param>
    public static void AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        // 业务服务注册为 Scoped，随请求创建，支持注入 Scoped 的 DbContext
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IDeviceService, DeviceService>();
        services.AddScoped<DeviceImportService>();
        services.AddSingleton<GatewayEndpointPolicy>();
        services.AddScoped<GatewayManagementService>();
        services.AddScoped<GatewayDeviceConfigService>();
        services.AddScoped<Application.Devices.DeviceTypeTemplateService>();
        services.AddScoped<Application.Devices.DeviceConfigService>();

        // RBAC 权限校验服务注册为 Singleton，内部使用静态权限矩阵，无状态
        services.AddSingleton<IRbacService, RbacService>();

        // 使用已修复高危递归 DoS 的 AutoMapper 15.1.3，并从外部密钥管理注入许可证。
        // 开发/测试环境允许留空；生产环境已由启动校验器强制要求真实密钥。
        var autoMapperLicenseKey = configuration["AutoMapper:LicenseKey"];
        services.AddAutoMapper(options =>
        {
            if (!string.IsNullOrWhiteSpace(autoMapperLicenseKey))
            {
                options.LicenseKey = autoMapperLicenseKey;
            }
        }, typeof(MappingProfile).Assembly);

        // 遥测数据服务（Singleton — 内部维护定时器和队列）。
        // RabbitMQ 模式下 IEventBus 是 Scoped 事务 Outbox 包装器，不能直接注入 Singleton；
        // 构造时只注入 Singleton 传输层作为无作用域回退，实际 flush 会在自己的 scope 解析事务总线。
        services.AddSingleton<ITelemetryService>(sp => new TelemetryService(
            sp.GetRequiredService<IServiceScopeFactory>(),
            sp.GetRequiredService<IEventBusTransport>(),
            sp.GetRequiredService<ILogger<TelemetryService>>()));

        // 遥测数据查询服务（Scoped — 需要 DbContext）
        services.AddScoped<TelemetryQueryService>();

        // 告警评估器（多个实现，通过 RuleType 区分）
        services.AddSingleton<IAlertRuleEvaluator, ThresholdEvaluator>();
        services.AddSingleton<IAlertRuleEvaluator, CombinedEvaluator>();
        services.AddSingleton<IAlertRuleEvaluator, BaselineEvaluator>();

        // 告警聚合器（Singleton — Redis 共享状态，Redis 故障时自动降级到本地窗口）
        services.AddSingleton<IAlertAggregator, AlertAggregator>();
        // 告警状态并发门闩（Singleton — 同一设备/规则/指标串行创建与更新，避免并发遥测重复建 Active 告警）
        services.AddSingleton<AlertEvaluationConcurrencyGate>();

        // 告警评估服务（Scoped — 需要 DbContext）
        services.AddScoped<IAlertEvaluationService, AlertEvaluationService>();
        services.AddScoped<Application.Alerts.AlertRuleService>();
        services.AddScoped<Application.Alerts.AlertQueryService>();

        // 内存缓存（供 DataQualityService 等服务使用）
        services.AddMemoryCache();

        // 数据质量服务（Singleton — 通过 IDbContextFactory 创建独立 DbContext）
        services.AddSingleton<Core.Interfaces.IDataQualityService, DataQualityService>();

        // 根因分析引擎
        services.AddScoped<Core.Interfaces.IAnalysisService, RootCauseAnalysisEngine>();
        // 分析结果查询服务 + 手动触发编排服务（使 Controller 不直接依赖 AppDbContext）
        services.AddScoped<Application.Analysis.AnalysisQueryService>();
        services.AddScoped<Application.Analysis.AnalysisTriggerService>();

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
        services.AddScoped<Application.WorkOrders.TechnicianProfileService>();
        services.AddScoped<Application.WorkOrders.WorkOrderAttachmentService>();

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
        }).AddHttpMessageHandler<OutboundEndpointValidationHandler>();
        // 告警多渠道通知 — 钉钉/飞书机器人推送复用同一 HttpClient 工厂模式
        services.AddHttpClient("AlertIntegration", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(10);
        }).AddHttpMessageHandler<OutboundEndpointValidationHandler>();
        // 网关状态/连接测试代理统一复用连接池，并由调用方先执行目标地址安全校验。
        services.AddHttpClient("GatewayProxy", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(5);
        });
        services.AddScoped<IWorkOrderIntegration, WebhookIntegration>();
        services.AddScoped<IWorkOrderIntegration, DingTalkIntegration>();
        services.AddScoped<IWorkOrderIntegration, FeishuIntegration>();
        services.AddScoped<IWorkOrderIntegration, EamIntegration>();
        services.AddScoped<IntegrationSettingsService>();

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

        // 日志保留期清理后台服务 — 清理过期 audit_logs/notifications（高频增长的全局日志型表），
        // 防长期运行磁盘满 → PG 崩溃。保留期从 Retention 配置读（审计 365 天 / 通知 90 天）。
        services.AddHostedService<EquipAI.Application.Retention.LogRetentionCleanupService>();

        // SLA 超时自动升级后台服务 — 每 5 分钟遍历活跃租户，自动升级逾期工单 + 通知主管
        services.AddHostedService<EquipAI.Application.WorkOrders.SlaEscalationHostedService>();

        // 设备健康度定时重算后台服务 — 每 10 分钟遍历活跃租户重算 devices.health_score，
        // 否则健康度恒为默认 100，DeviceDetailPage/报表恒显示"健康"无视告警与离线
        services.AddHostedService<EquipAI.Application.Analysis.DeviceHealthRecalculationHostedService>();

        // 审计日志服务 — 记录系统敏感操作（登录、权限变更、数据修改等）
        services.AddScoped<IAuditLogService, AuditLogService>();

        // 推送通知服务
        services.AddScoped<IPushNotificationService, PushNotificationService>();

        // 通知偏好设置服务 — 读写用户 NotificationPrefs JSONB 字段
        services.AddScoped<NotificationPreferenceService>();
        services.AddScoped<NotificationService>();

        // SMTP 邮件通知服务 — 通过 SMTP 协议发送告警/工单邮件（需配置 Smtp 节）
        services.AddScoped<SmtpEmailNotificationService>();

        // 事件处理器
        services.AddScoped<TelemetryEventHandler>();
        services.AddScoped<AlertEventHandler>();
        // 告警状态变更 SignalR 推送处理器（确认/解决事件 → 实时推送，与 WorkOrderNotificationHandler 对称）
        services.AddScoped<AlertStatusNotificationHandler>();
        // 告警多渠道通知 — 站内通知持久化 + 钉钉/飞书机器人推送（Critical/High）
        services.AddScoped<EquipAI.Application.Alerts.AlertNotificationService>();
        // 数据导出 — 告警/审计日志 CSV 导出
        services.AddScoped<EquipAI.Application.Services.DataExportService>();
        services.AddScoped<DashboardStatsService>();
        // 设备健康度计算（告警 40% + 状态 30% + 遥测质量 30%）
        services.AddScoped<EquipAI.Application.Analysis.DeviceHealthService>();
        // OEE 综合效率（可用率 × 性能 × 质量）
        services.AddScoped<EquipAI.Application.Analysis.OeeService>();
        // AI 诊断评估服务 — 对比 ground truth 与 analyses 表计算命中率
        services.AddScoped<EquipAI.Application.Evaluation.EvaluationService>();
        // FMEA 故障模式库（Phase 5 新增）
        services.AddScoped<EquipAI.Application.Fmea.FmeaService>();
        // 趋势预警分析（Phase 5 新增）
        services.AddScoped<EquipAI.Application.Analysis.TrendAnalysisService>();
        // 设备对比分析（Phase 5 新增）
        services.AddScoped<EquipAI.Application.Analysis.DeviceComparisonService>();
        // 运营报表引擎（Phase 5 新增）
        services.AddScoped<EquipAI.Application.Reports.OperationsReportService>();
        // 工单 SLA 管理（Phase 5 新增）
        services.AddScoped<EquipAI.Application.WorkOrders.SlaManagementService>();
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

            // Token 来源优先级：
            //   1. SignalR WebSocket：从 query string 的 access_token 参数读取（WebSocket 无法携带 Cookie/Header）
            //   2. HttpOnly Cookie：浏览器自动携带，防 XSS 窃取（前端迁移完成后主要来源）
            //   3. Authorization Header：Bearer Token（向后兼容，开发阶段 / 非浏览器客户端）
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var path = context.HttpContext.Request.Path;

                    // SignalR WebSocket 路径：优先从 query string 取 token
                    if (path.StartsWithSegments("/hubs"))
                    {
                        var qsToken = context.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(qsToken))
                        {
                            context.Token = qsToken;
                            return Task.CompletedTask;
                        }
                    }

                    // 非 SignalR 请求（或 SignalR 未携带 query token）：从 HttpOnly Cookie 读取
                    if (context.Request.Cookies.TryGetValue("access_token", out var cookieToken)
                        && !string.IsNullOrEmpty(cookieToken))
                    {
                        context.Token = cookieToken;
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
