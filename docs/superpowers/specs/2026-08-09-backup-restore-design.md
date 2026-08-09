# 备份校验与安全恢复设计

## 目标

将现有“能够生成备份”的能力补齐为“能够在受控条件下验证并恢复”的运维闭环，降低数据库或附件故障时的误操作风险，并让恢复结果可以被机器检查。

## 范围

- 新增 `docker/restore.sh`，支持 PostgreSQL custom `.dump` 备份、历史纯文本 `.sql.gz` 备份、工单附件归档和可选 Redis RDB。
- 默认执行 dry-run；任何会修改数据库、附件卷或 Redis 的动作都必须显式传入 `--confirm`。
- 恢复前校验备份文件存在、权限不过宽、custom/gzip/tar 可读、Redis RDB 文件头有效，拒绝附件归档中的路径穿越和符号链接，并校验目标 Compose 配置和容器状态满足要求。
- 数据库恢复在停后端后执行，先终止目标数据库连接并重建数据库，再执行 TimescaleDB `pre_restore`；新 custom 备份使用禁止并行的 `pg_restore`，历史 gzip 备份使用 `ON_ERROR_STOP` 导入，恢复成功或失败后均尝试 `post_restore`，避免将备份内容追加到旧数据或让数据库停留在恢复模式。
- 恢复后检查数据库连接、后端健康接口和附件目录；Redis 只作为可选缓存恢复，失败不能被当作业务数据恢复成功。
- Redis 恢复会清理旧 AOF、修正 RDB 文件属主后再启动，避免 `appendonly yes` 配置忽略 RDB 或因权限导致启动失败。

## 安全边界

1. 脚本不读取或打印密码、JWT、TOTP 密钥等敏感值；数据库密码通过 Compose 容器环境传递。
2. 目标数据库由 Compose 的 `POSTGRES_DB` 确定，备份文件和 Compose 文件必须由调用者明确指定或使用脚本默认的基础文件，避免在错误目录恢复；生产镜像部署可重复传入基础 Compose 与生产覆盖文件。
3. 没有 `--confirm` 时不执行 `stop`、schema 清理、数据导入、附件覆盖或 Redis 重启。
4. 附件归档先校验路径段和文件类型，再在临时目录解压；拒绝绝对路径、`..` 路径段、符号链接及特殊文件，临时目录使用 `mktemp` 并在退出时清理。
5. 恢复失败返回非零，并保留错误上下文；不自动删除原备份，也不自动回滚已经执行的数据库恢复。

## 运行方式

```bash
# 只检查文件和恢复计划，不改变任何服务或数据
./docker/restore.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --db-backup docker/backups/equipai_YYYYMMDD_HHMMSS.dump \
  --attachments-backup docker/backups/attachments_YYYYMMDD_HHMMSS.tar.gz

# 明确确认后执行恢复
./docker/restore.sh \
  --env-file docker/.env \
  --compose-file docker/docker-compose.yml \
  --compose-file docker/docker-compose.prod.yml \
  --db-backup docker/backups/equipai_YYYYMMDD_HHMMSS.dump \
  --attachments-backup docker/backups/attachments_YYYYMMDD_HHMMSS.tar.gz \
  --confirm
```

## 测试策略

- `bash -n` 检查脚本语法。
- 使用临时目录和假的 `docker` 可执行文件覆盖：默认 dry-run 不调用 Docker、损坏 custom/gzip/tar/RDB 和不安全附件归档被拒绝、确认路径使用 TimescaleDB pre/post restore 生命周期、禁止并行 pg_restore、一次性任务容器清理已停止后端共享的附件卷并处理 Redis AOF/权限、参数缺失失败关闭。
- 生产脚本回归测试纳入 CI。
- 真正的生产恢复仍需在隔离数据库和临时附件卷上按 `OPS_RUNBOOK.md` 完成现场演练，并记录 RTO/RPO。
