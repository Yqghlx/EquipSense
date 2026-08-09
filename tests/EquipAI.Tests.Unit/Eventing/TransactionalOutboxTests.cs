using EquipAI.Core.Entities;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Data.Entities;
using EquipAI.Infrastructure.Messaging;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace EquipAI.Tests.Unit.Eventing;

/// <summary>
/// 事务 Outbox、分发租约和事件白名单测试。
/// 这些测试先固定可靠性边界，再实现基础设施，避免把“最终一致”误写成“尽力而为”。
/// </summary>
public sealed class TransactionalOutboxTests
{
    [Fact]
    public async Task 业务变更与事件发布在同一个DbContext中一起持久化()
    {
        await using var fixture = await SqliteFixture.CreateAsync();
        var eventBusTransport = new Mock<IEventBusTransport>().Object;
        var bus = new TransactionalEventBus(
            fixture.Db,
            eventBusTransport,
            NullLogger<TransactionalEventBus>.Instance);
        var tenantId = Guid.NewGuid();

        fixture.Db.AuditLogs.Add(new AuditLog
        {
            TenantId = tenantId,
            Action = "测试",
            ResourceType = "outbox-test",
            Description = "业务状态"
        });

        var @event = new AlertTriggeredEvent(
            Guid.NewGuid(), DateTime.UtcNow, tenantId, Guid.NewGuid(), Guid.NewGuid(),
            null, "temperature", 96.5, "High");

        await bus.PublishAsync(@event);

        (await fixture.Db.AuditLogs.IgnoreQueryFilters().CountAsync()).Should().Be(1);
        var message = await fixture.Db.OutboxMessages
            .IgnoreQueryFilters()
            .SingleAsync(item => item.Id == @event.EventId);
        message.TenantId.Should().Be(tenantId);
        message.EventType.Should().Be(nameof(AlertTriggeredEvent));
        message.PublishedAt.Should().BeNull();
        IntegrationEventSerializer.Deserialize(message.EventType, message.Payload)
            .Should().BeEquivalentTo(@event);
    }

    [Fact]
    public async Task Outbox租约只允许一个实例发布且旧租约不能覆盖新租约()
    {
        await using var fixture = await SqliteFixture.CreateAsync();
        var message = new OutboxMessage
        {
            Id = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            EventType = nameof(AlertTriggeredEvent),
            Payload = "{}",
            OccurredAt = DateTime.UtcNow,
            AvailableAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        fixture.Db.OutboxMessages.Add(message);
        await fixture.Db.SaveChangesAsync();

        var store = new OutboxMessageStore(fixture.Db);
        var first = await store.TryClaimAsync(
            message.Id, DateTime.UtcNow, TimeSpan.FromMinutes(1));
        var second = await store.TryClaimAsync(
            message.Id, DateTime.UtcNow, TimeSpan.FromMinutes(1));

        first.Should().NotBeNull();
        second.Should().BeNull();

        var recovered = await store.TryClaimAsync(
            message.Id, DateTime.UtcNow.AddMinutes(2), TimeSpan.FromMinutes(1));
        recovered.Should().NotBeNull();

        (await store.MarkPublishedAsync(message.Id, first!.LockToken, DateTime.UtcNow))
            .Should().BeFalse();
        (await store.MarkPublishedAsync(message.Id, recovered!.LockToken, DateTime.UtcNow))
            .Should().BeTrue();
        (await fixture.Db.OutboxMessages.IgnoreQueryFilters().AsNoTracking().SingleAsync(item => item.Id == message.Id))
            .PublishedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Inbox重复投递只执行一次并支持过期租约恢复()
    {
        await using var fixture = await SqliteFixture.CreateAsync();
        var @event = new AlertTriggeredEvent(
            Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            null, "vibration", 12.3, "Critical");
        var store = new InboxMessageStore(fixture.Db);
        const string handlerKey = "EquipAI.Tests.Unit.Eventing.TestHandler";

        var first = await store.TryClaimAsync(
            @event, handlerKey, DateTime.UtcNow, TimeSpan.FromMinutes(1));
        var concurrent = await store.TryClaimAsync(
            @event, handlerKey, DateTime.UtcNow, TimeSpan.FromMinutes(1));

        first.Status.Should().Be(InboxClaimStatus.Claimed);
        concurrent.Status.Should().Be(InboxClaimStatus.Locked);

        var recovered = await store.TryClaimAsync(
            @event, handlerKey, DateTime.UtcNow.AddMinutes(2), TimeSpan.FromMinutes(1));
        recovered.Status.Should().Be(InboxClaimStatus.Claimed);

        (await store.MarkProcessedAsync(@event.EventId, handlerKey, first.LockToken, DateTime.UtcNow))
            .Should().BeFalse();
        (await store.MarkProcessedAsync(@event.EventId, handlerKey, recovered.LockToken, DateTime.UtcNow))
            .Should().BeTrue();

        var duplicate = await store.TryClaimAsync(
            @event, handlerKey, DateTime.UtcNow.AddMinutes(3), TimeSpan.FromMinutes(1));
        duplicate.Status.Should().Be(InboxClaimStatus.AlreadyProcessed);
    }

    [Fact]
    public void 事件序列化只允许内置白名单类型()
    {
        var @event = new WorkOrderCreatedEvent(
            Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "测试工单", "High");

        var serialized = IntegrationEventSerializer.Serialize(@event);
        serialized.EventType.Should().Be(nameof(WorkOrderCreatedEvent));
        IntegrationEventSerializer.Deserialize(serialized.EventType, serialized.Payload)
            .Should().BeEquivalentTo(@event);

        var action = () => IntegrationEventSerializer.Deserialize("System.String", "\"危险\"");
        action.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public async Task Outbox分发成功后才标记已发布()
    {
        await using var fixture = await SqliteFixture.CreateAsync();
        var @event = new WorkOrderCreatedEvent(
            Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "待分发工单", "Medium");
        var serialized = IntegrationEventSerializer.Serialize(@event);
        fixture.Db.OutboxMessages.Add(new OutboxMessage
        {
            Id = @event.EventId,
            TenantId = @event.TenantId,
            EventType = serialized.EventType,
            Payload = serialized.Payload,
            OccurredAt = @event.OccurredAt,
            CreatedAt = DateTime.UtcNow,
            AvailableAt = DateTime.UtcNow
        });
        await fixture.Db.SaveChangesAsync();

        var transport = new Mock<IEventBusTransport>();
        var scopes = CreateDispatcherScope(fixture.Db);
        var dispatcher = new OutboxDispatcher(
            scopes.Object,
            transport.Object,
            Options.Create(new OutboxOptions { BatchSize = 10 }),
            NullLogger<OutboxDispatcher>.Instance);

        await dispatcher.DispatchBatchAsync(CancellationToken.None);

        transport.Verify(
            item => item.PublishAsync(It.Is<IIntegrationEvent>(value => value.EventId == @event.EventId), It.IsAny<CancellationToken>()),
            Times.Once);
        var saved = await fixture.Db.OutboxMessages
            .IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(item => item.Id == @event.EventId);
        saved.PublishedAt.Should().NotBeNull();
        saved.AttemptCount.Should().Be(1);
    }

    [Fact]
    public async Task Outbox分发失败保留消息并安排退避重试()
    {
        await using var fixture = await SqliteFixture.CreateAsync();
        var @event = new WorkOrderCreatedEvent(
            Guid.NewGuid(), DateTime.UtcNow, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "发布失败工单", "Low");
        var serialized = IntegrationEventSerializer.Serialize(@event);
        fixture.Db.OutboxMessages.Add(new OutboxMessage
        {
            Id = @event.EventId,
            TenantId = @event.TenantId,
            EventType = serialized.EventType,
            Payload = serialized.Payload,
            OccurredAt = @event.OccurredAt,
            CreatedAt = DateTime.UtcNow,
            AvailableAt = DateTime.UtcNow
        });
        await fixture.Db.SaveChangesAsync();

        var transport = new Mock<IEventBusTransport>();
        transport
            .Setup(item => item.PublishAsync(It.IsAny<IIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("broker 不可用"));
        var scopes = CreateDispatcherScope(fixture.Db);
        var dispatcher = new OutboxDispatcher(
            scopes.Object,
            transport.Object,
            Options.Create(new OutboxOptions { BatchSize = 10, MaxBackoffSeconds = 30 }),
            NullLogger<OutboxDispatcher>.Instance);

        await dispatcher.DispatchBatchAsync(CancellationToken.None);

        var saved = await fixture.Db.OutboxMessages
            .IgnoreQueryFilters()
            .AsNoTracking()
            .SingleAsync(item => item.Id == @event.EventId);
        saved.PublishedAt.Should().BeNull();
        saved.LockedUntil.Should().BeNull();
        saved.LastError.Should().Contain("broker 不可用");
        saved.AvailableAt.Should().BeAfter(DateTime.UtcNow);
        saved.AttemptCount.Should().Be(1);
    }

    private static Mock<IServiceScopeFactory> CreateDispatcherScope(AppDbContext db)
    {
        var provider = new Mock<IServiceProvider>();
        provider.Setup(item => item.GetService(typeof(AppDbContext))).Returns(db);
        provider.Setup(item => item.GetService(typeof(OutboxMessageStore)))
            .Returns(new OutboxMessageStore(db));
        var scope = new Mock<IServiceScope>();
        scope.SetupGet(item => item.ServiceProvider).Returns(provider.Object);
        var factory = new Mock<IServiceScopeFactory>();
        factory.Setup(item => item.CreateScope()).Returns(scope.Object);
        return factory;
    }

    private sealed class SqliteFixture : IAsyncDisposable
    {
        private readonly SqliteConnection _connection;

        private SqliteFixture(SqliteConnection connection, AppDbContext db)
        {
            _connection = connection;
            Db = db;
        }

        public AppDbContext Db { get; }

        public static async Task<SqliteFixture> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(connection)
                .Options;
            var db = new AppDbContext(options, new TestTenantContext());
            await db.Database.EnsureCreatedAsync();
            return new SqliteFixture(connection, db);
        }

        public async ValueTask DisposeAsync()
        {
            await Db.DisposeAsync();
            await _connection.DisposeAsync();
        }
    }

    private sealed class TestTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
