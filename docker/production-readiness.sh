#!/usr/bin/env bash
# =============================================================================
# production-readiness.sh — 生产环境上线前只读自检入口
# =============================================================================
#
# 用途：在启动或发布生产服务前，集中检查环境变量、TLS/MQTT 运行时文件、
#       Docker daemon 和最终 Compose 配置；可选地检查当前服务是否健康。
#
# 使用方式：
#   bash docker/production-readiness.sh --env-file docker/.env
#   bash docker/production-readiness.sh --env-file docker/.env --runtime
#
# 安全边界：
#   - 只读取配置和 Docker 状态，绝不执行 up/start/restart/build/pull/exec；
#   - 不 source .env，不把凭据作为子进程参数传递，不打印 Compose 展开配置；
#   - 失败输出只保留变量名、文件名、服务名和错误类别。
# =============================================================================

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ENV_FILE="${PRODUCTION_ENV_FILE:-${SCRIPT_DIR}/.env}"
COMPOSE_FILES=()
DOCKER_BIN="${PRODUCTION_DOCKER_BIN:-docker}"
RUNTIME_CHECK=false
ERRORS=0
DOCKER_READY=false
COMPOSE_READY=false
COMPOSE_FILES_VALID=true
SENSITIVE_VALUES=()

usage() {
  cat <<'EOF'
用法：
  production-readiness.sh [--env-file <路径>] [--compose-file <路径> ...] [--runtime]

选项：
  --env-file <路径>  指定生产环境变量文件，默认使用 docker/.env
  --compose-file <路径>  指定 Compose 文件，可重复传入；默认使用 docker/docker-compose.yml
  --runtime          额外检查 Compose 中的服务是否运行且健康
  --help             显示帮助

说明：
  默认只执行上线前静态检查，不会启动或重启服务。服务启动后追加
  --runtime，可检查除一次性 jaeger-init 外的所有 Compose 服务状态。
EOF
}

error() {
  printf '  [✗] %s\n' "$*" >&2
  ERRORS=$((ERRORS + 1))
}

warn() {
  printf '  [!] %s\n' "$*" >&2
}

success() {
  printf '  [✓] %s\n' "$*"
}

resolve_path() {
  local path="$1"
  local directory
  if [[ "$path" = /* ]]; then
    printf '%s' "$path"
    return 0
  fi
  directory="$(cd "$(dirname "$path")" 2>/dev/null && pwd -P)" \
    || return 1
  printf '%s/%s' "$directory" "$(basename "$path")"
}

sanitize_output() {
  local output="$1"
  local value
  for value in "${SENSITIVE_VALUES[@]}"; do
    [ -n "$value" ] || continue
    output="${output//"$value"/[已隐藏]}"
  done
  printf '%s' "$output"
}

collect_sensitive_values() {
  local env_line
  local env_key
  local env_value
  if [ ! -f "$ENV_FILE" ] || [ -L "$ENV_FILE" ]; then
    return 0
  fi

  while IFS= read -r env_line || [ -n "$env_line" ]; do
    if [[ "$env_line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      env_key="${BASH_REMATCH[1]}"
      env_value="${BASH_REMATCH[2]}"
      case "$env_key" in
        PG_PASSWORD|REDIS_PASSWORD|RABBITMQ_PASSWORD|MQTT_PASSWORD|JWT_SECRET|\
        TOTP_ENCRYPTION_KEY|PII_ENCRYPTION_KEY|AUTOMAPPER_LICENSE_KEY|GATEWAY_AUTH_KEY|\
        AUTH_MACHINE_API_KEY|SEED_ADMIN_PASSWORD|SEED_LEAD_PASSWORD|SEED_TECH_PASSWORD|\
        SEED_OPERATOR_PASSWORD|SEED_VIEWER_PASSWORD|SEQ_ADMIN_PASSWORD|GRAFANA_PASSWORD|\
        SMTP_PASSWORD|LLM_API_KEY|VAPID__PRIVATEKEY|FILE_STORAGE_S3_SECRET_KEY|\
        EVALUATION_INGESTION_API_KEY)
          [ -n "$env_value" ] && SENSITIVE_VALUES+=("$env_value")
          ;;
      esac
    fi
  done < "$ENV_FILE"
}

run_captured() {
  local output_variable="$1"
  shift
  local captured_output
  local command_status
  set +e
  captured_output="$("$@" 2>&1)"
  command_status=$?
  set -e
  printf -v "$output_variable" '%s' "$captured_output"
  return "$command_status"
}

run_compose_captured() {
  local output_variable="$1"
  shift
  local compose_command=("$DOCKER_BIN" compose --env-file "$ENV_FILE")
  local compose_file
  for compose_file in "${COMPOSE_FILES[@]}"; do
    compose_command+=(-f "$compose_file")
  done
  compose_command+=("$@")
  run_captured "$output_variable" "${compose_command[@]}"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --env-file)
      [ "$#" -ge 2 ] || { usage >&2; exit 2; }
      ENV_FILE="$2"
      shift 2
      ;;
    --compose-file)
      [ "$#" -ge 2 ] || { usage >&2; exit 2; }
      COMPOSE_FILES+=("$2")
      shift 2
      ;;
    --runtime)
      RUNTIME_CHECK=true
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

if [ "${#COMPOSE_FILES[@]}" -eq 0 ]; then
  COMPOSE_FILES=("${PRODUCTION_COMPOSE_FILE:-${SCRIPT_DIR}/docker-compose.yml}")
fi

if ! ENV_FILE="$(resolve_path "$ENV_FILE")"; then
  error "无法解析环境变量文件路径"
else
  collect_sensitive_values
fi

for compose_index in "${!COMPOSE_FILES[@]}"; do
  compose_path="${COMPOSE_FILES[$compose_index]}"
  if ! compose_path="$(resolve_path "$compose_path")"; then
    error "无法解析 Compose 文件路径"
    COMPOSE_FILES_VALID=false
  else
    COMPOSE_FILES[$compose_index]="$compose_path"
  fi
done

printf '生产只读自检开始\n'

if [ -L "$ENV_FILE" ]; then
  error "环境变量文件不得为符号链接"
elif [ ! -f "$ENV_FILE" ]; then
  error "环境变量文件不存在"
else
  success "环境变量文件已找到"
fi

for compose_file in "${COMPOSE_FILES[@]}"; do
  if [ -L "$compose_file" ]; then
    error "Compose 文件不得为符号链接"
    COMPOSE_FILES_VALID=false
  elif [ ! -f "$compose_file" ]; then
    error "Compose 文件不存在"
    COMPOSE_FILES_VALID=false
  else
    success "Compose 文件已找到"
  fi
done

if [ ! -f "${SCRIPT_DIR}/validate-env.sh" ]; then
  error "缺少生产环境校验器 validate-env.sh"
fi

validation_output=""
validation_status=1
if [ -f "$ENV_FILE" ] && [ ! -L "$ENV_FILE" ] && [ -f "${SCRIPT_DIR}/validate-env.sh" ]; then
  if run_captured validation_output bash "${SCRIPT_DIR}/validate-env.sh" "$ENV_FILE" --check-runtime-files; then
    validation_status=0
    success "静态生产门禁通过"
  else
    sanitized_validation_output="$(sanitize_output "$validation_output")"
    [ -n "$sanitized_validation_output" ] && printf '%s\n' "$sanitized_validation_output" >&2
    validation_issue_count="$(printf '%s\n' "$sanitized_validation_output" | awk '$0 ~ /\[✗\]/ { count++ } END { print count + 0 }')"
    if [ "$validation_issue_count" -gt 0 ]; then
      printf '  [✗] 静态生产门禁失败：发现 %s 项问题\n' "$validation_issue_count" >&2
      ERRORS=$((ERRORS + validation_issue_count))
    else
      error "静态生产门禁失败"
    fi
  fi
fi

# 先完成本地静态门禁；环境文件或证书无效时无需访问 Docker daemon，
# 这样配置错误可以立即反馈，也避免 daemon 异常掩盖真正的部署问题。
if [ "$validation_status" -ne 0 ] || [ "$COMPOSE_FILES_VALID" != true ]; then
  printf '生产只读自检失败：发现 %d 项问题\n' "$ERRORS" >&2
  exit 1
fi

if ! command -v "$DOCKER_BIN" >/dev/null 2>&1; then
  error "未找到 Docker 命令"
else
  docker_version_output=""
  if run_captured docker_version_output "$DOCKER_BIN" compose version; then
    success "Docker Compose 命令可用"
  else
    error "Docker Compose 命令不可用"
  fi

  docker_info_output=""
  if run_captured docker_info_output "$DOCKER_BIN" info; then
    DOCKER_READY=true
    success "Docker daemon 可用"
  else
    error "Docker daemon 不可用"
  fi
fi

compose_output=""
compose_status=1
if [ "$DOCKER_READY" = true ] && [ -f "$ENV_FILE" ] && [ ! -L "$ENV_FILE" ] && [ "$COMPOSE_FILES_VALID" = true ]; then
  if run_compose_captured compose_output config --quiet; then
    COMPOSE_READY=true
    success "Compose 配置解析通过"
  else
    error "Compose 配置解析失败"
  fi
fi

if [ "$RUNTIME_CHECK" = true ]; then
  if [ "$DOCKER_READY" != true ] || [ "$COMPOSE_READY" != true ] || [ "$validation_status" -ne 0 ]; then
    error "静态门禁未通过，跳过运行态服务检查"
  else
    services_output=""
    if ! run_compose_captured services_output config --services; then
      error "无法读取 Compose 服务清单"
    else
      services=()
      while IFS= read -r service || [ -n "$service" ]; do
        [ -n "$service" ] && services+=("$service")
      done <<< "$services_output"

      if [ "${#services[@]}" -eq 0 ]; then
        error "Compose 服务清单为空"
      else
        services_status_output=""
        if ! run_compose_captured services_status_output ps --all --format '{{.Service}}\t{{.State}}\t{{.Health}}'; then
          error "无法读取 Compose 服务状态"
        else
          runtime_errors_before=$ERRORS
          for service in "${services[@]}"; do
            # jaeger-init 只负责一次性初始化，成功后正常处于 exited 状态。
            [ "$service" = "jaeger-init" ] && continue

            service_line="$(printf '%s\n' "$services_status_output" | awk -F '\t' -v expected_service="$service" '$1 == expected_service { print; exit }')"
            if [ -z "$service_line" ]; then
              error "服务 ${service} 未创建或未运行"
              continue
            fi

            service_name=""
            service_state=""
            service_health=""
            IFS=$'\t' read -r service_name service_state service_health <<< "$service_line" || true
            if [ "$service_state" != "running" ]; then
              error "服务 ${service} 状态异常：${service_state:-未知}"
              continue
            fi
            if [ -n "$service_health" ] && [ "$service_health" != "healthy" ]; then
              error "服务 ${service} 健康状态异常：${service_health}"
            fi
          done

          if [ "$ERRORS" -eq "$runtime_errors_before" ]; then
            success "运行态服务检查通过"
          fi
        fi
      fi
    fi
  fi
fi

if [ "$ERRORS" -ne 0 ]; then
  printf '生产只读自检失败：发现 %d 项问题\n' "$ERRORS" >&2
  exit 1
fi

if [ "$RUNTIME_CHECK" = true ]; then
  success "生产只读自检通过（静态门禁 + 运行态服务）"
else
  warn "未执行运行态服务检查；服务启动后请追加 --runtime"
  success "生产只读自检通过（静态门禁）"
fi
