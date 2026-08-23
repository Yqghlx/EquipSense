using System.Text.Json;

namespace EquipAI.Application.Integrations;

/// <summary>
/// 通用外部集成业务响应判定。
/// HTTP 2xx 仍可能携带 success=false、非零 code/errcode，或 EAM 的 Error 字段；
/// 这些必须按失败处理，否则路由器会记成功并跳过重试。
/// 空响应或没有业务失败字段的 JSON 仍视为 HTTP 状态已足够（通用 Webhook / EAM 204）。
/// </summary>
internal static class IntegrationBusinessResponse
{
    /// <summary>
    /// 判断 HTTP 成功响应体是否仍表示业务失败。
    /// </summary>
    public static bool IsSuccess(string? responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return true;

        try
        {
            using var document = JsonDocument.Parse(responseBody);
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
                return true;

            if (root.TryGetProperty("success", out var success)
                && success.ValueKind is JsonValueKind.False)
            {
                return false;
            }

            if (HasNonZeroCode(root, "errcode")
                || HasNonZeroCode(root, "code")
                || HasNonZeroCode(root, "StatusCode"))
            {
                return false;
            }

            if (HasNonEmptyText(root, "Error") || HasNonEmptyText(root, "error"))
                return false;

            return true;
        }
        catch (JsonException)
        {
            // 非 JSON 的 2xx 文本（如 ok）按 HTTP 状态视为成功。
            return true;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }

    /// <summary>
    /// 读取整型业务码，非 0 视为失败。
    /// </summary>
    private static bool HasNonZeroCode(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var code))
            return false;

        return !code.TryGetInt32(out var value) || value != 0;
    }

    /// <summary>
    /// 读取非空错误文本字段。
    /// </summary>
    private static bool HasNonEmptyText(JsonElement root, string propertyName)
    {
        return root.TryGetProperty(propertyName, out var value)
            && value.ValueKind == JsonValueKind.String
            && !string.IsNullOrWhiteSpace(value.GetString());
    }
}
