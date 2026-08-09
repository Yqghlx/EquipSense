# EquipSense 运维手册 (Runbook)

> 本文档面向运维人员，覆盖日常告警处理、故障排查、容量扩容、备份恢复等运维场景。
> 部署相关请参考 [DEPLOY.md](./DEPLOY.md)，架构设计请参考 [FINAL_TECHNICAL_DESIGN.md](./FINAL_TECHNICAL_DESIGN.md)。

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
docker compose -f docker/docker-compose.yml ps backend

# 2. 如果 Exited，查看退出原因
docker compose -f docker/docker-compose.yml logs --tail=100 backend

# 3. 常见原因排查：
#    - 数据库连接失败 → 检查 PostgreSQL 容器 + 密码
#    - 端口冲突 → netstat -tlnp | grep 8080
#    - 内存不足 → docker stats
#    - JWT_SECRET 未配 → 检查 .env

# 4. 重启
docker compose -f docker/docker-compose.yml restart backend

# 5. 验证恢复
curl http://localhost:8080/health
```

#### EdgeGatewayDown（边缘网关离线）— Warning

```bash
# 边缘网关部署在工厂现场，可能网络抖动
# 1. 确认是否预期维护（联系现场工程师）
# 2. 检查网关心跳：
docker compose logs --tail=50 edgegateway | grep -i heartbeat
# 3. 如长时间未恢复（>30 分钟），远程指导现场重启
```

#### HighAlertEvaluationDuration（告警评估耗时长）

```bash
# P95 > 2s 说明规则匹配或 DB 查询有性能问题
# 1. 检查告警规则数量（>1000 条规则会拖慢评估）
docker exec equipai-postgres psql -U postgres -d equipai_dev \
  -c "SELECT count(*) FROM alert_rules WHERE enabled = true;"

# 2. 检查 PostgreSQL 慢查询
docker exec equipai-postgres psql -U postgres -d equipai_dev \
  -c "SELECT * FROM pg_stat_activity WHERE state='active' AND now()-query_start > '5s';"

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

---

## 二、故障排查手册

### 2.1 前端无法登录

```
症状：登录页提示"用户名或密码错误"或"网络错误"
排查链路：
1. 浏览器控制台 → 确认 API 请求是否发出
2. curl 测试后端 → curl -X POST http://localhost:8080/api/v1/auth/login ...
3. 后端健康检查 → curl http://localhost:8080/health
4. 数据库连通性 → docker exec equipai-postgres pg_isready
5. 默认账号 → admin / Admin@123（首次启动种子数据）
```

### 2.2 告警不触发

```
症状：设备数据异常但告警中心无新告警
排查：
1. 确认遥测数据入库
   docker exec equipai-postgres psql -U postgres -d equipai_dev \
     -c "SELECT * FROM device_telemetry ORDER BY time DESC LIMIT 5;"
2. 确认告警规则存在且启用
   psql -c "SELECT name, metric, operator, threshold, enabled FROM alert_rules WHERE enabled=true;"
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
   psql -c "SELECT name, device_type FROM knowledge_rules WHERE enabled=true;"
3. 检查 AlertTriggeredEvent 是否发布
   grep "AlertTriggeredEvent" /tmp/backend.log
4. 检查 `/health/ready` 中 `rabbitmq-eventbus`，再查看 `equipai.v2.*.retry` 和 `*.dead` 队列积压
```

### 2.4 MQTT 数据中断

```
症状：设备停止上报数据
排查：
1. Mosquitto 容器状态
   docker compose ps mosquitto
2. MQTT 订阅测试
   docker exec equipai-mosquitto mosquitto_sub -h localhost -t "factory/#" -C 1 -v
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
# PostgreSQL 全量备份（含 TimescaleDB 扩展数据）
./docker/backup.sh

# 或手动执行
docker exec equipai-postgres pg_dump -U postgres equipai_dev | gzip > backup_$(date +%Y%m%d).sql.gz

# Redis RDB 快照（缓存数据非关键，可选）
docker exec equipai-redis redis-cli -a $REDIS_PASSWORD BGSAVE
docker cp equipai-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb

# Grafana 仪表盘配置（已版本化在 git，但用户自定义的需导出）
docker exec equipai-grafana grafana-cli admin export-dashboard
```

### 4.2 恢复流程

```bash
# 1. 停止后端（避免恢复期间有写入）
docker compose stop backend

# 2. 恢复 PostgreSQL
gunzip -c backup_20260614.sql.gz | docker exec -i equipai-postgres psql -U postgres -d equipai_dev

# 3. 恢复 Redis（如需要）
docker cp ./redis_backup_20260614.rdb equipai-redis:/data/dump.rdb
docker compose restart redis

# 4. 启动后端并验证
docker compose start backend
curl http://localhost:8080/health
```

### 4.3 RTO/RPO 目标

| 场景 | RPO（数据丢失） | RTO（恢复时间） |
|------|----------------|----------------|
| 容器崩溃 | < 1 分钟 | < 1 分钟（自动重启） |
| 磁盘故障 | 最近备份至今 | 30 分钟（手动恢复） |
| 误操作删数据 | 最近备份至今 | 15 分钟（按表恢复） |

**建议**：生产环境每日自动备份 + 异地同步（如 S3/OSS），RPO 控制在 24 小时内。

---

## 五、日常运维检查清单

### 每日检查（5 分钟）

- [ ] `docker compose ps` 所有服务 Up
- [ ] `curl http://localhost:8080/health` 返回 healthy
- [ ] Grafana 仪表盘无异常指标（CPU/内存/错误率）
- [ ] AlertManager 无未处理的 critical 告警
- [ ] 磁盘空间 > 20% 可用（`df -h`）

### 每周检查（15 分钟）

- [ ] 备份文件存在且大小正常
- [ ] Seq 日志无持续 ERROR（`http://localhost:5341`）
- [ ] 时序数据保留正常（`SELECT min(time), max(time) FROM device_telemetry;`）
- [ ] 审计日志导出归档

### 每月检查（30 分钟）

- [ ] 漏洞扫描报告审查（CI 里的 Trivy + NuGet 检查结果）
- [ ] 容量趋势分析（设备数/遥测量/告警量增长）
- [ ] 证书过期检查（mTLS / TLS）
- [ ] 依赖更新评估（NuGet / npm 包）

---

## 六、应急预案

### 6.1 数据库不可用

1. 确认 PostgreSQL 容器状态
2. 如磁盘满 → 清理 TimescaleDB 旧数据 `SELECT drop_chunks('device_telemetry', now() - interval '60 days');`
3. 如内存不足 → 增加 `deploy.resources.limits.memory`
4. 如数据损坏 → 从备份恢复（见 4.2）

### 6.2 全系统不可用

1. `docker compose down && docker compose up -d` 全量重启
2. 如仍不可用 → 检查 `.env` 配置（密码/密钥是否正确）
3. 联系开发团队：提供 `/tmp/backend.log` + `docker compose logs` 输出

### 6.3 安全事件（疑似入侵）

1. 立即 `docker compose stop backend` 隔离系统
2. 导出审计日志 `psql -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1000;" > security_audit.csv`
3. 检查异常登录 `psql -c "SELECT * FROM audit_logs WHERE action='LoginFailed' AND created_at > now() - interval '24 hours';"`
4. 修改所有密码（admin/数据库/Redis/JWT_SECRET）
5. 联系安全团队评估影响范围

### 6.4 RabbitMQ 不可用或版本升级

1. 先检查 `docker compose ps rabbitmq`、`rabbitmq-diagnostics -q check_running` 和后端 `/health/ready`；liveness 正常但 readiness 失败属于预期隔离。
2. 验证 v2 policy：`rabbitmqctl list_policies -p /`，并用 `rabbitmqctl list_queues -p / name durable arguments policy` 检查 `equipai.v2.*` 队列。
3. 既有 3.13 数据卷需要保留时，先完整备份，排空旧 `equipai.events.*` 主/retry 队列，再按官方支持路径升级到 4.2、启用稳定 feature flags，最后升级到 4.3.4。
4. v2 切换后保留旧 dead 队列供人工核对；应用和脚本不得自动删除旧队列或 `rabbitmq_data` 卷。
5. 回滚应用版本时保留 v2 队列和数据卷。只有在确认没有业务队列数据且备份可恢复时，运维人员才可显式重建 broker。
6. 极端情况下可在 Compose 环境中设置 `EVENTBUS_PROVIDER=InMemory` 与 `ALLOW_INMEMORY_EVENTBUS_IN_PRODUCTION=true` 应急启动；直接运行应用时使用对应的 `EventBus__*` 配置。该模式重启会丢事件，恢复 RabbitMQ 后立即撤销。
