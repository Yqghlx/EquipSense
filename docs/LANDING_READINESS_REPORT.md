# EquipSense 落地就绪检查报告

> 基线生成时间：2026-06-14（历史基线）
> 检查范围：对照行业落地产品（PTC ThingWorx / Siemens MindSphere / IBM Maximo / Uptake），核验项目在实际工业场景部署使用的完备性。

> **当前状态说明（2026-08-13）**：本文保留历史功能盘点作为基线；当前质量门禁以仓库实际测试结果为准。本轮补充完成设备对比页面首版闭环：独立 `/device-comparison` 路由与侧边栏入口、设备类型/指标/时间窗口/2–5 台设备筛选、统计快照、权限控制、错误与缓存刷新失败提示、样本不足与空态区分、中英文资源，以及后端可选重复 `deviceIds` 过滤契约（不传时保持同类型全量对比旧语义）；同时完成推送订阅、通知偏好和知识规则导出的当前用户/租户纵深隔离，并修复 Vite 8 下 PWA Service Worker 构建的 `inlineDynamicImports` 弃用警告。按仓库命令实测，当前全量后端单测 1675/1675、默认后端集成 191 总数（185 通过、6 跳过、0 失败）、Release build 0 warning、生产脚本测试通过；前端 `check:i18n` 校验 1104 个键完全对齐，Vitest 85 个测试文件/490 个测试全部通过，生产构建 precache 133 entries 且无 PWA 弃用警告。以上结果仅证明代码、脚本和当前门禁通过，不代表项目已全面生产就绪：真实生产凭据与正式 TLS/MQTT 证书、生产等价备份恢复演练、MFA/PII 密钥治理、现场 OPC UA/Modbus 联调、容量/压测与最终上线门禁仍未完成。当前 `docker/.env` 仍有 24 个配置问题，连同运行时 TLS/MQTT 文件检查共报告 27 个发布门禁问题，修复前不得上线。

> **报表导出安全增量（2026-08-13）**：运营 CSV 报表的设备编码、设备名称和指标名现在统一执行 RFC 4180 字段转义，正确保留逗号、引号和换行；文本字段以 `= + - @`（含前导空白）开头时自动按文本导出，阻断 Excel 公式注入。新增回归测试覆盖危险文本，后端全量单元测试更新为 1675/1675；API 路径和报表章节保持不变。

> **租户配额一致性增量（2026-08-13，最新候选状态）**：用户创建、普通设备创建、快速注册和批量导入现在都在服务层执行配额兜底；关系型数据库按真实有效设备/启用用户数量进行事务内原子预留，修复计数漂移、并发超卖、重复导入误报、批量导入因历史计数器偏大而误拒绝和 `0=不限` 误判，并统一返回 403 配额语义。真实 PostgreSQL 双事务实验证明，把 `FOR UPDATE` 和计数放在同一条 `UPDATE` 中仍会受语句旧快照影响而超卖；当前实现先用独立语句锁定租户行，再以新的 READ COMMITTED 快照计数和更新。批量导入也在去重查询前取得同一把锁，旧实现的 8 路同文件并发曾稳定复现为 7 个 HTTP 500 + 1 个 200，修复后为 8 个 200 且仅新增 1 台设备。当前后端全量单元 1675/1675、集成测试为 185 通过/6 跳过/0 失败、Release 构建 0 警告/0 错误。

> **E2E 复验状态（2026-08-13，当前镜像绿灯）**：首次用当前配额实现运行 433 个 E2E 时为 356 通过、76 失败、1 条架构性跳过。实时后端堆栈确认共同根因不是隔离容量耗尽，而是原生配额 SQL 使用了未加引号的 `tenants.id`，生产 PostgreSQL 的租户主键实际为区分大小写的 `"Id"`；SQLite 关系型测试不区分该大小写，因而此前假绿。修正大小写引用后先得到 432 通过、1 跳过的基线；随后新增“并发创建不得超卖”和“同文件并发导入不得 500”两条真实 PostgreSQL 回归，并按上述双语句锁定方案修复。最终重建当前 backend/frontend/edgegateway 三镜像，以 2 workers 运行 **435 条 E2E，434 通过、1 个架构性条件跳过、0 失败（16.3 分钟）**。`int.MaxValue` 容量仍严格限制在 `SEED_DEMO_DATA=full` 且 `EQUIPAI_ISOLATED_E2E=true` 的临时隔离租户，普通生产租户保持真实套餐上限。

> **备份恢复完整性增量（2026-08-13）**：`backup.sh` 现在为每个成功批次原子生成 `backup-manifest_*.tsv`，记录启用组件的文件名、大小和 SHA-256；`restore.sh --confirm` 在停服、Docker 或 AWS 副作用前验证清单，串批次、篡改和缺少清单的确认恢复均 fail-closed，历史备份仅可显式使用 `--legacy`。`production-scripts-test.sh all`、脚本语法检查和当前提交的真实隔离 Docker 演练均已通过：演练完成 PostgreSQL custom dump、附件卷恢复和恢复后健康检查，RTO 为 2 秒；Redis 因该场景未启用而明确跳过。真实生产等价存储、密钥管理、Redis 恢复和正式 RTO/RPO 演练仍属于部署侧上线前置条件。

> **本轮发布门禁补充（2026-08-13）**：`production-readiness.sh` 已支持按顺序叠加基础 Compose 与生产 overlay，并接入 `deploy-production.sh` 的部署前静态检查、目标版本/同 tag/回滚后的全量运行态检查；目标版本只有在应用探针和全量 readiness 均通过后才写入版本记录，回滚 readiness 失败保持严重失败。`bash tests/scripts/production-scripts-test.sh readiness|deploy|setup|ci|all`、Shell 语法检查和差异检查均通过。真实工作区复核仍以非零退出报告 27 个问题，未修改 `docker/.env`。
> **生产文件边界补充（2026-08-13）**：`validate-env.sh --check-runtime-files` 现在对所有直接挂载或执行的生产运行时文件拒绝符号链接；`compose-production.sh` 对 `.env`、Compose 文件和校验器入口也执行同样的拒绝，避免通过 `PRODUCTION_COMPOSE_FILE` 或运行时配置链接解析到非预期路径。新增两个负向回归场景，生产脚本 `setup` 门禁通过。

> **WAF 规则热更新增量（2026-08-13）**：新增受约束的版本化 JSON loader、不可变快照 provider、目录监听/防抖、非法版本保留旧快照、生产缺失或配置不安全时 fail-closed，以及不记录请求正文/查询参数的结构化审计；内置 SQL 注入、路径遍历、命令注入和 XSS 基线始终启用。规则通过生产 Compose 只读挂载，文件权限为容器非 root 用户可读且组/其他用户不可写。全量后端门禁随后暴露宿主清理阶段的重复释放缺陷，已补充回归测试并使 provider 释放幂等；当时的 WAF 聚焦单测 68/68、后端单元 1615/1615、默认集成 183 总数（177 通过、6 跳过、0 失败）、Release 构建 0 warning/0 error、生产脚本契约均通过；当时包含最终 WAF 修复的后端镜像运行 `SMOKE_RUN_E2E=true`，433 个 E2E 为 432 通过、1 个架构性条件跳过、0 失败。正式生产规则制品的来源审查、审批、最小权限确认和一次有效更新/回滚演练仍未完成，不得将本段隔离环境证据视为生产验收。
> **审批权限边界增量（2026-08-13）**：审批记录的创建清理、通过、驳回、详情和待审批列表均显式使用调用方 `tenantId`；模板指定审批人会落到审批记录，待审批列表按租户、角色和指定用户过滤；通过/驳回在服务层校验 JWT 角色与当前审批步骤角色及指定用户，角色或用户不匹配统一返回 403，缺失角色 fail-closed；全局异常中间件有 403 映射回归。增加跨租户、角色越权、指定审批人越权、缺失角色和错误映射回归；聚焦审批服务测试 17/17、HTTP 授权集成测试 7/7、异常映射测试 18/18 通过，后端全量单元基线更新为 1675/1675，默认集成为 191 总数（185 通过、6 跳过、0 失败）。
> **边缘网关生命周期增量（2026-08-13）**：修复初始设备配置在 HostedService 注册与启动阶段重复应用的问题；`DeviceManager` 对动态配置整批变更加串行门，避免刷新竞态重复停止/替换采集器；删除设备、配置变更和网关停机均等待采集任务结束并释放 OPC UA/Modbus 协议适配器；MQTT 上传收到停机取消时立即传播且不再写入离线缓冲。新增设备管理器并发/资源释放、采集器幂等释放和上传取消回归测试。当前后端单元 1675/1675、默认集成 191 总数（185 通过、6 跳过、0 失败）、Release 构建 0 warning/0 error、生产脚本测试通过；重建当前边缘网关镜像后执行隔离 `SMOKE_RUN_E2E=false`，镜像启动、迁移、完整演示数据、边缘缓存、健康探针、HTTPS、API 反向代理和 Jaeger OTLP trace 接收均通过。该验证仍不替代真实 PLC/OPC UA 现场联调。
> **告警邮件可靠投递增量（2026-08-13）**：`alert.email` 已接入 `email_notification_deliveries` 持久化队列，告警站内通知和邮件任务同一次保存；worker 采用数据库租约、重试退避、死信、停用/偏好取消、保留期清理和 Prometheus pending/sent/failure/dead-letter 指标。同一告警事件使用 `EventId` 作为收件人级幂等键并由数据库唯一索引兜底，通知保存失败会继续抛出并交由 RabbitMQ Inbox 重试，不再错误确认；发送前会按 token 原子续租，租约最短 30 秒，SMTP 单次发送上限 10 秒。SMTP 未配置时不领取任务、不消耗重试次数；前端只开放告警邮件，工单/系统邮件明确禁用。普通 SMTP 仍存在“服务器已接受、进程在标记 Sent 前退出”的至少一次投递窗口，无法承诺严格 exactly-once；真实 SMTP 凭据、TLS/发件域名和到达率验收仍属于部署侧上线前置条件。

> **CI 发布失败关闭增量（2026-08-13）**：main 的 `latest` 发布现在等待后端、前端、Production runtime smoke、备份恢复、K6 和 E2E；版本标签发布等待后端、前端、Production runtime smoke、备份恢复和 K6。backend/frontend/edgegateway 先加载到 runner，三张镜像全部通过 HIGH/CRITICAL 扫描后，直接逐标签推送同一批本地镜像，不再执行第二次 Buildx；Release 创建已拆为独立最小权限 job，部署等待镜像发布和 Release 均成功；CI 与 CodeQL 共 38 次 Action 调用全部固定为官方完整 commit SHA。生产脚本 CI 契约、Shell 语法、YAML 静态检查和差异检查通过；真实 GitHub tag run 仍需首次验收。
>
> **CI 同引用并发收口增量（2026-08-13）**：`.github/workflows/ci.yml` 新增 workflow 级 `concurrency`，按 workflow + event + ref 分组；同一分支、PR、手动运行或 tag 内串行，手动运行与 push/PR 隔离；非版本 tag 的分支/PR/手动运行取消旧活动运行，版本 tag 不取消正在运行的验收，避免旧 main run 在新提交之后回写 `latest`。新增生产脚本契约测试锁定该策略；远端取消事件和 GHCR 最终 digest 仍需在首次真实 tag/main run 观察。

> **CI 最小权限与 Action 供应链修复增量（2026-08-13）**：镜像发布 job 保持 `contents: read` + `packages: write`，GitHub Release 已拆到仅有 `contents: write` 的 `create-release` job，部署显式等待该 job；三张镜像扫描通过后直接推送已扫描本地标签；`ci.yml` 与 `codeql.yml` 当前 38 次 Action 调用全部固定完整 SHA，其中包含接触生产 SSH 私钥、GHCR 和 CodeQL 写权限的步骤。首次真实 tag run、远端取消事件观察和部署环境门禁仍需验收。

> **依赖与工具链复核（2026-08-13）**：使用 NuGet 官方源执行全解决方案传递漏洞审计，`EquipAI.sln` 内 6 个源码项目和 2 个测试项目均无已知漏洞；npm 生产依赖审计与完整锁文件审计均以 0 退出，完整报告覆盖 914 个解析依赖且所有严重级别均为 0。审计源失败仍按既有脚本 fail-closed。另确认 `global.json` 当前解析为 SDK 8.0.419：`EquipAI.sln` 可正常列出全部 8 个项目；已移除当前 SDK 无法读取的遗留 `EquipAI.slnx`，CI、文档和开发入口现在统一使用 `.sln`。

> **独立复审与待决项（2026-08-13）**：针对并发导入、通知持久化异常、事件重放幂等和邮件租约到期窗口完成第二轮独立静态复审，复审结论为没有仍未解决的 Critical/Important 问题。随后对 CI 发布制品同一性、Release 最小权限、Action 引用和同引用并发策略完成修复后复核，当前本地契约测试确认四项结构不变量；标准 Compose 默认注入 `http://jaeger:4317`，后端 Production 启动门禁拒绝空 OTLP 端点，隔离 Production runtime smoke 显式验证 Jaeger OTLP 链路。真实 GitHub tag/main run 尚未执行，不能把本地证据等同于远端发布验收；正式部署仍需确认外部 OTLP 端点可达和存储可靠性。

> **本轮可观测性补充（2026-08-13）**：标准 Compose 默认注入 Jaeger OTLP 端点，后端新增 Production OTLP 启动门禁，空端点不再回退 Console exporter；新增 9 个单元测试、应用 wiring 契约和 Compose 默认值契约。Development/Testing 保留 Console exporter 便于本地调试，正式部署仍需验证外部 OTLP 端点可达和 trace/metric 持久化。

## 一、项目规模

| 维度 | 数量 |
|------|------|
| 后端代码行（Core+Application+Infrastructure+WebAPI） | 51,534 行 |
| 后端 API 端点 | 135 个（25 个 Controller） |
| 前端页面 | 30 个 |
| 单元测试 | 1675/1675 个（后端）+ 490/490 个（前端） |
| 集成测试 | 191 个用例（36 个文件） |
| E2E 测试 | 435 个用例（Playwright；当前隔离 Production 镜像 434 通过、1 跳过、0 失败） |
| 压力测试 | 13 个 JS/TS 文件（11 个 K6 场景 + 2 个共享 config） |

## 二、功能完备性核验（对照行业产品）

### ✅ 已具备并验证的能力

| 能力 | 实现情况 | 验证方式 |
|------|---------|---------|
| **多租户隔离** | Day 1 多租户，EF 全局查询过滤器，纵深防御中间件链 | 单测 + E2E |
| **RBAC 权限** | 5 角色（系统管理员/维保主管/技术员/操作员/观察者），权限矩阵 | 单测 |
| **设备管理** | CRUD + 批量导入/导出 + 类型模板 + 网关管理 | E2E |
| **实时监控** | MQTT 遥测 + SignalR 实时推送 + TimescaleDB 时序存储 | E2E |
| **设备对比分析** ✨ | 独立设备对比页面 + 同类型 2–5 台设备筛选 + 统计快照 + 权限/错误/缓存/空态 + 双语资源 + 后端 `deviceIds` 过滤契约 | 设备对比聚焦后端单测/集成测试 + 全量 Vitest |
| **三级告警引擎** | 阈值/组合/基线 + 30 分钟聚合防风暴 | 单测 + E2E |
| **AI 根因诊断** | 四级降级（L1 LLM → L2 规则 → L3 统计 → L4 ML.NET），数据质量联动置信度 | 单测 + 评估命中率 75% |
| **工单全流程** | 创建→派工→执行→验收→关闭，审批链，可插拔集成（钉钉/飞书/EAM/Webhook） | E2E |
| **知识库** | 规则双表（knowledge_rules / pending_rules）+ 版本管理 + 冲突检测 | 单测 |
| **审计日志全覆盖** ✨ | 全局 AuditActionFilter 自动拦截所有增删改 + 语义化标注 | E2E（Create/Update/Login 全记录） |
| **设备健康度 + OEE** ✨ | 加权评分（告警40%+状态30%+质量30%）+ 可用率×性能×质量 | 单测 + API |
| **告警多渠道通知** ✨ | 站内通知按运维角色分发 + 钉钉/飞书机器人主动推送 + 可重试告警邮件队列 | 单测/集成测试（邮件队列租约、重试、死信、事务一致性）+ E2E（机器人 mock） |
| **数据导出** ✨ | 告警/审计/运营报表 CSV（UTF-8 BOM、RFC 4180 转义和 Excel 公式注入防护） | 单测 + E2E（文件内容验证） |
| **密码重置** ✨ | 忘记密码→邮件重置链接→重置密码，防邮箱枚举，token 一次性 | E2E（全流程验证） |
| **PWA 离线** ✨ | Service Worker + offline.html fallback + manifest 图标 | 构建产出 + preview 验证 |

> ✨ 标记为本轮新增/修复的能力

### 🐛 实测发现的潜伏 Bug（均已修复）

| Bug | 根因 | 影响 | 提交 |
|-----|------|------|------|
| AlertEventHandler FindAsync 租户过滤 | 后台无 HttpContext，全局租户过滤器让 FindAsync 返回 null | 告警的 SignalR 推送 + 通知分发历史上从未执行 | `59a3752` |
| JSON 反序列化大小写敏感 | `TryDeserialize` 用默认 JsonSerializer，camelCase 的 webhookUrl 反序列化为 null | 即使走到推送代码，WebhookUrl 空判断提前 return，钉钉/飞书 HTTP 请求从未发出 | `2755d2a` |
| MFA 迁移未被 EF 发现 | 迁移类缺少 `MigrationAttribute` 与 `DbContextAttribute` 元数据 | 登录访问 `mfa_recovery_codes` 时 PostgreSQL 报列不存在，接口返回 500 | 元数据回归测试 + 真实 PostgreSQL 迁移/历史表双重核验 |
| 设备详情遥测请求风暴 | React Query key 每次渲染都包含新的 `Date` 实例 | 单次进入页面产生约 60 个遥测请求并触发 429 | 稳定查询键 + 查询函数内计算时间范围；单测和浏览器网络记录验证 |
| 工单派工与时间线失真 | 前端请求字段错误且 E2E 使用硬编码 UUID；详情页未消费真实日志，后端未校验被派工人 | 自动化测试假绿、页面显示 UUID/“暂无记录”、可写入无效用户引用 | 同租户活跃用户校验 + 批量姓名映射 + 真实日志时间线 + E2E 契约修复 |
| npm 漏洞源失败时审计假绿 | `npm audit --json` 的错误对象可被解析，旧脚本把缺少 `vulnerabilities` 当作零漏洞 | CI 在漏洞源不可用时可能错误放行供应链门禁 | 完整报告结构校验 + 离线错误行为测试，改为 fail-closed |
| 设备/网关状态监控快照竞态 | 查询超时对象与更新状态之间可能收到遥测或心跳，旧逻辑仍按旧快照改为离线并发送通知 | 正常恢复通信的设备或网关被误显示为离线，造成运维误判和告警噪声 | 使用 `Status` 与最后通信时间的条件更新，并仅通知实际受影响对象；SQLite 触发器回归测试覆盖查询后恢复场景 | 本轮修复 |
| 外部集成响应误判成功 | 创建推送的 `null`、状态推送的吞错以及状态路由固定传 `null` | 创建/状态通知不重试，EAM 无法定位外部工单，推送日志伪成功，通知可能静默丢失 | 创建与状态同步显式区分成功结果；空响应/`false` 按指数退避重试，最终写入 `Failed`；状态路由复用最近成功创建日志中的 ExternalId；新增 5 个回归用例 | 本轮修复 |
| 告警机器人响应误判成功 | 钉钉/飞书推送只记录 HTTP 请求完成，未校验非 2xx 或钉钉业务错误码 | 网络故障或平台拒绝会被当成成功，严重告警可能静默丢失 | 同时校验 HTTP 与业务响应，失败最多重试 3 次并记录最终错误；新增 3 个回归用例 | 本轮修复 |
| 通知中心孤儿与重复通知 | SignalR 实时推送服务把租户广播写成 `UserId=Guid.Empty`，告警触发又由专用服务重复写入 | 通知中心按用户查询时看不到离线/离网关通知，在线链路还会出现重复告警，停用账号也可能收到通知 | 告警触发持久化职责归一到告警通知服务；解除、SLA 升级、设备/网关离线按活动运维角色展开用户通知；新增角色、停用用户和 Guid.Empty 回归测试 | 本轮修复 |
| 通知链取消信号被吞 | SignalR 接口没有取消令牌，事件处理器和后台监控的宽泛异常隔离会把停机取消当成普通推送失败 | 容器停机或消息处理超时时仍可能继续写通知、发 Web Push 或执行后续副作用，消息总线无法正确重投/停止 | 取消令牌贯穿 SignalR 接口、事件处理器、SLA/设备/网关后台监控和数据库保存；`OperationCanceledException` 明确继续传播 | 本轮修复 |

这两个 bug 叠加导致**历史上告警的多渠道通知功能从未真正工作过**。现已修复并通过 mock webhook 端到端验证（告警触发 → 站内通知按角色分发 + 钉钉 ActionCard + 飞书交互卡片，mock 服务器捕获 2 个 POST 请求，后端 Status=OK）。

### ⏳ 代码已就绪、待真实环境联调

| 能力 | 代码状态 | 阻塞原因 |
|------|---------|---------|
| 钉钉/飞书机器人真实推送 | AlertNotificationService 完整实现 + 单测覆盖 | 需真实机器人 Webhook URL + Secret |
| OPC UA / Modbus 真实接入 | 边缘网关 IProtocolAdapter 接口 + 适配器框架 | 需真实 PLC 设备连接参数 |

## 三、生产部署就绪度

| 维度 | 状态 | 详情 |
|------|------|------|
| 容器化 | ✅ | docker-compose.yml（12 个长期运行服务 + Jaeger 卷初始化服务）+ 后端/前端/边缘网关多阶段 Dockerfile |
| 反向代理 | ✅ | Nginx（TLS 终止、静态资源、API/WebSocket 代理） |
| 配置管理 | ✅（代码）/ ⚠️（当前环境） | `.env.example` 覆盖 PG/Redis/MQTT/JWT/MFA/PII/AutoMapper/LLM/SMTP/告警邮件队列/VAPID/TLS/监控；`compose-production.sh` 已接入启动前门禁；当前 `.env` 尚有 27 项未通过门禁 |
| 数据持久化 | ✅ | TimescaleDB 7天压缩 + 90天保留 + 连续聚合；工单附件使用 `attachments_data` 命名卷并纳入备份 |
| 迁移自动化 | ✅ | 启动自动 MigrateAsync + 种子初始化；迁移元数据可发现性有单测，MFA 迁移已在真实 PostgreSQL 验证 |
| 健康检查 | ✅ | 三级探针（startup/liveness/ready），含 PG+Redis+MQTT+LLM |
| 日志聚合 | ✅ | Serilog + Seq 结构化日志 |
| 指标监控 | ✅ | Prometheus /metrics + Grafana 仪表盘 + 33 个后端自定义指标（含告警邮件 pending/sent/failure/dead-letter）；证书到期时间/剩余天数/读取状态已接入告警；Jaeger trace 默认持久化到 Badger 卷 |
| CI/CD | ⚠️（仍待真实发布验收） | 质量门禁、同一批本地镜像扫描后直接推送、独立最小权限 Release、38/38 Action 完整 SHA、同 ref 并发收口、Production smoke、E2E、K6 和部署回滚脚本已具备；首次真实 tag run、远端取消事件观察和部署环境门禁仍待完成 |

## 四、安全设计核验

| 控制项 | 状态 |
|--------|------|
| HTTPS 强制 + HSTS | ✅ |
| JWT HMAC-SHA256（≥32 字符密钥，生产校验） | ✅ |
| IP 速率限制（全局 60/min，认证 10/min） | ✅ |
| 账户锁定（连续失败 5 次锁 15 分钟） | ✅ |
| XSS 输入消毒中间件 | ✅ |
| WAF 规则基线与受限热更新 | ✅（内置基线不可关闭；外部规则 loader/provider、生产启动门禁、原子快照和脱敏审计已验证；正式制品审批与更新/回滚演练待完成） |
| 安全响应头中间件 | ✅ |
| CORS（支持凭据，SignalR 必需） | ✅ |
| 密码 BCrypt 哈希 | ✅ |
| 用户联系方式 PII 加密 | ✅（AES-256-GCM 密文 + HMAC 盲索引；生产密钥和历史迁移仍需验收） |
| 密码重置防邮箱枚举 | ✅ |
| 审计日志全操作可追溯 | ✅ |
| 依赖漏洞扫描失败关闭 | ✅（NuGet/npm/固定 SHA Trivy；npm 漏洞源不可用时阻断，三张镜像全部扫描成功后才发布） |
| AutoMapper 15+ 许可证门禁 | ✅（代码与部署脚本）；⚠️ 当前生产密钥待配置 |

## 五、历史提交记录（功能基线）

| 提交 | 类型 | 说明 |
|------|------|------|
| `05bc091` | feat | **Phase 4 完成**：mTLS + WAF + ML.NET 验证 + 缓存优化 + 等保报告 |
| `8572fee` | feat | OPC UA + Modbus 模拟器联调 |
| `27a70e8` | feat | 飞书应用机器人集成 + 真实群推送验证 |
| `6d26b3b` | fix | 告警卡片设备名替代 UUID |
| `c2ff482` | fix | 前端生产构建失败（tsc -b 6 错误） |
| `f2d7286` | fix | 压测脚本 config.js 缺 import http |
| `fd1ee9b` | docs | 部署手册合并 |
| `814ce93` | docs | 落地就绪报告更新 |
| `feeb620` | feat | 审计日志 + 健康度/OEE + 多渠道通知 + 数据导出 |
| `59a3752` | fix | AlertEventHandler FindAsync 租户过滤 bug（潜伏 bug，E2E 发现） |
| `cac150f` | feat | 前端审计日志页面 + 告警 CSV 导出按钮 |
| `c23c5bc` | feat | 密码重置流程（忘记/重置密码） |
| `3db52b5` | fix | PWA 缺失图标补齐 |
| `082b60d` | fix | SMTP 环境变量接入 docker-compose |
| `af62527` | docs | 落地就绪检查报告 |
| `65457a0` | feat | 用户管理页面（补 useUsers hook 断层） |
| `648b56d` | feat | 告警规则在线启停用（toggle） |
| `cb8952c` | feat | 设备详情页健康度展示 + 刷新 |
| `5408971` | fix | i18n 键对齐补齐（660/660，0 差异） |
| `248b8d8` | fix | GatewayMonitorPage 硬编码中文修复 |
| `66dcc6b` | fix | SettingsPage + GatewayDevicesPage 硬编码中文修复 |
| `6a3201d` | test | E2E 测试补全（10 个场景：密码重置/审计/用户/规则启停） |
| `7c510c6` | feat | appsettings.Production.json 生产配置 |
| `2755d2a` | fix | JSON 反序列化大小写 bug（钉钉/飞书推送从未真正发送，E2E 实测发现） |

## 六、质量门禁

| 门禁 | 结果 |
|------|------|
| 后端编译 | ✅ `EquipAI.sln` 0 警告（TreatWarningsAsErrors=true）；失效的 `.slnx` 遗留入口已移除，当前 SDK 只有一个受支持的解决方案入口 |
| 后端代码质量 | ✅ 0 stub/TODO/NotImplemented |
| 后端单元测试 | ✅ 全量 1675/1675 通过；审批权限聚焦 17/17、异常映射 18/18；边缘网关生命周期聚焦 18/18 通过；告警通知/邮件聚焦 31/31 通过；运营报表聚焦 10/10 通过 |
| 后端集成测试 | ✅ 默认 191 总数：185 通过、6 条件跳过、0 失败；邮件告警事务聚焦通过；审批 HTTP 授权集成 7/7 通过 |
| 前端代码质量 | ✅ 0 TODO/FIXME/console.log |
| 前端类型检查 | ✅ 0 错误（TypeScript strict） |
| 前端单元测试 | ✅ 85 个测试文件、490/490 通过 |
| E2E 测试 | ✅ 当前 Production 三镜像完整 435 项验收为 434 通过、1 个架构性条件跳过、0 失败（2 workers，16.3 分钟） |
| i18n 完整性 | ✅ 1104 个键在中英文资源中完全对齐 |
| 生产构建 | ✅ PWA SW 产出 + precache 133 entries + 边缘网关镜像可复现构建；已修复 Vite 8 下 PWA `inlineDynamicImports` 弃用 warning |
| 生产配置 | ✅ appsettings.Production.json |
| WAF 规则热更新 | ✅ WAF loader/provider、请求匹配、配置 fail-closed、结构化脱敏审计、只读挂载和规则契约均已验证；正式制品审批与更新/回滚演练仍为部署侧条件 |
| 依赖审计 | ✅ 2026-08-13 NuGet 官方源复核 8/8 项目无已知漏洞；npm 生产与全量 914 项解析依赖均为 0 漏洞；审计服务失败会阻断 |
| 生产脚本/启动门禁 | ⚠️ 三镜像发布/滚动回滚/蓝绿切换、环境校验、独立凭据与 TLS/MQTT 证书 fail-closed 检查、全部运行时挂载/执行文件与 Compose 入口符号链接拒绝、证书生命周期指标/告警契约、应用种子账户启动校验、边缘网关租户/持久化路径校验、WAF 规则只读挂载/外部规则强制加载、Production runtime smoke、带批次 SHA-256 清单的备份恢复和 CI 契约行为测试通过；当前三镜像默认全量 E2E 为 434 通过、1 个架构性条件跳过、0 失败；本轮 smoke 显式启动 Jaeger 初始化/查询服务，并通过 `/api/services` 与 `/api/traces` 验证 trace 接收；本机隔离 smoke 已用当前工作区本地构建的三镜像和固定 digest 基础层通过，固定 digest 的 CI runner 仍需按发布流水线验证 |

> 2026-08-13 Task 5 分层验证摘要：WAF 聚焦单测 70/70；审批权限聚焦 17/17、异常映射 18/18；边缘网关生命周期聚焦 18/18；告警通知/邮件聚焦 31/31；运营报表聚焦 10/10；后端全量单元 1675/1675；默认后端集成 191 总数（185 通过、6 跳过、0 失败）；`dotnet build EquipAI.sln -c Release --no-restore -m:1 -p:UseSharedCompilation=false` 0 warning/0 error；`bash -n docker/backup.sh docker/restore.sh tests/scripts/production-runtime-smoke.sh tests/scripts/production-scripts-test.sh` 和 `bash tests/scripts/production-scripts-test.sh all` 通过；前端类型检查、Lint、i18n、490 个 Vitest 用例和生产构建全部通过。随后以本轮重建的后端镜像及当前三镜像完成真实 PostgreSQL Production runtime smoke：Jaeger 初始化服务正常完成，后端 trace 可通过 `/api/services` 与 `/api/traces` 查询；完整 E2E 基线仍为 435 个用例、434 通过、1 个架构性条件跳过、0 失败。本轮新增运营报表 CSV 的 RFC 4180 转义与 Excel 公式注入防护回归；本轮未修改 `docker/.env`。

> 本轮安全边界复核提交：`4210c31` 将推送订阅注册/注销绑定当前用户和租户，`cf81c57` 将通知偏好读写绑定当前用户和租户，`c2acbd1` 将知识规则 JSON/CSV 导出绑定显式租户参数；各项均有负向回归测试和独立审查证据。

## 七、部署前检查清单

部署到生产环境前，逐项确认：

- [ ] `bash docker/validate-env.sh docker/.env --check-runtime-files` 以 0 退出；当前环境仍报告 27 个问题（24 个配置问题 + 3 个证书问题，包含重复键和非 Production 环境）
- [x] 生产 Compose 直接启动入口已 fail-closed：`docker/compose-production.sh up/start/restart/build/pull` 在门禁失败时不会调用 Docker，并拒绝符号链接的 `.env`、Compose 文件和校验器入口；`ps/logs/exec/stop/down` 使用无秘密恢复环境仍可用于故障处置
- [ ] `docker/.env` 已创建，PG/Redis/RabbitMQ/MQTT/Seq/Grafana 与五个种子账户密码均为独立强随机值；校验器不得报告凭据复用
- [ ] `JWT_SECRET` ≥ 32 字符（`openssl rand -base64 48`）
- [ ] `TOTP_ENCRYPTION_KEY` 已由密钥管理系统保存并注入
- [ ] `PII_ENCRYPTION_KEY` 已由密钥管理系统保存并注入，并完成历史联系方式迁移与密钥恢复演练
- [ ] `AUTOMAPPER_LICENSE_KEY` 已完成许可证审核并由密钥管理系统注入
- [ ] `LLM_API_KEY` 已配置（否则 AI 诊断降级为 L2 规则匹配）
- [ ] `SMTP_*` 已配置（否则密码重置邮件发不出）
- [ ] `VAPID__PUBLICKEY/PRIVATEKEY` 已生成（`npx web-push generate-vapid-keys`）
- [ ] `DOMAIN` 指向实际域名（影响 HSTS/Cookie）
- [ ] TLS 证书已挂载（`SSL_CERT_PATH` / `SSL_KEY_PATH`）
- [ ] `GRAFANA_PASSWORD` 已修改
- [x] WAF 规则 loader/provider、生产配置门禁、只读挂载和当前提交隔离 smoke 已通过；正式规则制品仍须完成来源审查、审批、最小权限确认和一次有效更新/回滚演练
- [ ] 已按部署形态完成附件备份：单机纳入 `attachments_data` 卷，跨主机/多副本启用 S3 兼容存储并完成对象前缀恢复演练
- [x] 仓库级隔离恢复实演已通过：`bash tests/backup-restore-rehearsal.sh` 真实执行 `backup.sh` 与 `restore.sh --confirm`，批次清单校验、数据库、附件卷和恢复后健康检查均成功，记录 RTO 为 2 秒；Redis 因场景未启用而跳过。这不替代生产存储、Redis、密钥和容量条件下的正式演练
- [x] 已在隔离数据库和临时附件卷使用 `docker/restore.sh --confirm` 完成恢复演练并记录 RTO；生产环境仍须补做 Redis 及正式 RPO/RTO 验收
- [ ] 钉钉/飞书集成在租户 Settings 配置（如需机器人推送）
- [ ] 首次启动验证：`/health` 返回 Healthy，使用 `SEED_ADMIN_PASSWORD` 配置的管理员初始密码登录后立即改密（不再使用公开默认密码）

## 八、结论

**EquipSense 代码库已达到生产候选版本的质量基线，但当前部署环境尚未达到可上线状态。** 核心闭环、租户隔离、可靠消息、迁移、工单完整性、供应链 fail-closed、部署回滚和可观测性已有自动化证据；真实 PostgreSQL、RabbitMQ 和关键浏览器流程也已验证。

上线前仍必须清零当前部署检查的 27 个门禁问题（其中 `docker/.env` 配置问题 24 个、TLS/MQTT 运行时证书问题 3 个），注入 PII/TOTP 密钥、AutoMapper 许可证与全部生产凭据，替换正式 TLS/MQTT 证书，并完成隔离恢复演练、容量基线以及钉钉/飞书与 OPC UA/Modbus 的现场联调；代码侧的 Release 权限、Action SHA、扫描/发布制品同一性、同 ref 并发和 Production 空 OTLP 行为已收口，仍需真实 GitHub tag/main run 验收以及正式 OTLP 端点/存储验收。当前 Production 三镜像已在隔离环境达到 434 通过、1 个架构性条件跳过、0 失败，但这不能替代真实凭据、正式证书、真实外部服务和现场设备验收。以上属于明确的发布条件，不应以“代码已实现”替代真实环境验收。
