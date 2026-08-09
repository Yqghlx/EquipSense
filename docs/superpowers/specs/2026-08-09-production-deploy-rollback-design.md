# 生产滚动部署自动回滚设计

## 目标

把当前嵌在 GitHub Actions SSH 步骤中的滚动部署逻辑提取为可独立测试的脚本，使 backend/frontend 在首次变更后的任何失败都进入统一回滚流程，并对回滚结果再次执行健康门禁。数据库、缓存、消息队列、MQTT 和持久卷不属于本脚本的变更范围。

## 现状与问题

当前部署会在目标版本健康检查失败时回滚到 `.last-deployed-tag`，但仍有两个缺口：

1. `docker compose up` 等健康检查之前的命令受 `set -e` 控制，若命令部分执行后失败，会直接退出而绕过回滚分支。
2. 回滚只重新创建旧版本容器，不验证后端 readiness 和前端容器健康，却直接输出“已回滚”。

此外，核心逻辑位于 YAML 多行字符串内，现有测试只能搜索关键文本，无法模拟部署失败、回滚成功和回滚失败。

## 方案选择

### 采用：独立滚动部署脚本

新增 `docker/deploy-production.sh`，GitHub Actions 仅负责 SSH 到部署目录并调用脚本。脚本通过错误陷阱覆盖首次容器变更后的所有失败，使用本机已有旧镜像回滚，并复用同一健康检查函数验证目标版本和回滚版本。

优点是逻辑可在 CI 中用假 Docker/curl 做行为测试，错误处理集中且远程部署命令简短。代价是生产部署目录必须同步该脚本。

### 不采用：继续扩展 CI YAML

改动文件少，但 shell 引号、`set -e` 和错误陷阱难以可靠测试，部署行为仍与 CI 表示层耦合。

### 不采用：强制切换蓝绿部署

蓝绿切换能提供秒级回滚，但需要双实例资源、router 和首次现场初始化。它继续作为可选零停机方案，不能取代资源受限环境的默认滚动部署。

## 命令接口

```bash
cd /path/to/EquipSense/docker
./deploy-production.sh 1.2.3
```

脚本要求：

- 唯一位置参数是目标 Docker tag；必须符合 Docker tag 字符集和 128 字符长度限制。
- `COMPOSE_DIR` 默认是脚本所在目录，可在测试中覆盖。
- `GHCR_PULL_USER`、`GHCR_PULL_TOKEN` 从服务器环境读取，不写入命令行或日志。
- 可通过 `DEPLOY_HEALTH_URL`、`DEPLOY_MAX_ATTEMPTS`、`DEPLOY_POLL_INTERVAL_SECONDS`、`DEPLOY_INITIAL_DELAY_SECONDS`、`DEPLOY_ROLLBACK_INITIAL_DELAY_SECONDS` 和 `DEPLOY_HEALTH_TIMEOUT_SECONDS` 调整健康探测，生产默认分别为 `http://localhost:8080/health/ready`、`12`、`10`、`30`、`10` 和 `5`。
- 每次 HTTP 探测同时设置连接超时和总请求超时，单次无响应不得无限阻塞部署或回滚。

## 部署状态机

1. 校验 tag、`.env`、Compose 文件、`validate-env.sh` 和生产 bind mount 文件。
2. 使用目标 tag 渲染 Compose；预检失败时不登录仓库、不拉镜像、不改容器。
3. 读取并校验 `.last-deployed-tag`；同版本重复发布只执行健康检查，不重建容器。
4. 登录 GHCR 并拉取目标 backend/frontend 镜像。拉取失败时尚未改变运行态，不回滚。
5. 显式拉取完成后，在调用 `compose up --force-recreate --pull never` 前设置“已开始变更”标记，避免容器变更阶段再次依赖镜像仓库；此后的任意非零状态统一进入回滚处理。
6. 轮询后端 `/health/ready` 与前端容器 health；二者同时通过才算部署成功。
7. 使用临时文件加原子 `mv` 更新 `.last-deployed-tag`，随后解除错误陷阱。

## 回滚语义

- 只有运行态已经开始变更且历史 tag 合法时才自动回滚。
- 回滚使用 `docker compose up --pull never`，优先使用部署前已在本机运行的旧镜像，避免恢复路径依赖镜像仓库。
- 回滚后再次检查后端 readiness 和前端 health。通过时输出“回滚验证通过”，但部署命令仍以原始非零状态退出。
- 回滚失败或没有历史 tag 时输出明确的严重告警，保留现场并返回非零，不更新版本记录。
- 本脚本只替换 backend/frontend；不得停止或重建 PostgreSQL、Redis、RabbitMQ、Mosquitto 或任何数据卷。

## 测试设计

生产脚本回归测试使用临时目录和假 `docker`、`curl`：

1. 预检失败：断言未出现 login、pull 或 up。
2. 成功发布：目标健康后原子更新版本记录，未调用旧 tag 回滚。
3. 目标发布失败：断言使用旧 tag 和 `--pull never` 重建，并在第二轮健康探测成功后输出回滚验证通过；版本记录保持旧值。
4. 无历史版本：断言不会把显示用的“无历史版本”状态当作真实 Docker tag。
5. 回滚健康失败：断言输出严重告警、保持非零退出且不更新版本记录。
6. CI 契约：deploy job 必须调用脚本，并继续依赖 release 质量门禁。

## 文档与运维

`docs/DEPLOY.md` 说明默认滚动部署的自动回滚边界；`docs/OPS_RUNBOOK.md` 增加回滚失败后的日志、容器和版本记录检查步骤；`docs/BLUE_GREEN_DEPLOY.md` 保持蓝绿为资源充足环境的可选方案。

真实生产验收仍需使用实际镜像仓库、TLS 域名和生产资源完成一次失败注入演练；脚本级测试不能替代现场演练。
