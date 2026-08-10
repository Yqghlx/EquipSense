using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using EquipAI.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace EquipAI.Tests.Unit.Infrastructure;

/// <summary>
/// S3 兼容附件存储适配器测试。
/// </summary>
public sealed class S3FileStorageServiceTests
{
    [Fact]
    public async Task SaveAsync_应生成租户隔离对象键并保留MIME类型()
    {
        var client = new Mock<IAmazonS3>();
        PutObjectRequest? capturedRequest = null;
        client
            .Setup(item => item.PutObjectAsync(
                It.IsAny<PutObjectRequest>(),
                It.IsAny<CancellationToken>()))
            .Callback<PutObjectRequest, CancellationToken>((request, _) => capturedRequest = request)
            .ReturnsAsync(new PutObjectResponse());

        var tenantId = Guid.NewGuid();
        var storage = CreateStorage(client.Object);
        await using var content = new MemoryStream("故障报告"u8.ToArray());

        var storagePath = await storage.SaveAsync(
            tenantId,
            "work-order",
            "..\\故障报告.txt",
            content,
            "text/plain");

        storagePath.Should().MatchRegex($"^{tenantId:D}/work-order/.+_[0-9a-f]{{32}}\\.txt$");
        capturedRequest.Should().NotBeNull();
        capturedRequest!.BucketName.Should().Be("equipsense-attachments");
        capturedRequest.Key.Should().Be($"attachments/{storagePath}");
        capturedRequest.ContentType.Should().Be("text/plain");
        capturedRequest.Headers.ContentLength.Should().Be("故障报告"u8.Length);
        capturedRequest.AutoCloseStream.Should().BeFalse();
    }

    [Fact]
    public async Task GetAsync_路径包含穿越片段_应拒绝访问()
    {
        var client = new Mock<IAmazonS3>();
        var storage = CreateStorage(client.Object);

        var act = () => storage.GetAsync("tenant/../private/secret.txt");

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        client.Verify(
            item => item.GetObjectAsync(
                It.IsAny<GetObjectRequest>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExistsAsync_对象不存在时_返回False而不是吞掉其他错误()
    {
        var client = new Mock<IAmazonS3>();
        client
            .Setup(item => item.GetObjectMetadataAsync(
                It.IsAny<GetObjectMetadataRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AmazonS3Exception("not found")
            {
                StatusCode = HttpStatusCode.NotFound,
            });
        var storage = CreateStorage(client.Object);

        var exists = await storage.ExistsAsync("tenant/work-order/file.txt");

        exists.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_应使用同一租户对象键()
    {
        var client = new Mock<IAmazonS3>();
        DeleteObjectRequest? capturedRequest = null;
        client
            .Setup(item => item.DeleteObjectAsync(
                It.IsAny<DeleteObjectRequest>(),
                It.IsAny<CancellationToken>()))
            .Callback<DeleteObjectRequest, CancellationToken>((request, _) => capturedRequest = request)
            .ReturnsAsync(new DeleteObjectResponse());
        var storage = CreateStorage(client.Object);

        await storage.DeleteAsync("tenant/work-order/file.txt");

        capturedRequest.Should().NotBeNull();
        capturedRequest!.BucketName.Should().Be("equipsense-attachments");
        capturedRequest.Key.Should().Be("attachments/tenant/work-order/file.txt");
    }

    private static S3FileStorageService CreateStorage(IAmazonS3 client) =>
        new(
            Options.Create(new FileStorageOptions
            {
                Provider = FileStorageProvider.S3,
                S3 = new S3FileStorageOptions
                {
                    BucketName = "equipsense-attachments",
                    KeyPrefix = "attachments",
                },
            }),
            client,
            NullLogger<S3FileStorageService>.Instance);
}
