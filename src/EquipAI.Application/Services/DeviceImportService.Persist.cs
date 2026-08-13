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
        // 结果对象由执行策略重试复用；每次事务尝试都从零计算，避免失败重试造成统计累加。
        result.Imported = 0;
        result.Skipped = 0;
        result.Failed = 0;
        result.Errors.Clear();

        // 租户设备配额检查（在事务内查询，防止并发导入超额）
        var tenant = await _dbContext.UnfilteredSet<Tenant>()
            .FirstOrDefaultAsync(t => t.Id == tenantId, ct);

        // 生产数据库有租户外键；在写入前返回稳定业务结果，避免把租户丢失暴露为 500。
        // InMemory 单元测试允许无租户数据以覆盖纯导入逻辑，保持该测试 provider 的兼容性。
        if (tenant is null && _dbContext.Database.IsRelational())
        {
            result.Errors.Add(new ImportErrorItem
            {
                RowNumber = 0,
                Message = "当前租户不存在，无法导入设备"
            });
            result.Failed = preview.ValidCount;
            result.Skipped = preview.ErrorCount;
            result.Errors.AddRange(preview.Errors);
            return;
        }

        if (tenant is not null && _dbContext.Database.IsRelational())
        {
            // 必须在读取 existingCodes 之前取得租户行锁。否则两个相同文件并发导入时，
            // 后等待者仍会基于锁前旧快照把同一编码视为新增，最终撞唯一约束并返回 500。
            // 锁返回后下面的查询是新语句，能够看到前一事务刚提交的设备并按“已跳过”处理。
            var tenantLocked = await TenantQuotaSql.LockTenantRowAsync(_dbContext, tenantId, ct);
            if (!tenantLocked)
            {
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = 0,
                    Message = "当前租户不存在，无法导入设备"
                });
                result.Failed = preview.ValidCount;
                result.Skipped = preview.ErrorCount;
                result.Errors.AddRange(preview.Errors);
                return;
            }
        }

        // 批量查询租户内已存在的设备编码；PostgreSQL 路径已在上方持有租户锁，
        // 同租户的创建和导入都要经过该锁，因此查询结果在本事务写入前保持稳定。
        var importCodes = preview.ValidItems.Select(v => v.DeviceCode).ToList();
        var existingCodes = (await _dbContext.Devices
            .Where(d => d.TenantId == tenantId && importCodes.Contains(d.DeviceCode))
            .Select(d => d.DeviceCode)
            .ToListAsync(ct))
            .ToHashSet();

        // 先识别重复项，再按真正新增的数量检查/预留配额。
        // 这样重复上传完整清单不会因为租户已满而被误报为配额失败。
        var newItems = new List<DeviceImportPreviewItem>();
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
            }
            else
            {
                newItems.Add(item);
            }
        }

        var importCount = newItems.Count;
        var actualDeviceCount = 0;
        if (tenant != null && importCount > 0 && !_dbContext.Database.IsRelational())
        {
            // InMemory 不支持关系型事务预留，只能在写入前按真实设备数检查。
            // 不能使用 CurrentDeviceCount：它是展示/修复用缓存，历史值偏大时会误拒绝合法导入。
            actualDeviceCount = await _dbContext.Devices
                .CountAsync(d => d.TenantId == tenantId, ct);
            if (tenant.MaxDevices > 0 && actualDeviceCount + importCount > tenant.MaxDevices)
            {
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = 0,
                    Message = $"设备配额不足：当前租户剩余 {Math.Max(tenant.MaxDevices - actualDeviceCount, 0)} 个设备配额，本次需导入 {importCount} 个"
                });
                result.Failed = importCount;
                result.Errors.AddRange(preview.Errors);
                result.Skipped += preview.ErrorCount;
                // 配额不足不需要回滚（无写入），直接返回；result 通过引用参数返回给调用方。
                return;
            }
        }

        if (tenant != null && importCount > 0)
        {
            if (_dbContext.Database.IsRelational())
            {
                // 预留与实际插入共享当前事务；共享实现依据 devices 的真实行数修正计数。
                // 此处重复请求同一租户锁会立即返回，用于保持 TryReserve 的独立安全边界。
                var affected = await TenantQuotaSql.TryReserveDeviceSlotsAsync(
                    _dbContext, tenantId, importCount, ct);

                if (affected == 0)
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = 0,
                        Message = $"设备配额不足：本次需导入 {importCount} 个设备"
                    });
                    result.Failed = importCount;
                    result.Errors.AddRange(preview.Errors);
                    result.Skipped += preview.ErrorCount;
                    return;
                }
            }
            else
            {
                // 与关系型预留保持同一不变量：写入后计数器等于真实设备数，而不是旧计数器加增量。
                if (tenant.MaxDevices > 0 && actualDeviceCount + importCount > tenant.MaxDevices)
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = 0,
                        Message = $"设备配额不足：本次需导入 {importCount} 个设备"
                    });
                    result.Failed = importCount;
                    result.Errors.AddRange(preview.Errors);
                    result.Skipped += preview.ErrorCount;
                    return;
                }

                tenant.CurrentDeviceCount = actualDeviceCount + importCount;
            }
        }

        foreach (var item in newItems)
        {
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
            await _dbContext.SaveChangesAsync(ct);
        }
    }
}
