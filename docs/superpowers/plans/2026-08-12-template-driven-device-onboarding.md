# 模板驱动设备快速接入实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有设备模板和默认告警规则接入真实的首次注册界面，让用户可以安全、可解释地快速完成设备档案创建。

**Architecture:** 服务端以 JWT 当前租户为权威读取当前租户或系统租户模板，保存 `Device.TypeTemplateId`，并在同一数据库事务中按模板完整创建可选告警规则；客户端只提交模板 ID、设备基础字段和显式的应用规则开关。前端在设备列表页提供独立快速注册对话框，展示模板指标与规则预览，协议接入继续由现有设备接入向导负责。

**Tech Stack:** .NET 8 WebAPI、EF Core 8、PostgreSQL/SQLite 测试、xUnit、FluentAssertions、React 19、TypeScript strict、TanStack Query、React Hook Form/Zod、Vitest、react-i18next、shadcn/base-ui。

## Global Constraints

- 所有新增注释、日志、文档和面向用户文案使用简体中文；英文 UI 文案必须同步维护。
- 请求体中的 `TenantId` 始终忽略，模板查询只能命中当前租户或系统租户，禁止跨租户读取和写入。
- 模板注册必须保存 `Device.TypeTemplateId`，设备、告警规则和租户设备计数必须在同一数据库事务中提交。
- 模板规则由服务端读取和解析；模板路径不接受客户端提交的完整告警规则，避免篡改阈值、自动建单和冷却配置。
- 未经用户明确勾选，不创建模板默认告警规则；不把未经现场确认的阈值描述为普适安全值。
- 模板 JSON 无效、关键字段非法、模板不可见或并发重复编码必须可理解地失败，不得创建半成品设备或返回未处理的 500。
- 保持无模板旧调用、设备高级表单和 OPC UA/Modbus 接入向导兼容；不修改真实生产凭据、证书、卷或环境文件。
- 每项行为变更先写失败测试并观察预期失败，再写最小实现；每个任务完成后运行对应回归并使用 Conventional Commit 提交。

---

## 文件与职责映射

| 文件 | 职责 | 本计划变更 |
|---|---|---|
| `src/EquipAI.Application/Devices/DeviceConfigService.cs` | 快速注册编排和请求 DTO | 接收模板 ID、服务端读取模板、保存模板关联、完整映射规则、事务与错误边界 |
| `src/EquipAI.Application/Devices/DeviceTemplateAlarmRuleParser.cs` | 模板告警规则解析与校验 | 新增纯函数式 JSON 解析器和结构化定义 |
| `src/EquipAI.WebAPI/Controllers/DeviceConfigController.cs` | 快速注册 HTTP 契约 | 映射模板错误、重复编码和标准业务错误响应 |
| `tests/EquipAI.Tests.Unit/Devices/DeviceTemplateAlarmRuleParserTests.cs` | 规则解析单元回归 | 新增规则字段、操作符、非法 JSON 和边界测试 |
| `tests/EquipAI.Tests.Unit/Web/DeviceConfigControllerTests.cs` | 租户/事务/模板服务回归 | 扩展 SQLite 测试覆盖模板可见性、关联、规则和回滚 |
| `tests/EquipAI.Tests.Integration/Controllers/DeviceConfigControllerTests.cs` | API 契约回归 | 扩展模板注册和业务错误 HTTP 断言 |
| `frontend/src/types/index.ts` | 前端模板和请求类型 | 支持 JSON 字符串/对象与模板注册字段 |
| `frontend/src/hooks/useDeviceConfig.ts` | 模板查询和快速注册 | 复用现有 query/mutation，暴露稳定请求类型 |
| `frontend/src/lib/deviceTemplatePreview.ts` | 模板预览数据归一化 | 新增安全 JSON 解析和指标/规则展示模型 |
| `frontend/src/components/device/DeviceQuickRegisterDialog.tsx` | 快速注册交互 | 新增模板选择、预览、显式规则开关、错误和无障碍反馈 |
| `frontend/src/pages/DeviceListPage.tsx` | 设备列表入口 | 新增快速添加按钮和对话框挂载，不改变高级表单 |
| `frontend/src/lib/__tests__/deviceTemplatePreview.test.ts` | 模板展示归一化回归 | 新增 JSON 容错和字段映射测试 |
| `frontend/src/components/device/__tests__/DeviceQuickRegisterDialog.test.tsx` | 快速注册 UI 回归 | 新增加载、预览、校验、提交、错误和成功关闭测试 |
| `frontend/src/i18n/zh.json` / `frontend/src/i18n/en.json` | 双语资源 | 新增快速接入、模板预览、错误和确认提示 |
| `docs/USER_GUIDE.md` | 用户操作说明 | 增加模板快速注册与阈值确认边界 |

---

### Task 1: 建立服务端模板规则解析契约

**Files:**
- Create: `src/EquipAI.Application/Devices/DeviceTemplateAlarmRuleParser.cs`
- Create: `tests/EquipAI.Tests.Unit/Devices/DeviceTemplateAlarmRuleParserTests.cs`

**Interfaces:**
- Produces `TemplateAlarmRuleDefinition`：`Name`、`Metric`、`RuleType`、`Operator`、`Threshold`、`Severity`、`CooldownSeconds`、`Enabled`、`AutoCreateWorkorder`。
- Produces `DeviceTemplateRulesException`，携带固定业务码 `TEMPLATE_RULES_INVALID`。
- `DeviceTemplateAlarmRuleParser.Parse(string json)` 对有效模板返回不可变规则列表，对无效结构抛出上述异常。

- [x] **Step 1: 写失败的解析器测试**

创建测试类，先锁定真实种子 JSON 的字段和规则语义：

```csharp
[Fact]
public void Parse_模板规则_应保留低于阈值与自动建单字段()
{
    const string json = """[
      {"name":"压力过低","metric":"pressure","ruleType":"threshold","operator":"lt","threshold":0.5,"severity":"High","cooldownSeconds":600,"enabled":true,"autoCreateWorkorder":false},
      {"name":"振动超标","metric":"vibration","ruleType":"threshold","operator":"gt","threshold":7,"severity":"Critical","cooldownSeconds":300,"enabled":true,"autoCreateWorkorder":true}
    ]""";

    var result = DeviceTemplateAlarmRuleParser.Parse(json);

    result.Should().HaveCount(2);
    result[0].Operator.Should().Be("lt");
    result[0].AutoCreateWorkorder.Should().BeFalse();
    result[1].Operator.Should().Be("gt");
    result[1].AutoCreateWorkorder.Should().BeTrue();
}

[Theory]
[InlineData("")]
[InlineData("not-json")]
[InlineData("{}")] 
public void Parse_非法JSON或根节点_应抛出模板规则异常(string json)
{
    var act = () => DeviceTemplateAlarmRuleParser.Parse(json);
    act.Should().Throw<DeviceTemplateRulesException>()
        .Which.Code.Should().Be("TEMPLATE_RULES_INVALID");
}
```

另加测试：缺少 `name`/`metric`、未知严重级别、负冷却时间、阈值规则缺少操作符或阈值、无效操作符均失败；合法的 `gt/gte/lt/lte/eq` 及对应符号均可保留并交给现有阈值评估器正确处理；`ne` 必须拒绝，因为当前评估器不支持“不等于”语义。

- [x] **Step 2: 运行测试确认按预期失败**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceTemplateAlarmRuleParserTests"
```

预期：编译或测试失败，原因是 `DeviceTemplateAlarmRuleParser` 和 `DeviceTemplateRulesException` 尚未存在；不要修改断言迎合当前实现。

- [x] **Step 3: 实现最小解析器**

在新文件中使用 `System.Text.Json.JsonDocument` 逐项解析，不使用动态反射或宽松 `JsonSerializer.Deserialize<object>`。实现以下固定边界：

```csharp
public static IReadOnlyList<TemplateAlarmRuleDefinition> Parse(string? json)
{
    if (string.IsNullOrWhiteSpace(json))
        throw new DeviceTemplateRulesException("模板没有告警规则 JSON");

    using var document = JsonDocument.Parse(json);
    if (document.RootElement.ValueKind != JsonValueKind.Array)
        throw new DeviceTemplateRulesException("模板告警规则必须是数组");

    return document.RootElement.EnumerateArray()
        .Select(ParseRule)
        .ToArray();
}
```

`ParseRule` 必须验证必填字段、规则类型、操作符、数值范围，并将严重级别大小写不敏感地转换为 `AlertSeverity`；无效项抛出带固定业务码的异常，不打印原始 JSON。

- [x] **Step 4: 运行解析器测试确认通过**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceTemplateAlarmRuleParserTests"
```

预期：解析器测试全部通过，输出不包含模板 JSON 密钥或其他敏感配置。

- [x] **Step 5: 提交 Task 1**

```bash
git add src/EquipAI.Application/Devices/DeviceTemplateAlarmRuleParser.cs \
  src/EquipAI.Application/Devices/DeviceConfigService.cs \
  tests/EquipAI.Tests.Unit/Devices/DeviceTemplateAlarmRuleParserTests.cs
git commit -m "feat: validate template alarm rule definitions"
```

### Task 2: 接入服务端模板注册、事务和业务错误

**Files:**
- Modify: `src/EquipAI.Application/Devices/DeviceConfigService.cs`
- Modify: `src/EquipAI.WebAPI/Controllers/DeviceConfigController.cs`
- Modify: `tests/EquipAI.Tests.Unit/Web/DeviceConfigControllerTests.cs`
- Modify: `tests/EquipAI.Tests.Integration/Controllers/DeviceConfigControllerTests.cs`

**Interfaces:**
- `QuickRegisterRequest.TemplateId`：可空 `Guid`。
- `QuickRegisterRequest.ApplyDefaultAlarmRules`：布尔值，默认 `false`。
- `DefaultAlertRuleRequest`：增加 `Name`、`Operator`、`CooldownSeconds`、`Enabled`、`AutoCreateWorkorder` 可选字段，保留旧 `Metric`、`Threshold`、`Severity`。
- `DeviceConfigController.QuickRegister` 返回原有创建对象；模板不可见返回 `404/TEMPLATE_NOT_FOUND`，模板规则无效返回 `422/TEMPLATE_RULES_INVALID`，重复编码返回 `409/DUPLICATE_CODE`。

- [x] **Step 1: 写失败的服务/控制器测试**

在现有 SQLite `DeviceConfigControllerTests` 中先插入当前租户模板、系统模板和其他租户模板，并增加以下测试：

```csharp
[Fact]
public async Task QuickRegister_使用系统模板并应用默认规则_应保存模板关联和完整规则语义()
{
    // Arrange：模板包含 lt + autoCreateWorkorder=false 和 gt + true 两条规则
    // Act：TemplateId=系统模板，ApplyDefaultAlarmRules=true
    // Assert：Device.TypeTemplateId、Device.Type、两条 AlertRule 的 Operator/Cooldown/Enabled/AutoCreateWorkorder 全部保持
}

[Fact]
public async Task QuickRegister_模板属于其他租户_应返回模板不可见错误且不写库()
{
    // Arrange：只向租户 B 写入模板，当前 JWT 租户为 A
    // Act：调用 QuickRegister
    // Assert：NotFoundObjectResult，code=TEMPLATE_NOT_FOUND，A 的设备和计数均不变
}

[Fact]
public async Task QuickRegister_未勾选默认规则_只创建设备不创建告警()
{
    // Arrange/Act：使用系统模板但 ApplyDefaultAlarmRules=false
    // Assert：设备关联模板，AlertRules 无新增，CurrentDeviceCount 只增加一次
}
```

另加无效模板 JSON 的回滚断言：设备、规则、租户计数均保持原值；扩展集成测试验证 HTTP 状态和错误码；保留现有请求体 `TenantId` 恶意值测试。

- [x] **Step 2: 运行测试确认按预期失败**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceConfigControllerTests"
dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~DeviceConfigControllerTests"
```

预期：新测试因请求字段、模板关联和错误映射尚未实现而失败；已有无模板注册和跨租户测试必须保持可编译并明确显示失败原因。

- [x] **Step 3: 实现模板权威读取与规则映射**

在 `QuickRegisterAsync` 中按以下顺序实现：

1. 从 `_tenantContext.TenantId` 获取当前租户；校验设备编码非空并执行当前租户重复快速检查。
2. 当 `TemplateId` 有值时，使用 `UnfilteredSet<DeviceTypeTemplate>()` 查询当前租户或系统租户模板；不可见抛 `DeviceConfigException("TEMPLATE_NOT_FOUND", ...)`。
3. 创建设备时设置 `TenantId`、`TypeTemplateId`、模板名称类型、`Offline` 状态和 `HealthScore=100`。
4. 仅当 `ApplyDefaultAlarmRules` 为真时调用 Task 1 解析器，在当前事务中把每个定义映射为 `AlertRule`，保留 `Operator`、`Threshold`、`Severity`、`CooldownSeconds`、`Enabled`、`AutoCreateWorkorder`。
5. 无模板兼容路径继续使用请求中的规则，但使用同一字段映射逻辑，不再硬编码 `>` 或 `true`。
6. 关系型数据库使用 `ExecuteUpdateAsync` 原子递增当前租户 `CurrentDeviceCount`，非关系型测试提供程序保留跟踪实体回退；设备、规则、计数仍在同一事务中提交。
7. 在执行策略重试中复用稳定设备 ID，并在每次尝试前清理回滚后残留的 Added/Modified 状态；若提交结果不明确但设备已落库，按同一 ID 返回已创建结果，避免重复写入。
8. 捕获生产 PostgreSQL 的设备唯一索引冲突（`IX_devices_tenant_id_device_code`），转换为 `DUPLICATE_CODE`；保留先查后写的友好提示，并覆盖并发窗口。

在 Controller 中捕获 `DeviceConfigException` 映射标准 `{ code, message, details }`；不把模板 JSON 或数据库异常详情返回客户端。对 SQLite 测试提供程序同步识别其设备唯一约束错误，保证行为测试可复现。

- [x] **Step 4: 运行后端测试确认通过**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceConfigControllerTests"
dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~DeviceConfigControllerTests"
```

预期：模板关联、完整规则字段、不可见模板、无规则模式、非法 JSON 回滚、重复编码和旧兼容路径全部通过。

- [x] **Step 5: 提交 Task 2**

```bash
git add src/EquipAI.Application/Devices/DeviceConfigService.cs \
  src/EquipAI.WebAPI/Controllers/DeviceConfigController.cs \
  tests/EquipAI.Tests.Unit/Web/DeviceConfigControllerTests.cs \
  tests/EquipAI.Tests.Integration/Controllers/DeviceConfigControllerTests.cs
git commit -m "feat: register devices from tenant-safe templates"
```

### Task 3: 建立前端模板数据契约与归一化工具

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/hooks/useDeviceConfig.ts`
- Modify: `frontend/src/hooks/__tests__/useDeviceConfig.test.tsx`
- Create: `frontend/src/lib/deviceTemplatePreview.ts`
- Create: `frontend/src/lib/__tests__/deviceTemplatePreview.test.ts`

**Interfaces:**
- `DeviceTypeTemplate.defaultAlarmRules` 与 `parameters` 接受后端实际可能返回的 JSON 字符串或对象。
- `QuickRegisterRequest` 新增 `templateId?: string`、`applyDefaultAlarmRules?: boolean`。
- `parseTemplateArray(value, fieldName)` 返回安全的只读数组；无效 JSON 返回空数组并由 UI 显示“暂无可预览规则”，不抛出页面级异常。

- [x] **Step 1: 写失败的 TypeScript 工具与 hook 测试**

新增测试先锁定后端实体返回字符串、测试夹具对象和非法 JSON 三种形态：

```typescript
it('应解析后端返回的模板规则 JSON 字符串', () => {
  expect(parseTemplateArray('[{"name":"振动超标","metric":"vibration"}]', 'rules'))
    .toEqual([{ name: '振动超标', metric: 'vibration' }]);
});

it('非法模板 JSON 应返回空数组而不是抛出页面异常', () => {
  expect(parseTemplateArray('{bad', 'rules')).toEqual([]);
});
```

更新 hook 测试，断言 `useQuickRegister` 能提交 `templateId` 和 `applyDefaultAlarmRules`，成功后继续失效 `['devices']`。

- [x] **Step 2: 运行测试确认按预期失败**

运行：

```bash
cd frontend && npm run test -- --run src/lib/__tests__/deviceTemplate.test.ts src/hooks/__tests__/useDeviceConfig.test.tsx
```

预期：新工具导入失败或类型断言失败；现有 hook 测试保留原有通过结果。

- [x] **Step 3: 实现类型和纯函数归一化**

在 `deviceTemplatePreview.ts` 中实现无副作用的安全解析函数：支持后端 JSON 字符串、数组和包装对象，解析异常不输出原始 JSON；生产 UI 不因模板展示数据损坏而崩溃。预览组件只从归一化对象读取指标、范围和规则字段，并保持数字 `0` 不被错误转换为空值。

更新 `DeviceTypeTemplate` 与 `QuickRegisterRequest` 类型，保持旧字段可选；更新 `useDeviceConfig.ts` 的 mutation 泛型和注释。

- [x] **Step 4: 运行工具和 hook 测试确认通过**

运行：

```bash
cd frontend && npm run test -- --run src/lib/__tests__/deviceTemplatePreview.test.ts src/hooks/__tests__/useDeviceConfig.test.tsx
```

预期：所有工具和 hook 测试通过，模板非法 JSON 不造成未处理异常。

- [x] **Step 5: 提交 Task 3**

```bash
git add frontend/src/types/index.ts frontend/src/hooks/useDeviceConfig.ts \
  frontend/src/hooks/__tests__/useDeviceConfig.test.tsx \
  frontend/src/lib/deviceTemplatePreview.ts frontend/src/lib/__tests__/deviceTemplatePreview.test.ts
git commit -m "feat: normalize device template onboarding data"
```

### Task 4: 实现快速注册对话框和设备列表入口

**Files:**
- Create: `frontend/src/components/device/DeviceQuickRegisterDialog.tsx`
- Create: `frontend/src/components/device/__tests__/DeviceQuickRegisterDialog.test.tsx`
- Modify: `frontend/src/pages/DeviceListPage.tsx`
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`

**Interfaces:**
- `DeviceQuickRegisterDialog` props：`open: boolean`、`onOpenChange(open: boolean): void`。
- 组件内部使用 `useDeviceTemplates` 和 `useQuickRegister`；成功时由 hook 失效设备列表并关闭/清空表单。
- 组件只提交 `{ templateId, deviceCode, name, applyDefaultAlarmRules }`，不从浏览器提交完整模板规则。

- [x] **Step 1: 写失败的 UI 测试**

新增组件测试，mock API hook 返回模板、加载错误和 mutation：

```tsx
it('选择模板后应展示指标和告警预览，默认不启用推荐规则', async () => {
  render(<DeviceQuickRegisterDialog open onOpenChange={vi.fn()} />);
  expect(await screen.findByText('振动幅值')).toBeInTheDocument();
  expect(screen.getByRole('switch', { name: /推荐告警/ })).not.toBeChecked();
});

it('填写必填字段并显式启用推荐规则后只提交模板 ID 和开关', async () => {
  // 选择模板、填写编码/名称、打开 switch、提交
  expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
    templateId: 'template-1',
    applyDefaultAlarmRules: true,
    deviceCode: 'PUMP-001',
    name: '一号水泵',
  }));
});
```

另加加载失败重试、字段错误 `aria-invalid/aria-describedby`、重复编码提示且保留输入、提交成功关闭四组测试。

- [x] **Step 2: 运行 UI 测试确认按预期失败**

运行：

```bash
cd frontend && npm run test -- --run src/components/device/__tests__/DeviceQuickRegisterDialog.test.tsx
```

预期：组件文件不存在或行为断言失败。

- [x] **Step 3: 实现最小可用快速注册体验**

使用现有 `Dialog`、`Select`、`Input`、`Switch`、`Card` 和 `Button` 组件实现：

- 模板加载中显示加载状态；加载失败显示错误和 `refetch` 重试按钮；
- 选择模板后用 Task 3 归一化数据展示指标名称/单位/范围和告警字段；
- 设备编码和名称为空时阻止提交，并将错误元素 ID 与输入框 `aria-describedby` 绑定；
- `Switch` 默认 `false`，勾选后显示“阈值需结合现场工艺确认”提示；
- mutation 期间禁用提交，`DUPLICATE_CODE` 显示重复编码提示，其他错误显示通用失败提示且不清空输入；
- 成功后调用 `onOpenChange(false)` 并重置本地状态；关闭时同步清理上一次模板、错误和输入。

在 `DeviceListPage` 只增加 `quickRegisterOpen` 状态和 `perm.canCreate` 控制的“按模板添加”按钮；保留“新建”按钮打开原 `DeviceForm`，避免破坏高级档案编辑路径。

- [x] **Step 4: 运行 UI、类型和 i18n 测试确认通过**

运行：

```bash
cd frontend && npm run test -- --run src/components/device/__tests__/DeviceQuickRegisterDialog.test.tsx src/lib/__tests__/deviceTemplatePreview.test.ts
cd frontend && npx tsc -p tsconfig.json --noEmit
cd frontend && npm run check:i18n
```

预期：新增组件与工具测试通过，TypeScript 无错误，中英文资源键完全对齐。

- [x] **Step 5: 提交 Task 4**

```bash
git add frontend/src/components/device/DeviceQuickRegisterDialog.tsx \
  frontend/src/components/device/__tests__/DeviceQuickRegisterDialog.test.tsx \
  frontend/src/pages/DeviceListPage.tsx frontend/src/i18n/zh.json frontend/src/i18n/en.json
git commit -m "feat: add template-driven device quick registration"
```

### Task 5: 完善用户文档并执行发布级验证

**Files:**
- Modify: `docs/USER_GUIDE.md`
- Modify: `docs/superpowers/plans/2026-08-12-template-driven-device-onboarding.md`
- Test: `tests/EquipAI.Tests.Unit`
- Test: `tests/EquipAI.Tests.Integration`
- Test: `frontend` type/lint/i18n/unit/build commands

**Interfaces:**
- 用户手册说明模板阈值是推荐起点、启用前需结合现场工艺确认，协议接入仍需进入设备接入向导。
- 本任务不修改真实生产 `.env` 或设备数据。

- [x] **Step 1: 先写文档契约测试**

在 `tests/scripts/production-scripts-test.sh` 新增 `test_user_guide_documents_template_onboarding`，读取 `docs/USER_GUIDE.md` 并断言包含“模板快速注册”“推荐告警”“现场工艺确认”和“设备接入向导”四个关键说明，先运行 `bash tests/scripts/production-scripts-test.sh setup` 并观察失败。

- [x] **Step 2: 更新用户手册**

在设备管理章节新增操作步骤：进入设备列表 → 按模板添加 → 选择模板 → 核对指标和告警 → 输入编码/名称 → 可选启用推荐告警 → 注册后进入接入向导。明确系统租户模板对所有租户只读可见，推荐阈值不替代现场工程确认。

- [ ] **Step 3: 运行完整相关回归**

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceConfigControllerTests|FullyQualifiedName~DeviceTemplateAlarmRuleParserTests"
dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~DeviceConfigControllerTests"
cd frontend && npm run test -- --run
cd frontend && npx tsc -p tsconfig.json --noEmit
cd frontend && npm run lint
cd frontend && npm run check:i18n
cd frontend && npm run build
bash -n docker/production-readiness.sh docker/deploy-production.sh tests/scripts/production-scripts-test.sh
git diff --check
```

预期：相关后端/前端测试、类型检查、Lint、i18n、生产构建和 Shell 语法均通过；若出现既有失败必须先定位，不得删除或放宽断言。

- [ ] **Step 4: 自审变更范围和真实环境不变量**

运行：

```bash
git -c core.fsmonitor=false status --short --branch
git diff --name-only main...HEAD
git diff -- docker/.env
```

确认没有修改 `.env`、证书、备份、容器卷、迁移数据库或生成未追踪构建产物；确认前端快速注册不绕过权限、后端模板查询不跨租户。

- [ ] **Step 5: 提交 Task 5**

```bash
git add docs/USER_GUIDE.md docs/superpowers/plans/2026-08-12-template-driven-device-onboarding.md
git commit -m "docs: document template-driven device onboarding"
```

## 完成前验收清单

- [ ] 服务端模板关联、规则完整映射、租户隔离、事务回滚和重复编码错误均有测试证据。
- [ ] 前端模板选择、预览、默认关闭、显式启用、错误保留输入和无障碍反馈均有测试证据。
- [ ] 中文/英文资源、用户手册、TypeScript、Lint、单测和生产构建均通过。
- [ ] 既有高级设备表单、设备接入向导、生产 readiness 门禁和真实环境 27 项阻断均未被削弱。
