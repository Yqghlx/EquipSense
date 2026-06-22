#!/usr/bin/env bash
# tests/migration-rollback-check.sh
#
# 数据库 migration 回滚安全性验证 — 数据安全底线测试
#
# 流程：
#   1. 启动临时 TimescaleDB 容器
#   2. apply all 21 个 migration（forward）
#   3. 验证 schema 完整（21 条 history 记录、核心表存在）
#   4. revert 到第一个 migration（reverse 20 个）
#   5. 验证回滚后的 schema 状态（剩 1 条 history、新增表已删除）
#   6. 再次 apply all（验证可重新应用，即 Down 后状态干净）
#   7. 关闭容器
#
# 用法：
#   ./tests/migration-rollback-check.sh
#
# 退出码：
#   0 — 全部通过
#   非 0 — 任一步骤失败
#
# 注：脚本需要 docker、dotnet ef 工具（dotnet tool install --global dotnet-ef）
set -euo pipefail

CONTAINER_NAME="equipai-migration-test"
PG_PASSWORD="migrationtest_pwd"
PG_PORT="55432"  # 用非默认端口避免与本地开发环境冲突

# ============================================================
# 工具函数
# ============================================================

log() {
    echo -e "\033[36m[$(date +%H:%M:%S)]\033[0m $*"
}

fail() {
    echo -e "\033[31m[FAIL]\033[0m $*" >&2
    cleanup
    exit 1
}

ok() {
    echo -e "\033[32m[OK]\033[0m $*"
}

cleanup() {
    log "清理容器 $CONTAINER_NAME ..."
    docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

# ============================================================
# 步骤 0：前置检查
# ============================================================

log "步骤 0：前置检查"

command -v docker >/dev/null || fail "docker 命令未找到，请先安装 Docker"
docker info >/dev/null 2>&1 || fail "docker daemon 未运行"

# dotnet ef 工具检查
if ! dotnet ef --version >/dev/null 2>&1; then
    fail "dotnet ef 工具未安装，请运行：dotnet tool install --global dotnet-ef"
fi

# 清理可能的残留容器
cleanup

# ============================================================
# 步骤 1：启动临时 TimescaleDB 容器
# ============================================================

log "步骤 1：启动 TimescaleDB 容器（端口 $PG_PORT）"

docker run -d \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_DB=equipai_migration_test \
    -e POSTGRES_PASSWORD="$PG_PASSWORD" \
    -p "$PG_PORT:5432" \
    timescale/timescaledb:latest-pg16 >/dev/null

# 等待 PG 就绪
log "等待 PG 就绪..."
for i in $(seq 1 30); do
    if docker exec "$CONTAINER_NAME" pg_isready -U postgres >/dev/null 2>&1; then
        ok "PG 已就绪"
        break
    fi
    sleep 1
    [ "$i" -eq 30 ] && fail "PG 启动超时（30s）"
done

CONN_STRING="Host=localhost;Port=$PG_PORT;Database=equipai_migration_test;Username=postgres;Password=$PG_PASSWORD"

# ============================================================
# 步骤 2：apply 所有 migration（forward）
# ============================================================

log "步骤 2：应用所有 migration（forward）"

cd "$(dirname "$0")/.."

dotnet ef database update \
    --project src/EquipAI.Infrastructure \
    --startup-project src/EquipAI.WebAPI \
    --connection "$CONN_STRING" \
    --no-build >/dev/null 2>&1 || fail "apply all 失败"

ok "forward apply 成功"

# ============================================================
# 步骤 3：验证 schema 完整
# ============================================================

log "步骤 3：验证 forward 后的 schema"

count_migrations() {
    docker exec "$CONTAINER_NAME" psql -U postgres -d equipai_migration_test -t -c \
        "SELECT COUNT(*) FROM __EFMigrationsHistory;" 2>/dev/null | tr -d '[:space:]'
}

count_tables() {
    # 不含 __EFMigrationsHistory 等系统表
    docker exec "$CONTAINER_NAME" psql -U postgres -d equipai_migration_test -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name NOT LIKE '\\_EF%';" 2>/dev/null | tr -d '[:space:]'
}

EXPECTED_MIGRATIONS=$(ls src/EquipAI.Infrastructure/Data/Migrations/2*.cs | grep -v Designer | wc -l | tr -d '[:space:]')
ACTUAL_MIGRATIONS=$(count_migrations)

[ "$ACTUAL_MIGRATIONS" = "$EXPECTED_MIGRATIONS" ] \
    && ok "migration 数量匹配（$ACTUAL_MIGRATIONS 条）" \
    || fail "migration 数量不匹配：期望 $EXPECTED_MIGRATIONS，实际 $ACTUAL_MIGRATIONS"

FORWARD_TABLES=$(count_tables)
log "forward 后业务表数量：$FORWARD_TABLES"

# 验证关键表存在
for table in tenants users devices alert_rules alerts work_orders; do
    exists=$(docker exec "$CONTAINER_NAME" psql -U postgres -d equipai_migration_test -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$table';" 2>/dev/null | tr -d '[:space:]')
    [ "$exists" = "1" ] || fail "关键表 $table 不存在"
done
ok "关键业务表全部存在"

# ============================================================
# 步骤 4：revert 到第一个 migration（reverse 20 个）
# ============================================================

log "步骤 4：回滚到 InitialCreate（reverse 20 个 migration）"

FIRST_MIGRATION=$(ls src/EquipAI.Infrastructure/Data/Migrations/2*.cs | grep -v Designer | sort | head -1 | grep -oE '^[^_]+' | sed 's|src/EquipAI.Infrastructure/Data/Migrations/||')
log "目标 migration：$FIRST_MIGRATION"

dotnet ef database update "$FIRST_MIGRATION" \
    --project src/EquipAI.Infrastructure \
    --startup-project src/EquipAI.WebAPI \
    --connection "$CONN_STRING" \
    --no-build >/dev/null 2>&1 || fail "回滚到 $FIRST_MIGRATION 失败"

ok "reverse 成功"

# ============================================================
# 步骤 5：验证回滚后 schema 状态
# ============================================================

log "步骤 5：验证回滚后的 schema"

REVERTED_MIGRATIONS=$(count_migrations)
[ "$REVERTED_MIGRATIONS" = "1" ] \
    && ok "回滚后 history 表剩 1 条" \
    || fail "回滚后 migration 数异常：$REVERTED_MIGRATIONS（应为 1）"

REVERT_TABLES=$(count_tables)
log "revert 后业务表数量：$REVERT_TABLES（forward 时为 $FORWARD_TABLES）"

# 回滚后表数量应严格小于 forward 后（InitialCreate 后还有几个核心表）
[ "$REVERT_TABLES" -lt "$FORWARD_TABLES" ] \
    && ok "回滚确实删了表（差异 $((FORWARD_TABLES - REVERT_TABLES))）" \
    || fail "回滚未删除任何表，Down 方法可能未正确实现"

# 验证后加入的表已删除（如 mfa 字段在 user 表中是否还在？）
# 用 mfa 相关检查：AddMfaFields 是较晚的 migration，revert 后 users 表不应有 TotpSecret 列
mfa_col_exists=$(docker exec "$CONTAINER_NAME" psql -U postgres -d equipai_migration_test -t -c \
    "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='users' AND column_name='totp_secret';" 2>/dev/null | tr -d '[:space:]')
[ "$mfa_col_exists" = "0" ] \
    && ok "MFA 字段（totp_secret）已正确回滚删除" \
    || fail "MFA 字段未删除，AddMfaFields 的 Down 方法有问题"

# ============================================================
# 步骤 6：再次 apply all（验证 Down 后状态干净）
# ============================================================

log "步骤 6：再次 forward apply（验证 Down 后状态可重复应用）"

dotnet ef database update \
    --project src/EquipAI.Infrastructure \
    --startup-project src/EquipAI.WebAPI \
    --connection "$CONN_STRING" \
    --no-build >/dev/null 2>&1 || fail "再次 apply 失败（Down 后状态可能不干净）"

ok "re-apply 成功"

REAPPLY_MIGRATIONS=$(count_migrations)
[ "$REAPPLY_MIGRATIONS" = "$EXPECTED_MIGRATIONS" ] \
    && ok "re-apply 后 migration 数量恢复（$REAPPLY_MIGRATIONS 条）" \
    || fail "re-apply 后 migration 数异常：$REAPPLY_MIGRATIONS"

REAPPLY_TABLES=$(count_tables)
[ "$REAPPLY_TABLES" = "$FORWARD_TABLES" ] \
    && ok "re-apply 后业务表数量恢复（$REAPPLY_TABLES）" \
    || fail "re-apply 后业务表数量异常：$REAPPLY_TABLES（forward 时为 $FORWARD_TABLES）"

# ============================================================
# 步骤 7：清理
# ============================================================

log "步骤 7：清理"
cleanup

echo ""
ok "=========================================================="
ok "所有 migration 回滚测试通过！"
ok "  - $EXPECTED_MIGRATIONS 个 migration 全部支持 forward + reverse"
ok "  - Down 方法实现正确（关键表/字段被正确删除）"
ok "  - Down 后状态干净，可重复 apply"
ok "=========================================================="
