using System.Text.Json;

namespace EquipAI.Application.Integrations;

/// <summary>
/// 飞书接口响应校验器。
/// 飞书部分接口会在 HTTP 200 时仍返回非零业务错误码，因此不能只依据 HTTP 状态判断成功。
/// </summary>
internal static class FeishuResponseValidator
{
    /// <summary>
    /// 判断响应体是否包含明确的成功业务码。
    /// 自定义机器人支持历史兼容字段 <c>StatusCode</c>，应用接口使用 <c>code</c>。
    /// </summary>
    public static bool IsSuccess(string? responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
            return false;

        try
        {
            using var document = JsonDocument.Parse(responseBody);
            var root = document.RootElement;
            var hasBusinessCode = false;

            if (root.TryGetProperty("code", out var code))
            {
                hasBusinessCode = true;
                if (!code.TryGetInt32(out var value) || value != 0)
                    return false;
            }

            if (root.TryGetProperty("StatusCode", out var statusCode))
            {
                hasBusinessCode = true;
                if (!statusCode.TryGetInt32(out var value) || value != 0)
                    return false;
            }

            return hasBusinessCode;
        }
        catch (JsonException)
        {
            return false;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }
}
