#!/usr/bin/env bash
# =============================================================================
# bootstrap-production-secrets.sh — 生产环境本地随机凭据初始化工具
# =============================================================================
#
# 用途：只为 docker/.env 中可以由本机安全随机源生成的字段补齐强凭据。
#       许可证、真实租户、生产域名和证书仍必须由部署方或密钥管理系统提供。
#
# 使用方式：
#   cd docker && ./bootstrap-production-secrets.sh
#   ./docker/bootstrap-production-secrets.sh --env-file ./docker/.env
#   ./docker/bootstrap-production-secrets.sh --env-file ./docker/.env --sync-template-defaults
#
# 安全边界：
#   - 只替换空值或明确的占位值，永不覆盖已有有效凭据。
#   - 拒绝重复键、符号链接和并发更新，使用临时文件原子替换。
#   - 生成值不写日志，也不作为子进程参数传递。
#   - 生成后仍运行 validate-env.sh；门禁未通过时以非零状态退出。
# =============================================================================

set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
TEMPLATE_FILE="${SCRIPT_DIR}/.env.example"
TEMP_FILE=""
LOCK_DIR=""
REPAIR_IDENTICAL_DUPLICATES=false
SYNC_TEMPLATE_DEFAULTS=false
GENERATED_VALUE=""
GENERATED_COUNT=0
SYNCED_DEFAULT_COUNT=0
USED_VALUES=()
SEEN_KEYS=()
GENERATED_KEYS=()
GENERATED_VALUES=()
MISSING_KEYS=()
MISSING_VALUES=()

# 仅允许追加不含秘密、租户身份或真实域名绑定的生产默认项；新增键必须先经过
# 白名单审查，避免把未来加入 .env.example 的敏感字段误复制到已有环境文件。
SYNCABLE_TEMPLATE_KEYS=(
  ASPNETCORE_ENVIRONMENT
  EVENTBUS_PROVIDER
  ALLOW_INMEMORY_EVENTBUS_IN_PRODUCTION
  EVENTBUS_OUTBOX_ENABLED
  EVENTBUS_OUTBOX_POLL_INTERVAL_SECONDS
  EVENTBUS_OUTBOX_BATCH_SIZE
  EVENTBUS_OUTBOX_LEASE_SECONDS
  EVENTBUS_OUTBOX_MAX_BACKOFF_SECONDS
  EVENTBUS_OUTBOX_RETENTION_DAYS
  RABBITMQ_IMAGE
  RABBITMQ_USER
  RABBITMQ_PORT
  RABBITMQ_MGMT_PORT
  GATEWAY_ID
  GATEWAY_BUFFER_PATH
  GATEWAY_BACKEND_URL
  GATEWAY_ALLOWED_HOSTS
  GATEWAY_UPLOAD_INTERVAL
  EDGE_PORT
  EDGE_BLUEGREEN_PORT
  INTERNAL_BIND_ADDRESS
  PUBLIC_BIND_ADDRESS
  BACKEND_PORT
  FRONTEND_PORT
  FILE_STORAGE_PROVIDER
  FILE_STORAGE_BASE_PATH
  WAF_RULES_PATH
  WAF_REQUIRE_EXTERNAL_RULES
  JAEGER_SPAN_STORAGE_TYPE
  JAEGER_BADGER_EPHEMERAL
  OTEL_EXPORTER_OTLP_ENDPOINT
  SMTP_PORT
  SMTP_FROM_NAME
  SMTP_ENABLE_SSL
  EMAIL_DELIVERY_ENABLED
  EMAIL_DELIVERY_POLL_INTERVAL_SECONDS
  EMAIL_DELIVERY_BATCH_SIZE
  EMAIL_DELIVERY_LEASE_SECONDS
  EMAIL_DELIVERY_MAX_ATTEMPTS
  EMAIL_DELIVERY_MAX_BACKOFF_SECONDS
  EMAIL_DELIVERY_RETENTION_DAYS
  BEHIND_PROXY
  TRUSTED_PROXY_NETWORKS
  OUTBOUND_HTTP_ALLOW_PRIVATE_NETWORKS
  LLM_MODEL
  LLM_ENDPOINT
  SEED_DEMO_DATA
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

usage() {
  cat <<'EOF'
用法：
  bootstrap-production-secrets.sh [--env-file <路径>] [--sync-template-defaults]

说明：
  只生成本机随机凭据，不覆盖已有有效值；供应商许可证、真实租户 UUID、
  生产域名和 TLS/MQTT 证书必须由部署方另行配置。
  --sync-template-defaults 会从同目录 .env.example 追加缺失的白名单非秘密默认项，
  不会覆盖已有键，也不会同步密码、密钥、许可证、租户或域名。
  可选的 --repair-identical-duplicates 只会归一化值完全相同的重复键；
  发现冲突值时仍会拒绝修改环境文件。
EOF
}

error() {
  printf '%b错误：%s%b\n' "${RED}" "$*" "${NC}" >&2
}

warn() {
  printf '%b警告：%s%b\n' "${YELLOW}" "$*" "${NC}" >&2
}

success() {
  printf '%b%s%b\n' "${GREEN}" "$*" "${NC}"
}

is_syncable_template_key() {
  local candidate="$1"
  local sync_key
  for sync_key in "${SYNCABLE_TEMPLATE_KEYS[@]}"; do
    [ "$candidate" = "$sync_key" ] && return 0
  done
  return 1
}

read_template_value() {
  local expected_key="$1"
  awk -F= -v key="$expected_key" \
    '$1 == key { print substr($0, index($0, "=") + 1); exit }' \
    "$TEMPLATE_FILE"
}

has_template_placeholder_marker() {
  case "$1" in
    *"请修改"*|*"PLEASE_CHANGE"*|*"CHANGE_ME"*|*"SET_VIA_ENVIRONMENT"*|*"change-me"*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

validate_sync_template() {
  [ -f "$TEMPLATE_FILE" ] || fail "模板文件不存在：$TEMPLATE_FILE"
  [ ! -L "$TEMPLATE_FILE" ] || fail "拒绝使用符号链接模板文件：$TEMPLATE_FILE"
  [ -r "$TEMPLATE_FILE" ] || fail "模板文件不可读：$TEMPLATE_FILE"

  local sync_key
  local template_key_count
  local template_value
  for sync_key in "${SYNCABLE_TEMPLATE_KEYS[@]}"; do
    is_syncable_template_key "$sync_key" || fail "模板同步白名单校验失败：未知键 $sync_key"
    template_key_count="$(awk -F= -v key="$sync_key" \
      '$1 == key { count++ } END { print count + 0 }' "$TEMPLATE_FILE")"
    [ "$template_key_count" -eq 1 ] \
      || fail "模板基线错误：$sync_key 必须在 .env.example 中恰好定义一次"
    template_value="$(read_template_value "$sync_key")"
    [ -n "$template_value" ] \
      || fail "模板基线错误：$sync_key 不得为空"
    ! has_template_placeholder_marker "$template_value" \
      || fail "模板基线错误：$sync_key 仍为占位值"
  done
}

print_remediation_hints() {
  local validation_output="$1"

  printf '%b整改提示：%b\n' "${YELLOW}" "${NC}"
  if [ "$GENERATED_COUNT" -gt 0 ] || [[ "$validation_output" == *"必填环境变量"* ]]; then
    if [ "$SYNC_TEMPLATE_DEFAULTS" = true ]; then
      printf '  - 本机随机凭据：可再次运行 setup.sh --sync-template-defaults；已有有效值不会被覆盖。\n'
    else
      printf '  - 本机随机凭据：可再次运行 setup.sh --bootstrap-local-secrets；已有有效值不会被覆盖。\n'
    fi
  fi
  if [[ "$validation_output" == *"重复定义"* ]] || [[ "$validation_output" == *"重复键"* ]]; then
    printf '  - 重复键：仅值完全相同时可显式使用 --repair-identical-duplicates；冲突值必须人工清理。\n'
  fi
  printf '  - 外部生产配置：许可证、真实租户 UUID、域名、SMTP、LLM 和 OTLP 等必须由部署方或密钥管理系统提供。\n'
  printf '  - TLS/MQTT：请预置正式证书、私钥和 CA 链，再运行 setup.sh 或 validate-env.sh .env --check-runtime-files。\n'
  printf '  - Docker/Compose：请确认依赖、挂载文件和权限后重新运行 setup.sh 或 production-readiness.sh。\n'
}

fail() {
  error "$*"
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env-file)
      [ "$#" -ge 2 ] || { usage >&2; exit 2; }
      ENV_FILE="$2"
      shift 2
      ;;
    --repair-identical-duplicates)
      REPAIR_IDENTICAL_DUPLICATES=true
      shift
      ;;
    --sync-template-defaults)
      SYNC_TEMPLATE_DEFAULTS=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      usage >&2
      exit 2
      ;;
  esac
done

# 相对路径以调用者当前目录为准，避免从仓库根目录运行时误指向 docker/.env。
if [[ "$ENV_FILE" != /* ]]; then
  ENV_DIR="$(dirname "$ENV_FILE")"
  ENV_NAME="$(basename "$ENV_FILE")"
  [ -d "$ENV_DIR" ] || fail "环境变量文件所在目录不存在：$ENV_DIR"
  ENV_FILE="$(cd "$ENV_DIR" && pwd -P)/$ENV_NAME"
fi

[ -L "$ENV_FILE" ] && fail "拒绝修改符号链接环境文件：$ENV_FILE"
[ -f "$ENV_FILE" ] || fail "环境变量文件不存在：$ENV_FILE；请先从 .env.example 复制并配置"
[ -r "$ENV_FILE" ] || fail "环境变量文件不可读：$ENV_FILE"
[ -f "${SCRIPT_DIR}/validate-env.sh" ] || fail "缺少同目录环境变量校验器：${SCRIPT_DIR}/validate-env.sh"
command -v openssl >/dev/null 2>&1 || fail "未找到 openssl，无法生成安全随机凭据"

if [ "$SYNC_TEMPLATE_DEFAULTS" = true ]; then
  validate_sync_template
fi

# Compose 对重复键采用最后一项；继续编辑会让部署结果依赖文件顺序。
# 默认仍然全部拒绝；只有显式开启修复时，才允许删除值完全相同的重复行。
# awk 只输出键名和“是否冲突”，绝不输出环境变量值。
DUPLICATE_KEY_DETAILS="$(awk -F= '
  /^[A-Za-z_][A-Za-z0-9_]*=/ {
    key = $1
    value = substr($0, index($0, "=") + 1)
    counts[key]++
    token = key SUBSEP value
    if (!(token in seen)) {
      seen[token] = 1
      unique_values[key]++
    }
  }
  END {
    for (key in counts) {
      if (counts[key] > 1) {
        printf "%s\t%s\n", key, (unique_values[key] > 1 ? "conflict" : "identical")
      }
    }
  }
' "$ENV_FILE")"
if [ -n "$DUPLICATE_KEY_DETAILS" ]; then
  has_conflicting_duplicate=false
  while IFS=$'\t' read -r duplicate_key duplicate_state; do
    [ -n "$duplicate_key" ] || continue
    if [ "$duplicate_state" = "conflict" ]; then
      error "${duplicate_key} 重复定义且值不一致，无法自动修复（未修改环境文件）"
      has_conflicting_duplicate=true
    elif [ "$REPAIR_IDENTICAL_DUPLICATES" != true ]; then
      error "${duplicate_key} 重复定义，未修改环境文件"
    fi
  done <<< "$DUPLICATE_KEY_DETAILS"

  if [ "$has_conflicting_duplicate" = true ] || [ "$REPAIR_IDENTICAL_DUPLICATES" != true ]; then
    print_remediation_hints "重复键 ${DUPLICATE_KEY_DETAILS}"
    exit 1
  fi
  warn "已启用同值重复键归一化，仅保留每个键的首次定义"
fi

# 目录锁用 mkdir 的原子性避免 macOS/Linux 都依赖可选的 flock 命令。
LOCK_DIR="${ENV_FILE}.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  fail "环境文件正在被其他初始化进程使用：$ENV_FILE"
fi

cleanup() {
  if [ -n "$TEMP_FILE" ]; then
    rm -f "$TEMP_FILE"
  fi
  if [ -n "$LOCK_DIR" ]; then
    rmdir "$LOCK_DIR" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

TEMP_FILE="$(mktemp "${ENV_FILE}.tmp.XXXXXX")"
chmod 600 "$TEMP_FILE"

is_required_local_key() {
  case "$1" in
    PG_PASSWORD|REDIS_PASSWORD|RABBITMQ_PASSWORD|MQTT_USERNAME|MQTT_PASSWORD|\
    SEED_ADMIN_PASSWORD|SEED_LEAD_PASSWORD|SEED_TECH_PASSWORD|SEED_OPERATOR_PASSWORD|SEED_VIEWER_PASSWORD|\
    JWT_SECRET|TOTP_ENCRYPTION_KEY|PII_ENCRYPTION_KEY|GATEWAY_AUTH_KEY|SEQ_ADMIN_PASSWORD|GRAFANA_PASSWORD)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_optional_local_key() {
  [ "$1" = "AUTH_MACHINE_API_KEY" ]
}

has_placeholder_marker() {
  case "$1" in
    *"请修改"*|*"PLEASE_CHANGE"*|*"CHANGE_ME"*|*"SET_VIA_ENVIRONMENT"*|*"change-me"*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

should_generate_value() {
  local key="$1"
  local current_value="$2"

  if is_required_local_key "$key"; then
    [ -z "$current_value" ] || has_placeholder_marker "$current_value" \
      || { [ "$key" = "MQTT_USERNAME" ] && [ "$current_value" = "device" ]; } \
      || { [ "$key" = "MQTT_PASSWORD" ] && [ "$current_value" = "device123" ]; }
    return
  fi

  # 可选机器密钥只有在配置行明确启用且仍是占位值时才生成，空值表示用户选择关闭该能力。
  is_optional_local_key "$key" && [ -n "$current_value" ] && has_placeholder_marker "$current_value"
}

value_is_used() {
  local candidate="$1"
  local used_value
  for used_value in "${USED_VALUES[@]}"; do
    [ "$candidate" = "$used_value" ] && return 0
  done
  return 1
}

generate_unique_hex() {
  local byte_count="$1"
  local candidate
  while :; do
    if ! candidate="$(openssl rand -hex "$byte_count" 2>/dev/null)" || [ -z "$candidate" ]; then
      fail "openssl 无法生成随机凭据"
    fi
    if ! value_is_used "$candidate"; then
      GENERATED_VALUE="$candidate"
      USED_VALUES+=("$candidate")
      return 0
    fi
  done
}

generate_unique_base64() {
  local byte_count="$1"
  local candidate
  while :; do
    if ! candidate="$(openssl rand -base64 "$byte_count" 2>/dev/null | tr -d '\r\n')" || [ -z "$candidate" ]; then
      fail "openssl 无法生成随机加密密钥"
    fi
    if ! value_is_used "$candidate"; then
      GENERATED_VALUE="$candidate"
      USED_VALUES+=("$candidate")
      return 0
    fi
  done
}

generate_unique_mqtt_username() {
  local candidate
  while :; do
    generate_unique_hex 12
    candidate="equipsense_device_${GENERATED_VALUE}"
    if ! value_is_used "$candidate"; then
      GENERATED_VALUE="$candidate"
      USED_VALUES+=("$candidate")
      return 0
    fi
  done
}

generate_for_key() {
  case "$1" in
    TOTP_ENCRYPTION_KEY|PII_ENCRYPTION_KEY)
      generate_unique_base64 32
      ;;
    MQTT_USERNAME)
      generate_unique_mqtt_username
      ;;
    *)
      # 十六进制只包含 ASCII 字符且不含 Compose、shell 或 URL 特殊分隔符。
      generate_unique_hex 32
      ;;
  esac
}

key_was_seen() {
  local expected_key="$1"
  local seen_key
  for seen_key in "${SEEN_KEYS[@]}"; do
    [ "$expected_key" = "$seen_key" ] && return 0
  done
  return 1
}

record_generated_value() {
  local key="$1"
  GENERATED_KEYS+=("$key")
  GENERATED_VALUES+=("$GENERATED_VALUE")
  GENERATED_COUNT=$((GENERATED_COUNT + 1))
}

# 先收集已有值，尽量让新生成的随机值与文件中现有凭据保持独立。
while IFS= read -r env_line || [ -n "$env_line" ]; do
  if [[ "$env_line" =~ ^[A-Za-z_][A-Za-z0-9_]*=(.*)$ ]]; then
    existing_value="${BASH_REMATCH[1]}"
    [ -n "$existing_value" ] && USED_VALUES+=("$existing_value")
  fi
done < "$ENV_FILE"

# 按原顺序重写，只替换允许自动生成的字段；注释和其它配置保持原样。
while IFS= read -r env_line || [ -n "$env_line" ]; do
  if [[ "$env_line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    env_key="${BASH_REMATCH[1]}"
    env_value="${BASH_REMATCH[2]}"
    if [ "$REPAIR_IDENTICAL_DUPLICATES" = true ] \
      && [ "${#SEEN_KEYS[@]}" -gt 0 ] \
      && key_was_seen "$env_key"; then
      continue
    fi
    SEEN_KEYS+=("$env_key")
    if should_generate_value "$env_key" "$env_value"; then
      generate_for_key "$env_key"
      printf '%s=%s\n' "$env_key" "$GENERATED_VALUE" >> "$TEMP_FILE"
      record_generated_value "$env_key"
    else
      printf '%s\n' "$env_line" >> "$TEMP_FILE"
    fi
  else
    printf '%s\n' "$env_line" >> "$TEMP_FILE"
  fi
done < "$ENV_FILE"

# 自定义 .env 如果遗漏必填键，追加生成值；可选字段不会被擅自添加。
REQUIRED_LOCAL_KEYS=(
  PG_PASSWORD REDIS_PASSWORD RABBITMQ_PASSWORD MQTT_USERNAME MQTT_PASSWORD
  SEED_ADMIN_PASSWORD SEED_LEAD_PASSWORD SEED_TECH_PASSWORD SEED_OPERATOR_PASSWORD SEED_VIEWER_PASSWORD
  JWT_SECRET TOTP_ENCRYPTION_KEY PII_ENCRYPTION_KEY GATEWAY_AUTH_KEY SEQ_ADMIN_PASSWORD GRAFANA_PASSWORD
)
for required_key in "${REQUIRED_LOCAL_KEYS[@]}"; do
  if ! key_was_seen "$required_key"; then
    generate_for_key "$required_key"
    MISSING_KEYS+=("$required_key")
    MISSING_VALUES+=("$GENERATED_VALUE")
    GENERATED_COUNT=$((GENERATED_COUNT + 1))
  fi
done

if [ "${#MISSING_KEYS[@]}" -gt 0 ]; then
  printf '\n# 以下必填本地凭据由 bootstrap-production-secrets.sh 生成，请纳入密钥管理系统\n' >> "$TEMP_FILE"
  for index in "${!MISSING_KEYS[@]}"; do
    printf '%s=%s\n' "${MISSING_KEYS[$index]}" "${MISSING_VALUES[$index]}" >> "$TEMP_FILE"
  done
fi

if [ "$SYNC_TEMPLATE_DEFAULTS" = true ]; then
  SYNCED_KEYS=()
  SYNCED_VALUES=()
  for sync_key in "${SYNCABLE_TEMPLATE_KEYS[@]}"; do
    if ! key_was_seen "$sync_key"; then
      sync_value="$(read_template_value "$sync_key")"
      SYNCED_KEYS+=("$sync_key")
      SYNCED_VALUES+=("$sync_value")
      SEEN_KEYS+=("$sync_key")
      SYNCED_DEFAULT_COUNT=$((SYNCED_DEFAULT_COUNT + 1))
    fi
  done

  if [ "$SYNCED_DEFAULT_COUNT" -gt 0 ]; then
    printf '\n# 以下非秘密默认项由 bootstrap-production-secrets.sh 从 .env.example 追加\n' >> "$TEMP_FILE"
    for index in "${!SYNCED_KEYS[@]}"; do
      printf '%s=%s\n' "${SYNCED_KEYS[$index]}" "${SYNCED_VALUES[$index]}" >> "$TEMP_FILE"
    done
  fi
fi

# 临时文件与原文件位于同一目录，mv 在同一文件系统内是原子的；替换后再次收紧权限。
chmod 600 "$TEMP_FILE"
mv "$TEMP_FILE" "$ENV_FILE"
TEMP_FILE=""

if [ "$GENERATED_COUNT" -eq 0 ]; then
  success "未发现需要自动生成的本地凭据，已有值保持不变"
else
  success "已生成 ${GENERATED_COUNT} 个本地随机凭据（不会在日志中显示具体值）"
fi
if [ "$SYNCED_DEFAULT_COUNT" -gt 0 ]; then
  success "已追加 ${SYNCED_DEFAULT_COUNT} 个非秘密模板默认项（不会覆盖已有键）"
fi

set +e
VALIDATION_OUTPUT="$(bash "${SCRIPT_DIR}/validate-env.sh" "$ENV_FILE" 2>&1)"
VALIDATION_STATUS=$?
set -e
printf '%s\n' "$VALIDATION_OUTPUT"

if [ "$VALIDATION_STATUS" -ne 0 ]; then
  print_remediation_hints "$VALIDATION_OUTPUT"
  warn "仍需人工配置或验收生产专属项；脚本已保留安全生成的本地凭据，但不会误报可上线"
  exit "$VALIDATION_STATUS"
fi

success "环境变量门禁通过；仍需运行 setup.sh 完成生产证书、运行时文件和最终部署校验"
