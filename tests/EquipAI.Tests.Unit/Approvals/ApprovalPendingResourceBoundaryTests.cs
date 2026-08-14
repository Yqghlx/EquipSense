using System.Data.Common;
using EquipAI.Application.Approvals;
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
using Moq;

namespace EquipAI.Tests.Unit.Approvals;

/// <summary>
/// 审批待办查询资源边界回归测试。
/// </summary>
public sealed class ApprovalPendingResourceBoundaryTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _approverId = Guid.NewGuid();
    private readonly ApprovalQueryInterceptor _queryInterceptor = new();
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;
    private Guid[] _approvalIds = [];

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
        services.AddSingleton<IEventBus>(new Mock<IEventBus>().Object);
        services.AddLogging();
        services.AddScoped<IApprovalChainService, ApprovalChainService>();
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "审批待办资源边界租户",
            Slug = $"approval-pending-{_tenantId:N}"[..24],
            Plan = TenantPlan.Professional,
            MaxDevices = 5000,
            MaxUsers = 5000,
        });

        _approvalIds = Enumerable.Range(0, 501)
            .Select(_ => Guid.NewGuid())
            .ToArray();
        db.WorkOrderApprovals.AddRange(_approvalIds.Select((approvalId, index) => new WorkOrderApproval
        {
            Id = approvalId,
            TenantId = _tenantId,
            WorkOrderId = Guid.NewGuid(),
            StepOrder = 1,
            ExpectedRole = (index % 3) switch
            {
                0 => "MaintenanceLead",
                1 => "maintenance_lead",
                _ => "MAINTENANCE-LEAD",
            },
            SpecificApproverId = index % 2 == 0 ? null : _approverId,
            Action = ApprovalAction.Pending,
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
    /// 待办数量超过单批大小时，数据库查询必须有上限且所有角色匹配记录都要返回。
    /// </summary>
    [Fact]
    public async Task GetPendingApprovalsAsync_待办超过单批大小时应限制查询并完整返回()
    {
        _queryInterceptor.Reset();

        using var scope = _serviceProvider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<IApprovalChainService>();

        var result = await service.GetPendingApprovalsAsync(
            _tenantId,
            _approverId,
            "maintenance_lead",
            CancellationToken.None);

        result.Should().HaveCount(501);
        result.Select(item => item.Id).Should().BeEquivalentTo(_approvalIds);
        _queryInterceptor.GetApprovalSelects()
            .Should().HaveCount(2, "501 条待办应跨越 500 条数据库批次")
            .And.OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// 记录审批表查询 SQL，验证每次读取均存在数据库侧行数上限。
    /// </summary>
    private sealed class ApprovalQueryInterceptor : DbCommandInterceptor
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
        /// 获取审批表的查询命令。
        /// </summary>
        public IReadOnlyList<string> GetApprovalSelects()
        {
            lock (_gate)
            {
                return _commands
                    .Where(sql => sql.Contains("work_order_approvals", StringComparison.OrdinalIgnoreCase))
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
        /// 仅记录 SELECT，忽略建表、插入和更新命令。
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
