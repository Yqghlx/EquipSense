# 混沌工程（Chaos Engineering）

> 主动向运行中的系统注入故障（网络延迟、丢包、容器崩溃、暂停），
> 验证系统在故障下仍能服务核心请求（降级但不雪崩），并在故障解除后自愈。
>
> 本项目基于 **Docker 原生混沌工具 Pumba**，不依赖 K8s / Chaos Mesh——
> 与现有 docker-compose 部署栈无缝集成。

## 为什么不用 Chaos Mesh

Chaos Mesh 是 Kubernetes operator，需要 K8s 集群。本项目用 Docker Compose 部署
（Phase 1 模块化单体），无 K8s 清单。Pumba 是 Docker 原生混沌工具：

| 维度 | Chaos Mesh | Pumba（本项目用） |
|------|------------|-------------------|
| 运行环境 | K8s 集群 | Docker（任何 docker run 环境） |
| 注入方式 | CRD 声明式 | CLI 命令式 |
| 故障类型 | 网络延迟/丢包/分区、IO、CPU、内存、DNS、时间扭曲 | 网络延迟/丢包/分区、容器 kill/pause |
| 集成成本 | 需 K8s 迁移 | 直接 docker run，零迁移 |
| 适用阶段 | K8s 化后的 Phase 4+ | 当前 Docker Compose 部署 |

迁移到 K8s 后可平滑切到 Chaos Mesh（故障类型语义对齐，测试用例可复用 k6 探针）。

## 故障场景

`tests/stress/chaos-test.sh` 提供 4 个场景，每个场景 = 故障注入 + k6 探针验证：

| 场景 | 故障 | 目标 | 验证点 |
|------|------|------|--------|
| `network-delay` | 后端网络延迟 500ms±100ms | backend 容器 | 延迟放大下 API 不超时堆积，P95 < 3s |
| `packet-loss` | Redis 丢包 5% | redis 容器 | 缓存抖动时降级到 DB，错误率 < 20% |
| `container-kill` | 杀死后端进程 | backend 容器 | docker compose restart 自动拉起，60s 内恢复 |
| `container-pause` | 暂停 Postgres | postgres 容器 | 连接池 + EnableRetryOnFailure 兜底，DB 卡顿期间 API 不全挂 |

## 韧性阈值（与 SLO 区别）

`tests/stress/chaos-probe.js` 的阈值反映"故障容忍"而非"性能最优"：

| 指标 | 正常 SLO（docs/SLO.md） | 混沌阈值（chaos-probe） | 倍数 |
|------|------------------------|------------------------|------|
| P95 响应 | < 500ms | < 3000ms | 6× |
| 错误率 | < 0.1% | < 20% | 200× |
| 健康检查 | 100% | ≥ 80% | — |

宽松阈值是刻意的：混沌测试不是验证性能最优，而是验证**故障下不雪崩、能降级服务**。
故障解除后指标应回升到正常 SLO 区间（自愈验证）。

## 运行方式

### 前置

1. 生产栈已启动：`docker compose -f docker/docker-compose.yml up -d`
2. k6 已安装：`brew install k6`（或参考 `tests/stress/k6`）
3. Docker socket 可访问（Pumba 需要控制容器）

### 单场景

```bash
# 后端网络延迟 45 秒，期间 k6 探针验证韧性
./tests/stress/chaos-test.sh network-delay

# 调整故障强度（环境变量）
DELAY_MS=1000 LOSS_PERCENT=10 CHAOS_DURATION=60s ./tests/stress/chaos-test.sh packet-loss
```

### 全部场景

```bash
./tests/stress/chaos-test.sh all
```

### 结果文件

每个场景输出（`tests/stress/`）：
- `chaos-probe-{scenario}.json` — k6 原始采样数据
- `chaos-summary-{scenario}.json` — k6 汇总（阈值 pass/fail）
- `chaos-probe-{scenario}.log` — 探针运行日志
- `chaos-injection.log` — Pumba 注入日志

**通过判据**：`chaos-summary-*.json` 中所有 thresholds 为 `ok: true`。

## 与现有测试体系的关系

| 测试层 | 目的 | 故障注入 |
|--------|------|----------|
| 单元测试（xUnit） | 逻辑正确性 | 无（隔离） |
| 集成测试（Testcontainers） | 组件协作 | 无（测试容器） |
| E2E（Playwright） | 用户旅程完整 | 无（受控环境） |
| 负载测试（k6） | 性能 SLO | 无（正常负载） |
| **混沌测试（Pumba + k6）** | **韧性 + 自愈** | **主动注入故障** |

混沌测试填补了"故障容忍"这一验证空白——其他测试层都假设环境正常工作。

## CI 集成建议

混沌测试较慢（单场景 ~60s，全部 ~4min）且需要 Docker daemon，**不建议**默认在 CI 跑。
推荐方式：

- **定期跑**：每周一次的 cron job（参考 codeql.yml 的每周模式）
- **发布前跑**：v1.0 发布前的回归验证
- **手动触发**：`workflow_dispatch` 手动触发的工作流

未来如需加 CI，参考模式：

```yaml
chaos:
  name: 混沌测试
  runs-on: ubuntu-latest
  if: github.event_name == 'workflow_dispatch'   # 手动触发
  steps:
    - uses: actions/checkout@v4
    - run: docker compose -f docker/docker-compose.yml up -d --build
    - run: docker compose -f docker/docker-compose.yml exec -T backend curl -sf http://localhost:8080/health
    - name: 安装 k6
      run: |
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update && sudo apt-get install -y k6
    - run: ./tests/stress/chaos-test.sh network-delay
```

## 文件清单

| 文件 | 作用 |
|------|------|
| `tests/stress/chaos-test.sh` | 编排脚本：4 场景 × 故障注入 + 探针调度 |
| `tests/stress/chaos-probe.js` | k6 韧性探针：健康检查 + 业务 API 轮询，故障期间验证不雪崩 |
| `docs/CHAOS_TESTING.md` | 本文档 |

## Pumba 故障类型速查

```bash
# 网络延迟（netem delay）
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock gaiaadm/pumba:0.8.1 \
  netem --duration 45s --netem-delay 500ms:100ms --regex equipai-backend

# 网络丢包（netem loss）
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock gaiaadm/pumba:0.8.1 \
  netem --duration 45s --netem-loss 5 --regex equipai-redis

# 容器 kill（模拟崩溃，依赖 restart 策略自愈）
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock gaiaadm/pumba:0.8.1 \
  kill --duration 45s --regex equipai-backend

# 容器 pause（模拟 CPU 节流 / GC 暂停）
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock gaiaadm/pumba:0.8.1 \
  pause --duration 45s --regex equipai-postgres
```

`--duration` 控制故障持续时长，到期后 Pumba 自动解除。容器名用 `--regex` 正则匹配。
