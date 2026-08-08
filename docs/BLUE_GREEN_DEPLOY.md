# 蓝绿部署指南（Blue-Green Deployment）

> 零停机部署方案：新版本起在非活跃颜色实例上，健康检查通过后 Nginx 原子切换流量，
> 切换中断 <1 秒。适用于对可用性有更高要求的部署（对应 [SLO-1 ≥99.9%](SLO.md)）。
>
> 默认 CI 部署（`.github/workflows/ci.yml` deploy job）使用**滚动重启 + 健康门禁 + 失败回滚**
> 策略，已有秒级中断 + 自动回滚。蓝绿部署是其**零停机升级方案**，需服务器有双实例资源。

---

## 架构

```
                    ┌─────────────┐
  用户 ────80/443──▶│   router    │  Nginx 路由层（upstream 可热切换）
                    │  (nginx)    │
                    └──────┬──────┘
                           │ proxy_pass
              ┌────────────┼────────────┐
              ▼                         ▼
     ┌─────────────────┐      ┌─────────────────┐
     │  backend-blue   │      │  backend-green  │
     │  frontend-blue  │      │  frontend-green │
     │   (:8081/:3001) │      │   (:8082/:3002) │
     └─────────────────┘      └─────────────────┘
              │                         │
              └──────────┬──────────────┘
                         ▼
              PostgreSQL / Redis / Mosquitto（共享，有状态）
```

- **router**（`equipai-router`）：独立 Nginx 容器，入口 80/443，upstream 指向活跃色
- **blue / green**：backend + frontend 各两份，监听独立端口，同一时刻仅活跃色服务流量
- **共享层**：PostgreSQL / Redis / Mosquitto 单实例（有状态，不蓝绿）

---

## 文件清单

| 文件 | 作用 |
|------|------|
| `docker/docker-compose.bluegreen.yml` | blue/green 实例 + router 服务定义（profiles: blue/green） |
| `docker/nginx.bluegreen.conf` | router 容器 Nginx 配置（含 upstream_active include） |
| `docker/upstream-active.conf` | 当前活跃色 upstream（由部署脚本维护，reload 生效） |
| `docker/.active-color` | 当前活跃色记录（blue/green，首次部署默认 blue） |
| `scripts/deploy-bluegreen.sh` | 部署编排脚本（拉镜像 → 健康 → 切换 → 停旧） |

---

## 首次启用蓝绿

在服务器上（`$DEPLOY_PATH/docker/` 目录）执行：

```bash
# 1. 初始化活跃色（默认 blue）
echo "blue" > .active-color

# 2. 初始化 upstream 指向 blue
cat > upstream-active.conf <<'EOF'
upstream backend_active { server backend-blue:8080; }
upstream frontend_active { server frontend-blue:80; }
EOF

# 3. 首次部署：启动 blue（此时 green 尚不存在）
TAG=1.0.0 ./../scripts/deploy-bluegreen.sh 1.0.0
# 注：首次部署 target=green 会因 green 未构建而失败。
#     首次应直接用：docker compose -f docker-compose.yml -f docker-compose.prod.yml \
#       -f docker-compose.bluegreen.yml --profile blue up -d
```

---

## 常规部署流程

CI 的 deploy job 在打 `vX.Y.Z` tag 时触发。切换到蓝绿后，将 deploy job 的 `script`
替换为调用 `scripts/deploy-bluegreen.sh $TARGET_VERSION`（见下方「CI 切换」）。

手动部署：

```bash
# 在服务器 DEPLOY_PATH/docker/ 目录
GHCR_PULL_USER=xxx GHCR_PULL_TOKEN=xxx \
  ../../scripts/deploy-bluegreen.sh 1.2.3
```

脚本执行步骤：

1. **读活跃色** — `.active-color`（blue→部署 green，反之）
2. **拉镜像** — GHCR 登录 + pull backend/frontend 到目标色（旧色仍服务）
3. **健康门禁** — 轮询目标色 `/health` 最多 120s（旧色不受影响）
4. **原子切换** — 重写 `upstream-active.conf` → `nginx -s reload`（<1s 中断）
5. **drain 旧色** — 等待 30s 让现有连接完成 → stop 旧色
6. **记录** — 更新 `.active-color` + `.last-deployed-tag`

---

## 失败处理

### 健康检查失败（部署前）

目标色健康检查不过 → **不切换**，旧色继续服务，脚本退出 1。
目标色容器自动 stop。修复后重新部署即可。

### 切换后新色异常（已接管流量）

手动回切到旧色：

```bash
cd $DEPLOY_PATH/docker
# 旧色在 step 5 被 stop 前，切换后旧色仍在运行 30s drain 窗口内
# 若已 stop，重启它：
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  -f docker-compose.bluegreen.yml --profile <旧色> start backend-<旧色> frontend-<旧色>

# 改 upstream 回旧色
cat > upstream-active.conf <<EOF
upstream backend_active { server backend-<旧色>:8080; }
upstream frontend_active { server frontend-<旧色>:80; }
EOF
docker exec equipai-router nginx -s reload
echo "<旧色>" > .active-color
```

---

## CI 切换（从滚动升级到蓝绿）

修改 `.github/workflows/ci.yml` deploy job 的 SSH script，替换滚动重启逻辑为：

```yaml
script: |
  set -euo pipefail
  cd "$DEPLOY_PATH"
  # 登录 GHCR（凭证从服务器环境变量）
  echo "$GHCR_PULL_TOKEN" | docker login ghcr.io -u "$GHCR_PULL_USER" --password-stdin
  # 调用蓝绿编排脚本
  bash scripts/deploy-bluegreen.sh "$TARGET_VERSION"
```

**前置**：服务器需已执行「首次启用蓝绿」，且内存足够双实例运行
（backend 单实例限 1G，双实例需 2G+ 可用）。

---

## 资源考量

| 组件 | 单实例 | 蓝绿（双实例） |
|------|--------|---------------|
| backend | 1G（compose 限制） | 2G |
| frontend | 256M | 512M |
| router | 64M | 64M（单实例，不蓝绿） |
| **增量** | — | **+1.3G 内存** |

蓝绿部署用 ~1.3G 内存换取零停机。资源紧张时保留默认滚动部署（秒级中断）。

---

## 与默认滚动部署的对比

| 特性 | 滚动部署（默认） | 蓝绿部署（可选） |
|------|----------------|----------------|
| 中断时间 | 秒级（容器重启） | **<1 秒**（Nginx reload） |
| 回滚速度 | 重拉旧镜像重启（分钟级） | **upstream 切回**（秒级） |
| 资源占用 | 单实例 | 双实例（+1.3G） |
| 复杂度 | 低 | 中（需 router + 编排脚本） |
| 适用 | 通用 | 高可用要求场景 |

---

## 相关文档

- [SLO（SLO.md）](SLO.md) — 可用性目标（蓝绿帮助达成 99.9%）
- [运维剧本（OPS_RUNBOOK.md）](OPS_RUNBOOK.md) — 部署故障处理
- [部署文档（DEPLOY.md）](DEPLOY.md) — 基础部署流程
- [CI/CD 流水线（ci.yml）](../.github/workflows/ci.yml) — 自动化部署触发
