namespace EquipAI.Application.DTOs.Devices;

/// <summary>
/// 设备导入预览项 — 一条解析成功的设备数据
/// </summary>
public class DeviceImportPreviewItem
{
    /// <summary>行号（原始文件中的行号，用于展示）</summary>
    public int RowNumber { get; set; }

    /// <summary>设备编码（租户内唯一）</summary>
    public string DeviceCode { get; set; } = string.Empty;

    /// <summary>设备名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>设备类型（如 "电机"、"泵"、"压缩机"）</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>制造商</summary>
    public string? Manufacturer { get; set; }

    /// <summary>型号</summary>
    public string? Model { get; set; }

    /// <summary>序列号</summary>
    public string? SerialNumber { get; set; }

    /// <summary>安装位置</summary>
    public string? Location { get; set; }

    /// <summary>关键等级（Critical/High/Normal/Low）</summary>
    public string? Criticality { get; set; }

    /// <summary>关联的边缘网关 ID</summary>
    public string? GatewayId { get; set; }

    /// <summary>安装日期（yyyy-MM-dd）</summary>
    public string? InstallDate { get; set; }

    /// <summary>每小时停机成本</summary>
    public decimal? DowntimeCostPerHour { get; set; }
}

/// <summary>
/// 设备导入预览结果 — 导入前的校验报告
/// </summary>
public class DeviceImportPreviewResult
{
    /// <summary>预览模式下的解析成功数据（不会写入数据库）</summary>
    public List<DeviceImportPreviewItem> ValidItems { get; set; } = [];

    /// <summary>校验失败的项目列表</summary>
    public List<Application.Knowledge.DTOs.ImportErrorItem> Errors { get; set; } = [];

    /// <summary>解析到的总行数</summary>
    public int TotalRows { get; set; }

    /// <summary>有效行数</summary>
    public int ValidCount => ValidItems.Count;

    /// <summary>错误行数</summary>
    public int ErrorCount => Errors.Count;
}
