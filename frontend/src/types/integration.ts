/** 集成配置通用接口 */
export interface IntegrationConfig {
  enabled: boolean;
  [key: string]: unknown;
}

/** 钉钉集成配置 */
export interface DingTalkIntegration extends IntegrationConfig {
  webhookUrl?: string;
  secret?: string;
  atMobiles?: string[];
  messageType?: 'markdown' | 'actionCard';
  detailUrlTemplate?: string;
}

/** 飞书集成配置 */
export interface FeishuIntegration extends IntegrationConfig {
  appId?: string;
  appSecret?: string;
  webhookUrl?: string;
  approvalCode?: string;
  receiveOpenIds?: string[];
}

/** Webhook 集成配置 */
export interface WebhookIntegration extends IntegrationConfig {
  url?: string;
  secret?: string;
  headers?: Record<string, string>;
  bodyTemplate?: string;
}

/** EAM 集成配置 */
export interface EamIntegration extends IntegrationConfig {
  type?: 'maximo' | 'sap_pm' | 'custom';
  endpoint?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  enableSync?: boolean;
}

/** 所有集成的集合 */
export interface IntegrationsMap {
  dingtalk?: DingTalkIntegration;
  feishu?: FeishuIntegration;
  webhook?: WebhookIntegration;
  eam?: EamIntegration;
}

/** 集成测试结果 */
export interface IntegrationTestResult {
  type: string;
  success: boolean;
  message: string;
  durationMs: number;
  details?: string;
}
