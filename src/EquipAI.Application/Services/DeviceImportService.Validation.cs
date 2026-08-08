using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using EquipAI.Core.Enums;

namespace EquipAI.Application.Services;

/// <summary>
/// 设备导入校验逻辑（partial）
/// 职责：行级必填字段校验、字段格式校验（关键等级/日期/成本）、location 规范化为合法 JSON、枚举与日期解析
/// </summary>
public sealed partial class DeviceImportService
{
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

    /// <summary>
    /// location 规范化的 JSON 序列化选项：使用宽松编码器，保留中文等 Unicode 字面量。
    /// 为什么不用默认编码器：默认会把中文转义成 厂 形式，技术上合法但 DB 中不可读，
    /// 客户/管理员直查 location 列会看到乱码。该 JSON 仅存入 jsonb 列（非 HTML/JS 上下文），
    /// 无 XSS 风险，故可安全使用宽松编码器。结构性字符（引号、反斜杠、控制符）仍按 JSON 规范转义。
    /// </summary>
    private static readonly JsonSerializerOptions LocationJsonOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

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

        // 编码去重（不区分大小写）：仅读取 seenCodes，由调用方在校验全部通过后才写入。
        // 关键约束：本方法不得修改 seenCodes。否则一个因缺 name/type 被拒的无效行会先把 device_code
        // 占位进集合，导致后续真正完整的同名有效行被误判为"重复"而丢弃——批量上线数百台设备时，
        // CSV 中一处笔误就会连锁误杀有效行，且报错信息（"重复"）完全误导（客户见编码只出现一次却报重复）。
        if (!string.IsNullOrWhiteSpace(deviceCode) && seenCodes.Contains(deviceCode.ToLowerInvariant()))
        {
            errors.Add($"文件内设备编码重复: {deviceCode}");
        }

        return errors;
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

    /// <summary>
    /// 规范化安装位置为合法 JSON。
    ///
    /// 为什么需要：Device.Location 列映射为 PostgreSQL <c>jsonb</c>（见 DeviceConfiguration），
    /// 数据库会强制校验 JSON 语法。导入时若直接存原始文本（客户常直接填"A厂1车间"而非 JSON），
    /// SaveChangesAsync 会抛 <c>invalid input syntax for type json</c>，导致整个导入事务回滚——
    /// 500 台设备的批量上传可能因 1 行位置文本不规范而全部失败，且报错对客户完全不可读。
    /// 注意：单元/集成测试使用 InMemory/SQLite，两者都不强制 jsonb 类型，因此该缺陷无法被现有测试捕获，
    /// 只在真实 PostgreSQL 上暴露（典型的"测试通过、生产崩溃"）。
    ///
    /// 规范化策略（保证产出一定是合法 JSON，永不触发 jsonb 校验失败）：
    /// 1. 空白 → <c>"{}"</c>（与实体默认值一致）；
    /// 2. 已是合法 JSON（对象/数组/标量）→ 原样保留，兼容模板示例 <c>{"workshop":"A"}</c>；
    /// 3. 其余纯文本 → 包装为 <c>{"name":"&lt;文本&gt;"}</c>，内部文本经 JSON 转义，不丢数据。
    /// </summary>
    internal static string NormalizeLocation(string? location)
    {
        if (string.IsNullOrWhiteSpace(location))
            return "{}";

        var trimmed = location.Trim();

        // 已是合法 JSON 则原样保留
        if (IsValidJson(trimmed))
            return trimmed;

        // 纯文本包装为对象；LocationJsonOptions 保留中文字面量，内部引号/反斜杠/控制字符仍按 JSON 规范转义
        return JsonSerializer.Serialize(new Dictionary<string, string> { ["name"] = trimmed }, LocationJsonOptions);
    }

    /// <summary>
    /// 判断字符串是否为合法 JSON（容错解析，仅用于决定是否需要包装）。
    /// 裸数字、带引号字符串、对象、数组均视为合法——它们本身都是合法的 jsonb 值，不会触发校验失败。
    /// </summary>
    private static bool IsValidJson(string value)
    {
        try
        {
            using var _ = JsonDocument.Parse(value);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
