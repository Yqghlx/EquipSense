using System.Data.Common;
using EquipAI.Application.Knowledge;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace EquipAI.Tests.Unit.Knowledge;

/// <summary>
/// 知识规则冲突检测资源边界回归测试。
/// </summary>
public sealed class KnowledgeConflictResourceBoundaryTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly RuleQueryInterceptor _queryInterceptor = new();
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;
    private Guid[] _ruleIds = [];

    /// <inheritdoc />
    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options
            .UseSqlite(_connection)
            .AddInterceptors(_queryInterceptor));
        services.AddSingleton<ITenantContext>(new TestTenantContext(_tenantId));
        services.AddLogging();
        services.AddScoped<KnowledgeConflictService>();
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "知识规则冲突资源边界租户",
            Slug = $"knowledge-conflict-{_tenantId:N}"[..24],
            Plan = TenantPlan.Professional,
            MaxDevices = 5000,
            MaxUsers = 5000,
        });

        _ruleIds = Enumerable.Range(0, 501)
            .Select(_ => Guid.NewGuid())
            .ToArray();
        db.KnowledgeRules.AddRange(_ruleIds.Select((ruleId, index) => new KnowledgeRule
        {
            Id = ruleId,
            TenantId = _tenantId,
            DeviceType = "pump",
            Name = $"冲突检测资源规则-{index:D4}",
            Conditions = "[{\"metric\":\"temperature\",\"operator\":\">\",\"threshold\":80}]",
            Conclusion = "温度异常",
            Source = "expert",
            Enabled = true,
        }));
        await db.SaveChangesAsync();
    }

    /// <inheritdoc />
    public async Task DisposeAsync()
    {
        await _serviceProvider.DisposeAsync();
        await _connection.DisposeAsync();
    }

    /// <summary>
    /// 规则超过单批大小时，数据库读取必须有上限且所有冲突规则都要返回。
    /// </summary>
    [Fact]
    public async Task DetectConflictsAsync_规则超过单批大小时应限制查询并完整返回冲突()
    {
        _queryInterceptor.Reset();

        using var scope = _serviceProvider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<KnowledgeConflictService>();

        var result = await service.DetectConflictsAsync(
            _tenantId,
            "pump",
            "[{\"metric\":\"temperature\",\"operator\":\">\",\"threshold\":80}]",
            null,
            CancellationToken.None);

        result.Should().HaveCount(501);
        result.Select(item => item.RuleId).Should().BeEquivalentTo(_ruleIds);

        _queryInterceptor.GetRuleSelects()
            .Should().HaveCount(2, "501 条规则应跨越 500 条数据库批次边界")
            .And.OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// 记录知识规则查询 SQL，验证每次读取均存在数据库侧行数上限。
    /// </summary>
    private sealed class RuleQueryInterceptor : DbCommandInterceptor
    {
        private readonly object _gate = new();
        private List<string> _commands = [];

        /// <summary>
        /// 清除建表和种子阶段的 SQL 记录。
        /// </summary>
        public void Reset()
        {
            lock (_gate)
            {
                _commands = [];
            }
        }

        /// <summary>
        /// 获取知识规则表的查询命令。
        /// </summary>
        public IReadOnlyList<string> GetRuleSelects()
        {
            lock (_gate)
            {
                return _commands
                    .Where(sql => sql.Contains("knowledge_rules", StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }
        }

        /// <inheritdoc />
        public override InterceptionResult<DbDataReader> ReaderExecuting(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result)
        {
            Record(command);
            return result;
        }

        /// <inheritdoc />
        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            Record(command);
            return ValueTask.FromResult(result);
        }

        /// <summary>
        /// 仅记录查询命令，忽略建表、插入和更新命令。
        /// </summary>
        private void Record(DbCommand command)
        {
            var sql = command.CommandText.TrimStart();
            if (!sql.StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            lock (_gate)
            {
                _commands.Add(command.CommandText);
            }
        }
    }

    /// <summary>
    /// 固定测试租户上下文。
    /// </summary>
    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        /// <summary>当前租户 ID。</summary>
        public Guid TenantId { get; } = tenantId;

        /// <summary>当前租户隔离模式。</summary>
        public string IsolationMode => "Shared";

        /// <summary>是否为系统管理员。</summary>
        public bool IsSystemAdmin => false;

        /// <summary>当前用户 ID。</summary>
        public Guid UserId => Guid.Empty;
    }
}
