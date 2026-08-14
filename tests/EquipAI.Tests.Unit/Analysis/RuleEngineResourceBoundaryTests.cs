using System.Data.Common;
using EquipAI.Application.Analysis;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace EquipAI.Tests.Unit.Analysis;

/// <summary>
/// 规则诊断候选集资源边界回归测试。
/// </summary>
public sealed class RuleEngineResourceBoundaryTests : IAsyncLifetime
{
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;
    private RuleCommandInterceptor _interceptor = null!;
    private Guid _tenantId;
    private Guid _deviceId;

    public async Task InitializeAsync()
    {
        _tenantId = Guid.NewGuid();
        _deviceId = Guid.NewGuid();
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();
        _interceptor = new RuleCommandInterceptor();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_interceptor));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(_tenantId));
        services.AddLogging();
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
        db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "规则测试租户",
            Slug = $"rule-{_tenantId:N}",
            Plan = TenantPlan.Professional,
            Status = TenantStatus.Active,
            MaxDevices = 10,
        });
        db.Devices.Add(new Device
        {
            Id = _deviceId,
            TenantId = _tenantId,
            DeviceCode = "RULE-001",
            Name = "规则测试设备",
            Type = "电机",
        });
        for (var index = 0; index < 501; index++)
        {
            db.KnowledgeRules.Add(new KnowledgeRule
            {
                TenantId = _tenantId,
                DeviceType = "电机",
                Name = $"不命中规则-{index}",
                Conditions = """[{"metric":"temperature","operator":">","threshold":1000}]""",
                Conclusion = "不应命中",
                Enabled = true,
            });
        }

        await db.SaveChangesAsync();
        _interceptor.Clear();
    }

    public async Task DisposeAsync()
    {
        await _serviceProvider.DisposeAsync();
        await _connection.DisposeAsync();
    }

    [Fact]
    public async Task MatchRuleAsync_候选规则应由数据库排序后流式扫描()
    {
        using var scope = _serviceProvider.CreateScope();
        var service = new RuleEngineAnalysisService(
            scope.ServiceProvider.GetRequiredService<IServiceScopeFactory>(),
            scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<RuleEngineAnalysisService>>());

        var result = await service.MatchRuleAsync(_tenantId, _deviceId, "temperature", 1d);

        result.Should().BeNull();
        var ruleQuery = _interceptor.SelectSql
            .Single(sql => sql.Contains("knowledge_rules", StringComparison.OrdinalIgnoreCase));
        ruleQuery.Should().Contain("ORDER BY",
            "规则优先级必须在数据库排序，应用层才能逐行流式扫描而无需先加载整个候选集");
    }

    /// <summary>记录规则查询 SQL。</summary>
    private sealed class RuleCommandInterceptor : DbCommandInterceptor
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
