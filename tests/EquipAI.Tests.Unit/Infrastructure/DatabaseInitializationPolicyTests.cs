using EquipAI.Infrastructure.Data;
using FluentAssertions;

namespace EquipAI.Tests.Unit.Infrastructure;

/// <summary>
/// 数据库初始化环境策略测试。
/// </summary>
public class DatabaseInitializationPolicyTests
{
    [Fact]
    public void Testing环境由测试夹具负责EnsureCreated而不是生产迁移()
    {
        DatabaseInitializationPolicy.ShouldApplyMigrations("Testing")
            .Should().BeFalse();
    }

    [Theory]
    [InlineData("Development")]
    [InlineData("Production")]
    public void 非Testing环境必须使用EF迁移(string environmentName)
    {
        DatabaseInitializationPolicy.ShouldApplyMigrations(environmentName)
            .Should().BeTrue();
    }

    [Theory]
    [InlineData("Npgsql.EntityFrameworkCore.PostgreSQL", true)]
    [InlineData("Microsoft.EntityFrameworkCore.Sqlite", false)]
    [InlineData("Microsoft.EntityFrameworkCore.InMemory", false)]
    [InlineData(null, false)]
    public void 只有PostgreSQL启动初始化需要跨进程数据库锁(string? providerName, bool expected)
    {
        DatabaseInitializationLock.RequiresAdvisoryLock(providerName)
            .Should().Be(expected);
    }
}
