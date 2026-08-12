# 模板驱动设备快速接入设计

> 设计日期：2026-08-12  
> 适用范围：设备首次注册、模板默认告警规则和租户隔离  
> 设计状态：已确认，待实施

## 1. 背景与问题

项目已经具备设备类型模板、模板参数、模板默认告警规则和快速注册 API，但首次使用者无法在产品界面走通这条链路：

- `GET /api/v1/device-types` 已返回系统预置模板和当前租户模板；
- `POST /api/v1/device-config/quick-register` 已支持设备与告警规则在一次事务中创建；
- 前端已有 `useDeviceTemplates` 和 `useQuickRegister`，但没有页面或对话框消费它们；
- 当前快速注册服务没有保存 `Device.TypeTemplateId`，并把规则运算符硬编码为 `>`、自动建单硬编码为 `true`，会丢失模板中“低于阈值”、冷却时间和是否自动建单等业务语义；
- 现有设备列表的新建设备表单要求用户手工填写较多资产字段，无法帮助第一次使用的用户快速看到有效监控结果。

这既是用户上手摩擦，也是生产正确性风险：如果推荐规则被错误转换，设备可能误报、漏报或意外自动创建工单。

## 2. 目标与非目标

### 2.1 目标

1. 在设备列表页提供“按模板快速添加”入口，首次用户只需选择模板、填写设备编码和名称即可完成基础注册。
2. 在提交前展示模板监控指标和推荐告警规则，让用户知道系统将配置什么，并明确选择是否启用推荐告警。
3. 由服务端从租户可见模板读取默认规则，完整保留规则名称、指标、运算符、阈值、级别、冷却时间、启用状态和自动建单设置。
4. 将设备与所选模板关联，保证后续查询、审计和配置维护能够追溯来源。
5. 严格执行模板租户边界：只能使用当前租户模板或系统预置模板，不能通过请求体注入其他租户模板。
6. 对并发重复设备编码返回稳定的业务错误，不把唯一约束异常泄露为 500。
7. 保留现有“高级设备表单”和“设备接入向导”的职责，不把资产档案注册与 OPC UA/Modbus 连接配置混成一个流程。

### 2.2 非目标

- 不在本次工作中新增设备类型模板管理页面；
- 不自动推断现场工艺阈值，不宣称模板阈值适用于所有客户设备；
- 不修改 OPC UA、Modbus、MQTT 连接协议或边缘网关采集流程；
- 不改变既有无模板快速注册调用的兼容行为；
- 不通过放宽多租户查询、生产安全门禁或默认告警校验来实现“快速成功”。

## 3. 方案与接口

### 3.1 服务端权威模板注册

扩展 `QuickRegisterRequest`：

```csharp
public record QuickRegisterRequest
{
    public Guid TenantId { get; init; } // 兼容字段，始终忽略，以 JWT 租户为准
    public Guid? TemplateId { get; init; }
    public bool ApplyDefaultAlarmRules { get; init; }
    public string DeviceCode { get; init; } = string.Empty;
    public string? Name { get; init; }
    public string? DeviceType { get; init; }
    public List<DefaultAlertRuleRequest>? DefaultAlertRules { get; init; }
}
```

当 `TemplateId` 有值时：

1. 使用 `IgnoreQueryFilters()` 查询模板，并限定 `TenantId == 当前租户 || TenantId == 系统租户`；找不到或不可见时返回统一的 `TEMPLATE_NOT_FOUND` 业务错误。
2. 设置 `Device.TypeTemplateId = TemplateId`，设备类型默认使用模板名称；只有无模板调用才使用 `DeviceType` 或“通用设备”。
3. 当 `ApplyDefaultAlarmRules=true` 时，服务端解析模板 `DefaultAlarmRules` 数组并映射完整字段；客户端不提交规则内容，避免客户端篡改系统推荐配置。
4. 模板规则 JSON 无法解析、关键字段非法或规则类型不支持时，整个注册操作失败并返回 `TEMPLATE_RULES_INVALID`，不创建半成品设备。
5. 设备、规则、租户设备数在同一个数据库事务中提交；失败时全部回滚。

当 `TemplateId` 为空时，保留现有客户端兼容路径，但扩展 `DefaultAlertRuleRequest` 以承载名称、运算符、冷却时间、启用状态和自动建单设置；不再由服务端硬编码这些字段。请求体的 `TenantId` 继续忽略。

### 3.2 重复编码与错误契约

服务端继续先做当前租户范围内的快速检查以改善用户提示，同时捕获数据库唯一约束冲突以覆盖并发窗口。重复编码统一映射为 `DUPLICATE_CODE`，保留现有客户端可识别的响应结构；其他数据库异常继续向统一异常处理中间件传播并记录关联日志。

### 3.3 前端快速接入对话框

在 `frontend/src/components/device/` 新增独立的 `DeviceQuickRegisterDialog`，由 `DeviceListPage` 以“按模板添加”按钮打开：

1. 加载模板列表；加载失败显示明确错误和重试按钮，不显示为空列表；
2. 先选择模板，再填写设备编码和名称；模板没有规则时也允许继续；
3. 展示模板参数中的指标名称、单位和正常范围；
4. 展示推荐告警名称、指标、运算符、阈值、级别和自动建单标识；
5. 默认不提交推荐告警，用户显式勾选“启用推荐告警规则”后才传 `applyDefaultAlarmRules=true`；界面同时提示阈值需结合现场工艺确认；
6. 提交时只发送 `templateId`、设备编码、名称和是否应用默认规则，由后端读取规则；
7. 成功后关闭对话框、刷新设备列表并清理表单；失败时保留用户输入，并把 `DUPLICATE_CODE` / 模板错误映射为可理解的中英文提示；
8. 所有新增文案同时加入 `zh.json` 和 `en.json`，字段错误使用 `aria-invalid` 与 `aria-describedby` 关联输入框。

“设备接入向导”仍负责网关协议、连接测试和采集点配置；快速注册只负责创建资产档案和可选默认告警，成功后用户可以从设备或网关入口继续配置采集链路。

## 4. 数据流与安全边界

```text
前端选择模板
    ↓ 仅发送 templateId + 设备基础字段 + applyDefaultAlarmRules
QuickRegisterController
    ↓ JWT 当前租户过滤模板
DeviceConfigService
    ↓ 服务端解析模板参数/告警规则
事务：Device(TypeTemplateId) + AlertRule[] + Tenant.CurrentDeviceCount
    ↓ 全部成功
设备列表刷新；用户继续进入协议接入向导
```

- 不信任请求体 `TenantId`；租户以 `ITenantContext.TenantId` 为唯一权威。
- 系统租户模板只读可见，不能被普通租户修改或通过 ID 横向读取其他租户模板。
- 推荐规则不由浏览器提交完整内容，避免前端篡改阈值或自动建单设置。
- 错误响应不回显模板 JSON、连接配置或数据库异常详情。
- 默认不启用推荐告警，避免未经现场确认就触发误报和自动工单；启用动作必须由用户明确勾选。

## 5. 测试策略

### 5.1 后端单元与集成测试

- 模板属于当前租户时可以注册并保存 `TypeTemplateId`；
- 系统租户模板对普通租户可用；其他租户模板返回 `TEMPLATE_NOT_FOUND`；
- `ApplyDefaultAlarmRules=false` 不创建规则，`true` 按模板完整映射规则；至少覆盖 `gt`/`lt`、不同级别、冷却时间、禁用规则和自动建单真假；
- 模板 JSON 无效时注册失败且设备、告警规则和租户计数均不落库；
- 无模板兼容路径不回归，客户端自带规则字段完整保留；
- 重复编码返回 `DUPLICATE_CODE`，包括数据库唯一约束冲突路径；
- 请求体伪造 `TenantId` 或 `TemplateId` 不得跨租户读取或写入。

### 5.2 前端测试

- 模板加载成功后展示模板与指标/规则预览；
- 加载失败显示重试入口，不能伪装成“暂无模板”；
- 必填字段和无障碍错误关联正确；
- 默认未勾选推荐规则，勾选后请求只携带模板 ID 和布尔开关；
- 成功关闭并刷新列表，重复编码显示业务提示且保留输入；
- 中文和英文资源键完整对齐。

### 5.3 验证命令

```bash
dotnet test tests/EquipAI.Tests.Unit --filter "FullyQualifiedName~DeviceConfig"
dotnet test tests/EquipAI.Tests.Integration --filter "FullyQualifiedName~DeviceConfigControllerTests"
cd frontend && npm run test -- --run src/components/device src/hooks/__tests__/useDeviceConfig.test.tsx
cd frontend && npx tsc -p tsconfig.json --noEmit
cd frontend && npm run check:i18n
```

## 6. 验收标准

1. 首次用户能够在设备列表页从模板完成设备档案注册，不必先理解全部高级字段。
2. 设备与模板可追溯，默认告警规则的业务语义不丢失、不被客户端伪造。
3. 未经用户明确勾选时不启用推荐告警；模板错误和重复编码均可理解、可重试。
4. 多租户、事务完整性、并发唯一性和中英文无障碍回归均有自动化证据。
5. 高级表单和协议接入向导的现有路径保持可用。

## 7. 后续生产就绪工作

模板阈值仍需由现场工程师结合设备型号、工艺和传感器量程确认；代码侧的预览与显式确认不能替代正式工艺验收、容量基线、凭据/证书注入和恢复演练。
