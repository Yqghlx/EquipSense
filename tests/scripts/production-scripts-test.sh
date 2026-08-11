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
    'PII_ENCRYPTION_KEY=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=automapper-license-key-issued-for-test-only' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'GATEWAY_TENANT_ID=11111111-1111-1111-1111-111111111111' \
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

test_validate_env_rejects_missing_pii_encryption_key() {
  local env_file="$TEST_ROOT/missing-pii-key.env"
  sed '/^PII_ENCRYPTION_KEY=/d' "$TEST_ROOT/valid.env" > "$env_file"
  chmod 600 "$env_file"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "缺少 PII 加密密钥时生产环境校验不应通过"
  assert_contains "$output" "PII_ENCRYPTION_KEY"
  [[ "$output" != *"YWJjZGVm"* ]] || fail "校验输出不得泄露 PII 密钥值"
}

test_validate_env_rejects_invalid_rate_limiting_config() {
  local env_file="$TEST_ROOT/invalid-rate-limiting.env"
  cp "$TEST_ROOT/valid.env" "$env_file"
  chmod 600 "$env_file"
  printf '%s\n' \
    'RATE_LIMITING_AUTH_PERMIT_LIMIT=0' \
    'RATE_LIMITING_WINDOW=not-a-timespan' >> "$env_file"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "非法限流参数不应通过生产环境校验"
  assert_contains "$output" "RATE_LIMITING_AUTH_PERMIT_LIMIT 必须是大于 0 的整数"
  assert_contains "$output" "RATE_LIMITING_WINDOW 必须是 hh:mm:ss 格式"
}

test_validate_env_rejects_short_machine_api_key() {
  local env_file="$TEST_ROOT/short-machine-api-key.env"
  cp "$TEST_ROOT/valid.env" "$env_file"
  chmod 600 "$env_file"
  printf '%s\n' 'AUTH_MACHINE_API_KEY=too-short' >> "$env_file"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "机器客户端 API Key 过短时生产环境校验不应通过"
  assert_contains "$output" "AUTH_MACHINE_API_KEY 长度不足 32 个字符"
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
    'PII_ENCRYPTION_KEY=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY=' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'GATEWAY_TENANT_ID=11111111-1111-1111-1111-111111111111' \
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

test_validate_env_rejects_reused_production_credentials() {
  local env_file="$TEST_ROOT/reused-credentials.env"
  printf '%s\n' \
    'PG_PASSWORD=shared-production-secret' \
    'REDIS_PASSWORD=shared-production-secret' \
    'RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RABBITMQ_USER=equipai' \
    'RABBITMQ_PASSWORD=rabbitmq-password-long' \
    'JWT_SECRET=jwt-secret-that-is-longer-than-thirty-two-characters' \
    'TOTP_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=' \
    'PII_ENCRYPTION_KEY=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=automapper-license-key-issued-for-test-only' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'GATEWAY_TENANT_ID=11111111-1111-1111-1111-111111111111' \
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

  [[ "$result_code" -ne 0 ]] || fail "复用生产凭据时环境校验不应通过"
  assert_contains "$output" "REDIS_PASSWORD 与 PG_PASSWORD 不得复用同一凭据"
  [[ "$output" != *"shared-production-secret"* ]] || fail "校验输出不得泄露凭据值"
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
    'PII_ENCRYPTION_KEY=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=short' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'GATEWAY_TENANT_ID=11111111-1111-1111-1111-111111111111' \
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

test_validate_env_rejects_non_production_environment() {
  local env_file="$TEST_ROOT/non-production-environment.env"
  printf '%s\n' \
    'PG_PASSWORD=postgres-password-long' \
    'REDIS_PASSWORD=redis-password-long' \
    'RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RABBITMQ_USER=equipai' \
    'RABBITMQ_PASSWORD=rabbitmq-password-long' \
    'JWT_SECRET=jwt-secret-that-is-longer-than-thirty-two-characters' \
    'TOTP_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=' \
    'PII_ENCRYPTION_KEY=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=automapper-license-key-issued-for-test-only' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'GATEWAY_TENANT_ID=11111111-1111-1111-1111-111111111111' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=mqtt-password-long' \
    'SEED_ADMIN_PASSWORD=admin-password-long' \
    'SEED_LEAD_PASSWORD=lead-password-long' \
    'SEED_TECH_PASSWORD=tech-password-long' \
    'SEED_OPERATOR_PASSWORD=operator-password-long' \
    'SEED_VIEWER_PASSWORD=viewer-password-long' \
    'FRONTEND_URL=https://example.com' \
    'SEQ_ADMIN_PASSWORD=seq-password-long' \
    'GRAFANA_PASSWORD=grafana-password-long' \
    'ASPNETCORE_ENVIRONMENT=Development' > "$env_file"
  chmod 600 "$env_file"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "非 Production 环境不应通过生产环境校验"
  assert_contains "$output" "ASPNETCORE_ENVIRONMENT 必须为 Production"
}

test_validate_env_rejects_duplicate_keys() {
  local env_file="$TEST_ROOT/duplicate-keys.env"
  printf '%s\n' \
    'PG_PASSWORD=postgres-password-long' \
    'REDIS_PASSWORD=redis-password-long' \
    'RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RABBITMQ_USER=equipai' \
    'RABBITMQ_PASSWORD=rabbitmq-password-long' \
    'JWT_SECRET=jwt-secret-that-is-longer-than-thirty-two-characters' \
    'TOTP_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=' \
    'PII_ENCRYPTION_KEY=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=automapper-license-key-issued-for-test-only' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'GATEWAY_TENANT_ID=11111111-1111-1111-1111-111111111111' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=mqtt-password-long' \
    'SEED_ADMIN_PASSWORD=admin-password-long' \
    'SEED_LEAD_PASSWORD=lead-password-long' \
    'SEED_TECH_PASSWORD=tech-password-long' \
    'SEED_OPERATOR_PASSWORD=operator-password-long' \
    'SEED_VIEWER_PASSWORD=viewer-password-long' \
    'FRONTEND_URL=https://example.com' \
    'SEQ_ADMIN_PASSWORD=seq-password-long' \
    'GRAFANA_PASSWORD=grafana-password-long' \
    'ASPNETCORE_ENVIRONMENT=Production' \
    'FRONTEND_URL=https://other.example.com' > "$env_file"
  chmod 600 "$env_file"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "重复环境变量不应通过生产环境校验"
  assert_contains "$output" "FRONTEND_URL 重复定义"
}

test_production_env_template_uses_https_default() {
  local template_content
  template_content="$(cat "$PROJECT_ROOT/docker/.env.example")"
  assert_contains "$template_content" "FRONTEND_PORT=80"
  assert_contains "$template_content" "FRONTEND_URL=https://localhost"
  [[ "$template_content" != *"FRONTEND_URL=http://"* ]] \
    || fail "生产环境模板不应使用 HTTP 前端地址"
}

test_production_compose_supports_isolated_tenant2_e2e_credentials() {
  local compose_content
  compose_content="$(cat "$PROJECT_ROOT/docker/docker-compose.yml")"
  assert_contains "$compose_content" 'SEED_TENANT2_ACCOUNT: "${SEED_TENANT2_ACCOUNT:-false}"'
  assert_contains "$compose_content" 'SEED_TENANT2_PASSWORD: "${SEED_TENANT2_PASSWORD:-}"'
  assert_contains "$compose_content" 'RateLimiting__AuthPermitLimit: "${RATE_LIMITING_AUTH_PERMIT_LIMIT:-10}"'
  assert_contains "$compose_content" 'Security__PiiEncryptionKey: "${PII_ENCRYPTION_KEY:?请在 .env 中设置 PII_ENCRYPTION_KEY}"'
  assert_contains "$compose_content" 'Gateway__AuthKey: "${GATEWAY_AUTH_KEY:?请在 .env 中设置 GATEWAY_AUTH_KEY（纯 ASCII）}"'
  assert_contains "$compose_content" 'Auth__MachineApiKey: "${AUTH_MACHINE_API_KEY:-}"'
  assert_contains "$compose_content" 'Gateway__Id: "${GATEWAY_ID:-gateway-001}"'
  assert_contains "$compose_content" 'Gateway__TenantId: "${GATEWAY_TENANT_ID:?请在 .env 中设置 GATEWAY_TENANT_ID（UUID）}"'
  [[ "$compose_content" != *'Gateway__AuthKey: "${GATEWAY_AUTH_KEY:-}"'* ]] \
    || fail "边缘网关认证密钥缺失时必须在 Compose 插值阶段失败"
  assert_contains "$compose_content" 'Gateway__TenantId: "${GATEWAY_TENANT_ID:?请在 .env 中设置 GATEWAY_TENANT_ID（UUID）}"'
  [[ "$compose_content" != *'Gateway__TenantId: "${GATEWAY_TENANT_ID:-}"'* ]] \
    || fail "边缘网关租户 UUID 缺失时必须在 Compose 插值阶段失败"
}

test_production_smoke_exposes_optional_full_e2e_gate() {
  local smoke_content
  smoke_content="$(cat "$PROJECT_ROOT/tests/scripts/production-runtime-smoke.sh")"
  assert_contains "$smoke_content" 'SMOKE_RUN_E2E'
  assert_contains "$smoke_content" 'playwright test e2e-comprehensive'
  assert_contains "$smoke_content" 'runtime_env+=('
}

test_production_e2e_preserves_mfa_policy() {
  local bootstrap_content
  bootstrap_content="$(cat "$PROJECT_ROOT/tests/scripts/production-e2e-mfa-bootstrap.mjs")"
  assert_contains "$bootstrap_content" '/api/v1/auth/mfa/enroll/setup'
  assert_contains "$bootstrap_content" '/api/v1/auth/mfa/enroll/confirm'
  assert_contains "$bootstrap_content" 'MFA_BOOTSTRAP_MACHINE_API_KEY'
  assert_contains "$bootstrap_content" "X-API-Key"
  assert_contains "$bootstrap_content" 'MFA_BOOTSTRAP_TENANT2_PASSWORD'

  local auth_content
  auth_content="$(cat "$PROJECT_ROOT/frontend/e2e-comprehensive/helpers/auth.ts")"
  assert_contains "$auth_content" 'getE2ETotpSecret'
  assert_contains "$auth_content" 'mfa/verify'
  assert_contains "$auth_content" 'getTokenForCredentials'

  local credential_content
  credential_content="$(cat "$PROJECT_ROOT/frontend/e2e-comprehensive/helpers/credentials.ts")"
  assert_contains "$credential_content" 'E2E_ADMIN_TOTP_SECRET'
  assert_contains "$credential_content" 'E2E_TENANT2_TOTP_SECRET'
}

test_alertmanager_webhook_is_fail_safe_and_configurable() {
  local compose_content config_content entrypoint_content
  compose_content="$(cat "$PROJECT_ROOT/docker/docker-compose.yml")"
  config_content="$(cat "$PROJECT_ROOT/docker/alertmanager.yml")"
  entrypoint_content="$(cat "$PROJECT_ROOT/docker/alertmanager-entrypoint.sh")"

  assert_contains "$compose_content" 'ALERT_WEBHOOK_URL: "${ALERT_WEBHOOK_URL:-}"'
  assert_contains "$compose_content" 'alertmanager-entrypoint.sh'
  assert_contains "$compose_content" '--config.file=/tmp/equipai-alertmanager.yml'
  assert_contains "$compose_content" 'http://127.0.0.1:9093/-/ready'
  assert_contains "$config_content" '__ALERTMANAGER_WEBHOOK_CONFIG__'
  [[ "$config_content" != *"localhost:5001"* ]] || fail "Alertmanager 不应硬编码 localhost webhook"
  assert_contains "$entrypoint_content" 'url_file: $webhook_file'
  assert_contains "$entrypoint_content" 'default_receiver="dev-null"'
  bash -n "$PROJECT_ROOT/docker/alertmanager-entrypoint.sh"
}

test_jaeger_storage_is_persistent_by_default() {
  local compose_content env_content
  compose_content="$(cat "$PROJECT_ROOT/docker/docker-compose.yml")"
  env_content="$(cat "$PROJECT_ROOT/docker/.env.example")"

  assert_contains "$compose_content" 'SPAN_STORAGE_TYPE: "${JAEGER_SPAN_STORAGE_TYPE:-badger}"'
  assert_contains "$compose_content" 'BADGER_EPHEMERAL: "${JAEGER_BADGER_EPHEMERAL:-false}"'
  assert_contains "$compose_content" 'jaeger_data:/badger'
  assert_contains "$compose_content" 'condition: service_completed_successfully'
  assert_contains "$compose_content" 'jaeger-init:'
  assert_contains "$env_content" 'JAEGER_SPAN_STORAGE_TYPE=badger'
  assert_contains "$env_content" 'JAEGER_BADGER_EPHEMERAL=false'
  [[ "$compose_content" != *'SPAN_STORAGE_TYPE: memory'* ]] || fail "生产 Jaeger 不应默认使用内存存储"
}

test_validate_env_rejects_ephemeral_jaeger_storage_in_production() {
  local env_file="$TEST_ROOT/ephemeral-jaeger.env"
  cp "$TEST_ROOT/valid.env" "$env_file"
  chmod 600 "$env_file"
  printf '%s\n' \
    'JAEGER_SPAN_STORAGE_TYPE=memory' \
    'JAEGER_BADGER_EPHEMERAL=true' >> "$env_file"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "生产环境不应接受内存或临时 Jaeger 存储"
  assert_contains "$output" "生产环境禁止使用内存 Jaeger 存储"

  local badger_env="$TEST_ROOT/ephemeral-badger.env"
  sed 's/^JAEGER_SPAN_STORAGE_TYPE=memory$/JAEGER_SPAN_STORAGE_TYPE=badger/' "$env_file" > "$badger_env"
  chmod 600 "$badger_env"
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$badger_env" 2>&1)"
  result_code=$?
  set -e
  [[ "$result_code" -ne 0 ]] || fail "生产环境不应接受临时 Badger 存储"
  assert_contains "$output" "生产环境 JAEGER_BADGER_EPHEMERAL 必须为 false"
}

test_validate_env_rejects_invalid_alert_webhook_url() {
  local env_file="$TEST_ROOT/invalid-alert-webhook.env"
  cp "$TEST_ROOT/valid.env" "$env_file"
  chmod 600 "$env_file"
  printf '%s\n' 'ALERT_WEBHOOK_URL=ftp://alert-receiver.example.com/hook' >> "$env_file"

  local output
  local result_code
  set +e
  output="$(bash "$PROJECT_ROOT/docker/validate-env.sh" "$env_file" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "非法 Alertmanager webhook 地址不应通过生产环境校验"
  assert_contains "$output" "ALERT_WEBHOOK_URL 必须使用 http:// 或 https://"
}

test_validate_runtime_files_rejects_invalid_certificates() {
  local case_dir="$TEST_ROOT/invalid-certificates"
  local env_file="$case_dir/.env"
  mkdir -p \
    "$case_dir/ssl" \
    "$case_dir/mqtt-certs" \
    "$case_dir/mosquitto_passwd" \
    "$case_dir/rabbitmq" \
    "$case_dir/prometheus" \
    "$case_dir/grafana/provisioning/datasources" \
    "$case_dir/grafana/provisioning/dashboards"
  cp "$PROJECT_ROOT/docker/validate-env.sh" "$case_dir/validate-env.sh"
  printf '%s\n' \
    'PG_PASSWORD=postgres-password-long' \
    'REDIS_PASSWORD=redis-password-long' \
    'RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RABBITMQ_USER=equipai' \
    'RABBITMQ_PASSWORD=rabbitmq-password-long' \
    'JWT_SECRET=jwt-secret-that-is-longer-than-thirty-two-characters' \
    'TOTP_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=' \
    'PII_ENCRYPTION_KEY=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=automapper-license-key-issued-for-test-only' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'GATEWAY_TENANT_ID=11111111-1111-1111-1111-111111111111' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=mqtt-password-long' \
    'SEED_ADMIN_PASSWORD=admin-password-long' \
    'SEED_LEAD_PASSWORD=lead-password-long' \
    'SEED_TECH_PASSWORD=tech-password-long' \
    'SEED_OPERATOR_PASSWORD=operator-password-long' \
    'SEED_VIEWER_PASSWORD=viewer-password-long' \
    'FRONTEND_URL=https://example.com' \
    'SEQ_ADMIN_PASSWORD=seq-password-long' \
    'GRAFANA_PASSWORD=grafana-password-long' \
    'ASPNETCORE_ENVIRONMENT=Development' > "$env_file"
  chmod 600 "$env_file"
  touch \
    "$case_dir/ssl/cert.pem" \
    "$case_dir/ssl/key.pem" \
    "$case_dir/mqtt-certs/ca.crt" \
    "$case_dir/mqtt-certs/server.crt" \
    "$case_dir/mqtt-certs/server.key" \
    "$case_dir/mosquitto.prod.conf" \
    "$case_dir/mosquitto.conf" \
    "$case_dir/rabbitmq/rabbitmq.conf" \
    "$case_dir/rabbitmq/definitions.json" \
    "$case_dir/rabbitmq/start.sh" \
    "$case_dir/prometheus.yml" \
    "$case_dir/prometheus/rules.yml" \
    "$case_dir/alertmanager.yml" \
    "$case_dir/alertmanager-entrypoint.sh" \
    "$case_dir/grafana/provisioning/datasources/prometheus.yml" \
    "$case_dir/grafana/provisioning/dashboards/dashboard.yml"
  printf '%s\n' 'loadtest:dummy-hash' > "$case_dir/mosquitto_passwd/passwd"

  local output
  local result_code
  set +e
  output="$(bash "$case_dir/validate-env.sh" "$env_file" --check-runtime-files 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "无效 TLS/MQTT 证书不应通过运行时文件门禁"
  assert_contains "$output" "证书"

  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$case_dir/ssl/ca.key" \
    -out "$case_dir/ssl/ca.crt" \
    -subj "/CN=EquipSense Test Frontend CA" >/dev/null 2>&1
  openssl req -newkey rsa:2048 -nodes \
    -keyout "$case_dir/ssl/key.pem" \
    -out "$case_dir/ssl/cert.csr" \
    -subj "/CN=example.com" >/dev/null 2>&1
  openssl x509 -req \
    -in "$case_dir/ssl/cert.csr" \
    -CA "$case_dir/ssl/ca.crt" \
    -CAkey "$case_dir/ssl/ca.key" \
    -CAcreateserial \
    -out "$case_dir/ssl/cert.pem" \
    -days 365 \
    -sha256 >/dev/null 2>&1
  openssl genrsa -out "$case_dir/ssl/mismatch.key" 2048 >/dev/null 2>&1
  mv "$case_dir/ssl/mismatch.key" "$case_dir/ssl/key.pem"
  set +e
  output="$(bash "$case_dir/validate-env.sh" "$env_file" --check-runtime-files 2>&1)"
  result_code=$?
  set -e
  [[ "$result_code" -ne 0 ]] || fail "证书与私钥不匹配时运行时门禁不应通过"
  assert_contains "$output" "Nginx TLS 证书与私钥不匹配"

  openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
    -keyout "$case_dir/ssl/key.pem" \
    -out "$case_dir/ssl/cert.pem" \
    -subj "/CN=example.com" >/dev/null 2>&1
  set +e
  output="$(bash "$case_dir/validate-env.sh" "$env_file" --check-runtime-files 2>&1)"
  result_code=$?
  set -e
  [[ "$result_code" -ne 0 ]] || fail "即将过期的证书不应通过运行时门禁"
  assert_contains "$output" "Nginx TLS 证书 已过期或将在 30 天内过期"

  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$case_dir/ssl/key.pem" \
    -out "$case_dir/ssl/cert.pem" \
    -subj "/CN=wrong.example.com" \
    -addext "subjectAltName=DNS:wrong.example.com" >/dev/null 2>&1
  set +e
  output="$(bash "$case_dir/validate-env.sh" "$env_file" --check-runtime-files 2>&1)"
  result_code=$?
  set -e
  [[ "$result_code" -ne 0 ]] || fail "证书主机名与前端地址不匹配时不应通过运行时门禁"
  assert_contains "$output" "Nginx TLS 证书与 FRONTEND_URL 主机名不匹配"

  # SAN 不能只做子串匹配，否则 DNS:example.com.evil 会错误命中 example.com。
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$case_dir/ssl/key.pem" \
    -out "$case_dir/ssl/cert.pem" \
    -subj "/CN=example.com.evil" \
    -addext "subjectAltName=DNS:example.com.evil" >/dev/null 2>&1
  set +e
  output="$(bash "$case_dir/validate-env.sh" "$env_file" --check-runtime-files 2>&1)"
  result_code=$?
  set -e
  [[ "$result_code" -ne 0 ]] || fail "证书 SAN 为相似域名时不应通过运行时门禁"
  assert_contains "$output" "Nginx TLS 证书与 FRONTEND_URL 主机名不匹配"
}

test_validate_runtime_files_rejects_production_self_signed_certificates() {
  local case_dir="$TEST_ROOT/production-self-signed-certificates"
  local env_file="$case_dir/.env"
  mkdir -p \
    "$case_dir/ssl" \
    "$case_dir/mqtt-certs" \
    "$case_dir/mosquitto_passwd" \
    "$case_dir/rabbitmq" \
    "$case_dir/prometheus" \
    "$case_dir/grafana/provisioning/datasources" \
    "$case_dir/grafana/provisioning/dashboards"
  cp "$PROJECT_ROOT/docker/validate-env.sh" "$case_dir/validate-env.sh"
  cp "$TEST_ROOT/valid.env" "$env_file"
  chmod 600 "$env_file"
  touch \
    "$case_dir/mosquitto.prod.conf" \
    "$case_dir/mosquitto.conf" \
    "$case_dir/rabbitmq/rabbitmq.conf" \
    "$case_dir/rabbitmq/definitions.json" \
    "$case_dir/rabbitmq/start.sh" \
    "$case_dir/prometheus.yml" \
    "$case_dir/prometheus/rules.yml" \
    "$case_dir/alertmanager.yml" \
    "$case_dir/alertmanager-entrypoint.sh" \
    "$case_dir/grafana/provisioning/datasources/prometheus.yml" \
    "$case_dir/grafana/provisioning/dashboards/dashboard.yml"
  printf '%s\n' 'loadtest:dummy-hash' > "$case_dir/mosquitto_passwd/passwd"

  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$case_dir/ssl/key.pem" \
    -out "$case_dir/ssl/cert.pem" \
    -subj "/CN=example.com" \
    -addext "subjectAltName=DNS:example.com" >/dev/null 2>&1
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$case_dir/mqtt-certs/ca.key" \
    -out "$case_dir/mqtt-certs/ca.crt" \
    -subj "/CN=EquipSense Test MQTT CA" \
    -addext "basicConstraints=critical,CA:TRUE" >/dev/null 2>&1
  openssl req -newkey rsa:2048 -nodes \
    -keyout "$case_dir/mqtt-certs/server.key" \
    -out "$case_dir/mqtt-certs/server.csr" \
    -subj "/CN=mosquitto" >/dev/null 2>&1
  printf '%s\n' 'subjectAltName=DNS:mosquitto' > "$case_dir/mqtt-certs/server.ext"
  openssl x509 -req \
    -in "$case_dir/mqtt-certs/server.csr" \
    -CA "$case_dir/mqtt-certs/ca.crt" \
    -CAkey "$case_dir/mqtt-certs/ca.key" \
    -CAcreateserial \
    -out "$case_dir/mqtt-certs/server.crt" \
    -days 365 \
    -sha256 \
    -extfile "$case_dir/mqtt-certs/server.ext" >/dev/null 2>&1

  local output
  local result_code
  set +e
  output="$(bash "$case_dir/validate-env.sh" "$env_file" --check-runtime-files 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "生产环境不应接受自签名 Nginx TLS 证书"
  assert_contains "$output" "Nginx TLS 证书不得使用自签名证书"
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
    'PII_ENCRYPTION_KEY=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=automapper-license-key-issued-for-test-only' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'GATEWAY_TENANT_ID=11111111-1111-1111-1111-111111111111' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=mqtt-password-long' \
    'SEED_ADMIN_PASSWORD=admin-password-long' \
    'SEED_LEAD_PASSWORD=lead-password-long' \
    'SEED_TECH_PASSWORD=tech-password-long' \
    'SEED_OPERATOR_PASSWORD=operator-password-long' \
    'SEED_VIEWER_PASSWORD=viewer-password-long' \
    'FRONTEND_URL=https://example.com' \
    'SEQ_ADMIN_PASSWORD=seq-password-long' \
    'GRAFANA_PASSWORD=grafana-password-long' \
    'ASPNETCORE_ENVIRONMENT=Production' > "$env_file"
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
    "$case_dir/mosquitto_passwd/passwd" \
    "$case_dir/mosquitto.prod.conf" \
    "$case_dir/rabbitmq/rabbitmq.conf" \
    "$case_dir/rabbitmq/definitions.json" \
    "$case_dir/rabbitmq/start.sh" \
    "$case_dir/prometheus.yml" \
    "$case_dir/prometheus/rules.yml" \
    "$case_dir/alertmanager.yml" \
    "$case_dir/alertmanager-entrypoint.sh" \
    "$case_dir/grafana/provisioning/datasources/prometheus.yml" \
    "$case_dir/grafana/provisioning/dashboards/dashboard.yml"
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$case_dir/ssl/ca.key" \
    -out "$case_dir/ssl/ca.crt" \
    -subj "/CN=EquipSense Test Frontend CA" >/dev/null 2>&1
  openssl req -newkey rsa:2048 -nodes \
    -keyout "$case_dir/ssl/key.pem" \
    -out "$case_dir/ssl/cert.csr" \
    -subj "/CN=example.com" >/dev/null 2>&1
  openssl x509 -req \
    -in "$case_dir/ssl/cert.csr" \
    -CA "$case_dir/ssl/ca.crt" \
    -CAkey "$case_dir/ssl/ca.key" \
    -CAcreateserial \
    -out "$case_dir/ssl/cert.pem" \
    -days 365 \
    -sha256 >/dev/null 2>&1
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$case_dir/mqtt-certs/ca.key" \
    -out "$case_dir/mqtt-certs/ca.crt" \
    -subj "/CN=EquipSense Test MQTT CA" >/dev/null 2>&1
  openssl req -newkey rsa:2048 -nodes \
    -keyout "$case_dir/mqtt-certs/server.key" \
    -out "$case_dir/mqtt-certs/server.csr" \
    -subj "/CN=mosquitto" >/dev/null 2>&1
  openssl x509 -req \
    -in "$case_dir/mqtt-certs/server.csr" \
    -CA "$case_dir/mqtt-certs/ca.crt" \
    -CAkey "$case_dir/mqtt-certs/ca.key" \
    -CAcreateserial \
    -out "$case_dir/mqtt-certs/server.crt" \
    -days 365 \
    -sha256 >/dev/null 2>&1
  local empty_password_file_output
  local empty_password_file_result_code
  set +e
  empty_password_file_output="$(bash "$case_dir/validate-env.sh" "$env_file" --check-runtime-files 2>&1)"
  empty_password_file_result_code=$?
  set -e
  [[ "$empty_password_file_result_code" -ne 0 ]] || fail "空 Mosquitto 密码文件不应通过运行时门禁"
  assert_contains "$empty_password_file_output" "Mosquitto 密码文件为空或缺失"
  printf '%s\n' 'loadtest:dummy-hash' > "$case_dir/mosquitto_passwd/passwd"
  bash "$case_dir/validate-env.sh" "$env_file" --check-runtime-files >/dev/null
}

test_setup_rejects_new_placeholder_env() {
  local case_dir="$TEST_ROOT/setup"
  mkdir -p "$case_dir"
  cp "$PROJECT_ROOT/docker/setup.sh" "$case_dir/setup.sh"
  cp "$PROJECT_ROOT/docker/.env.example" "$case_dir/.env.example"

  # setup.sh 会在复制模板后调用 Production-only 验证器；凭据门禁不通过时
  # 不得继续生成任何 TLS/MQTT 或认证运行时文件。
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

test_bootstrap_production_secrets_generates_only_local_values() {
  local case_dir="$TEST_ROOT/bootstrap-production-secrets"
  mkdir -p "$case_dir"
  cp "$PROJECT_ROOT/docker/bootstrap-production-secrets.sh" "$case_dir/bootstrap-production-secrets.sh"
  cp "$PROJECT_ROOT/docker/validate-env.sh" "$case_dir/validate-env.sh"
  cp "$PROJECT_ROOT/docker/.env.example" "$case_dir/.env"
  chmod 600 "$case_dir/.env"

  # 既有有效凭据必须原样保留，脚本只能补齐缺失或占位值。
  sed 's/^PG_PASSWORD=.*/PG_PASSWORD=existing-pg-password-that-must-survive/' \
    "$case_dir/.env" > "$case_dir/.env.next"
  mv "$case_dir/.env.next" "$case_dir/.env"
  chmod 600 "$case_dir/.env"

  local output
  local result_code
  set +e
  output="$(cd "$case_dir" && bash ./bootstrap-production-secrets.sh --env-file .env 2>&1)"
  result_code=$?
  set -e

  # 供应商许可证、真实租户和生产证书仍缺失，因此脚本必须保留非零退出码。
  [[ "$result_code" -ne 0 ]] || fail "未配置供应商/部署专属值时密钥初始化不应误报成功"
  assert_contains "$output" "仍需人工配置"
  assert_contains "$output" "AUTOMAPPER_LICENSE_KEY"
  assert_contains "$output" "GATEWAY_TENANT_ID"

  local value
  local key
  local local_secret_keys=(
    PG_PASSWORD
    REDIS_PASSWORD
    RABBITMQ_PASSWORD
    MQTT_PASSWORD
    SEED_ADMIN_PASSWORD
    SEED_LEAD_PASSWORD
    SEED_TECH_PASSWORD
    SEED_OPERATOR_PASSWORD
    SEED_VIEWER_PASSWORD
    JWT_SECRET
    TOTP_ENCRYPTION_KEY
    PII_ENCRYPTION_KEY
    GATEWAY_AUTH_KEY
    SEQ_ADMIN_PASSWORD
    GRAFANA_PASSWORD
  )
  for key in "${local_secret_keys[@]}"; do
    value="$(awk -F= -v key="$key" '$1 == key { print substr($0, index($0, "=") + 1); exit }' "$case_dir/.env")"
    [[ -n "$value" ]] || fail "$key 未生成"
    [[ "$value" != *"请修改"* && "$value" != *"PLEASE_CHANGE"* && "$value" != *"CHANGE_ME"* ]] \
      || fail "$key 仍为占位值"
    [[ "$output" != *"$value"* ]] || fail "日志不应包含 $key 的生成值"
  done

  value="$(awk -F= '$1 == "PG_PASSWORD" { print substr($0, index($0, "=") + 1); exit }' "$case_dir/.env")"
  [[ "$value" = "existing-pg-password-that-must-survive" ]] || fail "已有 PG_PASSWORD 被覆盖"

  local mqtt_username
  mqtt_username="$(awk -F= '$1 == "MQTT_USERNAME" { print substr($0, index($0, "=") + 1); exit }' "$case_dir/.env")"
  [[ "$mqtt_username" =~ ^equipsense_device_[0-9a-f]+$ ]] || fail "MQTT_USERNAME 未生成安全的机器用户名"

  local totp_key
  local pii_key
  totp_key="$(awk -F= '$1 == "TOTP_ENCRYPTION_KEY" { print substr($0, index($0, "=") + 1); exit }' "$case_dir/.env")"
  pii_key="$(awk -F= '$1 == "PII_ENCRYPTION_KEY" { print substr($0, index($0, "=") + 1); exit }' "$case_dir/.env")"
  [[ "$totp_key" =~ ^[A-Za-z0-9+/]{43}=$ ]] || fail "TOTP_ENCRYPTION_KEY 不是 Base64 编码的 32 字节密钥"
  [[ "$pii_key" =~ ^[A-Za-z0-9+/]{43}=$ ]] || fail "PII_ENCRYPTION_KEY 不是 Base64 编码的 32 字节密钥"
  [[ "$totp_key" != "$pii_key" ]] || fail "TOTP 和 PII 密钥不得复用"

  local env_mode
  if stat -c '%a' "$case_dir/.env" >/dev/null 2>&1; then
    env_mode="$(stat -c '%a' "$case_dir/.env")"
  else
    env_mode="$(stat -f '%Lp' "$case_dir/.env")"
  fi
  [[ "$env_mode" = "600" ]] || fail "生成后的 .env 权限必须为 600，实际为 $env_mode"
  [[ ! -e "$case_dir/.env.lock" ]] || fail "初始化完成后不应遗留锁目录"
  [[ ! -e "$case_dir/.env.tmp" ]] || fail "初始化失败清理后不应遗留临时文件"
  ! grep -q '^AUTH_MACHINE_API_KEY=' "$case_dir/.env" || fail "未启用的可选机器密钥不应被擅自追加"
  grep -q '^AUTOMAPPER_LICENSE_KEY=PLEASE_CHANGE' "$case_dir/.env" || fail "供应商许可证占位值不应被生成器替换"
  grep -q '^GATEWAY_TENANT_ID=PLEASE_CHANGE' "$case_dir/.env" || fail "真实租户 UUID 不应被生成器伪造"
}

test_bootstrap_production_secrets_refuses_duplicate_keys_without_mutation() {
  local case_dir="$TEST_ROOT/bootstrap-production-secrets-duplicate"
  mkdir -p "$case_dir"
  cp "$PROJECT_ROOT/docker/bootstrap-production-secrets.sh" "$case_dir/bootstrap-production-secrets.sh"
  cp "$PROJECT_ROOT/docker/.env.example" "$case_dir/.env"
  printf '%s\n' 'PG_PASSWORD=second-value-that-must-not-be-used' >> "$case_dir/.env"
  chmod 600 "$case_dir/.env"
  cp "$case_dir/.env" "$case_dir/.env.before"

  local output
  local result_code
  set +e
  output="$(cd "$case_dir" && bash ./bootstrap-production-secrets.sh --env-file .env 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "重复环境变量不应继续写入密钥"
  assert_contains "$output" "PG_PASSWORD 重复定义"
  cmp -s "$case_dir/.env.before" "$case_dir/.env" || fail "重复键失败时 .env 不应被修改"
  [[ ! -e "$case_dir/.env.lock" ]] || fail "重复键失败后不应遗留锁目录"
}

test_bootstrap_production_secrets_refuses_symlink_without_mutation() {
  local case_dir="$TEST_ROOT/bootstrap-production-secrets-symlink"
  mkdir -p "$case_dir"
  cp "$PROJECT_ROOT/docker/bootstrap-production-secrets.sh" "$case_dir/bootstrap-production-secrets.sh"
  cp "$PROJECT_ROOT/docker/.env.example" "$case_dir/real.env"
  chmod 600 "$case_dir/real.env"
  ln -s real.env "$case_dir/.env-link"
  cp "$case_dir/real.env" "$case_dir/real.env.before"

  local output
  local result_code
  set +e
  output="$(cd "$case_dir" && bash ./bootstrap-production-secrets.sh --env-file .env-link 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "符号链接环境文件不应被修改"
  assert_contains "$output" "符号链接"
  cmp -s "$case_dir/real.env.before" "$case_dir/real.env" || fail "符号链接失败时目标 .env 不应被修改"
}

test_setup_rejects_non_production_environment_explicitly() {
  local case_dir="$TEST_ROOT/setup-non-production"
  mkdir -p "$case_dir/bin"
  cp "$PROJECT_ROOT/docker/setup.sh" "$case_dir/setup.sh"
  cp "$PROJECT_ROOT/docker/validate-env.sh" "$case_dir/validate-env.sh"
  sed 's/^FRONTEND_URL=/ASPNETCORE_ENVIRONMENT=Development\nFRONTEND_URL=/' \
    "$TEST_ROOT/valid.env" > "$case_dir/.env"
  chmod 600 "$case_dir/.env"

  # setup.sh 只需要 Docker 的版本探测；测试不启动或修改任何容器。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'if [[ "${1:-}" = "--version" ]]; then exit 0; fi' \
    'if [[ "${1:-}" = "compose" && "${2:-}" = "version" ]]; then exit 0; fi' \
    'exit 0' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  local output
  local result_code
  set +e
  output="$(cd "$case_dir" && PATH="$case_dir/bin:$PATH" bash ./setup.sh 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "非 Production 环境不应进入生产 setup 流程"
  assert_contains "$output" "setup.sh 仅支持 Production"
  [[ ! -d "$case_dir/ssl" ]] || fail "非 Production 环境被拒绝前不应生成 TLS 文件"
  [[ ! -d "$case_dir/mqtt-certs" ]] || fail "非 Production 环境被拒绝前不应生成 MQTT 证书"
}

test_setup_rejects_expired_runtime_certificates() {
  local case_dir="$TEST_ROOT/setup-expired-cert"
  mkdir -p \
    "$case_dir/bin" \
    "$case_dir/ssl" \
    "$case_dir/mqtt-certs" \
    "$case_dir/mosquitto_passwd" \
    "$case_dir/rabbitmq" \
    "$case_dir/prometheus" \
    "$case_dir/grafana/provisioning/datasources" \
    "$case_dir/grafana/provisioning/dashboards"
  cp "$PROJECT_ROOT/docker/setup.sh" "$case_dir/setup.sh"
  cp "$PROJECT_ROOT/docker/validate-env.sh" "$case_dir/validate-env.sh"
  : > "$case_dir/.env.example"
  printf '%s\n' \
    'PG_PASSWORD=postgres-password-long' \
    'REDIS_PASSWORD=redis-password-long' \
    'RABBITMQ_IMAGE=rabbitmq:4.3.4-management-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
    'RABBITMQ_USER=equipai' \
    'RABBITMQ_PASSWORD=rabbitmq-password-long' \
    'JWT_SECRET=jwt-secret-that-is-longer-than-thirty-two-characters' \
    'TOTP_ENCRYPTION_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=' \
    'PII_ENCRYPTION_KEY=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXphYmNkZWY=' \
    'AUTOMAPPER_LICENSE_KEY=automapper-license-key-issued-for-test-only' \
    'GATEWAY_AUTH_KEY=gateway-auth-key-that-is-longer-than-32' \
    'GATEWAY_TENANT_ID=11111111-1111-1111-1111-111111111111' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=mqtt-password-long' \
    'SEED_ADMIN_PASSWORD=admin-password-long' \
    'SEED_LEAD_PASSWORD=lead-password-long' \
    'SEED_TECH_PASSWORD=tech-password-long' \
    'SEED_OPERATOR_PASSWORD=operator-password-long' \
    'SEED_VIEWER_PASSWORD=viewer-password-long' \
    'FRONTEND_URL=https://example.com' \
    'SEQ_ADMIN_PASSWORD=seq-password-long' \
    'GRAFANA_PASSWORD=grafana-password-long' > "$case_dir/.env"
  chmod 600 "$case_dir/.env"

  # Nginx 证书有效但已进入 30 天窗口；setup.sh 不应把它当作成功配置。
  openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
    -keyout "$case_dir/ssl/key.pem" \
    -out "$case_dir/ssl/cert.pem" \
    -subj "/CN=example.com" \
    -addext "subjectAltName=DNS:example.com" >/dev/null 2>&1

  # MQTT 证书保持有效，确保测试只命中过期的 Nginx 证书原因。
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$case_dir/mqtt-certs/ca.key" \
    -out "$case_dir/mqtt-certs/ca.crt" \
    -subj "/CN=EquipSense Test MQTT CA" \
    -addext "basicConstraints=critical,CA:TRUE" >/dev/null 2>&1
  openssl req -newkey rsa:2048 -nodes \
    -keyout "$case_dir/mqtt-certs/server.key" \
    -out "$case_dir/mqtt-certs/server.csr" \
    -subj "/CN=mosquitto" >/dev/null 2>&1
  printf '%s\n' 'subjectAltName=DNS:mosquitto' > "$case_dir/mqtt-certs/server.ext"
  openssl x509 -req \
    -in "$case_dir/mqtt-certs/server.csr" \
    -CA "$case_dir/mqtt-certs/ca.crt" \
    -CAkey "$case_dir/mqtt-certs/ca.key" \
    -CAcreateserial \
    -out "$case_dir/mqtt-certs/server.crt" \
    -days 365 \
    -sha256 \
    -extfile "$case_dir/mqtt-certs/server.ext" >/dev/null 2>&1
  printf '%s\n' 'loadtest:dummy-hash' > "$case_dir/mosquitto_passwd/passwd"

  touch \
    "$case_dir/mosquitto.prod.conf" \
    "$case_dir/mosquitto.conf" \
    "$case_dir/rabbitmq/rabbitmq.conf" \
    "$case_dir/rabbitmq/definitions.json" \
    "$case_dir/rabbitmq/start.sh" \
    "$case_dir/prometheus.yml" \
    "$case_dir/prometheus/rules.yml" \
    "$case_dir/alertmanager.yml" \
    "$case_dir/alertmanager-entrypoint.sh" \
    "$case_dir/grafana/provisioning/datasources/prometheus.yml" \
    "$case_dir/grafana/provisioning/dashboards/dashboard.yml" \
    "$case_dir/docker-compose.yml" \
    "$case_dir/docker-compose.dev.yml" \
    "$case_dir/Dockerfile.backend" \
    "$case_dir/Dockerfile.frontend" \
    "$case_dir/entrypoint.sh" \
    "$case_dir/nginx-entrypoint.sh"
  touch "$case_dir/nginx.conf"

  # setup.sh 只需要 Docker 的版本探测；不启动或修改任何容器。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'if [[ "${1:-}" = "--version" ]]; then exit 0; fi' \
    'if [[ "${1:-}" = "compose" && "${2:-}" = "version" ]]; then exit 0; fi' \
    'exit 0' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  local output
  local result_code
  set +e
  output="$(cd "$case_dir" && PATH="$case_dir/bin:$PATH" bash ./setup.sh 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "已有过期运行时证书时 setup.sh 不应返回成功"
  assert_contains "$output" "Nginx TLS 证书 已过期或将在 30 天内过期"
}

test_setup_rejects_generating_self_signed_certificates_in_production() {
  local case_dir="$TEST_ROOT/setup-production-missing-certs"
  mkdir -p "$case_dir/bin"
  cp "$PROJECT_ROOT/docker/setup.sh" "$case_dir/setup.sh"
  cp "$PROJECT_ROOT/docker/validate-env.sh" "$case_dir/validate-env.sh"
  cp "$TEST_ROOT/valid.env" "$case_dir/.env"
  chmod 600 "$case_dir/.env"

  # setup.sh 只需要 Docker 的版本探测；测试不启动或修改任何容器。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'if [[ "${1:-}" = "--version" ]]; then exit 0; fi' \
    'if [[ "${1:-}" = "compose" && "${2:-}" = "version" ]]; then exit 0; fi' \
    'exit 0' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  local output
  local result_code
  set +e
  output="$(cd "$case_dir" && PATH="$case_dir/bin:$PATH" bash ./setup.sh 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "生产环境缺少运行时证书时 setup.sh 不应自动生成自签名证书"
  assert_contains "$output" "生产环境禁止自动生成自签名 TLS/MQTT 证书"
  [[ ! -d "$case_dir/ssl" ]] || fail "生产环境门禁失败前不应生成 Nginx 自签名证书"
  [[ ! -d "$case_dir/mqtt-certs" ]] || fail "生产环境门禁失败前不应生成 MQTT 自签名证书"
}

test_setup_mosquitto_does_not_expose_password_in_process_arguments() {
  local case_dir="$TEST_ROOT/setup-mosquitto-stdin"
  mkdir -p "$case_dir/bin"
  cp "$PROJECT_ROOT/docker/setup-mosquitto.sh" "$case_dir/setup-mosquitto.sh"
  printf '%s\n' \
    'MQTT_USERNAME=loadtest' \
    'MQTT_PASSWORD=mqtt-password-that-must-not-be-an-argument' > "$case_dir/.env"
  chmod 600 "$case_dir/.env"

  # 伪造官方工具：记录命令行和标准输入，并生成一个最小可用密码文件。
  # 这样可以在不依赖本机 Mosquitto 版本的情况下锁定“密码只能走 stdin”的契约。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'printf "%s\\n" "$*" > "$TEST_CASE_DIR/args"' \
    'cat > "$TEST_CASE_DIR/stdin"' \
    'password_file=""' \
    'previous=""' \
    'for argument in "$@"; do' \
    '  if [[ "$previous" = "-c" ]]; then password_file="$argument"; fi' \
    '  previous="$argument"' \
    'done' \
    'printf "%s\\n" "loadtest:dummy-hash" > "$password_file"' > "$case_dir/bin/mosquitto_passwd"
  chmod +x "$case_dir/bin/mosquitto_passwd"

  local output
  if ! output="$(cd "$case_dir" && TEST_CASE_DIR="$case_dir" PATH="$case_dir/bin:$PATH" bash ./setup-mosquitto.sh 2>&1)"; then
    printf '%s\n' "$output" >&2
    fail "Mosquitto 密码文件配置应成功"
  fi

  [[ "$(cat "$case_dir/args")" != *"mqtt-password-that-must-not-be-an-argument"* ]] \
    || fail "MQTT 密码不得出现在 mosquitto_passwd 命令行参数中"
  [[ "$(cat "$case_dir/stdin")" = $'mqtt-password-that-must-not-be-an-argument\nmqtt-password-that-must-not-be-an-argument' ]] \
    || fail "MQTT 密码必须通过标准输入交给密码工具"

  local rejected_output
  local rejected_code
  set +e
  rejected_output="$(cd "$case_dir" && PATH="$case_dir/bin:$PATH" bash ./setup-mosquitto.sh loadtest forbidden-password 2>&1)"
  rejected_code=$?
  set -e
  [[ "$rejected_code" -ne 0 ]] || fail "通过命令行传递 MQTT 密码时必须拒绝执行"
  assert_contains "$rejected_output" "禁止通过命令行参数传递 MQTT 密码"
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
    '    if [[ "$*" == *"pg_dump"* ]]; then printf "PGDMP\\001\\n"; exit 0; fi' \
    '    if [[ "$*" == *"pg_restore"* ]]; then cat >/dev/null; exit 0; fi' \
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

  local dump_file
  local attachment_file
  dump_file="$(find "$backup_dir" -name '*.dump' -print -quit)"
  attachment_file="$(find "$backup_dir" -name 'attachments_*.tar.gz' -print -quit)"
  [[ -n "$dump_file" ]] || fail "应生成 PostgreSQL custom 备份"
  [[ -n "$attachment_file" ]] || fail "应生成工单附件备份"
  [[ "$(head -c 5 "$dump_file")" = "PGDMP" ]] || fail "PostgreSQL 备份应使用 custom format"
  tar -tzf "$attachment_file" | grep -q 'report.txt' || fail "附件归档中缺少测试文件"
  [[ ! -d "$backup_dir/.backup.lock" ]] || fail "备份成功退出后必须释放单实例锁"

  local backup_mode
  local file_mode
  if stat -c '%a' "$backup_dir" >/dev/null 2>&1; then
    backup_mode="$(stat -c '%a' "$backup_dir")"
    file_mode="$(stat -c '%a' "$dump_file")"
  else
    backup_mode="$(stat -f '%Lp' "$backup_dir")"
    file_mode="$(stat -f '%Lp' "$dump_file")"
  fi
  [[ "$backup_mode" = "700" ]] || fail "备份目录应为 700 权限，实际为 $backup_mode"
  [[ "$file_mode" = "600" ]] || fail "数据库备份文件应为 600 权限，实际为 $file_mode"
}

test_backup_s3_storage_includes_object_prefix() {
  local case_dir="$TEST_ROOT/backup-s3"
  local fake_s3_root="$case_dir/fake-s3"
  local backup_dir="$case_dir/backups"
  mkdir -p "$case_dir/bin" "$fake_s3_root/tenant/work-order" "$backup_dir"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' 'S3 附件备份测试文件' > "$fake_s3_root/tenant/work-order/report.txt"
  printf '%s\n' \
    'PG_PASSWORD=test-password' \
    'PG_CONTAINER=fake-postgres' \
    'BACKUP_REDIS=false' \
    'BACKUP_ATTACHMENTS=true' \
    'FILE_STORAGE_PROVIDER=S3' \
    'FILE_STORAGE_S3_BUCKET=equipsense-attachments' \
    'FILE_STORAGE_S3_REGION=cn-shanghai' \
    'FILE_STORAGE_S3_ENDPOINT=https://s3.example.com' \
    'FILE_STORAGE_S3_ACCESS_KEY=access-key' \
    'FILE_STORAGE_S3_SECRET_KEY=secret-key' \
    'FILE_STORAGE_S3_KEY_PREFIX=attachments' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\n" ;;' \
    '  exec)' \
    '    if [[ "$*" == *"pg_dump"* ]]; then printf "PGDMP\\001\\n"; exit 0; fi' \
    '    if [[ "$*" == *"pg_restore"* ]]; then cat >/dev/null; exit 0; fi' \
    '    exit 1 ;;' \
    '  *) exit 1 ;;' \
    'esac' > "$case_dir/bin/docker"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    '[[ "${1:-}" = "s3" && "${2:-}" = "sync" ]] || exit 1' \
    'cp -R "$FAKE_S3_ROOT/." "$4/"' > "$case_dir/bin/aws"
  chmod +x "$case_dir/bin/docker" "$case_dir/bin/aws"

  if ! PATH="$case_dir/bin:$PATH" FAKE_S3_ROOT="$fake_s3_root" \
    bash "$case_dir/backup.sh" > "$case_dir/backup.log" 2>&1; then
    cat "$case_dir/backup.log" >&2
    fail "S3 附件存储模式应从对象前缀生成归档"
  fi

  local attachment_file
  attachment_file="$(find "$backup_dir" -name 'attachments_*.tar.gz' -print -quit)"
  [[ -n "$attachment_file" ]] || fail "S3 模式应生成工单附件备份"
  tar -tzf "$attachment_file" | grep -q 'tenant/work-order/report.txt' \
    || fail "S3 对象前缀归档中缺少租户附件"
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

test_backup_rejects_invalid_retention_config() {
  local case_dir="$TEST_ROOT/backup-invalid-retention"
  local backup_dir="$case_dir/backups"
  mkdir -p "$case_dir/bin"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' \
    'PG_PASSWORD=test-password-long' \
    'BACKUP_REDIS=false' \
    'BACKUP_ATTACHMENTS=false' \
    'RETAIN_DAYS=not-a-number' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  local output
  local result_code
  set +e
  output="$(PATH="$case_dir/bin:$PATH" bash "$case_dir/backup.sh" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "非法 RETAIN_DAYS 不应让备份脚本成功"
  assert_contains "$output" "RETAIN_DAYS 必须是大于 0 的整数"
}

test_backup_skips_remote_sync_after_local_failure() {
  local case_dir="$TEST_ROOT/backup-partial-remote-sync"
  local backup_dir="$case_dir/backups"
  local aws_log="$case_dir/aws.log"
  mkdir -p "$case_dir/bin"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' \
    'PG_PASSWORD=test-password-long' \
    'PG_CONTAINER=missing-postgres' \
    'BACKUP_REDIS=false' \
    'BACKUP_ATTACHMENTS=false' \
    'S3_SYNC=true' \
    'S3_BUCKET=s3://equipsense-backups' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'case "${1:-}" in' \
    '  ps) printf "unrelated-container\\n" ;;' \
    '  *) exit 1 ;;' \
    'esac' > "$case_dir/bin/docker"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'printf "%s\\n" "$*" >> "$BACKUP_AWS_LOG"' \
    'exit 0' > "$case_dir/bin/aws"
  chmod +x "$case_dir/bin/docker" "$case_dir/bin/aws"

  local output
  local result_code
  set +e
  output="$(PATH="$case_dir/bin:$PATH" BACKUP_AWS_LOG="$aws_log" bash "$case_dir/backup.sh" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "本地备份失败时整体备份不应成功"
  assert_contains "$output" "本地备份不完整，跳过 S3 同步"
  [[ ! -f "$aws_log" ]] || fail "本地备份失败时不应把不完整目录同步到 S3"
}

test_backup_rejects_enabled_redis_without_password() {
  local case_dir="$TEST_ROOT/backup-redis-no-password"
  local backup_dir="$case_dir/backups"
  mkdir -p "$case_dir/bin"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' \
    'PG_PASSWORD=test-password-long' \
    'PG_CONTAINER=fake-postgres' \
    'BACKUP_REDIS=true' \
    'BACKUP_ATTACHMENTS=false' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\n" ;;' \
    '  exec)' \
    '    if [[ "$*" == *"pg_dump"* ]]; then printf "PGDMP\\001\\n"; exit 0; fi' \
    '    if [[ "$*" == *"pg_restore"* ]]; then cat >/dev/null; exit 0; fi' \
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

  [[ "$result_code" -ne 0 ]] || fail "启用 Redis 备份但缺少密码时不应返回成功"
  assert_contains "$output" "BACKUP_REDIS=true 但 REDIS_PASSWORD 未设置"
}

test_backup_rejects_requested_redis_failure() {
  local case_dir="$TEST_ROOT/backup-redis"
  local backup_dir="$case_dir/backups"
  mkdir -p "$case_dir/bin"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' \
    'PG_PASSWORD=test-password-long' \
    'PG_CONTAINER=fake-postgres' \
    'REDIS_CONTAINER=fake-redis' \
    'REDIS_PASSWORD=redis-password-long' \
    'BACKUP_REDIS=true' \
    'BACKUP_ATTACHMENTS=false' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  # PostgreSQL 成功、Redis BGSAVE 失败；显式启用 Redis 备份时整体结果必须失败。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\nfake-redis\\n" ;;' \
    '  exec)' \
    '    if [[ "$*" == *"pg_dump"* ]]; then printf "CREATE TABLE backup_test;\\n"; exit 0; fi' \
    '    if [[ "$*" == *"pg_restore"* ]]; then exit 0; fi' \
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

test_backup_uses_configured_redis_container_and_waits_for_snapshot() {
  local case_dir="$TEST_ROOT/backup-redis-container"
  local backup_dir="$case_dir/backups"
  local docker_log="$case_dir/docker.log"
  local redis_state="$case_dir/redis-state"
  mkdir -p "$case_dir/bin"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' \
    'PG_PASSWORD=test-password-long' \
    'PG_CONTAINER=fake-postgres' \
    'REDIS_CONTAINER=fake-redis' \
    'REDIS_PASSWORD=redis-password-long' \
    'BACKUP_REDIS=true' \
    'BACKUP_ATTACHMENTS=false' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'printf "%s\\n" "$*" >> "$BACKUP_DOCKER_LOG"' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\nfake-redis\\n" ;;' \
    '  exec)' \
    '    if [[ "$*" == *"pg_dump"* ]]; then printf "PGDMP\\001\\n"; exit 0; fi' \
    '    if [[ "$*" == *"pg_restore"* ]]; then cat >/dev/null; exit 0; fi' \
    '    if [[ "$*" == *"redis-cli"* && "$*" == *"LASTSAVE"* ]]; then' \
    '      if [[ -f "$BACKUP_REDIS_STATE" ]]; then printf "101\\n"; else printf "100\\n"; fi; exit 0' \
    '    fi' \
    '    if [[ "$*" == *"redis-cli"* && "$*" == *"BGSAVE"* ]]; then : > "$BACKUP_REDIS_STATE"; printf "Background saving started\\n"; exit 0; fi' \
    '    if [[ "$*" == *"redis-cli"* && "$*" == *"INFO persistence"* ]]; then printf "# Persistence\\r\\nrdb_bgsave_in_progress:0\\r\\nrdb_last_bgsave_status:ok\\r\\n"; exit 0; fi' \
    '    exit 1 ;;' \
    '  cp)' \
    '    [[ "$2" == fake-redis:/data/dump.rdb ]] || exit 1' \
    '    printf "REDIS0009" > "$3" ;;' \
    '  *) exit 1 ;;' \
    'esac' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  local output
  if ! output="$(PATH="$case_dir/bin:$PATH" \
    BACKUP_DOCKER_LOG="$docker_log" \
    BACKUP_REDIS_STATE="$redis_state" \
    bash "$case_dir/backup.sh" 2>&1)"; then
    printf '%s\n' "$output" >&2
    fail "配置自定义 Redis 容器后，快照备份应成功"
  fi

  local redis_file
  redis_file="$(find "$backup_dir" -name 'redis_*.rdb' -print -quit)"
  [[ -n "$redis_file" ]] || fail "应生成 Redis RDB 备份"
  [[ "$(head -c 5 "$redis_file")" = "REDIS" ]] || fail "Redis 备份应包含 RDB 文件头"
  grep -q 'fake-redis' "$docker_log" || fail "备份应使用 REDIS_CONTAINER 配置，而不是硬编码容器名"
  grep -q 'INFO persistence' "$docker_log" || fail "备份复制前应等待 Redis 后台快照完成"
}

test_backup_does_not_expose_credentials_in_docker_arguments() {
  local case_dir="$TEST_ROOT/backup-credential-arguments"
  local backup_dir="$case_dir/backups"
  local docker_log="$case_dir/docker.log"
  mkdir -p "$case_dir/bin"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' \
    'PG_PASSWORD=pg-secret-that-must-not-be-logged' \
    'PG_CONTAINER=fake-postgres' \
    'REDIS_CONTAINER=fake-redis' \
    'REDIS_PASSWORD=redis-secret-that-must-not-be-logged' \
    'BACKUP_REDIS=true' \
    'BACKUP_ATTACHMENTS=false' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  # 记录 Docker CLI 实际收到的参数；真实密码不应出现在命令参数或调用日志中。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'printf "%s\\n" "$*" >> "$BACKUP_DOCKER_LOG"' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\nfake-redis\\n" ;;' \
    '  exec)' \
    '    if [[ "$*" == *"pg_dump"* ]]; then read -r supplied_password; [[ "$supplied_password" = "pg-secret-that-must-not-be-logged" ]]; printf "PGDMP\\001\\n"; exit 0; fi' \
    '    if [[ "$*" == *"pg_restore"* ]]; then cat >/dev/null; exit 0; fi' \
    '    if [[ "$*" == *"redis-cli"* && "$*" == *"BGSAVE"* ]]; then read -r supplied_password; [[ "$supplied_password" = "redis-secret-that-must-not-be-logged" ]]; exit 0; fi' \
    '    if [[ "$*" == *"redis-cli"* && "$*" == *"INFO persistence"* ]]; then read -r supplied_password; [[ "$supplied_password" = "redis-secret-that-must-not-be-logged" ]]; printf "rdb_bgsave_in_progress:0\\r\\nrdb_last_bgsave_status:ok\\r\\n"; exit 0; fi' \
    '    exit 1 ;;' \
    '  cp) printf "REDIS0009" > "$3" ;;' \
    '  *) exit 1 ;;' \
    'esac' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  if ! PATH="$case_dir/bin:$PATH" BACKUP_DOCKER_LOG="$docker_log" \
    bash "$case_dir/backup.sh" > "$case_dir/backup.log" 2>&1; then
    cat "$case_dir/backup.log" >&2
    fail "备份脚本应在凭据通过标准输入传递时成功完成"
  fi

  ! grep -Fq 'pg-secret-that-must-not-be-logged' "$docker_log" \
    || fail "PostgreSQL 密码不应出现在 docker exec 参数中"
  ! grep -Fq 'redis-secret-that-must-not-be-logged' "$docker_log" \
    || fail "Redis 密码不应出现在 docker exec 参数中"
  ! grep -Fq 'PGPASSWORD=' "$docker_log" \
    || fail "PostgreSQL 密码不应通过 docker exec -e 传递"
  ! grep -Fq 'REDISCLI_AUTH=' "$docker_log" \
    || fail "Redis 密码不应通过 docker exec -e 传递"
}

test_backup_rejects_retention_cleanup_failure() {
  local case_dir="$TEST_ROOT/backup-retention-cleanup-failure"
  local backup_dir="$case_dir/backups"
  mkdir -p "$case_dir/bin"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' \
    'PG_PASSWORD=test-password-long' \
    'PG_CONTAINER=fake-postgres' \
    'BACKUP_REDIS=false' \
    'BACKUP_ATTACHMENTS=false' \
    'RETAIN_DAYS=7' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\n" ;;' \
    '  exec)' \
    '    if [[ "$*" == *"pg_dump"* ]]; then printf "PGDMP\\001\\n"; exit 0; fi' \
    '    if [[ "$*" == *"pg_restore"* ]]; then cat >/dev/null; exit 0; fi' \
    '    exit 1 ;;' \
    '  *) exit 1 ;;' \
    'esac' > "$case_dir/bin/docker"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'exit 42' > "$case_dir/bin/find"
  chmod +x "$case_dir/bin/docker" "$case_dir/bin/find"

  local output
  local result_code
  set +e
  output="$(PATH="$case_dir/bin:$PATH" bash "$case_dir/backup.sh" 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "旧备份清理失败时整体备份不应返回成功"
  assert_contains "$output" "旧备份清理失败"
}

test_backup_rejects_overlapping_runs() {
  local case_dir="$TEST_ROOT/backup-overlap"
  local backup_dir="$case_dir/backups"
  mkdir -p "$case_dir/bin" "$backup_dir/.backup.lock"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' \
    'PG_PASSWORD=test-password-long' \
    'PG_CONTAINER=fake-postgres' \
    'BACKUP_REDIS=false' \
    'BACKUP_ATTACHMENTS=false' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"
  printf '%s\n' '999999' > "$backup_dir/.backup.lock/pid"

  # Docker 即使可用，也不应在检测到已有锁后开始导出。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\n" ;;' \
    '  exec)' \
    '    if [[ "$*" == *"pg_dump"* ]]; then printf "PGDMP\\001\\n"; exit 0; fi' \
    '    if [[ "$*" == *"pg_restore"* ]]; then cat >/dev/null; exit 0; fi' \
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

  [[ "$result_code" -ne 0 ]] || fail "重叠备份任务不应返回成功"
  assert_contains "$output" "已有备份任务"
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

create_custom_restore_fixture() {
  local case_dir="$1"
  : > "$case_dir/.env"
  chmod 600 "$case_dir/.env"
  printf 'PGDMP\\001\\014' > "$case_dir/database.dump"
  chmod 600 "$case_dir/database.dump"
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

test_restore_does_not_execute_env_file() {
  local case_dir="$TEST_ROOT/restore-env-data"
  mkdir -p "$case_dir/bin"
  create_restore_fixtures "$case_dir"
  printf '%s\n' '$(touch "$RESTORE_ENV_EXECUTED")' >> "$case_dir/.env"

  local output
  output="$(PATH="$case_dir/bin:$PATH" RESTORE_ENV_EXECUTED="$case_dir/env-executed" \
    bash "$PROJECT_ROOT/docker/restore.sh" \
      --env-file "$case_dir/.env" \
      --db-backup "$case_dir/database.sql.gz" \
      --attachments-backup "$case_dir/attachments.tar.gz" 2>&1)" \
    || fail "配置文件仅作为数据读取时，恢复 dry-run 应成功"

  assert_contains "$output" "dry-run"
  [[ ! -f "$case_dir/env-executed" ]] || fail "restore.sh 不应把 .env 当作 Shell 脚本执行"
}

test_restore_dry_run_accepts_custom_backup() {
  local case_dir="$TEST_ROOT/restore-custom-dry-run"
  mkdir -p "$case_dir/bin"
  create_custom_restore_fixture "$case_dir"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    ': > "$RESTORE_DOCKER_CALLED"' \
    'exit 99' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  local output
  output="$(PATH="$case_dir/bin:$PATH" RESTORE_DOCKER_CALLED="$case_dir/docker-called" \
    bash "$PROJECT_ROOT/docker/restore.sh" \
      --env-file "$case_dir/.env" \
      --db-backup "$case_dir/database.dump" \
      --skip-attachments 2>&1)" \
    || fail "合法 custom 备份的 dry-run 应成功"

  assert_contains "$output" "dry-run"
  [[ ! -f "$case_dir/docker-called" ]] || fail "custom 备份 dry-run 不应调用 Docker"
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
  [[ ! -d "$case_dir/.env.restore.lock" ]] || fail "恢复成功退出后必须释放单实例锁"
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

test_restore_s3_storage_syncs_back_to_object_prefix() {
  local case_dir="$TEST_ROOT/restore-s3"
  local docker_log="$case_dir/docker.log"
  local fake_s3_target="$case_dir/fake-s3-target"
  mkdir -p "$case_dir/bin" "$fake_s3_target"
  create_restore_fixtures "$case_dir"
  : > "$case_dir/compose.yml"
  printf '%s\n' \
    'FILE_STORAGE_PROVIDER=S3' \
    'FILE_STORAGE_S3_BUCKET=equipsense-attachments' \
    'FILE_STORAGE_S3_REGION=cn-shanghai' \
    'FILE_STORAGE_S3_ENDPOINT=https://s3.example.com' \
    'FILE_STORAGE_S3_ACCESS_KEY=access-key' \
    'FILE_STORAGE_S3_SECRET_KEY=secret-key' \
    'FILE_STORAGE_S3_KEY_PREFIX=attachments' >> "$case_dir/.env"

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
    'set -euo pipefail' \
    '[[ "${1:-}" = "s3" && "${2:-}" = "sync" ]] || exit 1' \
    'cp -R "$3/." "$FAKE_S3_TARGET/"' > "$case_dir/bin/aws"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'exit 0' > "$case_dir/bin/curl"
  chmod +x "$case_dir/bin/docker" "$case_dir/bin/aws" "$case_dir/bin/curl"

  local output
  if ! output="$(PATH="$case_dir/bin:$PATH" FAKE_S3_TARGET="$fake_s3_target" RESTORE_DOCKER_LOG="$docker_log" \
    bash "$PROJECT_ROOT/docker/restore.sh" \
      --env-file "$case_dir/.env" \
      --compose-file "$case_dir/compose.yml" \
      --db-backup "$case_dir/database.sql.gz" \
      --attachments-backup "$case_dir/attachments.tar.gz" \
      --confirm 2>&1)"; then
    printf '%s\n' "$output" >&2
    fail "S3 附件恢复应同步回对象前缀"
  fi

  assert_contains "$output" "S3 工单附件已恢复"
  [[ -f "$fake_s3_target/report.txt" ]] || fail "S3 恢复未写入对象存储目标"
  ! grep -q 'run --rm --no-deps --entrypoint /bin/sh backend' "$docker_log" \
    || fail "S3 模式不应清理本地附件卷"
}

test_restore_confirm_uses_custom_format_and_timescale_lifecycle() {
  local case_dir="$TEST_ROOT/restore-custom-confirm"
  local docker_log="$case_dir/docker.log"
  mkdir -p "$case_dir/bin"
  create_custom_restore_fixture "$case_dir"
  : > "$case_dir/compose.yml"

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
      --db-backup "$case_dir/database.dump" \
      --skip-attachments --confirm 2>&1)"; then
    printf '%s\n' "$output" >&2
    fail "合法 custom 备份的 confirm 恢复应成功完成模拟流程"
  fi

  assert_contains "$output" "恢复完成"
  grep -q 'timescaledb_pre_restore' "$docker_log" \
    || fail "恢复前必须进入 TimescaleDB restoring 模式"
  grep -q 'pg_restore' "$docker_log" \
    || fail "custom format 必须使用 pg_restore 恢复"
  grep -q -- '--exit-on-error' "$docker_log" \
    || fail "pg_restore 必须遇到错误立即失败"
  ! grep -q -- ' -j' "$docker_log" \
    || fail "TimescaleDB 恢复不应使用并行 pg_restore"
  grep -q 'timescaledb_post_restore' "$docker_log" \
    || fail "恢复后必须退出 TimescaleDB restoring 模式"
  grep -q 'ANALYZE' "$docker_log" \
    || fail "恢复后应更新数据库统计信息"
}

test_restore_failure_exits_timescale_restore_mode() {
  local case_dir="$TEST_ROOT/restore-custom-failure"
  local docker_log="$case_dir/docker.log"
  mkdir -p "$case_dir/bin"
  create_custom_restore_fixture "$case_dir"
  : > "$case_dir/compose.yml"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'printf "%s\\n" "$*" >> "$RESTORE_DOCKER_LOG"' \
    'if [[ "${1:-}" = "inspect" ]]; then printf "true\\n"; exit 0; fi' \
    '[[ "${1:-}" = "compose" ]] || exit 1' \
    'if [[ "$*" == *" ps -q postgres"* ]]; then printf "fake-postgres\\n"; exit 0; fi' \
    'if [[ "$*" == *" pg_restore "* ]]; then cat >/dev/null; exit 42; fi' \
    'if [[ "$*" == *" exec -T postgres "* ]]; then cat >/dev/null; printf "1\\n"; exit 0; fi' \
    'exit 0' > "$case_dir/bin/docker"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'exit 0' > "$case_dir/bin/curl"
  chmod +x "$case_dir/bin/docker" "$case_dir/bin/curl"

  local output
  local result_code
  set +e
  output="$(PATH="$case_dir/bin:$PATH" RESTORE_DOCKER_LOG="$docker_log" \
    bash "$PROJECT_ROOT/docker/restore.sh" \
      --env-file "$case_dir/.env" \
      --compose-file "$case_dir/compose.yml" \
      --db-backup "$case_dir/database.dump" \
      --skip-attachments --confirm 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "pg_restore 失败时恢复必须返回非零"
  assert_contains "$output" "恢复异常"
  [[ ! -d "$case_dir/.env.restore.lock" ]] || fail "恢复失败退出后也必须释放单实例锁"
  grep -q 'timescaledb_pre_restore' "$docker_log" \
    || fail "恢复失败测试必须确认曾进入 TimescaleDB restoring 模式"
  grep -q 'timescaledb_post_restore' "$docker_log" \
    || fail "pg_restore 失败后必须尝试退出 TimescaleDB restoring 模式"
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

test_restore_rejects_overlapping_confirm_runs() {
  local case_dir="$TEST_ROOT/restore-overlap"
  local docker_called="$case_dir/docker-called"
  mkdir -p "$case_dir/bin"
  create_custom_restore_fixture "$case_dir"
  : > "$case_dir/compose.yml"
  mkdir "$case_dir/.env.restore.lock"
  printf '%s\n' '999999' > "$case_dir/.env.restore.lock/pid"

  printf '%s\n' \
    '#!/usr/bin/env bash' \
    ': > "$RESTORE_DOCKER_CALLED"' \
    'exit 0' > "$case_dir/bin/docker"
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'exit 0' > "$case_dir/bin/curl"
  chmod +x "$case_dir/bin/docker" "$case_dir/bin/curl"

  local output
  local result_code
  set +e
  output="$(PATH="$case_dir/bin:$PATH" RESTORE_DOCKER_CALLED="$docker_called" \
    bash "$PROJECT_ROOT/docker/restore.sh" \
      --env-file "$case_dir/.env" \
      --compose-file "$case_dir/compose.yml" \
      --db-backup "$case_dir/database.dump" \
      --skip-attachments --confirm 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "重叠的确认恢复任务不应返回成功"
  assert_contains "$output" "已有恢复任务"
  [[ ! -f "$docker_called" ]] || fail "检测到恢复锁后不应调用 Docker"
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
    'counter_file="$DEPLOY_CURL_COUNTER"' \
    'codes="${DEPLOY_CURL_CODES:-200}"' \
    'if [[ "$*" == *"8081/health"* ]]; then counter_file="$DEPLOY_EDGE_CURL_COUNTER"; codes="${DEPLOY_EDGE_CURL_CODES:-200}"; fi' \
    'counter=0' \
    'if [[ -f "$counter_file" ]]; then counter="$(cat "$counter_file")"; fi' \
    'counter=$((counter + 1))' \
    'printf "%s\\n" "$counter" > "$counter_file"' \
    'code="$(printf "%s" "$codes" | cut -d, -f"$counter")"' \
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
    DEPLOY_EDGE_CURL_COUNTER="$case_dir/edge-curl-counter" \
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

test_deploy_rejects_overlapping_runs() {
  local case_dir="$TEST_ROOT/deploy-overlap"
  local docker_log="$case_dir/docker.log"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"
  mkdir "$case_dir/.deploy.lock"
  printf '%s\n' '999999' > "$case_dir/.deploy.lock/pid"

  local output
  local result_code
  set +e
  output="$(DEPLOY_DOCKER_LOG="$docker_log" \
    run_deploy_fixture "$case_dir" 2.0.0 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "重叠部署任务不应返回成功"
  assert_contains "$output" "已有部署任务"
  [[ ! -s "$docker_log" ]] || fail "检测到部署锁后不应调用 Docker"
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
  [[ ! -d "$case_dir/.deploy.lock" ]] || fail "部署成功退出后必须释放单实例锁"
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

test_deploy_uses_edge_port_from_env_for_health_check() {
  local case_dir="$TEST_ROOT/deploy-custom-edge-port"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"
  printf '%s\n' 'EDGE_PORT=18081' > "$case_dir/.env"
  chmod 600 "$case_dir/.env"
  printf '%s\n' '1.0.0' > "$case_dir/.last-deployed-tag"

  if ! DEPLOY_CURL_CODES=200 run_deploy_fixture "$case_dir" 2.0.0 >/dev/null 2>&1; then
    fail "自定义边缘端口配置正确时部署应成功"
  fi

  grep -q 'localhost:18081/health' "$case_dir/curl.log" \
    || fail "部署健康检查必须读取 .env 中的 EDGE_PORT"
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
  [[ ! -d "$case_dir/.deploy.lock" ]] || fail "部署失败回滚后必须释放单实例锁"
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

test_deploy_edgegateway_health_failure_also_rolls_back() {
  local case_dir="$TEST_ROOT/deploy-edgegateway-health-rollback"
  create_deploy_fixtures "$case_dir"
  create_deploy_runtime_doubles "$case_dir"
  printf '%s\n' '1.0.0' > "$case_dir/.last-deployed-tag"

  local output
  local result_code
  set +e
  output="$(DEPLOY_CURL_CODES=200,200 DEPLOY_EDGE_CURL_CODES=503,200 \
    run_deploy_fixture "$case_dir" 2.0.0 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "边缘网关不健康时部署必须失败并回滚"
  assert_contains "$output" "回滚验证通过"
  grep -q '^1.0.0|.* up .*--pull never.*backend frontend edgegateway' "$case_dir/docker.log" \
    || fail "边缘网关健康失败后也必须回滚三个应用服务"
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
  assert_contains "$release_block" "needs: [backend, frontend, production-smoke]"

  local deploy_block
  deploy_block="$(sed -n '/^  deploy:/,/^  load-test:/p' "$PROJECT_ROOT/.github/workflows/ci.yml")"
  assert_contains "$deploy_block" "needs: [release]"
}

test_ci_build_disables_unreliable_build_servers() {
  local ci_content
  ci_content="$(cat "$PROJECT_ROOT/.github/workflows/ci.yml")"
  assert_contains "$ci_content" "dotnet build EquipAI.sln --configuration Release --no-restore -m:1 --disable-build-servers"

  local codeql_content
  codeql_content="$(cat "$PROJECT_ROOT/.github/workflows/codeql.yml")"
  assert_contains "$codeql_content" "dotnet build EquipAI.sln --configuration Release --no-restore -m:1 --disable-build-servers"
}

test_docker_build_context_excludes_local_artifacts_and_secrets() {
  [[ -f "$PROJECT_ROOT/.dockerignore" ]] || fail "Docker 构建必须有根目录 .dockerignore"

  local dockerignore_content
  dockerignore_content="$(cat "$PROJECT_ROOT/.dockerignore")"
  for ignored_path in frontend/node_modules docker/.env docker/mqtt-certs docker/mosquitto_passwd '**/bin' '**/obj'; do
    assert_contains "$dockerignore_content" "$ignored_path"
  done
}

test_docker_backend_build_is_reproducible() {
  local dockerfile_content
  dockerfile_content="$(cat "$PROJECT_ROOT/docker/Dockerfile.backend")"
  assert_contains "$dockerfile_content" "COPY global.json Directory.Build.props ./"
  assert_contains "$dockerfile_content" "--no-restore"
}

test_nginx_does_not_log_signalr_query_tokens() {
  local nginx_content bluegreen_content
  nginx_content="$(cat "$PROJECT_ROOT/docker/nginx.conf")"
  bluegreen_content="$(cat "$PROJECT_ROOT/docker/nginx.bluegreen.conf")"

  local nginx_hub_block bluegreen_hub_block
  nginx_hub_block="$(sed -n '/location \/hubs\//,/^    }/p' "$PROJECT_ROOT/docker/nginx.conf")"
  bluegreen_hub_block="$(sed -n '/location \/hubs\//,/^    }/p' "$PROJECT_ROOT/docker/nginx.bluegreen.conf")"
  assert_contains "$nginx_hub_block" "access_log off;"
  assert_contains "$bluegreen_hub_block" "access_log off;"
  assert_contains "$nginx_content" "非浏览器兼容客户端可能把 access_token 放在 query string"
  assert_contains "$bluegreen_content" "非浏览器兼容客户端可能把 access_token 放在 query string"
}

test_frontend_runtime_installs_certificate_check_dependency() {
  local dockerfile_content
  dockerfile_content="$(cat "$PROJECT_ROOT/docker/Dockerfile.frontend")"
  assert_contains "$dockerfile_content" "apk add --no-cache openssl"
}

test_frontend_runtime_rejects_self_signed_certificate_in_production() {
  local compose_content entrypoint_content
  compose_content="$(sed -n '/^  frontend:/,/^  seq:/p' "$PROJECT_ROOT/docker/docker-compose.yml")"
  entrypoint_content="$(cat "$PROJECT_ROOT/docker/nginx-entrypoint.sh")"

  # 直接执行生产 Compose 时不能依赖宿主机先运行 setup.sh；Nginx 入口必须自行拒绝自签名证书。
  assert_contains "$compose_content" 'APP_ENVIRONMENT: "${ASPNETCORE_ENVIRONMENT:-Production}"'
  assert_contains "$entrypoint_content" 'APP_ENVIRONMENT="${APP_ENVIRONMENT:-Production}"'
  assert_contains "$entrypoint_content" 'CERT_ISSUER'
  assert_contains "$entrypoint_content" 'Nginx 生产环境禁止使用自签名证书'
  assert_contains "$entrypoint_content" 'exit 1'
}

test_docker_edgegateway_build_is_reproducible() {
  local dockerfile_content
  dockerfile_content="$(cat "$PROJECT_ROOT/docker/Dockerfile.edgegateway")"
  assert_contains "$dockerfile_content" "COPY global.json Directory.Build.props ./"
  assert_contains "$dockerfile_content" "--no-restore"
}

test_edgegateway_production_runtime_contract() {
  local compose_content options_content program_content
  compose_content="$(cat "$PROJECT_ROOT/docker/docker-compose.yml")"
  options_content="$(cat "$PROJECT_ROOT/src/EquipAI.EdgeGateway/GatewayOptions.cs")"
  program_content="$(cat "$PROJECT_ROOT/src/EquipAI.EdgeGateway/Program.cs")"

  assert_contains "$compose_content" 'DOTNET_ENVIRONMENT: "${ASPNETCORE_ENVIRONMENT:-Production}"'
  assert_contains "$compose_content" 'Gateway__BufferPath: "${GATEWAY_BUFFER_PATH:-/data/buffer.db}"'
  assert_contains "$compose_content" 'GATEWAY_TENANT_ID'
  assert_contains "$compose_content" 'edgegateway_data:/data'
  assert_contains "$options_content" 'public string BufferPath'
  assert_contains "$program_content" 'GatewayConfigurationValidator.Validate'
  assert_contains "$program_content" 'sp.GetRequiredService<GatewayOptions>().HealthPort'
  assert_contains "$program_content" 'Environment.ExitCode = 1'
}

test_edgegateway_release_and_deploy_contract() {
  local production_compose
  production_compose="$(cat "$PROJECT_ROOT/docker/docker-compose.prod.yml")"
  assert_contains "$production_compose" 'edgegateway:'
  assert_contains "$production_compose" 'ghcr.io/yqghlx/equipsense/edgegateway:${TAG:?请设置 TAG 环境变量（如 1.2.0）}'
  assert_contains "$production_compose" 'edgegateway'
  assert_contains "$production_compose" 'build: !reset null'
  assert_contains "$production_compose" 'pull_policy: always'

  local ci_content docker_block release_block
  ci_content="$(cat "$PROJECT_ROOT/.github/workflows/ci.yml")"
  docker_block="$(sed -n '/^  docker:/,/^  production-smoke:/p' "$PROJECT_ROOT/.github/workflows/ci.yml")"
  release_block="$(sed -n '/^  release:/,/^  deploy:/p' "$PROJECT_ROOT/.github/workflows/ci.yml")"
  assert_contains "$docker_block" 'id: meta-edgegateway'
  assert_contains "$docker_block" 'file: docker/Dockerfile.edgegateway'
  assert_contains "$docker_block" 'edgegateway:sha-${{ steps.sha.outputs.short }}'
  assert_contains "$release_block" 'id: meta-edgegateway'
  assert_contains "$release_block" 'file: docker/Dockerfile.edgegateway'
  assert_contains "$release_block" 'edgegateway:${{ steps.meta-edgegateway.outputs.version }}'
  assert_contains "$ci_content" 'Trivy 扫描边缘网关镜像'

  local deploy_script
  deploy_script="$(cat "$PROJECT_ROOT/docker/deploy-production.sh")"
  assert_contains "$deploy_script" 'DEPLOY_EDGE_HEALTH_URL'
  assert_contains "$deploy_script" 'pull backend frontend edgegateway'
  assert_contains "$deploy_script" 'backend frontend edgegateway'
  assert_contains "$deploy_script" 'ps backend frontend edgegateway'
}

test_production_runtime_smoke_gate_is_wired() {
  [[ -x "$PROJECT_ROOT/tests/scripts/production-runtime-smoke.sh" ]] \
    || fail "Production runtime smoke 脚本必须存在且可执行"
  [[ -f "$PROJECT_ROOT/docker/docker-compose.smoke.yml" ]] \
    || fail "Production runtime smoke 必须有独立 Compose 镜像覆盖"

  local smoke_compose
  smoke_compose="$(cat "$PROJECT_ROOT/docker/docker-compose.smoke.yml")"
  assert_contains "$smoke_compose" "build: !reset null"
  for service in postgres redis mosquitto rabbitmq backend edgegateway frontend; do
    assert_contains "$smoke_compose" "${service}:"
    assert_contains "$smoke_compose" "container_name: !reset null"
  done
  assert_contains "$smoke_compose" "SMOKE_BACKEND_IMAGE"
  assert_contains "$smoke_compose" "SMOKE_FRONTEND_IMAGE"
  assert_contains "$smoke_compose" "SMOKE_EDGEGATEWAY_IMAGE"
  assert_contains "$smoke_compose" "ports: !reset []"

  local smoke_script
  smoke_script="$(cat "$PROJECT_ROOT/tests/scripts/production-runtime-smoke.sh")"
  assert_contains "$smoke_script" "SEED_VIEWER_PASSWORD"
  assert_contains "$smoke_script" "/api/v1/auth/login"
  assert_contains "$smoke_script" "/api/v1/auth/me"
  assert_contains "$smoke_script" "SMOKE_EDGEGATEWAY_IMAGE"
  assert_contains "$smoke_script" "SMOKE_PORT_BASE"
  assert_contains "$smoke_script" "SMOKE_PG_PORT"
  assert_contains "$smoke_script" "lsof"
  assert_contains "$smoke_script" "/data/buffer.db"
  assert_contains "$smoke_script" "/api/v1/gateways"
  assert_contains "$smoke_script" "jq -r"
  assert_contains "$smoke_script" "SMOKE_RUN_E2E"
  assert_contains "$smoke_script" 'MFA_BOOTSTRAP_MACHINE_API_KEY="$AUTH_MACHINE_API_KEY"'
  assert_contains "$smoke_script" 'X-API-Key: $AUTH_MACHINE_API_KEY'
  assert_contains "$smoke_script" "smoke-ca"
  assert_contains "$smoke_script" "openssl x509 -req"
  [[ "$smoke_script" != *'bash "$RUNTIME_DOCKER/generate-cert.sh"'* ]] \
    || fail "Production smoke 不得使用自签名 Nginx 证书生成脚本"
  assert_contains "$(cat "$PROJECT_ROOT/frontend/e2e-comprehensive/helpers/auth.ts")" 'PLAYWRIGHT_MACHINE_API_KEY'
  for direct_login_file in \
    frontend/e2e-comprehensive/01-auth/force-password-change.spec.ts \
    frontend/e2e-comprehensive/99-manual-audit/page-audit.spec.ts \
    frontend/e2e-comprehensive/99-manual-audit/data-integrity.spec.ts \
    frontend/e2e-comprehensive/99-manual-audit/alert-pipeline.spec.ts \
    frontend/e2e-comprehensive/99-manual-audit/permission-boundary.spec.ts; do
    assert_contains "$(cat "$PROJECT_ROOT/$direct_login_file")" 'MACHINE_API_HEADERS'
  done
  assert_contains "$smoke_script" "playwright test e2e-comprehensive"
  assert_contains "$smoke_script" "printf '%s\\n%s\\n' \"\$MQTT_PASSWORD\" \"\$MQTT_PASSWORD\""
  [[ "$smoke_script" != *"mosquitto_passwd -c -b"* ]] \
    || fail "Production smoke 不得使用 -b 参数暴露 MQTT 密码"
  [[ "$smoke_script" != *'mosquitto_passwd -c /work/passwd "$MQTT_USERNAME" "$MQTT_PASSWORD"'* ]] \
    || fail "Production smoke 不得把 MQTT 密码作为命令行参数传递"

  local smoke_block
  smoke_block="$(sed -n '/^  production-smoke:/,/^  release:/p' "$PROJECT_ROOT/.github/workflows/ci.yml")"
  assert_contains "$smoke_block" "needs: [backend, frontend]"
  assert_contains "$smoke_block" "production-runtime-smoke.sh"
  assert_contains "$smoke_block" "docker build"
  assert_contains "$smoke_block" "npm ci"
  assert_contains "$smoke_block" "SMOKE_RUN_E2E"
}

test_rabbitmq_healthcheck_uses_service_account() {
  local rabbitmq_block
  rabbitmq_block="$(sed -n '/^  rabbitmq:/,/^  backend:/p' "$PROJECT_ROOT/docker/docker-compose.yml")"
  assert_contains "$rabbitmq_block" "    user: rabbitmq"
}

test_backend_rate_limit_uses_authenticated_tenant_and_trusted_proxy_ip() {
  local program_content compose_content
  local authentication_line rate_limiter_line forwarded_line
  program_content="$(cat "$PROJECT_ROOT/src/EquipAI.WebAPI/Program.cs")"
  compose_content="$(cat "$PROJECT_ROOT/docker/docker-compose.yml")"

  assert_contains "$program_content" "AddTrustedForwardedHeaders"
  assert_contains "$program_content" "app.UseForwardedHeaders()"
  assert_contains "$compose_content" "TRUSTED_PROXY_NETWORKS"

  authentication_line="$(grep -n 'app.UseAuthentication();' "$PROJECT_ROOT/src/EquipAI.WebAPI/Program.cs" | cut -d: -f1)"
  rate_limiter_line="$(grep -n 'app.UseRateLimiter();' "$PROJECT_ROOT/src/EquipAI.WebAPI/Program.cs" | cut -d: -f1)"
  forwarded_line="$(grep -n 'app.UseForwardedHeaders();' "$PROJECT_ROOT/src/EquipAI.WebAPI/Program.cs" | cut -d: -f1)"
  [[ -n "$authentication_line" && -n "$rate_limiter_line" && -n "$forwarded_line" ]] \
    || fail "后端必须注册转发头、认证和限流中间件"
  (( forwarded_line < authentication_line )) \
    || fail "真实客户端 IP 必须在认证和限流之前还原"
  (( authentication_line < rate_limiter_line )) \
    || fail "JWT 认证必须在全局限流之前执行，才能按 tenant_id 分区"
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

test_deploy_paths_share_single_instance_lock() {
  local rolling_script bluegreen_script
  rolling_script="$(cat "$PROJECT_ROOT/docker/deploy-production.sh")"
  bluegreen_script="$(cat "$PROJECT_ROOT/scripts/deploy-bluegreen.sh")"
  assert_contains "$rolling_script" 'DEPLOY_LOCK_DIR="$COMPOSE_DIR/.deploy.lock"'
  assert_contains "$bluegreen_script" 'BLUEGREEN_LOCK_DIR="$COMPOSE_DIR/.deploy.lock"'
  assert_contains "$bluegreen_script" 'release_bluegreen_lock'
}

test_bluegreen_updates_upstream_atomically() {
  local bluegreen_script
  bluegreen_script="$(cat "$PROJECT_ROOT/scripts/deploy-bluegreen.sh")"
  assert_contains "$bluegreen_script" 'mktemp "$UPSTREAM_FILE.XXXXXX"'
  assert_contains "$bluegreen_script" 'mv -f -- "$UPSTREAM_TEMP_FILE" "$UPSTREAM_FILE"'
}

test_bluegreen_backend_health_check_has_timeout() {
  local bluegreen_script
  bluegreen_script="$(cat "$PROJECT_ROOT/scripts/deploy-bluegreen.sh")"
  assert_contains "$bluegreen_script" '--connect-timeout 5 --max-time 10'
  assert_contains "$bluegreen_script" '"http://localhost:$TARGET_BACKEND_PORT/health"'
}

test_bluegreen_validates_target_tag() {
  local bluegreen_script
  bluegreen_script="$(cat "$PROJECT_ROOT/scripts/deploy-bluegreen.sh")"
  assert_contains "$bluegreen_script" '[[ $# -eq 1 ]]'
  assert_contains "$bluegreen_script" 'is_valid_tag "$TAG"'
}

test_bluegreen_state_files_are_atomic() {
  local bluegreen_script
  bluegreen_script="$(cat "$PROJECT_ROOT/scripts/deploy-bluegreen.sh")"
  assert_contains "$bluegreen_script" 'write_state_atomic'
  assert_contains "$bluegreen_script" 'write_state_atomic ".active-color" "$TARGET_COLOR"'
  assert_contains "$bluegreen_script" 'write_state_atomic ".last-deployed-tag" "$TAG"'
}

test_bluegreen_keeps_edgegateway_on_target_backend() {
  local deploy_script compose_content base_compose
  deploy_script="$(cat "$PROJECT_ROOT/scripts/deploy-bluegreen.sh")"
  compose_content="$(cat "$PROJECT_ROOT/docker/docker-compose.bluegreen.yml")"
  base_compose="$(cat "$PROJECT_ROOT/docker/docker-compose.yml")"

  assert_contains "$deploy_script" 'pull backend-$TARGET_COLOR frontend-$TARGET_COLOR edgegateway'
  assert_contains "$deploy_script" 'GATEWAY_BACKEND_URL'
  assert_contains "$deploy_script" 'BLUEGREEN_EDGE_HEALTH_URL'
  assert_contains "$deploy_script" 'edgegateway'
  assert_contains "$compose_content" 'EDGE_BLUEGREEN_PORT'
  assert_contains "$compose_content" 'default'
  assert_contains "$base_compose" 'GATEWAY_BACKEND_URL'
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
    test_validate_env_rejects_missing_pii_encryption_key
    test_validate_env_rejects_invalid_rate_limiting_config
    test_validate_env_rejects_short_machine_api_key
    test_validate_env_rejects_missing_automapper_license
    test_validate_env_rejects_reused_production_credentials
    test_validate_env_rejects_weak_production_config
    test_validate_env_rejects_non_production_environment
    test_validate_env_rejects_duplicate_keys
    test_production_env_template_uses_https_default
    test_production_compose_supports_isolated_tenant2_e2e_credentials
    test_production_smoke_exposes_optional_full_e2e_gate
    test_production_e2e_preserves_mfa_policy
    test_alertmanager_webhook_is_fail_safe_and_configurable
    test_jaeger_storage_is_persistent_by_default
    test_validate_env_rejects_ephemeral_jaeger_storage_in_production
    test_validate_env_rejects_invalid_alert_webhook_url
    test_validate_runtime_files_rejects_invalid_certificates
    test_validate_runtime_files_rejects_production_self_signed_certificates
    test_validate_runtime_files_gate
    test_bootstrap_production_secrets_generates_only_local_values
    test_bootstrap_production_secrets_refuses_duplicate_keys_without_mutation
    test_bootstrap_production_secrets_refuses_symlink_without_mutation
    test_setup_rejects_new_placeholder_env
    test_setup_rejects_non_production_environment_explicitly
    test_setup_rejects_expired_runtime_certificates
    test_setup_rejects_generating_self_signed_certificates_in_production
    test_setup_mosquitto_does_not_expose_password_in_process_arguments
    ;;
  backup)
    test_backup_includes_attachments
    test_backup_s3_storage_includes_object_prefix
    test_backup_rejects_missing_remote_target
    test_backup_rejects_invalid_retention_config
    test_backup_skips_remote_sync_after_local_failure
    test_backup_rejects_enabled_redis_without_password
    test_backup_rejects_requested_redis_failure
    test_backup_uses_configured_redis_container_and_waits_for_snapshot
    test_backup_does_not_expose_credentials_in_docker_arguments
    test_backup_rejects_retention_cleanup_failure
    test_backup_rejects_overlapping_runs
    ;;
  restore)
    test_restore_dry_run_does_not_mutate_services
    test_restore_does_not_execute_env_file
    test_restore_dry_run_accepts_custom_backup
    test_restore_confirm_cleans_attachments_without_running_backend
    test_restore_s3_storage_syncs_back_to_object_prefix
    test_restore_confirm_uses_custom_format_and_timescale_lifecycle
    test_restore_failure_exits_timescale_restore_mode
    test_restore_rejects_corrupted_archive
    test_restore_rejects_unsafe_attachment_archive
    test_restore_rejects_corrupted_redis_backup
    test_restore_rejects_overlapping_confirm_runs
    ;;
  deploy)
    test_deploy_preflight_failure_does_not_mutate_services
    test_deploy_rejects_overlapping_runs
    test_deploy_success_updates_version_atomically
    test_deploy_uses_edge_port_from_env_for_health_check
    test_deploy_final_status_display_failure_does_not_reverse_success
    test_deploy_health_failure_rolls_back_and_verifies_health
    test_deploy_frontend_health_failure_also_rolls_back
    test_deploy_edgegateway_health_failure_also_rolls_back
    test_deploy_same_healthy_tag_is_idempotent
    test_deploy_compose_failure_rolls_back
    test_deploy_without_history_never_rolls_back_to_unknown_tag
    test_deploy_rollback_health_failure_is_critical
    ;;
  ci)
    test_release_waits_for_quality_gates
    test_ci_build_disables_unreliable_build_servers
    test_docker_build_context_excludes_local_artifacts_and_secrets
    test_docker_backend_build_is_reproducible
    test_nginx_does_not_log_signalr_query_tokens
    test_frontend_runtime_installs_certificate_check_dependency
    test_frontend_runtime_rejects_self_signed_certificate_in_production
    test_docker_edgegateway_build_is_reproducible
    test_edgegateway_production_runtime_contract
    test_edgegateway_release_and_deploy_contract
    test_production_runtime_smoke_gate_is_wired
    test_rabbitmq_healthcheck_uses_service_account
    test_backend_rate_limit_uses_authenticated_tenant_and_trusted_proxy_ip
    test_deploy_has_fail_closed_preflight
    test_production_dependency_audit_fails_closed_on_registry_error
    test_deploy_paths_share_single_instance_lock
    test_bluegreen_updates_upstream_atomically
    test_bluegreen_backend_health_check_has_timeout
    test_bluegreen_validates_target_tag
    test_bluegreen_state_files_are_atomic
    ;;
  all)
    test_validate_env_accepts_complete_config
    test_validate_env_rejects_missing_pii_encryption_key
    test_validate_env_rejects_invalid_rate_limiting_config
    test_validate_env_rejects_short_machine_api_key
    test_validate_env_rejects_missing_automapper_license
    test_validate_env_rejects_reused_production_credentials
    test_validate_env_rejects_weak_production_config
    test_validate_env_rejects_non_production_environment
    test_validate_env_rejects_duplicate_keys
    test_production_env_template_uses_https_default
    test_production_compose_supports_isolated_tenant2_e2e_credentials
    test_production_smoke_exposes_optional_full_e2e_gate
    test_production_e2e_preserves_mfa_policy
    test_alertmanager_webhook_is_fail_safe_and_configurable
    test_jaeger_storage_is_persistent_by_default
    test_validate_env_rejects_ephemeral_jaeger_storage_in_production
    test_validate_env_rejects_invalid_alert_webhook_url
    test_validate_runtime_files_rejects_invalid_certificates
    test_validate_runtime_files_rejects_production_self_signed_certificates
    test_validate_runtime_files_gate
    test_bootstrap_production_secrets_generates_only_local_values
    test_bootstrap_production_secrets_refuses_duplicate_keys_without_mutation
    test_bootstrap_production_secrets_refuses_symlink_without_mutation
    test_setup_rejects_new_placeholder_env
    test_setup_rejects_non_production_environment_explicitly
    test_setup_rejects_expired_runtime_certificates
    test_setup_rejects_generating_self_signed_certificates_in_production
    test_setup_mosquitto_does_not_expose_password_in_process_arguments
    test_backup_includes_attachments
    test_backup_s3_storage_includes_object_prefix
    test_backup_rejects_missing_remote_target
    test_backup_rejects_invalid_retention_config
    test_backup_skips_remote_sync_after_local_failure
    test_backup_rejects_enabled_redis_without_password
    test_backup_rejects_requested_redis_failure
    test_backup_uses_configured_redis_container_and_waits_for_snapshot
    test_backup_does_not_expose_credentials_in_docker_arguments
    test_backup_rejects_retention_cleanup_failure
    test_backup_rejects_overlapping_runs
    test_restore_dry_run_does_not_mutate_services
    test_restore_does_not_execute_env_file
    test_restore_dry_run_accepts_custom_backup
    test_restore_confirm_cleans_attachments_without_running_backend
    test_restore_s3_storage_syncs_back_to_object_prefix
    test_restore_confirm_uses_custom_format_and_timescale_lifecycle
    test_restore_failure_exits_timescale_restore_mode
    test_restore_rejects_corrupted_archive
    test_restore_rejects_unsafe_attachment_archive
    test_restore_rejects_corrupted_redis_backup
    test_restore_rejects_overlapping_confirm_runs
    test_deploy_preflight_failure_does_not_mutate_services
    test_deploy_rejects_overlapping_runs
    test_deploy_success_updates_version_atomically
    test_deploy_uses_edge_port_from_env_for_health_check
    test_deploy_final_status_display_failure_does_not_reverse_success
    test_deploy_health_failure_rolls_back_and_verifies_health
    test_deploy_frontend_health_failure_also_rolls_back
    test_deploy_edgegateway_health_failure_also_rolls_back
    test_deploy_same_healthy_tag_is_idempotent
    test_deploy_compose_failure_rolls_back
    test_deploy_without_history_never_rolls_back_to_unknown_tag
    test_deploy_rollback_health_failure_is_critical
    test_release_waits_for_quality_gates
    test_ci_build_disables_unreliable_build_servers
    test_docker_build_context_excludes_local_artifacts_and_secrets
    test_docker_backend_build_is_reproducible
    test_nginx_does_not_log_signalr_query_tokens
    test_frontend_runtime_installs_certificate_check_dependency
    test_frontend_runtime_rejects_self_signed_certificate_in_production
    test_docker_edgegateway_build_is_reproducible
    test_edgegateway_production_runtime_contract
    test_edgegateway_release_and_deploy_contract
    test_production_runtime_smoke_gate_is_wired
    test_rabbitmq_healthcheck_uses_service_account
    test_backend_rate_limit_uses_authenticated_tenant_and_trusted_proxy_ip
    test_deploy_has_fail_closed_preflight
    test_production_dependency_audit_fails_closed_on_registry_error
    test_deploy_paths_share_single_instance_lock
    test_bluegreen_updates_upstream_atomically
    test_bluegreen_backend_health_check_has_timeout
    test_bluegreen_validates_target_tag
    test_bluegreen_state_files_are_atomic
    test_bluegreen_router_does_not_cross_color_dependency
    test_bluegreen_has_fail_closed_preflight
    test_bluegreen_keeps_edgegateway_on_target_backend
    test_bluegreen_colors_do_not_inherit_public_entry_ports
    test_production_internal_ports_bind_loopback_by_default
    test_development_internal_ports_bind_loopback_by_default
    ;;
  *)
    fail "用法：$0 [setup|backup|restore|deploy|ci|all]"
    ;;
esac
echo "生产脚本测试通过"
