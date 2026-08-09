# EquipSense 等保 2.0 合规报告

> 版本：v1.2
> 日期：2026-08-09
> 适用范围：EquipSense 工业设备智能监控与预测维护平台

## 一、系统概述

EquipSense 是面向工业企业的设备监控与预测维护 SaaS 平台，核心功能包括：
- 设备实时遥测采集（MQTT/OPC UA/Modbus）
- 三级告警引擎 + AI 根因分析
- 工单全流程管理
- 知识库沉淀
- 多租户隔离

## 二、安全控制措施

### 2.1 身份与访问控制

| 控制项 | 实现 | 状态 |
|--------|------|------|
| 用户身份鉴别 | JWT + bcrypt 密码哈希 | ✅ 已实现 |
| 多因素认证（MFA） | TOTP 设置/确认/禁用 + Redis 一次性登录挑战 + 8 个一次性恢复码；生产强制 SystemAdmin/MaintenanceLead 首次注册 | ✅ 已实现 |
| 账号锁定策略 | 连续失败 5 次锁定 15 分钟 | ✅ 已实现 |
| 密码重置 | 邮箱重置链接，token 30 分钟过期，一次性使用 | ✅ 已实现 |
| 角色权限分离 | RBAC 5 角色（系统管理员/维保主管/技术员/操作员/观察者） | ✅ 已实现 |
| 权限拦截 | 每个 API 端点标注 [RequirePermission]，中间件强制校验 | ✅ 已实现 |

### 2.2 数据传输安全

| 控制项 | 实现 | 状态 |
|--------|------|------|
| 传输加密 | HTTPS (TLS 1.2+)，Nginx 终止 TLS | ✅ 已实现 |
| 双向认证（mTLS） | 边缘网关与后端之间，Kestrel RequireCertificate | ✅ Phase 4 新增 |
| 证书管理 | 自签名 CA + 脚本生成，生产环境应替换为 CA 签发证书 | ✅ 已实现 |

### 2.3 应用层安全

| 控制项 | 实现 | 状态 |
|--------|------|------|
| 输入校验 | ASP.NET Data Annotations + Zod（前端） | ✅ 已实现 |
| XSS 防护 | InputSanitizationMiddleware（script 标签/事件处理器/js 协议） | ✅ 已实现 |
| WAF | WafMiddleware（SQL 注入/路径遍历/命令注入/XSS） | ✅ Phase 4 新增 |
| 速率限制 | 全局 60/min，认证端点 10/min | ✅ 已实现 |
| 安全响应头 | SecurityHeadersMiddleware（X-Content-Type-Options/X-Frame-Options/Referrer-Policy） | ✅ 已实现 |

### 2.4 数据安全

| 控制项 | 实现 | 状态 |
|--------|------|------|
| 数据库访问 | EF Core 参数化查询（防 SQL 注入） | ✅ 已实现 |
| 多租户隔离 | 全局查询过滤器（TenantId），纵深防御中间件链 | ✅ 已实现 |
| 敏感字段加密 | 密码 bcrypt 哈希；TOTP 密钥使用 AES-256-GCM 加密；手机号/邮箱等 PII 仍依赖数据库层 TDE | ⚠️ 部分 |
| 数据备份 | `docker/backup.sh` 以 PostgreSQL custom format 导出数据库、附件和可选 Redis，逐文件校验并支持 S3/OSS 异地同步；`docker/restore.sh` 兼容历史 gzip 备份，使用 TimescaleDB pre/post restore、dry-run、危险归档拒绝、受控重建数据库和恢复后健康检查 | ✅ 已实现（需配置定时任务、异地目标和隔离恢复演练） |

### 2.5 安全审计

| 控制项 | 实现 | 状态 |
|--------|------|------|
| 操作审计 | AuditActionFilter 全局拦截所有增删改，记录用户/IP/路径/动作/资源 | ✅ 已实现 |
| 审计日志存储 | audit_logs 表，租户隔离 | ✅ 已实现 |
| 审计日志导出 | CSV 导出（UTF-8 BOM） | ✅ 已实现 |
| 告警通知审计 | 站内通知 + 钉钉/飞书推送日志 | ✅ 已实现 |

### 2.6 边缘安全

| 控制项 | 实现 | 状态 |
|--------|------|------|
| 边缘网关认证 | mTLS 双向证书 | ✅ Phase 4 新增 |
| 断网保护 | SQLite 本地缓存，网络恢复后重传 | ✅ 已实现 |
| 协议适配 | OPC UA/Modbus TCP/RTU，官方 SDK | ✅ 已实现 |

## 三、等保 2.0 合规差距

### 已满足（三级要求）

- [x] 身份鉴别（JWT + 密码策略 + 账号锁定）
- [x] 访问控制（RBAC + 权限拦截）
- [x] 安全审计（全局审计日志）
- [x] 通信保密性（HTTPS + mTLS）
- [x] 完整性保护（输入校验 + WAF）

### 待完善

- [x] **MFA 强制与恢复** — 生产配置强制 SystemAdmin/MaintenanceLead 完成 TOTP enrollment；未完成前不颁发 JWT，刷新令牌和禁用操作也会被拦截；恢复码单次消费并留痕
- [ ] **敏感字段加密** — 除密码外，手机号/邮箱等 PII 字段未加密存储
- [ ] **备份运营闭环** — 备份与受控恢复脚本及 CI 回归已实现，仍需生产配置定时任务、异地目标和定期隔离恢复演练
- [ ] **WAF 规则更新机制** — 当前规则静态编译，未实现动态规则更新

## 四、部署安全清单

以下是实际环境验收项，不因代码中已有校验器而自动视为完成。2026-08-10 当前部署检查仍有 26 个生产门禁问题（23 个配置问题和 3 个 TLS/MQTT 运行时证书问题，包含重复键和非 Production 环境），因此凭据与证书相关项保持未勾选：

- [ ] `JWT_SECRET` ≥ 32 字符随机字符串并由密钥管理系统注入
- [ ] PG/Redis/RabbitMQ/MQTT/Seq/Grafana 与种子账户使用独立强密码
- [ ] `TOTP_ENCRYPTION_KEY` 已安全保存并验证备份/轮换方案
- [ ] `AUTOMAPPER_LICENSE_KEY` 已完成许可证审核并注入真实供应商密钥
- [ ] 正式 TLS 与 MQTT CA/服务端证书已挂载，域名和 SAN 已验收
- [x] 环境变量不硬编码，缺失/占位/弱值会被部署与应用启动门禁拒绝
- [x] 生产环境关闭 Swagger
- [x] 日志不记录敏感信息（密码/token/许可证密钥）
- [ ] `bash docker/validate-env.sh docker/.env --check-runtime-files` 以 0 退出

## 五、结论

EquipSense 已在代码层实现等保 2.0 三级要求的核心安全控制（身份鉴别/访问控制/安全审计/通信保密/完整性保护），并提供高权限 TOTP enrollment、一次性 MFA 恢复码与数据库/附件备份能力。当前部署环境尚未通过生产配置门禁，不能据此报告直接宣称实际部署已合规。剩余差距包括生产凭据与证书注入、AutoMapper 许可证、敏感字段加密、备份定时化，以及 MFA/备份恢复演练；这些必须在正式生产验收中完成。

**建议**：
1. 生产部署前验证高权限账号完成 MFA enrollment，安全保存恢复码并完成恢复演练
2. 配置 `docker/backup.sh` 定时备份、异地同步，并使用 `docker/restore.sh` 完成隔离恢复演练
3. 定期更新 WAF 规则库
