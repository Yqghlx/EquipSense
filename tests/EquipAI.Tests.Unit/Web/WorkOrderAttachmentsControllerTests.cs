using EquipAI.Application.WorkOrders;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using EquipAI.WebAPI.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace EquipAI.Tests.Unit.Web;

/// <summary>
/// 工单附件控制器测试。
/// </summary>
public class WorkOrderAttachmentsControllerTests
{
    [Fact]
    public async Task UploadAttachment_数据库保存失败时_应删除已经写入的物理文件()
    {
        var tenantId = Guid.NewGuid();
        var workOrderId = Guid.NewGuid();
        await using var db = CreateDb(tenantId);
        db.WorkOrders.Add(new WorkOrder
        {
            Id = workOrderId,
            TenantId = tenantId,
            WorkOrderCode = "WO-TEST-001",
            Title = "附件一致性测试",
            Type = WorkOrderType.Corrective,
            Status = WorkOrderStatus.PendingDispatch,
            Priority = WorkOrderPriority.Medium,
            DeviceId = Guid.NewGuid(),
        });
        await db.SaveChangesAsync();

        using var cancellation = new CancellationTokenSource();
        var storage = new CancellingFileStorage(cancellation);
        var tenantContext = new FixedTenantContext(tenantId);
        var service = new WorkOrderAttachmentService(
            db,
            tenantContext,
            NullLogger<WorkOrderAttachmentService>.Instance);
        var controller = new WorkOrderAttachmentsController(
            service,
            storage,
            tenantContext,
            NullLogger<WorkOrderAttachmentsController>.Instance);
        using var content = new MemoryStream("attachment"u8.ToArray());
        var file = new FormFile(content, 0, content.Length, "file", "note.txt")
        {
            Headers = new HeaderDictionary(),
            ContentType = "text/plain",
        };

        var exception = await Record.ExceptionAsync(() =>
            controller.UploadAttachment(workOrderId, file, cancellation.Token));

        exception.Should().BeAssignableTo<OperationCanceledException>();
        storage.DeletedPaths.Should().ContainSingle("租户数据库写入失败后必须补偿删除物理文件");
        storage.DeletedPaths[0].Should().Be("tenant/work-order/note.txt");
        (await db.WorkOrderAttachments.IgnoreQueryFilters().CountAsync())
            .Should().Be(0, "数据库写入失败时不应留下附件元数据");
    }

    [Fact]
    public async Task DeleteAttachment_数据库删除成功但物理文件删除失败时_不应恢复附件元数据()
    {
        var tenantId = Guid.NewGuid();
        var workOrderId = Guid.NewGuid();
        var attachmentId = Guid.NewGuid();
        await using var db = CreateDb(tenantId);
        db.WorkOrderAttachments.Add(new WorkOrderAttachment
        {
            Id = attachmentId,
            TenantId = tenantId,
            WorkOrderId = workOrderId,
            FileName = "note.txt",
            ContentType = "text/plain",
            FileSize = 10,
            StoragePath = "tenant/work-order/note.txt",
            UploadedBy = Guid.NewGuid(),
        });
        await db.SaveChangesAsync();

        var storage = new FailingDeleteFileStorage();
        var tenantContext = new FixedTenantContext(tenantId);
        var service = new WorkOrderAttachmentService(
            db,
            tenantContext,
            NullLogger<WorkOrderAttachmentService>.Instance);
        var controller = new WorkOrderAttachmentsController(
            service,
            storage,
            tenantContext,
            NullLogger<WorkOrderAttachmentsController>.Instance);

        var result = await controller.DeleteAttachment(workOrderId, attachmentId);

        result.Should().BeOfType<NoContentResult>();
        storage.DeletedPaths.Should().ContainSingle();
        (await db.WorkOrderAttachments.IgnoreQueryFilters().CountAsync())
            .Should().Be(0, "物理文件删除失败也不应恢复已经提交的数据库删除");
    }

    /// <summary>
    /// 创建使用独立内存库的数据库上下文。
    /// </summary>
    private static AppDbContext CreateDb(Guid tenantId)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"WorkOrderAttachmentController_{Guid.NewGuid():N}")
            .Options;
        return new AppDbContext(options, new FixedTenantContext(tenantId));
    }

    /// <summary>
    /// 固定租户上下文，模拟已认证用户。
    /// </summary>
    private sealed class FixedTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "shared";
        public bool IsSystemAdmin => false;
        public Guid UserId { get; } = Guid.NewGuid();
    }

    /// <summary>
    /// 在文件保存成功后取消数据库令牌，模拟“文件成功、元数据失败”的故障窗口。
    /// </summary>
    private sealed class CancellingFileStorage(CancellationTokenSource cancellation) : IFileStorageService
    {
        public List<string> DeletedPaths { get; } = [];

        public Task<string> SaveAsync(Guid tenantId, string category, string fileName, Stream stream, string contentType)
        {
            cancellation.Cancel();
            return Task.FromResult("tenant/work-order/note.txt");
        }

        public Task<(Stream Stream, string ContentType, string FileName)> GetAsync(string storagePath)
            => throw new NotSupportedException();

        public Task DeleteAsync(string storagePath)
        {
            DeletedPaths.Add(storagePath);
            return Task.CompletedTask;
        }

        public Task<bool> ExistsAsync(string storagePath) => Task.FromResult(false);
    }

    /// <summary>
    /// 模拟物理删除失败，验证数据库删除不会被回滚成坏引用。
    /// </summary>
    private sealed class FailingDeleteFileStorage : IFileStorageService
    {
        public List<string> DeletedPaths { get; } = [];

        public Task<string> SaveAsync(Guid tenantId, string category, string fileName, Stream stream, string contentType)
            => Task.FromResult("unused");

        public Task<(Stream Stream, string ContentType, string FileName)> GetAsync(string storagePath)
            => throw new NotSupportedException();

        public Task DeleteAsync(string storagePath)
        {
            DeletedPaths.Add(storagePath);
            throw new IOException("模拟文件系统删除失败");
        }

        public Task<bool> ExistsAsync(string storagePath) => Task.FromResult(true);
    }
}
