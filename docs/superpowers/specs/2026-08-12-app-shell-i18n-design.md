# 应用壳层反馈与无障碍文案国际化设计

## 目标

统一应用启动、路由错误、根级错误、离线、SignalR 实时连接、PWA 安装和导航控件的中英文提示，让用户在正常操作和故障恢复场景中都能理解当前状态与下一步动作。

## 范围

- 从 `App.tsx` 抽取可测试的页面加载、会话恢复和路由错误反馈组件。
- 将 `Header`、`Sidebar`、`OfflineIndicator`、`RealtimeIndicator`、`InstallPrompt` 和 `RootErrorBoundary` 的用户可见文案接入 i18n。
- 新增应用壳层英文回归测试，覆盖正常状态、离线/重连状态、安装提示和错误恢复动作文案。
- 保持认证恢复、路由跳转、实时连接和 PWA 安装行为不变。

## 设计决策

1. 应用反馈组件独立放在 `components/layout/AppFeedback.tsx`，采用函数组件调用 `useTranslation`，便于测试并避免 App 内部闭包文案无法覆盖。
2. `RootErrorBoundary` 保留 class 捕获机制，通过 `withTranslation` 注入 `t`；错误恢复按钮仍执行原有整页刷新和回到 Dashboard 行为。
3. 用户可见键按 `app.*`、`layout.*` 和现有 `realtime.*` 命名；技术日志仍保持中文，不把日志内容作为用户界面翻译。
4. 实时状态配置只保存翻译键，不保存中文 fallback，避免英文界面回退到中文。

## 验证标准

- 新增壳层英文测试在改造前因硬编码中文而失败。
- 改造后壳层测试和既有前端测试全部通过。
- TypeScript、Lint、i18n 键覆盖、生产构建和 `git diff --check` 全部通过。
