using EquipAI.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;

namespace EquipAI.Tests.Unit.Infrastructure;

/// <summary>
/// 文件存储 Provider 和生产配置门禁测试。
/// </summary>
public sealed class FileStorageConfigurationTests
{
    [Fact]
    public void ResolveProvider_未配置时_默认使用本地存储()
    {
        var configuration = BuildConfiguration();

        FileStorageConfiguration.ResolveProvider(configuration)
            .Should().Be(FileStorageProvider.Local);
    }

    [Fact]
    public void ResolveProvider_未知Provider_拒绝启动()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["FileStorage:Provider"] = "AzureBlob",
        });

        var act = () => FileStorageConfiguration.ResolveProvider(configuration);

        act.Should().Throw<InvalidOperationException>().WithMessage("*AzureBlob*");
    }

    [Fact]
    public void Validate_生产S3缺少桶名称_拒绝启动()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["FileStorage:Provider"] = "S3",
            ["FileStorage:S3:Region"] = "cn-shanghai",
            ["FileStorage:S3:AccessKey"] = "access-key",
            ["FileStorage:S3:SecretKey"] = "secret-key",
        });

        var act = () => FileStorageConfiguration.Validate(configuration, "Production");

        act.Should().Throw<InvalidOperationException>().WithMessage("*BucketName*");
    }

    [Fact]
    public void Validate_生产S3自定义HTTP端点_拒绝启动()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["FileStorage:Provider"] = "S3",
            ["FileStorage:S3:BucketName"] = "equipsense-attachments",
            ["FileStorage:S3:Region"] = "cn-shanghai",
            ["FileStorage:S3:Endpoint"] = "http://minio.example.com",
            ["FileStorage:S3:AccessKey"] = "access-key",
            ["FileStorage:S3:SecretKey"] = "secret-key",
        });

        var act = () => FileStorageConfiguration.Validate(configuration, "Production");

        act.Should().Throw<InvalidOperationException>().WithMessage("*HTTPS*");
    }

    [Fact]
    public void Validate_生产S3自定义端点缺少凭据_拒绝启动()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["FileStorage:Provider"] = "S3",
            ["FileStorage:S3:BucketName"] = "equipsense-attachments",
            ["FileStorage:S3:Region"] = "cn-shanghai",
            ["FileStorage:S3:Endpoint"] = "https://s3.example.com",
        });

        var act = () => FileStorageConfiguration.Validate(configuration, "Production");

        act.Should().Throw<InvalidOperationException>().WithMessage("*AccessKey*SecretKey*");
    }

    [Fact]
    public void Validate_生产S3有效HTTPS配置_通过()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["FileStorage:Provider"] = "S3",
            ["FileStorage:S3:BucketName"] = "equipsense-attachments",
            ["FileStorage:S3:Region"] = "cn-shanghai",
            ["FileStorage:S3:Endpoint"] = "https://s3.example.com",
            ["FileStorage:S3:AccessKey"] = "access-key",
            ["FileStorage:S3:SecretKey"] = "secret-key",
            ["FileStorage:S3:KeyPrefix"] = "attachments",
        });

        var act = () => FileStorageConfiguration.Validate(configuration, "Production");

        act.Should().NotThrow();
    }

    [Fact]
    public void Validate_对象键前缀包含路径穿越_拒绝启动()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["FileStorage:Provider"] = "S3",
            ["FileStorage:S3:BucketName"] = "equipsense-attachments",
            ["FileStorage:S3:Region"] = "cn-shanghai",
            ["FileStorage:S3:Endpoint"] = "https://s3.example.com",
            ["FileStorage:S3:AccessKey"] = "access-key",
            ["FileStorage:S3:SecretKey"] = "secret-key",
            ["FileStorage:S3:KeyPrefix"] = "../private",
        });

        var act = () => FileStorageConfiguration.Validate(configuration, "Production");

        act.Should().Throw<InvalidOperationException>().WithMessage("*KeyPrefix*");
    }

    private static IConfiguration BuildConfiguration(
        IReadOnlyDictionary<string, string?>? values = null)
    {
        var builder = new ConfigurationBuilder();
        builder.AddInMemoryCollection(values ?? new Dictionary<string, string?>());
        return builder.Build();
    }
}
