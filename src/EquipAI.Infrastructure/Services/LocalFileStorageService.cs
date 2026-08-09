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
        // 固化为绝对路径，后续所有路径都通过 Path.GetRelativePath 判断是否仍在根目录内。
        // 仅用 StartsWith 判断会把 /uploads-secret 错误地当成 /uploads 的子目录。
        _basePath = Path.GetFullPath(configuration["FileStorage:BasePath"] ?? "uploads");
        _logger = logger;
    }

    public async Task<string> SaveAsync(Guid tenantId, string category, string fileName, Stream stream, string contentType)
    {
        var safeCategory = NormalizeCategory(category);
        var safeFileName = NormalizeFileName(fileName);
        ValidateFile(safeFileName, stream.Length);

        // 构建存储目录：{basePath}/{tenantId}/{category}/
        var directory = Path.GetFullPath(Path.Combine(_basePath, tenantId.ToString(), safeCategory));
        EnsureInsideBasePath(directory);
        Directory.CreateDirectory(directory);

        // 生成唯一文件名避免冲突：{原始名_不含扩展名}_{短GUID}.{扩展名}
        var extension = Path.GetExtension(safeFileName);
        var nameWithoutExt = SanitizeFileNamePart(Path.GetFileNameWithoutExtension(safeFileName));
        var uniqueName = $"{nameWithoutExt}_{Guid.NewGuid():N}{extension}";

        var fullPath = Path.GetFullPath(Path.Combine(directory, uniqueName));
        EnsureInsideBasePath(fullPath);
        var relativePath = Path.Combine(tenantId.ToString(), safeCategory, uniqueName)
            .Replace('\\', '/');

        await using var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write);
        await stream.CopyToAsync(fileStream);

        _logger.LogInformation("文件已保存：{Path}，大小：{Size} 字节", relativePath, stream.Length);
        return relativePath;
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> GetAsync(string storagePath)
    {
        var fullPath = ResolveStoragePath(storagePath);

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
        var fullPath = ResolveStoragePath(storagePath);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            _logger.LogInformation("文件已删除：{Path}", storagePath);
        }

        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string storagePath)
    {
        try
        {
            return Task.FromResult(File.Exists(ResolveStoragePath(storagePath)));
        }
        catch (UnauthorizedAccessException)
        {
            return Task.FromResult(false);
        }
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
    /// 规范化文件分类。分类只允许作为单级目录使用，避免调用方把目录树带入存储路径。
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
    /// 只保留原始文件名的最后一段，并统一处理 Windows 与 Unix 路径分隔符。
    /// </summary>
    private static string NormalizeFileName(string fileName)
    {
        var normalized = fileName.Replace('\\', '/');
        var safeFileName = Path.GetFileName(normalized);
        if (string.IsNullOrWhiteSpace(safeFileName) || safeFileName is "." or "..")
            throw new ArgumentException("文件名无效", nameof(fileName));

        return safeFileName;
    }

    /// <summary>
    /// 移除文件名中可能导致跨平台创建失败的字符，并限制名称长度，避免路径过长。
    /// </summary>
    private static string SanitizeFileNamePart(string name)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = string.Concat(name.Select(character =>
            invalidChars.Contains(character) ? '_' : character));
        sanitized = sanitized.Trim().TrimEnd('.', ' ');

        if (string.IsNullOrWhiteSpace(sanitized) || sanitized is "." or "..")
            sanitized = "file";

        return sanitized.Length <= 100 ? sanitized : sanitized[..100];
    }

    /// <summary>
    /// 将相对存储路径解析为绝对路径，并拒绝根目录外的路径。
    /// </summary>
    private string ResolveStoragePath(string storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath) || Path.IsPathRooted(storagePath))
            throw new UnauthorizedAccessException("非法文件路径访问");

        var fullPath = Path.GetFullPath(Path.Combine(_basePath, storagePath));
        EnsureInsideBasePath(fullPath);
        return fullPath;
    }

    /// <summary>
    /// 使用相对路径判断边界，避免目录名仅共享前缀时绕过检查。
    /// </summary>
    private void EnsureInsideBasePath(string fullPath)
    {
        var relativePath = Path.GetRelativePath(_basePath, fullPath);
        var parentPrefix = ".." + Path.DirectorySeparatorChar;
        var alternateParentPrefix = ".." + Path.AltDirectorySeparatorChar;
        if (relativePath == ".."
            || relativePath.StartsWith(parentPrefix, StringComparison.Ordinal)
            || relativePath.StartsWith(alternateParentPrefix, StringComparison.Ordinal)
            || Path.IsPathRooted(relativePath))
        {
            throw new UnauthorizedAccessException("非法文件路径访问");
        }
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
