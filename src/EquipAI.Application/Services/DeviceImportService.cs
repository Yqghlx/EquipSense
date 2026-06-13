using System.Globalization;
using System.Text;
using System.Text.Json;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 设备批量导入服务
/// 支持 CSV 和 JSON 格式的设备清单批量导入，包含预览校验和错误报告
/// </summary>
public class DeviceImportService
{
    private readonly AppDbContext _dbContext;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<DeviceImportService> _logger;

    /// <summary>CSV 必填列名</summary>
    private static readonly string[] CsvRequiredHeaders = ["device_code", "name", "type"];

    /// <summary>合法的关键等级值</summary>
    private static readonly HashSet<string> ValidCriticalities =
        new(StringComparer.OrdinalIgnoreCase) { "critical", "high", "normal", "low" };

    /// <summary>单次导入最大行数，防止超大文件导致内存溢出</summary>
    private const int MaxImportRows = 10_000;

    /// <summary>设备编码最大长度</summary>
    private const int MaxDeviceCodeLength = 50;

    /// <summary>设备名称最大长度</summary>
    private const int MaxNameLength = 200;

    /// <summary>设备类型最大长度</summary>
    private const int MaxTypeLength = 100;

    public DeviceImportService(
        AppDbContext dbContext,
        IAuditLogService auditLogService,
        ILogger<DeviceImportService> logger)
    {
        _dbContext = dbContext;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// 预览导入文件 — 解析但不写入数据库，返回校验报告
    /// 自动检测 CSV 或 JSON 格式（基于文件扩展名或内容首字符）
    /// </summary>
    public DeviceImportPreviewResult PreviewImport(string content, string fileName)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return new DeviceImportPreviewResult
            {
                Errors = [new ImportErrorItem { RowNumber = 0, Message = "文件内容不能为空" }]
            };
        }

        var isJson = fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
                     || content.TrimStart().StartsWith('[')
                     || content.TrimStart().StartsWith('{');

        return isJson ? PreviewJson(content) : PreviewCsv(content);
    }

    /// <summary>
    /// 执行批量导入 — 将预览结果中的有效项写入数据库
    /// 使用事务确保 CurrentDeviceCount 与实际设备数一致
    /// </summary>
    public async Task<ImportResult> ExecuteImportAsync(
        string content, string fileName, Guid tenantId, Guid userId, CancellationToken ct)
    {
        var preview = PreviewImport(content, fileName);
        var result = new ImportResult();

        // 预览阶段已有错误，直接返回
        if (preview.ValidCount == 0 && preview.ErrorCount > 0)
        {
            result.Failed = preview.ErrorCount;
            result.Errors.AddRange(preview.Errors);
            return result;
        }

        // 行数上限检查（二次校验，防止预览和执行之间文件被篡改）
        if (preview.ValidCount > MaxImportRows)
        {
            result.Errors.Add(new ImportErrorItem
            {
                RowNumber = 0,
                Message = $"导入数据超出上限：本次有效数据 {preview.ValidCount} 行，最大允许 {MaxImportRows} 行"
            });
            result.Failed = preview.ValidCount;
            result.Skipped = preview.ErrorCount;
            return result;
        }

        // 使用事务保证一致性：设备插入 + 租户计数更新要么全成功要么全回滚
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);

        try
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
                    // 配额不足不需要回滚（无写入），直接返回
                    return result;
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
                    Location = string.IsNullOrWhiteSpace(item.Location) ? "{}" : item.Location,
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

            await transaction.CommitAsync(ct);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(ct);
            _logger.LogError(ex, "设备批量导入事务失败，已回滚: Tenant={TenantId}", tenantId);
            throw;
        }

        // 审计日志（事务外执行，不影响导入结果）
        try
        {
            await _auditLogService.LogFromContextAsync(
                "DevicesImported", "Device", "",
                $"批量导入设备：成功 {result.Imported} 台，跳过 {result.Skipped} 台，失败 {result.Failed} 台", ct);
        }
        catch (Exception ex)
        {
            // 审计日志写入失败不应影响导入结果
            _logger.LogWarning(ex, "设备导入审计日志写入失败");
        }

        _logger.LogInformation(
            "设备批量导入完成: Tenant={TenantId}, Imported={Imported}, Skipped={Skipped}, Failed={Failed}",
            tenantId, result.Imported, result.Skipped, result.Failed);

        return result;
    }

    /// <summary>
    /// 生成 CSV 模板内容，供用户下载参考
    /// </summary>
    public static string GenerateCsvTemplate()
    {
        return "device_code,name,type,manufacturer,model,serial_number,location,gateway_id,criticality,install_date,downtime_cost_per_hour\n"
             + "PUMP-001,一号循环泵,泵,南方泵业,CMS-200,SN20240001,\"{\\\"workshop\\\":\\\"A\\\",\\\"line\\\":\\\"1\\\"}\",,Critical,2024-01-15,5000\n"
             + "MOTOR-002,主驱动电机,电机,ABB,M3BP-280,,,gateway-001,High,2024-03-01,8000\n";
    }

    /// <summary>
    /// 解析关键等级字符串为枚举值
    /// </summary>
    private static DeviceCriticality ParseCriticality(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return DeviceCriticality.Normal;

        return Enum.TryParse<DeviceCriticality>(value, ignoreCase: true, out var result)
            ? result
            : DeviceCriticality.Normal;
    }

    /// <summary>
    /// 解析安装日期字符串（yyyy-MM-dd）
    /// </summary>
    private static DateOnly? ParseInstallDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var date)
            ? date
            : null;
    }

    // ========================================================================
    // 私有方法：CSV / JSON 解析与校验
    // ========================================================================

    /// <summary>
    /// 解析 CSV 内容并生成预览报告
    /// 处理 BOM 头、\r\n 换行、引号内逗号
    /// </summary>
    private static DeviceImportPreviewResult PreviewCsv(string content)
    {
        var result = new DeviceImportPreviewResult();

        // 去除 UTF-8 BOM（中文 Excel 导出的 CSV 常带 BOM 头）
        if (content.StartsWith('﻿'))
            content = content[1..];

        // 统一换行符后再拆行，避免 \r 残留
        var lines = content.Replace("\r\n", "\n").Replace('\r', '\n')
            .Split('\n', StringSplitOptions.RemoveEmptyEntries);

        if (lines.Length == 0)
        {
            result.Errors.Add(new ImportErrorItem { RowNumber = 0, Message = "CSV 文件为空" });
            return result;
        }

        // 行数上限检查
        if (lines.Length - 1 > MaxImportRows)
        {
            result.Errors.Add(new ImportErrorItem
            {
                RowNumber = 0,
                Message = $"数据行数超出限制：文件包含 {lines.Length - 1} 行，最大允许 {MaxImportRows} 行"
            });
            return result;
        }

        // 解析表头行
        var headers = ParseCsvLine(lines[0])
            .Select(h => h.Trim().ToLowerInvariant())
            .ToArray();

        var headerIndex = new Dictionary<string, int>();
        for (var i = 0; i < headers.Length; i++)
            headerIndex[headers[i]] = i;

        // 校验必填列
        foreach (var required in CsvRequiredHeaders)
        {
            if (!headerIndex.ContainsKey(required))
            {
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = 1,
                    Message = $"缺少必填列: {required}",
                    RawContent = lines[0]
                });
                return result;
            }
        }

        result.TotalRows = lines.Length - 1;
        var seenCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 1; i < lines.Length; i++)
        {
            var rowNumber = i + 1;
            var fields = ParseCsvLine(lines[i]);

            var deviceCode = GetFieldValue(fields, headerIndex, "device_code")?.Trim();
            var name = GetFieldValue(fields, headerIndex, "name")?.Trim();
            var type = GetFieldValue(fields, headerIndex, "type")?.Trim();

            // 逐字段校验，收集所有错误而非只报第一个
            var rowErrors = ValidateRow(rowNumber, deviceCode, name, type, lines[i].Trim(), seenCodes);

            // 校验可选字段
            var criticality = GetFieldValue(fields, headerIndex, "criticality")?.Trim();
            if (!string.IsNullOrWhiteSpace(criticality) && !ValidCriticalities.Contains(criticality))
            {
                rowErrors.Add($"关键等级无效（应为 Critical/High/Normal/Low）: {criticality}");
            }

            var installDate = GetFieldValue(fields, headerIndex, "install_date")?.Trim();
            if (!string.IsNullOrWhiteSpace(installDate) &&
                !DateOnly.TryParseExact(installDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
            {
                rowErrors.Add($"安装日期格式错误（应为 yyyy-MM-dd）: {installDate}");
            }

            var costStr = GetFieldValue(fields, headerIndex, "downtime_cost_per_hour")?.Trim();
            if (!string.IsNullOrWhiteSpace(costStr) &&
                (!decimal.TryParse(costStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedCost) || parsedCost < 0))
            {
                rowErrors.Add($"停机成本格式错误或为负数: {costStr}");
            }

            if (rowErrors.Count > 0)
            {
                foreach (var err in rowErrors)
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = rowNumber,
                        Message = err,
                        RawContent = lines[i].Trim()
                    });
                }
                continue;
            }

            // 所有校验通过
            seenCodes.Add(deviceCode!);
            result.ValidItems.Add(new DeviceImportPreviewItem
            {
                RowNumber = rowNumber,
                DeviceCode = deviceCode!,
                Name = name!,
                Type = type!,
                Manufacturer = GetFieldValue(fields, headerIndex, "manufacturer")?.Trim(),
                Model = GetFieldValue(fields, headerIndex, "model")?.Trim(),
                SerialNumber = GetFieldValue(fields, headerIndex, "serial_number")?.Trim(),
                Location = GetFieldValue(fields, headerIndex, "location")?.Trim(),
                GatewayId = GetFieldValue(fields, headerIndex, "gateway_id")?.Trim(),
                Criticality = criticality,
                InstallDate = installDate,
                DowntimeCostPerHour = !string.IsNullOrWhiteSpace(costStr)
                    ? decimal.Parse(costStr, NumberStyles.Any, CultureInfo.InvariantCulture)
                    : null,
            });
        }

        return result;
    }

    /// <summary>
    /// 解析 JSON 内容并生成预览报告
    /// 兼容 snake_case 和 camelCase 字段名
    /// </summary>
    private static DeviceImportPreviewResult PreviewJson(string content)
    {
        var result = new DeviceImportPreviewResult();

        try
        {
            var items = JsonSerializer.Deserialize<List<JsonElement>>(content);
            if (items is null || items.Count == 0)
            {
                result.Errors.Add(new ImportErrorItem { RowNumber = 0, Message = "JSON 数组为空" });
                return result;
            }

            // 行数上限检查
            if (items.Count > MaxImportRows)
            {
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = 0,
                    Message = $"数据行数超出限制：文件包含 {items.Count} 行，最大允许 {MaxImportRows} 行"
                });
                return result;
            }

            result.TotalRows = items.Count;
            var seenCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            for (var i = 0; i < items.Count; i++)
            {
                var rowNumber = i + 1;
                var item = items[i];

                var deviceCode = GetJsonString(item, "device_code", "deviceCode")?.Trim();
                var name = GetJsonString(item, "name")?.Trim();
                var type = GetJsonString(item, "type")?.Trim();

                var rowErrors = ValidateRow(rowNumber, deviceCode, name, type, item.GetRawText(), seenCodes);

                var criticality = GetJsonString(item, "criticality")?.Trim();
                if (!string.IsNullOrWhiteSpace(criticality) && !ValidCriticalities.Contains(criticality))
                {
                    rowErrors.Add($"关键等级无效（应为 Critical/High/Normal/Low）: {criticality}");
                }

                var installDate = GetJsonString(item, "install_date", "installDate")?.Trim();
                if (!string.IsNullOrWhiteSpace(installDate) &&
                    !DateOnly.TryParseExact(installDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                {
                    rowErrors.Add($"安装日期格式错误（应为 yyyy-MM-dd）: {installDate}");
                }

                var costStr = GetJsonString(item, "downtime_cost_per_hour", "downtimeCostPerHour")?.Trim();
                if (!string.IsNullOrWhiteSpace(costStr) &&
                    (!decimal.TryParse(costStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedCost) || parsedCost < 0))
                {
                    rowErrors.Add($"停机成本格式错误或为负数: {costStr}");
                }

                if (rowErrors.Count > 0)
                {
                    foreach (var err in rowErrors)
                    {
                        result.Errors.Add(new ImportErrorItem
                        {
                            RowNumber = rowNumber,
                            Message = err,
                            RawContent = item.GetRawText()
                        });
                    }
                    continue;
                }

                seenCodes.Add(deviceCode!);
                result.ValidItems.Add(new DeviceImportPreviewItem
                {
                    RowNumber = rowNumber,
                    DeviceCode = deviceCode!,
                    Name = name!,
                    Type = type!,
                    Manufacturer = GetJsonString(item, "manufacturer")?.Trim(),
                    Model = GetJsonString(item, "model")?.Trim(),
                    SerialNumber = GetJsonString(item, "serial_number", "serialNumber")?.Trim(),
                    Location = GetJsonString(item, "location")?.Trim(),
                    GatewayId = GetJsonString(item, "gateway_id", "gatewayId")?.Trim(),
                    Criticality = criticality,
                    InstallDate = installDate,
                    DowntimeCostPerHour = !string.IsNullOrWhiteSpace(costStr)
                        ? decimal.Parse(costStr, NumberStyles.Any, CultureInfo.InvariantCulture)
                        : null,
                });
            }
        }
        catch (JsonException ex)
        {
            result.Errors.Add(new ImportErrorItem
            {
                RowNumber = 0,
                Message = $"JSON 解析失败: {ex.Message}"
            });
        }

        return result;
    }

    /// <summary>
    /// 校验必填字段的公共逻辑（CSV 和 JSON 共用）
    /// 收集所有校验错误而非在首个错误处返回，方便用户一次性修正
    /// </summary>
    private static List<string> ValidateRow(
        int rowNumber, string? deviceCode, string? name, string? type,
        string rawContent, HashSet<string> seenCodes)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(deviceCode))
            errors.Add("必填字段缺失 (device_code)");
        else if (deviceCode.Length > MaxDeviceCodeLength)
            errors.Add($"设备编码长度超出限制（最大 {MaxDeviceCodeLength} 字符）: {deviceCode}");

        if (string.IsNullOrWhiteSpace(name))
            errors.Add("必填字段缺失 (name)");
        else if (name.Length > MaxNameLength)
            errors.Add($"设备名称长度超出限制（最大 {MaxNameLength} 字符）");

        if (string.IsNullOrWhiteSpace(type))
            errors.Add("必填字段缺失 (type)");
        else if (type.Length > MaxTypeLength)
            errors.Add($"设备类型长度超出限制（最大 {MaxTypeLength} 字符）");

        // 编码去重（不区分大小写）
        if (!string.IsNullOrWhiteSpace(deviceCode) && !seenCodes.Contains(deviceCode.ToLowerInvariant()))
        {
            if (!seenCodes.Add(deviceCode.ToLowerInvariant()))
            {
                errors.Add($"文件内设备编码重复: {deviceCode}");
            }
        }
        else if (!string.IsNullOrWhiteSpace(deviceCode) && seenCodes.Contains(deviceCode.ToLowerInvariant()))
        {
            errors.Add($"文件内设备编码重复: {deviceCode}");
        }

        return errors;
    }

    /// <summary>
    /// 解析 CSV 单行 — 处理引号内的逗号和双引号转义
    /// </summary>
    private static List<string> ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var inQuotes = false;
        var current = new StringBuilder();

        for (var idx = 0; idx < line.Length; idx++)
        {
            var ch = line[idx];
            if (ch == '"')
            {
                // 双引号转义："" 表示一个字面的 "
                if (inQuotes && idx + 1 < line.Length && line[idx + 1] == '"')
                {
                    current.Append('"');
                    idx++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (ch == ',' && !inQuotes)
            {
                fields.Add(current.ToString().Trim());
                current.Clear();
            }
            else
            {
                current.Append(ch);
            }
        }

        fields.Add(current.ToString().Trim());
        return fields;
    }

    /// <summary>
    /// 根据 CSV 列名获取对应字段值
    /// </summary>
    private static string? GetFieldValue(List<string> fields, Dictionary<string, int> headerIndex, string columnName)
    {
        if (!headerIndex.TryGetValue(columnName, out var index) || index >= fields.Count)
            return null;
        return fields[index];
    }

    /// <summary>
    /// 从 JSON 元素中读取字符串值 — 支持多个候选字段名（兼容 snake_case 和 camelCase）
    /// </summary>
    private static string? GetJsonString(JsonElement element, params string[] fieldNames)
    {
        foreach (var name in fieldNames)
        {
            if (element.TryGetProperty(name, out var prop))
            {
                return prop.ValueKind == JsonValueKind.String ? prop.GetString() : prop.GetRawText();
            }
        }
        return null;
    }
}
