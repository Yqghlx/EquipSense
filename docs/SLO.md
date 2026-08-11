# EquipSense 服务等级目标（SLO）

> 本文档定义 EquipSense 平台的服务等级目标，作为可用性、性能、可靠性的承诺基线。
> 所有目标基于 `tests/load/PERF_BASELINE.md` 的实测数据（2026-06-20 基线），并预留
> 安全余量——目标值显著宽松于实测值，避免正常波动误触告警。
>
> **违反 SLO 的后果**：错误预算耗尽 → 冻结新功能发布，优先修复可靠性问题
> （见 [Error Budget](#错误预算-error-budget)）。

---

## 一、服务等级指标（SLI）

SLI = 可度量的服务行为指标。所有 SLI 由 Prometheus 兼容指标暴露（后端 `/metrics`），
采集链路：业务代码 → `BusinessMetrics` / `BusinessMetricsCollector` → Prometheus → Grafana。

| 编号 | SLI 名称 | 度量方式 | 数据源 |
|------|---------|---------|--------|
| SLI-1 | API 请求可用性 | `成功请求数 / 总请求数`（HTTP 2xx + 业务成功） | ASP.NET Core 中间件 |
| SLI-2 | 读路径延迟 | P95 / P99 响应时间（GET，排除认证） | k6 压测 + APM |
| SLI-3 | 写路径延迟 | P95 / P99 响应时间（POST/PUT/DELETE） | k6 压测 + APM |
| SLI-4 | MQTT 消息吞吐 | 成功消费消息 / 发布消息（无丢失） | MQTT 订阅器计数 |
| SLI-5 | 实时推送延迟 | 告警从触发到前端收到的端到端延迟 | SignalR 推送时间戳 |

---

## 二、服务等级目标（SLO）

SLO = SLI 的目标值。**28 天滚动窗口**（与错误预算计算周期一致）。

| 编号 | SLO | 目标 | 对应 SLI | 备注 |
|------|-----|------|---------|------|
| SLO-1 | API 整体可用性 | ≥ **99.9%**（28 天最多 40 分钟宕机） | SLI-1 | 含计划维护窗口外的所有 5xx |
| SLO-2 | 读路径延迟 | P95 < **500ms**，P99 < **1000ms** | SLI-2 | 实测 P99 50ms（10x 余量） |
| SLO-3 | 写路径延迟 | P95 < **1000ms**，P99 < **2000ms** | SLI-3 | 实测 P95 40ms（25x 余量） |
| SLO-4 | MQTT 消息可靠性 | 丢失率 < **0.01%** | SLI-4 | 实测 0%（100VU × 197 msg/s） |
| SLO-5 | 实时推送延迟 | P95 < **2 秒** | SLI-5 | 告警 → SignalR → 前端 |

### 为什么是这些目标？

- **99.9% 可用性**：工业监控平台非实时控制系统（PLC 直控），允许年度 8.76h 不可用。
  99.9% 对用户「告警不漏」的核心诉求足够，同时不引入 99.99% 的运维复杂度。
- **读 P99 < 1s**：实测 P99 50ms，目标留 20x 余量覆盖生产负载波动（数据库增长、
  连接池竞争、GC 暂停）。用户浏览设备/告警列表的体感阈值约 1s。
- **写 P99 < 2s**：遥测写入对延迟不敏感（批量缓冲），但工单创建需用户等待反馈，
  2s 内是可接受交互延迟。
- **MQTT 丢失 < 0.01%**：遥测单点丢失可容忍（聚合统计容错），但系统性丢失意味着
  告警漏报，必须检测。

---

## 三、错误预算（Error Budget）

错误预算 = 100% − SLO 目标。用于平衡「新功能发布」与「稳定性投资」。

**SLO-1（99.9%）的错误预算**：
- 28 天窗口：28 × 1440 × 0.1% = **40.3 分钟** 可容忍不可用
- 预算耗尽 → 冻结非修复类发布，优先投入可靠性（详见 [OPS_RUNBOOK.md](OPS_RUNBOOK.md)）

**预算消耗追踪**：
- Prometheus 记录 5xx 请求与总请求，计算滚动可用性
- 预算剩余 < 20% → 告警通知运维（Slack/邮件）
- 预算耗尽 → CI 自动标记发布阻塞（人工审查解除）

---

## 四、CI 性能回归门禁

k6 压测阈值（`tests/load/config.js`）是 SLO 的**机器可执行契约**，
CI 每次合并自动执行（`.github/workflows/ci.yml` load-test job）：

```javascript
// tests/load/config.js
standardThresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 对应 SLO-2
  http_req_failed: ['rate<0.001'],                  // 对应 SLO-1（0.1%）
};
relaxedThresholds = {
  http_req_duration: ['p(95)<1000', 'p(99)<2000'], // 对应 SLO-3
  http_req_failed: ['rate<0.01'],
};
```

**回归判定**：k6 阈值不满足 → 退出码非零 → CI 红 → 阻止合并。

CI 压测范围（轻量，`api-read.js` 和 `telemetry-write.js` 均为 20VU × 30s）是 SLO 的**采样验证**；
写路径使用 DataSeeder 固定设备验证设备编码解析、请求校验、异步队列和批量落库。
全量容量验证（读路径 200VU、写路径按设备预算）见 `PERF_BASELINE.md` 本地/手动执行。

---

## 五、观测与告警

| 指标 | 告警条件 | 渠道 | 关联 SLO |
|------|---------|------|---------|
| 可用性（5xx 率） | 5 分钟窗口 > 1% | Slack #alerts + 邮件 | SLO-1 |
| 读 P95 延迟 | 5 分钟窗口 > 800ms（SLO 1.6x） | Slack #alerts | SLO-2 |
| MQTT 消费滞后 | 订阅器积压 > 1000 条 | Slack #alerts + PagerDuty | SLO-4 |
| 错误预算剩余 | < 20% | 邮件 + 发布冻结标记 | SLO-1 |

**告警分级**：
- **Warning**：SLO 预警（接近阈值），工作时间内处理
- **Critical**：SLO 违反或错误预算耗尽，立即响应（见 [OPS_RUNBOOK.md](OPS_RUNBOOK.md) 故障剧本）

---

## 六、SLO 评审与调整

- **评审周期**：每季度评审 SLO 目标是否合理（基于实际 SLI 趋势）
- **调整原则**：
  - 只能收紧（提升目标），不能放松，除非有明确业务理由
  - 调整需记录 ADR（见 `docs/evaluation/` 决策记录）
  - 用户感知的 SLO（延迟、可用性）调整需产品确认
- **降级场景**：高峰期或故障期间，可临时降低非关键路径 SLO（如报表生成）以保全核心路径

---

## 相关文档

- [性能基线（PERF_BASELINE.md）](../tests/load/PERF_BASELINE.md) — 实测数据
- [运维剧本（OPS_RUNBOOK.md）](OPS_RUNBOOK.md) — SLO 违反时的故障处理
- [部署文档（DEPLOY.md）](DEPLOY.md) — 部署与回滚流程
