using System.Globalization;
using System.Text;
using System.Text.Json;
using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Knowledge.DTOs;

namespace EquipAI.Application.Services;

/// <summary>
/// 设备导入解析逻辑（partial）
/// 职责：CSV/JSON 内容解析、字段提取（兼容 snake_case/camelCase）、行组装为 DeviceImportPreviewItem
/// </summary>
public sealed partial class DeviceImportService
{
    /// <summary>CSV 必填列名</summary>
    private static readonly string[] CsvRequiredHeaders = ["device_code", "name", "type"];

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
