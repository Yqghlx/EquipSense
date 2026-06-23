using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 租户时区解析工具 —— 将租户配置的 IANA 时区 ID 解析为 <see cref="TimeZoneInfo"/>，失败时降级为 UTC。
///
/// 工业客户常跨时区部署，趋势/统计的「按日分组」必须按租户本地时区，否则报表日期边界偏移：
/// 例如 UTC+8 客户在本地早 8 点（UTC 0 点）看统计，UTC 0-8 点产生的工单会被错归到 UTC 当天，
/// 而非客户认知中的「今天」，导致日报/月报数据失真、影响审计合规。
///
/// 提取为共享工具，供 <c>DashboardStatsService</c>（告警/工单趋势）与 <c>WorkOrderStatisticsService</c>
/// （工单统计趋势）共用，杜绝「一处按本地时区、一处按 UTC」的对称遗漏。
/// </summary>
public static class TimeZoneResolver
{
    /// <summary>
    /// 解析 IANA 时区 ID。
    ///
    /// 降级策略：空值、"UTC" 或解析失败的 ID 一律降级为 <see cref="TimeZoneInfo.Utc"/>（不抛异常）。
    /// 原因：租户可能填了无效时区 ID（如笔误），不应让依赖时区的查询（仪表盘、统计）崩溃；
    /// 解析失败时记录警告以便运维介入修正配置。
    /// </summary>
    /// <param name="timeZoneId">IANA 时区 ID（如 "Asia/Shanghai"），来自租户配置 <c>Tenant.TimeZone</c></param>
    /// <param name="logger">可选日志器，解析失败时记录警告（降级不抛异常）</param>
    /// <returns>解析成功的 <see cref="TimeZoneInfo"/>，或 <see cref="TimeZoneInfo.Utc"/>（降级）</returns>
    public static TimeZoneInfo Resolve(string? timeZoneId, ILogger? logger = null)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId) || timeZoneId.Equals("UTC", StringComparison.OrdinalIgnoreCase))
        {
            return TimeZoneInfo.Utc;
        }

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        }
        catch (Exception ex)
        {
            logger?.LogWarning(ex, "租户时区 {TimeZoneId} 无效，降级为 UTC", timeZoneId);
            return TimeZoneInfo.Utc;
        }
    }
}
