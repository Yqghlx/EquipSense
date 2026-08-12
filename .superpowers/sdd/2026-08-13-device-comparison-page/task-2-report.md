# Task 2 后端可选设备筛选修复报告

## 状态

DONE。本轮审查修复已完成，后端聚焦测试和 Release 构建均通过。

## 执行信息

- 任务目录：`2026-08-13-device-comparison-page`
- 本轮审查修复日期：2026-08-13
- 审查修复前提交：`abebe061279ca7aec226fb5bd3ec8534295272b1`
- 范围：仅修改 Task 2 后端服务、控制器、Task 1 后端测试和本报告。
- 未修改前端、路线文档、真实环境配置或凭据。

## 变更内容

### 服务层

- `DeviceComparisonService.CompareAsync` 保持可选 `IReadOnlyCollection<Guid>? deviceIds = null` 签名。
- 未传 `deviceIds` 时，设备候选仍限定当前租户和设备类型，并保持同类型全量对比的旧行为。
- 显式传入 ID 时，先在当前租户和设备类型范围内收窄候选，再应用 ID 集合；跨租户和跨类型 ID 不进入结果。
- 显式 ID 先去重，去重后必须为 2 到 5 个；空集合、空 GUID 和数量越界均抛出 `ArgumentException`。
- 可见设备不足 2 台时返回既有业务消息“同类设备不足 2 台，无法对比”，不泄露被过滤对象。
- 保持设备列表一次查询、遥测一次批量查询的语义，没有引入逐设备 N+1 查询。
- 修正查询注释，明确旧全量语义与显式 ID 收窄语义。

### 控制器

- 保持重复 `deviceIds` query 参数绑定到 `Guid[]?`。
- 在控制器文件内使用受控模型绑定：非法 GUID 不进入默认模型绑定文案，也不回显原始输入。
- 空数组返回统一数量边界错误。
- 空 GUID 返回明确的“不能包含空 GUID”错误，并包含 2 到 5 的允许范围语义。
- 非法 GUID 返回明确的“必须是有效 GUID”错误，并包含 2 到 5 的允许范围语义。
- 数量、重复 ID 去重后的边界错误统一返回仅含 `code` 和 `message` 的安全响应，不包含租户或设备存在性信息。

### 回归测试

- 服务测试新增并真实断言：空 GUID、`[A,A,B]` 去重后接受、`[A,A]` 去重后拒绝、租户/类型过滤后可见设备不足 2 台的既有业务消息和空结果。
- 控制器集成测试新增并真实断言：空数组 query、重复 ID 的接受/拒绝边界、空 GUID 和非法 GUID 的 400 响应体字段、范围语义和安全信息边界。
- 保留并补强原有 1 个和 6 个 ID 的 400 响应体断言。

## TDD 验证记录

### 本轮红灯

先写入本轮回归测试，再运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceComparisonServiceTests" -p:UseAppHost=false --no-restore
```

- 结果：退出码 0，22/22 通过。
- 新增服务边界测试在审查前实现中已覆盖既有正确行为，因此直接为绿灯。

随后运行控制器集成测试：

```bash
dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~DeviceComparisonControllerTests" -p:UseAppHost=false --no-restore
```

- 结果：退出码 1，12 项中 9 项通过、3 项失败。
- 失败原因准确对应待修复行为：非法 GUID 和空数组仍返回默认 `ValidationProblemDetails`，空 GUID 仍返回“deviceIds 不能为空”。

### 本轮绿灯

修复模型绑定和错误语义后重新运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceComparisonServiceTests" -p:UseAppHost=false --no-restore
```

- 结果：退出码 0，22/22 通过，0 失败。

```bash
dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~DeviceComparisonControllerTests" -p:UseAppHost=false --no-restore
```

- 结果：退出码 0，12/12 通过，0 失败。

## Release 构建

```bash
dotnet build EquipAI.sln --configuration Release --no-restore -m:1 --disable-build-servers
```

- 结果：退出码 0。
- `Build succeeded.`
- 0 Warning(s)，0 Error(s)。

## 前次 Task 2 实现验证记录

为保留原任务的 TDD 证据，前次实现阶段的聚焦红灯为：服务测试 18 项中 12 项通过、6 项失败；控制器测试 8 项中 5 项通过、3 项失败。失败分别由缺少 `deviceIds` 服务签名、控制器绑定/边界校验缺失触发。前次实现后的绿灯为服务 18/18、控制器 8/8，Release 构建 0 Warning、0 Error。

## 已知基础设施噪声

- 多次执行 Git 命令时出现 `fsmonitor_ipc__send_query: unspecified error on '.git/fsmonitor--daemon.ipc'`。该消息来自本地 Git fsmonitor，不影响差异检查、测试、构建或提交。
- 本轮并行启动红灯测试时出现过一次 `MSB3026` 文件占用自动重试警告；随后串行绿灯测试成功，未影响结果。
- 更早的聚焦测试曾出现本地 apphost 缺失复制和重复签名噪声，因此聚焦测试统一使用 `-p:UseAppHost=false`；本轮指定的 Release 构建未出现该问题。

## 报告检查

- 已用 `git diff --check` 检查代码差异。
- 本报告使用简体中文，且已清理 Markdown 行尾空格。
- 报告不写入自引用的最终提交哈希；最终提交以 Git 提交结果为准。
