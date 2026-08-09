using EquipAI.Application.WorkOrders;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Middleware;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

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
    private readonly ILogger<WorkOrderAttachmentsController> _logger;

    public WorkOrderAttachmentsController(
        WorkOrderAttachmentService service,
        IFileStorageService fileStorage,
        ITenantContext tenantContext,
        ILogger<WorkOrderAttachmentsController> logger)
    {
        _service = service;
        _fileStorage = fileStorage;
        _tenantContext = tenantContext;
        _logger = logger;
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

        string? storagePath = null;
        try
        {
            await using var stream = file.OpenReadStream();
            storagePath = await _fileStorage.SaveAsync(
                _tenantContext.TenantId,
                workOrderId.ToString(),
                file.FileName,
                stream,
                file.ContentType);

            var dto = await _service.CreateAsync(
                workOrderId,
                file.FileName,
                file.ContentType,
                file.Length,
                storagePath,
                ct);

            return CreatedAtAction(nameof(GetAttachments), new { workOrderId }, dto);
        }
        catch (Exception exception)
        {
            // 文件系统与数据库不是同一个事务边界；元数据写入失败时必须主动补偿，
            // 否则每次临时故障都会在租户目录留下无法追踪的孤儿文件。
            if (!string.IsNullOrWhiteSpace(storagePath))
            {
                try
                {
                    await _fileStorage.DeleteAsync(storagePath);
                }
                catch (Exception cleanupException)
                {
                    _logger.LogError(
                        cleanupException,
                        "附件失败补偿删除未完成：WorkOrderId={WorkOrderId}, StoragePath={StoragePath}",
                        workOrderId,
                        storagePath);
                }
            }

            _logger.LogError(
                exception,
                "附件上传未完成：WorkOrderId={WorkOrderId}, FileName={FileName}",
                workOrderId,
                file.FileName);
            throw;
        }
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

        // 先删除数据库记录：如果数据库提交失败，文件仍然存在，重试仍可继续；
        // 反过来先删文件会留下“记录存在但文件丢失”的不可恢复坏引用。
        await _service.DeleteTrackedAsync(attachment, ct);

        // 文件删除属于数据库事务之外的清理动作。删除失败时记录错误并返回幂等成功，
        // 避免用户看到附件已经从业务列表消失却收到误导性的 500；运维可依据日志清理孤儿文件。
        try
        {
            await _fileStorage.DeleteAsync(attachment.StoragePath);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "附件物理文件删除失败，需后续清理：WorkOrderId={WorkOrderId}, StoragePath={StoragePath}",
                workOrderId,
                attachment.StoragePath);
        }

        return NoContent();
    }
}
