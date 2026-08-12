# Task 4 报告：设备对比页面前端生产实现

## 完成范围

- 新建 `frontend/src/pages/DeviceComparisonPage.tsx`
- 修改 `frontend/src/hooks/useDeviceComparison.ts`
- 修改 `frontend/src/hooks/useDevices.ts`
- 修改 `frontend/src/App.tsx`
- 修改 `frontend/src/components/layout/Sidebar.tsx`
- 修改 `frontend/src/i18n/zh.json`
- 修改 `frontend/src/i18n/en.json`
- 按契约最小修正 Task 3 测试：
  - `frontend/src/hooks/__tests__/useDeviceComparison.test.tsx`
  - `frontend/src/pages/__tests__/DeviceComparisonPage.i18n.test.tsx`

## 实现结果

### 1. `useDeviceComparison`

- 导出 `DeviceComparisonQuery`
- `deviceIds` 在 query key 与 URL 中统一做去重、排序
- 显式传入 `deviceIds` 时，仅 2–5 个唯一 ID 才启用查询
- 未传 `deviceIds` 时保留旧 API“同类型全部设备”兼容行为

### 2. `useDevices`

- 新增可选 `keyword`
- 新增可选 `options.enabled`
- 将前端 `deviceType` 正确映射为后端 `type`
- 将 `keyword` 写入 URL 查询参数
- 未传 `options.enabled` 时保持原有默认启用行为

### 3. 设备对比页面

- 新增独立路由 `/device-comparison`
- 提供：
  - 设备类型筛选
  - 同类型候选设备搜索
  - 2–5 台设备选择限制
  - 指标自由输入
  - 告警规则 datalist 指标建议
  - 24/72/168/720 小时时间窗口
  - 群组均值、标准差、设备明细表、异常 Badge、设备详情链接
  - 加载/失败/缓存错误/无候选/样本不足/无权限状态
- 无 `device:read` 权限时直接显示无权限提示，不触发设备/规则/对比查询

### 4. 导航与双语

- `App.tsx` 注册懒加载路由
- `Sidebar.tsx` 新增设备对比入口与图标
- `zh.json` / `en.json` 补齐静态 i18n 键，并通过覆盖检查

## 测试与验证

### 聚焦测试

```bash
cd frontend
npx vitest run src/pages/__tests__/DeviceComparisonPage.i18n.test.tsx src/hooks/__tests__/useDeviceComparison.test.tsx src/hooks/__tests__/useDevices.test.tsx
```

结果：3 个文件，35/35 通过

### 完整前端门禁

```bash
cd frontend
npm run check:i18n
npx tsc -p tsconfig.json --noEmit
npx eslint src/ --max-warnings 1
npm run test -- --run
npm run build
```

结果：

- `check:i18n` 通过：1105 个键中英对齐
- TypeScript 通过
- ESLint 通过
- Vitest 全量通过：85 个文件，489/489 通过
- 生产构建通过

## 必要的测试契约修正

### `useDeviceComparison` 测试

根据 Task 4 明确要求：

> 保留旧调用兼容（无 ID 仍允许旧 API 全量行为）

因此将“未传 `deviceIds` 应禁用查询”的旧断言修正为：

- 显式传 `deviceIds: []` 时禁用查询
- 未传 `deviceIds` 时保留旧 API 兼容行为并允许查询

### datalist 建议项测试

原测试使用 `getByDisplayValue` 直接断言 `datalist > option`，与实际 DOM 查询语义不稳定。已最小修正为按 `option[value="..."]` 校验建议项存在，不削弱行为覆盖。

## 已知噪声

- 仓库原生 `git status` 曾出现一次 `.git/fsmonitor--daemon.ipc` 相关噪声；后续通过 `git -c core.fsmonitor=false ...` 规避，不影响本次实现、测试与提交。
