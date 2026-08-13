# 告警邮件可靠投递设计

> 设计日期：2026-08-13
> 状态：实现基线

## 目标

让用户在设置页开启“告警邮件”后，告警能够可靠投递到用户邮箱；SMTP 暂时不可用、网络抖动或应用重启不能阻塞告警主链，也不能静默丢失投递任务。

## 现状与问题

- `NotificationPreferences` 已有 `email` 字段，但 `NotificationPreferenceService.Normalize` 会把所有邮件开关强制改为 `false`。
- 前端显示邮件渠道，但开关始终禁用，用户无法获得有效的告警邮件能力。
- `SmtpEmailNotificationService` 当前只服务密码重置，并吞掉发送异常，不能给可靠投递队列反馈结果。
- `AlertNotificationService` 只写站内通知并推送钉钉/飞书，没有邮件投递任务。

## 范围与非目标

### 本次范围

- 开放 `alert.email` 偏好；`workorder.email` 和 `system.email` 继续关闭并在界面明确标记为暂未支持。
- 告警站内通知写入时，为已启用告警邮件的活动运维用户创建邮件投递任务。
- 新增数据库持久化投递队列、租约抢占、有限重试、指数退避、最终失败状态和清理策略。
- SMTP 发送结果可被队列消费；取消信号继续传播，普通发送失败转换为可重试结果。
- 邮件正文使用 HTML 转义，日志不记录邮箱地址、邮件正文或 SMTP 凭据。
- 增加后端单元测试、集成测试、前端偏好测试、生产脚本契约和配置文档。

### 非目标

- 本次不实现工单邮件和系统邮件；它们需要各自的模板、收件人策略和事件来源。
- 本次不引入第三方邮件 SDK 或供应商 API，继续使用现有 SMTP 配置。
- 本次不把邮件发送放进 RabbitMQ 事件处理器的同步路径。
- 本次不修改真实 `docker/.env`，真实 SMTP 凭据仍由部署方通过密钥管理系统注入。

## 方案选择

### 方案 A：告警处理器内直接发送 SMTP

改动少，但 SMTP 超时会延长消息处理，发送失败容易随事件重试造成重复站内通知/机器人推送；应用重启期间也可能丢失待发送邮件。放弃。

### 方案 B：数据库持久化邮件队列（采用）

告警事务同时写入站内通知和邮件任务，独立后台 worker 按租约领取并发送。该方案复用现有 EF Core、多租户和租约更新模式，SMTP 故障只影响邮件队列，不影响告警状态、站内通知和 RabbitMQ 确认。

### 方案 C：外部邮件服务异步 API

可靠性和可观测性更强，但需要新增供应商 SDK、凭据生命周期和网络出站策略，超出当前产品的最小生产闭环。本次保留后续替换 SMTP 适配器的接口边界。

## 架构设计

### 数据模型

新增 `email_notification_deliveries` 表，对应 `EmailNotificationDelivery` 实体：

- `id`：UUID 主键。
- `tenant_id`、`user_id`、`notification_id`：显式租户和收件人绑定；`notification_id` 唯一，保证同一站内通知最多生成一条告警邮件任务。
- `status`：`Pending`、`Sent`、`Cancelled`、`DeadLetter`。
- `attempt_count`、`available_at`、`locked_until`、`lock_token`：租约与退避字段。
- `sent_at`、`last_error`、`created_at`：审计和运维排障字段。

不在队列表中复制邮箱地址或邮件正文：worker 通过 `notification_id` 和 `user_id` 读取当前用户邮箱及通知内容。邮箱继续使用现有 PII 加密转换，任务表不新增明文 PII。

### 告警写入流程

1. `AlertNotificationService` 查询租户内活动运维用户及其通知偏好。
2. 为所有运维用户创建站内 `Notification`；只为 `alert.email=true` 的用户创建 `EmailNotificationDelivery`。
3. 两类实体在同一次 `SaveChangesAsync` 中提交；任一写入失败，整个告警通知写入失败并交由上游重试。
4. 邮件任务不触发同步 SMTP 调用。

### Worker 流程

1. `EmailNotificationDispatcher` 按 `available_at` 批量查询待处理任务。
2. 使用带 `lock_token` 的条件更新领取租约，防止多实例重复发送。
3. 重新检查用户仍处于活动状态、邮箱非空且 `alert.email` 仍开启；不满足则标记 `Cancelled`。
4. 通过 `SmtpEmailNotificationService` 发送 HTML 邮件。
5. 成功标记 `Sent`；普通失败按配置退避；达到最大次数标记 `DeadLetter` 并记录截断后的错误摘要；宿主取消立即传播，不写成普通失败。
6. 定期清理超过保留期的 `Sent`、`Cancelled` 和 `DeadLetter` 任务，避免队列无限增长。

### 邮件内容

邮件主题使用站内通知标题；正文包含告警级别、设备友好标识、指标、当前值、告警编码、触发时间和站内链接。设备名、指标名、链接等动态文本在 HTML 输出前统一转义。

### 配置

新增 `EmailDelivery` 选项：`Enabled`、`PollIntervalSeconds`、`BatchSize`、`LeaseSeconds`、`MaxAttempts`、`MaxBackoffSeconds`、`RetentionDays`。SMTP 未配置时 worker 不领取任务，只记录一次受控警告并等待配置恢复；这样不会消耗重试次数，也不会把尚未配置误判为永久失败。

### 可观测性

新增邮件队列 pending、发送成功、发送失败和死信计数指标；结构化日志只包含租户、用户、通知和任务 UUID，不写邮箱地址、邮件正文和凭据。死信必须能通过任务 ID 在数据库中定位。

## 错误与安全边界

- `OperationCanceledException` 且令牌已取消时必须继续抛出，保证停机期间不确认未完成的上游处理。
- SMTP 普通异常、超时和非配置状态不得让告警主流程失败。
- 读取用户和通知时使用显式 `tenant_id`，后台 worker 不依赖请求上下文的租户过滤器。
- 邮件地址交给 `MailAddress` 校验；无效地址直接进入可审计的 `Cancelled` 或 `DeadLetter` 状态，不重试无意义输入。
- 所有 HTML 动态字段进行编码；日志严禁打印邮箱、正文和密码。

## 验证标准

- 偏好服务：告警邮件可保存/读取；工单和系统邮件始终关闭；活动用户、租户和坏 JSON 边界正确。
- 告警服务：按用户偏好为每条站内告警通知最多创建一条邮件任务；同一事务重试不重复创建同一任务；跨租户事件不泄露收件人或内容。
- Worker：成功、SMTP 未配置、普通异常重试、超过上限死信、租约竞争、用户停用/关闭偏好和取消传播均有测试。
- SMTP：成功返回、配置缺失、无效地址、超时和取消行为可验证。
- 前端：仅告警邮件开关可用，工单/系统邮件明确禁用；中英文资源一致，辅助技术能读取禁用原因。
- 发布门禁：Release 构建、全量后端测试、前端类型/Lint/Vitest/i18n、生产脚本契约均通过。
