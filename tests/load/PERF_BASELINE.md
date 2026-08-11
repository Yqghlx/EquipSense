# EquipSense 性能基线

> v1.4 性能基线数据，作为后续性能回归参考。
>
> 测试环境：M1 macOS（4 核 8GB），PG + Redis + Mosquitto 在 Docker，后端 dotnet run（非容器）。
> 生产环境（容器化部署）性能应接近或更好。

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

通过 HTTP API 模拟 100 个设备并发写入遥测数据（5 指标 / 设备）。

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
k6 run -e AUTH_USER="$AUTH_USER" -e AUTH_PASS="$AUTH_PASS" -e AUTH_MACHINE_API_KEY="$AUTH_MACHINE_API_KEY" tests/load/telemetry-write.js

# 高压测试（200 VU）
k6 run -e VUS=200 -e AUTH_USER="$AUTH_USER" -e AUTH_PASS="$AUTH_PASS" -e AUTH_MACHINE_API_KEY="$AUTH_MACHINE_API_KEY" tests/load/api-read.js
```

> 压测脚本不内置任何公开账户密码。生产 MQTT 压测还必须显式设置
> `MQTT_USERNAME`、`MQTT_PASSWORD`、`MQTT_PORT=8883`、`MQTT_USE_TLS=true` 和 `MQTT_CA_FILE`。

如果任何指标退化超过 30%（如 P95 从 30ms 变成 40ms），需要排查是否有性能回归。
