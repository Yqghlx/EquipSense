using System.Data.Common;
using EquipAI.Application.WorkOrders;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using Xunit;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// WorkOrderCodeGenerator 单元测试
/// 验证工单编码生成与唯一约束冲突重试逻辑——这条路径同时被手工建单
/// （WorkOrderService.CreateAsync）和告警自动建单（WorkOrderAutoCreateHandler）复用。
/// </summary>
public class WorkOrderCodeGeneratorTests
{
    private readonly Guid _tenantId = Guid.NewGuid();

    [Fact]
    public async Task GenerateCodeAsync_无历史编码_返回当日首个序号()
    {
        var db = CreateDb();

        var code = await WorkOrderCodeGenerator.GenerateCodeAsync(db, CancellationToken.None);

        code.Should().StartWith($"WO-{DateTime.UtcNow:yyyyMMdd}-");
        code.Should().EndWith("-0001");
    }

    [Fact]
    public async Task GenerateCodeAsync_有历史编码_递增序号()
    {
        var db = CreateDb();
        db.WorkOrders.Add(new WorkOrder
        {
            TenantId = _tenantId,
            WorkOrderCode = $"WO-{DateTime.UtcNow:yyyyMMdd}-0003",
            Title = "seed",
            Status = WorkOrderStatus.PendingDispatch
        });
        await db.SaveChangesAsync();

        var code = await WorkOrderCodeGenerator.GenerateCodeAsync(db, CancellationToken.None);

        code.Should().EndWith("-0004");
    }

    [Fact]
    public async Task CreateWithUniqueCodeAsync_首次成功_返回落库工单()
    {
        var db = CreateDb();

        var result = await WorkOrderCodeGenerator.CreateWithUniqueCodeAsync(
            db,
            code => new WorkOrder
            {
                TenantId = _tenantId,
                WorkOrderCode = code,
                Title = "test",
                Status = WorkOrderStatus.PendingDispatch
            },
            CreateLogger(),
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.WorkOrderCode.Should().EndWith("-0001");
        (await db.WorkOrders.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task CreateWithUniqueCodeAsync_唯一约束冲突后重试成功()
    {
        // 第一次 SaveChangesAsync 抛 23505（唯一约束冲突），第二次成功——验证重试路径。
        var db = new RetryDbContext(
            CreateOptions(),
            new TestTenantContext(_tenantId),
            failOnce: true);

        var result = await WorkOrderCodeGenerator.CreateWithUniqueCodeAsync(
            db,
            code => new WorkOrder
            {
                TenantId = _tenantId,
                WorkOrderCode = code,
                Title = "test-retry",
                Status = WorkOrderStatus.PendingDispatch
            },
            CreateLogger(),
            CancellationToken.None);

        result.Should().NotBeNull("首次冲突后应重试并成功");
        (await db.WorkOrders.IgnoreQueryFilters().CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task CreateWithUniqueCodeAsync_持续冲突_耗尽重试返回null()
    {
        // 每次 SaveChangesAsync 都抛 23505，3 次重试后返回 null（不向上抛异常）。
        var db = new RetryDbContext(
            CreateOptions(),
            new TestTenantContext(_tenantId),
            failOnce: false);

        var result = await WorkOrderCodeGenerator.CreateWithUniqueCodeAsync(
            db,
            code => new WorkOrder
            {
                TenantId = _tenantId,
                WorkOrderCode = code,
                Title = "test-fail",
                Status = WorkOrderStatus.PendingDispatch
            },
            CreateLogger(),
            CancellationToken.None);

        result.Should().BeNull("3 次重试仍冲突应优雅返回 null");
        (await db.WorkOrders.IgnoreQueryFilters().CountAsync()).Should().Be(0);
    }

    [Fact]
    public void IsUniqueViolation_识别PostgreSQL_23505()
    {
        var pgEx = new PostgresException("duplicate key", "ERROR", "unique_violation", "23505");
        var ex = new DbUpdateException("conflict", pgEx);

        WorkOrderCodeGenerator.IsUniqueViolation(ex).Should().BeTrue();
    }

    [Fact]
    public void IsUniqueViolation_非约束冲突_返回false()
    {
        var inner = new InvalidOperationException("not a constraint");
        var ex = new DbUpdateException("other", inner);

        WorkOrderCodeGenerator.IsUniqueViolation(ex).Should().BeFalse();
    }

    private AppDbContext CreateDb()
        => new(CreateOptions(), new TestTenantContext(_tenantId));

    private DbContextOptions<AppDbContext> CreateOptions()
        => new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestCodeGen_{Guid.NewGuid()}")
            .Options;

    private static ILogger CreateLogger()
        => LoggerFactory.Create(_ => { }).CreateLogger("WorkOrderCodeGenerator");

    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode { get; } = "shared";
        public bool IsSystemAdmin { get; } = false;
        public Guid UserId { get; } = Guid.NewGuid();
    }

    /// <summary>
    /// 可控的 AppDbContext：当 failOnce=true 时首次保存抛 23505，之后正常；
    /// failOnce=false 时每次保存都抛 23505。
    /// </summary>
    /// <remarks>
    /// 重写 OnModelCreating 且不调用 base：基类用 Expression.Call 反射【私有】方法
    /// GetCurrentTenantId 构建全局租户过滤器，子类无法继承私有方法，导致模型构建时
    /// "No method 'GetCurrentTenantId' ... compatible" 绑定失败。被测方法全程 IgnoreQueryFilters，
    /// 无需全局过滤器，故仅应用实体配置、跳过过滤器构建即可。
    /// </remarks>
    private class RetryDbContext : AppDbContext
    {
        private readonly bool _failOnce;
        private int _saveCount;

        public RetryDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext, bool failOnce)
            : base(options, tenantContext)
        {
            _failOnce = failOnce;
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 仅应用实体映射配置，跳过基类的全局租户过滤器构建（见类备注）
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            _saveCount++;
            if (_failOnce && _saveCount == 1)
            {
                throw BuildUniqueViolation();
            }
            if (!_failOnce)
            {
                throw BuildUniqueViolation();
            }
            return base.SaveChangesAsync(cancellationToken);
        }

        private static DbUpdateException BuildUniqueViolation()
        {
            var pgEx = new PostgresException("duplicate key value", "ERROR", "unique_violation", "23505");
            return new DbUpdateException("工单编码唯一约束冲突（模拟）", pgEx);
        }
    }
}
