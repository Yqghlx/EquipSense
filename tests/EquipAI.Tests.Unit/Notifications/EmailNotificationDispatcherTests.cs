using EquipAI.Application.Notifications;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using System.Net.Mail;
using Xunit;

namespace EquipAI.Tests.Unit.Notifications;

/// <summary>
/// 告警邮件 worker 的状态转换和取消边界测试。
/// </summary>
public sealed class EmailNotificationDispatcherTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private ServiceProvider _provider = null!;
    private AppDbContext _db = null!;
    private SqliteConnection _connection = null!;
    private Mock<ISmtpMailSender> _sender = null!;
    private EmailNotificationDispatcher _dispatcher = null!;

    public async Task InitializeAsync()
    {
        _sender = new Mock<ISmtpMailSender>();
        _connection = new SqliteConnection("Data Source=:memory:");
        await _connection.OpenAsync();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<ITenantContext>(new FixedTenantContext(_tenantId));
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlite(_connection));
        services.AddScoped<NotificationPreferenceService>();
        services.AddScoped<EmailNotificationDeliveryStore>();
        services.AddScoped<SmtpEmailNotificationService>();
        services.AddSingleton<ISmtpMailSender>(_sender.Object);
        services.Configure<SmtpOptions>(_ => { });
        services.Configure<EmailDeliveryOptions>(options =>
        {
            options.Enabled = true;
            options.BatchSize = 50;
            options.LeaseSeconds = 60;
            options.MaxAttempts = 2;
            options.MaxBackoffSeconds = 0;
            options.RetentionDays = 90;
        });
        _provider = services.BuildServiceProvider();
        _db = _provider.GetRequiredService<AppDbContext>();
        await _db.Database.EnsureCreatedAsync();
        _dispatcher = new EmailNotificationDispatcher(
            _provider.GetRequiredService<IServiceScopeFactory>(),
            _provider.GetRequiredService<IOptions<EmailDeliveryOptions>>(),
            _provider.GetRequiredService<IOptions<SmtpOptions>>(),
            NullLogger<EmailNotificationDispatcher>.Instance);
        await Task.CompletedTask;
    }

    [Fact]
    public async Task SMTP未配置时不领取任务也不消耗重试次数()
    {
        var delivery = await AddDeliveryAsync(email: true);

        await _dispatcher.DispatchBatchAsync(CancellationToken.None);

        var saved = await _db.EmailNotificationDeliveries.AsNoTracking().SingleAsync();
        saved.Status.Should().Be(EmailDeliveryStatus.Pending);
        saved.AttemptCount.Should().Be(0);
        _sender.Verify(
            item => item.SendAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SMTP成功时应标记任务已发送()
    {
        _provider.GetRequiredService<IOptions<SmtpOptions>>().Value.Host = "smtp.example.com";
        _provider.GetRequiredService<IOptions<SmtpOptions>>().Value.FromEmail = "noreply@example.com";
        _sender.Setup(item => item.SendAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        await AddDeliveryAsync(email: true);

        await _dispatcher.DispatchBatchAsync(CancellationToken.None);

        var saved = await _db.EmailNotificationDeliveries.AsNoTracking().SingleAsync();
        saved.Status.Should().Be(EmailDeliveryStatus.Sent);
        saved.SentAt.Should().NotBeNull();
        _sender.Verify(
            item => item.SendAsync(
                It.Is<MailMessage>(message => message.IsBodyHtml),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SMTP连续失败达到上限时应进入死信()
    {
        _provider.GetRequiredService<IOptions<SmtpOptions>>().Value.Host = "smtp.example.com";
        _provider.GetRequiredService<IOptions<SmtpOptions>>().Value.FromEmail = "noreply@example.com";
        _sender.Setup(item => item.SendAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new SmtpException("连接失败"));
        await AddDeliveryAsync(email: true);

        await _dispatcher.DispatchBatchAsync(CancellationToken.None);
        await _dispatcher.DispatchBatchAsync(CancellationToken.None);

        var saved = await _db.EmailNotificationDeliveries.AsNoTracking().SingleAsync();
        saved.Status.Should().Be(EmailDeliveryStatus.DeadLetter);
        saved.AttemptCount.Should().Be(2);
        saved.LastError.Should().Be("SMTP 未接受邮件");
    }

    [Fact]
    public async Task 用户关闭告警邮件偏好时应取消任务()
    {
        _provider.GetRequiredService<IOptions<SmtpOptions>>().Value.Host = "smtp.example.com";
        _provider.GetRequiredService<IOptions<SmtpOptions>>().Value.FromEmail = "noreply@example.com";
        await AddDeliveryAsync(email: false);

        await _dispatcher.DispatchBatchAsync(CancellationToken.None);

        (await _db.EmailNotificationDeliveries.AsNoTracking().SingleAsync()).Status
            .Should().Be(EmailDeliveryStatus.Cancelled);
        _sender.Verify(
            item => item.SendAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SMTP取消时必须继续传播且不能标记为普通失败()
    {
        _provider.GetRequiredService<IOptions<SmtpOptions>>().Value.Host = "smtp.example.com";
        _provider.GetRequiredService<IOptions<SmtpOptions>>().Value.FromEmail = "noreply@example.com";
        using var cts = new CancellationTokenSource();
        _sender.Setup(item => item.SendAsync(It.IsAny<MailMessage>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                cts.Cancel();
                return Task.FromCanceled(cts.Token);
            });
        await AddDeliveryAsync(email: true);

        var act = () => _dispatcher.DispatchBatchAsync(cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
        (await _db.EmailNotificationDeliveries.AsNoTracking().SingleAsync()).Status
            .Should().Be(EmailDeliveryStatus.Pending);
    }

    private async Task<EmailNotificationDelivery> AddDeliveryAsync(bool email)
    {
        _db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "邮件投递测试租户",
            Slug = $"email-{_tenantId:N}",
            Plan = TenantPlan.Basic,
            Status = TenantStatus.Active,
        });
        var user = new User
        {
            TenantId = _tenantId,
            Username = $"email-user-{Guid.NewGuid():N}",
            PasswordHash = "hash",
            Email = "user@example.com",
            Role = UserRole.Technician,
            IsActive = true,
            NotificationPrefs = email
                ? "{\"alert\":{\"email\":true}}"
                : "{\"alert\":{\"email\":false}}",
        };
        var notification = new Notification
        {
            TenantId = _tenantId,
            UserId = user.Id,
            Type = "alert",
            Title = "设备告警",
            Content = "温度异常",
            Link = "/alerts?alertId=abc",
        };
        var delivery = new EmailNotificationDelivery
        {
            TenantId = _tenantId,
            UserId = user.Id,
            NotificationId = notification.Id,
            AvailableAt = DateTime.UtcNow.AddSeconds(-1),
        };
        _db.Users.Add(user);
        _db.Notifications.Add(notification);
        _db.EmailNotificationDeliveries.Add(delivery);
        await _db.SaveChangesAsync();
        return delivery;
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _provider.DisposeAsync();
        await _connection.DisposeAsync();
    }

    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.NewGuid();
    }
}
