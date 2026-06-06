# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] - 2026-06-06

### Added

#### 测试大幅扩充（786 个测试，零失败）
- 后端单元测试 442 个（+103）：工单生命周期、状态转换矩阵、自动创建/分析/集成处理器、审批链、推送通知
- 后端集成测试 86 个（+1）：全部控制器覆盖
- 前端单元测试 258 个（+72）：9 个新 hook 测试 + 4 个组件测试
- 前端 E2E 测试 344 个用例（30 个 spec 文件）

#### Docker 生产配置
- `docker/setup.sh` 一键配置脚本（环境变量、SSL 证书、MQTT 认证、文件完整性验证）
- `docker/generate-cert.sh` TLS 证书生成脚本（支持自定义域名和有效期）
- `docker/setup-mosquitto.sh` MQTT 密码文件创建脚本
- Grafana 自动供给配置（Prometheus 数据源 + Dashboard 加载器）

### Fixed

#### CI/CD 加固
- ESLint 检查不再允许静默失败（移除 `|| true`）
- Docker 构建和 E2E 测试任务移除 `continue-on-error`
- 修复 Docker job 缺失的 steps 配置

#### 代码质量
- 修复 74 个 ESLint 错误（E2E 测试未使用变量、源码 React Compiler 兼容性）
- 最终状态：0 个错误，1 个已知 warning（React Hook Form watch 兼容性）
- 修复 DeviceSetupPage 渲染阶段调用 Date.now() 的纯度问题
- 修复 useOfflineQueue 变量声明顺序问题

### Changed

#### 前端性能优化
- Vendor 分包策略：主 bundle 从 757KB 降至 266KB
- ECharts（1.1MB）、React（218KB）、SignalR（54KB）、表单库（93KB）独立 chunk
- 利用浏览器长期缓存，第三方库变更频率低

## [1.1.0] - 2026-06-03

### Added

#### CI/CD 增强
- 四阶段流水线：后端测试 → 前端测试 → Docker 构建推送 → E2E 测试
- Docker 镜像自动推送到 GitHub Container Registry（GHCR）
- E2E 自动化测试（PostgreSQL + Redis 服务容器 + Playwright）
- 前端 ESLint 检查步骤

#### 性能优化
- 前端路由懒加载：15 个业务页面改为 `React.lazy` 动态加载，减少首屏包体积
- TanStack Query 缓存优化：staleTime 30s → 5min，关闭窗口聚焦自动刷新
- 后端 OutputCache：设备列表 2min、告警规则 5min、租户配置 10min 缓存策略
- DataQualityService N+1 修复：指标质量报告从串行查询改为 `Task.WhenAll` 并行计算

### Security

- SystemController 添加 `[Authorize]` 认证，移除 machineName/runtime/commitHash 指纹信息
- 集成测试更新：验证未认证请求返回 401

### Tests

- 后端：339 单元 + 86 集成 = 425 通过
- 前端：186 单元通过
- 总计 611 个测试，零失败

## [1.0.1] - 2026-06-03

### Security

- 首次登录强制修改密码：默认 admin 账户 `MustChangePassword = true`，前端弹出不可关闭的改密对话框
- JWT 刷新令牌：实现完整 Refresh Token 流程（Redis 存储 + 令牌轮换），前端 axios 拦截器自动续期
- JWT_SECRET 启动校验：生产环境验证密钥长度 ≥ 32 且非占位符，不满足则拒绝启动
- Docker 配置加固：Redis 强制密码认证、Mosquitto 禁用匿名访问、.env.example 安全提示
- SystemController 移除 `AllowAnonymous`，删除机器名/运行时等指纹信息
- PostgreSQL 自动备份脚本 `docker/backup.sh`（pg_dump + gzip，保留 7 天）

## [1.0.0] - 2026-06-03

### Added

#### 核心功能
- 设备管理 CRUD、类型模板、批量导入、设备配置向导
- 四级告警引擎（阈值 → 组合 → 基线 → ML），含聚合防风暴机制
- 工单管理（独立模式 + 智能派工），支持钉钉/飞书/Webhook/EAM 集成
- AI 根因分析引擎，四级自动降级（预测 → 统计 → 规则 → LLM）
- 知识库管理（规则 + 案例双表），AI 生成候选规则需专家验证
- 多租户 SaaS 架构，RBAC 五角色权限体系（SystemAdmin / MaintenanceLead / Technician / Operator / Viewer）
- 实时数据推送（SignalR 按租户分组隔离）
- MQTT 遥测数据接入（Mosquitto Broker）
- Web Push 通知（VAPID 协议）
- 离线支持（Service Worker + IndexedDB 队列 + PWA）

#### 边缘网关
- OPC UA 适配器（OPC Foundation SDK）
- Modbus TCP/RTU 适配器（FluentModbus）
- 数据管线：采集 → 标准化 → 环形队列 → SQLite 断网缓存 → MQTT/HTTPS 上传

#### 可观测性
- Seq 日志聚合
- Prometheus 指标采集
- Grafana 可视化仪表盘（自动配置数据源）

#### 安全
- JWT 认证 + 刷新令牌
- HSTS / CSP / Permissions-Policy / X-Frame-Options 安全头
- HTTPS 终止（Nginx + TLS）
- RBAC 权限中间件
- 租户隔离中间件
- 用量配额限制

#### 部署
- Docker Compose 一键部署（8 个服务）
- TimescaleDB 自动创建超级表 + 压缩 + 保留策略
- 生产环境启动脚本（等待依赖就绪 + 自动迁移）
- 三级健康探针（startup / liveness / ready）
- 版本信息端点 `/api/v1/system/info`

#### 测试（647 个测试全部通过）
- 后端单元测试 339 个（中间件、Hub、服务）
- 后端集成测试 85 个（11 个控制器）
- 前端单元测试 186 个（15 个 hook + 4 个组件）
- E2E 业务流程测试 37 个（设备、告警、工单、知识库）

#### CI/CD
- GitHub Actions 流水线（后端测试 + 前端测试 + Docker 构建验证）
- k6 API 性能压测脚本

### Technical Stack
- **后端**: C# / .NET 8 WebAPI + EF Core 8 + Npgsql + TimescaleDB
- **前端**: React 19 + TypeScript (strict) + Vite + shadcn/ui + TailwindCSS + TanStack Query + Zustand
- **数据库**: PostgreSQL 16 + TimescaleDB + Redis 7
- **消息**: MQTT (MQTTnet + Mosquitto)
- **AI**: LLM (Qwen via DashScope) + ML.NET (SrCnn 异常检测)
- **测试**: xUnit + Vitest + Playwright
- **日志**: Serilog + Seq
- **监控**: Prometheus + Grafana
