# EquipSense 生产安装与验收指南

> 适用版本：EquipSense v1.2.0
>
> 文档版本：1.0.0
>
> 更新日期：2026-08-12

本指南面向负责安装、验收和交接的实施工程师。目标是在一台符合要求的 Docker 主机上完成 EquipSense 的安全配置、生产启动、核心链路验收和回滚准备。

本指南不包含真实密码、许可证、域名、租户 UUID 或证书私钥。请通过企业密钥管理系统或受控交付渠道提供这些值，不要把它们写入代码仓库、工单或聊天记录。

---

## 1. 部署边界与模式

### 1.1 三种运行模式

| 模式 | 用途 | 是否创建测试数据 | 是否允许自签名证书 |
|---|---|---:|---:|
| Development | 本地开发和基础设施联调 | 可以 | 可以 |
| 隔离验收 | 临时演示、Smoke、E2E | `true`/`1` 为最小种子，`full` 为完整演示集 | 仅限隔离环境 |
| Production | 客户真实租户和设备 | 默认关闭 | 不允许 |

Production 默认只初始化系统租户、引导租户、生产种子账户、行业设备模板和诊断知识，不创建 `tenant-b`、`tenant2admin` 或 `AC-001` 示例设备。`SEED_DEMO_DATA=full` 仅用于临时隔离数据库，会创建固定的 10 台演示设备、24 小时遥测、5 条告警和 4 张工单；不要为了让页面有数据而在真实租户中开启演示数据。

### 1.2 交付前责任边界

以下内容必须由部署方提前准备，项目不会自动代替完成：

- 真实租户 UUID、生产域名和 DNS 解析。
- PostgreSQL、Redis、RabbitMQ、MQTT、Seq、Grafana 和种子账户的独立强密码。
- TOTP、PII、JWT 和网关认证的独立密钥，以及密钥备份策略。
- AutoMapper 生产许可证密钥。
- Nginx TLS 证书链、私钥和 MQTT CA/服务端证书。
- 现场边缘网关、OPC UA/Modbus 设备和外部通知渠道的联调窗口。

---

## 2. 主机与网络准备

### 2.1 最低配置

| 项目 | 最低要求 | 推荐要求 |
|---|---:|---:|
| Docker Engine | 24+ | 最新稳定版 |
| Docker Compose | v2+ | 随 Docker Desktop 或 Docker Engine 安装 |
| CPU | 2 核 | 4 核 |
| 内存 | 4 GB | 8 GB |
| 可用磁盘 | 20 GB | 50 GB SSD |
| 时钟 | NTP 同步 | NTP 同步并有漂移监控 |

安装前确认 Docker daemon 可用，并确认主机防火墙只开放实际需要的端口。数据库、Redis、RabbitMQ、Seq 和内部后端端口默认只绑定到内部地址；不要把它们直接暴露到公网。

### 2.2 端口核对

| 服务 | 默认端口 | 暴露原则 |
|---|---:|---|
| 前端 HTTPS | 443 | 对用户开放，建议只允许 80 重定向到 443 |
| 后端 API | 8080 | 仅内网或受控反向代理访问 |
| 边缘网关健康检查 | 8081 | 仅运维网或本机访问 |
| MQTT over TLS | 8883 | 仅现场网关和受控客户端访问 |
| PostgreSQL | 5432 | 不对公网开放 |
| Redis | 6379 | 不对公网开放 |
| RabbitMQ | 5672 | 不对公网开放 |
| Jaeger UI | 16686 | 仅运维网访问 |

---

## 3. 获取代码与生成初始密钥

在受控的部署目录执行：

```bash
git clone <仓库地址> EquipSense
cd EquipSense
cp docker/.env.example docker/.env
chmod 600 docker/.env
```

运行初始化工具生成随机凭据。该工具不会生成许可证、真实租户 UUID、生产域名或证书：

```bash
cd docker
./bootstrap-production-secrets.sh
cd ..
```

如果提示缺少人工配置或返回非零，不要把它当作“可上线”信号。先保存生成的 `docker/.env`，再根据门禁输出逐项补齐配置。

### 3.1 必填配置

在 `docker/.env` 中填写部署方持有的真实值：

```env
PG_PASSWORD=<独立强密码，至少16位>
REDIS_PASSWORD=<独立强密码，至少16位>
RABBITMQ_PASSWORD=<独立强密码，至少16位>
MQTT_USERNAME=<现场网关用户名>
MQTT_PASSWORD=<独立强密码>
JWT_SECRET=<至少32位随机密钥>
TOTP_ENCRYPTION_KEY=<32字节AES-256密钥的Base64值>
PII_ENCRYPTION_KEY=<与TOTP不同的32字节AES-256密钥>
AUTOMAPPER_LICENSE_KEY=<供应商签发的真实许可证>
GATEWAY_AUTH_KEY=<至少32位纯ASCII随机密钥>
GATEWAY_ID=<现场网关唯一标识>
GATEWAY_TENANT_ID=<真实租户UUID>
SEED_ADMIN_PASSWORD=<管理员初始密码>
SEED_LEAD_PASSWORD=<主管初始密码>
SEED_TECH_PASSWORD=<技术员初始密码>
SEED_OPERATOR_PASSWORD=<操作员初始密码>
SEED_VIEWER_PASSWORD=<观察者初始密码>
VAPID__PUBLICKEY=<Web Push公钥>
VAPID__PRIVATEKEY=<Web Push私钥>
RABBITMQ_IMAGE=<带digest的RabbitMQ镜像引用>
SEQ_ADMIN_PASSWORD=<独立强密码>
GRAFANA_PASSWORD=<独立强密码>
SEED_DEMO_DATA=false
```

除 `SEED_DEMO_DATA=false` 外，不要把示例值或仓库内置默认值带入 Production。`true`/`1` 和 `full` 只可用于显式隔离验收；五个种子账户首次登录后必须修改密码；SystemAdmin 和 MaintenanceLead 还必须完成 MFA 注册。

### 3.2 证书准备

Production 需要把正式文件预先放入以下位置：

```text
docker/ssl/cert.pem       # Nginx 证书链
docker/ssl/key.pem        # Nginx 私钥，权限 600
docker/mqtt-certs/ca.crt  # MQTT CA
docker/mqtt-certs/server.crt
docker/mqtt-certs/server.key
```

正式证书必须满足域名/SAN、有效期、证书链、私钥权限和证书私钥匹配检查。`docker/generate-cert.sh` 与 `docker/generate-mqtt-cert.sh` 只用于开发或隔离验收，不能用于真实生产。

---

## 4. 启动前门禁

先执行静态检查。该命令不会启动、重启、构建或拉取服务：

```bash
bash docker/production-readiness.sh --env-file docker/.env
```

静态检查通过后，再执行包含运行时文件和证书检查的门禁：

```bash
bash docker/validate-env.sh docker/.env --check-runtime-files
```

门禁失败时禁止继续发布。只按输出的变量名、文件名、服务名和错误类别整改，不要把密钥值复制到日志或工单。

### 4.1 启动前签字清单

- [ ] `docker/.env` 权限为 `600`，且未被提交到版本库。
- [ ] 所有数据库、缓存、消息队列、监控和种子账户密码彼此独立。
- [ ] `JWT_SECRET`、TOTP、PII 和网关密钥彼此独立。
- [ ] `SEED_DEMO_DATA=false`，未设置测试租户账户。
- [ ] Nginx 和 MQTT 正式证书已放置，私钥权限为 `600`。
- [ ] MQTT 服务端证书 SAN 包含实际 Broker 主机名。
- [ ] `GATEWAY_TENANT_ID` 是真实租户 UUID，边缘网关配置与后端一致。
- [ ] 数据库、附件卷和监控数据卷已有备份或快照策略。
- [ ] 密钥管理系统中已保存恢复所需的密钥和恢复责任人。

---

## 5. 启动与验收

从仓库根目录统一使用生产 Compose 入口：

```bash
docker/compose-production.sh up -d
```

应用首次启动会在 PostgreSQL advisory lock 保护下依次完成迁移、PII 历史数据回填、基础种子和 TimescaleDB 初始化。不要在此期间启动第二套迁移或手工修改数据库结构。

查看状态和日志：

```bash
docker/compose-production.sh ps
docker/compose-production.sh logs --tail=100 backend
```

### 5.1 运行态健康检查

```bash
bash docker/production-readiness.sh --env-file docker/.env --runtime
curl --fail http://localhost:8080/health/startup
curl --fail http://localhost:8080/health/ready
curl --fail http://localhost:8081/health
curl --fail https://<生产域名>/health
```

验收结果必须同时满足：

- 所有必需服务处于 `running`，健康检查为 `healthy`。
- `/health/startup`、`/health/ready` 和边缘网关 `/health` 返回成功。
- `rabbitmq-eventbus`、PostgreSQL、Redis 和 MQTT 依赖在 ready 检查中均为通过。
- 证书监控指标可读，且没有证书即将过期告警。
- 后端日志没有迁移失败、PII 回填失败、凭据复用或 TLS 降级错误。

### 5.2 用户与核心链路验收

1. 使用 `SEED_ADMIN_PASSWORD` 登录管理员账户。
2. 按页面提示修改初始密码，并完成管理员 MFA 注册，保存一次性恢复码。
3. 创建一个真实测试设备或登记边缘网关设备配置，不使用 `AC-001` 示例设备。
4. 通过 MQTT over TLS 发送一条合法遥测数据，确认设备最近数据时间更新。
5. 制造一条受控阈值异常，确认告警生成、SignalR 实时刷新和告警确认流程可用。
6. 验证告警对应的 AI 分析降级链路：无 LLM 时仍能返回规则或统计分析结果，并明确标注置信度/降级级别。
7. 确认告警可创建工单、工单状态可流转、操作日志可追溯。
8. 使用两个租户账号分别读取设备、告警和工单，确认不能看到对方数据。

不要使用真实客户故障、真实恢复码或真实敏感遥测作为验收样本。

---

## 6. 备份、恢复与回滚

生产上线前至少完成一次“备份后恢复到隔离环境”的演练，并记录耗时、数据条数和校验结果。数据库、TimescaleDB 遥测、附件卷、Redis/RabbitMQ 状态和密钥材料要分别定义恢复责任。

常用入口：

```bash
# 查看备份与恢复帮助
bash docker/backup-restore.sh --help

# 发布前记录只读状态
bash docker/production-readiness.sh --env-file docker/.env --runtime

# 生产发布或回滚统一经过部署脚本门禁
bash docker/deploy-production.sh --help
```

### 6.1 回滚原则

- 配置校验失败时不调用 Docker，不进行半套启动。
- 健康检查或关键链路验收失败时，停止继续扩容，保留失败版本日志和追踪 ID。
- 代码回滚必须与数据库迁移兼容性一起评估；不要直接删除迁移或执行未审批的破坏性 SQL。
- 回滚后重新执行 `/health/ready`、MQTT TLS、告警和租户隔离验收。
- 附件恢复必须检查对象/卷中的文件数量、大小和可下载性，不能只验证数据库记录。

---

## 7. 常见故障处理

### 后端未就绪

```bash
docker/compose-production.sh ps backend postgres redis rabbitmq
docker/compose-production.sh logs --tail=200 backend
bash docker/validate-env.sh docker/.env --check-runtime-files
```

优先检查 PostgreSQL 连接、JWT/TOTP/PII/AutoMapper 配置、RabbitMQ 镜像 digest 和证书挂载。不要通过关闭启动门禁来“先让服务跑起来”。

### MQTT 无数据

```bash
docker/compose-production.sh ps mosquitto edgegateway
docker/compose-production.sh logs --tail=200 mosquitto edgegateway
curl --fail http://localhost:8080/metrics | grep equipai_certificate_
```

确认网关使用 8883/TLS、用户名密码与 Mosquitto 密码文件一致、CA 可读、Broker 主机名匹配证书 SAN。不要把 MQTT 切回明文端口作为生产修复。

### 告警没有触发

确认遥测已入库、规则启用、指标名称和设备类型匹配，并检查告警评估耗时与 RabbitMQ 重试/死信队列。持续异常应先判断是否为传感器故障或告警风暴聚合，而不是直接降低阈值。

### 前端无法登录

确认浏览器访问的是正式域名和 HTTPS，后端 `/health` 正常，管理员使用部署时注入的初始密码，且首次登录完成改密/MFA。不要在生产环境恢复仓库内置默认密码。

---

## 8. 交接材料与参考入口

交接包至少包含以下内容，但不应包含密钥明文、私钥、MFA 恢复码或完整生产日志：

- 本指南对应版本和实际部署时间。
- 主机规格、域名、端口、防火墙和备份位置。
- 服务版本、镜像 digest、数据库迁移版本。
- 健康检查、核心链路和租户隔离验收结果。
- 备份恢复演练记录、预计 RTO/RPO 和责任人。
- 证书到期时间、轮换负责人和密钥管理系统引用。
- 外部通知、边缘网关和现场协议联调记录。

详细资料：

- `docs/DEPLOY.md` - 完整部署参数和环境变量说明。
- `docs/OPS_RUNBOOK.md` - 日常运维、故障排查、备份恢复和回滚剧本。
- `docs/environment-variables.md` - 后端、前端和边缘网关配置清单。
- `docs/USER_GUIDE.md` - 用户操作手册。
- `docs/LANDING_READINESS_REPORT.md` - 当前生产就绪基线和剩余外部依赖。

---

## 9. 最终签字

| 验收项 | 结果 | 负责人 | 日期 |
|---|---|---|---|
| 启动前门禁通过 |  |  |  |
| 服务健康检查通过 |  |  |  |
| 管理员改密和 MFA 完成 |  |  |  |
| MQTT TLS 遥测链路通过 |  |  |  |
| 告警和工单闭环通过 |  |  |  |
| 租户隔离验证通过 |  |  |  |
| 备份恢复演练通过 |  |  |  |
| 交接包已归档 |  |  |  |

**结论：** 只有当所有上线前门禁和核心链路验收项都通过，并且真实凭证、证书、租户和备份恢复责任均已落实，才可以将本次部署标记为 Production Ready。
