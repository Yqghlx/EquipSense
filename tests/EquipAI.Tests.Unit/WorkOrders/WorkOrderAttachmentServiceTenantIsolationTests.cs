using EquipAI.Application.WorkOrders;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace EquipAI.Tests.Unit.WorkOrders;

/// <summary>
/// 工单附件服务租户边界测试。
/// </summary>
public class WorkOrderAttachmentServiceTenantIsolationTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly WorkOrderAttachmentService _sut;
    private readonly Guid _dbTenantId = Guid.NewGuid();
    private readonly Guid _serviceTenantId = Guid.NewGuid();
    private readonly Guid _workOrderId = Guid.NewGuid();
    private readonly Guid _attachmentId = Guid.NewGuid();

    public WorkOrderAttachmentServiceTenantIsolationTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"TestWorkOrderAttachmentIsolation_{Guid.NewGuid()}")
            .Options;

        // DbContext 固定在租户 A，服务使用租户 B，故意复现全局过滤器与业务租户不一致的场景。
        _db = new AppDbContext(options, new TestTenantContext(_dbTenantId));
        _sut = new WorkOrderAttachmentService(
            _db,
            new TestTenantContext(_serviceTenantId),
            NullLogger<WorkOrderAttachmentService>.Instance);

        SeedOtherTenantData();
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task ListAsync_其他租户附件_应返回空列表()
    {
        var result = await _sut.ListAsync(_workOrderId);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task WorkOrderExistsAsync_其他租户工单_应返回不存在()
    {
        var result = await _sut.WorkOrderExistsAsync(_workOrderId);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task GetAsync_其他租户附件_应返回空()
    {
        var result = await _sut.GetAsync(_workOrderId, _attachmentId);

        result.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_其他租户工单_不应创建附件()
    {
        var act = () => _sut.CreateAsync(
            _workOrderId,
            "越权.txt",
            "text/plain",
            10,
            "tenant/other/work-order/越权.txt");

        await act.Should().ThrowAsync<KeyNotFoundException>(
            "附件不能关联其他租户的工单");
        (await _db.WorkOrderAttachments
            .IgnoreQueryFilters()
            .CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task DeleteTrackedAsync_其他租户附件_不应删除()
    {
        var attachment = await _db.WorkOrderAttachments
            .IgnoreQueryFilters()
            .SingleAsync(a => a.Id == _attachmentId);

        var act = () => _sut.DeleteTrackedAsync(attachment);

        await act.Should().ThrowAsync<KeyNotFoundException>(
            "删除操作必须再次校验实体租户");
        (await _db.WorkOrderAttachments
            .IgnoreQueryFilters()
            .AnyAsync(a => a.Id == _attachmentId)).Should().BeTrue();
    }

    private void SeedOtherTenantData()
    {
        _db.WorkOrders.Add(new WorkOrder
        {
            Id = _workOrderId,
            TenantId = _dbTenantId,
            WorkOrderCode = "WO-OTHER-001",
            Title = "其他租户工单",
            Type = WorkOrderType.Corrective,
            Status = WorkOrderStatus.PendingDispatch,
            Priority = WorkOrderPriority.Medium,
            DeviceId = Guid.NewGuid()
        });
        _db.WorkOrderAttachments.Add(new WorkOrderAttachment
        {
            Id = _attachmentId,
            TenantId = _dbTenantId,
            WorkOrderId = _workOrderId,
            FileName = "other.txt",
            ContentType = "text/plain",
            FileSize = 10,
            StoragePath = "tenant/other/work-order/other.txt",
            UploadedBy = Guid.NewGuid()
        });
        _db.SaveChanges();
    }

    /// <summary>
    /// 测试用租户上下文，用于构造 DbContext 与服务租户不一致的场景。
    /// </summary>
    private sealed class TestTenantContext(Guid tenantId) : ITenantContext
    {
        public Guid TenantId { get; } = tenantId;
        public string IsolationMode => "shared";
        public bool IsSystemAdmin => false;
        public Guid UserId { get; } = Guid.NewGuid();
    }
}
