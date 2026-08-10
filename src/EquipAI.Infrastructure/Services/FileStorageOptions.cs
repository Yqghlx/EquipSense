using Microsoft.Extensions.Configuration;

namespace EquipAI.Infrastructure.Services;

/// <summary>
/// 文件存储实现类型。
/// </summary>
public enum FileStorageProvider
{
    /// <summary>
    /// 使用应用所在主机的本地文件系统。
    /// </summary>
    Local,

    /// <summary>
    /// 使用 AWS S3 或其他兼容 S3 API 的对象存储。
    /// </summary>
    S3,
}

/// <summary>
/// 文件存储配置。
/// </summary>
public sealed class FileStorageOptions
{
    /// <summary>
    /// 配置节名称。
    /// </summary>
    public const string SectionName = "FileStorage";

    /// <summary>
    /// 存储实现，默认使用本地文件系统，保证现有单机部署行为不变。
    /// </summary>
    public FileStorageProvider Provider { get; set; } = FileStorageProvider.Local;

    /// <summary>
    /// 本地存储根目录。
    /// </summary>
    public string BasePath { get; set; } = "uploads";

    /// <summary>
    /// S3 兼容对象存储配置。
    /// </summary>
    public S3FileStorageOptions S3 { get; set; } = new();
}

/// <summary>
/// S3 兼容对象存储配置。
/// </summary>
public sealed class S3FileStorageOptions
{
    /// <summary>
    /// 对象存储桶名称。
    /// </summary>
    public string BucketName { get; set; } = string.Empty;

    /// <summary>
    /// 签名区域；使用 AWS IAM 角色时也建议显式配置。
    /// </summary>
    public string Region { get; set; } = "us-east-1";

    /// <summary>
    /// 可选的 S3 兼容服务地址。为空时使用 AWS SDK 的标准 AWS 端点。
    /// </summary>
    public string? Endpoint { get; set; }

    /// <summary>
    /// 可选的访问密钥。标准 AWS S3 可以留空并使用任务角色或默认凭据链。
    /// </summary>
    public string? AccessKey { get; set; }

    /// <summary>
    /// 可选的访问密钥密文。不会写入日志。
    /// </summary>
    public string? SecretKey { get; set; }

    /// <summary>
    /// 是否强制使用路径风格地址；MinIO 等兼容服务通常需要开启。
    /// </summary>
    public bool UsePathStyle { get; set; }

    /// <summary>
    /// 所有附件共享的对象键前缀。
    /// </summary>
    public string KeyPrefix { get; set; } = "attachments";
}

/// <summary>
/// 文件存储配置解析和启动校验。
/// </summary>
public static class FileStorageConfiguration
{
    private const string DefaultS3Region = "us-east-1";

    /// <summary>
    /// 从配置解析文件存储 Provider。未知值必须显式失败，避免静默回退到本地磁盘。
    /// </summary>
    public static FileStorageProvider ResolveProvider(IConfiguration configuration)
    {
        var rawProvider = configuration[$"{FileStorageOptions.SectionName}:Provider"];
        if (string.IsNullOrWhiteSpace(rawProvider))
            return FileStorageProvider.Local;

        if (Enum.TryParse<FileStorageProvider>(rawProvider.Trim(), ignoreCase: true, out var provider))
            return provider;

        throw new InvalidOperationException(
            $"未知文件存储 Provider：{rawProvider}，仅支持 Local 或 S3");
    }

    /// <summary>
    /// 按运行环境校验文件存储配置。
    /// </summary>
    public static void Validate(IConfiguration configuration, string environmentName)
    {
        var provider = ResolveProvider(configuration);
        if (provider == FileStorageProvider.Local)
            return;

        var section = configuration.GetSection($"{FileStorageOptions.SectionName}:S3");
        var bucketName = section["BucketName"]?.Trim();
        if (string.IsNullOrWhiteSpace(bucketName))
            throw new InvalidOperationException("FileStorage:S3:BucketName 必须配置");

        if (bucketName.Contains('/') || bucketName.Contains('\\') || bucketName.Any(char.IsWhiteSpace))
            throw new InvalidOperationException("FileStorage:S3:BucketName 不能包含路径分隔符或空白字符");

        var region = section["Region"]?.Trim();
        if (string.IsNullOrWhiteSpace(region))
            region = DefaultS3Region;
        if (region.Any(char.IsWhiteSpace))
            throw new InvalidOperationException("FileStorage:S3:Region 不能包含空白字符");

        var endpointValue = section["Endpoint"]?.Trim();
        if (!string.IsNullOrWhiteSpace(endpointValue))
        {
            if (!Uri.TryCreate(endpointValue, UriKind.Absolute, out var endpoint)
                || endpoint.Scheme is not ("http" or "https")
                || string.IsNullOrWhiteSpace(endpoint.Host))
            {
                throw new InvalidOperationException(
                    "FileStorage:S3:Endpoint 必须是带主机名的 http:// 或 https:// 地址");
            }

            if (IsProduction(environmentName) && endpoint.Scheme != Uri.UriSchemeHttps)
                throw new InvalidOperationException("生产环境 FileStorage:S3:Endpoint 必须使用 HTTPS");

            ValidateCredentials(section);
        }
        else
        {
            var accessKey = section["AccessKey"]?.Trim();
            var secretKey = section["SecretKey"]?.Trim();
            if (string.IsNullOrWhiteSpace(accessKey) != string.IsNullOrWhiteSpace(secretKey))
                throw new InvalidOperationException(
                    "FileStorage:S3:AccessKey 和 SecretKey 必须同时配置");
        }

        ValidateKeyPrefix(section["KeyPrefix"]);
    }

    /// <summary>
    /// 规范化对象键前缀。该方法同时用于启动校验和运行时构建对象键，避免校验规则漂移。
    /// </summary>
    internal static string NormalizeKeyPrefix(string? keyPrefix)
    {
        if (string.IsNullOrWhiteSpace(keyPrefix))
            return string.Empty;

        var normalized = keyPrefix.Trim().Replace('\\', '/');
        var segments = normalized.Split('/', StringSplitOptions.None);
        if (normalized.StartsWith('/')
            || normalized.EndsWith('/')
            || segments.Any(segment => string.IsNullOrWhiteSpace(segment) || segment is "." or ".."))
        {
            throw new InvalidOperationException(
                "FileStorage:S3:KeyPrefix 必须是安全的相对对象键前缀");
        }

        return string.Join('/', segments);
    }

    private static void ValidateCredentials(IConfigurationSection section)
    {
        var accessKey = section["AccessKey"]?.Trim();
        var secretKey = section["SecretKey"]?.Trim();
        if (string.IsNullOrWhiteSpace(accessKey) || string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException(
                "配置自定义 S3 Endpoint 时必须同时配置 FileStorage:S3:AccessKey 和 SecretKey");
        }
    }

    private static void ValidateKeyPrefix(string? keyPrefix)
    {
        _ = NormalizeKeyPrefix(keyPrefix);
    }

    private static bool IsProduction(string environmentName) =>
        string.Equals(environmentName, "Production", StringComparison.OrdinalIgnoreCase);
}
