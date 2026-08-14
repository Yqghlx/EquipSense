using System.Data.Common;
using EquipAI.Application.Notifications;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Unit.Notifications;

/// <summary>
/// Web Push 批量查询资源边界回归测试。
/// </summary>
public sealed class PushNotificationResourceBoundaryTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private AppDbContext _db = null!;
    private PushNotificationService _service = null!;
    private PushCommandInterceptor _interceptor = null!;
    private Guid _tenantId;

    public async Task InitializeAsync()
    {
        _tenantId = Guid.NewGuid();
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();
        _interceptor = new PushCommandInterceptor();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .AddInterceptors(_interceptor)
            .Options;
        _db = new AppDbContext(options, new TestTenantContext(_tenantId));
        await _db.Database.EnsureCreatedAsync();

        for (var index = 0; index < 501; index++)
        {
            _db.PushSubscriptions.Add(new PushSubscription
            {
                TenantId = _tenantId,
                UserId = Guid.NewGuid(),
                Endpoint = $"https://push.example.test/{index}",
                P256dh = "p256dh",
                Auth = "auth",
            });
        }

        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();
        _interceptor.Clear();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Vapid:Subject"] = "mailto:test@example.com",
            })
            .Build();
        var logger = LoggerFactory.Create(_ => { }).CreateLogger<PushNotificationService>();
        _service = new PushNotificationService(
            _db,
            new TestTenantContext(_tenantId),
            configuration,
            logger);
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task SendToTenantAsync_租户广播应按批次读取活动订阅()
    {
        await _service.SendToTenantAsync(_tenantId, "标题", "内容");

        var subscriptionQueries = _interceptor.SelectSql
            .Where(sql => sql.Contains("push_subscriptions", StringComparison.OrdinalIgnoreCase))
            .ToList();

        subscriptionQueries.Should().HaveCountGreaterThanOrEqualTo(2,
            "501 条订阅不能由一次无界查询加载");
        subscriptionQueries.Should().OnlyContain(sql =>
            sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// 回归：推送批次清理跟踪器时，不能清掉调用方尚未提交的其它实体。
    /// SignalR 先创建站内通知、再复用同一个 DbContext 发送 Web Push；大租户超过一批时，
    /// 若直接调用 ChangeTracker.Clear，会导致最后的 SaveChanges 静默丢失站内通知。
    /// </summary>
    [Fact]
    public async Task SendToTenantAsync_批次清理不得清除调用方未提交的站内通知()
    {
        var notificationId = Guid.NewGuid();
        _db.Notifications.Add(new Notification
        {
            Id = notificationId,
            TenantId = _tenantId,
            UserId = Guid.NewGuid(),
            Type = "alert",
            Title = "待提交通知",
            Content = "批量推送期间仍应保留",
        });

        await _service.SendToTenantAsync(_tenantId, "标题", "内容");
        await _db.SaveChangesAsync();

        (await _db.Notifications.AnyAsync(notification => notification.Id == notificationId))
            .Should().BeTrue("推送服务只能清理自己的订阅跟踪状态，不能丢失调用方待提交的通知");
    }

    /// <summary>记录推送订阅查询，确保租户广播不会产生无界结果集。</summary>
    private sealed class PushCommandInterceptor : DbCommandInterceptor
    {
        private readonly object _syncRoot = new();
        private readonly List<string> _selectSql = [];

        public IReadOnlyList<string> SelectSql
        {
            get
            {
                lock (_syncRoot)
                {
                    return _selectSql.ToArray();
                }
            }
        }

        public void Clear()
        {
            lock (_syncRoot)
            {
                _selectSql.Clear();
            }
        }

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            Record(command);
            return base.ReaderExecuting(command, eventData, result);
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            Record(command);
            return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
        }

        private void Record(DbCommand command)
        {
            if (!command.CommandText.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
                return;

            lock (_syncRoot)
            {
                _selectSql.Add(command.CommandText);
            }
        }
    }

    /// <summary>固定租户上下文。</summary>
    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId => tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.NewGuid();
    }
}
