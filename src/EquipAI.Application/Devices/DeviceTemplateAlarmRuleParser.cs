using System.Text.Json;
using EquipAI.Core.Enums;

namespace EquipAI.Application.Devices;

/// <summary>
/// 模板默认告警规则解析结果。
/// </summary>
public sealed class TemplateAlarmRuleDefinition
{
    /// <summary>
    /// 告警规则名称。
    /// </summary>
    public string Name { get; init; } = string.Empty;

    /// <summary>
    /// 监控指标名称。
    /// </summary>
    public string Metric { get; init; } = string.Empty;

    /// <summary>
    /// 告警规则类型。
    /// </summary>
    public RuleType RuleType { get; init; }

    /// <summary>
    /// 阈值比较操作符，保留评估器支持的符号或文本形式。
    /// </summary>
    public string Operator { get; init; } = string.Empty;

    /// <summary>
    /// 触发告警的数值阈值。
    /// </summary>
    public decimal Threshold { get; init; }

    /// <summary>
    /// 告警严重级别。
    /// </summary>
    public AlertSeverity Severity { get; init; }

    /// <summary>
    /// 同一规则的冷却时间（秒）。
    /// </summary>
    public int CooldownSeconds { get; init; }

    /// <summary>
    /// 是否启用规则。
    /// </summary>
    public bool Enabled { get; init; }

    /// <summary>
    /// 是否自动创建工单。
    /// </summary>
    public bool AutoCreateWorkorder { get; init; }
}

/// <summary>
/// 模板默认告警规则校验失败异常。
/// </summary>
public sealed class DeviceTemplateRulesException : InvalidOperationException
{
    /// <summary>
    /// 对外返回的稳定错误码。
    /// </summary>
    public const string ErrorCode = "TEMPLATE_RULES_INVALID";

    /// <summary>
    /// 获取稳定错误码。
    /// </summary>
    public string Code => ErrorCode;

    /// <summary>
    /// 初始化模板规则异常。
    /// </summary>
    /// <param name="message">不包含原始 JSON 的安全错误信息。</param>
    /// <param name="innerException">底层解析异常。</param>
    public DeviceTemplateRulesException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}

/// <summary>
/// 严格解析设备类型模板中的默认阈值告警规则。
/// </summary>
public static class DeviceTemplateAlarmRuleParser
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

    /// <summary>
    /// 将模板默认告警规则 JSON 解析为可持久化的规则定义。
    /// </summary>
    /// <param name="json">模板中的默认告警规则 JSON 数组。</param>
    /// <returns>经过严格校验的只读规则集合。</returns>
    /// <exception cref="DeviceTemplateRulesException">JSON、字段或规则语义无效时抛出。</exception>
    public static IReadOnlyList<TemplateAlarmRuleDefinition> Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            throw Invalid("默认告警规则不能为空。");

        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
                throw Invalid("默认告警规则必须是 JSON 数组。");

            var definitions = new List<TemplateAlarmRuleDefinition>();
            var index = 0;
            foreach (var element in document.RootElement.EnumerateArray())
            {
                definitions.Add(ParseElement(element, index));
                index++;
            }

            return definitions.AsReadOnly();
        }
        catch (DeviceTemplateRulesException)
        {
            throw;
        }
        catch (JsonException exception)
        {
            // 异常消息不回显原始 JSON，避免模板内容进入 API 错误或日志链路。
            throw new DeviceTemplateRulesException("默认告警规则 JSON 格式无效。", exception);
        }
    }

    /// <summary>
    /// 解析单条模板告警规则并校验其与阈值评估器的契约。
    /// </summary>
    private static TemplateAlarmRuleDefinition ParseElement(JsonElement element, int index)
    {
        if (element.ValueKind != JsonValueKind.Object)
            throw Invalid($"第 {index + 1} 条默认告警规则必须是对象。");

        var ruleTypeText = GetRequiredString(element, "ruleType", index);
        if (!Enum.TryParse<RuleType>(ruleTypeText, ignoreCase: true, out var ruleType)
            || ruleType != RuleType.Threshold)
        {
            throw Invalid($"第 {index + 1} 条默认告警规则的类型不受支持。");
        }

        var name = GetRequiredString(element, "name", index);
        var metric = GetRequiredString(element, "metric", index);
        if (name.Length > 200 || metric.Length > 100)
            throw Invalid($"第 {index + 1} 条默认告警规则的文本字段超出长度限制。");

        var operatorText = GetRequiredString(element, "operator", index).ToLowerInvariant();
        if (!SupportedOperators.Contains(operatorText))
            throw Invalid($"第 {index + 1} 条默认告警规则的操作符不受支持。");

        var threshold = GetRequiredDecimal(element, "threshold", index);
        if (threshold < -99999999999999.9999m || threshold > 99999999999999.9999m
            || decimal.Round(threshold, 4) != threshold)
        {
            throw Invalid($"第 {index + 1} 条默认告警规则的阈值超出数据库精度范围。");
        }
        var severity = GetOptionalEnum(element, "severity", AlertSeverity.Normal, index);
        var cooldownSeconds = GetOptionalInt32(element, "cooldownSeconds", DefaultCooldownSeconds, index);
        if (cooldownSeconds < 0)
            throw Invalid($"第 {index + 1} 条默认告警规则的冷却时间不能为负数。");

        var enabled = GetOptionalBoolean(element, "enabled", defaultValue: true, index);
        var autoCreateWorkorder = GetOptionalBoolean(element, "autoCreateWorkorder", defaultValue: false, index);

        return new TemplateAlarmRuleDefinition
        {
            Name = name,
            Metric = metric,
            RuleType = ruleType,
            Operator = operatorText,
            Threshold = threshold,
            Severity = severity,
            CooldownSeconds = cooldownSeconds,
            Enabled = enabled,
            AutoCreateWorkorder = autoCreateWorkorder
        };
    }

    /// <summary>
    /// 读取必填字符串字段，并统一拒绝空字符串和错误 JSON 类型。
    /// </summary>
    private static string GetRequiredString(JsonElement element, string propertyName, int index)
    {
        if (!TryGetProperty(element, propertyName, out var property)
            || property.ValueKind != JsonValueKind.String)
        {
            throw Invalid($"第 {index + 1} 条默认告警规则缺少有效的 {propertyName}。");
        }

        var value = property.GetString()?.Trim();
        if (string.IsNullOrWhiteSpace(value))
            throw Invalid($"第 {index + 1} 条默认告警规则的 {propertyName} 不能为空。");

        return value;
    }

    /// <summary>
    /// 读取必填 decimal 字段，避免字符串或超范围数字被隐式接受。
    /// </summary>
    private static decimal GetRequiredDecimal(JsonElement element, string propertyName, int index)
    {
        if (!TryGetProperty(element, propertyName, out var property)
            || property.ValueKind != JsonValueKind.Number
            || !property.TryGetDecimal(out var value))
        {
            throw Invalid($"第 {index + 1} 条默认告警规则缺少有效的 {propertyName}。");
        }

        return value;
    }

    /// <summary>
    /// 读取可选枚举字段，并在出现未知值时拒绝整组模板规则。
    /// </summary>
    private static TEnum GetOptionalEnum<TEnum>(JsonElement element, string propertyName, TEnum defaultValue, int index)
        where TEnum : struct, Enum
    {
        if (!TryGetProperty(element, propertyName, out var property))
            return defaultValue;

        if (property.ValueKind != JsonValueKind.String
            || !Enum.TryParse<TEnum>(property.GetString(), ignoreCase: true, out var value)
            || !Enum.IsDefined(value))
        {
            throw Invalid($"第 {index + 1} 条默认告警规则的 {propertyName} 无效。");
        }

        return value;
    }

    /// <summary>
    /// 读取可选整数，并拒绝浮点数、字符串和超出 Int32 范围的值。
    /// </summary>
    private static int GetOptionalInt32(JsonElement element, string propertyName, int defaultValue, int index)
    {
        if (!TryGetProperty(element, propertyName, out var property))
            return defaultValue;

        if (property.ValueKind != JsonValueKind.Number || !property.TryGetInt32(out var value))
            throw Invalid($"第 {index + 1} 条默认告警规则的 {propertyName} 无效。");

        return value;
    }

    /// <summary>
    /// 读取可选布尔字段，并拒绝用数字或字符串冒充布尔值。
    /// </summary>
    private static bool GetOptionalBoolean(JsonElement element, string propertyName, bool defaultValue, int index)
    {
        if (!TryGetProperty(element, propertyName, out var property))
            return defaultValue;

        if (property.ValueKind == JsonValueKind.True)
            return true;
        if (property.ValueKind == JsonValueKind.False)
            return false;

        throw Invalid($"第 {index + 1} 条默认告警规则的 {propertyName} 无效。");
    }

    /// <summary>
    /// 以不区分大小写的方式查找属性，兼容历史模板的 PascalCase 字段。
    /// </summary>
    private static bool TryGetProperty(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    /// <summary>
    /// 创建带稳定错误码的模板规则异常。
    /// </summary>
    private static DeviceTemplateRulesException Invalid(string message)
    {
        return new DeviceTemplateRulesException(message);
    }
}
