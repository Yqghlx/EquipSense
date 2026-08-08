using EquipAI.Application.WorkOrders;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EquipAI.WebAPI.Controllers;

/// <summary>
/// 工单附件控制器 — 处理工单关联文件的上传、下载、列表和删除
/// </summary>
[ApiController]
[Route("api/v1/work-orders/{workOrderId:guid}/attachments")]
[Authorize]
public class WorkOrderAttachmentsController : ControllerBase
{
    private readonly WorkOrderAttachmentService _service;
    private readonly IFileStorageService _fileStorage;
    private readonly ITenantContext _tenantContext;

    public WorkOrderAttachmentsController(
        WorkOrderAttachmentService service,
        IFileStorageService fileStorage,
        ITenantContext tenantContext)
    {
        _service = service;
        _fileStorage = fileStorage;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 获取工单附件列表
    /// </summary>
    [HttpGet]
    [RequirePermission("workorder:read")]
    public async Task<ActionResult<List<WorkOrderAttachmentDto>>> GetAttachments(Guid workOrderId, CancellationToken ct = default)
        => Ok(await _service.ListAsync(workOrderId, ct));

    /// <summary>
    /// 上传附件到工单
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(20 * 1024 * 1024)] // 20MB
    [RequirePermission("workorder:execute")]
    public async Task<ActionResult<WorkOrderAttachmentDto>> UploadAttachment(
        Guid workOrderId,
        IFormFile file,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { code = 400, message = "请选择要上传的文件" });

        // 验证工单存在
        if (!await _service.WorkOrderExistsAsync(workOrderId, ct))
            return NotFound(new { code = 404, message = "工单不存在" });

        await using var stream = file.OpenReadStream();
        var storagePath = await _fileStorage.SaveAsync(
            _tenantContext.TenantId,
            workOrderId.ToString(),
            file.FileName,
            stream,
            file.ContentType);

        var dto = await _service.CreateAsync(workOrderId, file.FileName, file.ContentType, file.Length, storagePath, ct);

        return CreatedAtAction(nameof(GetAttachments), new { workOrderId }, dto);
    }

    /// <summary>
    /// 下载附件
    /// </summary>
    [HttpGet("{attachmentId:guid}/download")]
    [RequirePermission("workorder:read")]
    public async Task<IActionResult> DownloadAttachment(Guid workOrderId, Guid attachmentId, CancellationToken ct = default)
    {
        var attachment = await _service.GetAsync(workOrderId, attachmentId, ct);
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
    public async Task<IActionResult> DeleteAttachment(Guid workOrderId, Guid attachmentId, CancellationToken ct = default)
    {
        var attachment = await _service.GetAsync(workOrderId, attachmentId, ct);
        if (attachment == null)
            return NotFound(new { code = 404, message = "附件不存在" });

        // 删除物理文件
        await _fileStorage.DeleteAsync(attachment.StoragePath);

        // 删除数据库记录
        await _service.DeleteTrackedAsync(attachment, ct);
        return NoContent();
    }
}
