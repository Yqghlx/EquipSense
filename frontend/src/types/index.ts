/**
 * EquipSense 前端 TypeScript 类型定义
 *
 * 涵盖所有 API 实体类型，包括通用分页、认证、设备、告警、工单、分析和通知。
 * 后续所有 hooks 和组件均依赖此文件。
 */

// ============================================================================
// 通用分页
// ============================================================================

/** 分页查询结果 */
export interface PagedResult<T> {
  /** 数据列表 */
  items: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码（从 1 开始） */
  page: number;
  /** 每页条数 */
  pageSize: number;
}

/** 分页查询参数 */
export interface PagedQuery {
  /** 当前页码（从 1 开始） */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 排序字段 */
  sort?: string;
  /** 排序方向 */
  order?: 'asc' | 'desc';
}

// ============================================================================
// 认证
// ============================================================================

/** 登录请求参数 */
export interface LoginRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

/** 认证响应（包含令牌和用户信息） */
export interface AuthResponse {
  /** JWT 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 当前登录用户信息 */
  userInfo: UserInfo;
}

/** 用户基本信息 */
export interface UserInfo {
  /** 用户唯一标识（UUID） */
  id: string;
  /** 用户名 */
  username: string;
  /** 显示名称 */
  displayName: string;
  /** 角色标识（SystemAdmin / MaintenanceLead / Technician / Operator / Viewer） */
  role: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  phone?: string;
  /** 是否激活 */
  isActive: boolean;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

// ============================================================================
// 设备管理
// ============================================================================

/** 设备实体 */
export interface Device {
  /** 设备唯一标识（UUID） */
  id: string;
  /** 设备编码（业务唯一） */
  deviceCode: string;
  /** 设备名称 */
  name: string;
  /** 设备类型 */
  type: string;
  /** 制造商 */
  manufacturer?: string;
  /** 型号 */
  model?: string;
  /** 设备状态（Online / Offline / Maintenance / Warning） */
  status: string;
  /** 关键性等级（Normal / Important / Critical） */
  criticality: string;
  /** 健康评分（0-100） */
  healthScore: number;
  /** 创建时间（ISO 8601） */
  createdAt: string;
  /** 更新时间（ISO 8601） */
  updatedAt: string;
}

/** 创建设备请求参数 */
export interface CreateDeviceRequest {
  /** 设备编码（业务唯一） */
  deviceCode: string;
  /** 设备名称 */
  name: string;
  /** 设备类型 */
  type: string;
  /** 制造商 */
  manufacturer?: string;
  /** 型号 */
  model?: string;
}

/** 设备遥测数据（时序窄表：一行一个指标） */
export interface DeviceTelemetry {
  /** 设备 ID */
  deviceId: string;
  /** 指标名称（如 temperature、vibration） */
  metric: string;
  /** 指标值 */
  value: number;
  /** 采集时间戳（ISO 8601） */
  timestamp: string;
}

// ============================================================================
// 告警
// ============================================================================

/** 告警实例 */
export interface Alert {
  /** 告警唯一标识（UUID） */
  id: string;
  /** 告警编码（业务唯一） */
  alertCode: string;
  /** 关联的告警规则 ID */
  ruleId?: string;
  /** 关联设备 ID */
  deviceId: string;
  /** 关联设备名称 */
  deviceName?: string;
  /** 告警严重级别（Critical / High / Normal / Low） */
  severity: string;
  /** 触发告警的指标名称 */
  metric: string;
  /** 触发时的指标值 */
  value: number;
  /** 告警阈值 */
  threshold?: number;
  /** 告警消息 */
  message?: string;
  /** 告警状态（Active / Acknowledged / Resolved） */
  status: string;
  /** 触发时间（ISO 8601） */
  triggeredAt: string;
  /** 确认时间（ISO 8601） */
  acknowledgedAt?: string;
  /** 解决时间（ISO 8601） */
  resolvedAt?: string;
  /** 是否已确认 */
  acknowledged: boolean;
  /** 是否已解决 */
  resolved: boolean;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 告警规则 */
export interface AlertRule {
  /** 规则唯一标识（UUID） */
  id: string;
  /** 规则名称 */
  name: string;
  /** 适用的设备类型（为空则适用所有） */
  deviceType?: string;
  /** 适用的设备 ID（为空则按设备类型匹配） */
  deviceId?: string;
  /** 监控的指标名称 */
  metric: string;
  /** 规则类型（threshold / composite / baseline / ml） */
  ruleType: string;
  /** 比较运算符（gt / gte / lt / lte / eq / neq） */
  operator?: string;
  /** 阈值（阈值规则使用） */
  threshold?: number;
  /** 组合条件（JSONB，组合规则使用） */
  conditions?: string;
  /** 基线标准差倍数（基线规则使用） */
  baselineStddevMultiplier?: number;
  /** 告警严重级别（Critical / High / Normal / Low） */
  severity: string;
  /** 冷却时间（秒），防止短时间内重复告警 */
  cooldownSeconds: number;
  /** 是否自动创建工单 */
  autoCreateWorkorder: boolean;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 创建告警规则请求参数 */
export interface CreateAlertRuleRequest {
  /** 规则名称 */
  name: string;
  /** 适用的设备类型（为空则适用所有） */
  deviceType?: string;
  /** 适用的设备 ID（为空则按设备类型匹配） */
  deviceId?: string;
  /** 监控的指标名称 */
  metric: string;
  /** 规则类型（threshold / composite / baseline / ml） */
  ruleType: string;
  /** 比较运算符（gt / gte / lt / lte / eq / neq） */
  operator?: string;
  /** 阈值（阈值规则使用） */
  threshold?: number;
  /** 组合条件（JSONB，组合规则使用） */
  conditions?: string;
  /** 基线标准差倍数（基线规则使用） */
  baselineStddevMultiplier?: number;
  /** 告警严重级别（Critical / High / Normal / Low） */
  severity: string;
  /** 冷却时间（秒），防止短时间内重复告警 */
  cooldownSeconds: number;
  /** 是否自动创建工单 */
  autoCreateWorkorder: boolean;
  /** 是否启用 */
  enabled: boolean;
}

// ============================================================================
// 工单管理
// ============================================================================

/** 工单实体 */
export interface WorkOrder {
  /** 工单唯一标识（UUID） */
  id: string;
  /** 工单编码（业务唯一） */
  workOrderCode: string;
  /** 工单标题 */
  title: string;
  /** 工单类型（corrective / preventive / inspection） */
  type: string;
  /** 工单状态（PendingDispatch / Assigned / InProgress / Completed / Accepted / Rejected / Closed / Cancelled） */
  status: string;
  /** 优先级（Urgent / High / Medium / Low） */
  priority: string;
  /** 关联设备 ID */
  deviceId: string;
  /** 关联告警 ID */
  alertId?: string;
  /** 关联分析 ID */
  analysisId?: string;
  /** 根因描述 */
  rootCause?: string;
  /** 解决方案 */
  resolution?: string;
  /** 被指派人 ID */
  assignedTo?: string;
  /** 截止时间（ISO 8601） */
  dueDate?: string;
  /** 完成时间（ISO 8601） */
  completedAt?: string;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 创建工单请求参数 */
export interface CreateWorkOrderRequest {
  /** 工单标题 */
  title: string;
  /** 工单类型（Corrective / Preventive / Inspection） */
  type: string;
  /** 优先级（Urgent / High / Medium / Low） */
  priority: string;
  /** 关联设备 ID */
  deviceId: string;
  /** 关联告警 ID */
  alertId?: string;
  /** 根因描述 */
  rootCause?: string;
  /** 工单描述 */
  description?: string;
  /** 截止时间（ISO 8601） */
  dueDate?: string;
}

/** 指派工单请求参数 */
export interface AssignWorkOrderRequest {
  /** 被指派人 ID */
  assignedTo: string;
  /** 备注 */
  note?: string;
}

/** 完成工单请求参数 */
export interface CompleteWorkOrderRequest {
  /** 解决方案描述 */
  resolution: string;
}

/** 工单流转日志 */
export interface WorkOrderLog {
  /** 日志唯一标识（UUID） */
  id: string;
  /** 关联工单 ID */
  workOrderId: string;
  /** 操作类型（created / assigned / started / completed / cancelled） */
  action: string;
  /** 操作前状态 */
  oldStatus?: string;
  /** 操作后状态 */
  newStatus?: string;
  /** 操作人 ID */
  operatorId?: string;
  /** 备注信息 */
  note?: string;
  /** 操作时间（ISO 8601） */
  createdAt: string;
}

// ============================================================================
// AI 分析
// ============================================================================

/** 分析结果实体 */
export interface Analysis {
  /** 分析唯一标识（UUID） */
  id: string;
  /** 关联告警 ID */
  alertId: string;
  /** 关联设备 ID */
  deviceId: string;
  /** 分析级别（prediction / statistics / rule / llm，对应四级自动降级） */
  level: string;
  /** 分析状态（pending / completed / failed） */
  status: string;
  /** 置信度（0-1，受数据质量评分影响） */
  confidence?: number;
  /** 数据质量评分（0-100） */
  dataQualityScore?: number;
  /** 根因分析结论 */
  rootCause?: string;
  /** 建议措施 */
  suggestion?: string;
  /** 处理耗时（毫秒） */
  processingTimeMs?: number;
  /** 完成时间（ISO 8601） */
  completedAt?: string;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 创建分析请求参数 */
export interface CreateAnalysisRequest {
  /** 触发分析的告警 ID */
  alertId: string;
}

// ============================================================================
// 通知
// ============================================================================

/** 通知实体（用于 SignalR 实时推送和前端通知中心） */
export interface Notification {
  /** 通知唯一标识 */
  id: string;
  /** 通知类型（告警 / 工单 / 系统） */
  type: 'alert' | 'workorder' | 'system';
  /** 通知标题 */
  title: string;
  /** 通知内容 */
  message: string;
  /** 时间戳（Unix 毫秒） */
  timestamp: number;
  /** 是否已读 */
  read: boolean;
  /** 关联链接（点击后跳转的页面路径） */
  link?: string;
}

// ============================================================================
// 知识库
// ============================================================================

/** 知识规则（已审核通过的正式规则） */
export interface KnowledgeRule {
  /** 规则唯一标识（UUID） */
  id: string;
  /** 所属租户 ID */
  tenantId: string;
  /** 适用设备类型 */
  deviceType: string;
  /** 规则名称 */
  name: string;
  /** 触发条件（自然语言描述） */
  conditions: string;
  /** 结论/诊断结果 */
  conclusion: string;
  /** 推荐措施 */
  recommendedActions?: string;
  /** 检查步骤 */
  checkSteps?: string;
  /** 置信度权重（0-1） */
  confidenceWeight: number;
  /** 来源（manual / ai_generated / imported） */
  source: string;
  /** 准确率（百分比） */
  accuracyRate?: number;
  /** 成功应用次数 */
  successCount: number;
  /** 是否启用 */
  enabled: boolean;
  /** 创建人 ID */
  createdBy?: string;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 候选规则（AI 生成，待专家审核） */
export interface PendingRule {
  /** 规则唯一标识（UUID） */
  id: string;
  /** 所属租户 ID */
  tenantId: string;
  /** 适用设备类型 */
  deviceType: string;
  /** 规则名称 */
  name: string;
  /** 触发条件（自然语言描述） */
  conditions: string;
  /** 结论/诊断结果 */
  conclusion: string;
  /** 推荐措施 */
  recommendedActions?: string;
  /** 检查步骤 */
  checkSteps?: string;
  /** 关联工单 ID */
  sourceWorkorderId?: string;
  /** 来源告警 ID（分析引擎自动生成时关联的告警） */
  sourceAlertId?: string;
  /** 来源分析 ID（分析引擎自动生成时关联的分析记录） */
  sourceAnalysisId?: string;
  /** AI 置信度（0-1） */
  confidence?: number;
  /** 审核状态 */
  reviewStatus: 'Pending' | 'Approved' | 'Rejected';
  /** 审核人 ID */
  reviewedBy?: string;
  /** 审核意见 */
  reviewComment?: string;
  /** 审核时间（ISO 8601） */
  reviewedAt?: string;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 故障案例 */
export interface FaultCase {
  /** 案例唯一标识（UUID） */
  id: string;
  /** 所属租户 ID */
  tenantId: string;
  /** 关联设备 ID */
  deviceId?: string;
  /** 设备类型 */
  deviceType: string;
  /** 故障发生时间（ISO 8601） */
  faultOccurredAt?: string;
  /** 故障描述 */
  faultDescription: string;
  /** 根因分析 */
  rootCause: string;
  /** 解决方案 */
  solution: string;
  /** 维修时长（分钟） */
  repairDurationMinutes?: number;
  /** 是否已验证 */
  isVerified: boolean;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

// ============================================================================
// 设备配置向导
// ============================================================================

/** 设备类型模板（用于向导选择设备类型） */
export interface DeviceTypeTemplate {
  /** 模板唯一标识（UUID） */
  id: string;
  /** 模板名称 */
  name: string;
  /** 所属行业 */
  industry?: string;
  /** 默认告警规则（模板预置） */
  defaultAlarmRules?: Record<string, unknown>;
  /** 设备参数模板（JSONB） */
  parameters?: Record<string, unknown>;
}

/** 快速注册设备请求参数 */
export interface QuickRegisterRequest {
  /** 所属租户 ID */
  tenantId: string;
  /** 设备编码（业务唯一） */
  deviceCode: string;
  /** 设备名称 */
  name?: string;
  /** 设备类型 */
  deviceType?: string;
  /** 默认告警规则列表 */
  defaultAlertRules?: {
    /** 监控指标名称 */
    metric: string;
    /** 告警阈值 */
    threshold: number;
    /** 告警严重级别（Critical / High / Normal / Low） */
    severity?: string;
  }[];
}
