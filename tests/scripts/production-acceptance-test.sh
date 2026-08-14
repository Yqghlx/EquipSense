#!/usr/bin/env bash
# 生产发布验收入口的契约测试。

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/equipsense-production-acceptance.XXXXXX")"
RUNTIME_DIR="$TEST_ROOT/runtime"

cleanup() {
  rm -rf -- "$TEST_ROOT"
}
trap cleanup EXIT

fail() {
  printf '测试失败：%s\n' "$*" >&2
  exit 1
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  [[ "$haystack" == *"$needle"* ]] || fail "输出中缺少：$needle"
}

write_valid_env() {
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
    'GRAFANA_PASSWORD=grafana-password-long' \
    'ASPNETCORE_ENVIRONMENT=Production' \
    'OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317' \
    'JAEGER_SPAN_STORAGE_TYPE=badger' \
    'JAEGER_BADGER_EPHEMERAL=false' \
    'EMAIL_DELIVERY_ENABLED=true' > "$env_file"
  chmod 600 "$env_file"
}

write_production_env() {
  local env_file="$TEST_ROOT/production.env"
  cp "$TEST_ROOT/valid.env" "$env_file"
  printf '%s\n' \
    'SMTP_HOST=smtp.example.com' \
    'SMTP_FROM_EMAIL=noreply@example.com' \
    'SMTP_ENABLE_SSL=true' >> "$env_file"
  chmod 600 "$env_file"
}

write_external_evidence() {
  local evidence_dir="$TEST_ROOT/evidence"
  local check_id
  mkdir -p "$evidence_dir"
  for check_id in external.smtp external.otel external.mqtt; do
    printf 'status=PASS\nobserved_at=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" \
      > "$evidence_dir/${check_id}.pass"
    chmod 600 "$evidence_dir/${check_id}.pass"
  done
}

generate_nginx_certificate() {
  local ca_dir="$RUNTIME_DIR/test-ca"
  local ssl_dir="$RUNTIME_DIR/ssl"
  mkdir -p "$ca_dir" "$ssl_dir"

  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout "$ca_dir/ca.key" -out "$ca_dir/ca.crt" \
    -subj '/C=CN/O=EquipSense Test CA/CN=EquipSense Test CA' >/dev/null 2>&1
  chmod 600 "$ca_dir/ca.key"

  openssl req -nodes -newkey rsa:2048 \
    -keyout "$ssl_dir/key.pem" -out "$ca_dir/server.csr" \
    -subj '/C=CN/O=EquipSense Test/CN=example.com' >/dev/null 2>&1
  cat > "$ca_dir/server-ext.cnf" <<'EOF'
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:example.com
EOF
  openssl x509 -req -in "$ca_dir/server.csr" \
    -CA "$ca_dir/ca.crt" -CAkey "$ca_dir/ca.key" -CAcreateserial \
    -out "$ssl_dir/cert.pem" -days 365 -sha256 \
    -extfile "$ca_dir/server-ext.cnf" >/dev/null 2>&1
  chmod 600 "$ssl_dir/key.pem"
  chmod 644 "$ssl_dir/cert.pem"
}

write_runtime_tree() {
  mkdir -p "$RUNTIME_DIR"
  cp "$PROJECT_ROOT/docker/validate-env.sh" "$RUNTIME_DIR/validate-env.sh"
  cp "$PROJECT_ROOT/docker/production-readiness.sh" "$RUNTIME_DIR/production-readiness.sh"
  cp "$PROJECT_ROOT/docker/generate-mqtt-cert.sh" "$RUNTIME_DIR/generate-mqtt-cert.sh"
  chmod 755 "$RUNTIME_DIR"/*.sh

  local relative_path
  while IFS= read -r relative_path; do
    mkdir -p "$RUNTIME_DIR/$(dirname "$relative_path")"
    cp "$PROJECT_ROOT/docker/$relative_path" "$RUNTIME_DIR/$relative_path"
  done <<'EOF'
mosquitto.prod.conf
rabbitmq/rabbitmq.conf
rabbitmq/definitions.json
rabbitmq/start.sh
prometheus.yml
prometheus/rules.yml
alertmanager.yml
alertmanager-entrypoint.sh
grafana/provisioning/datasources/prometheus.yml
grafana/provisioning/dashboards/dashboard.yml
EOF

  generate_nginx_certificate
  bash "$RUNTIME_DIR/generate-mqtt-cert.sh" mosquitto 365 >/dev/null
  mkdir -p "$RUNTIME_DIR/mosquitto_passwd"
  printf 'loadtest:{PLAIN}mqtt-password-long\n' > "$RUNTIME_DIR/mosquitto_passwd/passwd"
  chmod 600 "$RUNTIME_DIR/mosquitto_passwd/passwd"
}

write_compose_file() {
  cat > "$TEST_ROOT/compose.yml" <<'EOF'
services:
  backend:
    image: equipsense/backend:test
  frontend:
    image: equipsense/frontend:test
  edgegateway:
    image: equipsense/edgegateway:test
EOF
}

write_fake_docker() {
  cat > "$TEST_ROOT/fake-docker" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

has_arg() {
  local expected="$1"
  shift
  local arg
  for arg in "$@"; do
    [ "$arg" = "$expected" ] && return 0
  done
  return 1
}

if [ "${PRODUCTION_ACCEPTANCE_FAKE_MODE:-}" = "compose-fail" ] && has_arg config "$@" && has_arg --quiet "$@"; then
  exit 1
fi

if has_arg --images "$@"; then
  if [ "${PRODUCTION_ACCEPTANCE_FAKE_MODE:-}" = "images-unresolved" ]; then
    printf '%s\n' '${BACKEND_IMAGE}' equipsense/frontend:test equipsense/edgegateway:test
    exit 0
  fi
  if [ "${PRODUCTION_ACCEPTANCE_FAKE_MODE:-}" = "images-mismatched-tag" ]; then
    printf '%s\n' equipsense/backend:v1.2.3-old equipsense/frontend:v1.2.3-old equipsense/edgegateway:v1.2.3-old
    exit 0
  fi
  if [ "${PRODUCTION_ACCEPTANCE_FAKE_MODE:-}" = "images-exact-tag-digest" ]; then
    printf '%s\n' \
      equipsense/backend:v1.2.3@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa \
      equipsense/frontend:v1.2.3@sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb \
      equipsense/edgegateway:v1.2.3@sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
    exit 0
  fi
  printf '%s\n' equipsense/backend:test equipsense/frontend:test equipsense/edgegateway:test
  exit 0
fi

if has_arg --services "$@"; then
  printf '%s\n' backend frontend edgegateway
  exit 0
fi

if has_arg --format "$@"; then
  printf '%s\t%s\t%s\n' backend running healthy frontend running healthy edgegateway running healthy
  exit 0
fi

exit 0
EOF
  chmod 700 "$TEST_ROOT/fake-docker"
}

run_acceptance() {
  PRODUCTION_DOCKER_BIN="$TEST_ROOT/fake-docker" \
    bash "$PROJECT_ROOT/docker/production-acceptance.sh" \
      --runtime-dir "$RUNTIME_DIR" "$@"
}

run_acceptance_raw() {
  PRODUCTION_DOCKER_BIN="$TEST_ROOT/fake-docker" \
    bash "$PROJECT_ROOT/docker/production-acceptance.sh" "$@"
}

test_report_protocol_is_stable() {
  local output_dir="$TEST_ROOT/report"
  set +e
  run_acceptance --profile isolated-ci --env-file "$TEST_ROOT/valid.env" \
    --compose-file "$TEST_ROOT/compose.yml" --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 0 ]] || fail "隔离 profile 的合法静态验收应通过"
  [[ "$(sed -n '1p' "$output_dir/checks.tsv")" = $'check_id\tcategory\trequired\tstatus\tevidence' ]] \
    || fail "TSV 标题不稳定"
  assert_contains "$(cat "$output_dir/summary.md")" "profile: isolated-ci"
}

test_isolated_runtime_passes() {
  local output_dir="$TEST_ROOT/runtime-report"
  set +e
  run_acceptance --profile isolated-ci --env-file "$TEST_ROOT/valid.env" \
    --compose-file "$TEST_ROOT/compose.yml" --runtime --output-dir "$output_dir"
  local result_code=$?
  set -e
  if [[ "$result_code" -ne 0 ]]; then
    cat "$output_dir/checks.tsv" >&2
    fail "隔离 profile 的运行态验收应通过"
  fi
  assert_contains "$(cat "$output_dir/checks.tsv")" $'runtime.services\truntime\ttrue\tPASS'
}

test_production_missing_external_is_blocked() {
  local output_dir="$TEST_ROOT/production-report"
  set +e
  run_acceptance --profile production --env-file "$TEST_ROOT/valid.env" \
    --compose-file "$TEST_ROOT/compose.yml" --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 2 ]] || fail "缺少外部生产证据时应返回 BLOCKED 退出码 2"
  assert_contains "$(cat "$output_dir/checks.tsv")" $'external.smtp\texternal\ttrue\tBLOCKED'
  assert_contains "$(cat "$output_dir/checks.tsv")" $'runtime.services\truntime\ttrue\tBLOCKED'
  if rg -q 'postgres-password-long|redis-password-long|rabbitmq-password-long|mqtt-password-long|jwt-secret-that-is-longer' \
    "$output_dir/checks.tsv" "$output_dir/summary.md"; then
    fail "验收报告泄露了测试凭据"
  fi
}

test_compose_failure_is_fail() {
  local output_dir="$TEST_ROOT/compose-failure-report"
  set +e
  PRODUCTION_ACCEPTANCE_FAKE_MODE=compose-fail run_acceptance \
    --profile isolated-ci --env-file "$TEST_ROOT/valid.env" \
    --compose-file "$TEST_ROOT/compose.yml" --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 1 ]] || fail "Compose 解析失败时应返回 FAIL 退出码 1"
  assert_contains "$(cat "$output_dir/checks.tsv")" $'static.compose\tstatic\ttrue\tFAIL'
}

test_unresolved_image_is_fail() {
  local output_dir="$TEST_ROOT/unresolved-image-report"
  set +e
  PRODUCTION_ACCEPTANCE_FAKE_MODE=images-unresolved run_acceptance \
    --profile isolated-ci --env-file "$TEST_ROOT/valid.env" \
    --compose-file "$TEST_ROOT/compose.yml" --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 1 ]] || fail "未解析镜像变量时应返回 FAIL 退出码 1"
  assert_contains "$(cat "$output_dir/checks.tsv")" $'artifact.images\tstatic\ttrue\tFAIL'
}

test_mismatched_expected_tag_is_fail() {
  local output_dir="$TEST_ROOT/mismatched-tag-report"
  set +e
  PRODUCTION_ACCEPTANCE_EXPECTED_TAG=v1.2.3 \
    PRODUCTION_ACCEPTANCE_FAKE_MODE=images-mismatched-tag \
    run_acceptance --profile isolated-ci --env-file "$TEST_ROOT/valid.env" \
      --compose-file "$TEST_ROOT/compose.yml" --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 1 ]] || fail "目标 tag 仅作为较长 tag 的子串时应返回 FAIL"
  assert_contains "$(cat "$output_dir/checks.tsv")" $'artifact.images\tstatic\ttrue\tFAIL'
}

test_exact_expected_tag_with_digest_is_pass() {
  local output_dir="$TEST_ROOT/exact-tag-digest-report"
  set +e
  PRODUCTION_ACCEPTANCE_EXPECTED_TAG=v1.2.3 \
    PRODUCTION_ACCEPTANCE_FAKE_MODE=images-exact-tag-digest \
    run_acceptance --profile isolated-ci --env-file "$TEST_ROOT/valid.env" \
      --compose-file "$TEST_ROOT/compose.yml" --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 0 ]] || fail "精确 tag 后带 digest 的镜像应通过版本验收"
  assert_contains "$(cat "$output_dir/checks.tsv")" $'artifact.images\tstatic\ttrue\tPASS'
}

test_external_evidence_can_clear_external_blocks() {
  local output_dir="$TEST_ROOT/evidence-report"
  set +e
  run_acceptance --profile production --env-file "$TEST_ROOT/production.env" \
    --compose-file "$TEST_ROOT/compose.yml" --evidence-dir "$TEST_ROOT/evidence" \
    --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 2 ]] || fail "缺少 runtime 时即使外部证据齐全也应保持 BLOCKED"
  assert_contains "$(cat "$output_dir/checks.tsv")" $'external.smtp\texternal\ttrue\tPASS'
  assert_contains "$(cat "$output_dir/checks.tsv")" $'external.otel\texternal\ttrue\tPASS'
  assert_contains "$(cat "$output_dir/checks.tsv")" $'external.mqtt\texternal\ttrue\tPASS'
}

test_invalid_smtp_port_is_fail() {
  local invalid_env="$TEST_ROOT/invalid-smtp-port.env"
  local output_dir="$TEST_ROOT/invalid-smtp-port-report"
  cp "$TEST_ROOT/production.env" "$invalid_env"
  printf '%s\n' 'SMTP_PORT=70000' >> "$invalid_env"
  chmod 600 "$invalid_env"
  set +e
  run_acceptance --profile production --env-file "$invalid_env" \
    --compose-file "$TEST_ROOT/compose.yml" --evidence-dir "$TEST_ROOT/evidence" \
    --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 1 ]] || fail "非法 SMTP 端口应返回 FAIL 退出码 1"
  assert_contains "$(cat "$output_dir/checks.tsv")" \
    $'external.smtp\texternal\ttrue\tFAIL'
}

test_invalid_smtp_from_is_fail() {
  local invalid_env="$TEST_ROOT/invalid-smtp-from.env"
  local output_dir="$TEST_ROOT/invalid-smtp-from-report"
  cp "$TEST_ROOT/production.env" "$invalid_env"
  printf '%s\n' 'SMTP_FROM_EMAIL=not-an-email' >> "$invalid_env"
  chmod 600 "$invalid_env"
  set +e
  run_acceptance --profile production --env-file "$invalid_env" \
    --compose-file "$TEST_ROOT/compose.yml" --evidence-dir "$TEST_ROOT/evidence" \
    --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 1 ]] || fail "非法 SMTP 发件人应返回 FAIL 退出码 1"
  assert_contains "$(cat "$output_dir/checks.tsv")" \
    $'external.smtp\texternal\ttrue\tFAIL'
}

test_stale_external_evidence_is_blocked() {
  local output_dir="$TEST_ROOT/stale-evidence-report"
  touch -t 200001010000 "$TEST_ROOT/evidence/external.mqtt.pass"
  set +e
  run_acceptance --profile production --env-file "$TEST_ROOT/production.env" \
    --compose-file "$TEST_ROOT/compose.yml" --evidence-dir "$TEST_ROOT/evidence" \
    --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 2 ]] || fail "外部证据过期时应返回 BLOCKED 退出码 2"
  assert_contains "$(cat "$output_dir/checks.tsv")" $'external.mqtt\texternal\ttrue\tBLOCKED'
}

test_invalid_integration_switch_is_fail() {
  local invalid_env="$TEST_ROOT/invalid-integration.env"
  local output_dir="$TEST_ROOT/invalid-integration-report"
  cp "$TEST_ROOT/valid.env" "$invalid_env"
  printf '%s\n' 'PRODUCTION_ACCEPTANCE_INTEGRATIONS_ENABLED=maybe' >> "$invalid_env"
  chmod 600 "$invalid_env"
  set +e
  run_acceptance --profile production --env-file "$invalid_env" \
    --compose-file "$TEST_ROOT/compose.yml" --output-dir "$output_dir"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 1 ]] || fail "非法外部集成开关应返回 FAIL 退出码 1"
  assert_contains "$(cat "$output_dir/checks.tsv")" \
    $'external.integrations\texternal\ttrue\tFAIL'
}

test_symlink_output_is_rejected() {
  local output_link="$TEST_ROOT/output-link"
  ln -s "$TEST_ROOT/report" "$output_link"
  set +e
  run_acceptance --profile isolated-ci --env-file "$TEST_ROOT/valid.env" \
    --compose-file "$TEST_ROOT/compose.yml" --output-dir "$output_link"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 3 ]] || fail "符号链接输出目录应返回参数/边界错误退出码 3"
}

test_symlink_env_is_rejected() {
  local env_link="$TEST_ROOT/env-link"
  ln -s "$TEST_ROOT/valid.env" "$env_link"
  set +e
  run_acceptance --profile isolated-ci --env-file "$env_link" \
    --compose-file "$TEST_ROOT/compose.yml" --output-dir "$TEST_ROOT/env-link-report"
  local result_code=$?
  set -e
  [[ "$result_code" -eq 3 ]] || fail "符号链接环境文件应返回参数/边界错误退出码 3"
}

test_symlink_runtime_and_compose_are_rejected() {
  local runtime_link="$TEST_ROOT/runtime-link"
  local compose_link="$TEST_ROOT/compose-link"
  ln -s "$RUNTIME_DIR" "$runtime_link"
  ln -s "$TEST_ROOT/compose.yml" "$compose_link"

  set +e
  run_acceptance_raw --profile isolated-ci --env-file "$TEST_ROOT/valid.env" \
    --runtime-dir "$runtime_link" --compose-file "$TEST_ROOT/compose.yml" \
    --output-dir "$TEST_ROOT/runtime-link-report"
  local runtime_result_code=$?
  run_acceptance_raw --profile isolated-ci --env-file "$TEST_ROOT/valid.env" \
    --runtime-dir "$RUNTIME_DIR" --compose-file "$compose_link" \
    --output-dir "$TEST_ROOT/compose-link-report"
  local compose_result_code=$?
  set -e

  [[ "$runtime_result_code" -eq 3 ]] || fail "符号链接运行时目录应返回参数/边界错误退出码 3"
  [[ "$compose_result_code" -eq 3 ]] || fail "符号链接 Compose 文件应返回参数/边界错误退出码 3"
}

test_duplicate_and_unknown_arguments_are_rejected() {
  set +e
  run_acceptance --profile isolated-ci --profile isolated-ci \
    --env-file "$TEST_ROOT/valid.env" --compose-file "$TEST_ROOT/compose.yml" \
    --output-dir "$TEST_ROOT/duplicate-report"
  local duplicate_result_code=$?
  run_acceptance --profile isolated-ci --unknown-option
  local unknown_result_code=$?
  set -e

  [[ "$duplicate_result_code" -eq 3 ]] || fail "重复参数应返回参数/边界错误退出码 3"
  [[ "$unknown_result_code" -eq 3 ]] || fail "未知参数应返回参数/边界错误退出码 3"
}

write_valid_env
write_production_env
write_external_evidence
write_runtime_tree
write_compose_file
write_fake_docker
test_report_protocol_is_stable
test_isolated_runtime_passes
test_production_missing_external_is_blocked
test_compose_failure_is_fail
test_unresolved_image_is_fail
test_mismatched_expected_tag_is_fail
test_exact_expected_tag_with_digest_is_pass
test_external_evidence_can_clear_external_blocks
test_invalid_smtp_port_is_fail
test_invalid_smtp_from_is_fail
test_stale_external_evidence_is_blocked
test_invalid_integration_switch_is_fail
test_symlink_output_is_rejected
test_symlink_env_is_rejected
test_symlink_runtime_and_compose_are_rejected
test_duplicate_and_unknown_arguments_are_rejected
printf '生产发布验收测试通过\n'
