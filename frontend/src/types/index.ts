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
  /** JWT 访问令牌（MFA 阶段为空） */
  accessToken: string;
  /** 刷新令牌（MFA 阶段为空） */
  refreshToken: string;
  /** 当前登录用户信息 */
  userInfo: UserInfo;
  /** Access Token 有效时长（秒），前端据此调度主动续期 */
  expiresIn?: number;
  /** 是否需要 MFA 二次验证（为 true 时需调用 /auth/mfa/verify 完成登录） */
  mfaRequired?: boolean;
  /** MFA 挑战令牌（mfaRequired=true 时返回，传递给 /auth/mfa/verify） */
  mfaChallengeToken?: string;
  /** 是否必须先完成 MFA 注册（为 true 时不颁发 JWT） */
  mfaEnrollmentRequired?: boolean;
  /** MFA 首次注册令牌（mfaEnrollmentRequired=true 时返回） */
  mfaEnrollmentToken?: string;
  /** MFA 注册或重新生成时仅返回一次的恢复码 */
  mfaRecoveryCodes?: string[];
}

/** MFA 初始化响应（/auth/mfa/setup） */
export interface MfaSetupResponse {
  /** Base32 编码的 TOTP 密钥（用户可在 authenticator 中手动输入） */
  secret: string;
  /** otpauth:// URI（前端用 QRCode 库将其渲染为二维码） */
  qrCodeUri: string;
}

/** MFA 恢复码生成响应 */
export interface MfaRecoveryCodesResponse {
  /** 仅在本次响应返回的明文一次性恢复码 */
  recoveryCodes: string[];
}

/** 用户基本信息 */
export interface UserInfo {
  /** 用户唯一标识（UUID） */
  id: string;
  /** 所属租户 ID（v1.4 加入：HttpOnly Cookie 后前端不再能从 JWT 解析，改为直接由 UserInfo 返回） */
  tenantId: string;
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
  /** 是否需要强制修改密码 */
  mustChangePassword: boolean;
  /** 是否已启用多因素认证（MFA/TOTP） */
  mfaEnabled: boolean;
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
  /** 序列号（资产追踪） */
  serialNumber?: string;
  /** 安装日期（yyyy-MM-dd） */
  installDate?: string;
  /** 绑定网关编码 */
  gatewayId?: string;
  /** 每小时停机成本（元） */
  downtimeCostPerHour?: number;
  /** 最后上报时间（ISO 8601，运维判断失联） */
  lastSeenAt?: string;
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
  /** 关键等级（Critical/High/Normal/Low） */
  criticality?: string;
  /** 型号 */
  model?: string;
  /** 序列号 */
  serialNumber?: string;
  /** 安装日期（yyyy-MM-dd） */
  installDate?: string;
  /** 绑定网关编码 */
  gatewayId?: string;
  /** 每小时停机成本（元） */
  downtimeCostPerHour?: number;
}

/** 设备导入预览项（解析后的有效设备行） */
export interface DeviceImportPreviewItem {
  /** 行号 */
  rowNumber: number;
  /** 设备编码 */
  deviceCode: string;
  /** 设备名称 */
  name: string;
  /** 设备类型 */
  type: string;
  /** 制造商 */
  manufacturer?: string;
  /** 型号 */
  model?: string;
  /** 序列号 */
  serialNumber?: string;
  /** 安装位置 */
  location?: string;
  /** 关键等级 */
  criticality?: string;
  /** 网关 ID */
  gatewayId?: string;
  /** 安装日期 */
  installDate?: string;
  /** 每小时停机成本 */
  downtimeCostPerHour?: number;
}

/** 设备导入预览结果 */
export interface DeviceImportPreviewResult {
  /** 有效数据列表 */
  validItems: DeviceImportPreviewItem[];
  /** 错误列表 */
  errors: ImportErrorItem[];
  /** 文件总行数 */
  totalRows: number;
  /** 有效行数 */
  validCount: number;
  /** 错误行数 */
  errorCount: number;
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
  /** 告警发生时间（ISO 8601），对应后端 occurredAt */
  occurredAt: string;
  /** 触发次数（30 分钟窗口内聚合） */
  triggerCount: number;
  /** 聚合窗口起始时间 */
  windowStartAt?: string;
  /** 是否已确认 */
  acknowledged: boolean;
  /** 是否已解决 */
  resolved: boolean;
  /** 创建时间（ISO 8601） */
  createdAt: string;
  /** 告警触发时刻的设备全量指标快照（JSON 字符串），由后端 DataSnapshot 投影；前端解析展示根因上下文 */
  dataSnapshot?: string;
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
  /** 逻辑运算符（AND / OR，组合规则使用） */
  logicOperator?: string;
  /** 基线标准差倍数（基线规则使用） */
  baselineStddevMultiplier?: number;
  /** 基线时间窗口（小时，基线规则使用） */
  baselineWindow?: number;
  /** 基线敏感度（标准差倍数，基线规则使用） */
  baselineSensitivity?: number;
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
  /** 组合条件（数组形式，提交时会转为 JSON 字符串） */
  conditions?: { metric: string; operator: string; threshold: number }[];
  /** 逻辑运算符（AND / OR，组合规则使用） */
  logicOperator?: string;
  /** 基线标准差倍数（基线规则使用） */
  baselineStddevMultiplier?: number;
  /** 基线时间窗口（小时，基线规则使用） */
  baselineWindow?: number;
  /** 基线敏感度（标准差倍数，基线规则使用） */
  baselineSensitivity?: number;
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
  /** 工单状态（PendingDispatch / Assigned / InProgress / SubmittedForApproval / Completed / Accepted / Rejected / Closed / Cancelled） */
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
  /** 维修执行报告（详细维修过程；知识沉淀生成故障案例 Solution 优先使用本字段，为空则降级到 resolution） */
  executionReport?: string;
  /** 使用零件（JSON 数组字符串；知识沉淀记入故障案例 PartsUsed，并供备件成本核算） */
  requiredParts?: string;
  /** 被指派人 ID */
  assignedTo?: string;
  /** 截止时间（ISO 8601） */
  dueDate?: string;
  /** 完成时间（ISO 8601） */
  completedAt?: string;
  /** 实际维修工时（小时）= 完成时间 - 开始时间；用于维修人工成本核算、MTTR、技师效率评估 */
  actualHours?: number;
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
  /** 维修执行报告（详细维修过程；知识沉淀 FaultCase.Solution 优先使用本字段） */
  executionReport?: string;
  /** 使用零件（JSON 数组字符串；知识沉淀 FaultCase.PartsUsed + 备件成本核算） */
  requiredParts?: string;
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
  /** 版本号 */
  version: number;
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
  /** 故障现象/症状（从关联告警指标推断，知识沉淀核心检索维度） */
  symptoms?: string;
  /** 故障时刻指标快照（JSON 字符串，告警 DataSnapshot，根因回放） */
  faultData?: string;
  /** 维修执行人姓名（工单指派技术员，经验传承追溯） */
  operator?: string;
  /** 分类标签（逗号分隔：设备类型,工单优先级） */
  tags?: string;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 知识规则版本快照 */
export interface KnowledgeRuleVersion {
  /** 版本记录唯一标识（UUID） */
  id: string;
  /** 关联规则 ID */
  ruleId: string;
  /** 版本号 */
  version: number;
  /** 规则快照（JSON 字符串，记录该版本的完整规则内容） */
  snapshot: string;
  /** 变更操作人 */
  changedBy?: string;
  /** 变更摘要 */
  changeSummary?: string;
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 导入预览项（文件解析后的有效数据行） */
export interface ImportPreviewItem {
  /** 行号 */
  rowNumber: number;
  /** 适用设备类型 */
  deviceType: string;
  /** 规则名称 */
  name: string;
  /** 触发条件 */
  conditions: string;
  /** 结论 */
  conclusion: string;
  /** 推荐措施 */
  recommendedActions?: string;
  /** 检查步骤 */
  checkSteps?: string;
  /** 置信度权重（0-1） */
  confidenceWeight: number;
}

/** 导入错误项（文件解析失败的行） */
export interface ImportErrorItem {
  /** 行号 */
  rowNumber: number;
  /** 错误信息 */
  message: string;
  /** 原始内容 */
  rawContent?: string;
}

/** 导入预览结果（上传文件后的预览响应） */
export interface ImportPreviewResult {
  /** 有效数据列表 */
  validItems: ImportPreviewItem[];
  /** 错误列表 */
  errors: ImportErrorItem[];
  /** 文件总行数 */
  totalRows: number;
  /** 有效行数 */
  validCount: number;
  /** 错误行数 */
  errorCount: number;
}

/** 批量导入结果 */
export interface ImportResult {
  /** 成功导入数 */
  imported: number;
  /** 跳过数 */
  skipped: number;
  /** 失败数 */
  failed: number;
  /** 失败详情 */
  errors: ImportErrorItem[];
}

/** 编辑知识规则请求参数 */
export interface UpdateKnowledgeRuleRequest {
  /** 规则名称 */
  name?: string;
  /** 适用设备类型 */
  deviceType?: string;
  /** 触发条件 */
  conditions?: string;
  /** 结论 */
  conclusion?: string;
  /** 推荐措施 */
  recommendedActions?: string;
  /** 检查步骤 */
  checkSteps?: string;
  /** 置信度权重（0-1） */
  confidenceWeight?: number;
  /** 变更摘要 */
  changeSummary?: string;
}

/** 条件项（用于条件编辑器的结构化条件数据） */
export interface ConditionItem {
  /** 指标名称 */
  metric: string;
  /** 比较运算符（> / >= / < / <= / == / !=） */
  operator: string;
  /** 阈值 */
  threshold: number;
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

// ============================================================================
// 审批链
// ============================================================================

/** 审批动作 */
export type ApprovalAction = 'Pending' | 'Approved' | 'Rejected';

/** 审批步骤 */
export interface ApprovalStepDto {
  /** 步骤唯一标识 */
  id: string;
  /** 步骤顺序（从 1 开始） */
  stepOrder: number;
  /** 审批角色 */
  role: string;
  /** 指定审批人 ID（可选，为空则按角色匹配） */
  specificApproverId?: string;
  /** 是否必填步骤 */
  isRequired: boolean;
}

/** 审批链模板 */
export interface ApprovalChainTemplate {
  /** 模板唯一标识（UUID） */
  id: string;
  /** 适用的工单类型（为空则通用） */
  workOrderType?: string;
  /** 适用的优先级（为空则通用） */
  priority?: string;
  /** 模板名称 */
  name: string;
  /** 是否为默认模板 */
  isDefault: boolean;
  /** 是否启用 */
  enabled: boolean;
  /** 审批步骤列表 */
  steps: ApprovalStepDto[];
  /** 创建时间（ISO 8601） */
  createdAt: string;
}

/** 工单审批记录 */
export interface WorkOrderApprovalDto {
  /** 记录唯一标识（UUID） */
  id: string;
  /** 关联工单 ID */
  workOrderId: string;
  /** 审批步骤顺序 */
  stepOrder: number;
  /** 期望审批角色 */
  expectedRole: string;
  /** 实际审批人 ID */
  approverId?: string;
  /** 审批动作（Pending / Approved / Rejected） */
  action: ApprovalAction;
  /** 审批意见 */
  comment?: string;
  /** 审批操作时间（ISO 8601） */
  actedAt?: string;
}

/** 创建审批链请求 */
export interface CreateApprovalChainRequest {
  /** 适用的工单类型（为空则通用） */
  workOrderType?: string;
  /** 适用的优先级（为空则通用） */
  priority?: string;
  /** 模板名称 */
  name: string;
  /** 是否为默认模板 */
  isDefault: boolean;
  /** 审批步骤列表 */
  steps: {
    /** 步骤顺序 */
    stepOrder: number;
    /** 审批角色 */
    role: string;
    /** 指定审批人 ID（可选） */
    specificApproverId?: string;
    /** 是否必填 */
    isRequired: boolean;
  }[];
}

// ============================================================================
// 注册
// ============================================================================

/** 注册请求参数 */
export interface RegisterRequest {
  /** 企业名称 */
  tenantName: string;
  /** 企业标识（用于 URL 子域名） */
  slug: string;
  /** 管理员用户名 */
  username: string;
  /** 管理员密码 */
  password: string;
  /** 显示名称 */
  displayName?: string;
  /** 邮箱 */
  email?: string;
  /** 套餐 ID */
  plan: string;
}

/** 套餐信息 */
export interface PlanInfo {
  /** 套餐唯一标识 */
  planId: string;
  /** 套餐显示名称 */
  displayName: string;
  /** 套餐描述 */
  description: string;
  /** 最大设备数 */
  maxDevices: number;
  /** 最大用户数 */
  maxUsers: number;
  /** 数据保留天数 */
  dataRetentionDays: number;
  /** 月价格 */
  monthlyPrice: number;
  /** 是否免费套餐 */
  isFree: boolean;
}

// ============================================================================
// 离线操作队列
// ============================================================================

/** 离线操作类型 */
export type OfflineOperationType =
  | 'work-order-complete'
  | 'work-order-accept'
  | 'work-order-reject'
  | 'device-note';

/** 离线操作队列条目 */
export interface PendingOperation {
  /** 操作唯一标识（UUID） */
  id: string;
  /** 操作类型 */
  type: OfflineOperationType;
  /** 请求 URL */
  url: string;
  /** HTTP 方法 */
  method: string;
  /** 请求体（JSON 序列化） */
  body: string;
  /** 创建时间戳（毫秒） */
  timestamp: number;
  /** 重试次数 */
  retryCount: number;
  /** 最大重试次数 */
  maxRetries: number;
}

/** 离线操作同步结果 */
export interface SyncResult {
  /** 成功同步的操作 ID 列表 */
  succeeded: string[];
  /** 失败的操作（包含 ID 和错误信息） */
  failed: Array<{ id: string; error: string }>;
  /** 因冲突（409）而失败的操作 ID 列表 */
  conflicts: string[];
}
