namespace EquipAI.Core.Exceptions;

/// <summary>
/// 表示当前已认证用户没有执行目标业务操作的权限。
/// </summary>
public sealed class ForbiddenAccessException : Exception
{
    /// <summary>
    /// 初始化禁止访问异常。
    /// </summary>
    /// <param name="message">面向日志和 API 错误处理的说明。</param>
    public ForbiddenAccessException(string message)
        : base(message)
    {
    }
}
