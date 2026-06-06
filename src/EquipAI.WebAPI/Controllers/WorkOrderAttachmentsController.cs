using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 工单附件控制器 — 处理工单关联文件的上传、下载、列表和删除
/// </summary>
[ApiController]
[Route("api/v1/work-orders/{workOrderId:guid}/attachments")]
[Authorize]
public class WorkOrderAttachmentsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IFileStorageService _fileStorage;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<WorkOrderAttachmentsController> _logger;

    public WorkOrderAttachmentsController(
        AppDbContext dbContext,
        IFileStorageService fileStorage,
        ITenantContext tenantContext,
        ILogger<WorkOrderAttachmentsController> logger)
    {
        _dbContext = dbContext;
        _fileStorage = fileStorage;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    /// <summary>
    /// 获取工单附件列表
    /// </summary>
    [HttpGet]
    [RequirePermission("workorder:read")]
    public async Task<ActionResult<List<WorkOrderAttachmentDto>>> GetAttachments(Guid workOrderId)
    {
        var attachments = await _dbContext.WorkOrderAttachments
            .Where(a => a.WorkOrderId == workOrderId)
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
            .ToListAsync();

        return Ok(attachments);
    }

    /// <summary>
    /// 上传附件到工单
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(20 * 1024 * 1024)] // 20MB
    [RequirePermission("workorder:execute")]
    public async Task<ActionResult<WorkOrderAttachmentDto>> UploadAttachment(
        Guid workOrderId,
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { code = 400, message = "请选择要上传的文件" });

        // 验证工单存在
        var workOrder = await _dbContext.WorkOrders.FindAsync(workOrderId);
        if (workOrder == null)
            return NotFound(new { code = 404, message = "工单不存在" });

        await using var stream = file.OpenReadStream();
        var storagePath = await _fileStorage.SaveAsync(
            _tenantContext.TenantId,
            workOrderId.ToString(),
            file.FileName,
            stream,
            file.ContentType);

        var attachment = new WorkOrderAttachment
        {
            TenantId = _tenantContext.TenantId,
            WorkOrderId = workOrderId,
            FileName = file.FileName,
            ContentType = file.ContentType,
            FileSize = file.Length,
            StoragePath = storagePath,
            UploadedBy = _tenantContext.UserId,
        };

        _dbContext.WorkOrderAttachments.Add(attachment);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("工单 {WorkOrderId} 上传附件：{FileName}（{Size} 字节）",
            workOrderId, file.FileName, file.Length);

        return CreatedAtAction(nameof(GetAttachments), new { workOrderId },
            new WorkOrderAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                ContentType = attachment.ContentType,
                FileSize = attachment.FileSize,
                UploadedBy = attachment.UploadedBy,
                CreatedAt = attachment.CreatedAt,
            });
    }

    /// <summary>
    /// 下载附件
    /// </summary>
    [HttpGet("{attachmentId:guid}/download")]
    [RequirePermission("workorder:read")]
    public async Task<IActionResult> DownloadAttachment(Guid workOrderId, Guid attachmentId)
    {
        var attachment = await _dbContext.WorkOrderAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.WorkOrderId == workOrderId);

        if (attachment == null)
            return NotFound(new { code = 404, message = "附件不存在" });

        var (stream, contentType, fileName) = await _fileStorage.GetAsync(attachment.StoragePath);

        return File(stream, contentType, fileName);
    }

    /// <summary>
    /// 删除附件
    /// </summary>
    [HttpDelete("{attachmentId:guid}")]
    [RequirePermission("workorder:execute")]
    public async Task<IActionResult> DeleteAttachment(Guid workOrderId, Guid attachmentId)
    {
        var attachment = await _dbContext.WorkOrderAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.WorkOrderId == workOrderId);

        if (attachment == null)
            return NotFound(new { code = 404, message = "附件不存在" });

        // 删除物理文件
        await _fileStorage.DeleteAsync(attachment.StoragePath);

        // 删除数据库记录
        _dbContext.WorkOrderAttachments.Remove(attachment);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("工单 {WorkOrderId} 删除附件：{FileName}",
            workOrderId, attachment.FileName);

        return NoContent();
    }
}

/// <summary>
/// 工单附件 DTO
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
