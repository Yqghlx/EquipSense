#!/usr/bin/env bash
# =============================================================================
# production-acceptance.sh — 生产发布统一验收入口
# =============================================================================
#
# 用途：集中编排生产配置、Compose、运行态和外部依赖检查，生成可审计报告。
# 安全边界：只读检查，绝不启动、停止、拉取、构建、重启或进入容器。
#
# 退出码：
#   0  所有必需检查通过
#   1  至少一个必需检查明确失败
#   2  没有明确失败，但至少一个必需条件被阻断
#   3  参数、文件边界或运行环境错误
# =============================================================================

set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
RUNTIME_DIR="$SCRIPT_DIR"
RUNTIME_DIR_EXPLICIT=false
ENV_FILE=""
ENV_FILE_EXPLICIT=false
PROFILE=""
COMPOSE_FILES=()
OUTPUT_DIR=""
OUTPUT_DIR_EXPLICIT=false
EVIDENCE_DIR=""
EVIDENCE_DIR_EXPLICIT=false
RUNTIME_CHECK=false
DOCKER_BIN="${PRODUCTION_DOCKER_BIN:-docker}"
EXPECTED_TAG="${PRODUCTION_ACCEPTANCE_EXPECTED_TAG:-}"
TEMP_OUTPUT_DIR=false
REPORT_TEMP_FILE=""
SUMMARY_TEMP_FILE=""
REPORT_FILE=""
SUMMARY_FILE=""
COMPOSE_COMMAND=()

PASS_COUNT=0
FAIL_COUNT=0
BLOCKED_COUNT=0
SKIPPED_COUNT=0
REQUIRED_FAIL_COUNT=0
REQUIRED_BLOCKED_COUNT=0

CHECK_IDS=()
CHECK_CATEGORIES=()
CHECK_REQUIRED=()
CHECK_STATUSES=()
CHECK_EVIDENCE=()
SENSITIVE_VALUES=()

usage() {
  cat <<'EOF'
用法：
  production-acceptance.sh \
    --profile isolated-ci|production \
    [--env-file <路径>] \
    [--compose-file <路径>]... \
    [--runtime-dir <目录>] \
    [--evidence-dir <目录>] \
    [--output-dir <目录>] \
    [--runtime]

说明：
  默认只执行静态验收；生产 profile 必须显式传入 --runtime，才会检查当前服务状态。
  生产外部检查可通过 --evidence-dir 提供最近 24 小时内的独立验收证据。
  备份恢复由独立 CI job 或生产运维演练执行，本入口不会改变 Docker 或数据状态。
EOF
}

fail_usage() {
  printf '生产发布验收参数错误：%s\n' "$*" >&2
  usage >&2
  exit 3
}

cleanup() {
  if [ -n "$REPORT_TEMP_FILE" ] && [ -f "$REPORT_TEMP_FILE" ]; then
    rm -f -- "$REPORT_TEMP_FILE"
  fi
  if [ -n "$SUMMARY_TEMP_FILE" ] && [ -f "$SUMMARY_TEMP_FILE" ]; then
    rm -f -- "$SUMMARY_TEMP_FILE"
  fi
  if [ "$TEMP_OUTPUT_DIR" = true ] && [ -n "$OUTPUT_DIR" ] && [ -d "$OUTPUT_DIR" ]; then
    rmdir "$OUTPUT_DIR" 2>/dev/null || true
  fi
}
trap cleanup EXIT

resolve_path() {
  local path="$1"
  local directory
  if [[ "$path" != /* ]]; then
    path="$(pwd -P)/$path"
  fi
  directory="$(cd "$(dirname "$path")" 2>/dev/null && pwd -P)" \
    || fail_usage "无法解析路径：$path"
  printf '%s/%s' "$directory" "$(basename "$path")"
}

require_directory() {
  local path="$1"
  local label="$2"
  [ ! -L "$path" ] || fail_usage "${label}不得为符号链接：$path"
  [ -d "$path" ] || fail_usage "${label}不存在：$path"
}

require_file() {
  local path="$1"
  local label="$2"
  [ ! -L "$path" ] || fail_usage "${label}不得为符号链接：$path"
  [ -f "$path" ] || fail_usage "${label}不存在：$path"
}

read_env_value() {
  local key="$1"
  local line
  line="$(awk -F= -v expected_key="$key" '$1 == expected_key { value = substr($0, index($0, "=") + 1) } END { print value }' "$ENV_FILE")"
  printf '%s' "$line"
}

is_valid_smtp_port() {
  local value="$1"
  [[ "$value" =~ ^[0-9]{1,5}$ ]] || return 1
  local port=$((10#$value))
  (( port >= 1 && port <= 65535 ))
}

is_valid_smtp_from() {
  local value="$1"
  [[ "$value" =~ ^[^[:space:]@]+@[^[:space:]@]+$ ]]
}

collect_sensitive_values() {
  local line key value
  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    case "$key" in
      PG_PASSWORD|REDIS_PASSWORD|RABBITMQ_PASSWORD|MQTT_PASSWORD|JWT_SECRET|\
      TOTP_ENCRYPTION_KEY|PII_ENCRYPTION_KEY|AUTOMAPPER_LICENSE_KEY|GATEWAY_AUTH_KEY|\
      AUTH_MACHINE_API_KEY|SEED_ADMIN_PASSWORD|SEED_LEAD_PASSWORD|SEED_TECH_PASSWORD|\
      SEED_OPERATOR_PASSWORD|SEED_VIEWER_PASSWORD|SEQ_ADMIN_PASSWORD|GRAFANA_PASSWORD|\
      SMTP_PASSWORD|LLM_API_KEY|VAPID__PRIVATEKEY|FILE_STORAGE_S3_SECRET_KEY|\
      EVALUATION_INGESTION_API_KEY)
        [ -n "$value" ] && SENSITIVE_VALUES+=("$value")
        ;;
    esac
  done < "$ENV_FILE"
}

sanitize_evidence() {
  local text="$1"
  local value
  for value in "${SENSITIVE_VALUES[@]}"; do
    [ -n "$value" ] || continue
    text="${text//"$value"/[已隐藏]}"
  done
  text="${text//$'\t'/ }"
  text="${text//$'\r'/ }"
  text="${text//$'\n'/ }"
  text="${text//|/／}"
  text="$(printf '%s' "$text" | sed -E \
    -e 's#(https?://)[^/@[:space:]]+@#\1[已隐藏]@#g' \
    -e 's#((password|passwd|token|secret|api[_-]?key)=)[^&[:space:]]+#\1[已隐藏]#Ig')"
  printf '%s' "$text"
}

record_check() {
  local check_id="$1"
  local category="$2"
  local required="$3"
  local status="$4"
  local evidence="$5"
  local safe_evidence

  case "$required" in
    true|false)
      ;;
    *)
      fail_usage "检查 $check_id 的 required 状态非法：$required"
      ;;
  esac
  case "$status" in
    PASS|FAIL|BLOCKED|SKIPPED)
      ;;
    *)
      fail_usage "检查 $check_id 的状态非法：$status"
      ;;
  esac

  if [ "$status" = SKIPPED ] && [ "$required" = true ] && [ "$PROFILE" = production ]; then
    status=BLOCKED
    evidence="生产 profile 不允许跳过必需检查：$evidence"
  fi

  safe_evidence="$(sanitize_evidence "$evidence")"
  printf '%s\t%s\t%s\t%s\t%s\n' \
    "$check_id" "$category" "$required" "$status" "$safe_evidence" \
    >> "$REPORT_TEMP_FILE"

  CHECK_IDS+=("$check_id")
  CHECK_CATEGORIES+=("$category")
  CHECK_REQUIRED+=("$required")
  CHECK_STATUSES+=("$status")
  CHECK_EVIDENCE+=("$safe_evidence")

  case "$status" in
    PASS)
      PASS_COUNT=$((PASS_COUNT + 1))
      ;;
    FAIL)
      FAIL_COUNT=$((FAIL_COUNT + 1))
      [ "$required" = true ] && REQUIRED_FAIL_COUNT=$((REQUIRED_FAIL_COUNT + 1))
      ;;
    BLOCKED)
      BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
      [ "$required" = true ] && REQUIRED_BLOCKED_COUNT=$((REQUIRED_BLOCKED_COUNT + 1))
      ;;
    SKIPPED)
      SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
      ;;
  esac
}

first_line() {
  local text="$1"
  local line
  # 子命令常先打印标题再打印 [✗]；摘要必须落到第一条失败原因，避免把启动横幅当成失败证据。
  line="$(printf '%s\n' "$text" | awk '/\[✗\]/ { print; exit }')"
  if [ -z "$line" ]; then
    line="$(printf '%s\n' "$text" | sed -n '1p')"
  fi
  printf '%s' "${line:-无输出}"
}

run_command_check() {
  local check_id="$1"
  local category="$2"
  local required="$3"
  shift 3
  local output
  local status_code

  if output="$("$@" 2>&1)"; then
    record_check "$check_id" "$category" "$required" PASS "命令执行成功"
  else
    status_code=$?
    record_check "$check_id" "$category" "$required" FAIL \
      "命令退出码 ${status_code}：$(first_line "$output")"
  fi
}

run_compose_capture() {
  local output_variable="$1"
  shift
  local output
  local status_code
  if output="$("${COMPOSE_COMMAND[@]}" "$@" 2>&1)"; then
    status_code=0
  else
    status_code=$?
  fi
  printf -v "$output_variable" '%s' "$output"
  return "$status_code"
}

check_artifact_images() {
  local images_output
  local image
  local image_count=0
  local matched_tag_count=0
  local images=()

  if ! run_compose_capture images_output config --images; then
    record_check "artifact.images" "static" true FAIL \
      "无法读取 Compose 镜像清单：$(first_line "$images_output")"
    return 0
  fi

  while IFS= read -r image || [ -n "$image" ]; do
    image="$(printf '%s' "$image" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    [ -n "$image" ] || continue
    images+=("$image")
  done <<< "$images_output"
  image_count="${#images[@]}"

  if [ "$image_count" -lt 3 ]; then
    record_check "artifact.images" "static" true FAIL \
      "应用镜像数量不足：仅解析到 ${image_count} 个"
    return 0
  fi

  for image in "${images[@]}"; do
    if [[ "$image" == *'$'* || "$image" == *'?'* || "$image" == *'请在'* ]]; then
      record_check "artifact.images" "static" true FAIL \
        "镜像仍含未解析变量或占位符"
      return 0
    fi
    if [ -n "$EXPECTED_TAG" ] && image_matches_expected_tag "$image"; then
      matched_tag_count=$((matched_tag_count + 1))
    fi
  done

  if [ -n "$EXPECTED_TAG" ] && [ "$matched_tag_count" -lt 3 ]; then
    record_check "artifact.images" "static" true FAIL \
      "应用镜像未全部匹配期望版本标识"
    return 0
  fi

  if [ -n "$EXPECTED_TAG" ]; then
    record_check "artifact.images" "static" true PASS \
      "已解析 ${image_count} 个镜像，应用镜像版本标识一致"
  else
    record_check "artifact.images" "static" true PASS \
      "已解析 ${image_count} 个镜像；未设置版本标识校验"
  fi
}

image_matches_expected_tag() {
  local image="$1"
  local image_without_digest="${image%%@*}"

  # 必须匹配镜像引用最后一个冒号后的完整 tag；仅做子串匹配会让
  # v1.2.3-old 或仓库名中包含 v1.2.3 的错误制品绕过发布门禁。
  [[ "$image_without_digest" == *":${EXPECTED_TAG}" ]]
}

file_mtime_epoch() {
  local path="$1"
  local value
  value="$(stat -f '%m' "$path" 2>/dev/null || true)"
  if [[ "$value" =~ ^[0-9]+$ ]]; then
    printf '%s' "$value"
    return 0
  fi
  value="$(stat -c '%Y' "$path" 2>/dev/null || true)"
  [[ "$value" =~ ^[0-9]+$ ]] || return 1
  printf '%s' "$value"
}

parse_utc_epoch() {
  local timestamp="$1"
  local value
  value="$(date -u -j -f '%Y-%m-%dT%H:%M:%SZ' "$timestamp" '+%s' 2>/dev/null || true)"
  if [[ "$value" =~ ^[0-9]+$ ]]; then
    printf '%s' "$value"
    return 0
  fi
  value="$(date -u -d "$timestamp" '+%s' 2>/dev/null || true)"
  [[ "$value" =~ ^[0-9]+$ ]] || return 1
  printf '%s' "$value"
}

evidence_is_valid() {
  local check_id="$1"
  local evidence_file
  local status_line
  local observed_at
  local observed_epoch
  local mtime
  local now
  local mode

  EVIDENCE_REASON="未提供外部验收证据目录"
  [ -n "$EVIDENCE_DIR" ] || return 1
  evidence_file="$EVIDENCE_DIR/${check_id}.pass"
  if [ -L "$evidence_file" ]; then
    EVIDENCE_REASON="证据文件不得为符号链接"
    return 1
  fi
  if [ ! -f "$evidence_file" ]; then
    EVIDENCE_REASON="缺少证据文件 ${check_id}.pass"
    return 1
  fi

  # GNU stat 用 -c，BSD/macOS 用 -f；必须 GNU 优先——GNU 的 -f '%Lp' 会"成功"输出
  # 无意义字面量而非报错，若 BSD 写法在前会拿到垃圾值并跳过权限校验。
  mode="$(stat -c '%a' "$evidence_file" 2>/dev/null || stat -f '%Lp' "$evidence_file" 2>/dev/null || true)"
  # stat 返回的是八进制权限字面量（如 600/644）。必须按 8# 解析，
  # 并拒绝组/其他人的任何位，否则 644 的世界可读证据会被当成安全。
  # 读不到权限一律 fail-closed，不允许在权限未知时放行证据。
  if [[ ! "$mode" =~ ^[0-7]{3,4}$ ]]; then
    EVIDENCE_REASON="无法读取证据文件权限，按不可信处理"
    return 1
  fi
  if (( (8#$mode & 077) != 0 )); then
    EVIDENCE_REASON="证据文件权限过宽"
    return 1
  fi

  status_line="$(awk -F= '$1 == "status" { print $2; exit }' "$evidence_file")"
  if [ "$status_line" != PASS ]; then
    EVIDENCE_REASON="证据文件未声明 status=PASS"
    return 1
  fi
  observed_at="$(awk -F= '$1 == "observed_at" { print $2; exit }' "$evidence_file")"
  if [[ ! "$observed_at" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
    EVIDENCE_REASON="证据文件缺少规范 UTC observed_at"
    return 1
  fi

  if ! observed_epoch="$(parse_utc_epoch "$observed_at")"; then
    EVIDENCE_REASON="证据文件 observed_at 不是有效 UTC 时间"
    return 1
  fi
  if ! mtime="$(file_mtime_epoch "$evidence_file")"; then
    EVIDENCE_REASON="无法读取证据文件时间"
    return 1
  fi
  now="$(date +%s)"
  if (( now - observed_epoch > 86400 || observed_epoch - now > 300 )); then
    EVIDENCE_REASON="证据 observed_at 超过 24 小时或时间异常"
    return 1
  fi
  if (( now - mtime > 86400 || mtime - now > 300 )); then
    EVIDENCE_REASON="证据文件超过 24 小时或时间异常"
    return 1
  fi

  return 0
}

record_external_with_evidence() {
  local check_id="$1"
  local category="$2"
  if evidence_is_valid "$check_id"; then
    record_check "$check_id" "$category" true PASS \
      "独立验收证据已通过安全格式和新鲜度检查"
  else
    record_check "$check_id" "$category" true BLOCKED "$EVIDENCE_REASON"
  fi
}

record_external_checks() {
  local email_enabled
  local smtp_host
  local smtp_from
  local smtp_port
  local smtp_ssl
  local otel_endpoint
  local integrations_enabled

  record_check "data.backup-restore" "data" false SKIPPED \
    "由 tests/backup-restore-rehearsal.sh 或生产 RPO/RTO 演练独立执行"

  if [ "$PROFILE" = isolated-ci ]; then
    record_check "external.smtp" "external" false SKIPPED \
      "隔离 profile 不验证真实 SMTP 投递"
    record_check "external.otel" "external" false SKIPPED \
      "隔离 profile 不验证正式 OTLP 存储"
    record_check "external.mqtt" "external" false SKIPPED \
      "隔离 profile 的 MQTT 证书由静态门禁覆盖，不宣称现场连通"
    record_check "external.integrations" "external" false SKIPPED \
      "隔离 profile 不验证钉钉、飞书、EAM 或 Webhook"
    return 0
  fi

  email_enabled="$(read_env_value EMAIL_DELIVERY_ENABLED)"
  if [ "$email_enabled" = false ] || [ "$email_enabled" = 0 ]; then
    record_check "external.smtp" "external" false SKIPPED \
      "邮件投递 worker 已显式关闭"
  else
    smtp_host="$(read_env_value SMTP_HOST)"
    smtp_from="$(read_env_value SMTP_FROM_EMAIL)"
    smtp_port="$(read_env_value SMTP_PORT)"
    [ -n "$smtp_port" ] || smtp_port=587
    smtp_ssl="$(read_env_value SMTP_ENABLE_SSL)"
    if [ -z "$smtp_host" ] || [ -z "$smtp_from" ] || [ "$smtp_ssl" != true ]; then
      record_check "external.smtp" "external" true BLOCKED \
        "SMTP 主机、发件人、端口或 TLS 配置不完整"
    elif ! is_valid_smtp_port "$smtp_port"; then
      record_check "external.smtp" "external" true FAIL \
        "SMTP 端口必须是 1-65535 的十进制整数"
    elif ! is_valid_smtp_from "$smtp_from"; then
      record_check "external.smtp" "external" true FAIL \
        "SMTP 发件人必须是有效邮箱地址"
    else
      record_external_with_evidence "external.smtp" "external"
    fi
  fi

  otel_endpoint="$(read_env_value OTEL_EXPORTER_OTLP_ENDPOINT)"
  if [ -z "$otel_endpoint" ]; then
    record_check "external.otel" "external" true BLOCKED \
      "缺少 OTLP 端点配置"
  else
    record_external_with_evidence "external.otel" "external"
  fi

  record_external_with_evidence "external.mqtt" "external"

  integrations_enabled="$(read_env_value PRODUCTION_ACCEPTANCE_INTEGRATIONS_ENABLED)"
  case "$integrations_enabled" in
    true|1)
      record_external_with_evidence "external.integrations" "external"
      ;;
    ""|false|0)
      record_check "external.integrations" "external" false SKIPPED \
        "未启用外部工单集成验收"
      ;;
    *)
      record_check "external.integrations" "external" true FAIL \
        "PRODUCTION_ACCEPTANCE_INTEGRATIONS_ENABLED 不是合法布尔值"
      ;;
  esac
}

finish_acceptance() {
  local overall_status
  local exit_code
  local generated_at
  local expected_tag_summary
  local index

  if [ "$REQUIRED_FAIL_COUNT" -gt 0 ]; then
    overall_status=FAIL
    exit_code=1
  elif [ "$REQUIRED_BLOCKED_COUNT" -gt 0 ]; then
    overall_status=BLOCKED
    exit_code=2
  else
    overall_status=PASS
    exit_code=0
  fi

  if [ -L "$REPORT_FILE" ] || [ -L "$SUMMARY_FILE" ]; then
    fail_usage "验收报告目标不得为符号链接"
  fi
  if [ -e "$REPORT_FILE" ] && [ ! -f "$REPORT_FILE" ]; then
    fail_usage "验收报告目标不是普通文件"
  fi
  if [ -e "$SUMMARY_FILE" ] && [ ! -f "$SUMMARY_FILE" ]; then
    fail_usage "验收摘要目标不是普通文件"
  fi

  generated_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  expected_tag_summary="未设置"
  [ -n "$EXPECTED_TAG" ] && expected_tag_summary="已设置"
  {
    printf '# 生产发布验收摘要\n\n'
    printf -- '- profile: %s\n' "$PROFILE"
    printf -- '- status: %s\n' "$overall_status"
    printf -- '- generated_at: %s\n' "$generated_at"
    printf -- '- expected_tag: %s\n' "$expected_tag_summary"
    printf -- '- counts: PASS=%d, FAIL=%d, BLOCKED=%d, SKIPPED=%d\n\n' \
      "$PASS_COUNT" "$FAIL_COUNT" "$BLOCKED_COUNT" "$SKIPPED_COUNT"
    printf '| 检查 ID | 类别 | 必需 | 状态 | 证据摘要 |\n'
    printf '| --- | --- | --- | --- | --- |\n'
    for index in "${!CHECK_IDS[@]}"; do
      printf '| %s | %s | %s | %s | %s |\n' \
        "${CHECK_IDS[$index]}" "${CHECK_CATEGORIES[$index]}" \
        "${CHECK_REQUIRED[$index]}" "${CHECK_STATUSES[$index]}" \
        "${CHECK_EVIDENCE[$index]}"
    done
  } > "$SUMMARY_TEMP_FILE"

  mv -f "$REPORT_TEMP_FILE" "$REPORT_FILE"
  mv -f "$SUMMARY_TEMP_FILE" "$SUMMARY_FILE"
  REPORT_TEMP_FILE=""
  SUMMARY_TEMP_FILE=""

  printf '生产发布验收完成：%s（报告目录：%s）\n' "$overall_status" "$OUTPUT_DIR" >&2
  return "$exit_code"
}

parse_arguments() {
  local compose_file
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --profile)
        [ "$#" -ge 2 ] || fail_usage "--profile 缺少参数"
        [ -z "$PROFILE" ] || fail_usage "--profile 不得重复"
        PROFILE="$2"
        shift 2
        ;;
      --env-file)
        [ "$#" -ge 2 ] || fail_usage "--env-file 缺少参数"
        [ -n "$2" ] || fail_usage "--env-file 不能为空"
        [ "$ENV_FILE_EXPLICIT" = false ] || fail_usage "--env-file 不得重复"
        ENV_FILE="$2"
        ENV_FILE_EXPLICIT=true
        shift 2
        ;;
      --compose-file)
        [ "$#" -ge 2 ] || fail_usage "--compose-file 缺少参数"
        compose_file="$2"
        [ -n "$compose_file" ] || fail_usage "--compose-file 不能为空"
        COMPOSE_FILES+=("$compose_file")
        shift 2
        ;;
      --runtime-dir)
        [ "$#" -ge 2 ] || fail_usage "--runtime-dir 缺少参数"
        [ -n "$2" ] || fail_usage "--runtime-dir 不能为空"
        [ "$RUNTIME_DIR_EXPLICIT" = false ] || fail_usage "--runtime-dir 不得重复"
        RUNTIME_DIR="$2"
        RUNTIME_DIR_EXPLICIT=true
        shift 2
        ;;
      --evidence-dir)
        [ "$#" -ge 2 ] || fail_usage "--evidence-dir 缺少参数"
        [ -n "$2" ] || fail_usage "--evidence-dir 不能为空"
        [ "$EVIDENCE_DIR_EXPLICIT" = false ] || fail_usage "--evidence-dir 不得重复"
        EVIDENCE_DIR="$2"
        EVIDENCE_DIR_EXPLICIT=true
        shift 2
        ;;
      --output-dir)
        [ "$#" -ge 2 ] || fail_usage "--output-dir 缺少参数"
        [ -n "$2" ] || fail_usage "--output-dir 不能为空"
        [ "$OUTPUT_DIR_EXPLICIT" = false ] || fail_usage "--output-dir 不得重复"
        OUTPUT_DIR="$2"
        OUTPUT_DIR_EXPLICIT=true
        shift 2
        ;;
      --runtime)
        [ "$RUNTIME_CHECK" = false ] || fail_usage "--runtime 不得重复"
        RUNTIME_CHECK=true
        shift
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        fail_usage "未知参数：$1"
        ;;
    esac
  done
}

prepare_inputs() {
  local compose_file
  local parent_dir

  [ "$PROFILE" = isolated-ci ] || [ "$PROFILE" = production ] \
    || fail_usage "profile 必须是 isolated-ci 或 production"

  if [ "$RUNTIME_DIR" != "$SCRIPT_DIR" ]; then
    RUNTIME_DIR="$(resolve_path "$RUNTIME_DIR")"
  else
    RUNTIME_DIR="$SCRIPT_DIR"
  fi
  require_directory "$RUNTIME_DIR" "运行时目录"

  [ -n "$ENV_FILE" ] || ENV_FILE="$RUNTIME_DIR/.env"
  ENV_FILE="$(resolve_path "$ENV_FILE")"
  require_file "$ENV_FILE" "环境变量文件"

  if [ "${#COMPOSE_FILES[@]}" -eq 0 ]; then
    COMPOSE_FILES+=("$RUNTIME_DIR/docker-compose.yml")
  fi
  for compose_file in "${!COMPOSE_FILES[@]}"; do
    COMPOSE_FILES[$compose_file]="$(resolve_path "${COMPOSE_FILES[$compose_file]}")"
    require_file "${COMPOSE_FILES[$compose_file]}" "Compose 文件"
  done

  require_file "$RUNTIME_DIR/validate-env.sh" "validate-env.sh"
  require_file "$RUNTIME_DIR/production-readiness.sh" "production-readiness.sh"

  if [ -n "$EVIDENCE_DIR" ]; then
    EVIDENCE_DIR="$(resolve_path "$EVIDENCE_DIR")"
    require_directory "$EVIDENCE_DIR" "外部验收证据目录"
  fi

  if [[ "$DOCKER_BIN" = */* ]]; then
    [ -x "$DOCKER_BIN" ] || fail_usage "Docker 命令不可执行：$DOCKER_BIN"
    DOCKER_BIN="$(resolve_path "$DOCKER_BIN")"
  else
    DOCKER_BIN="$(command -v "$DOCKER_BIN" 2>/dev/null || true)"
    [ -n "$DOCKER_BIN" ] || fail_usage "未找到 Docker 命令"
  fi

  if [ "$OUTPUT_DIR_EXPLICIT" = true ]; then
    OUTPUT_DIR="$(resolve_path "$OUTPUT_DIR")"
    [ ! -L "$OUTPUT_DIR" ] || fail_usage "输出目录不得为符号链接：$OUTPUT_DIR"
    if [ -e "$OUTPUT_DIR" ]; then
      require_directory "$OUTPUT_DIR" "输出目录"
    else
      parent_dir="$(dirname "$OUTPUT_DIR")"
      require_directory "$parent_dir" "输出目录父目录"
      mkdir "$OUTPUT_DIR" || fail_usage "无法创建输出目录：$OUTPUT_DIR"
    fi
  else
    OUTPUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/equipsense-production-acceptance.XXXXXX")" \
      || fail_usage "无法创建临时输出目录"
    TEMP_OUTPUT_DIR=true
  fi
  chmod 700 "$OUTPUT_DIR" || fail_usage "无法设置输出目录权限：$OUTPUT_DIR"

  REPORT_FILE="$OUTPUT_DIR/checks.tsv"
  SUMMARY_FILE="$OUTPUT_DIR/summary.md"
  [ ! -L "$REPORT_FILE" ] || fail_usage "checks.tsv 不得为符号链接"
  [ ! -L "$SUMMARY_FILE" ] || fail_usage "summary.md 不得为符号链接"
  REPORT_TEMP_FILE="$(mktemp "$OUTPUT_DIR/.checks.tsv.XXXXXX")" \
    || fail_usage "无法创建验收报告临时文件"
  SUMMARY_TEMP_FILE="$(mktemp "$OUTPUT_DIR/.summary.md.XXXXXX")" \
    || fail_usage "无法创建验收摘要临时文件"
  printf 'check_id\tcategory\trequired\tstatus\tevidence\n' > "$REPORT_TEMP_FILE"
  : > "$SUMMARY_TEMP_FILE"
  collect_sensitive_values

  COMPOSE_COMMAND=("$DOCKER_BIN" compose --env-file "$ENV_FILE")
  for compose_file in "${COMPOSE_FILES[@]}"; do
    COMPOSE_COMMAND+=(-f "$compose_file")
  done
}

main() {
  local compose_output
  local readiness_args
  local validation_args

  parse_arguments "$@"
  prepare_inputs

  validation_args=(bash "$RUNTIME_DIR/validate-env.sh" "$ENV_FILE" --check-runtime-files)
  if [ "$PROFILE" = isolated-ci ]; then
    validation_args+=(--allow-isolated-e2e)
  fi
  run_command_check "static.env" "static" true "${validation_args[@]}"

  if run_compose_capture compose_output config --quiet; then
    record_check "static.compose" "static" true PASS "Compose 配置解析通过"
  else
    record_check "static.compose" "static" true FAIL \
      "Compose 配置解析失败：$(first_line "$compose_output")"
  fi

  check_artifact_images

  if [ "$RUNTIME_CHECK" = true ]; then
    readiness_args=(bash "$RUNTIME_DIR/production-readiness.sh" --env-file "$ENV_FILE")
    for compose_file in "${COMPOSE_FILES[@]}"; do
      readiness_args+=(--compose-file "$compose_file")
    done
    if [ "$PROFILE" = isolated-ci ]; then
      readiness_args+=(--allow-isolated-e2e)
    fi
    readiness_args+=(--runtime)
    run_command_check "runtime.services" "runtime" true \
      env "PRODUCTION_DOCKER_BIN=$DOCKER_BIN" "${readiness_args[@]}"
  elif [ "$PROFILE" = production ]; then
    record_check "runtime.services" "runtime" true BLOCKED \
      "production profile 必须显式传入 --runtime"
  else
    record_check "runtime.services" "runtime" false SKIPPED \
      "未传入 --runtime，未访问 Docker 服务状态"
  fi

  record_external_checks
  finish_acceptance
}

main "$@"
