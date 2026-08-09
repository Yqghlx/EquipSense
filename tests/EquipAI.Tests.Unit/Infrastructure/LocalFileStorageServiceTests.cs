using EquipAI.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.Infrastructure;

/// <summary>
/// 本地文件存储安全边界测试。
/// </summary>
public class LocalFileStorageServiceTests
{
    [Fact]
    public async Task GetAsync_同名兄弟目录中的路径_应拒绝访问()
    {
        var root = Path.Combine(Path.GetTempPath(), $"equipsense-storage-{Guid.NewGuid():N}");
        var basePath = Path.Combine(root, "uploads");
        var siblingPath = Path.Combine(root, "uploads-secret");
        Directory.CreateDirectory(siblingPath);
        await File.WriteAllTextAsync(Path.Combine(siblingPath, "secret.txt"), "secret");

        try
        {
            var storage = CreateStorage(basePath);

            var act = () => storage.GetAsync("../uploads-secret/secret.txt");

            await act.Should().ThrowAsync<UnauthorizedAccessException>();
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public async Task SaveAsync_文件名包含Windows分隔符时_应保存到租户目录内且不保留分隔符()
    {
        var root = Path.Combine(Path.GetTempPath(), $"equipsense-storage-{Guid.NewGuid():N}");
        var basePath = Path.Combine(root, "uploads");
        Directory.CreateDirectory(root);

        try
        {
            var storage = CreateStorage(basePath);
            await using var content = new MemoryStream("故障报告"u8.ToArray());

            var storagePath = await storage.SaveAsync(
                Guid.NewGuid(), "work-order", "..\\故障报告.txt", content, "text/plain");

            storagePath.Should().NotContain("\\");
            Path.GetFullPath(Path.Combine(basePath, storagePath))
                .StartsWith(Path.GetFullPath(basePath) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
                .Should().BeTrue();
            var exists = await storage.ExistsAsync(storagePath);
            exists.Should().BeTrue();
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    private static LocalFileStorageService CreateStorage(string basePath)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FileStorage:BasePath"] = basePath,
            })
            .Build();

        return new LocalFileStorageService(configuration, NullLogger<LocalFileStorageService>.Instance);
    }
}
