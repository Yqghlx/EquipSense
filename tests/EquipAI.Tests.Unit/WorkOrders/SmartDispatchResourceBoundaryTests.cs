using System.Data.Common;
using EquipAI.Application.WorkOrders;
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

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// 智能派工候选人查询的资源边界回归测试。
/// </summary>
public sealed class SmartDispatchResourceBoundaryTests : IAsyncLifetime
{
    private readonly Guid _tenantId = Guid.NewGuid();
    private readonly Guid _workOrderId = Guid.NewGuid();
    private readonly TechnicianQueryInterceptor _queryInterceptor = new();
    private SqliteConnection _connection = null!;
    private ServiceProvider _serviceProvider = null!;

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
        services.AddScoped<ISmartDispatchService, SmartDispatchService>();
        _serviceProvider = services.BuildServiceProvider();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();

        db.Tenants.Add(new Tenant
        {
            Id = _tenantId,
            Name = "派工资源边界租户",
            Slug = $"dispatch-{_tenantId:N}"[..16],
            Plan = TenantPlan.Professional,
            MaxDevices = 5000,
            MaxUsers = 5000,
        });
        db.Devices.Add(new Device
        {
            Id = Guid.NewGuid(),
            TenantId = _tenantId,
            DeviceCode = "DISPATCH-RESOURCE-DEVICE",
            Name = "派工资源边界设备",
            Type = "电机",
            Status = DeviceStatus.Offline,
        });

        var deviceId = db.Devices.Local.Single().Id;
        db.WorkOrders.Add(new WorkOrder
        {
            Id = _workOrderId,
            TenantId = _tenantId,
            DeviceId = deviceId,
            Title = "派工资源边界工单",
            Status = WorkOrderStatus.PendingDispatch,
        });

        var technicianUserIds = Enumerable.Range(0, 501)
            .Select(_ => Guid.NewGuid())
            .ToArray();
        db.Users.AddRange(technicianUserIds.Select((userId, index) => new User
        {
            Id = userId,
            TenantId = _tenantId,
            Username = $"dispatch-resource-{index:D4}",
            PasswordHash = "test-password-hash",
            Role = UserRole.Technician,
            DisplayName = $"候选技术员-{index:D4}",
        }));
        db.TechnicianProfiles.AddRange(technicianUserIds.Select((userId, index) => new TechnicianProfile
        {
            TenantId = _tenantId,
            UserId = userId,
            Name = $"候选技术员-{index:D4}",
            Skills = index == 500 ? "[\"电机\"]" : "[\"泵\"]",
            IsAvailable = true,
            ActiveWorkCount = index == 500 ? 0 : index,
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
    /// 501 名技术人员应分批读取，且最终仍能找到跨批次的技能最佳候选人。
    /// </summary>
    [Fact]
    public async Task RecommendAsync_大量候选人应稳定分批读取并保留TopN()
    {
        _queryInterceptor.Reset();

        using var scope = _serviceProvider.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<ISmartDispatchService>();

        var result = await service.RecommendAsync(_tenantId, _workOrderId, 5);

        result.Should().HaveCount(5);
        result[0].Name.Should().Be("候选技术员-0500");
        _queryInterceptor.GetTechnicianSelects()
            .Should().NotBeEmpty()
            .And.OnlyContain(sql => sql.Contains("LIMIT", StringComparison.OrdinalIgnoreCase),
                "候选人规模增长时不能用一次无界 SELECT 把整个租户加载到应用内存");
    }

    /// <summary>记录技术人员查询 SQL，验证每次读取都带数据库侧上限。</summary>
    private sealed class TechnicianQueryInterceptor : DbCommandInterceptor
    {
        private readonly object _gate = new();
        private List<string> _commands = [];

        /// <summary>清除建表和种子阶段的 SQL 记录。</summary>
        public void Reset()
        {
            lock (_gate)
            {
                _commands = [];
            }
        }

        /// <summary>获取技术人员表的 SELECT 语句。</summary>
        public IReadOnlyList<string> GetTechnicianSelects()
        {
            lock (_gate)
            {
                return _commands
                    .Where(sql => sql.Contains("technician_profiles", StringComparison.OrdinalIgnoreCase))
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

    /// <summary>固定测试租户上下文。</summary>
    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }
}
