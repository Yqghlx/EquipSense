# FMEA Knowledge Rule Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 FMEA 表单中的手工知识规则 UUID 输入改为安全、可发现、可清除的规则选择器，让已完成的 FMEA 诊断关联能力能够被现场用户实际使用。

**Architecture:** 在 FMEA 控制器下增加只读的规则选项查询，不改变现有知识规则 CRUD 接口；查询只返回当前租户和系统租户的最小摘要，并由服务端继续对 FMEA 写入执行最终关联校验。前端在 FMEA 表单中按设备类型以 250ms 防抖加载选项，使用现有 Base UI Select 组件提交原有 `knowledgeRuleId` 字段，查询失败不阻塞不关联的 FMEA 保存。

**Tech Stack:** .NET 8、EF Core、ASP.NET Core Controller、React 19、TypeScript strict、TanStack Query、Base UI Select、react-i18next、xUnit/FluentAssertions、Vitest、Testing Library。

## Global Constraints

- 所有业务查询必须显式限定当前租户；规则选项允许当前租户和 `SystemConstants.SystemTenantId`，禁止返回其他租户规则。
- 规则选项接口只返回 `Id`、`DeviceType`、`Name`、`Enabled`、`IsSystemPreset`，不返回触发条件、结论或其他知识内容。
- 新建选择器只展示启用规则；编辑时通过 `selectedRuleId` 保留当前已关联的停用规则，避免打开编辑后无意间解除关联。
- 规则选项最多返回 100 条，排序必须确定：当前租户优先、当前设备类型精确匹配优先、当前选中项优先、名称和 ID 消除并列。
- 服务端仍以 `FmeaService.EnsureKnowledgeRuleIsAccessibleAsync` 的租户规则为最终安全边界，前端选项不是授权依据。
- 不新增第三方依赖、不修改数据库 Schema、不修改现有知识规则 CRUD 语义；所有新增注释、日志和文案使用中文，英文文案必须同步维护。
- 现有工作区包含用户未提交改动，本计划不执行 `git add`、`git commit` 或 `git push`，只修改本功能所需文件。
- 完成前必须运行 FMEA 聚焦测试、后端 Release 构建、前端 i18n/类型/Lint/Vitest/生产构建和 `git diff --check`。

---

### Task 1: 定义规则选项 API 的失败测试

**Files:**
- Modify: `tests/EquipAI.Tests.Unit/Fmea/FmeaServiceTests.cs`
- Modify: `tests/EquipAI.Tests.Integration/Controllers/FmeaControllerTests.cs`

**Interfaces:**
- Consumes: 现有 `FmeaService`、`KnowledgeRule`、`SystemConstants.SystemTenantId` 和测试工厂认证客户端。
- Produces: 规则选项的租户隔离、启用状态、系统预置可见性、编辑停用规则保留和未授权访问回归契约。

- [x] **Step 1: 写服务层红灯测试**

在 `FmeaServiceTests` 增加以下两个测试。测试数据必须包含当前租户精确设备类型规则、系统租户通配规则、当前租户停用规则和其他租户规则；断言其他租户和停用新选项不返回，并断言当前租户排序在系统规则之前。

```csharp
[Fact]
public async Task GetKnowledgeRuleOptionsAsync_Should_ReturnOnlyAccessibleEnabledRulesInDeterministicOrder()
{
    var tenantRuleId = Guid.NewGuid();
    var systemRuleId = Guid.NewGuid();
    var disabledRuleId = Guid.NewGuid();
    var otherTenantRuleId = Guid.NewGuid();

    _dbContext.KnowledgeRules.AddRange(
        CreateKnowledgeRule(tenantRuleId, _testTenantId, "电机", "本租户电机规则"),
        CreateKnowledgeRule(systemRuleId, SystemConstants.SystemTenantId, "*", "系统通用规则"),
        CreateKnowledgeRule(disabledRuleId, _testTenantId, "电机", "已停用规则", enabled: false),
        CreateKnowledgeRule(otherTenantRuleId, Guid.NewGuid(), "电机", "其他租户规则"));
    await _dbContext.SaveChangesAsync();

    var options = await _fmeaService.GetKnowledgeRuleOptionsAsync("电机");

    options.Select(option => option.Id).Should().Equal(tenantRuleId, systemRuleId);
    options.Should().OnlyContain(option => option.Enabled);
    options.Single(option => option.Id == systemRuleId).IsSystemPreset.Should().BeTrue();
}

[Fact]
public async Task GetKnowledgeRuleOptionsAsync_Should_KeepSelectedDisabledRuleForEdit()
{
    var disabledRuleId = Guid.NewGuid();
    _dbContext.KnowledgeRules.Add(
        CreateKnowledgeRule(disabledRuleId, _testTenantId, "泵", "已停用泵规则", enabled: false));
    await _dbContext.SaveChangesAsync();

    var options = await _fmeaService.GetKnowledgeRuleOptionsAsync("泵", disabledRuleId);

    options.Should().ContainSingle(option => option.Id == disabledRuleId && !option.Enabled);
}
```

将现有测试辅助方法扩展为 `CreateKnowledgeRule(Guid id, Guid tenantId, string deviceType = "测试设备", string name = "测试规则", bool enabled = true)`，只补充参数，不改变已有调用的默认行为。

- [x] **Step 2: 写控制器红灯测试**

在 `FmeaControllerTests` 增加一个已认证请求测试，将当前租户、系统租户和其他租户规则写入数据库后请求 `/api/v1/fmea/knowledge-rules?deviceType=电机`，断言返回 200、只包含当前租户/系统租户摘要字段且不包含其他租户规则；再在无认证测试中请求同一路径并断言 401。

```csharp
[Fact]
public async Task GetFmeaKnowledgeRuleOptions_WithoutAuth_Returns401()
{
    var client = await _factory.CreateClientWithSeedAsync();
    var response = await client.GetAsync("/api/v1/fmea/knowledge-rules");

    response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
}
```

认证测试使用已有的 `GetAuthenticatedClientAsync`，不要复用 `KnowledgeRulesController` 的列表断言，因为该接口只返回当前租户且响应 DTO 不包含系统预置标识。

- [x] **Step 3: 运行红灯测试**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~FmeaServiceTests"
dotnet test tests/EquipAI.Tests.Integration --no-restore --filter "FullyQualifiedName~FmeaControllerTests"
```

预期：编译失败，原因是 `GetKnowledgeRuleOptionsAsync` 和 `/api/v1/fmea/knowledge-rules` 尚未实现；不得通过修改测试断言来消除红灯。

### Task 2: 实现租户安全的规则选项接口

**Files:**
- Modify: `src/EquipAI.Application/Fmea/DTOs/FmeaDtos.cs`
- Modify: `src/EquipAI.Application/Fmea/FmeaService.cs`
- Modify: `src/EquipAI.WebAPI/Controllers/FmeaController.cs`
- Modify: `tests/EquipAI.Tests.Unit/Fmea/FmeaServiceTests.cs`
- Modify: `tests/EquipAI.Tests.Integration/Controllers/FmeaControllerTests.cs`

**Interfaces:**
- Consumes: Task 1 的测试契约。
- Produces: `FmeaKnowledgeRuleOptionResponse` 和 `FmeaService.GetKnowledgeRuleOptionsAsync(string? deviceType = null, Guid? selectedRuleId = null, CancellationToken ct = default)`，以及 `GET /api/v1/fmea/knowledge-rules`。

- [x] **Step 1: 定义最小响应 DTO**

在 `FmeaDtos.cs` 增加中文注释完整的 DTO：

```csharp
/// <summary>FMEA 表单可选的知识规则摘要。</summary>
public class FmeaKnowledgeRuleOptionResponse
{
    public Guid Id { get; set; }
    public string DeviceType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool Enabled { get; set; }
    public bool IsSystemPreset { get; set; }
}
```

- [x] **Step 2: 实现服务查询的基准过滤**

在 `FmeaService` 增加 `GetKnowledgeRuleOptionsAsync`。使用 `_db.KnowledgeRules.IgnoreQueryFilters().AsNoTracking()`，显式限定 `rule.TenantId == _tenantContext.TenantId || rule.TenantId == SystemConstants.SystemTenantId`；无 `selectedRuleId` 时只保留 `Enabled == true`，有 `selectedRuleId` 时额外保留该 ID，以便编辑停用规则。

设备类型非空时只返回 `rule.DeviceType == normalizedDeviceType || rule.DeviceType == "*"`，但必须通过同一租户基准过滤保留 `selectedRuleId`；设备类型为空时不做类型筛选。使用 `Take(100)` 限制响应规模，并使用 `ct` 传入 `ToListAsync(ct)`。

- [x] **Step 3: 实现确定性排序和映射**

按以下顺序构造 LINQ 排序，避免数据库未承诺顺序导致选择器抖动：

```csharp
var normalizedDeviceType = deviceType?.Trim();

var options = await query
    .OrderByDescending(rule => selectedRuleId.HasValue && rule.Id == selectedRuleId.Value)
    .ThenByDescending(rule => rule.TenantId == _tenantContext.TenantId)
    .ThenByDescending(rule => !string.IsNullOrWhiteSpace(normalizedDeviceType)
        && rule.DeviceType == normalizedDeviceType)
    .ThenBy(rule => rule.Name)
    .ThenBy(rule => rule.Id)
    .Take(100)
    .Select(rule => new FmeaKnowledgeRuleOptionResponse
    {
        Id = rule.Id,
        DeviceType = rule.DeviceType,
        Name = rule.Name,
        Enabled = rule.Enabled,
        IsSystemPreset = rule.TenantId == SystemConstants.SystemTenantId,
    })
    .ToListAsync(ct);
```

若 EF InMemory 或 PostgreSQL 对布尔表达式翻译存在差异，保留同样的语义并在查询前使用明确的条件组合；不要退回到内存中加载所有租户规则。

- [x] **Step 4: 增加控制器只读端点**

在 `FmeaController` 中将新路由放在 `GetById` 之前，避免路由歧义：

```csharp
[HttpGet("knowledge-rules")]
[RequirePermission("knowledge:read")]
[ProducesResponseType(typeof(IReadOnlyList<FmeaKnowledgeRuleOptionResponse>), StatusCodes.Status200OK)]
public async Task<ActionResult<IReadOnlyList<FmeaKnowledgeRuleOptionResponse>>> GetKnowledgeRuleOptions(
    [FromQuery] string? deviceType = null,
    [FromQuery] Guid? selectedRuleId = null,
    CancellationToken ct = default)
{
    return Ok(await _fmeaService.GetKnowledgeRuleOptionsAsync(deviceType, selectedRuleId, ct));
}
```

该端点只读且使用 `knowledge:read`；不增加创建、编辑或删除权限。对于空设备类型和错误选中 ID，返回合法的空或有限列表，不返回 400，不泄露 ID 是否属于其他租户。

- [x] **Step 5: 运行后端绿灯测试**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore --filter "FullyQualifiedName~FmeaServiceTests"
dotnet test tests/EquipAI.Tests.Integration --no-restore --filter "FullyQualifiedName~FmeaControllerTests"
```

预期：新增租户隔离、停用规则保留和 HTTP 认证测试全部通过，既有 FMEA 测试不回归。

### Task 3: 增加前端规则选项类型和查询 Hook

**Files:**
- Modify: `frontend/src/hooks/useFmea.ts`
- Create: `frontend/src/hooks/__tests__/useFmea.test.tsx`

**Interfaces:**
- Consumes: Task 2 的 `GET /api/v1/fmea/knowledge-rules`。
- Produces: `FmeaKnowledgeRuleOption`、`useFmeaKnowledgeRuleOptions(params, options?)`，供 FMEA 表单使用。

- [x] **Step 1: 写 Hook 红灯测试**

创建 `useFmea.test.tsx`，复用现有知识 Hook 测试的 `QueryClientProvider` 和 `vi.mock('../../lib/api')` 模式，覆盖参数编码、响应透传和禁用查询：

```tsx
it('应按设备类型和当前规则 ID查询可选规则', async () => {
  mockedApi.get.mockResolvedValueOnce({ data: [mockOption] });

  const { result } = renderHook(
    () => useFmeaKnowledgeRuleOptions({ deviceType: '电机', selectedRuleId: 'rule-1' }),
    { wrapper: createWrapper() },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(mockedApi.get).toHaveBeenCalledWith('/fmea/knowledge-rules', {
    params: { deviceType: '电机', selectedRuleId: 'rule-1' },
  });
  expect(result.current.data).toEqual([mockOption]);
});

it('表单关闭时不应发起规则选项请求', () => {
  renderHook(
    () => useFmeaKnowledgeRuleOptions({}, { enabled: false }),
    { wrapper: createWrapper() },
  );
  expect(mockedApi.get).not.toHaveBeenCalled();
});
```

- [x] **Step 2: 运行 Hook 红灯测试**

运行：

```bash
cd frontend
npx vitest run src/hooks/__tests__/useFmea.test.tsx
```

预期：因 Hook 和类型尚未存在而失败。

- [x] **Step 3: 实现摘要类型和 Hook**

在 `useFmea.ts` 增加：

```ts
export interface FmeaKnowledgeRuleOption {
  id: string;
  deviceType: string;
  name: string;
  enabled: boolean;
  isSystemPreset: boolean;
}

export function useFmeaKnowledgeRuleOptions(
  params: { deviceType?: string; selectedRuleId?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['fmea-knowledge-rule-options', params],
    queryFn: async () => {
      const { data } = await api.get<FmeaKnowledgeRuleOption[]>('/fmea/knowledge-rules', { params });
      return data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}
```

调用方在传入前去除空白并将空值转为 `undefined`，Hook 不自行修改用户输入；React Query 的对象 query key 用于区分设备类型和编辑中的选中规则。

- [x] **Step 4: 运行 Hook 绿灯测试**

运行：

```bash
cd frontend
npx vitest run src/hooks/__tests__/useFmea.test.tsx
```

预期：所有 Hook 测试通过，且不需要改变现有 `useFmeaEntries`、create、update、delete 或 toggle 行为。

### Task 4: 将 FMEA 表单改为可访问的规则选择器

**Files:**
- Modify: `frontend/src/components/fmea/FmeaFormDialog.tsx`
- Modify: `frontend/src/components/fmea/__tests__/FmeaFormDialog.test.tsx`
- Modify: `frontend/src/i18n/zh.json`
- Modify: `frontend/src/i18n/en.json`

**Interfaces:**
- Consumes: Task 3 的 `useFmeaKnowledgeRuleOptions` 和 `FmeaKnowledgeRuleOption`。
- Produces: 不再手填 UUID 的 FMEA 关联体验；提交请求仍使用 `knowledgeRuleId?: string`，清除后保持未关联语义。

- [x] **Step 1: 先修改组件测试中的 Hook mock 和双语测试字典**

在 `FmeaFormDialog.test.tsx` mock `useFmeaKnowledgeRuleOptions`，默认返回 `{ data: [], isLoading: false, isError: false }`；增加以下测试数据和文案：

```tsx
const mockRuleOption = {
  id: '11111111-1111-4111-8111-111111111111',
  deviceType: '泵',
  name: '泵振动异常规则',
  enabled: true,
  isSystemPreset: false,
};

it('应从规则选择器选择关联规则并提交 ID', async () => {
  vi.mocked(useFmeaKnowledgeRuleOptions).mockReturnValue({
    data: [mockRuleOption], isLoading: false, isError: false,
  } as ReturnType<typeof useFmeaKnowledgeRuleOptions>);
  const user = userEvent.setup();
  render(<FmeaFormDialog open entry={null} onOpenChange={vi.fn()} />);

  await fillRequiredFields(user);
  await user.click(screen.getByRole('combobox', { name: '关联规则' }));
  await user.click(screen.getByRole('option', { name: /泵振动异常规则/ }));
  await user.click(screen.getByRole('button', { name: '保存' }));

  await waitFor(() => expect(mocks.createMutateAsync).toHaveBeenCalledWith(
    expect.objectContaining({ knowledgeRuleId: mockRuleOption.id }),
  ));
});
```

将原来的“输入非法 UUID”测试替换为“选择规则 + 清除规则”测试，保留后端字段长度、RPN、错误可访问性和失败保留草稿覆盖。

- [x] **Step 2: 运行组件红灯测试**

运行：

```bash
cd frontend
npx vitest run src/components/fmea/__tests__/FmeaFormDialog.test.tsx
```

预期：因当前组件仍渲染 `<Input>` 而不是 `combobox`，新增选择器测试失败。

- [x] **Step 3: 增加防抖查询并保持草稿稳定**

在表单组件中使用 `useEffect` 和 `window.setTimeout` 实现 250ms 的本地 `useDebouncedValue`，查询参数使用 `values.deviceType.trim()` 和 `entry?.knowledgeRuleId ?? undefined`；调用 Hook 时将 `enabled` 绑定到 `open`。清除定时器，避免快速输入或关闭弹窗后产生过期请求。

```tsx
const lookupDeviceType = useDebouncedValue(values.deviceType.trim(), 250);
const ruleOptionsQuery = useFmeaKnowledgeRuleOptions(
  {
    deviceType: lookupDeviceType || undefined,
    selectedRuleId: entry?.knowledgeRuleId ?? undefined,
  },
  { enabled: open },
);
```

查询错误只显示非阻塞的辅助文案；不得在查询失败时清空 `values.knowledgeRuleId`，保存未关联条目仍应可用。

- [x] **Step 4: 用 Select 替换 UUID Input**

导入 `Select`、`SelectContent`、`SelectItem`、`SelectTrigger`、`SelectValue`。使用稳定的 `__none__` 值表示清除，选择器行为如下：

```tsx
const noKnowledgeRuleValue = '__none__';

<Select
  value={values.knowledgeRuleId || noKnowledgeRuleValue}
  onValueChange={(value) => updateField(
    'knowledgeRuleId',
    value === noKnowledgeRuleValue ? '' : String(value),
  )}
>
  <SelectTrigger id="fmea-knowledge-rule-id" className="w-full">
    <SelectValue placeholder={t('fmea.knowledgeRulePlaceholder')} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value={noKnowledgeRuleValue}>{t('fmea.noKnowledgeRule')}</SelectItem>
    {ruleOptionsQuery.data?.map((rule) => (
      <SelectItem key={rule.id} value={rule.id}>
        {rule.name} · {rule.deviceType}
        {rule.isSystemPreset ? ` · ${t('fmea.systemPreset')}` : ''}
        {!rule.enabled ? ` · ${t('fmea.disabledRule')}` : ''}
      </SelectItem>
    ))}
    {values.knowledgeRuleId
      && !ruleOptionsQuery.data?.some((rule) => rule.id === values.knowledgeRuleId)
      && <SelectItem value={values.knowledgeRuleId}>{t('fmea.unavailableSelectedRule')}</SelectItem>}
  </SelectContent>
</Select>
```

保留 `id="fmea-knowledge-rule-id"` 以兼容现有标签和测试；移除 `knowledgeRuleIdPattern`、GUID 错误校验和原 UUID placeholder。`buildRequest` 仍只在非空时发送 `knowledgeRuleId`，从而保持现有 create/update API 兼容性。

- [x] **Step 5: 补齐中英文文案并验证键集合**

在 `fmea` 节点同步增加：`knowledgeRulePlaceholder`、`noKnowledgeRule`、`systemPreset`、`disabledRule`、`unavailableSelectedRule`、`knowledgeRuleLoading`、`knowledgeRuleLoadFailed`、`knowledgeRuleHint`。中文文案必须明确“可选”和“系统预置”，英文文案保持等义；不得删除仍被其他测试或页面使用的旧键，只有确认不再引用后才删除 `knowledgeRuleIdPlaceholder` 与 `knowledgeRuleIdInvalid`。

- [x] **Step 6: 运行组件绿灯和 i18n 检查**

运行：

```bash
cd frontend
npx vitest run src/components/fmea/__tests__/FmeaFormDialog.test.tsx
npm run check:i18n
```

预期：选择、清除、编辑停用规则保留、查询失败非阻塞和既有表单校验全部通过；中英文键集合无差异。

### Task 5: 文档、全量验证和差异审查

**Files:**
- Modify: `docs/FINAL_TECHNICAL_DESIGN.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`
- Modify: `docs/evaluation/00-INDEX.md`
- Review: Task 1–4 所有变更文件

**Interfaces:**
- Consumes: 已通过的规则选项 API 和 FMEA 选择器。
- Produces: 可追溯的 API 说明、用户体验改进记录和覆盖全项目生产门禁的验证证据。

- [x] **Step 1: 更新技术设计中的 API 和关联说明**

在 `docs/FINAL_TECHNICAL_DESIGN.md` 的 FMEA/API 章节增加 `GET /api/v1/fmea/knowledge-rules?deviceType=&selectedRuleId=`，说明返回当前租户/系统租户的最小规则摘要、100 条上限、编辑停用项保留和服务端仍执行关联校验；同步说明 FMEA 页面不再要求用户手工输入 UUID。

- [x] **Step 2: 更新变更记录和就绪报告**

在 `CHANGELOG.md` 增加本次改进；在 `docs/LANDING_READINESS_REPORT.md` 记录 FMEA 关联选择器已完成及其测试范围，但不得把当前仍未完成的真实 SMTP、WAF、OTLP、GH main/tag、现场协议、容量基线和 27 项部署门禁标记为已完成。

- [x] **Step 3: 运行后端和前端完整门禁**

运行：

```bash
dotnet test tests/EquipAI.Tests.Unit --no-restore
dotnet test tests/EquipAI.Tests.Integration --no-restore
dotnet build EquipAI.sln --configuration Release --no-restore -m:1 --disable-build-servers
cd frontend
npm run check:i18n
npx tsc -p tsconfig.json --noEmit
npx eslint src/ --max-warnings 1
npm test
npm run build
```

预期：后端无失败测试且 Release 构建无警告/错误；前端 i18n、类型、Lint、Vitest 和生产构建全部通过，新增规则选择测试被纳入总数。

- [x] **Step 4: 做差异和安全审查**

运行：

```bash
git diff --check
git status --short
git diff --stat
```

逐项确认：查询没有 `IgnoreQueryFilters` 后遗漏租户条件；响应没有暴露条件/结论；选项上限存在；编辑停用项不会被清空；清除选择会发送空关联；查询失败不会阻塞保存；中文/英文键同步；没有修改现有未提交文件以外的无关内容；不执行提交和推送。

- [x] **Step 5: 记录验证结果并交付**

在最终回复中链接新增/修改的关键文件，报告聚焦测试、完整门禁和仍然存在的生产部署阻塞项。只有所有实际运行命令均有成功输出，才宣称本次 FMEA 选择器改进完成；不得将局部功能完成等同于整个项目已经生产就绪。
