# 工单附件 S3 兼容存储设计

## 背景

当前工单附件使用本地文件系统。Docker 单机部署通过 `attachments_data` 命名卷保证容器重建不丢数据，但跨主机、多副本和 Kubernetes 部署不能依赖同一台主机上的卷。备份脚本可以归档附件，却不能解决运行时的共享读写问题。

## 目标

- 保持现有本地存储行为和单机部署零配置兼容。
- 增加可选的 AWS S3 及 S3 兼容对象存储（如企业 MinIO、OSS S3 网关）后端。
- 复用 `IFileStorageService`，不改变工单附件控制器、数据库记录和补偿删除流程。
- 保证对象键不允许路径穿越，始终以租户 ID 和文件分类隔离。
- S3 配置错误在生产启动阶段 fail-closed，不让服务启动后才在首次上传时失败。

## 非目标

- 不在生产 Compose 中内置或自动启动 MinIO。
- 不改变附件数据库模型和现有 API 响应格式。
- 不把对象存储凭据写入镜像、仓库或日志。
- 不在本次改动中改变备份脚本的 S3 异地同步能力。

## 设计

### 配置

通过 `FileStorage` 配置节选择实现：

```text
FileStorage__Provider=Local|S3
FileStorage__BasePath=/app/uploads
FileStorage__S3__BucketName=equipsense-attachments
FileStorage__S3__Region=cn-shanghai
FileStorage__S3__Endpoint=https://s3.example.com
FileStorage__S3__AccessKey=由密钥管理系统注入
FileStorage__S3__SecretKey=由密钥管理系统注入
FileStorage__S3__UsePathStyle=true
FileStorage__S3__KeyPrefix=attachments
```

`Provider` 缺省为 `Local`。S3 的 `Endpoint` 允许为空，以使用 AWS SDK 的标准 AWS S3 端点；配置自定义端点时生产环境必须使用 HTTPS，并且必须同时提供访问密钥和密钥。`KeyPrefix` 只允许安全的相对路径片段。

### 对象键

服务对外仍返回相对存储路径：

```text
{tenantId}/{category}/{sanitizedName}_{guid}.{extension}
```

S3 实际对象键为 `KeyPrefix + "/" + storagePath`。读取、删除和存在性检查都会拒绝绝对路径、反斜杠、`.`、`..` 和空路径片段，避免把附件接口变成任意对象访问器。

### 生命周期与失败处理

- S3 客户端作为 Singleton 复用连接池；文件存储服务按请求 Scoped 注册。
- `SaveAsync` 使用 `PutObjectAsync`，保留扩展名和 MIME 类型校验，最大文件大小仍为 20 MiB。
- `GetAsync` 使用 `GetObjectAsync`，将对象响应流交给调用方；调用方释放响应流后，SDK 响应资源一并释放。
- `ExistsAsync` 使用对象元数据请求；对象不存在返回 `false`，网络、权限和其他服务端错误继续抛出。
- `DeleteAsync` 使用幂等删除。控制器在数据库写入失败时继续执行补偿删除，因此不会把孤儿对象当作正常结果吞掉。
- 不提供本地与 S3 双写，避免两个后端之间出现无法定义的一致性状态；切换 Provider 前必须按部署文档完成附件迁移和恢复演练。

### 依赖注入

`AddInfrastructure` 根据已校验的 Provider 注册唯一一个 `IFileStorageService`：

- `Local` → `LocalFileStorageService`
- `S3` → `S3FileStorageService` + 一个共享的 `IAmazonS3`

未知 Provider 或 S3 必填配置缺失直接抛出 `InvalidOperationException`。

## 测试策略

- 配置验证：默认 Local、未知 Provider、生产 S3 缺失配置、自定义 HTTP 端点和有效 HTTPS 配置。
- S3 适配器：验证租户键、分类和文件名净化、MIME 类型、上传请求、下载元数据、对象不存在和存在性查询错误处理。
- 回归：保留现有本地存储路径穿越、上传中断清理和附件控制器补偿测试。
- 不连接真实云服务；通过 `IAmazonS3` mock 覆盖 SDK 边界，真实 S3/MinIO 连接作为部署环境的恢复演练验收项。

## 运维约束

启用 S3 后，生产环境仍需单独配置对象存储生命周期、版本保护、服务账号最小权限、跨区域/异地备份和恢复演练。`attachments_data` 卷不再是 S3 模式的运行时数据源，但不能在确认迁移和备份完成前删除。
