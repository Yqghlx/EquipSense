using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EquipAI.Application.Services;

/// <summary>
/// 设备导入持久化逻辑（partial）
/// 职责：事务内租户配额检查、已存在编码去重、批量插入、CurrentDeviceCount 计数修正
/// </summary>
public sealed partial class DeviceImportService
{
    /// <summary>
    /// 在事务内执行导入逻辑（拆分以便配合 CreateExecutionStrategy 使用）
    /// </summary>
    private async Task ExecuteImportInTransactionAsync(
        DeviceImportPreviewResult preview, ImportResult result, Guid tenantId, CancellationToken ct)
    {
        // 租户设备配额检查（在事务内查询，防止并发导入超额）
        var tenant = await _dbContext.UnfilteredSet<Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);

        if (tenant != null && tenant.MaxDevices > 0)
        {
            // 重新从 DB 统计实际设备数，而非依赖 CurrentDeviceCount（防止计数漂移）
            var actualCount = await _dbContext.Devices.CountAsync(ct);
            var available = tenant.MaxDevices - actualCount;
            if (preview.ValidCount > available)
            {
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = 0,
                    Message = $"设备配额不足：当前租户剩余 {available} 个设备配额，本次需导入 {preview.ValidCount} 个"
                });
                result.Failed = preview.ValidCount;
                result.Skipped = preview.ErrorCount;
                // 配额不足不需要回滚（无写入），直接返回；result 通过引用参数返回给调用方
                return;
            }
        }

        // 批量查询租户内已存在的设备编码（事务内，防止并发导入重复）
        var importCodes = preview.ValidItems.Select(v => v.DeviceCode).ToList();
        var existingCodes = (await _dbContext.Devices
            .Where(d => importCodes.Contains(d.DeviceCode))
            .Select(d => d.DeviceCode)
            .ToListAsync(ct))
            .ToHashSet();

        foreach (var item in preview.ValidItems)
        {
            if (existingCodes.Contains(item.DeviceCode))
            {
                result.Skipped++;
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = item.RowNumber,
                    Message = $"设备编码 '{item.DeviceCode}' 在租户内已存在，已跳过"
                });
                continue;
            }

            var criticality = ParseCriticality(item.Criticality);
            var installDate = ParseInstallDate(item.InstallDate);

            var device = new Device
            {
                TenantId = tenantId,
                DeviceCode = item.DeviceCode,
                Name = item.Name,
                Type = item.Type,
                Manufacturer = item.Manufacturer,
                Model = item.Model,
                SerialNumber = item.SerialNumber,
                // location 为 jsonb 列，必须规范化为合法 JSON，否则 PG 校验失败会回滚整批导入
                Location = NormalizeLocation(item.Location),
                GatewayId = item.GatewayId,
                Criticality = criticality,
                InstallDate = installDate,
                DowntimeCostPerHour = item.DowntimeCostPerHour,
                Status = DeviceStatus.Offline,
            };

            _dbContext.Devices.Add(device);
            existingCodes.Add(item.DeviceCode);
            result.Imported++;
        }

        // 预览中的错误项计入跳过
        result.Skipped += preview.ErrorCount;
        result.Errors.AddRange(preview.Errors);

        if (result.Imported > 0)
        {
            // 基于 DB 实际数量重新计算 CurrentDeviceCount，修正计数漂移
            if (tenant != null)
            {
                tenant.CurrentDeviceCount = await _dbContext.Devices.CountAsync(ct);
            }

            await _dbContext.SaveChangesAsync(ct);
        }
    }
}
