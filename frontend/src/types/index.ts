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
  token: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 当前登录用户信息 */
  user: UserInfo;
}

/** 用户基本信息 */
export interface UserInfo {
  /** 用户唯一标识（UUID） */
  id: string;
  /** 用户名 */
  username: string;
  /** 角色标识（system_admin / maintenance_lead / technician / operator / viewer） */
  role: string;
  /** 所属租户 ID */
  tenantId: string;
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
  deviceType: string;
  /** 设备状态（online / offline / maintenance / alarm） */
  status: string;
  /** 安装位置 */
  location?: string;
  /** 最后通信时间（ISO 8601） */
  lastCommunicatedAt?: string;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 创建设备请求参数 */
export interface CreateDeviceRequest {
  /** 设备编码（业务唯一） */
  deviceCode: string;
  /** 设备名称 */
  name: string;
  /** 设备类型 */
  deviceType: string;
  /** 安装位置 */
  location?: string;
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
  /** 关联设备 ID */
  deviceId: string;
  /** 设备名称（冗余字段，便于展示） */
  deviceName?: string;
  /** 触发告警的指标名称 */
  metric: string;
  /** 触发时的指标值 */
  value: number;
  /** 告警严重级别（critical / warning / info） */
  severity: string;
  /** 告警状态（triggered / acknowledged / resolved / suppressed） */
  status: string;
  /** 关联的告警规则 ID */
  ruleId?: string;
  /** 关联的告警规则名称 */
  ruleName?: string;
  /** 触发时间（ISO 8601） */
  triggeredAt: string;
  /** 确认时间（ISO 8601） */
  acknowledgedAt?: string;
  /** 解决时间（ISO 8601） */
  resolvedAt?: string;
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
  /** 告警严重级别（critical / warning / info） */
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
  /** 告警严重级别（critical / warning / info） */
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
  /** 工单状态（pending / assigned / in_progress / completed / cancelled） */
  status: string;
  /** 优先级（urgent / high / medium / low） */
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
  /** 工单类型（corrective / preventive / inspection） */
  type: string;
  /** 优先级（urgent / high / medium / low） */
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
