using Amazon.S3;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Services;
using EquipAI.WebAPI.Extensions;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace EquipAI.Tests.Unit.Extensions;

/// <summary>
/// 文件存储 Provider 的依赖注入选择测试。
/// </summary>
public sealed class FileStorageServiceRegistrationTests
{
    [Fact]
    public void AddInfrastructure_默认配置_注册本地文件存储()
    {
        var configuration = BuildConfiguration();
        var services = CreateServices(configuration);
        services.AddInfrastructure(configuration);
        using var provider = services.BuildServiceProvider();

        provider.GetRequiredService<IFileStorageService>()
            .Should().BeOfType<LocalFileStorageService>();
    }

    [Fact]
    public void AddInfrastructure_S3配置_注册S3文件存储和共享客户端()
    {
        var configuration = BuildConfiguration(new Dictionary<string, string?>
        {
            ["FileStorage:Provider"] = "S3",
            ["FileStorage:S3:BucketName"] = "equipsense-attachments",
            ["FileStorage:S3:Region"] = "us-east-1",
            ["FileStorage:S3:Endpoint"] = "https://s3.example.com",
            ["FileStorage:S3:AccessKey"] = "access-key",
            ["FileStorage:S3:SecretKey"] = "secret-key",
        });
        var services = CreateServices(configuration);
        services.AddInfrastructure(configuration);
        using var provider = services.BuildServiceProvider();

        var firstClient = provider.GetRequiredService<IAmazonS3>();
        var secondClient = provider.GetRequiredService<IAmazonS3>();

        provider.GetRequiredService<IFileStorageService>()
            .Should().BeOfType<S3FileStorageService>();
        secondClient.Should().BeSameAs(firstClient);
    }

    private static ServiceCollection CreateServices(IConfiguration configuration)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddHttpContextAccessor();
        services.AddSingleton(configuration);
        return services;
    }

    private static IConfiguration BuildConfiguration(
        IReadOnlyDictionary<string, string?>? values = null)
    {
        var allValues = new Dictionary<string, string?>
        {
            ["EventBus:Provider"] = "InMemory",
            ["ConnectionStrings:Default"] = "Host=localhost;Database=test",
            ["Redis:ConnectionString"] = "localhost:6379",
        };
        if (values is not null)
        {
            foreach (var pair in values)
                allValues[pair.Key] = pair.Value;
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(allValues)
            .Build();
    }
}
