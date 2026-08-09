# TimescaleDB 备份与恢复可靠性设计

## 背景

当前 `docker/backup.sh` 使用纯文本 `pg_dump` 并通过 gzip 保存，`docker/restore.sh` 直接把 SQL 导入目标数据库。真实恢复演练发现：在全新数据库中导入 TimescaleDB 内部 hypertable chunk 时，会出现 `could not find hypertable with id 1`。根因是恢复流程没有进入 TimescaleDB 的恢复模式，也没有使用官方推荐的 custom-format `pg_restore` 顺序。

## 目标

1. 新生成的 PostgreSQL 备份必须能够在同版本 TimescaleDB 的全新数据库中恢复。
2. 恢复前必须执行 `timescaledb_pre_restore()`，恢复成功或失败后都必须尝试执行 `timescaledb_post_restore()`，避免数据库长期停留在恢复模式。
3. 新备份使用 PostgreSQL custom format，利用 `pg_restore` 的对象依赖顺序，且不启用并行恢复。
4. 兼容已经生成的纯文本 `.sql.gz` 备份，并对其使用同样的 TimescaleDB pre/post restore 流程。
5. dry-run 仍然完全不调用 Docker、不停止服务、不修改数据库；只确认文件权限和备份格式。
6. 备份与恢复日志不输出数据库内容、密码或其他凭据。

## 方案选择

### 方案 A：只在现有纯文本恢复前后增加 TimescaleDB 函数

实现改动小，也能修复已验证的导入错误，但新备份仍依赖纯文本 SQL 的线性顺序，无法利用 `pg_restore` 的依赖排序和格式校验。作为兼容旧备份的路径保留，不作为新格式。

### 方案 B：新备份使用 custom format，恢复兼容旧格式（采用）

`backup.sh` 生成 `.dump` 文件，使用 `pg_dump --format=custom --no-owner --no-privileges`，并用容器内的 `pg_restore --list` 校验。`restore.sh` 根据文件头识别 `PGDMP` custom format 或 gzip 旧格式：前者走 `pg_restore`，后者走解压后的 `psql`。两条路径都包在 TimescaleDB pre/post restore 生命周期中。

该方案同时满足新部署的可靠恢复和已有备份的迁移需求，且不要求立即重做所有历史备份。

### 方案 C：改用物理备份或 pgBackRest

物理备份更适合大规模数据库和 PITR，但需要 WAL 归档、对象存储、恢复实例和额外运维配置，超出本次修复的范围。后续容量和 RPO 提升时再单独建设。

## 详细设计

### 备份格式

- 文件名：`<数据库名>_<时间戳>.dump`。
- 生成：`pg_dump --format=custom --no-owner --no-privileges`，通过标准输出写入备份文件。
- custom format 自带压缩，不再额外套 gzip。
- 生成后通过容器内 `pg_restore --list -` 校验文件结构。
- 备份目录权限为 `700`，备份文件权限为 `600`。
- 工单附件和 Redis 备份格式保持不变。

### 恢复格式识别

- 文件前五字节为 `PGDMP`：识别为 custom format，使用 `pg_restore`。
- 否则通过 `gzip -t` 校验；gzip 文件作为旧纯文本备份，使用 `gzip -dc | psql`。
- 其他格式在恢复前失败，不调用 Docker。

### TimescaleDB 恢复生命周期

确认执行恢复时按以下顺序：

1. 停止后端写入，必要时停止 Redis。
2. 重建目标数据库，清理旧的 TimescaleDB 内部 schema 和 chunk 元数据。
3. 在新数据库中确保 `timescaledb` 扩展存在。
4. 执行 `SELECT timescaledb_pre_restore()`。
5. custom format 使用 `pg_restore --exit-on-error --no-owner --no-privileges -U ...`；禁止 `-j` 并行恢复。
6. 旧 gzip 格式使用 `psql -v ON_ERROR_STOP=1` 导入。
7. 无论导入成功还是失败，只要 pre-restore 成功，就尝试执行 `SELECT timescaledb_post_restore()`；若恢复失败仍保留原始失败状态，若 post-restore 失败则将整体标记为失败。
8. 恢复成功后执行 `ANALYZE`，再启动后端并进行数据库、附件和 HTTP 健康检查。

### 安全与失败行为

- dry-run 不执行任何 Docker 命令。
- `--confirm` 仍是唯一允许停止服务和重建数据库的开关。
- 目标数据库名继续禁止为维护库 `postgres`。
- 恢复临时文件继承 `umask 077`，退出时清理。
- 恢复日志只输出阶段、状态和文件路径，不输出备份内容。
- pre-restore 后发生错误时，必须优先退出恢复模式，再返回错误，避免下次启动持续处于 TimescaleDB restoring 状态。

## 测试策略

1. Shell 合同测试：验证 custom dump 命令、`.dump` 文件、custom 格式校验、旧 `.sql.gz` dry-run 兼容、pre/post restore 命令和失败清理路径。
2. 现有生产脚本测试全部通过，保留附件、Redis、权限、损坏文件和 dry-run 安全测试。
3. 使用当前 Docker 中的 TimescaleDB 创建一次性临时数据库，分别验证新 custom dump 与旧 gzip dump 的真实恢复；验证后立即删除临时数据库。
4. 运行 `bash -n`、`git diff --check`，并执行后端/前端既有回归测试，确保脚本修复不影响应用。

## 发布与回滚

- 发布后新备份将产生 `.dump` 文件；历史 `.sql.gz` 仍可恢复。
- 如果部署后发现恢复流程异常，可回滚脚本版本；不会自动触碰业务数据库。
- 任何真实生产恢复必须先在隔离数据库完成恢复演练，再显式使用 `--confirm`。
