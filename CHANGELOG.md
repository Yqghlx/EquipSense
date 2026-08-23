# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Security

- 将本地数据库、JWT 和网关认证配置改为占位符，并为生产环境增加网关密钥安全校验；真实凭据通过环境变量或 .NET User Secrets 注入。
- 移除生产 Compose 中 RabbitMQ、Seq 和 Grafana 的公开弱密码默认值，缺少强密码时拒绝解析配置。
- 生产环境检测未解析的连接串占位符并在启动阶段失败，避免服务以字面量凭据反复重试基础设施连接。
- 加固 MQTT 密码文件初始化：拒绝密码目录符号链接，使用同目录临时文件生成并在成功后原子替换，生成器或磁盘失败时保留当前认证文件，避免凭据文件被截断或写入非预期路径。
- 修复工单外部集成可靠性：钉钉 HTTP 200 但 `errcode` 非 0 时不再误记为成功，创建和状态同步会进入路由器重试；钉钉、飞书、EAM 和通用 Webhook 配置统一兼容管理端小驼峰 JSON 字段。
- 运营 CSV 报表对设备编码、设备名称和指标名执行 RFC 4180 转义，并对 Excel 公式前缀做文本保护，避免用户数据破坏报表结构或被 Excel 当作公式执行。
- 将 FMEA 故障模式库接入 L2 知识规则诊断：按当前租户优先、RPN 降序最多读取 3 条启用关联条目，输出故障模式、原因、影响、检测方式和维护建议；补充规则优先级回归、租户隔离过滤、关联查询索引迁移和演示种子关联。

 ### Fixed
 
+- 修复遥测时间戳无未来上限的问题：MQTT 与 HTTP 入口现在拒绝超前服务器超过 10 分钟的数据（历史数据仍不限，支持断网补传），防止设备时钟错误或伪造消息以"未来时间"占据 latest 查询、基线与聚合的时序头部。
 - 修复设备列表搜索只过滤当前页的问题：关键词现在发给服务端，按编码、名称、型号不区分大小写匹配，并与分页总数一致。
- 修复设备类型和关键等级在英文界面直接显示 PascalCase 枚举的问题：列表、详情、表单和下拉现在使用中英文可读标签，提交值仍是后端枚举。
- 修复告警详情抽屉把触发时间重复标成确认/解决时间的问题：API 现在返回真实 `acknowledgedAt`/`resolvedAt`，抽屉按时间线展示；没有对应时间时不再伪造。
- 修复设备详情采集配置、工单附件和审批面板失败时静默结束或误关弹窗的问题：启停/保存/删除/上传/通过/驳回现在展示中英文成功或失败提示，失败时保留表单，加载失败与空态分开。
- 修复设备新增/编辑/删除、告警确认/解决、工单创建与状态流转失败时页面静默无反馈的问题：这些入口现在展示中英文忙碌/成功/失败/空态，告警操作按后端 `Active`/`Acknowledged` 状态匹配。
- 修复工单创建事件未进入钉钉/飞书/EAM/Webhook 路由的问题；Webhook 与 EAM 状态同步把 HTTP 2xx 但业务码失败的响应按失败处理并交给路由器重试。
- 修复模板快登把未裁剪编码和超长模板名写入设备表的问题：编码入库前 Trim，模板类型超过 50 字符时返回明确错误。
- 修复生产环境校验漏检 `change-me` 占位符、证据文件权限按十进制误判，以及隔离 smoke 把未启动的 Seq/Prometheus 当成运行态失败的问题。
- 修复审计日志 CSV 导出失败时页面静默吞错的问题：导出期间按钮会禁用并显示忙碌状态，失败时展示双语可操作提示，请求结束后始终恢复重试能力。
- 统一设备、告警、工单、审计日志和运营报表五个 CSV 导出入口的忙碌状态、失败 Toast、`aria-busy` 和单飞请求保护；保留筛选参数、日期范围校验和既有导出 API 不变。
- 修复工单飞书集成把 HTTP 200 业务错误误记为成功的问题：Webhook 和应用消息模式均校验 `code`/`StatusCode`，失败响应交由路由器重试，避免工单通知静默丢失。
- 修复告警飞书机器人对空响应、非法 JSON 和缺少业务码的放行问题：告警与工单统一只接受明确的 `code: 0` 或 `StatusCode: 0`，异常响应会按告警策略重试并记录最终失败。
- 修复 EAM 创建接口把 HTTP 2xx 的空响应或无外部工单号 JSON 当作成功的问题：只有能提取可定位的外部工单号才记为成功，异常响应交由路由器重试；保留明确 `text/plain` 工单号兼容。
- 加固 SMTP 配置门禁：`validate-env.sh` 与生产验收均拒绝非法端口、发件人地址和 TLS 开关；非法配置不再被视为已配置，邮件 worker 会保留任务等待修复；生产验收对缺失配置返回 `BLOCKED`，对格式错误返回 `FAIL`。
- 修复 MQTT 遥测可靠性降级：边缘网关发布端使用 QoS 1 时，后端订阅端现在显式请求 QoS 1，并以完全来自 `Mqtt__ClientIdPrefix` 的稳定 ClientId + 持久会话保留失败重投所需的 Broker 状态；首次连接和断线重连均显式恢复订阅，避免 MQTTnet 默认 QoS 0、容器机器名变化或临时会话在网络抖动时静默丢失遥测。
- 加固 MQTT 数据库交付边界：MQTT 消费路径等待遥测批次完成持久化，数据库失败时不再吞掉异常，回调会设置 `ProcessingFailed` 阻止 QoS ACK；同一消息内的多指标并行等待，避免串行放大处理延迟。普通 HTTP 入队仍保持异步 202 语义。
- 补齐遥测落库丢弃告警：`equipai_telemetry_dropped_total` 现在触发 `TelemetryPersistenceDropped` Critical 告警，并补充 Prometheus 语义回归和运维排查步骤，避免数据库重试耗尽只停留在指标而无人响应。
- 加固运营报表查询边界：统一将输入时间转换为 UTC，拒绝开始时间不早于结束时间或超过 366 天的范围，并通过 API 集成回归验证返回明确 400，避免大范围报表请求造成数据库和内存压力。
- 修复运营报表日期型 `endDate` 只统计到当天零点的问题；现在使用半开时间区间并包含用户选择的结束日全天，精确到时分秒的输入仍按指定时间截止。
- 加固设备详情历史遥测查询：时间范围限制为最多 7 天，数据库侧最多返回最近 10000 个数据点，并在 HTTP 层对非法时间顺序或超范围请求返回明确 400，避免高频设备请求把海量时序数据加载到应用内存。
- 加固日志保留清理：关系型数据库现在使用 `ExecuteDeleteAsync` 在数据库侧集合删除过期审计日志和通知；仅非关系型测试提供程序使用 1000 条批量回退，避免长期运行时把历史日志全部加载到应用内存。
- 优化设备对比查询：窗口内均值、最小值、最大值和数据量改为数据库侧聚合，最新值单独按设备批量读取；保留原有统计语义，避免一年窗口的高频遥测全部加载到应用内存。
- 优化趋势预警查询：单指标和租户批量趋势均改为数据库侧按设备、指标、小时聚合，并保留原始样本计数以维持最小样本门槛；应用层只处理小时序列，避免 7 天高频原始遥测造成内存峰值。
- 加固数据质量评估资源边界：完整性评分先用数据库计数，准确性/一致性/有效性/时效性仅加载最近 10000 条样本；报告仍保留时间窗口内完整样本总数，避免高频设备质量计算造成内存峰值。
- 优化运营报表资源边界：设备概览、告警统计、工单统计和告警指标分布改为数据库聚合，健康度排名只读取最低 10 台设备；保留既有 CSV 内容和统计语义，避免 366 天窗口把大量实体加载到应用内存。
- 优化仪表盘与 OEE 资源边界：设备、活跃告警、工单状态和 7 天趋势改为数据库计数聚合，按租户本地日期边界统计并保留夏令时语义，避免高数据量租户把原始统计行加载到应用内存。
- 加固知识规则 JSON/CSV 导出：显式按创建时间和 ID 稳定排序，并限制单次导出最多 10000 条，避免规则规模增长导致导出请求无界占用内存。
- 优化工单统计资源边界：状态/类型/优先级、租户本地日期趋势、平均完成时长和 SLA 均改为数据库聚合；PostgreSQL 使用参数化 `EXTRACT(EPOCH)` 计算完成时长，避免统计周期内的原始工单全部进入应用内存。
- 优化业务指标采集资源边界：活跃告警和工单按标签在数据库侧计数，避免每 30 秒把全部原始行加载到后台内存；停机取消令牌现在贯穿采集查询。
- 加固健康度定时重算资源边界：设备按 500 台分页，近期告警按设备/严重级别/状态数据库聚合，批次提交后清理 EF 跟踪器；每设备遥测仍限制最近 100 条，并保留停机取消语义，避免大租户一次性加载设备和告警历史。
- 加固 SLA 扫描与概览资源边界：活动工单按 UUID 稳定分页，每批最多 500 条并独立提交/清理跟踪器；概览按优先级/状态数据库聚合，再用固定 `COUNT` 查询拆分 SLA 时间边界，避免大租户一次性加载活动工单。
- 加固设备与网关状态监控资源边界：两个 30 秒后台任务均按 UUID 稳定分页，每批最多 500 个超时对象，通知查询限制在当前批次；通知取消异常不再被宽泛异常处理吞掉，确保停机可及时结束。
- 加固后台租户扫描资源边界：健康度重算、SLA 升级和订阅到期任务均按 UUID 每批最多读取 500 个租户；订阅到期状态与配额改为数据库侧批量条件更新，避免大规模租户实体一次性进入 EF 跟踪器。
- 加固遥测保留清理资源边界：活跃租户的保留策略按 UUID 每批最多读取 500 条，逐租户删除继续显式限定设备所属租户，并保留停机取消传播。
- 补齐设备详情、网关、工单、知识库、用户、设置、通知、登录和审计等高风险前端页面及 Hook/组件行为回归；550 个 Vitest 测试全部通过，覆盖率门禁恢复为语句 81.99%、行 84.43%、函数 80.14%、分支 68.77%。
- 修复工单附件删除的可靠性边界：元数据删除与 `WorkOrderAttachmentDeletedEvent` 通过事务 Outbox 原子登记，物理存储失败由 RabbitMQ 重试/死信接管，控制器不再保留第二套同步删除路径。
- 修复遥测批量入库与 `TelemetryReceivedEvent` Outbox 登记之间的提交窗口：两者现在在同一关系型数据库事务和执行策略中完成，Outbox 写入失败或提交结果不明确时整批回滚/重试，避免出现“遥测已存在但告警未评估”的孤儿数据。
- 告警聚合窗口改为 Redis 原子计数，支持多后端实例共享 30 分钟防风暴窗口；Redis 故障时保留本地降级路径。
- 修复 Playwright E2E 辅助函数缺少公开导出导致测试用例无法发现的问题。
- 修复边缘网关断网缓冲并发竞态：LocalBuffer 的容量检查、FIFO 驱逐和入队改为原子操作，SQLite 共享连接的写入、回放、清理和释放改为异步串行化，避免并发采集时队列超容或本地缓冲连接异常。
- 修复 CloudUploader 离线回放竞态：单例网关把积压读取、MQTT 发布、发送标记和清理串行化，避免多个设备采集器在网络恢复时重复发布同一条遥测；回放等待支持停机取消，发布失败保留积压记录。
- 修复网关状态/连接代理吞取消异常：请求取消或宿主停机时继续传播 `OperationCanceledException`，不再被宽泛异常处理误报为“网关离线”或回退为 JSON 配置校验；新增三条控制器/服务层取消传播回归。
- 修复边缘网关健康端点在停机期间吞掉协议连接测试取消：宿主取消继续传播，不再转换为普通连接失败响应或记录误导性请求处理错误；新增真实 `HttpListener` 停机回归。

### Changed

- FMEA 表单将手工输入知识规则 UUID 改为按设备类型加载的可访问选择器，支持当前租户和系统预置规则、清除关联以及编辑停用规则保留；新增只读规则摘要接口和前后端租户隔离回归。
- README 和运行文档同步四级 AI 分析链及正式模拟器入口。
- ECharts 改为按需注册，减少生产前端包体积。
- 生产事件总线默认改为 RabbitMQ 4.3.4；v2 拓扑按处理器隔离主队列、重试和死信，发布启用 mandatory、Publisher Confirms 与通道互斥。
- RabbitMQ 故障纳入 readiness 而不影响 liveness；CI 使用真实 broker 验证多处理器隔离、有限重试、并发确认发布和重启恢复。
- RabbitMQ 真实集成测试改用专用 `/equipai_test` vhost；CI 在测试前初始化 vhost、测试账号权限和 v2 dead-letter policy，management API 断连同时按连接名和 vhost 限定目标，避免共享 broker 测试越界。
- 生产发布新增统一只读验收包，生成脱敏 `checks.tsv`/`summary.md`，并由 Production runtime smoke、滚动部署和 CI 共享；生产 profile 对配置、运行时服务和外部依赖缺少证据时 fail-closed。
- 发布验收对目标镜像执行完整 tag 边界匹配，支持 `tag@digest`，拒绝把较长 tag 子串误认为目标版本，避免错误制品绕过部署门禁。
- OPC UA/Modbus 验收改为由正式模拟器驱动的非交互流程；模拟器缺失时显式跳过或失败，不再因测试直接返回造成假绿。

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
