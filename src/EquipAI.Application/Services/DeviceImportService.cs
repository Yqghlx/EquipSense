using EquipAI.Application.DTOs.Devices;
using EquipAI.Application.Knowledge.DTOs;
using EquipAI.Core.Entities;
using EquipAI.Core.Interfaces;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EquipAI.Application.Services;

/// <summary>
/// 设备批量导入服务
/// 支持 CSV 和 JSON 格式的设备清单批量导入，包含预览校验和错误报告
///
/// 实现按职责拆分为 4 个 partial 文件（原 678 行单文件 → 每文件单一关注点）：
///   - DeviceImportService.cs          本文件：公共 API（PreviewImport / ExecuteImportAsync / 模板）
///   - DeviceImportService.Persist.cs  持久化：事务内配额检查 + 去重 + 批量写入 + 计数修正
///   - DeviceImportService.Parsing.cs  解析：CSV/JSON 解析、字段提取、行组装
///   - DeviceImportService.Validation.cs 校验：行级校验、字段格式校验、location 规范化、枚举/日期解析
/// </summary>
public sealed partial class DeviceImportService
{
    private readonly AppDbContext _dbContext;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<DeviceImportService> _logger;

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
        // ⚠️ 由于 DbContext 配置了 EnableRetryOnFailure（NpgsqlRetryingExecutionStrategy），
        // 不能直接调 BeginTransactionAsync — 必须用 CreateExecutionStrategy().ExecuteAsync 包装整个事务体。
        // 详见 https://learn.microsoft.com/ef/core/miscellaneous/connection-resiliency
        var executionStrategy = _dbContext.Database.CreateExecutionStrategy();

        await executionStrategy.ExecuteAsync(async () =>
        {
            // 执行策略重试时，上一轮回滚留下的跟踪实体和结果计数都必须清理，
            // 否则同一批设备可能被重复加入，返回的 Imported/Skipped 也会被累加。
            _dbContext.ChangeTracker.Clear();
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);
            try
            {
                await ExecuteImportInTransactionAsync(preview, result, tenantId, ct);
                await transaction.CommitAsync(ct);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(ct);
                _dbContext.ChangeTracker.Clear();
                throw;
            }
        });

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
}
