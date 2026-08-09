#!/usr/bin/env bash
# 生产脚本回归测试：验证初始化失败保护和附件备份闭环。

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/equipsense-production-scripts.XXXXXX")"

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

fail() {
  echo "测试失败：$*" >&2
  exit 1
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  [[ "$haystack" == *"$needle"* ]] || fail "输出中缺少：$needle"
}

test_validate_env_accepts_complete_config() {
  local env_file="$TEST_ROOT/valid.env"
  printf '%s\n' \
    'PG_PASSWORD=postgres-password-long' \
    'REDIS_PASSWORD=redis-password-long' \
    'RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RABBITMQ_USER=equipai' \
    'RABBITMQ_PASSWORD=rabbitmq-password-long' \
    'JWT_SECRET=jwt-secret-that-is-longer-than-thirty-two-characters' \
    'TOTP_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=automapper-license-key-issued-for-test-only' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=mqtt-password-long' \
    'SEED_ADMIN_PASSWORD=admin-password-long' \
    'SEED_LEAD_PASSWORD=lead-password-long' \
    'SEED_TECH_PASSWORD=tech-password-long' \
    'SEED_OPERATOR_PASSWORD=operator-password-long' \
    'SEED_VIEWER_PASSWORD=viewer-password-long' \
    'FRONTEND_URL=https://example.com' \
    'SEQ_ADMIN_PASSWORD=seq-password-long' \
    'GRAFANA_PASSWORD=grafana-password-long' > "$env_file"
  chmod 600 "$env_file"

  bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" >/dev/null

  local placeholder_env_file="$TEST_ROOT/placeholder-license.env"
  sed 's/^AUTOMAPPER_LICENSE_KEY=.*/AUTOMAPPER_LICENSE_KEY=CHANGE_ME_AUTOMAPPER_LICENSE_KEY_1234567890/' \
    "$env_file" > "$placeholder_env_file"
  chmod 600 "$placeholder_env_file"
  local placeholder_output
  local placeholder_result_code
  set +e
  placeholder_output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$placeholder_env_file" 2>&1)"
  placeholder_result_code=$?
  set -e
  [[ "$placeholder_result_code" -ne 0 ]] || fail "AutoMapper 长占位许可证密钥不应通过生产环境校验"
  assert_contains "$placeholder_output" "AUTOMAPPER_LICENSE_KEY"

  chmod 644 "$env_file"
  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" 2>&1)"
  result_code=$?
  set -e
  [[ "$result_code" -ne 0 ]] || fail "权限为 644 的 .env 不应通过校验"
  assert_contains "$output" ".env 文件权限不安全"
}

test_validate_env_rejects_missing_automapper_license() {
  local env_file="$TEST_ROOT/missing-automapper-license.env"
  printf '%s\n' \
    'PG_PASSWORD=postgres-password-long' \
    'REDIS_PASSWORD=redis-password-long' \
    'RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RABBITMQ_USER=equipai' \
    'RABBITMQ_PASSWORD=rabbitmq-password-long' \
    'JWT_SECRET=jwt-secret-that-is-longer-than-thirty-two-characters' \
    'TOTP_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=mqtt-password-long' \
    'SEED_ADMIN_PASSWORD=admin-password-long' \
    'SEED_LEAD_PASSWORD=lead-password-long' \
    'SEED_TECH_PASSWORD=tech-password-long' \
    'SEED_OPERATOR_PASSWORD=operator-password-long' \
    'SEED_VIEWER_PASSWORD=viewer-password-long' \
    'FRONTEND_URL=https://example.com' \
    'SEQ_ADMIN_PASSWORD=seq-password-long' \
    'GRAFANA_PASSWORD=grafana-password-long' > "$env_file"
  chmod 600 "$env_file"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "缺少 AutoMapper 许可证密钥时生产环境校验不应通过"
  assert_contains "$output" "AUTOMAPPER_LICENSE_KEY"
}

test_validate_env_rejects_weak_production_config() {
  local env_file="$TEST_ROOT/weak.env"
  printf '%s\n' \
    'PG_PASSWORD=short' \
    'REDIS_PASSWORD=short' \
    'RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RABBITMQ_USER=equipai' \
    'RABBITMQ_PASSWORD=rabbitmq-password-long' \
    'JWT_SECRET=jwt-secret-that-is-longer-than-thirty-two-characters' \
    'TOTP_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=short' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=short' \
    'SEED_ADMIN_PASSWORD=short' \
    'SEED_LEAD_PASSWORD=lead-password-long' \
    'SEED_TECH_PASSWORD=tech-password-long' \
    'SEED_OPERATOR_PASSWORD=operator-password-long' \
    'SEED_VIEWER_PASSWORD=viewer-password-long' \
    'FRONTEND_URL=http://example.com' \
    'SEQ_ADMIN_PASSWORD=short' \
    'GRAFANA_PASSWORD=short' > "$env_file"
  chmod 600 "$env_file"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "弱密码或 HTTP 前端地址不应通过生产环境校验"
  assert_contains "$output" "PG_PASSWORD 长度不足"
  assert_contains "$output" "REDIS_PASSWORD 长度不足"
  assert_contains "$output" "MQTT_PASSWORD 长度不足"
  assert_contains "$output" "SEED_ADMIN_PASSWORD 长度不足"
  assert_contains "$output" "AUTOMAPPER_LICENSE_KEY 长度不足"
  assert_contains "$output" "FRONTEND_URL 必须使用 HTTPS"
  assert_contains "$output" "SEQ_ADMIN_PASSWORD 长度不足"
  assert_contains "$output" "GRAFANA_PASSWORD 长度不足"
}

test_validate_runtime_files_gate() {
  local case_dir="$TEST_ROOT/runtime-files"
  local env_file="$case_dir/.env"
  mkdir -p "$case_dir"
  cp "$PROJECT_ROOT/docker/validate-env.sh" "$case_dir/validate-env.sh"
  printf '%s\n' \
    'PG_PASSWORD=postgres-password-long' \
    'REDIS_PASSWORD=redis-password-long' \
    'RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RABBITMQ_USER=equipai' \
    'RABBITMQ_PASSWORD=rabbitmq-password-long' \
    'JWT_SECRET=jwt-secret-that-is-longer-than-thirty-two-characters' \
    'TOTP_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=automapper-license-key-issued-for-test-only' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=mqtt-password-long' \
    'SEED_ADMIN_PASSWORD=admin-password-long' \
    'SEED_LEAD_PASSWORD=lead-password-long' \
    'SEED_TECH_PASSWORD=tech-password-long' \
    'SEED_OPERATOR_PASSWORD=operator-password-long' \
    'SEED_VIEWER_PASSWORD=viewer-password-long' \
    'FRONTEND_URL=https://example.com' \
    'SEQ_ADMIN_PASSWORD=seq-password-long' \
    'GRAFANA_PASSWORD=grafana-password-long' > "$env_file"
  chmod 600 "$env_file"

  local output
  local result_code
  set +e
  output="$(bash "$case_dir/validate-env.sh" "$env_file" --check-runtime-files 2>&1)"
  result_code=$?
  set -e
  [[ "$result_code" -ne 0 ]] || fail "缺少生产 bind mount 文件时运行时门禁不应通过"
  assert_contains "$output" "运行时文件缺失"

  mkdir -p \
    "$case_dir/ssl" \
    "$case_dir/mqtt-certs" \
    "$case_dir/mosquitto_passwd" \
    "$case_dir/rabbitmq" \
    "$case_dir/prometheus" \
    "$case_dir/grafana/provisioning/datasources" \
    "$case_dir/grafana/provisioning/dashboards"
  touch \
    "$case_dir/ssl/cert.pem" \
    "$case_dir/ssl/key.pem" \
    "$case_dir/mqtt-certs/ca.crt" \
    "$case_dir/mqtt-certs/server.crt" \
    "$case_dir/mqtt-certs/server.key" \
    "$case_dir/mosquitto_passwd/passwd" \
    "$case_dir/mosquitto.prod.conf" \
    "$case_dir/rabbitmq/rabbitmq.conf" \
    "$case_dir/rabbitmq/definitions.json" \
    "$case_dir/rabbitmq/start.sh" \
    "$case_dir/prometheus.yml" \
    "$case_dir/prometheus/rules.yml" \
    "$case_dir/alertmanager.yml" \
    "$case_dir/grafana/provisioning/datasources/prometheus.yml" \
    "$case_dir/grafana/provisioning/dashboards/dashboard.yml"
  bash "$case_dir/validate-env.sh" "$env_file" --check-runtime-files >/dev/null
}

test_setup_rejects_new_placeholder_env() {
  local case_dir="$TEST_ROOT/setup"
  mkdir -p "$case_dir"
  cp "$PROJECT_ROOT/docker/setup.sh" "$case_dir/setup.sh"
  cp "$PROJECT_ROOT/docker/.env.example" "$case_dir/.env.example"

  # 新版 setup.sh 会在复制模板后调用验证器；测试复制验证器时兼容旧代码，
  # 这样当前版本会因为继续生成证书而失败，证明测试确实能捕获回归。
  if [[ -f "$PROJECT_ROOT/docker/validate-env.sh" ]]; then
    cp "$PROJECT_ROOT/docker/validate-env.sh" "$case_dir/validate-env.sh"
  fi

  local output
  local result_code
  set +e
  output="$(cd "$case_dir" && bash ./setup.sh 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "占位 .env 不应让 setup.sh 成功"
  [[ -f "$case_dir/.env" ]] || fail "setup.sh 应保留生成的 .env 模板供用户编辑"
  local env_mode
  if stat -c '%a' "$case_dir/.env" >/dev/null 2>&1; then
    env_mode="$(stat -c '%a' "$case_dir/.env")"
  else
    env_mode="$(stat -f '%Lp' "$case_dir/.env")"
  fi
  [[ "$env_mode" = "600" ]] || fail ".env 应以 600 权限保存，实际为 $env_mode"
  [[ ! -d "$case_dir/ssl" ]] || fail "凭据未通过时不应继续生成 TLS 文件"
  [[ ! -d "$case_dir/mqtt-certs" ]] || fail "凭据未通过时不应继续生成 MQTT 证书"
  assert_contains "$output" "必填环境变量 PG_PASSWORD"
}

test_backup_includes_attachments() {
  local case_dir="$TEST_ROOT/backup"
  local fake_attachment_root="$case_dir/fake-attachments"
  local backup_dir="$case_dir/backups"
  mkdir -p "$case_dir/bin" "$fake_attachment_root"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' '附件备份测试文件' > "$fake_attachment_root/report.txt"
  printf '%s\n' \
    'PG_PASSWORD=test-password' \
    'PG_CONTAINER=fake-postgres' \
    'ATTACHMENTS_CONTAINER=fake-postgres' \
    'BACKUP_REDIS=false' \
    'BACKUP_ATTACHMENTS=true' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  # 只模拟 Docker 的两个只读导出动作，压缩和归档仍使用真实工具，
  # 这样测试验证的是备份脚本产生的实际文件，而不是 mock 的调用次数。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\n" ;;' \
    '  exec)' \
    '    if [[ "$*" == *"pg_dump"* ]]; then printf "CREATE TABLE backup_test;\\n"; exit 0; fi' \
    '    if [[ "$*" == *"tar"* ]]; then tar -C "$FAKE_ATTACHMENTS_ROOT" -czf - .; exit 0; fi' \
    '    exit 1 ;;' \
    '  cp) cp -R "$FAKE_ATTACHMENTS_ROOT/." "$3" ;;' \
    '  *) exit 1 ;;' \
    'esac' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  if ! PATH="$case_dir/bin:$PATH" \
    FAKE_ATTACHMENTS_ROOT="$fake_attachment_root" \
    bash "$case_dir/backup.sh" > "$case_dir/backup.log" 2>&1; then
    cat "$case_dir/backup.log" >&2
    fail "备份脚本应在模拟数据源可用时成功完成"
  fi

  local sql_file
  local attachment_file
  sql_file="$(find "$backup_dir" -name '*.sql.gz' -print -quit)"
  attachment_file="$(find "$backup_dir" -name 'attachments_*.tar.gz' -print -quit)"
  [[ -n "$sql_file" ]] || fail "应生成 PostgreSQL 备份"
  [[ -n "$attachment_file" ]] || fail "应生成工单附件备份"
  gzip -t "$sql_file"
  tar -tzf "$attachment_file" | grep -q 'report.txt' || fail "附件归档中缺少测试文件"

  local backup_mode
  local file_mode
  if stat -c '%a' "$backup_dir" >/dev/null 2>&1; then
    backup_mode="$(stat -c '%a' "$backup_dir")"
    file_mode="$(stat -c '%a' "$sql_file")"
  else
    backup_mode="$(stat -f '%Lp' "$backup_dir")"
    file_mode="$(stat -f '%Lp' "$sql_file")"
  fi
  [[ "$backup_mode" = "700" ]] || fail "备份目录应为 700 权限，实际为 $backup_mode"
  [[ "$file_mode" = "600" ]] || fail "数据库备份文件应为 600 权限，实际为 $file_mode"
}

test_backup_rejects_missing_remote_target() {
  local case_dir="$TEST_ROOT/backup-remote"
  local backup_dir="$case_dir/backups"
  mkdir -p "$case_dir/bin"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' \
    'PG_PASSWORD=test-password-long' \
    'PG_CONTAINER=fake-postgres' \
    'BACKUP_REDIS=false' \
    'BACKUP_ATTACHMENTS=false' \
    'S3_SYNC=true' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  # 仅模拟 PostgreSQL 导出；测试重点是启用异地同步却未配置目标时必须失败。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\n" ;;' \
    '  exec) printf "CREATE TABLE backup_test;\\n" ;;' \
    '  *) exit 1 ;;' \
    'esac' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  local output
  local result_code
  set +e
  output="$(PATH="$case_dir/bin:$PATH" bash "$case_dir/backup.sh" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "启用 S3_SYNC 但未配置 S3_BUCKET 时备份不应返回成功"
  assert_contains "$output" "S3_BUCKET"
}

test_backup_rejects_requested_redis_failure() {
  local case_dir="$TEST_ROOT/backup-redis"
  local backup_dir="$case_dir/backups"
  mkdir -p "$case_dir/bin"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' \
    'PG_PASSWORD=test-password-long' \
    'PG_CONTAINER=fake-postgres' \
    'REDIS_PASSWORD=redis-password-long' \
    'BACKUP_REDIS=true' \
    'BACKUP_ATTACHMENTS=false' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  # PostgreSQL 成功、Redis BGSAVE 失败；显式启用 Redis 备份时整体结果必须失败。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\n" ;;' \
    '  exec)' \
    '    if [[ "$*" == *"pg_dump"* ]]; then printf "CREATE TABLE backup_test;\\n"; exit 0; fi' \
    '    if [[ "$*" == *"redis-cli"* ]]; then exit 1; fi' \
    '    exit 1 ;;' \
    '  *) exit 1 ;;' \
    'esac' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  local output
  local result_code
  set +e
  output="$(PATH="$case_dir/bin:$PATH" bash "$case_dir/backup.sh" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "显式启用 Redis 备份但快照失败时不应返回成功"
  assert_contains "$output" "Redis BGSAVE 失败"
}

create_restore_fixtures() {
  local case_dir="$1"
  local attachment_root="$case_dir/attachment-source"
  mkdir -p "$attachment_root"
  : > "$case_dir/.env"
  chmod 600 "$case_dir/.env"
  printf '%s\n' '恢复测试 SQL' | gzip > "$case_dir/database.sql.gz"
  printf '%s\n' '恢复测试附件' > "$attachment_root/report.txt"
  tar -C "$attachment_root" -czf "$case_dir/attachments.tar.gz" .
  chmod 600 "$case_dir/database.sql.gz" "$case_dir/attachments.tar.gz"
}

test_restore_dry_run_does_not_mutate_services() {
  local case_dir="$TEST_ROOT/restore-dry-run"
  mkdir -p "$case_dir/bin"
  create_restore_fixtures "$case_dir"

  # dry-run 不应调用 Docker；若调用则立即失败并留下可检查的标记。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'printf "docker-called\n" > "$RESTORE_DOCKER_CALLED"' \
    'exit 99' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  local output
  output="$(PATH="$case_dir/bin:$PATH" RESTORE_DOCKER_CALLED="$case_dir/docker-called" \
    bash "$PROJECT_ROOT/docker/restore.sh" \
      --env-file "$case_dir/.env" \
      --db-backup "$case_dir/database.sql.gz" \
      --attachments-backup "$case_dir/attachments.tar.gz" 2>&1)" \
    || fail "合法备份的 dry-run 应成功"

  assert_contains "$output" "dry-run"
  [[ ! -f "$case_dir/docker-called" ]] || fail "dry-run 不应调用 Docker 或修改服务"
}

test_restore_confirm_cleans_attachments_without_running_backend() {
  local case_dir="$TEST_ROOT/restore-confirm"
  local docker_log="$case_dir/docker.log"
  mkdir -p "$case_dir/bin"
  create_restore_fixtures "$case_dir"
  : > "$case_dir/compose.yml"
  : > "$case_dir/compose.prod.yml"
  printf 'REDIS0009' > "$case_dir/redis.rdb"
  chmod 600 "$case_dir/redis.rdb"

  # 模拟所有 Compose 动作；PostgreSQL exec 同时消费恢复输入并在连通性检查时返回 1。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'printf "%s\\n" "$*" >> "$RESTORE_DOCKER_LOG"' \
    'if [[ "${1:-}" = "inspect" ]]; then printf "true\\n"; exit 0; fi' \
    '[[ "${1:-}" = "compose" ]] || exit 1' \
    'if [[ "$*" == *" ps -q postgres"* ]]; then printf "fake-postgres\\n"; exit 0; fi' \
    'if [[ "$*" == *" exec -T postgres "* ]]; then cat >/dev/null; printf "1\\n"; exit 0; fi' \
    'exit 0' > "$case_dir/bin/docker"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'exit 0' > "$case_dir/bin/curl"
  chmod +x "$case_dir/bin/docker" "$case_dir/bin/curl"

  local output
  if ! output="$(PATH="$case_dir/bin:$PATH" RESTORE_DOCKER_LOG="$docker_log" \
    bash "$PROJECT_ROOT/docker/restore.sh" \
      --env-file "$case_dir/.env" \
      --compose-file "$case_dir/compose.yml" \
      --compose-file "$case_dir/compose.prod.yml" \
      --db-backup "$case_dir/database.sql.gz" \
      --attachments-backup "$case_dir/attachments.tar.gz" \
      --redis-backup "$case_dir/redis.rdb" \
      --confirm 2>&1)"; then
    printf '%s\n' "$output" >&2
    fail "合法备份的 confirm 恢复应成功完成模拟流程"
  fi

  assert_contains "$output" "恢复完成"
  grep -q 'compose.yml.*compose.prod.yml' "$docker_log" \
    || fail "确认恢复应同时传递基础 Compose 和生产覆盖文件"
  grep -q 'DROP DATABASE' "$docker_log" \
    || fail "恢复 PostgreSQL 前应重建目标数据库以清理 TimescaleDB 内部 schema"
  grep -q 'run --rm --no-deps --entrypoint /bin/sh backend' "$docker_log" \
    || fail "后端停止时应使用一次性任务容器清理共享附件卷"
  ! grep -q 'exec -T backend.*mkdir' "$docker_log" \
    || fail "后端停止时不应使用 exec 清理附件目录"
  grep -q 'run --rm --no-deps --user root --entrypoint /bin/sh redis' "$docker_log" \
    || fail "Redis 恢复应使用 root 一次性容器修正 RDB 权限并清理旧 AOF"
  grep -q 'appendonly' "$docker_log" \
    || fail "Redis 恢复应清理旧 AOF，确保 dump.rdb 会被加载"
}

test_restore_rejects_corrupted_archive() {
  local case_dir="$TEST_ROOT/restore-corrupt"
  mkdir -p "$case_dir"
  : > "$case_dir/.env"
  chmod 600 "$case_dir/.env"
  printf '%s\n' '不是 gzip' > "$case_dir/database.sql.gz"
  printf '%s\n' '占位附件' > "$case_dir/attachments.tar.gz"
  chmod 600 "$case_dir/database.sql.gz" "$case_dir/attachments.tar.gz"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/restore.sh" \
    --env-file "$case_dir/.env" \
    --db-backup "$case_dir/database.sql.gz" \
    --attachments-backup "$case_dir/attachments.tar.gz" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "损坏的 gzip 备份不应通过恢复前校验"
  assert_contains "$output" "gzip"
}

test_restore_rejects_unsafe_attachment_archive() {
  local case_dir="$TEST_ROOT/restore-unsafe-attachment"
  local attachment_root="$case_dir/attachment-source"
  mkdir -p "$attachment_root"
  : > "$case_dir/.env"
  : > "$case_dir/compose.yml"
  chmod 600 "$case_dir/.env"
  printf '%s\n' '恢复测试 SQL' | gzip > "$case_dir/database.sql.gz"
  ln -s /tmp "$attachment_root/outside-link"
  tar -C "$attachment_root" -czf "$case_dir/attachments.tar.gz" .
  chmod 600 "$case_dir/database.sql.gz" "$case_dir/attachments.tar.gz"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/restore.sh" \
    --env-file "$case_dir/.env" \
    --compose-file "$case_dir/compose.yml" \
    --db-backup "$case_dir/database.sql.gz" \
    --attachments-backup "$case_dir/attachments.tar.gz" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "包含符号链接的附件归档不应通过恢复前校验"
  assert_contains "$output" "不允许"
}

test_restore_rejects_corrupted_redis_backup() {
  local case_dir="$TEST_ROOT/restore-corrupt-redis"
  mkdir -p "$case_dir"
  create_restore_fixtures "$case_dir"
  printf '%s\n' '不是 Redis RDB' > "$case_dir/redis.rdb"
  chmod 600 "$case_dir/redis.rdb"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/restore.sh" \
    --env-file "$case_dir/.env" \
    --db-backup "$case_dir/database.sql.gz" \
    --attachments-backup "$case_dir/attachments.tar.gz" \
    --redis-backup "$case_dir/redis.rdb" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "损坏的 Redis RDB 备份不应通过恢复前校验"
  assert_contains "$output" "RDB"
}

create_deploy_fixtures() {
  local case_dir="$1"
  mkdir -p "$case_dir/bin"
  : > "$case_dir/.env"
  : > "$case_dir/docker-compose.yml"
  : > "$case_dir/docker-compose.prod.yml"
  chmod 600 "$case_dir/.env"
}

create_deploy_runtime_doubles() {
  local case_dir="$1"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'exit 0' > "$case_dir/validate-env.sh"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'printf "%s|%s\\n" "${TAG:-unset}" "$*" >> "$DEPLOY_DOCKER_LOG"' \
    'if [[ "${1:-}" = "login" ]]; then cat >/dev/null; exit 0; fi' \
    'if [[ "${1:-}" = "inspect" ]]; then' \
    '  counter=0' \
    '  if [[ -f "$DEPLOY_INSPECT_COUNTER" ]]; then counter="$(cat "$DEPLOY_INSPECT_COUNTER")"; fi' \
    '  counter=$((counter + 1))' \
    '  printf "%s\\n" "$counter" > "$DEPLOY_INSPECT_COUNTER"' \
    '  status="$(printf "%s" "${DEPLOY_FRONTEND_STATUSES:-healthy}" | cut -d, -f"$counter")"' \
    '  [[ -n "$status" ]] || status="missing"' \
    '  printf "%s\\n" "$status"' \
    '  exit 0' \
    'fi' \
    '[[ "${1:-}" = "compose" ]] || exit 1' \
    'if [[ "$*" == *" ps -q frontend"* ]]; then printf "fake-frontend\\n"; exit 0; fi' \
    'if [[ -n "${DEPLOY_FAIL_FINAL_PS:-}" && "$*" == *" ps backend frontend"* ]]; then exit 43; fi' \
    'if [[ -n "${DEPLOY_FAIL_TARGET_UP:-}" && "${TAG:-}" = "$DEPLOY_FAIL_TARGET_UP" && "$*" == *" up "* ]]; then exit 42; fi' \
    'exit 0' > "$case_dir/bin/docker"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'printf "%s\\n" "$*" >> "$DEPLOY_CURL_LOG"' \
    'counter=0' \
    'if [[ -f "$DEPLOY_CURL_COUNTER" ]]; then counter="$(cat "$DEPLOY_CURL_COUNTER")"; fi' \
    'counter=$((counter + 1))' \
    'printf "%s\\n" "$counter" > "$DEPLOY_CURL_COUNTER"' \
    'code="$(printf "%s" "${DEPLOY_CURL_CODES:-200}" | cut -d, -f"$counter")"' \
    '[[ -n "$code" ]] || code="000"' \
    'printf "%s" "$code"' > "$case_dir/bin/curl"
  chmod +x "$case_dir/validate-env.sh" "$case_dir/bin/docker" "$case_dir/bin/curl"
}

run_deploy_fixture() {
  local case_dir="$1"
  local target_tag="$2"
  PATH="$case_dir/bin:$PATH" \
    COMPOSE_DIR="$case_dir" \
    DEPLOY_DOCKER_LOG="$case_dir/docker.log" \
    DEPLOY_INSPECT_COUNTER="$case_dir/inspect-counter" \
    DEPLOY_CURL_COUNTER="$case_dir/curl-counter" \
    DEPLOY_CURL_LOG="$case_dir/curl.log" \
    DEPLOY_MAX_ATTEMPTS=1 \
    DEPLOY_INITIAL_DELAY_SECONDS=0 \
    DEPLOY_ROLLBACK_INITIAL_DELAY_SECONDS=0 \
    DEPLOY_POLL_INTERVAL_SECONDS=0 \
    GHCR_PULL_USER="test-user" \
    GHCR_PULL_TOKEN="test-token" \
    bash "$PROJECT_ROOT/docker/deploy-production.sh" "$target_tag"
}

test_deploy_preflight_failure_does_not_mutate_services() {
  local case_dir="$TEST_ROOT/deploy-preflight"
  local docker_log="$case_dir/docker.log"
  local validate_marker="$case_dir/validate-called"
  create_deploy_fixtures "$case_dir"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    ': > "$DEPLOY_VALIDATE_CALLED"' \
    'exit 1' > "$case_dir/validate-env.sh"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'printf "%s\\n" "$*" >> "$DEPLOY_DOCKER_LOG"' \
    'exit 0' > "$case_dir/bin/docker"
  chmod +x "$case_dir/validate-env.sh" "$case_dir/bin/docker"

  local output
  local result_code
  set +e
  output="$(PATH="$case_dir/bin:$PATH" \
    COMPOSE_DIR="$case_dir" \
    DEPLOY_DOCKER_LOG="$docker_log" \
    DEPLOY_VALIDATE_CALLED="$validate_marker" \
    GHCR_PULL_USER="test-user" \
    GHCR_PULL_TOKEN="test-token" \
    bash "$PROJECT_ROOT/docker/deploy-production.sh" 2.0.0 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "生产配置预检失败时部署不应成功"
  [[ -f "$validate_marker" ]] || fail "部署必须调用生产环境验证器"
  [[ ! -s "$docker_log" ]] || fail "生产配置预检失败时不应调用 Docker"
  [[ "$output" != *"部署成功"* ]] || fail "预检失败时不应报告部署成功"
}

test_deploy_success_updates_version_atomically() {
  local case_dir="$TEST_ROOT/deploy-success"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"
  printf '%s\n' '1.0.0' > "$case_dir/.last-deployed-tag"

  local output
  if ! output="$(DEPLOY_CURL_CODES=200 run_deploy_fixture "$case_dir" 2.0.0 2>&1)"; then
    printf '%s\n' "$output" >&2
    fail "目标版本健康时生产部署应成功"
  fi

  [[ "$(cat "$case_dir/.last-deployed-tag")" = "2.0.0" ]] \
    || fail "成功部署后应原子记录目标版本"
  assert_contains "$output" "部署成功"
  grep -q '^2.0.0|.* pull backend frontend' "$case_dir/docker.log" \
    || fail "部署应使用目标 tag 拉取 backend/frontend"
  grep -q '^2.0.0|.* up .*--pull never.*backend frontend' "$case_dir/docker.log" \
    || fail "目标镜像已拉取后，容器重建不应再次依赖镜像仓库"
  grep -q -- '--max-time 5' "$case_dir/curl.log" \
    || fail "健康探测必须设置请求超时，避免部署无限挂起"
  ! grep -q '^1.0.0|.*--pull never' "$case_dir/docker.log" \
    || fail "目标版本健康时不应回滚"
}

test_deploy_final_status_display_failure_does_not_reverse_success() {
  local case_dir="$TEST_ROOT/deploy-final-status-warning"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"
  printf '%s\n' '1.0.0' > "$case_dir/.last-deployed-tag"

  local output
  if ! output="$(DEPLOY_FAIL_FINAL_PS=1 DEPLOY_CURL_CODES=200 \
    run_deploy_fixture "$case_dir" 2.0.0 2>&1)"; then
    printf '%s\n' "$output" >&2
    fail "健康验证和版本记录均成功后，状态展示失败不应把部署误报为失败"
  fi

  [[ "$(cat "$case_dir/.last-deployed-tag")" = "2.0.0" ]] \
    || fail "状态展示失败不应撤销已验证的版本记录"
  assert_contains "$output" "无法展示容器状态"
}

test_deploy_health_failure_rolls_back_and_verifies_health() {
  local case_dir="$TEST_ROOT/deploy-health-rollback"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"
  printf '%s\n' '1.0.0' > "$case_dir/.last-deployed-tag"

  local output
  local result_code
  set +e
  output="$(DEPLOY_CURL_CODES=503,200 run_deploy_fixture "$case_dir" 2.0.0 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "目标版本健康失败后部署必须返回非零"
  [[ "$(cat "$case_dir/.last-deployed-tag")" = "1.0.0" ]] \
    || fail "回滚后版本记录必须保持旧版本"
  assert_contains "$output" "回滚验证通过"
  grep -q '^1.0.0|.* up .*--pull never.*backend frontend' "$case_dir/docker.log" \
    || fail "健康失败后应使用本机旧镜像回滚 backend/frontend"
  [[ "$(cat "$case_dir/curl-counter")" = "2" ]] \
    || fail "目标失败后必须再次探测回滚版本健康"
}

test_deploy_frontend_health_failure_also_rolls_back() {
  local case_dir="$TEST_ROOT/deploy-frontend-health-rollback"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"
  printf '%s\n' '1.0.0' > "$case_dir/.last-deployed-tag"

  local output
  local result_code
  set +e
  output="$(DEPLOY_CURL_CODES=200,200 DEPLOY_FRONTEND_STATUSES=unhealthy,healthy \
    run_deploy_fixture "$case_dir" 2.0.0 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "前端不健康时部署必须失败并回滚"
  assert_contains "$output" "回滚验证通过"
  grep -q '^1.0.0|.* up .*--pull never.*backend frontend' "$case_dir/docker.log" \
    || fail "前端健康失败后也必须回滚 backend/frontend"
  [[ "$(cat "$case_dir/inspect-counter")" = "2" ]] \
    || fail "目标和回滚版本都必须验证前端容器健康"
}

test_deploy_same_healthy_tag_is_idempotent() {
  local case_dir="$TEST_ROOT/deploy-idempotent"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"
  printf '%s\n' '2.0.0' > "$case_dir/.last-deployed-tag"

  local output
  if ! output="$(DEPLOY_CURL_CODES=200 run_deploy_fixture "$case_dir" 2.0.0 2>&1)"; then
    printf '%s\n' "$output" >&2
    fail "同版本且健康时部署应幂等成功"
  fi

  assert_contains "$output" "无需重复部署"
  ! grep -Eq '^2\.0\.0\|(login|.* (pull|up) )' "$case_dir/docker.log" \
    || fail "同版本且健康时不应登录仓库、拉取镜像或重建服务"
}

test_deploy_compose_failure_rolls_back() {
  local case_dir="$TEST_ROOT/deploy-command-rollback"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"
  printf '%s\n' '1.0.0' > "$case_dir/.last-deployed-tag"

  local output
  local result_code
  set +e
  output="$(DEPLOY_FAIL_TARGET_UP=2.0.0 DEPLOY_CURL_CODES=200 \
    run_deploy_fixture "$case_dir" 2.0.0 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "目标 compose up 失败后部署必须返回非零"
  assert_contains "$output" "回滚验证通过"
  grep -q '^1.0.0|.* up .*--pull never.*backend frontend' "$case_dir/docker.log" \
    || fail "compose up 中途失败也必须进入统一回滚"
}

test_deploy_without_history_never_rolls_back_to_unknown_tag() {
  local case_dir="$TEST_ROOT/deploy-no-history"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"

  local output
  local result_code
  set +e
  output="$(DEPLOY_CURL_CODES=503 run_deploy_fixture "$case_dir" 2.0.0 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "首次部署失败且没有历史版本时必须返回非零"
  assert_contains "$output" "没有可用的历史版本"
  ! grep -q '^unknown|' "$case_dir/docker.log" \
    || fail "没有版本记录时绝不能把 unknown 当作真实镜像 tag"
  [[ "$(cat "$case_dir/curl-counter")" = "1" ]] \
    || fail "没有历史版本时不应执行伪回滚健康探测"
}

test_deploy_rollback_health_failure_is_critical() {
  local case_dir="$TEST_ROOT/deploy-rollback-critical"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"
  printf '%s\n' '1.0.0' > "$case_dir/.last-deployed-tag"

  local output
  local result_code
  set +e
  output="$(DEPLOY_CURL_CODES=503,503 run_deploy_fixture "$case_dir" 2.0.0 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "目标和回滚版本都不健康时部署必须失败"
  [[ "$(cat "$case_dir/.last-deployed-tag")" = "1.0.0" ]] \
    || fail "回滚失败时不得更新版本记录"
  assert_contains "$output" "严重"
  assert_contains "$output" "回滚健康检查失败"
}

test_release_waits_for_quality_gates() {
  local release_block
  release_block="$(sed -n '/^  release:/,/^  deploy:/p' "$PROJECT_ROOT/.github/workflows/ci.yml")"
  assert_contains "$release_block" "needs: [backend, frontend]"

  local deploy_block
  deploy_block="$(sed -n '/^  deploy:/,/^  load-test:/p' "$PROJECT_ROOT/.github/workflows/ci.yml")"
  assert_contains "$deploy_block" "needs: [release]"
}

test_deploy_has_fail_closed_preflight() {
  local deploy_block
  deploy_block="$(sed -n '/^  deploy:/,/^  load-test:/p' "$PROJECT_ROOT/.github/workflows/ci.yml")"
  assert_contains "$deploy_block" 'test -f ./deploy-production.sh'
  assert_contains "$deploy_block" 'bash ./deploy-production.sh "$TARGET_VERSION"'
  [[ "$deploy_block" != *'docker compose --env-file .env'* ]] \
    || fail "CI 不应再维护未经行为测试的内联部署副本"
}

test_production_dependency_audit_fails_closed_on_registry_error() {
  local case_dir="$TEST_ROOT/npm-audit-registry-error"
  mkdir -p "$case_dir/bin"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'printf '\''%s\n'\'' '\''{"message":"audit endpoint unavailable","error":{"summary":"","detail":""}}'\''' \
    'exit 1' > "$case_dir/bin/npm"
  chmod +x "$case_dir/bin/npm"

  local output
  local result_code
  set +e
  output="$(cd "$PROJECT_ROOT/frontend" && PATH="$case_dir/bin:$PATH" node scripts/check-production-audit.mjs 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "npm 漏洞源不可用时生产依赖审计必须失败关闭"
  assert_contains "$output" "npm audit"
}

test_bluegreen_router_does_not_cross_color_dependency() {
  local router_block
  router_block="$(sed -n '/^  router:/,/^networks:/p' "$PROJECT_ROOT/docker/docker-compose.bluegreen.yml")"
  [[ "$router_block" != *"depends_on:"* ]] || fail "蓝绿 router 不应依赖固定颜色服务，否则单 profile 配置会失效"
}

test_bluegreen_has_fail_closed_preflight() {
  local deploy_script
  deploy_script="$(cat "$PROJECT_ROOT/scripts/deploy-bluegreen.sh")"
  assert_contains "$deploy_script" 'bash "$COMPOSE_DIR/validate-env.sh" "$COMPOSE_DIR/.env" --check-runtime-files'
  assert_contains "$deploy_script" '"${COMPOSE[@]}" config --quiet'

  local preflight_line
  local login_line
  preflight_line="$(printf '%s\n' "$deploy_script" | grep -n 'validate-env.sh' | head -n1 | cut -d: -f1)"
  login_line="$(printf '%s\n' "$deploy_script" | grep -n 'docker login ghcr.io' | head -n1 | cut -d: -f1)"
  [[ -n "$preflight_line" && -n "$login_line" && "$preflight_line" -lt "$login_line" ]] \
    || fail "蓝绿部署必须在 GHCR 登录和拉取镜像之前完成配置校验"
}

test_bluegreen_colors_do_not_inherit_public_entry_ports() {
  command -v docker >/dev/null 2>&1 || fail "蓝绿配置回归测试需要 docker 命令"
  command -v jq >/dev/null 2>&1 || fail "蓝绿配置回归测试需要 jq 命令"

  local rendered
  rendered="$(env TAG=1.2.0 docker compose \
    --env-file "$PROJECT_ROOT/docker/.env.example" \
    -f "$PROJECT_ROOT/docker/docker-compose.yml" \
    -f "$PROJECT_ROOT/docker/docker-compose.prod.yml" \
    -f "$PROJECT_ROOT/docker/docker-compose.bluegreen.yml" \
    --profile green config --format json)"

  jq -e '
    .services["backend-green"].ports
    | length == 1
    and .[0].host_ip == "127.0.0.1"
    and .[0].published == "8082"
    and .[0].target == 8080
  ' >/dev/null <<<"$rendered" || fail "backend-green 不应继承基础服务的宿主 8080 端口"

  jq -e '
    .services["frontend-green"].ports
    | length == 1
    and .[0].host_ip == "127.0.0.1"
    and .[0].published == "3002"
    and .[0].target == 80
  ' >/dev/null <<<"$rendered" || fail "frontend-green 不应继承基础服务的公网入口端口"
}

test_production_internal_ports_bind_loopback_by_default() {
  local compose_content
  compose_content="$(cat "$PROJECT_ROOT/docker/docker-compose.yml")"
  assert_contains "$compose_content" 'AutoMapper__LicenseKey: "${AUTOMAPPER_LICENSE_KEY:?请在 .env 中设置 AUTOMAPPER_LICENSE_KEY}"'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${PG_PORT:-5432}:5432'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${REDIS_PORT:-6379}:6379'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${RABBITMQ_PORT:-5672}:5672'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${RABBITMQ_MGMT_PORT:-15672}:15672'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${SEQ_PORT:-5341}:80'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${PROMETHEUS_PORT:-9090}:9090'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${GRAFANA_PORT:-3000}:3000'
}

test_development_internal_ports_bind_loopback_by_default() {
  local compose_content
  compose_content="$(cat "$PROJECT_ROOT/docker/docker-compose.dev.yml")"
  assert_contains "$compose_content" '${DEV_BIND_ADDRESS:-127.0.0.1}:5432:5432'
  assert_contains "$compose_content" '${DEV_BIND_ADDRESS:-127.0.0.1}:6379:6379'
  assert_contains "$compose_content" '${DEV_BIND_ADDRESS:-127.0.0.1}:1883:1883'
  assert_contains "$compose_content" '${DEV_BIND_ADDRESS:-127.0.0.1}:5672:5672'
  assert_contains "$compose_content" '${DEV_BIND_ADDRESS:-127.0.0.1}:15672:15672'
}

case "${1:-all}" in
  setup)
    test_validate_env_accepts_complete_config
    test_validate_env_rejects_missing_automapper_license
    test_validate_env_rejects_weak_production_config
    test_validate_runtime_files_gate
    test_setup_rejects_new_placeholder_env
    ;;
  backup)
    test_backup_includes_attachments
    test_backup_rejects_missing_remote_target
    test_backup_rejects_requested_redis_failure
    ;;
  restore)
    test_restore_dry_run_does_not_mutate_services
    test_restore_confirm_cleans_attachments_without_running_backend
    test_restore_rejects_corrupted_archive
    test_restore_rejects_unsafe_attachment_archive
    test_restore_rejects_corrupted_redis_backup
    ;;
  deploy)
    test_deploy_preflight_failure_does_not_mutate_services
    test_deploy_success_updates_version_atomically
    test_deploy_final_status_display_failure_does_not_reverse_success
    test_deploy_health_failure_rolls_back_and_verifies_health
    test_deploy_frontend_health_failure_also_rolls_back
    test_deploy_same_healthy_tag_is_idempotent
    test_deploy_compose_failure_rolls_back
    test_deploy_without_history_never_rolls_back_to_unknown_tag
    test_deploy_rollback_health_failure_is_critical
    ;;
  ci)
    test_release_waits_for_quality_gates
    test_deploy_has_fail_closed_preflight
    test_production_dependency_audit_fails_closed_on_registry_error
    ;;
  all)
    test_validate_env_accepts_complete_config
    test_validate_env_rejects_missing_automapper_license
    test_validate_env_rejects_weak_production_config
    test_validate_runtime_files_gate
    test_setup_rejects_new_placeholder_env
    test_backup_includes_attachments
    test_backup_rejects_missing_remote_target
    test_backup_rejects_requested_redis_failure
    test_restore_dry_run_does_not_mutate_services
    test_restore_confirm_cleans_attachments_without_running_backend
    test_restore_rejects_corrupted_archive
    test_restore_rejects_unsafe_attachment_archive
    test_restore_rejects_corrupted_redis_backup
    test_deploy_preflight_failure_does_not_mutate_services
    test_deploy_success_updates_version_atomically
    test_deploy_final_status_display_failure_does_not_reverse_success
    test_deploy_health_failure_rolls_back_and_verifies_health
    test_deploy_frontend_health_failure_also_rolls_back
    test_deploy_same_healthy_tag_is_idempotent
    test_deploy_compose_failure_rolls_back
    test_deploy_without_history_never_rolls_back_to_unknown_tag
    test_deploy_rollback_health_failure_is_critical
    test_release_waits_for_quality_gates
    test_deploy_has_fail_closed_preflight
    test_production_dependency_audit_fails_closed_on_registry_error
    test_bluegreen_router_does_not_cross_color_dependency
    test_bluegreen_has_fail_closed_preflight
    test_bluegreen_colors_do_not_inherit_public_entry_ports
    test_production_internal_ports_bind_loopback_by_default
    test_development_internal_ports_bind_loopback_by_default
    ;;
  *)
    fail "用法：$0 [setup|backup|restore|deploy|ci|all]"
    ;;
esac
echo "生产脚本测试通过"
