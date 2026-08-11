# PWA 认证 API 缓存隔离设计

## 背景

历史版本的 Service Worker 曾把全部 `/api/v1/` 响应放入同一个 `StaleWhileRevalidate` 缓存。浏览器缓存键不会包含 HttpOnly Cookie，因此同一浏览器先后登录不同用户或租户时，可能读到上一个会话的旧 API 响应；对写接口使用旧响应策略也会让用户看到与服务端不一致的状态。

## 决策

- 所有 `/api/v1/` 请求显式使用 `NetworkOnly`，不把认证业务数据写入 Service Worker Cache Storage。
- 保留 App Shell、字体、图片等静态资源缓存，以及现有 IndexedDB 离线操作队列；离线写操作仍由队列负责，不能依赖 API 响应缓存。
- 使用 `vite-plugin-pwa` 的 `injectManifest` 构建 `frontend/src/sw.ts`，由自定义 Service Worker 实际处理导航回退、旧 `api-cache` 清理和 Background Sync。
- Background Sync 标签携带 `tenantId:userId`；同步前通过 `/api/v1/auth/me` 校验当前 Cookie 仍属于该归属键。页面 Hook 使用 `AbortController` 和活动归属检查中止旧会话同步。
- 会话恢复前等待旧 `api-cache` 清理；登出或身份切换时同步清空 TanStack Query 缓存，避免内存缓存跨会话复用。
- 保留 `/api` 和 `/hubs` 的导航回退排除规则，避免离线 HTML 或旧页面冒充接口响应。

## 验收

1. 前端构建配置和生成的 Service Worker 中 API 路由为 `NetworkOnly`，不存在 API 的 `StaleWhileRevalidate`。
2. 生成的 Service Worker 监听 `sync`，使用归属键调用队列，并在同步前校验当前 Cookie；激活时清理旧 `api-cache`。
3. 会话恢复等待旧缓存清理失败门禁；登出/身份切换清空 Query 缓存，页面同步任务支持中止和活动归属检查。
4. 生产脚本回归测试锁定上述安全契约，防止后续为了“离线体验”重新缓存多租户 API。
5. Vitest、TypeScript、Lint、i18n 和生产构建全部通过。
6. 文档明确离线能力来自静态 App Shell 与会话绑定的操作队列，而不是缓存认证 API 数据。
