using EquipAI.Application.DTOs.Common;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Tests.Unit.DTOs;

/// <summary>
/// 分页动态排序测试，确保非法排序字段不会把客户端输入演变成服务器 500。
/// </summary>
public sealed class QueryableExtensionsTests
{
    [Fact]
    public async Task 不存在的排序字段应返回请求参数异常()
    {
        await using var db = new SortTestDbContext();
        db.Records.Add(new SortTestRecord { Name = "测试记录", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var action = () => db.Records
            .AsQueryable()
            .ToPagedAsync(new PagedQuery { Sort = "field_that_does_not_exist" });

        await action.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*排序字段*");
    }

    [Fact]
    public async Task 合法的蛇形排序字段应正常分页()
    {
        await using var db = new SortTestDbContext();
        db.Records.AddRange(
            new SortTestRecord { Name = "较早", CreatedAt = DateTime.UtcNow.AddMinutes(-1) },
            new SortTestRecord { Name = "较晚", CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        var result = await db.Records
            .AsQueryable()
            .ToPagedAsync(new PagedQuery { Sort = "created_at", Order = "asc" });

        result.Total.Should().Be(2);
        result.Items.Select(record => record.Name).Should().ContainInOrder("较早", "较晚");
    }

    private sealed class SortTestDbContext : DbContext
    {
        public SortTestDbContext()
            : base(new DbContextOptionsBuilder<SortTestDbContext>()
                .UseInMemoryDatabase($"SortTest_{Guid.NewGuid():N}")
                .Options)
        {
        }

        public DbSet<SortTestRecord> Records => Set<SortTestRecord>();
    }

    private sealed class SortTestRecord
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
    }
}
