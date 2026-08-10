namespace EquipAI.Core.Interfaces;

/// <summary>
/// 文件存储服务接口 — 抽象文件上传/下载/删除操作。
/// 默认实现为本地文件系统，也支持通过配置切换到 S3 兼容对象存储。
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// 保存文件到存储
    /// </summary>
    /// <param name="tenantId">租户 ID（用于路径隔离）</param>
    /// <param name="category">文件分类（如 workOrderId）</param>
    /// <param name="fileName">原始文件名</param>
    /// <param name="stream">文件流</param>
    /// <param name="contentType">MIME 类型</param>
    /// <returns>相对存储路径</returns>
    Task<string> SaveAsync(Guid tenantId, string category, string fileName, Stream stream, string contentType);

    /// <summary>
    /// 获取文件流
    /// </summary>
    /// <param name="storagePath">相对存储路径</param>
    /// <returns>文件流和内容类型</returns>
    Task<(Stream Stream, string ContentType, string FileName)> GetAsync(string storagePath);

    /// <summary>
    /// 删除文件
    /// </summary>
    Task DeleteAsync(string storagePath);

    /// <summary>
    /// 检查文件是否存在
    /// </summary>
    Task<bool> ExistsAsync(string storagePath);
}
