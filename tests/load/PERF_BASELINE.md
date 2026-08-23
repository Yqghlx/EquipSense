# EquipSense 性能基线

> v1.4 性能基线数据，作为后续性能回归参考。
>
> 测试环境：M1 macOS（4 核 8GB），PG + Redis + Mosquitto 在 Docker，后端 dotnet run（非容器）。
> 生产环境（容器化部署）性能应接近或更好。

## 复测数据（2026-08-23，真实生产化栈）

> 环境升级：本次复测跑在**完整生产栈**上 —— 生产 compose 构建的 backend 容器
> （WAF/限流/HttpOnly Cookie 认证链路全开）+ PG16/TimescaleDB + Redis + Mosquitto，
> 并包含当日修复的 max_connections=300（详见下文「容量对齐」）。

### 1. API 读压测（`api-read.js`，生产容器后端）

| 并发数 | P50 | P95 | P99 | 错误率 | 状态 |
|--------|-----|-----|-----|--------|------|
| 50 VU  | —   | 39ms | 90ms | 0% | ✅ |
| 200 VU | 4ms | 52ms | 105ms | 0% | ✅（checks 100%，57660/57660） |

### 2. 遥测写路径（`telemetry-write.js`）

| 场景 | P95 | P99 | 错误率 | 状态 |
|------|-----|-----|--------|------|
| HTTP 上报（relaxed 阈值） | 48ms | 102ms | 0% | ✅ |

### 3. 告警风暴（`alert-storm.js`，100 VU × 60s）

| 指标 | 结果 | 状态 |
|------|------|------|
| 请求成功率 | 100%（5903/5903） | ✅ |
| P95 / P99 | 36ms / 46ms | ✅ |
| 聚合防风暴 | 100 VU 轰炸 1 分钟仅产生 53 条告警（6 台设备），未泛滥 | ✅ |

**注意**：脚本 setup 曾因 pageSize=500 被 API 的 PageSize≤100 校验拒绝（已修复为 100）。

### 4. MQTT 注入（mosquitto_pub 批量，600 消息 × 3 指标）

30 并发批次发布 ~4s 完成；逐设备核对全部落库；重复 (device,metric,timestamp) 被
去重逻辑正确剔除。`mqtt-publish.js` 为无实际发布的模板（需 k6 MQTT 扩展），真实
证据以本批量注入为准。

### 5. 混沌演练（`tests/stress/chaos-probe.js`，10 VU，生产容器后端）

| 场景 | 健康成功率 | 错误率 | P95 | 结论 |
|------|-----------|--------|-----|------|
| 基线（无故障） | 100% | 0% | 1.69s¹ | ✅ 全阈值通过 |
| **Postgres 暂停 25s**（连接池冻结） | 97.93% | 4.13% | 658ms | ✅ k6 退出码 0，自动恢复 |

¹ 基线 p95 含首轮登录预热。

network-delay / packet-loss / container-kill 三场景依赖 Pumba（需拉取镜像）
与 distroless 后端镜像（无 shell，无法容器内注入崩溃信号），本地网络受限暂缓；
`chaos-test.sh` 已修复 bash 3.2 兼容问题可直接执行。

### 容量对齐（重要发现）

TimescaleDB 镜像默认 `max_connections=25`（CPU 自适应），而后端 Default + ReadOnly
两个 DbContext 池理论上限 2×100=200。实测：低配额下双 60s 告警风暴把连接耗尽
（53300 too many clients），遥测落库管线**永久停摆且无告警日志**，psql 也无法登录，
只能重启进程恢复。两 compose 已将 max_connections 提到 300；同强度风暴复测
0 错误、无需重启。

## 基线数据（2026-06-20）

### 1. API 读压测（`api-read.js`）

模拟并发查询设备/告警/工单/Dashboard/通知 5 类核心 API。

| 并发数 | QPS | P50 | P95 | P99 | 错误率 | 状态 |
|--------|-----|-----|-----|-----|--------|------|
| 50 VU  | 235 | 8ms | 24ms | 40ms | 0% | ✅ 阈值通过（P95<500ms） |
| 200 VU | 944 | 6ms | 29ms | 50ms | 0% | ✅ 线性扩展（4 倍负载 → 4 倍 QPS） |

**结论**：读路径性能优秀，瓶颈在 sleep(1)（模拟用户思考时间），实际瓶颈未触及。

### 2. MQTT 发布压测（`mqtt-publish.js`）

模拟 100 个边缘网关同时上报遥测数据。

| 并发数 | 消息速率 | 错误率 | dropped_iterations | 状态 |
|--------|----------|--------|---------------------|------|
| 100 VU | 197 msg/s | 0% | 64（< 1%，timer 抖动） | ✅ |

**结论**：MQTT broker 稳定，后端订阅器无丢消息。

### 3. 遥测写入压测（`telemetry-write.js`）

通过 HTTP API 模拟 100 个设备并发写入遥测数据（5 指标 / 设备）。CI 另有 20 VU × 30s 的轻量写路径回归，使用 DataSeeder 固定的 `AC-001` 设备，验证接入校验、设备编码解析、异步队列和批量落库链路。

| 并发数 | 写入速率 | P50 | P95 | 错误率 | 状态 |
|--------|----------|-----|-----|--------|------|
| 100 VU | 49 写/s | 25ms | 40ms | 0% | ✅ 阈值通过（P95<1000ms） |

**结论**：写路径稳定。49 写/s × 5 指标 = 245 metric/s，TimescaleDB 批量写入无瓶颈。

## 历史问题（已修复）

- **v1.2 PG max_connections=25**：200 VU 压测击垮 PG 连接池（53300 too many clients）。已改为 `max_connections=200` + `shared_buffers=512MB`。
- **v1.2 LLM ApiKey 缺失导致 401**：每次告警触发都尝试 LLM 请求，4s 超时后降级。已改为 ApiKey 为空时立即失败。
- **v1.2 Redis refresh token 风暴**：每个 VU 独立登录，200 VU 启动 = 200 并发登录。已改为 setup 阶段集中登录共享 token。

## 回归方法

```bash
# 启动后端（监听 8080）
dotnet run --project src/EquipAI.WebAPI

# 跑全部三套（约 2 分钟）
export AUTH_USER=admin
export AUTH_PASS='<与后端 SEED_ADMIN_PASSWORD 相同的测试密码>'
# 生产环境另需设置 AUTH_MACHINE_API_KEY（对应后端 AUTH_MACHINE_API_KEY），
# 仅用于让机器客户端读取登录响应体 JWT；开发/测试环境可省略。
export AUTH_MACHINE_API_KEY='<生产机器客户端 API Key（如需）>'
k6 run -e AUTH_USER="$AUTH_USER" -e AUTH_PASS="$AUTH_PASS" -e AUTH_MACHINE_API_KEY="$AUTH_MACHINE_API_KEY" tests/load/api-read.js
k6 run -e AUTH_USER="$AUTH_USER" -e AUTH_PASS="$AUTH_PASS" -e AUTH_MACHINE_API_KEY="$AUTH_MACHINE_API_KEY" tests/load/mqtt-publish.js
k6 run -e AUTH_USER="$AUTH_USER" -e AUTH_PASS="$AUTH_PASS" -e AUTH_MACHINE_API_KEY="$AUTH_MACHINE_API_KEY" -e DEVICES=100 -e DURATION=60s tests/load/telemetry-write.js

# 高压测试（200 VU）
k6 run -e VUS=200 -e AUTH_USER="$AUTH_USER" -e AUTH_PASS="$AUTH_PASS" -e AUTH_MACHINE_API_KEY="$AUTH_MACHINE_API_KEY" tests/load/api-read.js
```

> 压测脚本不内置任何公开账户密码。生产 MQTT 压测还必须显式设置
> `MQTT_USERNAME`、`MQTT_PASSWORD`、`MQTT_PORT=8883`、`MQTT_USE_TLS=true` 和 `MQTT_CA_FILE`。

如果任何指标退化超过 30%（如 P95 从 30ms 变成 40ms），需要排查是否有性能回归。
