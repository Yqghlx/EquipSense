using EquipAI.Core.Entities;

namespace EquipAI.Application.Knowledge;

/// <summary>
/// 行业预置知识数据 — 常见工业设备故障诊断规则
/// 归属系统租户（tenant_id = Guid.Empty），所有租户可见
/// </summary>
public static class IndustryPresetData
{
    /// <summary>
    /// 电机类设备诊断规则
    /// </summary>
    public static List<KnowledgeRule> MotorRules(Guid systemTenantId) =>
    [
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "电机",
            Name = "电机过热诊断",
            Conditions = """[{"metric":"temperature","operator":">","threshold":80}]""",
            Conclusion = "电机绕组或轴承温度过高，可能原因：散热不良、负载过大、轴承磨损",
            RecommendedActions = """["检查冷却风扇运行状态","测量负载电流是否超额定","检查轴承润滑和磨损"]""",
            CheckSteps = """["红外测温确认发热点","检查风扇转向和转速","测量三相电流平衡性"]""",
            ConfidenceWeight = 0.85m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        },
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "电机",
            Name = "电机振动异常",
            Conditions = """[{"metric":"vibration","operator":">","threshold":7.0}]""",
            Conclusion = "电机振动超标，可能原因：转子不平衡、轴承损坏、安装基础松动",
            RecommendedActions = """["进行振动频谱分析","检查联轴器对中","检查地脚螺栓紧固"]""",
            CheckSteps = """["测量轴向/径向振动值","频谱分析确定振动频率","检查轴承间隙"]""",
            ConfidenceWeight = 0.80m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        },
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "电机",
            Name = "电机电流异常",
            Conditions = """[{"metric":"current","operator":">","threshold":50}]""",
            Conclusion = "电机电流超过额定值，可能原因：机械卡阻、绝缘下降、电源异常",
            RecommendedActions = """["检查机械负载是否正常","测量绝缘电阻","检查三相电压平衡"]""",
            CheckSteps = """["对比额定电流值","测量绕组绝缘","检查电源电压"]""",
            ConfidenceWeight = 0.75m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        }
    ];

    /// <summary>
    /// 泵类设备诊断规则
    /// </summary>
    public static List<KnowledgeRule> PumpRules(Guid systemTenantId) =>
    [
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "泵",
            Name = "泵出口压力异常",
            Conditions = """[{"metric":"pressure","operator":"<","threshold":0.5}]""",
            Conclusion = "泵出口压力低于正常值，可能原因：叶轮磨损、进口堵塞、密封泄漏",
            RecommendedActions = """["检查进口滤网","检查叶轮磨损情况","检查机械密封"]""",
            CheckSteps = """["对比额定出口压力","检查进口阀门开度","检查轴封泄漏"]""",
            ConfidenceWeight = 0.80m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        }
    ];

    /// <summary>
    /// CNC 设备诊断规则
    /// </summary>
    public static List<KnowledgeRule> CncRules(Guid systemTenantId) =>
    [
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "CNC",
            Name = "CNC 主轴温度异常",
            Conditions = """[{"metric":"spindle_temperature","operator":">","threshold":65}]""",
            Conclusion = "CNC 主轴温度过高，可能原因：主轴轴承磨损、冷却液不足、转速过高",
            RecommendedActions = """["检查冷却液液位和流量","降低主轴转速","检查主轴轴承状态"]""",
            CheckSteps = """["检查冷却系统","测量主轴径向跳动","检查润滑脂"]""",
            ConfidenceWeight = 0.85m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        }
    ];

    /// <summary>
    /// 通用规则（适用于所有设备类型）
    /// </summary>
    public static List<KnowledgeRule> GenericRules(Guid systemTenantId) =>
    [
        new()
        {
            TenantId = systemTenantId,
            DeviceType = "*",
            Name = "通用振动超标诊断",
            Conditions = """[{"metric":"vibration","operator":">","threshold":10.0}]""",
            Conclusion = "设备振动严重超标，建议立即停机检查",
            RecommendedActions = """["紧急停机","全面振动分析","检查安装基础和紧固件"]""",
            ConfidenceWeight = 0.70m,
            Source = "imported",
            Enabled = true,
            CreatedBy = "system-preset"
        }
    ];

    /// <summary>
    /// 获取所有预置规则
    /// </summary>
    public static List<KnowledgeRule> AllRules(Guid systemTenantId)
    {
        var rules = new List<KnowledgeRule>();
        rules.AddRange(MotorRules(systemTenantId));
        rules.AddRange(PumpRules(systemTenantId));
        rules.AddRange(CncRules(systemTenantId));
        rules.AddRange(GenericRules(systemTenantId));
        return rules;
    }
}
