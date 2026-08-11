# EquipSense 落地就绪检查报告

> 基线生成时间：2026-06-14
> 检查范围：对照行业落地产品（PTC ThingWorx / Siemens MindSphere / IBM Maximo / Uptake），核验项目在实际工业场景部署使用的完备性。

> **当前状态说明（2026-08-11）**：本文保留历史功能盘点作为基线；当前质量门禁以仓库实际测试结果为准。最新验证包含事务 Outbox/Inbox、自动建单事务回滚、1298 个后端单元测试、163 个后端集成测试（163 个全部通过，真实 RabbitMQ 场景通过 `RUN_RABBITMQ_INTEGRATION_TESTS=true` 显式启用）、前端 355 个单元测试、真实 PostgreSQL/RabbitMQ 迁移核验、关键流程干净浏览器冒烟、后端/前端/边缘网关生产构建，以及当前提交三镜像的隔离 Production runtime smoke（440 个 E2E 通过、2 个条件跳过、0 失败）。当前 `docker/.env` 有 24 个配置问题，连同运行时 TLS/MQTT 文件检查共报告 27 个发布门禁问题，修复前不得上线。

## 一、项目规模

| 维度 | 数量 |
|------|------|
| 后端代码行（Core+Application+Infrastructure+WebAPI） | 51,534 行 |
| 后端 API 端点 | 135 个（25 个 Controller） |
| 前端页面 | 27 个 |
| 单元测试 | 1298 个（后端）+ 355 个（前端） |
| 集成测试 | 163 个用例（33 个文件） |
| E2E 测试 | 442 个用例（Playwright） |
| 压力测试 | 11 个脚本（k6） |

## 二、功能完备性核验（对照行业产品）

### ✅ 已具备并验证的能力

| 能力 | 实现情况 | 验证方式 |
|------|---------|---------|
| **多租户隔离** | Day 1 多租户，EF 全局查询过滤器，纵深防御中间件链 | 单测 + E2E |
| **RBAC 权限** | 5 角色（系统管理员/维保主管/技术员/操作员/观察者），权限矩阵 | 单测 |
| **设备管理** | CRUD + 批量导入/导出 + 类型模板 + 网关管理 | E2E |
| **实时监控** | MQTT 遥测 + SignalR 实时推送 + TimescaleDB 时序存储 | E2E |
| **三级告警引擎** | 阈值/组合/基线 + 30 分钟聚合防风暴 | 单测 + E2E |
| **AI 根因诊断** | 四级降级（L1 LLM → L2 规则 → L3 统计 → L4 ML.NET），数据质量联动置信度 | 单测 + 评估命中率 75% |
| **工单全流程** | 创建→派工→执行→验收→关闭，审批链，可插拔集成（钉钉/飞书/EAM/Webhook） | E2E |
| **知识库** | 规则双表（knowledge_rules / pending_rules）+ 版本管理 + 冲突检测 | 单测 |
| **审计日志全覆盖** ✨ | 全局 AuditActionFilter 自动拦截所有增删改 + 语义化标注 | E2E（Create/Update/Login 全记录） |
| **设备健康度 + OEE** ✨ | 加权评分（告警40%+状态30%+质量30%）+ 可用率×性能×质量 | 单测 + API |
| **告警多渠道通知** ✨ | 站内通知按运维角色分发 + 钉钉/飞书机器人主动推送 | E2E（按角色分发 + mock webhook 捕获 2 个推送请求 Status=OK） |
| **数据导出** ✨ | 告警/审计日志 CSV（UTF-8 BOM Excel 兼容） | E2E（文件内容验证） |
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
| 配置管理 | ✅（代码）/ ⚠️（当前环境） | `.env.example` 覆盖 PG/Redis/MQTT/JWT/MFA/PII/AutoMapper/LLM/SMTP/VAPID/TLS/监控；当前 `.env` 尚有 27 项未通过门禁 |
| 数据持久化 | ✅ | TimescaleDB 7天压缩 + 90天保留 + 连续聚合；工单附件使用 `attachments_data` 命名卷并纳入备份 |
| 迁移自动化 | ✅ | 启动自动 MigrateAsync + 种子初始化；迁移元数据可发现性有单测，MFA 迁移已在真实 PostgreSQL 验证 |
| 健康检查 | ✅ | 三级探针（startup/liveness/ready），含 PG+Redis+MQTT+LLM |
| 日志聚合 | ✅ | Serilog + Seq 结构化日志 |
| 指标监控 | ✅ | Prometheus /metrics + Grafana 仪表盘 + 业务指标采集；Jaeger trace 默认持久化到 Badger 卷 |
| CI/CD | ✅ | GitHub Actions（测试、NuGet/npm/Trivy 阻断扫描、backend/frontend/edgegateway 三镜像构建、Production 容器 runtime smoke、E2E、部署前置门禁、原子版本记录和失败回滚） |

## 四、安全设计核验

| 控制项 | 状态 |
|--------|------|
| HTTPS 强制 + HSTS | ✅ |
| JWT HMAC-SHA256（≥32 字符密钥，生产校验） | ✅ |
| IP 速率限制（全局 60/min，认证 10/min） | ✅ |
| 账户锁定（连续失败 5 次锁 15 分钟） | ✅ |
| XSS 输入消毒中间件 | ✅ |
| 安全响应头中间件 | ✅ |
| CORS（支持凭据，SignalR 必需） | ✅ |
| 密码 BCrypt 哈希 | ✅ |
| 用户联系方式 PII 加密 | ✅（AES-256-GCM 密文 + HMAC 盲索引；生产密钥和历史迁移仍需验收） |
| 密码重置防邮箱枚举 | ✅ |
| 审计日志全操作可追溯 | ✅ |
| 依赖漏洞扫描失败关闭 | ✅（NuGet/npm/Trivy；npm 漏洞源不可用时阻断） |
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
| 后端编译 | ✅ 0 警告（TreatWarningsAsErrors=true） |
| 后端代码质量 | ✅ 0 stub/TODO/NotImplemented |
| 后端单元测试 | ✅ 1298/1298 通过 |
| 后端集成测试 | ✅ 163 通过、0 跳过、0 失败（共 163 个；真实 RabbitMQ broker 场景需显式设置 `RUN_RABBITMQ_INTEGRATION_TESTS=true`） |
| 前端代码质量 | ✅ 0 TODO/FIXME/console.log |
| 前端类型检查 | ✅ 0 错误（TypeScript strict） |
| 前端单元测试 | ✅ 355/355 通过 |
| E2E 测试 | ✅ 开发栈与隔离 Production 镜像均执行默认 442 个场景：440 通过、2 跳过、0 失败（含五个角色与第二租户生产凭据覆盖契约）；main/tag 已接入 Production 全量门禁 |
| i18n 完整性 | ✅ 753 个键在中英文资源中完全对齐 |
| 生产构建 | ✅ PWA SW 产出 + precache 124 entries + 边缘网关镜像可复现构建 |
| 生产配置 | ✅ appsettings.Production.json |
| 依赖审计 | ✅ NuGet 全解决方案无已知漏洞；npm 全量审计 0 漏洞；审计服务失败会阻断 |
| 生产脚本/启动门禁 | ✅ 三镜像发布/滚动回滚/蓝绿切换、环境校验、独立凭据与 TLS/MQTT 证书 fail-closed 检查、应用种子账户启动校验、边缘网关租户/持久化路径校验、Production runtime smoke 与默认全量 E2E 门禁、备份、恢复与 CI 契约行为测试通过；本机隔离 smoke 已用当前提交本地构建的三镜像和固定 digest 基础层通过，固定 digest 的 CI runner 仍需按发布流水线验证 |

## 七、部署前检查清单

部署到生产环境前，逐项确认：

- [ ] `bash docker/validate-env.sh docker/.env --check-runtime-files` 以 0 退出；当前环境仍报告 27 个问题（24 个配置问题 + 3 个证书问题，包含重复键和非 Production 环境）
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
- [ ] 已按部署形态完成附件备份：单机纳入 `attachments_data` 卷，跨主机/多副本启用 S3 兼容存储并完成对象前缀恢复演练
- [ ] 已在隔离数据库和临时附件卷使用 `docker/restore.sh --confirm` 完成恢复演练，并记录 RTO/RPO
- [ ] 钉钉/飞书集成在租户 Settings 配置（如需机器人推送）
- [ ] 首次启动验证：`/health` 返回 Healthy，使用 `SEED_ADMIN_PASSWORD` 配置的管理员初始密码登录后立即改密（不再使用公开默认密码）

## 八、结论

**EquipSense 代码库已达到生产候选版本的质量基线，但当前部署环境尚未达到可上线状态。** 核心闭环、租户隔离、可靠消息、迁移、工单完整性、供应链 fail-closed、部署回滚和可观测性已有自动化证据；真实 PostgreSQL、RabbitMQ 和关键浏览器流程也已验证。

上线前仍必须清零当前部署检查的 27 个门禁问题（其中 `docker/.env` 配置问题 24 个、TLS/MQTT 运行时证书问题 3 个），注入 PII/TOTP 密钥、AutoMapper 许可证与全部生产凭据，替换正式 TLS/MQTT 证书，并完成隔离恢复演练、容量基线以及钉钉/飞书与 OPC UA/Modbus 的现场联调。Production 镜像全量 E2E 已在隔离环境通过并接入 main/tag 门禁，但不替代真实凭据、正式证书和现场环境验收。以上属于明确的发布条件，不应以“代码已实现”替代真实环境验收。
