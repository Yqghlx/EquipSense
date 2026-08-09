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

test_validate_env_rejects_weak_production_config() {
  local env_file="$TEST_ROOT/weak.env"
  printf '%s\n' \
    'PG_PASSWORD=short' \
    'REDIS_PASSWORD=short' \
    'RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RABBITMQ_USER=equipai' \
    'RABBITMQ_PASSWORD=rabbitmq-password-long' \
    'JWT_SECRET=jwt-secret-that-is-longer-than-thirty-two-characters' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=short' \
    'SEED_ADMIN_PASSWORD=admin-password-long' \
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
  assert_contains "$output" "FRONTEND_URL 必须使用 HTTPS"
  assert_contains "$output" "SEQ_ADMIN_PASSWORD 长度不足"
  assert_contains "$output" "GRAFANA_PASSWORD 长度不足"
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

test_release_waits_for_quality_gates() {
  local release_block
  release_block="$(sed -n '/^  release:/,/^  deploy:/p' "$PROJECT_ROOT/.github/workflows/ci.yml")"
  assert_contains "$release_block" "needs: [backend, frontend]"

  local deploy_block
  deploy_block="$(sed -n '/^  deploy:/,$p' "$PROJECT_ROOT/.github/workflows/ci.yml")"
  assert_contains "$deploy_block" "http://localhost:8080/health/ready"
  assert_contains "$deploy_block" "docker inspect"
  assert_contains "$deploy_block" '!= "unknown"'
}

test_deploy_has_fail_closed_preflight() {
  local deploy_block
  deploy_block="$(sed -n '/^  deploy:/,$p' "$PROJECT_ROOT/.github/workflows/ci.yml")"
  assert_contains "$deploy_block" 'COMPOSE="docker compose --env-file .env -f docker-compose.yml -f docker-compose.prod.yml"'
  assert_contains "$deploy_block" 'bash ./validate-env.sh .env'
  assert_contains "$deploy_block" '$COMPOSE config --quiet'
  assert_contains "$deploy_block" '${GHCR_PULL_TOKEN:-}'
  assert_contains "$deploy_block" '${GHCR_PULL_USER:-}'

  local preflight_line
  local login_line
  preflight_line="$(printf '%s\n' "$deploy_block" | grep -n 'bash ./validate-env.sh .env' | cut -d: -f1 | head -n1)"
  login_line="$(printf '%s\n' "$deploy_block" | grep -n 'docker login ghcr.io' | cut -d: -f1 | head -n1)"
  [[ -n "$preflight_line" && -n "$login_line" && "$preflight_line" -lt "$login_line" ]] \
    || fail "部署前置校验必须发生在 GHCR 登录和拉取镜像之前"
}

test_bluegreen_router_does_not_cross_color_dependency() {
  local router_block
  router_block="$(sed -n '/^  router:/,/^networks:/p' "$PROJECT_ROOT/docker/docker-compose.bluegreen.yml")"
  [[ "$router_block" != *"depends_on:"* ]] || fail "蓝绿 router 不应依赖固定颜色服务，否则单 profile 配置会失效"
}

test_bluegreen_has_fail_closed_preflight() {
  local deploy_script
  deploy_script="$(cat "$PROJECT_ROOT/scripts/deploy-bluegreen.sh")"
  assert_contains "$deploy_script" 'bash "$COMPOSE_DIR/validate-env.sh" "$COMPOSE_DIR/.env"'
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
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${PG_PORT:-5432}:5432'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${REDIS_PORT:-6379}:6379'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${RABBITMQ_PORT:-5672}:5672'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${RABBITMQ_MGMT_PORT:-15672}:15672'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${SEQ_PORT:-5341}:80'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${PROMETHEUS_PORT:-9090}:9090'
  assert_contains "$compose_content" '${INTERNAL_BIND_ADDRESS:-127.0.0.1}:${GRAFANA_PORT:-3000}:3000'
}

case "${1:-all}" in
  setup)
    test_validate_env_accepts_complete_config
    test_validate_env_rejects_weak_production_config
    test_setup_rejects_new_placeholder_env
    ;;
  backup)
    test_backup_includes_attachments
    test_backup_rejects_missing_remote_target
    ;;
  ci)
    test_release_waits_for_quality_gates
    ;;
  all)
    test_validate_env_accepts_complete_config
    test_validate_env_rejects_weak_production_config
    test_setup_rejects_new_placeholder_env
    test_backup_includes_attachments
    test_backup_rejects_missing_remote_target
    test_release_waits_for_quality_gates
    test_deploy_has_fail_closed_preflight
    test_bluegreen_router_does_not_cross_color_dependency
    test_bluegreen_has_fail_closed_preflight
    test_bluegreen_colors_do_not_inherit_public_entry_ports
    test_production_internal_ports_bind_loopback_by_default
    ;;
  *)
    fail "用法：$0 [setup|backup|ci|all]"
    ;;
esac
echo "生产脚本测试通过"
