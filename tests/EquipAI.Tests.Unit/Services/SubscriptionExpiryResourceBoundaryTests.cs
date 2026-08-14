using System.Data.Common;
using EquipAI.Application.Services;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Tests.Unit.TestHelpers;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Services;

/// <summary>
/// 订阅到期后台服务的资源边界回归测试。
/// 到期租户规模增长时，扫描必须使用稳定主键分页，不能把所有租户实体一次性加载并跟踪。
/// </summary>
public sealed class SubscriptionExpiryResourceBoundaryTests : IAsyncLifetime
{
    private readonly SubscriptionExpiryCommandCounter _commandCounter = new();
    private SqliteConnection _connection = null!;
    private ServiceProvider _sp = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_commandCounter));
        services.AddScoped<ITenantContext>(_ => new BackgroundTenantContext());
        services.AddLogging();
        _sp = services.BuildServiceProvider();

        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _sp.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task CheckAndProcessExpirationsAsync_过期租户超过批次时每次租户读取都应有上限()
    {
        var expiredTrialIds = Enumerable.Range(0, 501).Select(_ => Guid.NewGuid()).ToArray();
        var expiredSubscriptionIds = Enumerable.Range(0, 501).Select(_ => Guid.NewGuid()).ToArray();

        using (var seedScope = _sp.CreateScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Tenants.AddRange(expiredTrialIds.Select(id => new Tenant
            {
                Id = id,
                Name = $"过期试用-{id:N}",
                Slug = $"trial-{id:N}",
                Plan = TenantPlan.Trial,
                Status = TenantStatus.Trial,
                TrialEndsAt = DateTime.UtcNow.AddDays(-1),
            }));
            db.Tenants.AddRange(expiredSubscriptionIds.Select(id => new Tenant
            {
                Id = id,
                Name = $"过期订阅-{id:N}",
                Slug = $"subscription-{id:N}",
                Plan = TenantPlan.Professional,
                Status = TenantStatus.Active,
                SubscriptionEndsAt = DateTime.UtcNow.AddDays(-1),
            }));
            await db.SaveChangesAsync();
        }

        var service = new SubscriptionExpiryService(
            _sp.GetRequiredService<IServiceScopeFactory>(),
            new AlwaysAcquireLockProvider(),
            _sp.GetRequiredService<ILogger<SubscriptionExpiryService>>());
        _commandCounter.Reset();

        await service.CheckAndProcessExpirationsAsync();

        _commandCounter.GetTenantSelects()
            .Should().NotBeEmpty()
            .And.OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase),
                "订阅到期扫描不应一次性加载全部过期租户");

        using var assertScope = _sp.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDbContext>();
        var expiredTrials = await assertDb.Tenants
            .IgnoreQueryFilters()
            .Where(tenant => expiredTrialIds.Contains(tenant.Id))
            .ToListAsync();
        var expiredSubscriptions = await assertDb.Tenants
            .IgnoreQueryFilters()
            .Where(tenant => expiredSubscriptionIds.Contains(tenant.Id))
            .ToListAsync();

        expiredTrials.Should().OnlyContain(tenant => tenant.Status == TenantStatus.Expired);
        expiredSubscriptions.Should().OnlyContain(tenant =>
            tenant.Status == TenantStatus.Trial
            && tenant.Plan == TenantPlan.Trial
            && tenant.TrialEndsAt == null
            && tenant.MaxDevices == 5
            && tenant.MaxUsers == 3
            && tenant.DataRetentionDays == 30);
    }

    /// <summary>复刻后台服务无 HTTP 上下文时的空租户上下文。</summary>
    private sealed class BackgroundTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    /// <summary>记录订阅到期服务读取租户的 SQL，防止无界 ToListAsync 回归。</summary>
    private sealed class SubscriptionExpiryCommandCounter : DbCommandInterceptor
    {
        private readonly object _gate = new();
        private List<string> _commands = [];

        public void Reset()
        {
            lock (_gate)
                _commands = [];
        }

        public IReadOnlyList<string> GetTenantSelects()
        {
            lock (_gate)
            {
                return _commands
                    .Where(sql => sql.Contains("Tenants", StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }
        }

        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            Record(command);
            return result;
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            Record(command);
            return ValueTask.FromResult(result);
        }

        private void Record(DbCommand command)
        {
            if (!command.CommandText.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
                return;

            lock (_gate)
                _commands.Add(command.CommandText);
        }
    }
}
