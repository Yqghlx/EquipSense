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

    [Fact]
    public async Task SaveAsync_读取源失败时_不应留下半成品文件()
    {
        var root = Path.Combine(Path.GetTempPath(), $"equipsense-storage-{Guid.NewGuid():N}");
        var basePath = Path.Combine(root, "uploads");
        var tenantId = Guid.NewGuid();
        Directory.CreateDirectory(root);

        try
        {
            var storage = CreateStorage(basePath);
            await using var content = new FailingReadStream();

            var act = () => storage.SaveAsync(
                tenantId, "work-order", "failed.txt", content, "text/plain");

            await act.Should().ThrowAsync<IOException>();
            var tenantDirectory = Path.Combine(basePath, tenantId.ToString(), "work-order");
            Directory.GetFiles(tenantDirectory).Should().BeEmpty(
                "上传失败后不应把半截文件暴露为可下载附件");
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

    /// <summary>
    /// 模拟网络/请求流在写入过程中失败。
    /// </summary>
    private sealed class FailingReadStream : Stream
    {
        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => 1;
        public override long Position { get; set; }

        public override void Flush() { }

        public override int Read(byte[] buffer, int offset, int count)
            => throw new IOException("模拟文件读取失败");

        public override int Read(Span<byte> buffer)
            => throw new IOException("模拟文件读取失败");

        public override ValueTask<int> ReadAsync(
            Memory<byte> buffer,
            CancellationToken cancellationToken = default)
            => ValueTask.FromException<int>(new IOException("模拟文件读取失败"));

        public override Task<int> ReadAsync(
            byte[] buffer,
            int offset,
            int count,
            CancellationToken cancellationToken)
            => Task.FromException<int>(new IOException("模拟文件读取失败"));

        public override long Seek(long offset, SeekOrigin origin)
            => throw new NotSupportedException();

        public override void SetLength(long value)
            => throw new NotSupportedException();

        public override void Write(byte[] buffer, int offset, int count)
            => throw new NotSupportedException();
    }
}
