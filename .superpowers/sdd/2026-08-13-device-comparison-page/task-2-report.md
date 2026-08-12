# Task 2 后端可选设备筛选实现报告

## 状态

DONE（后端可选 `deviceIds` 筛选与控制器边界校验已实现并通过聚焦验证）

## 基线

- 执行日期：2026-08-12
- 基线提交：`171b966`
- 任务目录命名：`2026-08-13-device-comparison-page`（按既有任务路径保留，实际执行日为 2026-08-12）

## 变更范围

- 修改 `src/EquipAI.Application/Analysis/DeviceComparisonService.cs`
- 修改 `src/EquipAI.WebAPI/Controllers/DeviceComparisonController.cs`
- 修改 `tests/EquipAI.Tests.Unit/Analysis/DeviceComparisonServiceTests.cs`
- 新增 `.superpowers/sdd/2026-08-13-device-comparison-page/task-2-report.md`

未修改前端、路线文档或其他无关文件。

## 实现摘要

### 服务层

- 为 `DeviceComparisonService.CompareAsync` 增加可选参数  
  `IReadOnlyCollection<Guid>? deviceIds = null`
- 保持 `deviceIds == null` 时的旧行为：继续对比当前租户、当前设备类型下的全部设备
- 显式传入 `deviceIds` 时：
  - 拒绝空集合
  - 拒绝包含 `Guid.Empty` 的输入
  - 对设备 ID 去重
  - 要求去重后数量必须在 2–5 之间
- 设备候选查询显式叠加三层条件：
  - `TenantId == tenantId`
  - `Type == deviceType`
  - `deviceIds.Contains(d.Id)`（仅在显式筛选时启用）
- 若最终可见设备不足 2 台，继续返回既有业务消息，不泄露被过滤设备是否存在
- 遥测查询仍保持“设备列表一次 + 遥测一次”的批量读取语义，没有退化为逐设备查询

### 控制器

- 将对比接口签名扩展为：

```csharp
public async Task<ActionResult<DeviceComparisonResult>> Compare(
    [FromQuery] string deviceType,
    [FromQuery] string metric,
    [FromQuery] int hours = 24,
    [FromQuery] Guid[]? deviceIds = null,
    CancellationToken ct = default)
```

- 新增重复 `deviceIds` 查询参数绑定
- 控制器在进入服务层前做 fail-fast 校验：
  - 空数组返回 400
  - `Guid.Empty` 返回 400
  - 去重后数量不在 2–5 之间返回 400
- 继续保留 `deviceType`、`metric`、`hours` 的原有边界校验

### 测试契约修正

- 由于服务方法签名已经从旧版五参扩展为六参，修正了  
  `tests/EquipAI.Tests.Unit/Analysis/DeviceComparisonServiceTests.cs`  
  中的辅助调用，使 `deviceIds == null` 时显式传入 `null`，避免测试代码本身因旧调用签名而编译失败。
- 这属于 Task 2 允许范围内对 Task 1 后端测试的必要修正，不改变测试意图。

## TDD 过程记录

### 红灯

#### 1. 服务层聚焦测试

命令：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceComparisonServiceTests" -p:UseAppHost=false
```

初始结果：

- 退出码：1
- 总数：18
- 通过：12
- 失败：6

核心失败原因：

- 服务尚未提供 `deviceIds` 新签名，依赖显式设备筛选契约的测试都失败在同一明确断言：
  `DeviceComparisonService.CompareAsync 尚未提供 deviceIds 参数签名，无法验证显式设备筛选契约。`

#### 2. 控制器聚焦测试

命令：

```bash
dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~DeviceComparisonControllerTests" -p:UseAppHost=false
```

初始结果：

- 退出码：1
- 总数：8
- 通过：5
- 失败：3

核心失败原因：

- `仅传 1 个 deviceIds`
- `传入 6 个 deviceIds`
- `包含非法 GUID`

三种情况都错误返回了 `200 OK`，说明控制器当时尚未绑定/校验 `deviceIds` 参数。

### 绿灯

#### 1. 服务层聚焦测试

命令：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceComparisonServiceTests" -p:UseAppHost=false
```

结果：

- 退出码：0
- 总数：18
- 通过：18
- 失败：0

备注：

- 本次通过输出中出现过一次 `MSB3026` 重试警告：`EquipAI.Application.dll` 被其他进程短暂占用后自动重试成功。
- 该噪声不影响测试最终结论。

#### 2. 控制器聚焦测试

命令：

```bash
dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~DeviceComparisonControllerTests" -p:UseAppHost=false
```

结果：

- 退出码：0
- 总数：8
- 通过：8
- 失败：0

## 构建验证

命令：

```bash
dotnet build EquipAI.sln --configuration Release --no-restore -m:1 --disable-build-servers
```

结果：

- 退出码：0
- `Build succeeded.`
- `0 Warning(s)`
- `0 Error(s)`

## 已知基础设施噪声

1. 仓库的 git/fsmonitor 在若干 `git` 命令期间持续输出：

   - `fsmonitor_ipc__send_query: unspecified error on '.git/fsmonitor--daemon.ipc'`

   该噪声不影响本次代码修改、测试和提交。

2. 在第一次尝试不带 `-p:UseAppHost=false` 的聚焦测试时，曾遇到本地 `apphost` 相关构建噪声（缺失复制/重复签名）。
   为了让验证真正落到设备对比契约本身，本次聚焦测试统一显式附加了 `-p:UseAppHost=false`。

## 提交说明

- 本报告文件位于被忽略目录下，提交时需要显式 `git add -f`
- 本报告不写入自引用的最终提交哈希；最终提交哈希以提交完成后的 `git rev-parse HEAD` 为准
