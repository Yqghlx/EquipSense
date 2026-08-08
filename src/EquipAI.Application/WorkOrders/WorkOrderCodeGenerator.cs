using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace EquipAI.Application.WorkOrders;

/// <summary>
/// 工单编码生成器，统一手工建单和告警自动建单两条路径的编码生成与并发冲突重试逻辑。
///
/// 设计要点：
/// 1. 编码格式 WO-{yyyyMMdd}-{4位序号}，全局唯一（跨租户，因为唯一索引不区分租户）。
/// 2. 读最大序号时必须 IgnoreQueryFilters：手工建单走 HttpContext 带租户过滤器，
///    但编码本身跨租户唯一，不绕过过滤器会让另一租户当天已建的编码不可见 → 序号永远从 1 开始 → 冲突。
/// 3. 并发下可能两个请求读到相同 maxCode，产生相同序号 → 命中 IX_work_orders_workorder_code
///    唯一约束（SQLSTATE 23505）。此时重试，下一轮重新读 maxCode 必然拿到更大的值。
/// </summary>
internal static class WorkOrderCodeGenerator
{
    /// <summary>
    /// 生成并持久化一个工单，带唯一编码冲突重试。
    /// 供 WorkOrderService.CreateAsync 和 WorkOrderAutoCreateHandler 复用，避免两条路径行为分叉。
    /// </summary>
    /// <param name="dbContext">数据库上下文（调用方负责 scope 管理）</param>
    /// <param name="buildWorkOrder">根据已生成的编码构造工单实体（尚未 Add 到 DbContext）</param>
    /// <param name="logger">日志记录器，用于记录重试与最终失败</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>成功落库的工单；重试耗尽仍冲突时返回 null（调用方决定如何向用户/上游报告）</returns>
    public static async Task<WorkOrder?> CreateWithUniqueCodeAsync(
        AppDbContext dbContext,
        Func<string, WorkOrder> buildWorkOrder,
        ILogger logger,
        CancellationToken ct)
    {
        const int maxAttempts = 3;

        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            var workOrderCode = await GenerateCodeAsync(dbContext, ct);
            var workOrder = buildWorkOrder(workOrderCode);

            dbContext.WorkOrders.Add(workOrder);
            try
            {
                await dbContext.SaveChangesAsync(ct);
                return workOrder;
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex))
            {
                // 工单编码冲突（并发）：回滚本次变更，下一轮重新读 maxCode 必然拿到更大的值。
                // Detach 失败的实体，避免 ChangeTracker 残留导致下一轮重试重复追踪。
                logger.LogWarning("工单编码 {Code} 冲突（并发），第 {Attempt} 次重试", workOrderCode, attempt + 1);
                dbContext.Entry(workOrder).State = EntityState.Detached;

                if (attempt < maxAttempts - 1)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(50 * (attempt + 1)), ct);
                }
            }
        }

        logger.LogError("工单编码生成失败：{MaxAttempts} 次重试后仍冲突", maxAttempts);
        return null;
    }

    /// <summary>
    /// 生成工单编码（格式：WO-{yyyyMMdd}-{4位序号}），读最大序号时绕过租户过滤器。
    /// </summary>
    public static async Task<string> GenerateCodeAsync(AppDbContext dbContext, CancellationToken ct)
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"WO-{today}-";

        // IgnoreQueryFilters：编码跨租户唯一，必须看到所有租户当天编码才能算出正确的下一个序号。
        var maxCode = await dbContext.WorkOrders
            .IgnoreQueryFilters()
            .Where(wo => wo.WorkOrderCode.StartsWith(prefix))
            .OrderByDescending(wo => wo.WorkOrderCode)
            .Select(wo => wo.WorkOrderCode)
            .FirstOrDefaultAsync(ct);

        var nextSeq = 1;
        if (!string.IsNullOrEmpty(maxCode) && maxCode.Length > prefix.Length)
        {
            var seqPart = maxCode[prefix.Length..];
            if (int.TryParse(seqPart, out var currentMax))
            {
                nextSeq = currentMax + 1;
            }
        }

        return $"{prefix}{nextSeq:D4}";
    }

    /// <summary>
    /// 判断 EF 保存异常是否为唯一约束冲突（PostgreSQL SQLSTATE 23505）。
    /// </summary>
    public static bool IsUniqueViolation(DbUpdateException ex)
    {
        for (var inner = (Exception?)ex; inner != null; inner = inner.InnerException)
        {
            if (inner is PostgresException pg && pg.SqlState == "23505")
            {
                return true;
            }
        }
        return false;
    }
}
