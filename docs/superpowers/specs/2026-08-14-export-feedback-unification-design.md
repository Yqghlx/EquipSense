# CSV 导出反馈统一设计

## 背景

设备列表、告警中心和工单列表的 CSV 导出按钮直接调用异步函数。网络、权限或服务端错误发生时，页面没有用户可见反馈；请求尚未完成时按钮也没有统一的忙碌状态，快速连续点击可能触发重复下载请求。审计日志和运营报表页面已经分别补充了失败提示和按钮禁用，但实现重复，后续容易再次出现不一致。

## 目标

1. 为设备、告警、工单、审计日志和运营报表的导出入口提供一致的加载态、失败提示和按钮可访问状态。
2. 同一按钮在一次导出未完成前只允许发起一个请求，避免重复导出和重复服务端负载。
3. 失败提示使用页面自己的双语 i18n 文案，不展示后端异常原文、响应体或凭据相关信息。
4. 保持现有导出 API、筛选参数、文件名和下载数据不变。
5. 保留运营报表自定义日期范围的业务禁用条件，并与导出请求忙碌状态叠加。

## 非目标

- 不修改任何后端导出接口、分页上限、CSV 格式或租户授权逻辑。
- 不在 Axios 全局拦截器中把所有 HTTP 错误识别为导出错误。
- 不新增成功 Toast；浏览器开始下载本身已是成功反馈，避免重复打扰用户。
- 不把导出任务改造成后台异步任务或新增下载中心。

## 方案

新增 `frontend/src/components/ui/ExportButton.tsx`，封装导出按钮的纯 UI 和异步状态边界。组件接收导出函数、正常/忙碌文案、失败文案，以及现有按钮所需的 `variant`、`size`、`className`、`title` 和额外 `disabled` 条件。内部使用状态显示忙碌态，并使用 `useRef` 作为单飞闸门，防止同一渲染周期内的重复点击绕过按钮禁用；导出 Promise 无论成功或失败都在 `finally` 中恢复按钮。

核心接口固定为：

```tsx
interface ExportButtonProps {
  onExport: () => Promise<void>;
  label: ReactNode;
  exportingLabel: ReactNode;
  errorMessage: string;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
  className?: string;
  title?: string;
}
```

点击流程为：检查外部 `disabled` 和单飞闸门 → 设置 `isExporting` 并通知可选的 `onBusyChange(true)` → `await onExport()` → 捕获异常并调用 `toast.error(errorMessage)` → 在 `finally` 清除闸门、通知 `onBusyChange(false)` 并恢复忙碌状态。忙碌时渲染 `Loader2` 旋转图标、`exportingLabel`、`disabled=true` 和 `aria-busy=true`；其他时间渲染 `Download` 图标和正常文案。

五个页面只保留各自的筛选参数和导出函数：

| 页面 | 导出函数 | 新增失败/忙碌文案 |
|------|----------|------------------|
| 设备列表 | `exportDevicesCsv` | `device.exportFailed` / `device.exporting` |
| 告警中心 | 页面内 `exportAlertsCsv` | `alert.exportFailed` / `alert.exporting` |
| 工单列表 | `exportWorkOrdersCsv` | `workorder.exportFailed` / `workorder.exporting` |
| 审计日志 | `exportAuditLogsCsv` | 复用现有 `audit.exportFailed` / `audit.exporting` |
| 运营报表 | `downloadCurrentMonthReport`、`downloadOperationsReport` | 复用现有 `reports.exportFailed` / `reports.exporting`，通过 `onBusyChange` 保持两个按钮的组级禁用 |

## 错误处理和安全边界

组件只接收已经本地化的失败文案，不读取或渲染异常对象。导出函数自身继续负责 HTTP 响应和 Blob 下载；如果请求失败、下载转换失败或浏览器 API 抛错，均由组件显示统一的可操作提示并恢复按钮。外部 `disabled` 条件只阻止新的请求，不会改变正在执行请求的清理逻辑。

## 测试策略

- 新增 `ExportButton` 组件测试：成功请求恢复按钮、失败请求显示指定 Toast、请求进行中按钮禁用并设置 `aria-busy`、快速重复点击只调用一次导出函数。
- 保留审计日志和运营报表现有失败回归，改为通过共享组件验证真实页面行为。
- 对设备、告警、工单页面至少运行类型检查和现有页面/Hook 测试；新增的双语键通过 `check:i18n` 验证。
- 运行前端全量 Vitest、覆盖率、TypeScript、严格 ESLint、i18n 和生产构建。

## 验收标准

- 五个导出入口都使用共享 `ExportButton`，不再存在导出失败静默路径。
- 任一导出 Promise 未完成时对应按钮禁用并设置 `aria-busy=true`，同一按钮最多发起一个请求。
- 导出失败只显示双语业务提示，按钮最终恢复可用。
- 现有导出 API 调用参数和日期范围禁用语义不变。
- 前端全量门禁和差异检查通过，未修改真实生产凭据或部署环境。
