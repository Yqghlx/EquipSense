using EquipAI.Core.Constants;
using EquipAI.Core.Entities;
using EquipAI.Core.Enums;
using EquipAI.Core.Exceptions;
using EquipAI.Core.Interfaces;
using EquipAI.Application.Services;
using EquipAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

namespace EquipAI.Application.Devices;

/// <summary>
/// 设备配置向导服务。
/// 封装模板查询和快速注册设备（含默认告警规则），使 Controller 不直接依赖 <c>AppDbContext</c>。
/// </summary>
/// <remarks>
/// 租户身份以 <c>ITenantContext</c>（JWT 权威）为准，禁止信任请求体里的 TenantId——
/// 历史缺陷曾用 request.TenantId 导致跨租户注入。
/// </remarks>
public class DeviceConfigService
{
    private const int DefaultCooldownSeconds = 300;

    private static readonly HashSet<string> SupportedOperators = new(StringComparer.OrdinalIgnoreCase)
    {
        ">",
        ">=",
        "<",
        "<=",
        "==",
        "gt",
        "gte",
        "lt",
        "lte",
        "eq"
    };

    private readonly AppDbContext _dbContext;
    private readonly ITenantContext _tenantContext;

    public DeviceConfigService(AppDbContext dbContext, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// 获取设备类型模板列表，支持按行业筛选。
    /// </summary>
    public async Task<List<object>> ListTemplatesAsync(string? industry = null, CancellationToken ct = default)
    {
        var query = _dbContext.UnfilteredSet<DeviceTypeTemplate>()
            .Where(t => t.TenantId == _tenantContext.TenantId
                     || t.TenantId == SystemConstants.SystemTenantId);
        if (!string.IsNullOrEmpty(industry))
            query = query.Where(t => t.Industry == industry);

        return await query
            .OrderByDescending(t => t.TenantId == _tenantContext.TenantId)
            .ThenBy(t => t.Name)
            .Select(t => (object)new { t.Id, t.TenantId, t.Name, t.Industry, t.Parameters, t.DefaultAlarmRules })
            .ToListAsync(ct);
    }

    /// <summary>
    /// 快速注册设备（向导模式），同时可创建默认告警规则。
    /// </summary>
    /// <returns>(DeviceId, DeviceCode, Name, Type, DuplicateCode) —— DuplicateCode=true 表示编码已存在。</returns>
    public async Task<(Guid DeviceId, string DeviceCode, string Name, string Type, bool DuplicateCode)> QuickRegisterAsync(
        QuickRegisterRequest request, CancellationToken ct = default)
    {
        var tenantId = _tenantContext.TenantId;
        ValidateRequest(request);
        // 在执行策略重试中复用同一个设备 ID：若事务提交结果不明确但实际已提交，
        // 重试可以识别同一设备并返回成功，避免重复创建设备或再次增加租户计数。
        var deviceId = Guid.NewGuid();

        try
        {
            // 生产数据库启用了瞬时故障重试时，显式事务必须由执行策略整体包装，
            // 否则连接重试可能只重放部分写入，破坏设备、规则和租户计数的一致性。
            var executionStrategy = _dbContext.Database.CreateExecutionStrategy();
            return await executionStrategy.ExecuteAsync(async () =>
            {
                // 事务回滚后 EF 仍可能保留 Added/Modified 状态；每次重试前必须清理，
                // 否则上一次尝试的实体会和本次查询结果一起被再次提交。
                DetachPendingChanges();

                if (!_dbContext.Database.IsRelational())
                    return await RegisterCoreAsync(request, tenantId, deviceId, ct);

                await using var transaction = await _dbContext.Database.BeginTransactionAsync(ct);
                try
                {
                    var result = await RegisterCoreAsync(request, tenantId, deviceId, ct);
                    await transaction.CommitAsync(ct);
                    return result;
                }
                catch
                {
                    await transaction.RollbackAsync(ct);
                    DetachPendingChanges();
                    throw;
                }
            });
        }
        catch (DbUpdateException exception) when (IsDeviceCodeUniqueViolation(exception))
        {
            // 先查后写只能改善提示，无法消除并发窗口；唯一索引是最终一致性边界。
            // 清理当前请求上下文中的暂存实体，避免调用方复用 DbContext 时重复提交半成品。
            DetachPendingChanges();
            throw new DeviceConfigException(
                "DUPLICATE_CODE",
                $"设备编码 {request.DeviceCode} 已存在。",
                exception);
        }
    }

    /// <summary>
    /// 在当前事务中完成模板读取、设备和告警规则构建以及租户计数更新。
    /// </summary>
    private async Task<(Guid DeviceId, string DeviceCode, string Name, string Type, bool DuplicateCode)> RegisterCoreAsync(
        QuickRegisterRequest request,
        Guid tenantId,
        Guid deviceId,
        CancellationToken ct)
    {
        // 先做当前租户范围的快速检查，提供稳定的业务错误和较短的失败路径。
        var existingDevice = await _dbContext.Devices
            .SingleOrDefaultAsync(d => d.DeviceCode == request.DeviceCode, ct);
        if (existingDevice is not null)
        {
            // 只有当前请求在一次未知提交结果后的重试才可能命中同一个新 ID；
            // 其他同编码设备仍按租户内唯一约束返回冲突。
            if (existingDevice.Id == deviceId)
            {
                return (existingDevice.Id, existingDevice.DeviceCode, existingDevice.Name, existingDevice.Type, false);
            }

            return (Guid.Empty, request.DeviceCode, string.Empty, string.Empty, true);
        }

        DeviceTypeTemplate? template = null;
        IReadOnlyList<TemplateAlarmRuleDefinition> templateRules = [];
        if (request.TemplateId is Guid templateId)
        {
            // 系统模板是跨租户共享配置，租户模板只能由其所属租户使用。
            template = await _dbContext.UnfilteredSet<DeviceTypeTemplate>()
                .Where(t => t.Id == templateId
                    && (t.TenantId == tenantId || t.TenantId == SystemConstants.SystemTenantId))
                .SingleOrDefaultAsync(ct);
            if (template is null)
            {
                throw new DeviceConfigException(
                    "TEMPLATE_NOT_FOUND",
                    "设备类型模板不存在或当前租户不可见。");
            }

            // 只在用户明确启用推荐告警时解析模板规则，避免未确认的规则阻断基础设备建档。
            if (request.ApplyDefaultAlarmRules)
                templateRules = DeviceTemplateAlarmRuleParser.Parse(template.DefaultAlarmRules);
        }

        var deviceName = string.IsNullOrWhiteSpace(request.Name)
            ? request.DeviceCode
            : request.Name.Trim();
        var deviceType = template?.Name ?? (string.IsNullOrWhiteSpace(request.DeviceType)
            ? "通用设备"
            : request.DeviceType.Trim());

        var device = new Device
        {
            Id = deviceId,
            TenantId = tenantId,
            DeviceCode = request.DeviceCode,
            Name = deviceName,
            Type = deviceType,
            TypeTemplateId = template?.Id,
            Status = DeviceStatus.Offline,
            HealthScore = 100m
        };
        _dbContext.Devices.Add(device);

        if (request.TemplateId is not null && request.ApplyDefaultAlarmRules)
        {
            foreach (var rule in templateRules)
            {
                _dbContext.AlertRules.Add(CreateAlertRule(tenantId, device.Id, rule));
            }
        }
        else if (request.TemplateId is null && request.DefaultAlertRules is { Count: > 0 })
        {
            foreach (var rule in request.DefaultAlertRules)
            {
                ValidateLegacyRule(rule);
                _dbContext.AlertRules.Add(CreateAlertRule(tenantId, device.Id, device.Name, rule));
            }
        }

        // 计数更新与设备、告警规则共享同一个事务。关系型数据库使用原子递增，
        // 避免两个并发注册请求读到同一个旧值后发生丢失更新；事务回滚时该更新也会回滚。
        if (_dbContext.Database.IsRelational())
        {
            var affected = await TenantQuotaSql.TryReserveDeviceSlotsAsync(
                _dbContext, tenantId, 1, ct);
            if (affected == 0)
            {
                var tenantExists = await _dbContext.UnfilteredSet<Tenant>()
                    .AnyAsync(t => t.Id == tenantId, ct);
                throw tenantExists
                    ? new DeviceConfigException("QUOTA_EXCEEDED", "已超出设备配额，请升级计划。")
                    : new DeviceConfigException("TENANT_NOT_FOUND", "当前租户不存在，无法注册设备。");
            }
        }
        else
        {
            var tenant = await _dbContext.UnfilteredSet<Tenant>()
                .SingleOrDefaultAsync(t => t.Id == tenantId, ct);
            if (tenant is null)
                throw new DeviceConfigException("TENANT_NOT_FOUND", "当前租户不存在，无法注册设备。");

            if (tenant.MaxDevices > 0 && tenant.CurrentDeviceCount >= tenant.MaxDevices)
                throw new DeviceConfigException("QUOTA_EXCEEDED", "已超出设备配额，请升级计划。");

            tenant.CurrentDeviceCount++;
        }

        await _dbContext.SaveChangesAsync(ct);

        return (device.Id, device.DeviceCode, device.Name, device.Type, false);
    }

    /// <summary>
    /// 将模板规则定义映射为告警实体，字段逐项保留，避免模板语义在接入时丢失。
    /// </summary>
    private static AlertRule CreateAlertRule(Guid tenantId, Guid deviceId, TemplateAlarmRuleDefinition definition)
        => new()
        {
            TenantId = tenantId,
            DeviceId = deviceId,
            Name = definition.Name,
            Metric = definition.Metric,
            RuleType = definition.RuleType,
            Operator = definition.Operator,
            Threshold = definition.Threshold,
            Severity = definition.Severity,
            CooldownSeconds = definition.CooldownSeconds,
            Enabled = definition.Enabled,
            AutoCreateWorkorder = definition.AutoCreateWorkorder
        };

    /// <summary>
    /// 将旧客户端提交的规则映射为告警实体，同时补齐新字段的安全默认值。
    /// </summary>
    private static AlertRule CreateAlertRule(Guid tenantId, Guid deviceId, string deviceName, DefaultAlertRuleRequest request)
    {
        var metric = request.Metric.Trim();
        var name = string.IsNullOrWhiteSpace(request.Name)
            ? $"{deviceName} - {metric} 告警"
            : request.Name.Trim();

        return new AlertRule
        {
            TenantId = tenantId,
            DeviceId = deviceId,
            Name = name,
            Metric = metric,
            RuleType = RuleType.Threshold,
            Operator = NormalizeOperator(request.Operator),
            Threshold = request.Threshold,
            Severity = request.Severity ?? AlertSeverity.Normal,
            CooldownSeconds = request.CooldownSeconds ?? DefaultCooldownSeconds,
            Enabled = request.Enabled ?? true,
            AutoCreateWorkorder = request.AutoCreateWorkorder ?? false
        };
    }

    /// <summary>
    /// 校验快速注册基础字段，尽早阻止数据库长度异常和空编码设备。
    /// </summary>
    private static void ValidateRequest(QuickRegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceCode))
            throw new DeviceConfigException("INVALID_DEVICE_CODE", "设备编码不能为空。");
        if (request.DeviceCode.Trim().Length > 50)
            throw new DeviceConfigException("INVALID_DEVICE_CODE", "设备编码长度不能超过 50 个字符。");
        if (request.Name?.Trim().Length > 100)
            throw new DeviceConfigException("INVALID_DEVICE_NAME", "设备名称长度不能超过 100 个字符。");
        if (request.DeviceType?.Trim().Length > 50)
            throw new DeviceConfigException("INVALID_DEVICE_TYPE", "设备类型长度不能超过 50 个字符。");
    }

    /// <summary>
    /// 校验无模板兼容路径中的客户端规则，避免把无效操作符写入可执行规则表。
    /// </summary>
    private static void ValidateLegacyRule(DefaultAlertRuleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Metric) || request.Metric.Trim().Length > 100)
            throw new DeviceConfigException("INVALID_ALERT_RULE", "告警规则指标不能为空且长度不能超过 100 个字符。");
        if (!SupportedOperators.Contains(NormalizeOperator(request.Operator)))
            throw new DeviceConfigException("INVALID_ALERT_RULE", "告警规则操作符不受支持。");
        if (request.Name?.Trim().Length > 200)
            throw new DeviceConfigException("INVALID_ALERT_RULE", "告警规则名称长度不能超过 200 个字符。");
        if (request.CooldownSeconds is < 0)
            throw new DeviceConfigException("INVALID_ALERT_RULE", "告警规则冷却时间不能为负数。");
        if (request.Severity is AlertSeverity severity && !Enum.IsDefined(severity))
            throw new DeviceConfigException("INVALID_ALERT_RULE", "告警规则严重级别无效。");
    }

    /// <summary>
    /// 统一操作符文本大小写，保留阈值评估器支持的符号语义。
    /// </summary>
    private static string NormalizeOperator(string? value)
        => string.IsNullOrWhiteSpace(value) ? ">" : value.Trim().ToLowerInvariant();

    /// <summary>
    /// 判断数据库异常是否由设备租户内唯一编码约束引起。
    /// </summary>
    internal static bool IsDeviceCodeUniqueViolation(DbUpdateException exception)
        => DatabaseConstraintDetector.IsDeviceCodeUniqueViolation(exception);

    /// <summary>
    /// 唯一约束失败回滚后清理当前上下文中尚未落库的变更。
    /// </summary>
    private void DetachPendingChanges()
    {
        foreach (var entry in _dbContext.ChangeTracker.Entries()
                     .Where(entry => entry.State is EntityState.Added or EntityState.Modified)
                     .ToList())
        {
            entry.State = EntityState.Detached;
        }
    }
}

/// <summary>
/// 设备快速注册业务异常，携带稳定错误码供 HTTP 层映射。
/// </summary>
public sealed class DeviceConfigException : InvalidOperationException
{
    /// <summary>
    /// 业务错误码。
    /// </summary>
    public string Code { get; }

    /// <summary>
    /// 初始化设备配置业务异常。
    /// </summary>
    /// <param name="code">稳定业务错误码。</param>
    /// <param name="message">面向客户端的安全提示，不包含数据库异常详情。</param>
    /// <param name="innerException">底层异常，仅供服务端诊断。</param>
    public DeviceConfigException(string code, string message, Exception? innerException = null)
        : base(message, innerException)
    {
        Code = code;
    }
}

/// <summary>
/// 快速注册设备请求。
/// </summary>
public record QuickRegisterRequest
{
    /// <summary>所属租户 ID（已忽略——以 JWT 为权威）</summary>
    public Guid TenantId { get; init; }

    /// <summary>设备类型模板 ID（可选，模板必须属于当前租户或系统租户）</summary>
    public Guid? TemplateId { get; init; }

    /// <summary>是否应用模板中的推荐告警规则，默认关闭</summary>
    public bool ApplyDefaultAlarmRules { get; init; }

    /// <summary>设备编码（租户内唯一）</summary>
    public string DeviceCode { get; init; } = string.Empty;

    /// <summary>设备名称（可选，默认使用设备编码）</summary>
    public string? Name { get; init; }

    /// <summary>设备类型（无模板时可选，默认“通用设备”）</summary>
    public string? DeviceType { get; init; }

    /// <summary>无模板兼容路径的默认告警规则列表（可选）</summary>
    public List<DefaultAlertRuleRequest>? DefaultAlertRules { get; init; }
}

/// <summary>
/// 无模板兼容路径的默认告警规则请求。
/// </summary>
public record DefaultAlertRuleRequest
{
    /// <summary>规则名称（可选，缺省时由设备名称和指标生成）</summary>
    public string? Name { get; init; }

    /// <summary>监控指标名称（如 temperature、vibration）</summary>
    public string Metric { get; init; } = string.Empty;

    /// <summary>比较操作符（如 &gt;、lt），缺省为 &gt;</summary>
    public string? Operator { get; init; }

    /// <summary>告警阈值</summary>
    public decimal Threshold { get; init; }

    /// <summary>告警严重级别（可选，默认 Normal）</summary>
    public AlertSeverity? Severity { get; init; }

    /// <summary>冷却时间（秒，可选，默认 300）</summary>
    public int? CooldownSeconds { get; init; }

    /// <summary>是否启用规则（可选，默认 true）</summary>
    public bool? Enabled { get; init; }

    /// <summary>是否自动创建工单（可选，默认 false）</summary>
    public bool? AutoCreateWorkorder { get; init; }
}
