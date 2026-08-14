using EquipAI.Core.Entities;
using EquipAI.Core.Events;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 工单附件元数据管理服务。
/// 封装附件记录的查询/创建/删除，使 Controller 不直接依赖 <c>AppDbContext</c>。
/// 物理文件的读写仍由 <c>IFileStorageService</c> 负责（HTTP 流式处理保留在 Controller）。
/// </summary>
public class WorkOrderAttachmentService
{
    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly IEventBus _eventBus;
    private readonly ILogger<WorkOrderAttachmentService> _logger;

    public WorkOrderAttachmentService(
        AppDbContext dbContext,
        ITenantContext tenantContext,
        IEventBus eventBus,
        ILogger<WorkOrderAttachmentService> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _eventBus = eventBus;
        _logger = logger;
    }

    /// <summary>
    /// 获取工单附件列表。
    /// </summary>
    public async Task<List<WorkOrderAttachmentDto>> ListAsync(Guid workOrderId, CancellationToken ct = default)
    {
        return await _dbContext.WorkOrderAttachments
            .Where(a => a.WorkOrderId == workOrderId
                && a.TenantId == _tenantContext.TenantId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new WorkOrderAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileSize = a.FileSize,
                UploadedBy = a.UploadedBy,
                CreatedAt = a.CreatedAt,
            })
            .ToListAsync(ct);
    }

    /// <summary>
    /// 校验工单是否存在（上传前校验）。返回 false 表示工单不存在。
    /// </summary>
    public async Task<bool> WorkOrderExistsAsync(Guid workOrderId, CancellationToken ct = default)
        => await _dbContext.WorkOrders.AnyAsync(
            w => w.Id == workOrderId && w.TenantId == _tenantContext.TenantId,
            ct);

    /// <summary>
    /// 持久化附件元数据（物理文件已由 IFileStorageService 保存）。
    /// </summary>
    public async Task<WorkOrderAttachmentDto> CreateAsync(
        Guid workOrderId, string fileName, string contentType, long fileSize, string storagePath, CancellationToken ct = default)
    {
        // 附件记录保存前再次确认工单归属，避免绕过控制器直接制造跨租户关联。
        if (!await WorkOrderExistsAsync(workOrderId, ct))
            throw new KeyNotFoundException($"工单不存在: {workOrderId}");

        var attachment = new WorkOrderAttachment
        {
            TenantId = _tenantContext.TenantId,
            WorkOrderId = workOrderId,
            FileName = fileName,
            ContentType = contentType,
            FileSize = fileSize,
            StoragePath = storagePath,
            UploadedBy = _tenantContext.UserId,
        };

        _dbContext.WorkOrderAttachments.Add(attachment);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderId} 上传附件：{FileName}（{Size} 字节）",
            workOrderId, fileName, fileSize);

        return new WorkOrderAttachmentDto
        {
            Id = attachment.Id,
            FileName = attachment.FileName,
            ContentType = attachment.ContentType,
            FileSize = attachment.FileSize,
            UploadedBy = attachment.UploadedBy,
            CreatedAt = attachment.CreatedAt,
        };
    }

    /// <summary>
    /// 查询附件元数据（下载用）。返回 null 表示附件不存在或不属于该工单。
    /// </summary>
    public async Task<WorkOrderAttachment?> GetAsync(Guid workOrderId, Guid attachmentId, CancellationToken ct = default)
        => await _dbContext.WorkOrderAttachments
            .FirstOrDefaultAsync(
                a => a.Id == attachmentId
                    && a.WorkOrderId == workOrderId
                    && a.TenantId == _tenantContext.TenantId,
                ct);

    /// <summary>
    /// 删除已通过 <see cref="GetAsync"/> 获取的附件记录，并登记物理文件删除事件。
    /// </summary>
    public async Task DeleteTrackedAsync(WorkOrderAttachment attachment, CancellationToken ct = default)
    {
        if (attachment.TenantId != _tenantContext.TenantId)
            throw new KeyNotFoundException($"附件不存在: {attachment.Id}");

        _dbContext.WorkOrderAttachments.Remove(attachment);
        var deletionEvent = new WorkOrderAttachmentDeletedEvent(
            attachment.Id,
            DateTime.UtcNow,
            attachment.TenantId,
            attachment.WorkOrderId,
            attachment.Id,
            attachment.StoragePath);
        // 生产 TransactionalEventBus 会在 PublishAsync 内保存当前 DbContext，
        // 从而把元数据删除和 Outbox 事件放进同一数据库事务；随后显式 SaveChanges
        // 兼容 InMemory/测试实现，确保非事务包装器也完成元数据持久化。
        // 若消息代理暂时不可用，事件仍留在数据库中等待后续分发，不能退回控制器的尽力而为删除。
        await _eventBus.PublishAsync(deletionEvent, ct);
        await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation("工单 {WorkOrderId} 删除附件：{FileName}",
            attachment.WorkOrderId, attachment.FileName);
    }
}

/// <summary>
/// 工单附件 DTO。
/// </summary>
public class WorkOrderAttachmentDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public Guid UploadedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}
