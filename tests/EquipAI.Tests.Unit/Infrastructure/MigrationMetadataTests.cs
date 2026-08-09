using System.Reflection;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace EquipAI.Tests.Unit.Infrastructure;

/// <summary>
/// EF Core 迁移发现性测试，防止手写迁移因缺少元数据而被运行时静默忽略。
/// </summary>
public sealed class MigrationMetadataTests
{
    /// <summary>
    /// 每个具体迁移类都必须声明唯一迁移标识，确保 MigrateAsync 能发现并执行。
    /// </summary>
    [Fact]
    public void 所有迁移类都必须具有迁移标识元数据()
    {
        var migrationTypes = typeof(AppDbContext).Assembly
            .GetTypes()
            .Where(type => !type.IsAbstract && typeof(Migration).IsAssignableFrom(type))
            .OrderBy(type => type.FullName)
            .ToArray();

        var missingMetadata = migrationTypes
            .Where(type => type.GetCustomAttribute<MigrationAttribute>() is null)
            .Select(type => type.FullName)
            .ToArray();

        missingMetadata.Should().BeEmpty(
            "缺少 MigrationAttribute 的迁移不会被 EF Core 发现，启动时会静默产生数据库结构漂移");

        var invalidDbContextMetadata = migrationTypes
            .Where(type => type.GetCustomAttribute<DbContextAttribute>()?.ContextType != typeof(AppDbContext))
            .Select(type => type.FullName)
            .ToArray();

        invalidDbContextMetadata.Should().BeEmpty(
            "迁移必须通过 DbContextAttribute 绑定 AppDbContext，否则运行时不会把它加入待执行迁移集合");

        var duplicateMigrationIds = migrationTypes
            .Select(type => type.GetCustomAttribute<MigrationAttribute>()?.Id)
            .Where(id => id is not null)
            .GroupBy(id => id)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToArray();

        duplicateMigrationIds.Should().BeEmpty("重复的迁移标识会让 EF Core 无法确定数据库升级顺序");
    }
}
