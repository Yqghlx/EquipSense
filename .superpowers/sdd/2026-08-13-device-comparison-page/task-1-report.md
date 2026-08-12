# Task 1 后端测试实现报告

## 状态

DONE

## 基线

- 执行日期：2026-08-12
- 基线提交：`b0f6646`

## 变更范围

- 修改 `tests/EquipAI.Tests.Unit/Analysis/DeviceComparisonServiceTests.cs`
- 修改 `tests/EquipAI.Tests.Integration/Controllers/DeviceComparisonControllerTests.cs`
- 新增本报告 `.superpowers/sdd/2026-08-13-device-comparison-page/task-1-report.md`

未修改任何生产源码、前端代码或其他文档。

## 新增测试契约

### 服务层

- `CompareAsync_未指定DeviceIds_保留同类型全量行为`
- `CompareAsync_指定2个设备ID_仅返回选定设备`
- `CompareAsync_指定列表包含其他类型设备_不会进入结果`
- `CompareAsync_DeviceIds数量越界_应抛出明确参数异常`

实现方式：

- 当 `deviceIds == null` 时，测试允许回退到现有旧签名，确保“旧行为不回归”的断言今天就能工作。
- 当断言依赖新契约时，测试先通过反射查找目标签名  
  `CompareAsync(Guid tenantId, string deviceType, string metric, int hours, IReadOnlyCollection<Guid>? deviceIds, CancellationToken ct)`。
- 若签名不存在，测试以明确失败信息结束：  
  `DeviceComparisonService.CompareAsync 尚未提供 deviceIds 参数签名，无法验证显式设备筛选契约。`

这样可以避免测试项目因直接调用不存在的参数签名而编译失败，同时把红灯精确指向“生产实现缺少新契约”。

### 控制器边界

- `CompareDevices_仅传1个DeviceId_Returns400`
- `CompareDevices_传入6个DeviceIds_Returns400`
- `CompareDevices_DeviceIds包含非法Guid_Returns400`

这些测试都沿用重复 query 参数形式传递 `deviceIds`，直接锁定控制器边界对最小值、最大值和非法 GUID 的 400 行为。

## TDD / 红灯证据

### 1. 服务层聚焦测试

命令：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter FullyQualifiedName~DeviceComparisonServiceTests
```

结果：

- 退出码：1
- 总数：17
- 通过：12
- 失败：5

失败用例：

- `CompareAsync_指定2个设备ID_仅返回选定设备`
- `CompareAsync_指定列表包含其他类型设备_不会进入结果`
- `CompareAsync_DeviceIds数量越界_应抛出明确参数异常(deviceCount: 0)`
- `CompareAsync_DeviceIds数量越界_应抛出明确参数异常(deviceCount: 1)`
- `CompareAsync_DeviceIds数量越界_应抛出明确参数异常(deviceCount: 6)`

红灯原因：

- 生产代码仍只有旧签名  
  `CompareAsync(Guid tenantId, string deviceType, string metric, int hours = 24, CancellationToken ct = default)`。
- 因此所有依赖 `deviceIds` 新契约的测试都失败在同一个明确断言：  
  `DeviceComparisonService.CompareAsync 尚未提供 deviceIds 参数签名，无法验证显式设备筛选契约。`

结论：这是预期红灯，指向服务层尚未实现 Task 1 目标签名与筛选逻辑，不是测试本身错误。

### 2. 控制器聚焦测试

第一次命令：

```bash
dotnet test tests/EquipAI.Tests.Integration --filter FullyQualifiedName~DeviceComparisonControllerTests
```

第一次结果：

- 进程在 MSBuild/CreateAppHost 阶段触发 `System.AccessViolationException`
- 该失败属于本地测试基础设施噪声，尚未进入控制器行为断言

为避免把基础设施噪声误判成业务红灯，改用单节点重跑：

```bash
dotnet test tests/EquipAI.Tests.Integration/EquipAI.Tests.Integration.csproj --filter FullyQualifiedName~DeviceComparisonControllerTests -m:1
```

重跑结果：

- 退出码：1
- 总数：8
- 通过：5
- 失败：3

失败用例：

- `CompareDevices_仅传1个DeviceId_Returns400`
- `CompareDevices_传入6个DeviceIds_Returns400`
- `CompareDevices_DeviceIds包含非法Guid_Returns400`

红灯原因：

- 三个断言都期望 `400 BadRequest`
- 实际响应全部为 `200 OK`

这说明当前 `DeviceComparisonController` 仍未接收/校验 `deviceIds` 查询参数，现状是直接忽略这些参数并继续走旧成功路径。

结论：在绕开基础设施噪声后，控制器红灯稳定且直接指向未实现的新边界校验。

## 疑虑 / 交接提示

1. 服务层当前红灯首先暴露的是“缺少新签名”，因此在生产实现加入新签名之前，看不到更深一层的筛选/异常语义。
2. 集成测试首次运行出现过一次 `AccessViolationException`；使用 `-m:1` 后可稳定命中真实业务红灯。后续实现代理若遇到同类噪声，建议优先复用串行命令复核。
3. 任务报告文件位于 `.superpowers/sdd/2026-08-13-device-comparison-page/`，默认被该目录的 `.gitignore` 忽略；本次提交已通过 `git add -f` 显式纳入版本控制。

## 提交

- 提交信息：`test: add device comparison backend contract tests`
- 提交哈希：`d83023d`
