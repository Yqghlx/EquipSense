namespace EquipAI.Application.Knowledge.DTOs;

/// <summary>
/// 导入预览结果 — 导入前的校验报告
/// </summary>
public class ImportPreviewResult
{
    /// <summary>预览模式下的解析成功数据（不会写入数据库）</summary>
    public List<ImportPreviewItem> ValidItems { get; set; } = [];

    /// <summary>校验失败的项目列表</summary>
    public List<ImportErrorItem> Errors { get; set; } = [];

    /// <summary>解析到的总行数</summary>
    public int TotalRows { get; set; }

    /// <summary>有效行数</summary>
    public int ValidCount => ValidItems.Count;

    /// <summary>错误行数</summary>
    public int ErrorCount => Errors.Count;
}

/// <summary>
/// 预览项 — 一条解析成功的规则数据
/// </summary>
public class ImportPreviewItem
{
    /// <summary>行号（原始文件中的行号，用于展示）</summary>
    public int RowNumber { get; set; }

    /// <summary>设备类型</summary>
    public string DeviceType { get; set; } = string.Empty;

    /// <summary>规则名称</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>触发条件</summary>
    public string Conditions { get; set; } = "[]";

    /// <summary>结论</summary>
    public string Conclusion { get; set; } = string.Empty;

    /// <summary>推荐措施</summary>
    public string? RecommendedActions { get; set; }

    /// <summary>检查步骤</summary>
    public string? CheckSteps { get; set; }

    /// <summary>置信度权重</summary>
    public decimal ConfidenceWeight { get; set; } = 0.5m;
}

/// <summary>
/// 导入错误项
/// </summary>
public class ImportErrorItem
{
    /// <summary>行号</summary>
    public int RowNumber { get; set; }

    /// <summary>错误信息</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>原始行内容（用于展示）</summary>
    public string? RawContent { get; set; }
}

/// <summary>
/// 批量导入执行结果
/// </summary>
public class ImportResult
{
    /// <summary>成功导入数量</summary>
    public int Imported { get; set; }

    /// <summary>跳过数量（重复或错误）</summary>
    public int Skipped { get; set; }

    /// <summary>失败数量</summary>
    public int Failed { get; set; }

    /// <summary>失败详情</summary>
    public List<ImportErrorItem> Errors { get; set; } = [];
}
