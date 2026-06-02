using System.Globalization;
using System.Text;
using System.Text.Json;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 知识规则导入导出服务
/// 支持 CSV 和 JSON 格式的批量导入，包含预览校验和错误报告
/// </summary>
public class KnowledgeImportService
{
    private readonly AppDbContext _dbContext;
    private readonly KnowledgeVersionService _versionService;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<KnowledgeImportService> _logger;

    /// <summary>CSV 必填列名</summary>
    private static readonly string[] CsvRequiredHeaders = ["device_type", "name", "conditions", "conclusion"];

    /// <summary>CSV 可选列名</summary>
    private static readonly string[] CsvOptionalHeaders = ["recommended_actions", "check_steps", "confidence_weight"];

    public KnowledgeImportService(
        AppDbContext dbContext,
        KnowledgeVersionService versionService,
        IAuditLogService auditLogService,
        ILogger<KnowledgeImportService> logger)
    {
        _dbContext = dbContext;
        _versionService = versionService;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// 预览导入文件 — 解析但不写入数据库，返回校验报告
    /// 自动检测 CSV 或 JSON 格式（基于文件扩展名或内容首字符）
    /// </summary>
    /// <param name="content">文件内容</param>
    /// <param name="fileName">文件名（用于格式检测）</param>
    /// <returns>校验报告（有效项 + 错误列表）</returns>
    public ImportPreviewResult PreviewImport(string content, string fileName)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("文件内容不能为空");

        // 优先根据文件扩展名判断，其次根据内容首字符
        var isJson = fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase)
                     || content.TrimStart().StartsWith('[')
                     || content.TrimStart().StartsWith('{');

        return isJson ? PreviewJson(content) : PreviewCsv(content);
    }

    /// <summary>
    /// 执行批量导入 — 将预览结果中的有效项写入数据库
    /// </summary>
    /// <param name="content">文件内容</param>
    /// <param name="fileName">文件名</param>
    /// <param name="tenantId">目标租户 ID</param>
    /// <param name="userId">操作人 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>导入结果（成功/跳过/失败数量）</returns>
    public async Task<ImportResult> ExecuteImportAsync(
        string content, string fileName, Guid tenantId, Guid userId, CancellationToken ct)
    {
        var preview = PreviewImport(content, fileName);
        var result = new ImportResult();

        foreach (var item in preview.ValidItems)
        {
            try
            {
                var rule = new KnowledgeRule
                {
                    TenantId = tenantId,
                    DeviceType = item.DeviceType,
                    Name = item.Name,
                    Conditions = item.Conditions,
                    Conclusion = item.Conclusion,
                    RecommendedActions = item.RecommendedActions,
                    CheckSteps = item.CheckSteps,
                    ConfidenceWeight = item.ConfidenceWeight,
                    Source = "imported",
                    CreatedBy = userId.ToString()
                };

                _dbContext.KnowledgeRules.Add(rule);
                result.Imported++;
            }
            catch (Exception ex)
            {
                result.Failed++;
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = item.RowNumber,
                    Message = $"导入失败: {ex.Message}"
                });
            }
        }

        // 预览中的错误项计入跳过
        result.Skipped = preview.ErrorCount;
        result.Errors.AddRange(preview.Errors);

        if (result.Imported > 0)
            await _dbContext.SaveChangesAsync(ct);

        // 记录审计日志
        await _auditLogService.LogFromContextAsync(
            "KnowledgeRulesImported", "KnowledgeRule", "",
            $"批量导入知识规则：成功 {result.Imported} 条，跳过 {result.Skipped} 条，失败 {result.Failed} 条", ct);

        _logger.LogInformation(
            "批量导入完成: Imported={Imported}, Skipped={Skipped}, Failed={Failed}",
            result.Imported, result.Skipped, result.Failed);

        return result;
    }

    /// <summary>
    /// 导出知识规则为 JSON 格式
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceType">设备类型过滤（可选，为 null 时导出全部）</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>格式化的 JSON 字符串</returns>
    public async Task<string> ExportAsJsonAsync(Guid tenantId, string? deviceType, CancellationToken ct)
    {
        var query = _dbContext.KnowledgeRules.AsQueryable();

        if (!string.IsNullOrWhiteSpace(deviceType))
            query = query.Where(r => r.DeviceType == deviceType);

        var rules = await query.Select(r => new
        {
            r.DeviceType,
            r.Name,
            r.Conditions,
            r.Conclusion,
            r.RecommendedActions,
            r.CheckSteps,
            r.ConfidenceWeight
        }).ToListAsync(ct);

        return JsonSerializer.Serialize(rules, new JsonSerializerOptions
        {
            WriteIndented = true,
            // 使用中文友好的编码器，避免中文被转义为 \uXXXX
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        });
    }

    /// <summary>
    /// 导出知识规则为 CSV 格式
    /// </summary>
    /// <param name="tenantId">租户 ID</param>
    /// <param name="deviceType">设备类型过滤（可选）</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>CSV 格式字符串（含表头）</returns>
    public async Task<string> ExportAsCsvAsync(Guid tenantId, string? deviceType, CancellationToken ct)
    {
        var query = _dbContext.KnowledgeRules.AsQueryable();

        if (!string.IsNullOrWhiteSpace(deviceType))
            query = query.Where(r => r.DeviceType == deviceType);

        var rules = await query.ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("device_type,name,conditions,conclusion,recommended_actions,check_steps,confidence_weight");

        foreach (var r in rules)
        {
            sb.AppendLine(string.Join(',',
                EscapeCsvField(r.DeviceType),
                EscapeCsvField(r.Name),
                EscapeCsvField(r.Conditions),
                EscapeCsvField(r.Conclusion),
                EscapeCsvField(r.RecommendedActions ?? ""),
                EscapeCsvField(r.CheckSteps ?? ""),
                r.ConfidenceWeight.ToString(CultureInfo.InvariantCulture)
            ));
        }

        return sb.ToString();
    }

    /// <summary>
    /// 一键导入行业预置规则 — 从系统租户读取预置规则复制到当前租户
    /// 跳过当前租户已存在的同名规则
    /// </summary>
    /// <param name="tenantId">目标租户 ID</param>
    /// <param name="userId">操作人 ID</param>
    /// <param name="ct">取消令牌</param>
    /// <returns>导入结果</returns>
    public async Task<ImportResult> ImportIndustryPresetAsync(
        Guid tenantId, Guid userId, CancellationToken ct)
    {
        // 系统租户 ID — 行业预置规则归属系统租户
        var systemTenantId = Guid.Empty;

        // 从系统租户读取预置规则（需绕过全局租户过滤器）
        var presetRules = await _dbContext.KnowledgeRules
            .IgnoreQueryFilters()
            .Where(r => r.TenantId == systemTenantId)
            .ToListAsync(ct);

        // 获取当前租户已有的规则名称集合，用于去重
        var existingNames = (await _dbContext.KnowledgeRules
            .Where(r => r.TenantId == tenantId)
            .Select(r => r.Name)
            .ToListAsync(ct))
            .ToHashSet();

        var result = new ImportResult();

        foreach (var preset in presetRules)
        {
            if (existingNames.Contains(preset.Name))
            {
                result.Skipped++;
                continue;
            }

            var rule = new KnowledgeRule
            {
                TenantId = tenantId,
                DeviceType = preset.DeviceType,
                Name = preset.Name,
                Conditions = preset.Conditions,
                Conclusion = preset.Conclusion,
                RecommendedActions = preset.RecommendedActions,
                CheckSteps = preset.CheckSteps,
                ConfidenceWeight = preset.ConfidenceWeight,
                Source = "imported",
                CreatedBy = userId.ToString()
            };

            _dbContext.KnowledgeRules.Add(rule);
            result.Imported++;
        }

        if (result.Imported > 0)
            await _dbContext.SaveChangesAsync(ct);

        _logger.LogInformation(
            "行业预置导入: Tenant={TenantId}, Imported={Imported}, Skipped={Skipped}",
            tenantId, result.Imported, result.Skipped);

        return result;
    }

    // ========================================================================
    // 私有方法：CSV / JSON 解析与校验
    // ========================================================================

    /// <summary>
    /// 解析 CSV 内容并生成预览报告
    /// </summary>
    private static ImportPreviewResult PreviewCsv(string content)
    {
        var result = new ImportPreviewResult();
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        if (lines.Length == 0)
        {
            result.Errors.Add(new ImportErrorItem { RowNumber = 0, Message = "CSV 文件为空" });
            return result;
        }

        // 解析表头行，建立列名到列索引的映射
        var headers = ParseCsvLine(lines[0])
            .Select(h => h.Trim().ToLowerInvariant())
            .ToArray();

        var headerIndex = new Dictionary<string, int>();
        for (var i = 0; i < headers.Length; i++)
            headerIndex[headers[i]] = i;

        // 校验必填列是否存在
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

        // 逐行解析数据
        for (var i = 1; i < lines.Length; i++)
        {
            var rowNumber = i + 1;
            var fields = ParseCsvLine(lines[i]);

            var deviceType = GetFieldValue(fields, headerIndex, "device_type");
            var name = GetFieldValue(fields, headerIndex, "name");
            var conditions = GetFieldValue(fields, headerIndex, "conditions") ?? "[]";
            var conclusion = GetFieldValue(fields, headerIndex, "conclusion");

            // 校验必填字段
            if (string.IsNullOrWhiteSpace(deviceType) || string.IsNullOrWhiteSpace(name))
            {
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = rowNumber,
                    Message = "必填字段缺失 (device_type, name)",
                    RawContent = lines[i].Trim()
                });
                continue;
            }

            if (string.IsNullOrWhiteSpace(conclusion))
            {
                result.Errors.Add(new ImportErrorItem
                {
                    RowNumber = rowNumber,
                    Message = "必填字段缺失 (conclusion)",
                    RawContent = lines[i].Trim()
                });
                continue;
            }

            // 校验 confidence_weight 范围
            var confidenceWeightStr = GetFieldValue(fields, headerIndex, "confidence_weight");
            var confidenceWeight = 0.5m;
            if (!string.IsNullOrWhiteSpace(confidenceWeightStr))
            {
                if (!decimal.TryParse(confidenceWeightStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var cw)
                    || cw < 0 || cw > 1)
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = rowNumber,
                        Message = $"confidence_weight 格式错误或超出范围 [0,1]: {confidenceWeightStr}",
                        RawContent = lines[i].Trim()
                    });
                    continue;
                }
                confidenceWeight = cw;
            }

            result.ValidItems.Add(new ImportPreviewItem
            {
                RowNumber = rowNumber,
                DeviceType = deviceType,
                Name = name,
                Conditions = conditions,
                Conclusion = conclusion,
                RecommendedActions = GetFieldValue(fields, headerIndex, "recommended_actions"),
                CheckSteps = GetFieldValue(fields, headerIndex, "check_steps"),
                ConfidenceWeight = confidenceWeight
            });
        }

        return result;
    }

    /// <summary>
    /// 解析 JSON 内容并生成预览报告
    /// 兼容 snake_case 和 camelCase 字段名
    /// </summary>
    private static ImportPreviewResult PreviewJson(string content)
    {
        var result = new ImportPreviewResult();

        try
        {
            var items = JsonSerializer.Deserialize<List<JsonElement>>(content);
            if (items is null || items.Count == 0)
            {
                result.Errors.Add(new ImportErrorItem { RowNumber = 0, Message = "JSON 数组为空" });
                return result;
            }

            result.TotalRows = items.Count;

            for (var i = 0; i < items.Count; i++)
            {
                var rowNumber = i + 1;
                var item = items[i];

                // 同时兼容 snake_case 和 camelCase
                var deviceType = GetJsonString(item, "device_type", "deviceType");
                var name = GetJsonString(item, "name");
                var conditions = GetJsonString(item, "conditions") ?? "[]";
                var conclusion = GetJsonString(item, "conclusion");

                if (string.IsNullOrWhiteSpace(deviceType) || string.IsNullOrWhiteSpace(name))
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = rowNumber,
                        Message = "必填字段缺失 (deviceType/device_type, name)",
                        RawContent = item.GetRawText()
                    });
                    continue;
                }

                if (string.IsNullOrWhiteSpace(conclusion))
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = rowNumber,
                        Message = "必填字段缺失 (conclusion)",
                        RawContent = item.GetRawText()
                    });
                    continue;
                }

                // 校验 confidence_weight 范围
                var confidenceWeight = 0.5m;
                var cwStr = GetJsonString(item, "confidence_weight", "confidenceWeight");
                if (!string.IsNullOrWhiteSpace(cwStr) &&
                    (!decimal.TryParse(cwStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var cw) || cw < 0 || cw > 1))
                {
                    result.Errors.Add(new ImportErrorItem
                    {
                        RowNumber = rowNumber,
                        Message = $"confidenceWeight 格式错误或超出范围 [0,1]: {cwStr}",
                        RawContent = item.GetRawText()
                    });
                    continue;
                }
                else if (!string.IsNullOrWhiteSpace(cwStr))
                {
                    confidenceWeight = decimal.Parse(cwStr, NumberStyles.Any, CultureInfo.InvariantCulture);
                }

                result.ValidItems.Add(new ImportPreviewItem
                {
                    RowNumber = rowNumber,
                    DeviceType = deviceType,
                    Name = name,
                    Conditions = conditions,
                    Conclusion = conclusion!,
                    RecommendedActions = GetJsonString(item, "recommended_actions", "recommendedActions"),
                    CheckSteps = GetJsonString(item, "check_steps", "checkSteps"),
                    ConfidenceWeight = confidenceWeight
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
    /// 解析 CSV 单行 — 处理引号内的逗号
    /// </summary>
    private static List<string> ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var inQuotes = false;
        var current = new StringBuilder();

        foreach (var ch in line)
        {
            if (ch == '"')
            {
                inQuotes = !inQuotes;
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

    /// <summary>
    /// CSV 字段转义 — 包含逗号、引号或换行时用双引号包裹
    /// </summary>
    private static string EscapeCsvField(string field)
    {
        if (string.IsNullOrEmpty(field))
            return "";

        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
            return $"\"{field.Replace("\"", "\"\"")}\"";

        return field;
    }
}
