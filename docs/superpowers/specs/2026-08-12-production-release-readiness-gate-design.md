# 生产发布与回滚统一门禁设计

> 设计日期：2026-08-12  
> 适用范围：EquipSense 生产滚动部署链路  
> 设计状态：已确认，待实施

## 1. 背景与问题

当前项目已经具备多个独立的生产安全能力：

- `docker/validate-env.sh` 校验生产环境变量、凭据强度、重复键、运行时证书和敏感文件权限；
- `docker/production-readiness.sh` 提供只读静态校验和可选的 Compose 运行态检查；
- `docker/deploy-production.sh` 执行应用镜像滚动部署、三项应用健康检查和失败回滚；
- `tests/backup-restore-rehearsal.sh` 真实验证 PostgreSQL 与附件恢复；
- CI 已执行生产镜像 smoke、全量 E2E、备份恢复和 k6 回归。

但这些能力目前仍是分散的。部署脚本只对后端、前端和边缘网关做健康探测，没有在成功记账前确认 RabbitMQ、Redis、监控和其他 Compose 服务的最终状态；运行态 readiness 入口主要依赖人工调用。这样可能出现“核心 HTTP 探针通过，但依赖服务异常，部署仍被记录为成功”的误判。

当前工作区实测 `docker/validate-env.sh docker/.env --check-runtime-files` 返回 27 项问题，因此本设计不会绕过或弱化生产门禁，也不会通过测试凭据、演示数据或自动生成的自签名证书伪造上线成功。

## 2. 目标与非目标

### 2.1 目标

1. 将 `production-readiness.sh` 接入 `deploy-production.sh` 的部署前、部署后和回滚后路径。
2. 让 readiness 同时解析基础 Compose 文件与生产 overlay，确保检查对象与真实部署对象一致。
3. 只有静态门禁、应用健康检查和全量运行态检查全部通过，部署脚本才写入 `.last-deployed-tag` 并报告成功。
4. 目标版本运行态检查失败时，自动使用本机已有旧镜像回滚；回滚后再次执行同一套全量 readiness。
5. 保持凭据不进入 Shell 参数、日志和测试输出；保持静态 readiness 只读，不调用 `up`、`start`、`restart`、`build`、`pull` 或 `exec`。
6. 用脚本回归测试锁定调用顺序、失败闭环和安全边界。

### 2.2 非目标

- 不修改真实 `docker/.env`，不代替用户注入正式凭据、PII/MFA 密钥、AutoMapper 许可证或正式 TLS/MQTT 证书。
- 不在本次设计中实现 OPC UA/Modbus 现场接入、钉钉/飞书真实联调或完整容量压测。
- 不改变数据库迁移、种子数据、业务 API、Compose 服务拓扑和回滚所使用的镜像策略。
- 不把 readiness 变成会自动修复配置或自动启动服务的工具。

## 3. 设计方案

### 3.1 readiness 的 Compose 文件输入

`docker/production-readiness.sh` 保留现有接口和默认行为：

```text
bash production-readiness.sh --env-file <路径>
bash production-readiness.sh --env-file <路径> --runtime
```

新增可重复的 `--compose-file <路径>` 参数。未指定时继续使用现有默认 Compose 文件；指定一次或多次时，按参数顺序传递多个 `-f` 给 Docker Compose。已有的 `PRODUCTION_COMPOSE_FILE` 环境变量保持兼容，仅在没有命令行参数时作为单文件默认值使用。

脚本内部把 Compose 文件解析为绝对路径，并对每个文件执行存在性与符号链接边界检查。所有 Docker 输出仍通过捕获和脱敏路径处理，失败信息只保留变量名、文件名、服务名、状态和错误类别。

### 3.2 部署脚本的门禁编排

`deploy-production.sh` 新增一个内部 `run_readiness_gate` 辅助函数，统一调用同目录的 `production-readiness.sh`，并传入：

- `--env-file "$COMPOSE_DIR/.env"`；
- `--compose-file "$COMPOSE_DIR/docker-compose.yml"`；
- `--compose-file "$COMPOSE_DIR/docker-compose.prod.yml"`；
- 按调用场景追加 `--runtime`。

部署阶段顺序调整为：

1. 获取部署锁并验证脚本、Compose 文件和环境文件存在；
2. 执行 readiness 静态门禁，确认环境变量、运行时文件、Docker daemon 和合并后的 Compose 配置均有效；
3. 读取当前版本；如果目标版本已部署，先执行现有三项健康检查，再执行全量运行态 readiness，健康时幂等退出；
4. 登录镜像仓库并拉取目标版本；
5. 重建 backend、frontend、edgegateway；
6. 执行现有后端 readiness、边缘网关 health 和前端容器 health 检查；
7. 执行全量运行态 readiness，要求除一次性 `jaeger-init` 外的每个 Compose 服务均为 `running`，且已声明健康检查的服务必须为 `healthy`；
8. 全部通过后原子写入 `.last-deployed-tag`。

部署前的静态 readiness 不会要求服务已经运行，因此支持首次部署；部署后的 `--runtime` readiness 只读取状态，不修改服务。

### 3.3 回滚闭环

目标版本的应用健康检查或全量 readiness 失败时，继续使用现有的本机旧镜像回滚逻辑。回滚逻辑在应用健康检查通过后追加全量 readiness：

- 回滚后 readiness 通过：记录“回滚验证通过”，部署命令仍返回目标部署失败的原始非零状态；
- 回滚后 readiness 失败：记录明确的严重故障，保留失败现场，部署命令返回非零状态；不更新 `.last-deployed-tag`。

这样不会把“成功回滚”误报成“目标版本部署成功”，也不会在依赖服务仍异常时覆盖历史版本记录。

### 3.4 文件完整性与部署兼容性

`deploy-production.sh` 的必需文件清单增加 `production-readiness.sh`。`docker/setup.sh` 已有的完整性和可执行权限检查继续保留，确保通过安装或发布流程准备的部署目录具备统一门禁入口。

## 4. 错误处理与安全约束

- readiness 静态校验失败时，部署脚本必须在镜像仓库登录、镜像拉取和容器重建前退出。
- Compose 配置解析失败时，不展示 Docker 展开的配置内容，避免环境变量被回显。
- 运行态服务缺失、状态不是 `running` 或健康状态不是 `healthy` 时，按服务名和状态报告失败。
- 一次性 `jaeger-init` 允许为 `exited`，其他服务不允许以 `exited` 作为成功状态。
- `production-readiness.sh` 不 source `.env`，不把凭据拼接到 Docker 参数，不将 `.env` 内容写入报告或日志。
- readiness 的失败输出继续经过敏感值替换；测试必须使用特意构造的凭据验证未知 Compose 错误也不会泄露原值。
- 现有部署锁、版本记录原子替换、旧镜像回滚和信号处理逻辑保持不变。

## 5. 测试策略

修改 `tests/scripts/production-scripts-test.sh`，使用现有的临时目录和 Docker/curl 替身，不启动用户真实生产服务。

### 5.1 readiness 测试

- 单 Compose 文件兼容现有调用方式；
- 两个 Compose 文件按顺序传递给 Docker Compose；
- 静态门禁失败时返回非零且未调用 `pull`、`up`、`start`、`restart` 或 `exec`；
- 运行态所有服务健康时返回 0；
- 任意服务缺失、停止或 unhealthy 时返回非零；
- Compose 错误包含秘密值时输出不包含该值；
- `jaeger-init` 为 exited 时允许通过，其他 exited 服务拒绝。

### 5.2 部署与回滚测试

- 静态 readiness 失败时，命令日志证明不会登录仓库、拉取镜像或重建容器；
- 目标版本应用探针通过但全量 readiness 失败时，触发旧版本回滚；
- 回滚后的 readiness 通过时保留旧版本记录且命令仍返回目标版本失败状态；
- 回滚后的 readiness 失败时返回非零并保留严重故障输出；
- 全量 readiness 通过后才写入目标 tag；
- 同 tag 幂等路径同样执行运行态 readiness；
- 所有测试输出不包含测试凭据。

### 5.3 项目级验证

```bash
bash tests/scripts/production-scripts-test.sh readiness
bash tests/scripts/production-scripts-test.sh deploy
bash tests/scripts/production-scripts-test.sh all
bash -n docker/production-readiness.sh docker/deploy-production.sh \
  tests/scripts/production-scripts-test.sh
git diff --check
```

## 6. 验收标准

本子项目完成时必须同时满足：

1. 代码、测试和文档均使用中文新增说明，并保持现有 Bash 严格模式。
2. 发布脚本不再仅凭三项应用探针记录部署成功。
3. 生产 Compose overlay 被纳入静态和运行态 readiness。
4. 失败部署能验证回滚，回滚结果不会覆盖目标失败事实。
5. 所有相关脚本回归测试、语法检查和差异空白检查通过。
6. 真实 `docker/.env` 的 27 项问题仍被如实报告；本子项目不得通过放宽校验、切换 Development 或开启演示种子来降低问题数量。

## 7. 后续生产就绪工作

该子项目完成后，生产上线仍需单独完成并留存证据：正式凭据和证书注入、PII/MFA 密钥恢复演练、真实环境 RTO/RPO、容量基线、附件存储策略，以及钉钉/飞书和 OPC UA/Modbus 现场联调。这些事项不由代码门禁的绿色结果替代。
