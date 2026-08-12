# E2E 测试套件设计文档

> 本文档说明 `frontend/e2e-comprehensive/` 测试套件的设计原则、优化策略，
> 以及为什么「按数字精简到 270」不是一个正确的优化方向。

## 套件规模

| 分类 | 目录 | 测试数 | 说明 |
|------|------|--------|------|
| 环境就绪 | `00-setup/` | 10 | 健康检查 + 种子数据验证 + 生产凭据覆盖契约 |
| 认证流程 | `01-auth/` | 32 | 登录 / 注册 / 会话 / 强制改密 |
| CRUD | `02-crud/` | 191 | 17 个资源的完整增删改查 |
| 实时推送 | `03-realtime/` | 34 | SignalR / MQTT 告警推送 |
| 高级场景 | `04-advanced/` | 51 | 通知 / 导出 / 知识库 / AI 分析 / 网关接入 |
| 错误处理 | `05-error-handling/` | 46 | HTTP 4xx/5xx 前端处理 |
| 权限扩展 | `05-auth/` | 19 | RBAC 跨租户隔离 / 缺失页面降级 |
| 边界场景 | `06-edge-cases/` | 50 | 并发 / 空状态 / 极值 |
| 手动审计 | `99-manual-audit/` | 76 | 冒烟测试，**不在默认运行范围**（需显式指定路径） |
| **默认运行合计** | | **433** | 排除手动审计 |
| 全量合计 | | **509** | 含手动审计 |

## 为什么不「精简到 270」

路线图（#32）原始目标：从 512 精简到 270 消除重复。

**分析结论：按数字精简会损害回归安全网，不推荐。** 理由：

1. **重复率低**：跨 spec 的同名测试（如「应加载列表」）针对不同资源（设备/告警/工单…），
   属于逻辑上的独立断言，不是复制粘贴。合并会丢失单资源的失败定位能力。
2. **`99-manual-audit/` 是自动化冒烟测试**：76 个测试是有价值的端到端覆盖，
   已通过 `testMatch` 排除在默认运行外（仅在显式指定路径时运行），不构成「重复负担」。
3. **真正的性能瓶颈是登录开销，不是测试数量**：154 次 `beforeEach` UI 登录 × ~5s = ~13 分钟，
   占 E2E 总时长的最大单一开销。优化登录路径即可，无需删测试。

## 实际采用的优化：快速登录路径

### 问题

`helpers/auth.ts` 的 `loginAs` 默认走 UI 表单登录：

```typescript
await page.goto('/login');
await page.fill(用户名);
await page.fill(密码);
await page.click(登录);
await page.waitForURL(/dashboard/, { timeout: 30000 });
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);  // ← 仪表盘预热
```

每次登录 ~5 秒。154 次 `beforeEach` 登录 + 122 次 `getToken` API 登录 = ~23 分钟纯登录开销。

### 方案：`loginAsFast`（API 登录 + sessionStorage 注入）

```typescript
// 1. API 登录：Cookie 自动写入 page 浏览器上下文
await page.request.post('/api/v1/auth/login', { data: { username, password } });

// 2. addInitScript 注入 sessionStorage('user')，AuthGuard 同步放行
await page.addInitScript((userJson) => {
  sessionStorage.setItem('user', userJson);
}, userJson);

// 3. 直接进仪表盘（跳过 UI 表单 + networkidle + 2s 预热）
await page.goto('/dashboard');
```

**原理**：
- `page.request.post` 在 page 所属浏览器上下文执行，后端 `Set-Cookie` 写入的
  `access_token` / `refresh_token`（HttpOnly）自动存入上下文
- 后续 `page.goto` 自动带上这两个 Cookie
- `addInitScript` 在每次新文档加载前执行，保证刷新/导航后 sessionStorage 仍有效

**兜底机制**：若快速路径未能到达仪表盘（Cookie 时序竞争等），自动降级到 UI 登录，
保证测试稳定性。快速路径失败不会导致测试失败，只是失去加速收益。

### 启用方式

```bash
# 本地手动启用
export E2E_FAST_LOGIN=1
npx playwright test

# CI 已在 ci.yml 默认启用（E2E 测试 job）
```

环境变量 `E2E_FAST_LOGIN=1` 时，`loginAs` 自动走快速路径；未设置时走 UI 路径（与真实用户行为一致）。

### 生产镜像验收凭据

E2E 默认只为开发/集成测试回退到公开测试凭据。验收生产镜像时，必须把后端
`SEED_ADMIN_PASSWORD` 等五个种子密码以同样的临时值注入 Playwright：

```bash
E2E_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
E2E_LEAD_PASSWORD="$SEED_LEAD_PASSWORD" \
E2E_TECH_PASSWORD="$SEED_TECH_PASSWORD" \
E2E_OPERATOR_PASSWORD="$SEED_OPERATOR_PASSWORD" \
E2E_VIEWER_PASSWORD="$SEED_VIEWER_PASSWORD" \
npx playwright test e2e-comprehensive
```

跨租户隔离用例还要求在隔离的验收数据库中显式创建第二租户账户，并把同一临时密码注入测试进程：

```bash
export E2E_TENANT2_PASSWORD='<隔离验收用的独立临时强密码>'

EQUIPAI_ISOLATED_E2E=true \
SEED_DEMO_DATA=true \
SEED_TENANT2_ACCOUNT=true \
SEED_TENANT2_PASSWORD="$E2E_TENANT2_PASSWORD" \
dotnet run --project src/EquipAI.WebAPI

npx playwright test e2e-comprehensive/05-error-handling/permission-denied.spec.ts \
  --grep '跨租户数据隔离验证'
```

不要在生产业务数据库中开启 `SEED_TENANT2_ACCOUNT`；该账户只用于隔离的验收/CI 数据库。测试代码不会打印这些值；
`00-setup/credentials.spec.ts` 会锁定五个角色和第二租户密码的环境变量覆盖行为。

本地将 Vite 与 ASP.NET Core 分开启动时，健康检查和 Swagger 必须直连后端，示例：

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 \
PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:8080 \
E2E_FAST_LOGIN=1 npx playwright test e2e-comprehensive
```

生产 Docker/Nginx 同源部署时可省略 `PLAYWRIGHT_API_BASE_URL`，测试会使用 `PLAYWRIGHT_BASE_URL`。

### Production 容器运行时 Smoke Gate

`tests/scripts/production-runtime-smoke.sh` 使用当前提交实际构建的 backend/frontend/edgegateway
镜像和 Production 配置启动 PostgreSQL、Redis、Mosquitto、RabbitMQ、backend、frontend，
验证迁移/种子、观察者账户真实登录与 `/auth/me` 受保护接口、startup/liveness/ready 探针、HTTPS、Nginx `/health` 和 `/api/` 反向代理。
该脚本运行在临时隔离 Compose 项目中，Smoke Compose 会显式设置 `SEED_DEMO_DATA=full`，因此固定演示设备、遥测、告警、工单和测试租户只存在于本次验收数据库；普通 Production Compose 默认使用 `false`，不会引入示例设备。
PR 默认执行上述快速门禁；main 推送和版本 tag 额外设置 `SMOKE_RUN_E2E=true`，在同一组
Production 镜像中执行默认 433 个业务 E2E；当前仅保留 1 个有明确架构原因的条件跳过点，本次隔离 Production smoke 实际为 432 通过、1 跳过、0 失败，确保发布镜像本身通过完整用户流程验收。
完整验收会在隔离数据库中通过真实 MFA 注册接口初始化系统管理员、维保主管和跨租户隔离测试账户的 TOTP，
再由 Playwright 完成登录验证；不会关闭生产 MFA 策略。第二租户账户仅由 `SMOKE_RUN_E2E=true` 临时创建。启动 E2E 前置脚本还会用真实登录会话完成种子账户改密，验证后端 `must_change_password` 门禁、刷新令牌吊销和新会话签发；测试只在进程内传递轮换后的临时密码，不通过伪造 `sessionStorage` 或关闭后端安全策略来制造登录态。非 E2E smoke 也会对观察者账户执行一次真实改密，再访问受保护 API。

本地执行完整 Production 验收：

```bash
SMOKE_RUN_E2E=true bash tests/scripts/production-runtime-smoke.sh
```

### 本地协议链路验收（Simulator → EdgeGateway → 后端）

需要验证 Modbus TCP 模拟设备、边缘网关采集和 MQTT 入云链路时，使用本地开发依赖
集成脚本。脚本不会终止宿主机已有进程，但会使用本机的 8080、8081、5432、6379、1883
和 5020 端口；管理员密码与 PostgreSQL 密码必须显式传入：

```bash
E2E_ADMIN_PASSWORD='<本地管理员密码>' \
DEV_PG_PASSWORD='<本地 PostgreSQL 密码>' \
bash tests/e2e/run-integration.sh
```

脚本只在 `Development` 环境运行，并把临时日志写入 `/tmp/equipsense-e2e`；不要把正式生产
凭据或生产数据库用于该验收。

定位 Production E2E 的并发或单个用例问题时，可以复用同一套隔离容器并缩小执行范围；
参数通过数组传递，不会经过 shell 二次解释：

```bash
SMOKE_RUN_E2E=true \
SMOKE_E2E_WORKERS=1 \
SMOKE_E2E_GREP='Access Token 过期自动刷新' \
bash tests/scripts/production-runtime-smoke.sh
```

Smoke 使用临时随机凭据及临时证书，不替代正式许可证、正式域名证书、现场协议、容量基线和
真实生产数据恢复演练；版本发布 job 必须先通过该启动门禁及 Production 全量 E2E。

### 哪些用例不能用快速路径

**专门测试登录/注册流程的用例**必须用 `loginViaUI`（真实 UI 表单）：

- `01-auth/login.spec.ts` — 测试登录页交互
- `01-auth/register.spec.ts` — 测试注册流程
- `01-auth/force-password-change.spec.ts` — 测试强制改密
- 任何验证「登录表单元素可见性」「错误密码提示」的用例

这些用例的目标就是验证 UI 登录本身，用快速路径会绕过被测对象。

## v1.3.0 HttpOnly Cookie 迁移后的断言修复

v1.3.0 安全强化后，`access_token` / `refresh_token` 从 sessionStorage 移到 HttpOnly Cookie，
前端 JS 完全无法读取。`sessionStorage.getItem('token')` 永远返回 `null`。

**27 处失效断言已全部修复**，分布在：

| 文件 | 失效断言数 | 修复方式 |
|------|-----------|----------|
| `00-setup/seed-data.spec.ts` | 1 | `isLoggedIn(page)` |
| `01-auth/login.spec.ts` | 5（含 2 个 test.skip） | `getAuthState` / `verifyAuthCookie` / `isLoggedIn` |
| `01-auth/session.spec.ts` | 9（含 5 个 test.skip） | `getToken(page)` + JWT 解析 / `isLoggedIn` |
| `01-auth/register.spec.ts` | 2 | `isLoggedIn(page)` |
| `05-error-handling/api-errors.spec.ts` | 2 | `getAuthState` |

### 新增的认证状态辅助函数（`helpers/auth.ts`）

```typescript
// 读取浏览器侧可观察的认证状态（user + tokenExpiryMs）
getAuthState(page): Promise<{ user, tokenExpiryMs }>

// 用 user 信息判断是否已登录（替代旧的 token !== null 判断）
isLoggedIn(page): Promise<boolean>

// 用 /auth/me 探活，验证 HttpOnly Cookie 中的 access_token 是否有效
verifyAuthCookie(page): Promise<APIResponse>
```

### 为什么有些测试用 test.skip 而非删除

`login.spec.ts` 测试 6/7、`session.spec.ts` 测试 5/6 标记为 `test.skip`，保留代码并附注释说明跳过原因：

- 这些测试构造「伪造过期 Token 注入 sessionStorage」来模拟过期，
  但 v1.3.0 后 token 不在 JS 可读范围，前端无法识别伪造 token 的签名/过期。
- 真正的过期处理由后端 401 响应 + HttpOnly Cookie 中的 refresh_token 自动刷新保障，
  已在其他会话测试（session.spec 2/3/4）覆盖。
- 保留代码 + 跳过注释，是为了让未来若引入前端 token 解析（如 JWT 库）时可以快速恢复。

## 运行命令

```bash
cd frontend

# 默认运行（433 个测试，排除手动审计）
npx playwright test e2e-comprehensive

# 启用快速登录路径
E2E_FAST_LOGIN=1 npx playwright test e2e-comprehensive

# 运行特定目录
npx playwright test e2e-comprehensive/02-crud/devices-crud.spec.ts

# 含手动审计的全量运行（518 个测试）
npx playwright test e2e-comprehensive/99-manual-audit

# 调试模式
npx playwright test --debug
```

## 配置要点

- **CI 配置**：`e2e-comprehensive/playwright.config.ts`，8 个 project（setup/auth/crud/realtime/advanced/errors/auth-extended/edge），全部依赖 setup project
- **并发**：`fullyParallel: false`（业务测试有数据依赖），`workers: 2`（CI）
- **重试**：CI 1 次重试，本地 0 次
- **超时**：单测 60s，断言 15s（CI 冷启动补偿）
- **前端入口**：`frontend/playwright.config.ts` 仅 re-export，实际配置在 `e2e-comprehensive/`
