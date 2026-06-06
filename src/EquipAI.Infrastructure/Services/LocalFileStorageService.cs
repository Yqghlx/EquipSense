using EquipAI.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EquipAI.Infrastructure.Services;

/// <summary>
/// 本地文件系统存储实现
/// 文件保存到 {BasePath}/{tenantId}/{category}/{uniqueFileName}
/// 后续可替换为 S3/MinIO 实现
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly ILogger<LocalFileStorageService> _logger;

    /// <summary>
    /// 允许的文件扩展名（小写，不含点号）
    /// </summary>
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        "jpg", "jpeg", "png", "gif", "bmp", "webp",       // 图片
        "pdf",                                              // PDF
        "doc", "docx",                                      // Word
        "xls", "xlsx",                                      // Excel
        "zip", "rar", "7z",                                 // 压缩
        "txt", "csv",                                       // 文本
    };

    /// <summary>
    /// 最大文件大小 20MB
    /// </summary>
    private const long MaxFileSizeBytes = 20 * 1024 * 1024;

    public LocalFileStorageService(IConfiguration configuration, ILogger<LocalFileStorageService> logger)
    {
        _basePath = configuration["FileStorage:BasePath"] ?? "uploads";
        _logger = logger;
    }

    public async Task<string> SaveAsync(Guid tenantId, string category, string fileName, Stream stream, string contentType)
    {
        ValidateFile(fileName, stream.Length);

        // 构建存储目录：{basePath}/{tenantId}/{category}/
        var directory = Path.Combine(_basePath, tenantId.ToString(), category);
        Directory.CreateDirectory(directory);

        // 生成唯一文件名避免冲突：{原始名_不含扩展名}_{短GUID}.{扩展名}
        var extension = Path.GetExtension(fileName);
        var nameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
        var uniqueName = $"{nameWithoutExt}_{Guid.NewGuid():N}{extension}";

        var fullPath = Path.Combine(directory, uniqueName);
        var relativePath = Path.Combine(tenantId.ToString(), category, uniqueName)
            .Replace('\\', '/');

        await using var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write);
        await stream.CopyToAsync(fileStream);

        _logger.LogInformation("文件已保存：{Path}，大小：{Size} 字节", relativePath, stream.Length);
        return relativePath;
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> GetAsync(string storagePath)
    {
        var fullPath = Path.GetFullPath(Path.Combine(_basePath, storagePath));

        // 安全检查：防止路径遍历攻击
        if (!fullPath.StartsWith(Path.GetFullPath(_basePath), StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("非法文件路径访问");
        }

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException("文件不存在", fullPath);
        }

        var fileName = Path.GetFileName(fullPath);
        var contentType = GetContentType(fileName);
        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);

        return await Task.FromResult((stream as Stream, contentType, fileName));
    }

    public Task DeleteAsync(string storagePath)
    {
        var fullPath = Path.GetFullPath(Path.Combine(_basePath, storagePath));

        // 安全检查：防止路径遍历攻击
        if (!fullPath.StartsWith(Path.GetFullPath(_basePath), StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("非法文件路径访问");
        }

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            _logger.LogInformation("文件已删除：{Path}", storagePath);
        }

        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string storagePath)
    {
        var fullPath = Path.GetFullPath(Path.Combine(_basePath, storagePath));
        if (!fullPath.StartsWith(Path.GetFullPath(_basePath), StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(false);
        }
        return Task.FromResult(File.Exists(fullPath));
    }

    /// <summary>
    /// 验证文件名扩展名和大小
    /// </summary>
    private static void ValidateFile(string fileName, long fileSize)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("文件名不能为空");

        if (fileSize > MaxFileSizeBytes)
            throw new ArgumentException($"文件大小超过限制（最大 {MaxFileSizeBytes / 1024 / 1024}MB）");

        var extension = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            throw new ArgumentException($"不支持的文件类型：.{extension}");
    }

    /// <summary>
    /// 根据文件扩展名推断 MIME 类型
    /// </summary>
    private static string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
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
            ".zip" => "application/zip",
            ".txt" => "text/plain",
            ".csv" => "text/csv",
            _ => "application/octet-stream",
        };
    }
}
