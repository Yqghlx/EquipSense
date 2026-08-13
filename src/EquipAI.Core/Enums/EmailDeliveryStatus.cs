namespace EquipAI.Core.Enums;

/// <summary>
/// 邮件投递任务状态。
/// </summary>
public enum EmailDeliveryStatus
{
    /// <summary>等待后台 worker 领取。</summary>
    Pending = 0,

    /// <summary>SMTP 已接受发送。</summary>
    Sent = 1,

    /// <summary>用户停用、关闭偏好或联系方式无效，任务不再发送。</summary>
    Cancelled = 2,

    /// <summary>超过最大尝试次数，需要人工排查。</summary>
    DeadLetter = 3,
}
