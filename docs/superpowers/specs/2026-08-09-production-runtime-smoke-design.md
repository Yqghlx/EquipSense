# Production 容器运行时 Smoke Gate 设计

## 背景

当前 CI 的完整 Playwright E2E 使用 \`ASPNETCORE_ENVIRONMENT=Development\` 的本地后端和 Vite 开发服务器。它适合覆盖 442 条业务流程，但不会验证 Production 启动校验、生产镜像入口脚本、Nginx TLS、MQTT TLS 文件挂载和生产 Compose 依赖闭环。直接把完整 E2E 切换到 Production 又会把真实 MFA 注册、强制改密等安全流程混入所有 CRUD 用例，导致测试目标和生产风险混杂。

## 目标

1. 在 Pull Request、main 推送和版本标签流水线中，用实际 Dockerfile 构建后端/前端镜像。
2. 使用 \`ASPNETCORE_ENVIRONMENT=Production\`、独立临时凭据、临时 TLS/MQTT 证书和生产 Compose 核心服务启动：PostgreSQL、Redis、Mosquitto、RabbitMQ、backend、frontend。
3. 自动验证数据库迁移与种子、后端 startup/liveness 探针、前端 HTTPS、Nginx \`/health\`、\`/api/\` 反向代理和容器健康状态。
4. 不依赖真实 AutoMapper 商业许可证、真实生产域名或生产证书；测试凭据和证书只存在于临时目录，不能替代发布前的真实凭据/证书门禁。
5. 保留现有 Development 全功能 E2E，避免把“运行时启动门禁”和“业务用户流程验收”混为一谈。

## 方案选择

### 方案 A：把完整 E2E 直接改为 Production

会把首次登录改密、管理员/维保主管 MFA enrollment、TOTP 时间窗口等安全流程传播到大量测试，维护成本高，失败时难以判断是产品回归还是测试初始化问题，不采用。

### 方案 B：新增 Production runtime smoke gate（采用）

独立构建实际生产镜像，复制不含凭据的 Compose 配置到临时目录，生成短生命周期环境变量、TLS/MQTT 证书和 Mosquitto 密码文件，启动生产 Compose 的核心服务。Smoke 只验证启动、依赖、健康探针和 HTTPS 代理，不登录业务账户；完整用户流程继续由 Development E2E 覆盖。

### 方案 C：只在 CI 中执行 \`docker compose config\`

只能发现变量和 YAML 合并错误，无法发现镜像入口脚本、数据库迁移、证书挂载、MQTT TLS 或运行时健康问题，覆盖不足。

## 运行时设计

### 临时环境隔离

- 使用临时 Compose 项目名和临时工作目录。
- 只复制 \`docker/\` 中的配置、Dockerfile 和监控/RabbitMQ provisioning 文件；明确排除仓库 \`.env\`、证书私钥、MQTT CA 私钥、密码文件和备份目录。
- 生成的环境变量文件权限为 \`600\`，退出时删除临时目录和 Compose volumes。
- Production Compose 的固定容器名要求 CI runner 上不存在同名容器；脚本启动前检查冲突并快速失败，避免误接管用户服务。

### 凭据和证书

- PostgreSQL、Redis、RabbitMQ、MQTT、JWT、TOTP、Gateway、五个种子账户使用本次运行随机生成的相互独立值。
- AutoMapper 使用 CI 注入的测试许可证字符串或仅用于启动契约验证的随机长字符串；真实生产发布仍必须通过正式许可证门禁。
- Nginx 使用 \`localhost\` 自签名证书，MQTT 使用临时 CA 签发的 \`mosquitto\` 服务证书；只用于测试 TLS 握手和挂载链路。
- Mosquitto 密码文件使用镜像内 \`mosquitto_passwd\` 生成，不在日志输出密码。

### Smoke 断言

1. \`docker compose config --quiet\` 成功。
2. backend 和 frontend 镜像实际启动，\`ASPNETCORE_ENVIRONMENT=Production\` 生效。
3. backend 容器健康，且宿主机 \`/health/startup\`、\`/health\` 返回成功。
4. frontend 容器健康，\`https://localhost:8443/health\` 和 \`/login\` 返回成功；使用临时 CA/自签名证书时客户端仅在测试中使用 \`--insecure\`。
5. Nginx \`/api/v1/...\` 代理到 backend，至少通过一个公开 API/健康路径验证反向代理没有返回静态页面伪响应。
6. 失败时输出容器状态，不输出环境变量、证书私钥或数据库日志中的敏感内容；退出码非零。

## CI 集成

- 新增 \`production-smoke\` job，依赖 backend/frontend 质量 job，在 PR、main push 和版本 tag 上运行。
- 该 job 构建本地 smoke 标签镜像，不推送 registry。
- 版本发布 job 依赖 \`production-smoke\`，确保生成发布版本前至少通过 Production 启动门禁。
- 现有完整 E2E job 不改变环境，继续负责 Development 全功能业务验收。

## 测试与边界

- Shell 脚本先通过 \`bash -n\` 和生产脚本回归测试；敏感凭据不会出现在断言输出。
- CI smoke 是镜像和运行时契约测试，不等于真实域名证书、正式 AutoMapper 许可证、真实 SMTP/LLM、钉钉/飞书和现场 OPC UA/Modbus 验收。
- 这些外部条件继续列为发布前人工/环境门禁，不在 CI 中伪造通过。
