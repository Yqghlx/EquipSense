# EquipSense 运维手册 (Runbook)

> 本文档面向运维人员，覆盖日常告警处理、故障排查、容量扩容、备份恢复等运维场景。
> 部署相关请参考 [DEPLOY.md](./DEPLOY.md)，架构设计请参考 [FINAL_TECHNICAL_DESIGN.md](./FINAL_TECHNICAL_DESIGN.md)。
> 生产 Compose 配置位于 `docker/.env`；从仓库根目录执行本手册中的生产 Compose 命令统一使用 `docker/compose-production.sh`，它会自动加载该文件并在启动/重启前执行生产门禁。

上线或故障恢复前可使用只读总检查：

```bash
# 不启动、不重启、不构建服务，只检查配置、证书和 Compose 解析
bash docker/production-readiness.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml

# 服务已启动时，额外检查所有运行服务及其健康状态
bash docker/production-readiness.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --runtime
```

该入口失败时只会报告变量名、证书文件、服务名和错误类别，不会打印密钥；修复后必须重新执行，不能用 `--runtime` 失败时的旧状态替代检查。

### 0.1 生产种子数据边界

Production 默认将 `SEED_DEMO_DATA` 设为 `false`，首次启动只准备系统租户、引导账户、行业模板和诊断知识，不会创建 `AC-001` 示例设备或测试租户。`true`/`1` 是兼容的最小隔离验收种子，`full` 是包含 10 台设备、24 小时遥测、告警和工单的完整演示集；普通生产门禁会拒绝所有显式演示模式，只有临时隔离 smoke 使用的 Compose 覆盖才会设置为 `full`。

升级既有数据库不会自动删除历史示例数据。若发现生产库存在 `AC-001`、`tenant-b` 或 `tenant2admin`，先备份并记录审计，再按租户、设备、告警规则和用户关联关系执行审批后的人工清理。

### 0.2 WAF 规则更新与回滚

生产 WAF 规则来自后端只读挂载的 `docker/waf-rules/rules.json`，应用内置的 SQL 注入、路径遍历、命令注入和 XSS 基线永远不能被外部文件关闭。规则文件不是 HTTP 或数据库管理 API，变更必须经过制品审查和部署权限控制。

发布一版新规则时，在规则文件同一目录执行以下步骤；不要直接编辑正在被应用读取的文件：

1. 在同目录创建临时文件，保持 JSON schemaVersion、revision、规则 ID 和匹配类型符合 loader 限制；规则文件不得包含密码、令牌或真实个人数据样例。
2. 运行应用对应版本的启动/规则校验，并计算 `sha256sum rules.json.tmp`；记录 revision、规则数量、SHA-256、发布人或流水线编号和开始时间。
3. 先将当前 `rules.json` 复制为带 revision 的备份，再使用同目录 `mv rules.json.tmp rules.json` 原子替换。不要跨文件系统复制，避免 watcher 看到半写入文件。
4. 检查后端日志中的“WAF 规则热加载成功”，核对 revision、规则数量和 SHA-256；确认错误计数没有增加，并用一条已审批的测试请求确认规则生效。日志和工单不得记录规则正文、query 或请求体。
5. 若热加载失败，应用会保留上一有效快照；若新规则导致误报，使用已核验的备份文件按同样的临时文件 + 原子 `mv` 流程回滚，再核对回滚 revision 和摘要。

规则文件缺失、权限不安全、符号链接、未知字段、重复 ID、危险正则或生产配置关闭外部规则时，后端应 fail-closed，不监听业务端口。运行中非法更新只拒绝该版本，不清空上一版本。每次更新/回滚需保留变更审批、revision、SHA-256、结果和 RTO 记录，但不得保存规则正文中的敏感样例。

---

## 一、告警处理决策树

### 1.1 AlertManager 告警分级

| 级别 | 响应时间 | 处理原则 |
|------|---------|---------|
| **Critical** | 立即（< 5 分钟） | 系统不可用或核心功能受损，需立即介入 |
| **Warning** | 30 分钟内 | 潜在风险，需排查但不紧急 |
| **Info** | 事后回顾 | 记录指标，不需即时响应 |

### 1.2 关键告警处理流程

#### BackendDown（后端宕机）— Critical

```
告警触发 → 确认后端容器状态 → 查后端日志 → 决策
```

```bash
# 1. 检查容器状态
docker/compose-production.sh ps backend

# 2. 如果 Exited，查看退出原因
docker/compose-production.sh logs --tail=100 backend

# 3. 常见原因排查：
#    - 数据库连接失败 → 检查 PostgreSQL 容器 + 密码
#    - 端口冲突 → netstat -tlnp | grep 8080
#    - 内存不足 → docker stats
#    - JWT/TOTP/AutoMapper/事件总线配置门禁失败 → 运行 validate-env.sh 并检查日志中的变量名

bash docker/validate-env.sh docker/.env --check-runtime-files

# 4. 重启
docker/compose-production.sh restart backend

# 5. 验证恢复
curl http://localhost:8080/health
```

#### EdgeGatewayDown（边缘网关离线）— Warning

```bash
# 边缘网关部署在工厂现场，可能网络抖动
# 1. 确认是否预期维护（联系现场工程师）
# 2. 检查网关心跳：
docker/compose-production.sh logs --tail=50 edgegateway | grep -i heartbeat
# 3. 如长时间未恢复（>30 分钟），远程指导现场重启
```

#### HighAlertEvaluationDuration（告警评估耗时长）

```bash
# P95 > 2s 说明规则匹配或 DB 查询有性能问题
# 1. 检查告警规则数量（>1000 条规则会拖慢评估）
docker/compose-production.sh exec postgres \
  sh -c "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"SELECT count(*) FROM alert_rules WHERE enabled = true;\""

# 2. 检查 PostgreSQL 慢查询
docker/compose-production.sh exec postgres \
  sh -c "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -c \"SELECT * FROM pg_stat_activity WHERE state = 'active' AND now()-query_start > interval '5 seconds';\""

# 3. 检查后端内存（可能 GC 压力大）
docker stats equipai-backend --no-stream
```

#### HighAlertSuppressionRate（告警静默率 >50%）

```
# 告警风暴被防风暴聚合器大量抑制
# 1. 排查是否有设备持续发异常数据（传感器故障）
# 2. 查看最近触发的告警
# 3. 临时方案：调大告警规则的 CooldownSeconds
# 4. 根因方案：修复或更换异常设备
```

### 1.3 Alertmanager 外部通知与就绪检查

基础设施告警通过 `ALERT_WEBHOOK_URL` 配置统一接收地址。修改后先运行发布门禁，再只重建 Alertmanager：

```bash
bash docker/validate-env.sh docker/.env --check-runtime-files
docker/compose-production.sh up -d --no-deps --force-recreate alertmanager
docker/compose-production.sh ps alertmanager
```

`alertmanager` 应显示 `healthy`。未配置 Webhook 时，外部通知会明确降级为 `dev-null`，告警仍可在 Alertmanager/Grafana 中查询。

#### CertificateMonitoringUnavailable / CertificateExpiresWithin7Days / CertificateExpiresWithin30Days

证书监控覆盖 Nginx TLS、MQTT 服务端证书和 MQTT CA。先确认告警对象、后端状态和证书文件，再决定是否轮换：

```bash
# 1. 查看后端和 MQTT/Nginx 服务状态
docker/compose-production.sh ps backend frontend mosquitto edgegateway

# 2. 确认部署门禁没有发现缺失、过期、主机名不匹配或证书链错误
bash docker/validate-env.sh docker/.env --check-runtime-files

# 3. 查看证书监控指标；status=1 表示后端成功读取对应公钥证书
curl --fail --silent "http://127.0.0.1:${BACKEND_PORT:-8080}/metrics" | grep -E '^equipai_certificate_(monitoring_status|expiry_timestamp_seconds|days_until_expiry)'
```

轮换步骤：

1. 从证书供应商取得新 Nginx `fullchain.pem` 和 `privkey.pem`，原子替换 `docker/ssl/cert.pem`、`docker/ssl/key.pem`；私钥权限保持 `600`，不要把私钥写入日志或工单。
2. 如 MQTT CA 或服务端证书同时轮换，先更新 `docker/mqtt-certs/ca.crt`、`server.crt`、`server.key` 和 Mosquitto 配置要求的密码文件，确认服务端 SAN 包含 `mosquitto` 实际主机名。
3. 执行 `bash docker/validate-env.sh docker/.env --check-runtime-files`；失败时不要重载服务，按输出的变量名或证书文件修复。
4. 执行 `docker/compose-production.sh up -d --no-deps --force-recreate frontend mosquitto backend edgegateway`，然后再次检查 `/metrics`、`/health/ready` 和边缘网关 `/health`。
5. 确认 Alertmanager 中对应告警恢复；保留轮换时间、证书序列号和验证结果，但不要记录私钥、密码或恢复码。

如果只是 `CertificateMonitoringUnavailable` 而证书文件确实存在，优先检查后端容器内只读挂载和文件权限；同时确认挂载的是公开证书而不是 PFX、私钥或符号链接。不要通过关闭 `CERTIFICATE_MONITORING_ENABLED` 来消除生产告警。该开关仅用于开发或隔离测试。

---

## 二、故障排查手册

### 2.1 前端无法登录

```
症状：登录页提示"用户名或密码错误"或"网络错误"
排查链路：
1. 浏览器控制台 → 确认 API 请求是否发出
2. curl 测试后端 → curl -X POST http://localhost:8080/api/v1/auth/login ...
3. 后端健康检查 → curl http://localhost:8080/health
4. 数据库连通性 → `docker/compose-production.sh exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`
5. 管理员账号 → `admin`；密码只从部署时的 `SEED_ADMIN_PASSWORD` 或密钥管理系统获取，
   本手册不记录默认密码。生产环境首次登录后仍必须立即修改密码。
```

#### 2.1.1 高权限 MFA 首次登录与恢复码演练

生产环境默认要求 `SystemAdmin` 和 `MaintenanceLead` 完成 TOTP 注册。部署验收时使用专用测试账号执行一次完整演练，禁止使用真实恢复码写入工单、聊天或日志；自动化测试只提供回归证据，不能替代现场演练：

1. 首次密码登录只能进入 MFA 注册页，不应签发可访问业务 API 的 JWT。
2. 使用受控的 Authenticator 扫描二维码并提交 6 位验证码，确认登录成功。
3. 在密码管理器或离线密封介质中保存页面仅展示一次的 8 个恢复码；不要截图上传到协作平台。
4. 退出后使用其中一个恢复码登录，确认登录成功；再次使用同一恢复码必须失败。
5. 在“安全与 MFA”中输入当前 TOTP 重新生成恢复码，确认旧恢复码全部失效，并确认审计日志记录恢复码消费/重新生成事件。
6. 执行备份恢复演练时，同时验证 `TOTP_ENCRYPTION_KEY` 可从密钥管理系统恢复；密钥缺失或错误时应用必须拒绝以生产模式启动。
7. 抓取 `/api/v1/auth/mfa/verify` 和 `/api/v1/auth/mfa/recovery-codes/regenerate` 的响应头，确认包含 `Cache-Control: no-store`；响应体不得进入代理、浏览器缓存、截图、日志或工单。
8. 用同一专用测试账号模拟恢复码消费与重新生成的锁竞争：未获取用户级锁的请求必须失败，恢复码摘要不得变化；记录请求追踪 ID 和结果，不记录验证码或恢复码。

演练失败时保留时间、账号标识（不得记录验证码/恢复码）、请求追踪 ID 和相关审计事件，交由安全负责人复核。

### 2.2 告警不触发

```
症状：设备数据异常但告警中心无新告警
排查：
1. 确认遥测数据入库
   docker/compose-production.sh exec postgres \
     sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
       -c "SELECT * FROM device_telemetry ORDER BY time DESC LIMIT 5;"'
2. 确认告警规则存在且启用
   docker/compose-production.sh exec postgres \
     sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
       -c "SELECT name, metric, operator, threshold, enabled FROM alert_rules WHERE enabled=true;"'
3. 确认规则 DeviceType 与设备 Type 匹配（空压机规则只匹配 Type='空压机' 的设备）
4. 检查 CooldownSeconds — 冷却期内不重复触发
5. 查后端日志：grep "告警规则" /tmp/backend.log
```

### 2.3 AI 分析无结果

```
症状：告警触发了但 analyses 表无记录
排查：
1. 确认 LLM API Key 是否配置（未配置则降级到 L2 规则匹配）
   grep "LLM" /tmp/backend.log | grep -i "降级\|degrade"
2. 确认知识规则存在（L2 需要 knowledge_rules 表有匹配规则）
   docker/compose-production.sh exec postgres \
     sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
       -c "SELECT name, device_type FROM knowledge_rules WHERE enabled=true;"'
3. 检查 AlertTriggeredEvent 是否发布
   grep "AlertTriggeredEvent" /tmp/backend.log
4. 检查 `/health/ready` 中 `rabbitmq-eventbus`，再查看 `equipai.v2.*.retry` 和 `*.dead` 队列积压
```

### 2.4 MQTT 数据中断

```
症状：设备停止上报数据
排查：
1. Mosquitto 容器状态
   docker/compose-production.sh ps mosquitto
2. MQTT 订阅测试
   # 从密钥管理器临时注入，勿把真实值写入脚本或提交到仓库
   read -r -p "MQTT 用户名: " MQTT_USERNAME
   read -r -s -p "MQTT 密码: " MQTT_PASSWORD
   export MQTT_USERNAME MQTT_PASSWORD
   docker/compose-production.sh exec -T mosquitto \
     mosquitto_sub -h localhost -p 8883 --cafile /mosquitto/config/certs/ca.crt \
     -u "$MQTT_USERNAME" -P "$MQTT_PASSWORD" -t "factory/#" -C 1 -v
3. 边缘网关连接状态
   docker logs equipai-edgegateway | grep -i "mqtt\|connect"
4. 确认 MQTT 认证（MQTT_USERNAME / MQTT_PASSWORD）
```

### 2.5 SignalR 实时推送失效

```
症状：前端不自动刷新（告警/工单状态不更新）
排查：
1. 浏览器 F12 → Network → WS 标签 → 确认 WebSocket 连接
2. 后端 Hub 日志
   grep "IndustrialHub\|SignalR" /tmp/backend.log
3. CORS 配置（SignalR 需要 AllowCredentials）
4. 检查 useSignalR hook 是否注册了事件处理器
```

---

## 三、容量扩容指南

### 3.1 设备数从 50 台扩到 500 台

| 配置项 | 50 台推荐 | 500 台推荐 | 调整位置 |
|--------|----------|-----------|---------|
| PostgreSQL CPU | 2 核 | 4-8 核 | docker-compose.yml `deploy.resources` |
| PostgreSQL 内存 | 2G | 8-16G | 同上 + `shared_buffers` |
| 后端实例数 | 1 副本 | 2-3 副本（需 Nginx 负载均衡） | docker-compose.yml `deploy.replicas` |
| Redis maxmemory | 400mb | 1-2G | docker-compose.yml redis command |
| 采样间隔 | 5 秒 | 保持 5 秒（不建议更低） | 模拟器/网关配置 |
| TimescaleDB chunk | 默认 7 天 | 保持（90 天保留） | 不需改 |

**关键检查项**：
- [ ] 遥测写入速率：`SELECT count(*) FROM device_telemetry WHERE time > now() - interval '1 minute';`
- [ ] 告警评估延迟：Prometheus `alert_evaluation_duration_seconds` P95 应 < 500ms
- [ ] MQTT 消息积压：后端日志无 "queue full" 警告

### 3.2 增加多租户

- 每个租户的设备数受 `tenants.MaxDevices` 限制
- 租户间数据隔离依赖 EF Core 全局过滤器，无需额外配置
- 超过 100 个租户时考虑 schema 级隔离（Phase 3+ 规划）

### 3.3 数据保留与清理

- 时序数据：TimescaleDB 自动 7 天压缩 + 90 天删除（`TelemetryCleanupService` 后台执行）
- 审计日志：永久保留（合规要求），建议定期导出归档
- 告警记录：无自动清理，建议每年归档一次

---

## 四、备份与恢复

### 4.1 手动备份

```bash
# 生产环境应在仓库根目录执行，确保备份目录统一为 docker/backups
cd /path/to/EquipSense
./docker/backup.sh

# 检查本次生成的文件（数据库、附件、批次清单，以及按配置生成的 Redis RDB）
ls -lht docker/backups
```

`backup.sh` 会先获取 `BACKUP_DIR/.backup.lock` 单实例锁，再校验 `RETAIN_DAYS` 并逐个执行 PostgreSQL custom/tar 完整性校验；历史备份清理失败也会返回非零，避免磁盘持续增长；本地附件模式默认必须同时生成
`*.dump`、`attachments_*.tar.gz` 和 `backup-manifest_*.tsv`。批次清单记录启用组件的相对文件名、字节数和 SHA-256，只有清单原子写入成功才报告备份完成；清单也会纳入保留清理和 `S3_SYNC=true` 的异地同步，避免恢复时误拼接不同时间点的数据库与附件。S3 附件模式会从配置的对象前缀同步后再生成同名归档，避免只归档空的本地卷。历史 `*.sql.gz` 仍可用于兼容恢复。显式启用 `BACKUP_REDIS=true` 后，Redis
快照会等待 `INFO persistence` 报告后台保存完成，并校验 `REDIS` 文件头；缺少 `REDIS_PASSWORD`、快照或复制失败会使脚本在本地备份开始前或过程中返回非零。启用 `S3_SYNC=true` 后，本地备份不完整时会跳过异地同步，异地目标缺失、未安装
`aws-cli` 或同步失败也会返回非零。备份文件和目录应保持 600/700 权限，并在
密钥管理系统之外单独保护 `TOTP_ENCRYPTION_KEY`。
`.dump` 使用容器内 `pg_restore --list` 校验；恢复脚本会先执行 TimescaleDB
`pre_restore`，恢复后执行 `post_restore` 和 `ANALYZE`，恢复失败时也会尝试退出 restoring 模式。

### 4.2 恢复流程

恢复会在环境文件旁获取单实例锁，随后重建目标数据库并替换附件卷内容。必须在维护窗口内
执行，并先在隔离环境完成演练；脚本默认只做校验和 dry-run，只有显式传入
`--confirm` 才会停止服务并修改数据。生产确认恢复必须同时提供同一批次的
`backup-manifest_*.tsv`；恢复脚本会在停止服务、调用 Docker 或 AWS 之前核对文件名、大小和
SHA-256。历史无清单备份只能显式追加 `--legacy`，该模式不具备批次完整性证据，不得作为常规
生产恢复路径。

```bash
# 1. 明确选择同一时间点的备份，不要把数据库和附件混用不同批次
DB_BACKUP="docker/backups/equipai_YYYYMMDD_HHMMSS.dump"
ATTACHMENTS_BACKUP="docker/backups/attachments_YYYYMMDD_HHMMSS.tar.gz"
MANIFEST="docker/backups/backup-manifest_YYYYMMDD_HHMMSS.tsv"
REDIS_BACKUP="docker/backups/redis_YYYYMMDD_HHMMSS.rdb"  # 没有则留空
RESTORE_ARGS=(
  --env-file docker/.env
  --db-backup "$DB_BACKUP"
  --attachments-backup "$ATTACHMENTS_BACKUP"
  --manifest "$MANIFEST"
)
if [[ -n "$REDIS_BACKUP" ]]; then
  RESTORE_ARGS+=(--redis-backup "$REDIS_BACKUP")
fi

# 2. 先做恢复前校验；此处不会调用 Docker，也不会修改服务
./docker/restore.sh "${RESTORE_ARGS[@]}"

# 3. 确认维护窗口、备份批次和恢复计划后，显式执行真正恢复
./docker/restore.sh "${RESTORE_ARGS[@]}" --confirm
```

生产镜像部署还需叠加生产 Compose 覆盖文件；重复传入 `--compose-file`：

```bash
./docker/restore.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --db-backup docker/backups/equipai_YYYYMMDD_HHMMSS.dump \
  --attachments-backup docker/backups/attachments_YYYYMMDD_HHMMSS.tar.gz \
  --manifest docker/backups/backup-manifest_YYYYMMDD_HHMMSS.tsv \
  --confirm
```

如果业务允许暂不恢复附件，必须显式使用 `--skip-attachments`；不能静默跳过。
提供 `--redis-backup` 时，脚本会先清理旧 AOF 并修正 RDB 属主，确保生产
`appendonly` 配置不会覆盖 RDB。恢复失败时脚本返回非零：数据库导入使用单事务，
附件替换不自动回滚，需保留原备份并按故障剧本处理。恢复完成后必须核对脚本输出的
PostgreSQL、附件目录（S3 模式为对象前缀同步结果）和 `/health` 检查结果，并记录实际 RTO/RPO。

### 4.3 隔离恢复实演

提交代码或变更备份/恢复脚本后，先运行仓库内的真实 Docker 演练。脚本会创建随机命名的
临时 PostgreSQL、附件卷和 Nginx 健康端点，写入基线数据，执行 `backup.sh`，故意修改数据，
再使用 `restore.sh --manifest <同批次清单> --confirm` 恢复并校验数据库、附件和健康检查；退出时会销毁临时容器、网络
和数据卷。它不会读取或修改 `docker/.env`，也不会触碰正在运行的生产容器。

```bash
cd /path/to/EquipSense
bash tests/backup-restore-rehearsal.sh
```

该演练已接入 CI，但它只证明备份/恢复代码闭环可用。正式上线前仍需在与生产相同的 Compose
覆盖、附件存储方式、Redis 备份策略和密钥管理条件下重复演练，并记录实际 RTO/RPO；演练日志
不得包含数据库密码、MFA 密钥或恢复码。

### 4.4 RTO/RPO 目标

| 场景 | RPO（数据丢失） | RTO（恢复时间） |
|------|----------------|----------------|
| 容器崩溃 | < 1 分钟 | < 1 分钟（自动重启） |
| 磁盘故障 | 最近备份至今 | 30 分钟（手动恢复） |
| 误操作删数据 | 最近备份至今 | 15 分钟（按表恢复） |

**建议**：生产环境每日自动备份 + 异地同步（如 S3/OSS），RPO 控制在 24 小时内。

---

## 五、日常运维检查清单

### 每日检查（5 分钟）

- [ ] `docker/compose-production.sh ps` 所有服务 Up
- [ ] `curl http://localhost:8080/health` 返回 healthy
- [ ] Grafana 仪表盘无异常指标（CPU/内存/错误率）
- [ ] AlertManager 无未处理的 critical 告警
- [ ] 磁盘空间 > 20% 可用（`df -h`）

### 每周检查（15 分钟）

- [ ] 备份文件存在且大小正常
- [ ] 每个完整备份都有 600 权限的 `backup-manifest_*.tsv`，并抽查数据库、附件和 Redis 文件的 SHA-256 与清单一致
- [ ] 本地模式 `attachments_data` 附件卷已纳入备份；S3 模式对象前缀已完成同步备份，且恢复演练通过
- [ ] Seq 日志无持续 ERROR（`http://localhost:5341`）
- [ ] 时序数据保留正常（`SELECT min(time), max(time) FROM device_telemetry;`）
- [ ] 审计日志导出归档

### 每月检查（30 分钟）

- [ ] 漏洞扫描报告审查（CI 里的 Trivy + NuGet 检查结果）
- [ ] 容量趋势分析（设备数/遥测量/告警量增长）
- [ ] 检查证书生命周期告警已接入外部通知，并抽查 `nginx_tls`、`mqtt_server`、`mqtt_ca` 的 `status=1` 和剩余天数
- [ ] 依赖更新评估（NuGet / npm 包）

---

## 六、应急预案

### 6.1 数据库不可用

1. 确认 PostgreSQL 容器状态
2. 如磁盘满 → 清理 TimescaleDB 旧数据 `SELECT drop_chunks('device_telemetry', now() - interval '60 days');`
3. 如内存不足 → 增加 `deploy.resources.limits.memory`
4. 如数据损坏 → 从备份恢复（见 4.2）

### 6.2 全系统不可用

1. `docker/compose-production.sh down && docker/compose-production.sh up -d` 全量重启
2. 如仍不可用 → 检查 `.env` 配置（密码/密钥是否正确）
3. 联系开发团队：提供 `/tmp/backend.log` + `docker/compose-production.sh logs` 输出

### 6.3 安全事件（疑似入侵）

1. 立即 `docker/compose-production.sh stop backend` 隔离系统
2. 导出审计日志：
   ```bash
   docker/compose-production.sh exec -T postgres \
     sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
       -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1000;"' > security_audit.csv
   ```
3. 检查异常登录：
   ```bash
   docker/compose-production.sh exec -T postgres \
     sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
       -c "SELECT * FROM audit_logs WHERE action = '\''LoginFailed'\'' \
         AND created_at > now() - interval '\''24 hours'\'';"'
   ```
4. 修改所有密码（admin/数据库/Redis/JWT_SECRET）
5. 联系安全团队评估影响范围

### 6.4 RabbitMQ 不可用或版本升级

1. 先检查 `docker/compose-production.sh ps rabbitmq`、`rabbitmq-diagnostics -q check_running` 和后端 `/health/ready`；liveness 正常但 readiness 失败属于预期隔离。
2. 验证 v2 policy：`rabbitmqctl list_policies -p /`，并用 `rabbitmqctl list_queues -p / name durable arguments policy` 检查 `equipai.v2.*` 队列。
3. 既有 3.13 数据卷需要保留时，先完整备份，排空旧 `equipai.events.*` 主/retry 队列，再按官方支持路径升级到 4.2、启用稳定 feature flags，最后升级到 4.3.4。
4. v2 切换后保留旧 dead 队列供人工核对；应用和脚本不得自动删除旧队列或 `rabbitmq_data` 卷。
5. 回滚应用版本时保留 v2 队列和数据卷。只有在确认没有业务队列数据且备份可恢复时，运维人员才可显式重建 broker。
6. 极端情况下可在 Compose 环境中设置 `EVENTBUS_PROVIDER=InMemory` 与 `ALLOW_INMEMORY_EVENTBUS_IN_PRODUCTION=true` 应急启动；直接运行应用时使用对应的 `EventBus__*` 配置。该模式重启会丢事件，恢复 RabbitMQ 后立即撤销。

### 6.5 生产部署自动回滚失败

默认滚动部署会先获取 Compose 目录下的单实例锁，只重建 backend/frontend/edgegateway。目标版本异常时，`deploy-production.sh` 会使用
`.last-deployed-tag` 对应的本机旧镜像回滚，并重新验证后端 readiness、边缘网关 `/health`、
前端 health 和回滚后的全量运行态 readiness；网关的 SQLite 缓冲仍保留在 `edgegateway_data`
命名卷中。若日志出现“严重：回滚健康检查失败”“回滚后的全量运行态 readiness 失败”或
“旧版本容器重建失败”，执行：

```bash
cd "$DEPLOY_PATH"

# 核对版本记录；失败部署不会覆盖该文件
cat .last-deployed-tag

# 检查三个无状态应用服务及最近日志
docker compose --env-file .env \
  -f docker-compose.yml -f docker-compose.prod.yml \
  ps backend frontend edgegateway
docker compose --env-file .env \
  -f docker-compose.yml -f docker-compose.prod.yml \
  logs --tail=200 backend frontend edgegateway

# 验证后端依赖就绪；前端 health 仍需结合上面的 ps 输出
curl --fail --show-error http://localhost:8080/health/ready
curl --fail --show-error http://localhost:8081/health

# 重新执行基础 Compose + 生产 overlay 的全量运行态 readiness
bash ./production-readiness.sh \
  --env-file .env \
  --compose-file docker-compose.yml \
  --compose-file docker-compose.prod.yml \
  --runtime
```

处置原则：

1. 不要修改 `.last-deployed-tag`，除非旧版本容器和双健康门禁已经人工验证通过。
2. 不要删除旧 backend/frontend/edgegateway 镜像；`--pull never` 回滚依赖本机已有旧镜像。
3. 不要重建 PostgreSQL、Redis、RabbitMQ、Mosquitto 或数据卷；它们不属于应用版本回滚范围。
4. 保留失败容器日志和目标 tag，排查镜像启动、配置迁移及依赖 readiness 后再重新发布。
