using System.Data.Common;
using EquipAI.Application.Notifications;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Hubs;
using EquipAI.WebAPI.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace EquipAI.Tests.Unit.Notifications;

/// <summary>
/// SignalR 多渠道通知的资源边界回归测试。
/// </summary>
public sealed class SignalRNotificationResourceBoundaryTests : IAsyncLifetime
{
    private const int UserCount = 501;
    private SqliteConnection _connection = null!;
    private AppDbContext _db = null!;
    private NotificationCommandInterceptor _interceptor = null!;
    private Guid _tenantId;

    public async Task InitializeAsync()
    {
        _tenantId = Guid.NewGuid();
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();
        _interceptor = new NotificationCommandInterceptor();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .AddInterceptors(_interceptor)
            .Options;
        _db = new AppDbContext(options, new TestTenantContext(_tenantId));
        await _db.Database.EnsureCreatedAsync();

        _db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "SignalR 资源边界租户",
            Slug = $"signalr-resource-{Guid.NewGuid():N}",
            MaxUsers = UserCount,
        });

        for (var index = 0; index < UserCount; index++)
        {
            _db.Users.Add(new User
            {
                TenantId = _tenantId,
                Username = $"signalr-resource-user-{index}",
                PasswordHash = "test-hash",
                Role = UserRole.MaintenanceLead,
                IsActive = true,
            });
        }

        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();
        _interceptor.Clear();
    }

    public async Task DisposeAsync()
    {
        await _db.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task SendAlertResolvedAsync_大租户通知应按批次解析推送和持久化收件人()
    {
        var groupBatches = new List<IReadOnlyList<string>>();
        var proxy = new Mock<IClientProxy>();
        proxy
            .Setup(client => client.SendCoreAsync(
                It.IsAny<string>(),
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var clients = new Mock<IHubClients>();
        clients
            .Setup(client => client.Groups(It.IsAny<IReadOnlyList<string>>()))
            .Callback<IReadOnlyList<string>>(groups => groupBatches.Add(groups.ToArray()))
            .Returns(proxy.Object);

        var hub = new Mock<IHubContext<IndustrialHub>>();
        hub.Setup(context => context.Clients).Returns(clients.Object);

        var push = new Mock<IPushNotificationService>();
        var service = new SignalRNotificationService(
            hub.Object,
            push.Object,
            _db,
            Mock.Of<ILogger<SignalRNotificationService>>(),
            new NotificationPreferenceService(
                _db,
                new TestTenantContext(_tenantId),
                Mock.Of<ILogger<NotificationPreferenceService>>()));

        await service.SendAlertResolvedAsync(_tenantId, Guid.NewGuid());

        groupBatches.Should().HaveCount(2);
        groupBatches.Sum(batch => batch.Count).Should().Be(UserCount);
        groupBatches.Should().OnlyContain(batch => batch.Count <= 500);

        var pushBatches = push.Invocations
            .Where(invocation => invocation.Method.Name == nameof(IPushNotificationService.SendToUsersAsync))
            .Select(invocation => ((IReadOnlyCollection<Guid>)invocation.Arguments[1]).Count)
            .ToArray();
        pushBatches.Should().HaveCount(2);
        pushBatches.Sum().Should().Be(UserCount);
        pushBatches.Should().OnlyContain(batchSize => batchSize <= 500);

        (await _db.Notifications.CountAsync()).Should().Be(UserCount);

        var userQueries = _interceptor.SelectSql
            .Where(sql => sql.Contains("users", StringComparison.OrdinalIgnoreCase))
            .ToList();
        userQueries.Should().NotBeEmpty();
        userQueries.Should().OnlyContain(sql =>
            sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>记录用户查询，确保通知链路所有用户结果集都有显式上限。</summary>
    private sealed class NotificationCommandInterceptor : DbCommandInterceptor
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
