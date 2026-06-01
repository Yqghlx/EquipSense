using System.Text;
using EquipAI.Application.Alerts;
using EquipAI.Application.Alerts.Evaluators;
using EquipAI.Application.Alerts.Handlers;
using EquipAI.Application.Analysis;
using EquipAI.Application.Analysis.Handlers;
using EquipAI.Application.Eventing;
using EquipAI.Application.Interfaces;
using EquipAI.Application.Mapping;
using EquipAI.Application.Services;
using EquipAI.Application.Telemetry;
using EquipAI.Application.WorkOrders;
using EquipAI.Application.WorkOrders.Handlers;
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
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

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
        // ITenantContext 通过工厂模式从 HttpContext.Items 中解析，确保每次请求使用正确的租户信息
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

        // MQTT 配置选项
        services.Configure<MqttOptions>(configuration.GetSection("Mqtt"));

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

        // 数据质量服务
        services.AddSingleton<Core.Interfaces.IDataQualityService, DataQualityService>();

        // 根因分析引擎
        services.AddScoped<Core.Interfaces.IAnalysisService, RootCauseAnalysisEngine>();

        // 工单服务
        services.AddScoped<IWorkOrderService, WorkOrderService>();

        // 事件处理器
        services.AddScoped<RootCauseAnalysisHandler>();
        services.AddScoped<WorkOrderAutoCreateHandler>();
        services.AddScoped<WorkOrderAnalysisHandler>();

        // 基线计算后台服务
        services.AddHostedService<BaselineCalculationService>();

        // 事件处理器
        services.AddScoped<TelemetryEventHandler>();
        services.AddScoped<AlertEventHandler>();
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
