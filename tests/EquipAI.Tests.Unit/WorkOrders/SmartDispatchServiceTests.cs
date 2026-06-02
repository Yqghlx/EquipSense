using EquipAI.Application.WorkOrders;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// SmartDispatchService 智能派工服务单元测试
/// </summary>
public class SmartDispatchServiceTests : IAsyncDisposable
{
    private readonly ServiceProvider _sp;
    private readonly string _dbName;

    public SmartDispatchServiceTests()
    {
        _dbName = $"DispatchTest_{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_dbName));
        services.AddScoped<ITenantContext>(_ => new TestTenantContext(Guid.NewGuid()));
        services.AddLogging();
        services.AddScoped<ISmartDispatchService, SmartDispatchService>();
        _sp = services.BuildServiceProvider();
    }

    [Fact]
    public async Task RecommendAsync_应按技能匹配排序()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device
        {
            Id = deviceId, TenantId = tenantId,
            DeviceCode = "DEV-001", Name = "1号电机", Type = "电机"
        });
        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = woId, TenantId = tenantId, DeviceId = deviceId,
            Title = "电机故障", Status = WorkOrderStatus.PendingDispatch
        });

        db.TechnicianProfiles.AddRange(
            new TechnicianProfile
            {
                TenantId = tenantId, UserId = Guid.NewGuid(),
                Name = "张三", Skills = """["电机","泵"]""", IsAvailable = true, ActiveWorkCount = 0
            },
            new TechnicianProfile
            {
                TenantId = tenantId, UserId = Guid.NewGuid(),
                Name = "李四", Skills = """["CNC","注塑机"]""", IsAvailable = true, ActiveWorkCount = 0
            }
        );
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISmartDispatchService>();
        var result = await service.RecommendAsync(tenantId, woId, 5);

        result.Should().NotBeEmpty();
        result[0].Name.Should().Be("张三");
        result[0].SkillScore.Should().Be(1.0);
    }

    [Fact]
    public async Task RecommendAsync_负载高应排在后面()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device
        {
            Id = deviceId, TenantId = tenantId,
            DeviceCode = "DEV-002", Name = "2号电机", Type = "电机"
        });
        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = woId, TenantId = tenantId, DeviceId = deviceId,
            Title = "电机维修", Status = WorkOrderStatus.PendingDispatch
        });

        db.TechnicianProfiles.AddRange(
            new TechnicianProfile
            {
                TenantId = tenantId, UserId = Guid.NewGuid(),
                Name = "张三", Skills = """["电机"]""", IsAvailable = true, ActiveWorkCount = 5
            },
            new TechnicianProfile
            {
                TenantId = tenantId, UserId = Guid.NewGuid(),
                Name = "李四", Skills = """["电机"]""", IsAvailable = true, ActiveWorkCount = 0
            }
        );
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISmartDispatchService>();
        var result = await service.RecommendAsync(tenantId, woId, 5);

        result.Should().NotBeEmpty();
        // 两人技能相同（都是电机），负载低的李四应排第一
        result[0].Name.Should().Be("李四");
        result[0].LoadScore.Should().BeGreaterThan(result[1].LoadScore);
    }

    [Fact]
    public async Task RecommendAsync_不可用技师不应出现()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device
        {
            Id = deviceId, TenantId = tenantId,
            DeviceCode = "DEV-003", Name = "3号电机", Type = "电机"
        });
        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = woId, TenantId = tenantId, DeviceId = deviceId,
            Title = "电机检查", Status = WorkOrderStatus.PendingDispatch
        });

        db.TechnicianProfiles.Add(
            new TechnicianProfile
            {
                TenantId = tenantId, UserId = Guid.NewGuid(),
                Name = "王五", Skills = """["电机"]""", IsAvailable = false, ActiveWorkCount = 0
            }
        );
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISmartDispatchService>();
        var result = await service.RecommendAsync(tenantId, woId, 5);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task RecommendAsync_工单不存在应抛出异常()
    {
        using var scope = _sp.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<ISmartDispatchService>();

        var act = () => service.RecommendAsync(Guid.NewGuid(), Guid.NewGuid(), 5);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*工单不存在*");
    }

    [Fact]
    public async Task RecommendAsync_综合评分应按降序排列()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device
        {
            Id = deviceId, TenantId = tenantId,
            DeviceCode = "DEV-004", Name = "4号泵", Type = "泵"
        });
        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = woId, TenantId = tenantId, DeviceId = deviceId,
            Title = "泵维修", Status = WorkOrderStatus.PendingDispatch
        });

        // 三个技术人员：技能匹配+低负载、技能匹配+高负载、技能不匹配+低负载
        db.TechnicianProfiles.AddRange(
            new TechnicianProfile
            {
                TenantId = tenantId, UserId = Guid.NewGuid(),
                Name = "技能匹配低负载", Skills = """["泵"]""", IsAvailable = true, ActiveWorkCount = 1
            },
            new TechnicianProfile
            {
                TenantId = tenantId, UserId = Guid.NewGuid(),
                Name = "技能匹配高负载", Skills = """["泵"]""", IsAvailable = true, ActiveWorkCount = 8
            },
            new TechnicianProfile
            {
                TenantId = tenantId, UserId = Guid.NewGuid(),
                Name = "技能不匹配低负载", Skills = """["电机"]""", IsAvailable = true, ActiveWorkCount = 0
            }
        );
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISmartDispatchService>();
        var result = await service.RecommendAsync(tenantId, woId, 5);

        result.Should().HaveCount(3);
        // 验证按 TotalScore 降序
        for (int i = 1; i < result.Count; i++)
        {
            result[i].TotalScore.Should().BeLessOrEqualTo(result[i - 1].TotalScore);
        }
        // 技能匹配+低负载应排第一
        result[0].Name.Should().Be("技能匹配低负载");
    }

    [Fact]
    public async Task RecommendAsync_topN应限制返回数量()
    {
        using var scope = _sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tenantId = Guid.NewGuid();

        var deviceId = Guid.NewGuid();
        db.Devices.Add(new Device
        {
            Id = deviceId, TenantId = tenantId,
            DeviceCode = "DEV-005", Name = "5号电机", Type = "电机"
        });
        var woId = Guid.NewGuid();
        db.WorkOrders.Add(new WorkOrder
        {
            Id = woId, TenantId = tenantId, DeviceId = deviceId,
            Title = "电机巡检", Status = WorkOrderStatus.PendingDispatch
        });

        // 创建 5 个技术人员
        for (int i = 1; i <= 5; i++)
        {
            db.TechnicianProfiles.Add(
                new TechnicianProfile
                {
                    TenantId = tenantId, UserId = Guid.NewGuid(),
                    Name = $"技师{i}", Skills = """["电机"]""", IsAvailable = true, ActiveWorkCount = i - 1
                }
            );
        }
        await db.SaveChangesAsync();

        var service = scope.ServiceProvider.GetRequiredService<ISmartDispatchService>();
        var result = await service.RecommendAsync(tenantId, woId, 3);

        result.Should().HaveCount(3);
    }

    /// <summary>
    /// 测试用租户上下文
    /// </summary>
    private class TestTenantContext : ITenantContext
    {
        public TestTenantContext(Guid tenantId) { TenantId = tenantId; }
        public Guid TenantId { get; }
        public string IsolationMode => "Shared";
        public bool IsSystemAdmin => false;
        public Guid UserId => Guid.Empty;
    }

    public async ValueTask DisposeAsync() => await _sp.DisposeAsync();
}
