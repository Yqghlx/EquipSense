using EquipAI.Core.Enums;

namespace EquipAI.Core.Entities;

/// <summary>
/// 设备实体，时序数据的生产者，关联类型模板与健康评分
/// </summary>
public class Device : BaseEntity
{
    /// <summary>
    /// 所属租户 ID
    /// </summary>
    public Guid TenantId { get; set; }

    /// <summary>
    /// 设备编码（租户内唯一）
    /// </summary>
    public string DeviceCode { get; set; } = string.Empty;

    /// <summary>
    /// 设备名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 设备类型（如 "电机"、"泵"、"压缩机"）
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 关联的设备类型模板 ID（可为空，表示未使用预置模板）
    /// </summary>
    public Guid? TypeTemplateId { get; set; }

    /// <summary>
    /// 制造商
    /// </summary>
    public string? Manufacturer { get; set; }

    /// <summary>
    /// 型号
    /// </summary>
    public string? Model { get; set; }

    /// <summary>
    /// 序列号
    /// </summary>
    public string? SerialNumber { get; set; }

    /// <summary>
    /// 安装位置（JSONB），包含车间、产线、工位等层级信息
    /// </summary>
    public string Location { get; set; } = "{}";

    /// <summary>
    /// 安装日期
    /// </summary>
    public DateOnly? InstallDate { get; set; }

    /// <summary>
    /// 关联的边缘网关 ID
    /// </summary>
    public string? GatewayId { get; set; }

    /// <summary>
    /// 连接配置（JSONB），存储协议类型、地址、端口等连接参数
    /// </summary>
    public string Connection { get; set; } = "{}";

    /// <summary>
    /// 设备负责人用户 ID
    /// </summary>
    public Guid? ResponsibleUserId { get; set; }

    /// <summary>
    /// 设备关键等级，影响告警优先级和派工策略
    /// </summary>
    public DeviceCriticality Criticality { get; set; } = DeviceCriticality.Normal;

    /// <summary>
    /// 每小时停机成本（元），用于 ROI 分析和优先级排序
    /// </summary>
    public decimal? DowntimeCostPerHour { get; set; }

    /// <summary>
    /// 健康评分（0-100），综合振动、温度、运行时长等因素
    /// </summary>
    public decimal HealthScore { get; set; } = 100m;

    /// <summary>
    /// 设备在线状态
    /// </summary>
    public DeviceStatus Status { get; set; } = DeviceStatus.Offline;

    /// <summary>
    /// 标签列表，用于设备分类和筛选
    /// </summary>
    public List<string> Tags { get; set; } = [];

    /// <summary>
    /// 自定义扩展字段（JSONB），适配不同行业的个性化属性
    /// </summary>
    public string CustomFields { get; set; } = "{}";

    /// <summary>
    /// 最后一次接收到数据的时间（UTC）
    /// </summary>
    public DateTime? LastDataAt { get; set; }

    /// <summary>
    /// 最后更新时间（UTC）
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // 导航属性

    /// <summary>
    /// 所属租户
    /// </summary>
    public Tenant Tenant { get; set; } = null!;

    /// <summary>
    /// 关联的设备类型模板
    /// </summary>
    public DeviceTypeTemplate? TypeTemplate { get; set; }

    /// <summary>
    /// 设备负责人
    /// </summary>
    public User? ResponsibleUser { get; set; }
}
