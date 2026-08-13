# WAF 规则受控热更新实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans (recommended). Steps use checkbox syntax for tracking.

**Goal:** 在保留内置 WAF 安全基线的前提下，为生产环境增加可校验、可审计、可回滚的本地规则文件热加载能力。

**Architecture:** 将 WAF 拆为规则模型/安全 loader、不可变快照 provider 和请求匹配器。内置 SQL 注入、路径遍历、命令注入和 XSS 规则始终启用；外部 JSON 只允许追加受限字面量或 NonBacktracking 正则规则。provider 在启动时加载并监听规则目录，原子替换快照，非法更新保留上一版。生产通过只读 Compose 挂载注入规则制品，不提供 HTTP/数据库编辑 API。

**Tech Stack:** .NET 8、ASP.NET Core Hosted Service、System.Text.Json、System.Text.RegularExpressions、FileSystemWatcher、xUnit、Moq、Bash、Docker Compose。

## Global Constraints

- 所有新增代码注释、日志、文档和测试消息使用简体中文。
- 外部规则不可关闭、覆盖或替换内置四类安全基线。
- 规则文件最大 64KiB、最多 128 条；id 只能使用 [a-z0-9._-]，长度 1～64，且不能重复或碰撞内置 ID。
- contains 模式最多 256 个 Unicode 字符；regex 模式最多 256 个字符，使用 IgnoreCase、CultureInvariant、NonBacktracking，超时 50ms。
- 生产规则路径必须绝对、文件必须为普通文件而非符号链接，文件和直接父目录不得对组或其他用户可写。
- 生产要求外部规则文件；开发和单元测试可缺省外部文件并只使用内置基线。
- 日志不得打印规则正文、请求体、完整 query string、密钥或许可证；只记录路径、错误类别、revision、数量和 SHA-256。
- 不读取、修改或提交真实 docker/.env、生产数据库、生产证书和对象存储。

---

### Task 1: 规则模型与安全 loader

**Files:**
- Create: src/EquipAI.Infrastructure/Middleware/WafRuleOptions.cs
- Create: src/EquipAI.Infrastructure/Middleware/WafRuleModels.cs
- Create: src/EquipAI.Infrastructure/Middleware/WafRuleCatalog.cs
- Create: src/EquipAI.Infrastructure/Middleware/WafRuleLoader.cs
- Modify: src/EquipAI.Infrastructure/Middleware/WafMiddleware.cs
- Test: tests/EquipAI.Tests.Unit/Middleware/WafRuleLoaderTests.cs
- Modify: tests/EquipAI.Tests.Unit/Middleware/WafMiddlewareTests.cs

**Interfaces:**
- WafRuleOptions.SectionName 为 Security:Waf，属性为 Enabled、RulesPath、RequireExternalRules、ReloadDebounceMilliseconds。
- WafRuleDefinition 为只读记录：Id、Category、MatchType、Pattern、Description。
- WafCompiledRule 为只读记录：Id、Category、Description、Func<string, bool> IsMatch。
- WafRuleSnapshot 为只读记录：Revision、Sha256、ImmutableArray<WafCompiledRule> Rules、LoadedAtUtc。
- WafRuleLoader.Load(string path, WafRuleOptions options, bool isProduction) 返回 WafRuleSnapshot；所有错误统一抛出中文 InvalidOperationException，异常不得包含 pattern。
- WafRuleCatalog.CreateBuiltInRules() 返回四类内置规则；WafMiddleware.IsMalicious(string) 委托给 WafRuleCatalog，保持已有调用语义。

- [x] Step 1: 写 loader 和内置基线的失败测试

在 WafRuleLoaderTests.cs 建立临时普通文件和 JSON fixture，至少覆盖合法文件返回 revision、64 位小写 SHA-256、外部规则和 builtin-sql-injection；覆盖生产缺失文件、开发缺失文件、符号链接、危险权限、64KiB 上限、128 条上限、重复 ID、内置 ID 碰撞、非法 schema/category/matchType、未知 JSON 字段、超长字段、控制字符、非法正则、lookaround、反向引用、contains 大小写不敏感命中。测试确认错误信息不包含 secret-pattern。

示例断言：

    var snapshot = WafRuleLoader.Load(CreateRulesFile(ValidJson), Options(), true);
    snapshot.Revision.Should().Be("2026-08-13.1");
    snapshot.Sha256.Should().MatchRegex("^[0-9a-f]{64}$");
    snapshot.Rules.Should().Contain(rule => rule.Id == "custom-sqli-load-function");
    snapshot.Rules.Should().Contain(rule => rule.Id == "builtin-sql-injection");

- [x] Step 2: 运行测试确认缺少实现时失败

运行：
    
    dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~WafRuleLoaderTests" --no-restore

预期：loader 类型或方法不存在导致失败，失败输出不得含生产秘密。

- [x] Step 3: 实现规则模型、内置目录和 loader

使用 JsonSerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow 拒绝未知字段；先读字节并检查 64KiB，再用同一字节数组计算 SHA-256 和反序列化。生产模式在解析前检查绝对路径、普通文件、非符号链接和 Unix 文件/目录权限。

regex 使用以下边界编译：

    var regex = new Regex(
        definition.Pattern,
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.NonBacktracking,
        TimeSpan.FromMilliseconds(50));

捕获编译异常并转换成不泄漏 pattern 的中文错误。内置规则迁移到 WafRuleCatalog，保留现有 payload 语义并分配固定 ID；loader 将内置和外部规则合并为不可变数组，外部规则只能追加。

- [x] Step 4: 运行 loader 和 WAF 基线测试

运行：
    
    dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~WafRuleLoaderTests|FullyQualifiedName~WafMiddlewareTests" --no-restore

预期：loader 合法/拒绝路径和既有 SQLi、路径遍历、命令注入、XSS、误报、请求体测试全部通过。

- [x] Step 5: 提交 loader 子任务

    git add src/EquipAI.Infrastructure/Middleware/WafRuleOptions.cs src/EquipAI.Infrastructure/Middleware/WafRuleModels.cs src/EquipAI.Infrastructure/Middleware/WafRuleCatalog.cs src/EquipAI.Infrastructure/Middleware/WafRuleLoader.cs src/EquipAI.Infrastructure/Middleware/WafMiddleware.cs tests/EquipAI.Tests.Unit/Middleware/WafRuleLoaderTests.cs tests/EquipAI.Tests.Unit/Middleware/WafMiddlewareTests.cs
    git commit -m "feat(security): add validated waf rule loader"

### Task 2: 不可变快照 provider 和目录热加载

**Files:**
- Create: src/EquipAI.Infrastructure/Middleware/IWafRuleProvider.cs
- Create: src/EquipAI.Infrastructure/Middleware/WafRuleProvider.cs
- Modify: src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs
- Test: tests/EquipAI.Tests.Unit/Middleware/WafRuleProviderTests.cs

**Interfaces:**
- IWafRuleProvider.Current 返回当前 WafRuleSnapshot，读取不加全局锁。
- WafRuleProvider 实现 IWafRuleProvider、IHostedService、IDisposable；StartAsync 首次加载并创建 FileSystemWatcher，StopAsync 停止监听并释放 debounce 资源。
- internal Task<bool> ReloadNowAsync(CancellationToken cancellationToken) 仅供单元测试验证非法更新保留旧快照，不暴露 HTTP API。

- [x] Step 1: 写 provider 失败测试

覆盖生产首次缺失文件时 StartAsync 抛异常；开发缺失文件时 Current 只含内置规则；有效 JSON 的 revision 和摘要原子切换；非法 JSON reload 返回 false 且旧 revision/规则仍能命中；Changed/Created/Renamed 连续事件在 250ms 防抖后只加载一次；并发读取 Current.Rules 不抛异常。通过可注入的 watcher factory 或 ReloadNowAsync 测试，不依赖固定端口。

- [x] Step 2: 运行 provider 测试确认失败

    dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~WafRuleProviderTests" --no-restore

预期：provider 类型未实现而失败。

- [x] Step 3: 实现 provider 启动加载和原子快照

provider 用 Volatile.Read 和 Interlocked.Exchange 管理私有快照；StartAsync 调用 loader，生产规则错误向 Generic Host 传播，开发缺失使用只含内置规则的快照。监听规则目录而非单文件，过滤 RulesPath 文件名，处理 Changed、Created、Renamed 和 Error；用 CancellationTokenSource 加 Task.Delay 实现 250ms 防抖，用 SemaphoreSlim 串行 reload。

成功 reload 记录 revision、规则数量、SHA-256 和耗时；失败只记录路径与错误类别并保留旧快照。StopAsync 取消 debounce、等待当前 reload、释放 watcher/semaphore，正常停机不记录严重错误。

- [x] Step 4: 注册为同一单例托管服务

在 AddInfrastructure 中注册同一实例：

    services.AddSingleton<WafRuleProvider>();
    services.AddSingleton<IWafRuleProvider>(sp => sp.GetRequiredService<WafRuleProvider>());
    services.AddHostedService(sp => sp.GetRequiredService<WafRuleProvider>());

这样 provider 在 WAF 第一个请求前完成首次加载，并由 Generic Host 管理停止顺序。

- [x] Step 5: 运行 provider 和 middleware 测试

    dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~WafRuleProviderTests|FullyQualifiedName~WafMiddlewareTests" --no-restore

预期：全部通过，日志断言不出现规则正文或请求体。

- [x] Step 6: 提交 provider 子任务

    git add src/EquipAI.Infrastructure/Middleware/IWafRuleProvider.cs src/EquipAI.Infrastructure/Middleware/WafRuleProvider.cs src/EquipAI.WebAPI/Extensions/ServiceCollectionExtensions.cs tests/EquipAI.Tests.Unit/Middleware/WafRuleProviderTests.cs
    git commit -m "feat(security): hot reload waf rule snapshots"

### Task 3: 请求匹配、配置验证和安全审计

**Files:**
- Modify: src/EquipAI.Infrastructure/Middleware/WafMiddleware.cs
- Modify: src/EquipAI.WebAPI/Program.cs
- Modify: src/EquipAI.WebAPI/appsettings.json
- Modify: src/EquipAI.WebAPI/appsettings.Production.json
- Test: tests/EquipAI.Tests.Unit/Middleware/WafMiddlewareTests.cs
- Create: tests/EquipAI.Tests.Unit/Security/WafRuleConfigurationTests.cs

**Interfaces:**
- WafMiddleware 构造函数接收 IWafRuleProvider，并在 URL/query/body 检查时读取当前 snapshot。
- WafRuleConfiguration.ValidateForEnvironment(IConfiguration, string) 在生产要求 RulesPath 是绝对路径且 RequireExternalRules=true；非生产允许空路径。
- 命中日志使用结构化 RuleId、Category、Source，不记录 query/body/pattern。

- [x] Step 1: 写请求链路和配置门禁失败测试

新增外部 contains URL 命中、外部 regex JSON body 命中、provider 更新后下一请求使用新 revision、logger state 只有 RuleId/Category/Source 且没有 payload、Production 缺失/相对路径/关闭 RequireExternalRules 时抛异常、Development 空规则路径可启动的测试。

- [x] Step 2: 运行测试确认失败

    dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~WafMiddlewareTests|FullyQualifiedName~ProductionConfigurationTests" --no-restore

预期：新 provider 注入和配置门禁尚未存在而失败。

- [x] Step 3: 修改 middleware 为快照匹配并增加结构化审计

将 URL/body 检查归一到 TryDetect(string input, WafRuleSnapshot snapshot, out WafDetection detection)。先按固定顺序遍历不可变规则，返回首个命中；空输入直接放行。BlockAsync 只向日志提供 RuleId、Category、Source，响应继续返回统一 403 JSON；不把完整 URL、query、body 或 pattern 写日志。

- [x] Step 4: 增加配置读取和启动前验证

在 Program.cs 注册基础设施前读取 Security:Waf 并调用 WafRuleConfiguration.ValidateForEnvironment；appsettings.json 明确开发缺省，appsettings.Production.json 明确生产强制值；Docker 环境变量在 Task 4 覆盖路径和开关。

- [x] Step 5: 运行请求、配置和 WAF 全部单测

    dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~WafMiddlewareTests|FullyQualifiedName~WafRuleLoaderTests|FullyQualifiedName~WafRuleProviderTests|FullyQualifiedName~ProductionConfigurationTests" --no-restore

预期：全部通过，内置基线和外部规则均有证据。

- [x] Step 6: 提交请求链路子任务

    git add src/EquipAI.Infrastructure/Middleware/WafMiddleware.cs src/EquipAI.WebAPI/Program.cs src/EquipAI.WebAPI/appsettings.json src/EquipAI.WebAPI/appsettings.Production.json tests/EquipAI.Tests.Unit/Middleware/WafMiddlewareTests.cs tests/EquipAI.Tests.Unit/Web/ProductionConfigurationTests.cs
    git commit -m "feat(security): apply versioned waf rules to requests"

### Task 4: Compose、规则制品、运维回滚和契约测试

**Files:**
- Create: docker/waf-rules/rules.json
- Modify: docker/docker-compose.yml
- Modify: docker/docker-compose.smoke.yml
- Modify: docker/.env.example
- Modify: tests/scripts/production-scripts-test.sh
- Modify: tests/scripts/production-runtime-smoke.sh
- Modify: docs/OPS_RUNBOOK.md
- Modify: docs/DEPLOY.md
- Modify: docs/COMPLIANCE_REPORT.md

**Interfaces:**
- 生产环境变量为 Security__Waf__RulesPath（WAF_RULES_PATH，默认 /etc/equipai/waf/rules.json）和 Security__Waf__RequireExternalRules（WAF_REQUIRE_EXTERNAL_RULES，默认 true）。
- Compose 后端只读挂载 ./waf-rules:/etc/equipai/waf:ro；smoke 复制并挂载相同目录。
- 规则文件使用 schemaVersion 1、固定 revision 和无敏感值的低误报扩展规则，权限为 600。

- [x] Step 1: 写生产脚本契约失败测试

在 production-scripts-test.sh 断言生产 compose 注入规则路径和强制开关、规则目录只读挂载、smoke runtime_files 包含 waf-rules/rules.json、规则文件包含 schemaVersion/revision/rules 且不含凭据、运维文档包含原子替换/回滚/摘要记录、合规报告将 WAF 规则更新列为代码已实现但保留部署侧演练要求。

- [x] Step 2: 运行契约测试确认失败

    bash tests/scripts/production-scripts-test.sh all

预期：新增规则挂载和文档断言失败。

- [x] Step 3: 添加规则制品并接入 Compose/smoke

添加非敏感、低误报的扩展规则作为仓库基线；所有生产 Compose 变更保持只读挂载。更新 smoke runtime_files 和临时 Docker 目录复制逻辑，使隔离 Production smoke 加载当前规则文件；规则文件不可通过环境变量替换为远程 URL。

- [x] Step 4: 增加运维更新与回滚文档

在 OPS_RUNBOOK.md 和 DEPLOY.md 写出：同目录临时文件、应用 loader/结构校验、sha256sum 摘要、备份当前文件、原子 mv、检查 revision/数量/摘要/错误计数、失败原子恢复。说明更新不经过 HTTP API，不记录规则正文。COMPLIANCE_REPORT.md 将 WAF 规则更新机制从待完善改为代码已实现，并明确正式制品审批、最小权限和一次生产等价更新/回滚演练仍需部署方完成。

- [x] Step 5: 运行生产脚本契约和 Shell 语法检查

    bash -n tests/scripts/production-scripts-test.sh tests/scripts/production-runtime-smoke.sh
    bash tests/scripts/production-scripts-test.sh all

预期：全部通过，规则文件、Compose 挂载、smoke 复制和文档契约一致。

- [x] Step 6: 提交运维集成子任务

    git add docker/waf-rules/rules.json docker/docker-compose.yml docker/docker-compose.smoke.yml docker/.env.example tests/scripts/production-scripts-test.sh tests/scripts/production-runtime-smoke.sh docs/OPS_RUNBOOK.md docs/DEPLOY.md docs/COMPLIANCE_REPORT.md
    git commit -m "ops(security): ship auditable waf rule artifact"

### Task 5: 全量验证、审查和上线证据更新

**Files:**
- Modify: docs/LANDING_READINESS_REPORT.md
- Modify: docs/evaluation/S09-风险登记册.md
- Modify: docs/superpowers/plans/2026-08-13-waf-rule-hot-reload.md
- Read-only: all changed source/test/config files

**Interfaces:**
- 证据必须区分代码已验证与真实生产制品审批/演练未完成，不得把 WAF 代码测试写成生产环境已验收。

- [ ] Step 1: 运行后端聚焦测试和 Release 构建

    dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~WafRuleLoaderTests|FullyQualifiedName~WafRuleProviderTests|FullyQualifiedName~WafMiddlewareTests|FullyQualifiedName~ProductionConfigurationTests"
    dotnet build EquipAI.sln -c Release --no-restore -m:1 -p:UseSharedCompilation=false

预期：聚焦测试全部通过，Release 构建 0 warning/0 error。

- [ ] Step 2: 运行生产脚本、差异和敏感信息检查

    bash tests/scripts/production-scripts-test.sh all
    bash -n docker/backup.sh docker/restore.sh tests/scripts/production-runtime-smoke.sh tests/scripts/production-scripts-test.sh
    git -c core.fsmonitor=false diff --check

预期：脚本、语法和差异检查通过；规则文件不得含真实凭据。

- [ ] Step 3: 运行当前提交 Production runtime smoke

使用当前提交三镜像并设置 SMOKE_RUN_E2E=true（依赖和浏览器可用时）运行现有 smoke；Docker 不可用时记录精确阻断，不把历史结果冒充当前提交证据。

- [ ] Step 4: 更新风险和上线报告

在上线报告记录 loader/provider/请求链路/Compose 契约和当前 smoke 的确切结果；在 R20 之外增加 WAF 规则更新的代码侧缓解，保留制品来源、审批、最小权限、有效更新和回滚演练为部署侧条件；将本计划完成步骤打勾。

- [ ] Step 5: 最终工作区审计并提交证据

确认 git status 只有预期变更，检查没有真实 .env、证书、备份或临时 Docker 文件进入 git；运行 git diff --check 和最近提交摘要后提交：

    git add docs/LANDING_READINESS_REPORT.md docs/evaluation/S09-风险登记册.md docs/superpowers/plans/2026-08-13-waf-rule-hot-reload.md
    git commit -m "docs(readiness): record waf rule reload verification"

## 计划自审记录

- 规格覆盖：Task 1 覆盖模型、字段约束、权限和正则安全；Task 2 覆盖首次加载、快照、监听、防抖、失败回滚和停机；Task 3 覆盖请求匹配、启动门禁和脱敏审计；Task 4 覆盖只读挂载、规则制品、更新/回滚文档和契约；Task 5 覆盖构建、测试、smoke 和上线证据。
- 完整性扫描：本计划没有未完成标记或泛化的测试步骤；每个代码步骤都给出具体文件、接口、命令和预期。
- 类型一致性：WafRuleOptions、WafRuleSnapshot、WafCompiledRule、WafRuleLoader.Load、IWafRuleProvider.Current 和 WafRuleProvider.ReloadNowAsync 在后续任务中保持同名；middleware 依赖 provider 的同一 DI 单例。
