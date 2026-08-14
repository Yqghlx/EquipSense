using EquipAI.Application.Alerts;
using EquipAI.Application.Notifications;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using System.Net;

namespace EquipAI.Tests.Unit.Alerts;

/// <summary>
/// AlertNotificationService 单元测试
/// 验证告警多渠道通知的关键行为：
/// - Critical/High 告警触发机器人推送
/// - Low/Normal 告警不推送机器人（但仍持久化站内通知）
/// - 站内通知按运维角色分发（SystemAdmin/MaintenanceLead/Technician）
/// - 集成配置未配置时不报错
/// </summary>
public class AlertNotificationServiceTests
{
    private static async Task<(AppDbContext db, AlertNotificationService svc)> CreateAsync(
        Func<AppDbContext, Task>? seed = null,
        IInterceptor? interceptor = null)
    {
        var dbName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseInMemoryDatabase(dbName);
            if (interceptor is not null)
                options.AddInterceptors(interceptor);
        });
        services.AddLogging();
        services.AddHttpClient("AlertIntegration");
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.Empty));
        services.AddScoped<NotificationPreferenceService>();
        var sp = services.BuildServiceProvider();
        var db = sp.GetRequiredService<AppDbContext>();

        if (seed is not null)
            await seed(db);

        var svc = new AlertNotificationService(
            sp.GetRequiredService<IServiceScopeFactory>(),
            sp.GetRequiredService<IHttpClientFactory>(),
            Mock.Of<ILogger<AlertNotificationService>>());
        return (db, svc);
    }

    private static (AppDbContext db, AlertNotificationService svc) CreateWithHttpClient(
        CancellationTokenSource cancellationSource)
    {
        var dbName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddLogging();
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.Empty));
        services.AddScoped<NotificationPreferenceService>();
        var sp = services.BuildServiceProvider();
        var db = sp.GetRequiredService<AppDbContext>();

        var httpClientFactoryMock = new Mock<IHttpClientFactory>();
        httpClientFactoryMock
            .Setup(f => f.CreateClient("AlertIntegration"))
            .Returns(new HttpClient(new CancellationTriggerHandler(cancellationSource)));

        var svc = new AlertNotificationService(
            sp.GetRequiredService<IServiceScopeFactory>(),
            httpClientFactoryMock.Object,
            Mock.Of<ILogger<AlertNotificationService>>());
        return (db, svc);
    }

    private static (
        AppDbContext db,
        AlertNotificationService svc,
        Mock<ILogger<AlertNotificationService>> logger) CreateWithHttpHandler(
        HttpMessageHandler handler)
    {
        var dbName = Guid.NewGuid().ToString();
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddLogging();
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.Empty));
        services.AddScoped<NotificationPreferenceService>();
        var sp = services.BuildServiceProvider();
        var db = sp.GetRequiredService<AppDbContext>();

        var httpClientFactoryMock = new Mock<IHttpClientFactory>();
        httpClientFactoryMock
            .Setup(f => f.CreateClient("AlertIntegration"))
            .Returns(new HttpClient(handler));

        var logger = new Mock<ILogger<AlertNotificationService>>();
        var svc = new AlertNotificationService(
            sp.GetRequiredService<IServiceScopeFactory>(),
            httpClientFactoryMock.Object,
            logger.Object);
        return (db, svc, logger);
    }

    private static AlertTriggeredEvent MakeEvent(Guid alertId, Guid tenantId, string severity = "Critical") => new(
        EventId: Guid.NewGuid(),
        OccurredAt: DateTime.UtcNow,
        TenantId: tenantId,
        AlertId: alertId,
        DeviceId: Guid.NewGuid(),
        RuleId: null,
        Metric: "oil_temperature",
        Value: 95.0,
        Severity: severity);

    private static Alert MakeAlert(Guid id, Guid tenantId) => new()
    {
        Id = id,
        TenantId = tenantId,
        DeviceId = Guid.NewGuid(),
        Severity = AlertSeverity.Critical,
        Status = AlertStatus.Active,
        Metric = "oil_temperature",
        Message = "test",
        AlertCode = "ALT-001",
        OccurredAt = DateTime.UtcNow,
    };

    [Fact]
    public async Task Should_Persist_InApp_Notification_For_Operations_Roles()
    {
        var tenantId = Guid.Empty;
        var alertId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            // 3 个活动运维角色用户 + 1 个停用运维用户 + 1 个观察者（后两者均不应收到）
            await ctx.Users.AddRangeAsync(
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.SystemAdmin, Username = "a", DisplayName = "A", PasswordHash = "x" },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.MaintenanceLead, Username = "b", DisplayName = "B", PasswordHash = "x" },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.Technician, Username = "c", DisplayName = "C", PasswordHash = "x" },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.Technician, Username = "inactive", DisplayName = "Inactive", PasswordHash = "x", IsActive = false },
                new User { Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.Viewer, Username = "d", DisplayName = "D", PasswordHash = "x" }
            );
            await ctx.SaveChangesAsync();
        });

        await svc.DispatchAsync(MakeEvent(alertId, tenantId), MakeAlert(alertId, tenantId));

        var notifications = await db.Notifications.ToListAsync();
        notifications.Should().HaveCount(3, "仅 SystemAdmin/MaintenanceLead/Technician 应收到告警通知");
        notifications.All(n => n.Type == "alert").Should().BeTrue();
        notifications.All(n => n.RelatedId == alertId).Should().BeTrue();
    }

    [Fact]
    public async Task Alert_Email_Preference_Should_Enqueue_Only_Eligible_Users()
    {
        var tenantId = Guid.NewGuid();
        var alertId = Guid.NewGuid();
        var optedInUserId = Guid.NewGuid();
        var noEmailUserId = Guid.NewGuid();
        var optedOutUserId = Guid.NewGuid();
        var inactiveUserId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Users.AddRangeAsync(
                new User
                {
                    Id = optedInUserId,
                    TenantId = tenantId,
                    Role = UserRole.Technician,
                    Username = "email-opted-in",
                    PasswordHash = "x",
                    Email = "opted-in@example.com",
                    NotificationPrefs = "{\"alert\":{\"email\":true}}",
                },
                new User
                {
                    Id = noEmailUserId,
                    TenantId = tenantId,
                    Role = UserRole.MaintenanceLead,
                    Username = "email-missing",
                    PasswordHash = "x",
                    NotificationPrefs = "{\"alert\":{\"email\":true}}",
                },
                new User
                {
                    Id = optedOutUserId,
                    TenantId = tenantId,
                    Role = UserRole.SystemAdmin,
                    Username = "email-opted-out",
                    PasswordHash = "x",
                    Email = "opted-out@example.com",
                    NotificationPrefs = "{\"alert\":{\"email\":false}}",
                },
                new User
                {
                    Id = inactiveUserId,
                    TenantId = tenantId,
                    Role = UserRole.Technician,
                    Username = "email-inactive",
                    PasswordHash = "x",
                    Email = "inactive@example.com",
                    IsActive = false,
                    NotificationPrefs = "{\"alert\":{\"email\":true}}",
                });
            await ctx.SaveChangesAsync();
        });

        await svc.DispatchAsync(MakeEvent(alertId, tenantId), MakeAlert(alertId, tenantId));

        var notifications = await db.Notifications
            .IgnoreQueryFilters()
            .Where(item => item.TenantId == tenantId)
            .ToListAsync();
        notifications.Should().HaveCount(3);
        notifications.Select(item => item.Id).Should().OnlyHaveUniqueItems();

        var deliveries = await db.EmailNotificationDeliveries
            .IgnoreQueryFilters()
            .Where(item => item.TenantId == tenantId)
            .ToListAsync();
        deliveries.Should().ContainSingle();
        deliveries[0].UserId.Should().Be(optedInUserId);
        deliveries[0].NotificationId.Should().Be(
            notifications.Single(item => item.UserId == optedInUserId).Id);
    }

    [Fact]
    public async Task 同一告警事件重放不应重复创建站内通知或邮件任务()
    {
        var tenantId = Guid.NewGuid();
        var alertId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            ctx.Users.Add(new User
            {
                Id = userId,
                TenantId = tenantId,
                Role = UserRole.Technician,
                Username = "event-idempotency-user",
                PasswordHash = "x",
                Email = "event-idempotency@example.com",
                NotificationPrefs = "{\"alert\":{\"email\":true}}",
            });
            await ctx.SaveChangesAsync();
        });
        var @event = MakeEvent(alertId, tenantId);
        var alert = MakeAlert(alertId, tenantId);

        await svc.DispatchAsync(@event, alert);
        await svc.DispatchAsync(@event, alert);

        (await db.Notifications.IgnoreQueryFilters()
                .Where(item => item.TenantId == tenantId && item.UserId == userId)
                .ToListAsync())
            .Should().ContainSingle();
        (await db.EmailNotificationDeliveries.IgnoreQueryFilters()
                .Where(item => item.TenantId == tenantId && item.UserId == userId)
                .ToListAsync())
            .Should().ContainSingle();
    }

    [Fact]
    public async Task 站内通知数据库写入失败时应传播异常以触发事件重试()
    {
        var tenantId = Guid.NewGuid();
        var alertId = Guid.NewGuid();
        var interceptor = new NotificationSaveFailureInterceptor();
        var (_, svc) = await CreateAsync(async ctx =>
        {
            ctx.Users.Add(new User
            {
                TenantId = tenantId,
                Role = UserRole.SystemAdmin,
                Username = "notification-save-failure-user",
                PasswordHash = "x",
            });
            await ctx.SaveChangesAsync();
        }, interceptor);
        interceptor.Enabled = true;

        var act = () => svc.DispatchAsync(MakeEvent(alertId, tenantId), MakeAlert(alertId, tenantId));

        await act.Should().ThrowAsync<DbUpdateException>();
    }

    [Theory]
    [InlineData("Low")]
    [InlineData("Normal")]
    public async Task Low_Severity_Should_Still_Persist_InApp_Notification(string severity)
    {
        var alertId = Guid.NewGuid();
        var tenantId = Guid.Empty;
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Users.AddAsync(new User
            {
                Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.SystemAdmin,
                Username = "a", DisplayName = "A", PasswordHash = "x",
            });
            await ctx.SaveChangesAsync();
        });

        await svc.DispatchAsync(MakeEvent(alertId, tenantId, severity), MakeAlert(alertId, tenantId));

        var notifications = await db.Notifications.ToListAsync();
        // 低级别仍应持久化站内通知（机器人不推送是另一回事）
        notifications.Should().HaveCount(1);
    }

    [Fact]
    public async Task No_Integration_Config_Should_Not_Throw()
    {
        var alertId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var (db, svc) = await CreateAsync();

        // 租户无 integrations 配置，不应抛异常（机器人推送被跳过）
        var act = async () => await svc.DispatchAsync(MakeEvent(alertId, tenantId, "Critical"), MakeAlert(alertId, tenantId));
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Notification_Content_Should_Include_Metric_And_Value()
    {
        var alertId = Guid.NewGuid();
        var tenantId = Guid.Empty;
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Users.AddAsync(new User
            {
                Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.SystemAdmin,
                Username = "a", DisplayName = "A", PasswordHash = "x",
            });
            await ctx.SaveChangesAsync();
        });

        await svc.DispatchAsync(MakeEvent(alertId, tenantId, "High"), MakeAlert(alertId, tenantId));

        var n = await db.Notifications.FirstAsync();
        n.Content.Should().Contain("oil_temperature");
        n.Content.Should().Contain("95");
        n.Title.Should().Contain("oil_temperature");
    }

    /// <summary>
    /// 验证站内通知内容展示设备友好标识（编码+名称）而非原始 UUID
    ///
    /// 背景：历史 PersistInAppNotificationAsync 直接拼 alert.DeviceId（UUID）到 Content，
    /// 而同一告警的钉钉/飞书卡片却查询并展示 deviceLabel。结果 NotificationsPage 直接渲染 content，
    /// 运维人员在站内通知里看到不可读的设备 GUID（与机器人卡片不一致），降低工业产品专业度。
    /// </summary>
    [Fact]
    public async Task Notification_Content_Should_Show_Device_Label_Not_Raw_Uuid()
    {
        var tenantId = Guid.Empty;
        var alertId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();

        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Users.AddAsync(new User
            {
                Id = Guid.NewGuid(), TenantId = tenantId, Role = UserRole.SystemAdmin,
                Username = "a", DisplayName = "A", PasswordHash = "x",
            });
            // 注册设备：编码 PUMP-001 + 名称 一号泵（站内通知应展示此友好标识）
            await ctx.Devices.AddAsync(new Device
            {
                Id = deviceId, TenantId = tenantId,
                DeviceCode = "PUMP-001", Name = "一号泵", Type = "泵",
            });
            await ctx.SaveChangesAsync();
        });

        // 事件与告警的 DeviceId 指向已注册设备
        var evt = new AlertTriggeredEvent(
            EventId: Guid.NewGuid(), OccurredAt: DateTime.UtcNow,
            TenantId: tenantId, AlertId: alertId, DeviceId: deviceId,
            RuleId: null, Metric: "oil_temperature", Value: 95.0, Severity: "High");
        var alert = new Alert
        {
            Id = alertId, TenantId = tenantId, DeviceId = deviceId,
            Severity = AlertSeverity.High, Status = AlertStatus.Active,
            Metric = "oil_temperature", AlertCode = "ALT-001", OccurredAt = DateTime.UtcNow,
        };

        await svc.DispatchAsync(evt, alert);

        var n = await db.Notifications.FirstAsync();
        n.Content.Should().Contain("PUMP-001", "站内通知应展示设备编码而非原始 UUID");
        n.Content.Should().NotContain(deviceId.ToString(),
            "不应在通知内容中展示不可读的设备 GUID（应显示 PUMP-001（一号泵））");
    }

    /// <summary>
    /// 安全边界：事件租户与设备租户不一致时，通知内容不得泄露其他租户的设备标识。
    ///
    /// Why：后台通知使用 UnfilteredSet 绕过 HTTP 租户过滤器是必要的，但设备标签仍必须按事件租户校验，
    /// 否则只要事件携带了其他租户设备 ID，站内通知或机器人消息就会泄露设备编码和名称。
    /// </summary>
    [Fact]
    public async Task Notification_Content_事件租户与设备租户不一致_不应泄露其他租户设备标签()
    {
        var eventTenantId = Guid.NewGuid();
        var deviceTenantId = Guid.NewGuid();
        var alertId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();
        var (db, svc) = await CreateAsync(async ctx =>
        {
            await ctx.Users.AddAsync(new User
            {
                Id = Guid.NewGuid(),
                TenantId = eventTenantId,
                Role = UserRole.SystemAdmin,
                Username = "event-tenant-admin",
                DisplayName = "事件租户管理员",
                PasswordHash = "x",
            });
            await ctx.Devices.AddAsync(new Device
            {
                Id = deviceId,
                TenantId = deviceTenantId,
                DeviceCode = "SECRET-TENANT-A-PUMP",
                Name = "租户A机密设备",
                Type = "泵",
            });
            await ctx.SaveChangesAsync();
        });

        var evt = new AlertTriggeredEvent(
            EventId: Guid.NewGuid(),
            OccurredAt: DateTime.UtcNow,
            TenantId: eventTenantId,
            AlertId: alertId,
            DeviceId: deviceId,
            RuleId: null,
            Metric: "oil_temperature",
            Value: 95.0,
            Severity: "Low");
        var alert = new Alert
        {
            Id = alertId,
            TenantId = eventTenantId,
            DeviceId = deviceId,
            Severity = AlertSeverity.Low,
            Status = AlertStatus.Active,
            Metric = "oil_temperature",
            AlertCode = "ALT-CROSS-TENANT",
            OccurredAt = DateTime.UtcNow,
        };

        await svc.DispatchAsync(evt, alert);

        var notification = await db.Notifications
            .IgnoreQueryFilters()
            .SingleAsync();
        notification.Content.Should().NotContain("SECRET-TENANT-A-PUMP",
            "通知不得泄露其他租户设备编码");
        notification.Content.Should().NotContain("租户A机密设备",
            "通知不得泄露其他租户设备名称");
    }

    [Fact]
    public async Task DispatchAsync_机器人推送收到停机取消时应传播取消信号()
    {
        var tenantId = Guid.NewGuid();
        var alertId = Guid.NewGuid();
        using var cts = new CancellationTokenSource();
        var (db, svc) = CreateWithHttpClient(cts);
        db.Tenants.Add(new Tenant
        {
            Id = tenantId,
            Name = "取消传播测试租户",
            Slug = $"cancel-{Guid.NewGuid():N}",
            Settings = "{\"integrations\":{\"dingtalk\":{\"enabled\":true,\"webhookUrl\":\"https://example.test/robot\"}}}",
        });
        await db.SaveChangesAsync();

        var act = () => svc.DispatchAsync(
            MakeEvent(alertId, tenantId),
            MakeAlert(alertId, tenantId),
            cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }

    [Fact]
    public async Task DispatchAsync_机器人返回非成功状态后恢复_应重试并停止在成功响应()
    {
        var tenantId = Guid.NewGuid();
        var alertId = Guid.NewGuid();
        var handler = new SequenceResponseHandler(
            "{\"errcode\":0,\"errmsg\":\"ok\"}",
            HttpStatusCode.BadGateway,
            HttpStatusCode.ServiceUnavailable,
            HttpStatusCode.OK);
        var (db, svc, _) = CreateWithHttpHandler(handler);
        db.Tenants.Add(new Tenant
        {
            Id = tenantId,
            Name = "告警重试测试租户",
            Slug = $"alert-retry-{Guid.NewGuid():N}",
            Settings = "{\"integrations\":{\"dingtalk\":{\"enabled\":true,\"webhookUrl\":\"https://example.test/robot\"}}}",
        });
        await db.SaveChangesAsync();

        await svc.DispatchAsync(
            MakeEvent(alertId, tenantId),
            MakeAlert(alertId, tenantId));

        handler.RequestCount.Should().Be(3);
    }

    [Fact]
    public async Task DispatchAsync_机器人持续返回非成功状态_应重试3次并记录最终失败()
    {
        var tenantId = Guid.NewGuid();
        var alertId = Guid.NewGuid();
        var handler = new SequenceResponseHandler(
            "{\"errcode\":0,\"errmsg\":\"ok\"}",
            HttpStatusCode.BadGateway,
            HttpStatusCode.BadGateway,
            HttpStatusCode.BadGateway);
        var (db, svc, logger) = CreateWithHttpHandler(handler);
        db.Tenants.Add(new Tenant
        {
            Id = tenantId,
            Name = "告警失败测试租户",
            Slug = $"alert-failure-{Guid.NewGuid():N}",
            Settings = "{\"integrations\":{\"dingtalk\":{\"enabled\":true,\"webhookUrl\":\"https://example.test/robot\"}}}",
        });
        await db.SaveChangesAsync();

        await svc.DispatchAsync(
            MakeEvent(alertId, tenantId),
            MakeAlert(alertId, tenantId));

        handler.RequestCount.Should().Be(3);
        logger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((value, _) => value.ToString()!.Contains("告警机器人推送最终失败")),
                null,
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task DispatchAsync_钉钉HTTP成功但业务错误码非零_应重试并记录失败()
    {
        var tenantId = Guid.NewGuid();
        var alertId = Guid.NewGuid();
        var handler = new SequenceResponseHandler(
            "{\"errcode\":310000,\"errmsg\":\"签名无效\"}",
            HttpStatusCode.OK,
            HttpStatusCode.OK,
            HttpStatusCode.OK);
        var (db, svc, _) = CreateWithHttpHandler(handler);
        db.Tenants.Add(new Tenant
        {
            Id = tenantId,
            Name = "告警业务失败测试租户",
            Slug = $"alert-business-failure-{Guid.NewGuid():N}",
            Settings = "{\"integrations\":{\"dingtalk\":{\"enabled\":true,\"webhookUrl\":\"https://example.test/robot\"}}}",
        });
        await db.SaveChangesAsync();

        await svc.DispatchAsync(
            MakeEvent(alertId, tenantId),
            MakeAlert(alertId, tenantId));

        handler.RequestCount.Should().Be(3);
    }

    [Fact]
    public async Task DispatchAsync_飞书HTTP成功但响应体非法_应重试并记录失败()
    {
        var tenantId = Guid.NewGuid();
        var alertId = Guid.NewGuid();
        var handler = new SequenceResponseHandler(
            "upstream proxy returned an invalid response",
            HttpStatusCode.OK,
            HttpStatusCode.OK,
            HttpStatusCode.OK);
        var (db, svc, _) = CreateWithHttpHandler(handler);
        db.Tenants.Add(new Tenant
        {
            Id = tenantId,
            Name = "告警飞书响应校验测试租户",
            Slug = $"alert-feishu-response-{Guid.NewGuid():N}",
            Settings = "{\"integrations\":{\"feishu\":{\"enabled\":true,\"webhookUrl\":\"https://example.test/feishu\"}}}",
        });
        await db.SaveChangesAsync();

        await svc.DispatchAsync(
            MakeEvent(alertId, tenantId),
            MakeAlert(alertId, tenantId));

        handler.RequestCount.Should().Be(3);
    }

    /// <summary>
    /// 模拟外部机器人在请求过程中触发宿主取消，验证通知服务不会把取消当成普通推送故障吞掉。
    /// </summary>
    private sealed class CancellationTriggerHandler : HttpMessageHandler
    {
        private readonly CancellationTokenSource _cancellationSource;

        public CancellationTriggerHandler(CancellationTokenSource cancellationSource)
        {
            _cancellationSource = cancellationSource;
        }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            _cancellationSource.Cancel();
            throw new OperationCanceledException(_cancellationSource.Token);
        }
    }

    /// <summary>
    /// 按预设 HTTP 状态码序列响应，用于验证告警机器人重试和最终失败语义。
    /// </summary>
    private sealed class SequenceResponseHandler : HttpMessageHandler
    {
        private readonly Queue<HttpStatusCode> _statusCodes;
        private readonly string _responseBody;

        public SequenceResponseHandler(string responseBody, params HttpStatusCode[] statusCodes)
        {
            _statusCodes = new Queue<HttpStatusCode>(statusCodes);
            _responseBody = responseBody;
        }

        public int RequestCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            var statusCode = _statusCodes.Count > 0
                ? _statusCodes.Dequeue()
                : HttpStatusCode.OK;
            return Task.FromResult(new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(_responseBody),
            });
        }
    }

    private sealed class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Database";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    /// <summary>
    /// 仅在测试显式开启后模拟通知事务保存失败，验证事件不能被错误确认。
    /// </summary>
    private sealed class NotificationSaveFailureInterceptor : SaveChangesInterceptor
    {
        public bool Enabled { get; set; }

        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default)
        {
            if (Enabled
                && eventData.Context?.ChangeTracker.Entries<Notification>()
                    .Any(entry => entry.State == EntityState.Added) == true)
            {
                throw new DbUpdateException("模拟站内通知数据库写入失败");
            }

            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }
}
