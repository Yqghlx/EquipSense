# EquipSense API 面与接口契约专项分析报告

> 分析日期：2026-07-02（数据校正） · 范围：30 个 Controller · 156 端点 · 47 个 DTO/Request/Response 文件

---

## 一、API 设计规范总览

| 规范 | 标准 | 执行情况 |
|------|------|---------|
| 前缀 | `/api/v1/` | ✅ 全部 Controller Route 统一 |
| 分页 | `?page=1&pageSize=20&sort=created_at&order=desc` | ✅ 统一 `PagedResult<T>` |
| 认证 | JWT (Cookie 优先；SignalR QueryString 仅兼容回退；Header 默认处理) | ✅ 全局 [Authorize] |
| 错误响应 | `{code, message, details}` | ✅ ExceptionHandlingMiddleware 统一 |
| 审计过滤 | 全局 AuditActionFilter | ✅ |
| 缓存 | OutputCache: GET 30s 基线 | ⚠️ 部分端点 |

---

## 二、端点统计 (30 个 Controller)

| Controller | 端点数 | 代表路由 |
|-----------|--------|---------|
| AuthController | 8 | POST login/register/refresh/logout/MFA/密码重置 |
| DevicesController | 8 | CRUD + 导入/导出/健康度/基线 |
| WorkOrdersController | 17 | 全生命周期 + 统计/日志/审批/导出 |
| KnowledgeController | 19 | 规则 + 候选 + 案例 + 版本 + 冲突 + 导入/导出 |
| AlertsController | 6 | 列表/详情/确认/解决/导出 |
| AlertRulesController | 6 | CRUD (阈值/组合/基线) |
| TenantsController | 12 | CRUD + 套餐/冻结/统计/账单 |
| UsersController | 6 | CRUD + 角色变更 |
| GatewaysController | 5 | 注册/状态/配置 |
| ...其他 21 个 | ~50 | |
| **合计** | **~135** | |

### 2.1 工单端点 (最复杂)

| 方法 | 路由 | 用途 | 状态流转 |
|------|------|------|---------|
| GET | /work-orders | 分页列表 | — |
| GET | /work-orders/export | CSV 导出 | — |
| GET | /work-orders/statistics | 统计 | — |
| POST | /work-orders | 创建 | → PendingDispatch |
| GET | /work-orders/{id} | 详情 | — |
| PUT | /work-orders/{id}/assign | 派工 | → Assigned |
| PUT | /work-orders/{id}/start | 开始 | → InProgress |
| PUT | /work-orders/{id}/complete | 完成 | → Completed |
| PUT | /work-orders/{id}/accept | 验收 | → Accepted |
| PUT | /work-orders/{id}/reject | 驳回 | → Rejected |
| PUT | /work-orders/{id}/close | 关闭 | → Closed |
| PUT | /work-orders/{id}/cancel | 取消 | → Cancelled |
| POST | /work-orders/{id}/submit | 提交审批 | → SubmittedForApproval |
| POST | /work-orders/{id}/approve | 审批通过 | → Accepted |
| POST | /work-orders/{id}/reject-approval | 审批驳回 | → InProgress |
| GET | /work-orders/{id}/approvals | 审批记录 | — |
| GET | /work-orders/{id}/logs | 流转日志 | — |

### 2.2 知识库端点 (最复杂, 19 个)

| 方法 | 路由 | 用途 |
|------|------|------|
| GET | /knowledge/rules | 规则列表 |
| POST | /knowledge/rules | 创建规则 |
| GET | /knowledge/rules/{id} | 规则详情 |
| PUT | /knowledge/rules/{id} | 更新规则 |
| DELETE | /knowledge/rules/{id} | 删除规则 |
| POST | /knowledge/rules/import | CSV/JSON 导入 |
| GET | /knowledge/rules/export | CSV/JSON 导出 |
| GET | /knowledge/pending-rules | 候选规则列表 |
| POST | /knowledge/pending-rules/{id}/approve | 批准候选 |
| POST | /knowledge/pending-rules/{id}/reject | 驳回候选 |
| POST | /knowledge/pending-rules/batch-approve | 批量批准 |
| POST | /knowledge/pending-rules/batch-reject | 批量驳回 |
| GET | /knowledge/fault-cases | 故障案例 |
| POST | /knowledge/fault-cases | 创建案例 |
| GET | /knowledge/rules/{id}/versions | 版本历史 |
| POST | /knowledge/conflicts/check | 冲突检测 |

---

## 三、认证与授权覆盖

### 3.1 认证覆盖

```
41 个 [Authorize] 注解 (含 Controller 级别)
  └── 4 个 [AllowAnonymous]: 网关注册 · 推送订阅 · 批量评估 · 网关配置
```

### 3.2 RBAC 权限标注覆盖

```
123 个 [RequirePermission] 标注, 覆盖 34 个独立权限标识（RbacService 矩阵共定义 43 个）
分布最密集: DevicesController(12个) · WorkOrdersController(17个) · KnowledgeController(19个)
```

---

## 四、错误响应一致性

### 全局统一格式

```json
{
  "code": 409,
  "message": "操作冲突",
  "details": null
}
```

### 异常→状态码映射

| 异常类型 | 状态码 | 日志级别 |
|---------|--------|---------|
| UnauthorizedAccessException | 401 | Warning |
| KeyNotFoundException | 404 | Warning |
| InvalidOperationException | 409 | Warning |
| ArgumentException | 400 | Warning |
| 其他 | 500 | Error |

---

## 五、DTO 设计分析

### 5.1 DTO 规范

```
请求: Create{Entity}Request / Update{Entity}Request / AssignWorkOrderRequest
响应: {Entity}Dto / PagedResult<{Entity}>
枚举: 统一为 string (枚举.ToString())
主键: 统一为 Guid (string)
```

### 5.2 已知不对称问题 (已修复)

| #250 导入导出不对称 | `location/gateway_id/install_date/downtime_cost_per_hour` 导出缺失 |
| | 修复: 补全导出字段与导入对齐 |
| #250 工单导出 | `status/priority` 过滤导出抛翻译异常 |
| | 修复: 修复 LINQ 翻译 |

### 5.3 枚举序列化

```csharp
// Backend: 枚举以 ToString() 映射为字符串
// → WorkOrderStatus.PendingDispatch → "PendingDispatch"
// Frontend: 通过 types/index.ts 中的 string 类型消费

// AlertCenterPage 中展示:
status === 'active' → '告警中'
status === 'acknowledged' → '已确认'
status === 'resolved' → '已解决'
```

---

## 六、分页与排序规范

```csharp
// 统一: PagedResult<T> / PagedQuery
public class PagedResult<T>
{
    public List<T> Items { get; set; }
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

// 所有过滤参数以 URLSearchParams 构建
const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    // optional filters...
});
```

---

## 七、评估

| 维度 | 评分 | 说明 |
|------|------|------|
| RESTful 设计 | ⭐⭐⭐⭐☆ | 资源命名一致，动词在 URL 后（/close, /assign）而非 HTTP 方法上 |
| 认证授权覆盖 | ⭐⭐⭐⭐⭐ | 41 端 [Authorize] + 123 [RequirePermission] |
| 错误响应一致 | ⭐⭐⭐⭐⭐ | 统一 {code, message, details} + 异常映射 |
| DTO 设计 | ⭐⭐⭐⭐☆ | 规范统一，曾有不一致 (已修复) |
| API 版本 | ⭐⭐⭐☆☆ | 仅 URL 前缀 v1，无版本协商 |
| 文档 | ⭐⭐⭐⭐⭐ | Swagger UI 自动生成 + README API 概览表 |

---

## 关联报告

| 领域 | 报告 |
|------|------|
| 架构总览 | [S01-全系统架构总览图](./S01-全系统架构总览图.md) |
| 后端控制器 | [02-后端架构分析](./02-后端架构分析.md) |
| 认证安全 | [06-安全纵深分析](./06-安全纵深分析.md) |
| 前端类型 | [03-前端架构分析](./03-前端架构分析.md) |
| 测试覆盖 | [14-测试策略与金字塔分析](./14-测试策略与金字塔分析.md) |

---
*本文档属于 EquipSense 项目评估体系 · 生成日期：2026-06-24 · 版本：v3.1*
