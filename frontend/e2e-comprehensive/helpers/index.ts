/**
 * 测试辅助模块统一导出
 *
 * 将所有 helper 子模块的公共函数统一导出，方便测试文件按需引入。
 * 使用方式：import { login, createTestDevice, captureErrors } from '../helpers';
 */

// 认证相关
export {
  BASE_URL,
  login,
  loginAs,
  loginAsFast,
  loginViaUI,
  getToken,
  getTokenForRole,
  getAuthState,
  isLoggedIn,
  verifyAuthCookie,
} from './auth';

// API 请求封装
export {
  createTestDevice,
  createDeviceViaAPI,
  deleteDeviceViaAPI,
  createThresholdRule,
  createCompositeRule,
  createBaselineRule,
  createAlertRuleViaAPI,
  deleteAlertRuleViaAPI,
  triggerAlertViaAPI,
  getAlertsViaAPI,
  createTestWorkOrder,
  createWorkOrderViaAPI,
  transitionWorkOrder,
  assignWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  closeWorkOrder,
  createKnowledgeRule,
  createPendingRule,
  approvePendingRule,
  rejectPendingRule,
} from './api';

export type { CreatePendingRuleOptions } from './api';

// 自定义断言
export {
  isIgnorableError,
  captureErrors,
  expectNoJSErrors,
} from './assertions';

// 导航辅助
export {
  navigateViaSidebar,
  gotoAlertRules,
  gotoAlertCenter,
  gotoKnowledge,
  gotoRegister,
  gotoDeviceDetail,
  gotoWorkOrderDetail,
  gotoSetupStep,
} from './navigation';

// 实时功能辅助
export {
  startSimulator,
  stopSimulator,
  waitForMQTTConnection,
} from './realtime';

export type { SimulatorOptions } from './realtime';

// 种子数据
export {
  TEST_TENANT_ID,
  getSeedData,
  saveSeedData,
} from './seed-data';

export type { SeedData } from './seed-data';

// 数据清理
export {
  cleanupTestDevices,
  cleanupTestWorkOrders,
  cleanupTestAlertRules,
} from './cleanup';
