using System.Text;
using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EquipAI.Infrastructure.Services;

/// <summary>
/// 基于 AWS S3 API 的附件存储实现。
/// 该实现同时兼容 AWS S3、MinIO 和其他遵循 S3 API 的对象存储服务。
/// </summary>
public sealed class S3FileStorageService : IFileStorageService
{
    /// <summary>
    /// 附件最大大小，与控制器的请求大小限制保持一致。
    /// </summary>
    internal const long MaxFileSizeBytes = 20 * 1024 * 1024;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        "jpg", "jpeg", "png", "gif", "bmp", "webp",
        "pdf",
        "doc", "docx",
        "xls", "xlsx",
        "zip", "rar", "7z",
        "txt", "csv",
    };

    private readonly IAmazonS3 _client;
    private readonly string _bucketName;
    private readonly string _keyPrefix;
    private readonly ILogger<S3FileStorageService> _logger;

    /// <summary>
    /// 初始化 S3 文件存储服务。
    /// </summary>
    public S3FileStorageService(
        IOptions<FileStorageOptions> options,
        IAmazonS3 client,
        ILogger<S3FileStorageService> logger)
    {
        var fileStorageOptions = options.Value;
        if (fileStorageOptions.Provider != FileStorageProvider.S3)
        {
            throw new InvalidOperationException(
                "S3FileStorageService 只能在 FileStorage:Provider=S3 时注册");
        }

        _client = client;
        _bucketName = RequireNonEmpty(fileStorageOptions.S3.BucketName, "FileStorage:S3:BucketName");
        _keyPrefix = FileStorageConfiguration.NormalizeKeyPrefix(fileStorageOptions.S3.KeyPrefix);
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<string> SaveAsync(
        Guid tenantId,
        string category,
        string fileName,
        Stream stream,
        string contentType)
    {
        var safeCategory = NormalizeCategory(category);
        var safeFileName = NormalizeFileName(fileName);
        ValidateFile(safeFileName, stream);

        var extension = Path.GetExtension(safeFileName);
        var nameWithoutExtension = SanitizeFileNamePart(Path.GetFileNameWithoutExtension(safeFileName));
        var uniqueName = $"{nameWithoutExtension}_{Guid.NewGuid():N}{extension}";
        var storagePath = $"{tenantId:D}/{safeCategory}/{uniqueName}";
        var objectKey = BuildObjectKey(storagePath);
        var contentLength = stream.CanSeek ? stream.Length - stream.Position : (long?)null;
        if (contentLength is < 0)
            throw new ArgumentException("文件流位置无效", nameof(stream));

        var uploadStream = new SizeLimitedReadStream(stream, MaxFileSizeBytes);

        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = objectKey,
            InputStream = uploadStream,
            AutoCloseStream = false,
            AutoResetStreamPosition = false,
            ContentType = NormalizeContentType(contentType, safeFileName),
        };

        // AWS SDK 在无法自动识别长度时会拒绝请求。IFormFile 通常提供可定位流，
        // 对不可定位的网络流则交给 SDK 使用流式传输，并由 SizeLimitedReadStream 限制上限。
        if (stream.CanSeek)
        {
            request.Headers.ContentLength = contentLength.GetValueOrDefault();
        }

        try
        {
            await _client.PutObjectAsync(request);
            _logger.LogInformation(
                "S3 文件已保存：{StoragePath}，大小：{Size} 字节",
                storagePath,
                contentLength);
            return storagePath;
        }
        finally
        {
            // AutoCloseStream=false 保证控制器仍然拥有源流；包装流只负责本次请求的大小限制。
            uploadStream.Dispose();
        }
    }

    /// <inheritdoc />
    public async Task<(Stream Stream, string ContentType, string FileName)> GetAsync(string storagePath)
    {
        var normalizedPath = NormalizeStoragePath(storagePath);
        GetObjectResponse response;
        try
        {
            response = await _client.GetObjectAsync(new GetObjectRequest
            {
                BucketName = _bucketName,
                Key = BuildObjectKey(normalizedPath),
            });
        }
        catch (AmazonS3Exception exception) when (IsNotFound(exception))
        {
            throw new FileNotFoundException("文件不存在", storagePath, exception);
        }

        var fileName = GetFileName(normalizedPath);
        var contentType = NormalizeContentType(response.Headers.ContentType, fileName);
        // GetObjectResponse 没有需要单独释放的客户端句柄；ResponseStream 的释放会释放底层 HTTP 响应。
        // 调用方通过 ASP.NET Core FileResult 负责释放该流。
        return (response.ResponseStream, contentType, fileName);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(string storagePath)
    {
        var normalizedPath = NormalizeStoragePath(storagePath);
        await _client.DeleteObjectAsync(new DeleteObjectRequest
        {
            BucketName = _bucketName,
            Key = BuildObjectKey(normalizedPath),
        });

        _logger.LogInformation("S3 文件已删除：{StoragePath}", normalizedPath);
    }

    /// <inheritdoc />
    public async Task<bool> ExistsAsync(string storagePath)
    {
        var normalizedPath = NormalizeStoragePath(storagePath);
        try
        {
            await _client.GetObjectMetadataAsync(new GetObjectMetadataRequest
            {
                BucketName = _bucketName,
                Key = BuildObjectKey(normalizedPath),
            });
            return true;
        }
        catch (AmazonS3Exception exception) when (IsNotFound(exception))
        {
            return false;
        }
    }

    /// <summary>
    /// 构建带有固定前缀的对象键。
    /// </summary>
    private string BuildObjectKey(string storagePath) =>
        string.IsNullOrEmpty(_keyPrefix) ? storagePath : $"{_keyPrefix}/{storagePath}";

    /// <summary>
    /// 校验文件名、扩展名和可确定的文件大小。
    /// </summary>
    private static void ValidateFile(string fileName, Stream stream)
    {
        if (stream is null || !stream.CanRead)
            throw new ArgumentException("文件流必须可读", nameof(stream));

        if (stream.CanSeek && stream.Length - stream.Position > MaxFileSizeBytes)
            throw new ArgumentException("文件大小超过限制（最大 20MB）", nameof(stream));

        var extension = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new ArgumentException($"不支持的文件类型：.{extension}", nameof(fileName));
    }

    /// <summary>
    /// 规范化分类，分类只能作为单级对象键片段。
    /// </summary>
    private static string NormalizeCategory(string category)
    {
        if (string.IsNullOrWhiteSpace(category)
            || category is "." or ".."
            || category.Contains('/')
            || category.Contains('\\'))
        {
            throw new ArgumentException("文件分类必须是单级目录名", nameof(category));
        }

        return category.Trim();
    }

    /// <summary>
    /// 仅保留原始文件名最后一段，防止调用方注入对象键路径。
    /// </summary>
    private static string NormalizeFileName(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("文件名不能为空", nameof(fileName));

        var normalized = fileName.Replace('\\', '/');
        var safeFileName = Path.GetFileName(normalized);
        if (string.IsNullOrWhiteSpace(safeFileName) || safeFileName is "." or "..")
            throw new ArgumentException("文件名无效", nameof(fileName));

        return safeFileName;
    }

    /// <summary>
    /// 限制文件名主体长度并移除平台非法字符。
    /// </summary>
    private static string SanitizeFileNamePart(string name)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = string.Concat(name.Select(character =>
            invalidChars.Contains(character) ? '_' : character));
        sanitized = sanitized.Trim().TrimEnd('.', ' ');

        if (string.IsNullOrWhiteSpace(sanitized) || sanitized is "." or "..")
            sanitized = "file";

        // 与本地文件系统保持相同的物理文件名上限；下载名称仍从附件元数据中保留原始名称。
        const int maxUtf8Bytes = 160;
        var builder = new StringBuilder(Math.Min(sanitized.Length, 100));
        var bytes = 0;
        foreach (var rune in sanitized.EnumerateRunes())
        {
            var runeText = rune.ToString();
            var runeBytes = Encoding.UTF8.GetByteCount(runeText);
            if (bytes + runeBytes > maxUtf8Bytes)
                break;

            builder.Append(runeText);
            bytes += runeBytes;
        }

        return builder.Length == 0 ? "file" : builder.ToString();
    }

    /// <summary>
    /// 校验并规范化数据库中的相对存储路径。
    /// </summary>
    private static string NormalizeStoragePath(string storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath)
            || Path.IsPathRooted(storagePath)
            || storagePath.Contains('\\'))
        {
            throw new UnauthorizedAccessException("非法文件路径访问");
        }

        var segments = storagePath.Split('/', StringSplitOptions.None);
        if (segments.Any(segment => string.IsNullOrWhiteSpace(segment) || segment is "." or ".."))
            throw new UnauthorizedAccessException("非法文件路径访问");

        return string.Join('/', segments);
    }

    /// <summary>
    /// 取得对象键最后一段文件名。
    /// </summary>
    private static string GetFileName(string storagePath) =>
        storagePath[(storagePath.LastIndexOf('/') + 1)..];

    /// <summary>
    /// 限制外部 MIME 值中的控制字符，并在缺失时按扩展名推断。
    /// </summary>
    private static string NormalizeContentType(string? contentType, string fileName)
    {
        if (!string.IsNullOrWhiteSpace(contentType)
            && !contentType.Contains('\r')
            && !contentType.Contains('\n'))
        {
            return contentType.Trim();
        }

        return GetContentType(fileName);
    }

    /// <summary>
    /// 按扩展名推断 MIME 类型。
    /// </summary>
    private static string GetContentType(string fileName)
    {
        return Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".bmp" => "image/bmp",
            ".webp" => "image/webp",
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls" => "application/vnd.ms-excel",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ".zip" or ".rar" or ".7z" => "application/octet-stream",
            ".txt" => "text/plain",
            ".csv" => "text/csv",
            _ => "application/octet-stream",
        };
    }

    private static bool IsNotFound(AmazonS3Exception exception) =>
        exception.StatusCode == HttpStatusCode.NotFound
        || string.Equals(exception.ErrorCode, "NoSuchKey", StringComparison.OrdinalIgnoreCase)
        || string.Equals(exception.ErrorCode, "NotFound", StringComparison.OrdinalIgnoreCase);

    private static string RequireNonEmpty(string? value, string name) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new InvalidOperationException($"{name} 必须配置")
            : value.Trim();

    /// <summary>
    /// 对不可定位的上传流施加上限，避免绕过请求大小限制导致对象存储写入超大文件。
    /// </summary>
    private sealed class SizeLimitedReadStream(Stream inner, long maxBytes) : Stream
    {
        private long _bytesRead;

        public override bool CanRead => inner.CanRead;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();

        public override long Position
        {
            get => _bytesRead;
            set => throw new NotSupportedException();
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            ArgumentNullException.ThrowIfNull(buffer);
            return Read(buffer.AsSpan(offset, count));
        }

        public override int Read(Span<byte> buffer)
        {
            if (buffer.Length == 0)
                return 0;

            if (_bytesRead >= maxBytes)
                return ReadAndRejectIfMore();

            var allowed = (int)Math.Min(buffer.Length, maxBytes - _bytesRead);
            var read = inner.Read(buffer[..allowed]);
            _bytesRead += read;
            return read;
        }

        public override async ValueTask<int> ReadAsync(
            Memory<byte> buffer,
            CancellationToken cancellationToken = default)
        {
            if (buffer.Length == 0)
                return 0;

            if (_bytesRead >= maxBytes)
            {
                var probe = new byte[1];
                var extra = await inner.ReadAsync(probe, cancellationToken);
                if (extra > 0)
                    throw new IOException("文件大小超过限制（最大 20MB）");

                return 0;
            }

            var allowed = (int)Math.Min(buffer.Length, maxBytes - _bytesRead);
            var read = await inner.ReadAsync(buffer[..allowed], cancellationToken);
            _bytesRead += read;
            return read;
        }

        public override Task<int> ReadAsync(
            byte[] buffer,
            int offset,
            int count,
            CancellationToken cancellationToken)
            => ReadAsync(buffer.AsMemory(offset, count), cancellationToken).AsTask();

        public override void Flush() => throw new NotSupportedException();
        public override Task FlushAsync(CancellationToken cancellationToken) => Task.CompletedTask;
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        protected override void Dispose(bool disposing)
        {
            // 源流由调用方管理；这里只释放包装层，防止 AWS SDK 影响控制器的 using 生命周期。
            base.Dispose(disposing);
        }

        private int ReadAndRejectIfMore()
        {
            Span<byte> probe = stackalloc byte[1];
            var extra = inner.Read(probe);
            if (extra > 0)
                throw new IOException("文件大小超过限制（最大 20MB）");

            return 0;
        }
    }
}
