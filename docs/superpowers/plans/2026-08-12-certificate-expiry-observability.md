# 证书有效期可观测性实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将生产环境 Nginx TLS 与 MQTT 证书的有效期、读取状态接入后端 Prometheus 指标，并通过 Alertmanager 规则在证书缺失、解析失败或即将过期时主动通知。

**Architecture:** 后端新增独立的证书扫描器，按配置读取只读公钥证书文件，周期性更新固定低基数的 Prometheus Gauge；不挂载 Nginx 私钥。证书读取失败不阻止进程存活，但会将监控状态置为 0 并触发 critical 告警；证书到期前 30 天发 warning，7 天内或已过期发 critical。生产 Compose 将 Nginx 公钥证书以单文件只读方式挂载到后端，避免监控依赖网络探测或额外服务。

**Tech Stack:** .NET 8 `BackgroundService`、`X509Certificate2`、prometheus-net、Docker Compose、Prometheus/Alertmanager、xUnit + FluentAssertions。

## Global Constraints

- 所有新增代码注释、日志和文档使用简体中文。
- 只读取公钥证书，不读取或挂载 Nginx TLS 私钥。
- 证书名称使用固定配置键，不把文件路径作为 Prometheus label，避免高基数和敏感路径泄露。
- 不修改真实 `docker/.env`、真实证书、现有容器或用户未请求的 Git 提交。
- 遵循 TDD：先写失败测试，再写最小实现；完成前执行后端单测、构建、配置校验和隔离 Production smoke。

---

### Task 1: 定义证书扫描边界并锁定失败行为

**Files:**
- Create: `tests/EquipAI.Tests.Unit/Metrics/CertificateMetricsReaderTests.cs`
- Create: `src/EquipAI.WebAPI/Metrics/CertificateMonitoringOptions.cs`
- Create: `src/EquipAI.WebAPI/Metrics/CertificateMetricsReader.cs`

**Interfaces:**
- `CertificateMonitoringOptions.Enabled`、`IntervalSeconds`、`Certificates` 配置属性。
- `CertificateMetricsReader.Read(IReadOnlyDictionary<string, string>)` 返回固定证书名对应的读取结果，包含证书状态、到期 Unix 时间戳和错误信息。

- [x] **Step 1: Write the failing tests**

  覆盖有效、缺失、损坏、私钥/PFX、符号链接和超大文件六条读取边界：有效证书返回状态 1 和正确到期时间；其余输入均返回状态 0 且不抛异常。

- [x] **Step 2: Run the focused tests to verify they fail**

  Run: `dotnet test tests/EquipAI.Tests.Unit --filter FullyQualifiedName~CertificateMetricsReaderTests --no-restore`

  Expected: 编译失败，因为扫描器和返回模型尚未实现。

- [x] **Step 3: Implement the minimal reader and options**

  `CertificateMetricsReader` 使用 `X509Certificate2` 读取路径，所有异常转换为结果对象；不记录证书内容、私钥或完整文件路径。选项将周期限制在至少 60 秒，避免错误配置造成高频文件扫描。

- [x] **Step 4: Run the focused tests to verify they pass**

  Run: `dotnet test tests/EquipAI.Tests.Unit --filter FullyQualifiedName~CertificateMetricsReaderTests --no-restore`

  Expected: 3 个测试通过。

### Task 2: 接入 Prometheus 指标与后台刷新

**Files:**
- Create: `src/EquipAI.WebAPI/Metrics/CertificateMetricsCollector.cs`
- Modify: `src/EquipAI.Infrastructure/Metrics/BusinessMetrics.cs`
- Modify: `src/EquipAI.WebAPI/Program.cs`

**Interfaces:**
- 新增 `equipai_certificate_expiry_timestamp_seconds{certificate}`、`equipai_certificate_monitoring_status{certificate}` 和 `equipai_certificate_days_until_expiry{certificate}` 三个 Gauge。
- `CertificateMetricsCollector` 启动时立即采集，随后按配置间隔采集；停止时遵守 `CancellationToken`。

- [x] **Step 1: Write collector tests for metric update contract**

  测试有效证书将状态设为 1、到期时间大于当前时间；测试缺失证书将状态设为 0、到期时间清零；指标写入器单证书异常时其余证书仍继续采集。

- [x] **Step 2: Run the focused collector tests to verify they fail**

  Run: `dotnet test tests/EquipAI.Tests.Unit --filter FullyQualifiedName~CertificateMetrics --no-restore`

  Expected: 编译失败或找不到指标更新实现。

- [x] **Step 3: Implement metrics and hosted service**

  在 `Program.cs` 注册 `IOptions<CertificateMonitoringOptions>`、reader 和 hosted service；关闭监控时将固定指标置为 disabled 日志，不访问文件。采集异常只影响对应证书的 Gauge，并记录中文告警日志。

- [x] **Step 4: Run focused and backend tests**

  Run: `dotnet test tests/EquipAI.Tests.Unit --filter FullyQualifiedName~CertificateMetrics --no-restore`

  Expected: 相关测试全部通过；随后 `dotnet test tests/EquipAI.Tests.Unit --no-restore` 全量通过。

### Task 3: 配置生产证书挂载与告警规则

**Files:**
- Modify: `src/EquipAI.WebAPI/appsettings.json`
- Modify: `src/EquipAI.WebAPI/appsettings.Production.json`
- Modify: `docker/docker-compose.yml`
- Modify: `docker/prometheus/rules.yml`

**Interfaces:**
- 生产配置固定监控 `nginx_tls`、`mqtt_server`、`mqtt_ca` 三项。
- Compose 仅把 `./ssl/cert.pem` 挂载到后端 `/etc/equipai/tls/cert.pem`，同时使用已有 MQTT 证书目录；不挂载 `ssl/key.pem`。
- Prometheus 规则：监控不可用 critical；证书小于 7 天或已过期 critical；7–30 天 warning。

- [x] **Step 1: Add configuration and rules tests/checks**

  在 shell 验证中检查 Compose 配置可展开、后端只出现公钥证书挂载、告警规则包含三种生命周期状态。

- [x] **Step 2: Implement production configuration and Compose mount**

  开发配置默认关闭，生产配置开启并提供固定容器内路径；Production 门禁拒绝路径覆盖和未知证书键。Compose 环境变量允许显式关闭仅用于隔离测试，生产部署的默认值保持开启。

- [x] **Step 3: Add Prometheus rules**

  使用同一 `certificate` label 与 `status == 1` 做向量匹配，避免证书解析失败时同时产生重复的到期告警；缺失/无效证书只由监控不可用告警负责。

- [x] **Step 4: Validate configuration**

  Run: `docker compose --env-file docker/.env.example -f docker/docker-compose.yml config --quiet`、固定版本 `promtool check rules` 和 `promtool test rules tests/prometheus/certificate-rules.test.yml`、`jq empty docker/grafana/provisioning/dashboards/infrastructure.json`；并运行 `git diff --check`。

### Task 4: 完成生产级验证与运维文档

**Files:**
- Modify: `tests/scripts/production-runtime-smoke.sh`（如需增加指标断言）
- Modify: `docs/DEPLOY.md`
- Modify: `docs/OPS_RUNBOOK.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`
- Modify: `docs/evaluation/00-INDEX.md`
- Modify: `docs/evaluation/01-项目总览与综述.md`
- Modify: `docs/evaluation/05-代码质量分析.md`
- Modify: `docs/evaluation/08-DevOps与CI_CD分析.md`
- Modify: `docs/evaluation/14-测试策略与金字塔分析.md`

- [x] **Step 1: Add smoke assertion**

  通过后端 `/metrics` 检查三项证书指标和 `nginx_tls`、`mqtt_server`、`mqtt_ca` 的读取状态均为 1，保证镜像中真实注册了监控并读取正确挂载。

- [x] **Step 2: Run verification gates**

  Run: `dotnet build EquipAI.sln --no-restore --disable-build-servers -m:1 -c Release`、`dotnet test tests/EquipAI.Tests.Unit --no-restore`、`RUN_RABBITMQ_INTEGRATION_TESTS=true dotnet test tests/EquipAI.Tests.Integration --no-restore`、前端 Vitest/Lint/i18n/Build、`bash tests/scripts/production-scripts-test.sh all` 和 `bash tests/scripts/production-runtime-smoke.sh`（使用临时端口和本地 CI 镜像）。

- [x] **Step 3: Document operations**

  补充证书轮换后重载 Compose、检查指标和告警、证书监控不可用的处置步骤；明确真实生产现有 `.env`/证书仍需运维修复，新增监控不替代上线前校验器。

- [x] **Step 4: Final consistency checks**

  更新测试基线和报告版本，执行 `git diff --check`、工作区状态核对和最终 smoke 结果核对；不提交 Git。
