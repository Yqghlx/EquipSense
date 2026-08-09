#!/usr/bin/env bash
# 生产环境变量校验器。
# setup.sh 和人工部署可以复用同一套校验，避免 Compose 只报出第一个缺失变量。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${1:-$SCRIPT_DIR/.env}"
CHECK_RUNTIME_FILES=false
if [ "${2:-}" = "--check-runtime-files" ]; then
  CHECK_RUNTIME_FILES=true
fi
ERRORS=0

error() {
  printf '  [✗] %s\n' "$*" >&2
  ERRORS=$((ERRORS + 1))
}

read_env_value() {
  local key="$1"
  local line
  line="$(grep -E "^$key=" "$ENV_FILE" | tail -n 1 || true)"
  printf '%s' "${line#*=}"
}

get_file_mode() {
  if stat -c '%a' "$ENV_FILE" >/dev/null 2>&1; then
    stat -c '%a' "$ENV_FILE"
  else
    stat -f '%Lp' "$ENV_FILE"
  fi
}

if [ ! -f "$ENV_FILE" ]; then
  error "环境变量文件不存在：$ENV_FILE"
else
  # 生产凭据文件禁止被同组或其他用户读取；setup.sh 会在首次创建后自动设置为 600。
  env_mode="$(get_file_mode)"
  case "$env_mode" in
    400|600)
      ;;
    *)
      error ".env 文件权限不安全（当前 ${env_mode}），请设置为 600"
      ;;
  esac

  REQUIRED_ENV_VARS=(
    "PG_PASSWORD"
    "REDIS_PASSWORD"
    "RABBITMQ_IMAGE"
    "RABBITMQ_PASSWORD"
    "JWT_SECRET"
    "GATEWAY_AUTH_KEY"
    "MQTT_USERNAME"
    "MQTT_PASSWORD"
    "SEED_ADMIN_PASSWORD"
    "SEED_LEAD_PASSWORD"
    "SEED_TECH_PASSWORD"
    "SEED_OPERATOR_PASSWORD"
    "SEED_VIEWER_PASSWORD"
    "FRONTEND_URL"
    "SEQ_ADMIN_PASSWORD"
    "GRAFANA_PASSWORD"
  )

  for key in "${REQUIRED_ENV_VARS[@]}"; do
    value="$(read_env_value "$key")"
    if [ -z "$value" ] || [[ "$value" == *"请修改"* ]] || [[ "$value" == *"PLEASE_CHANGE"* ]] || { [ "$key" = "MQTT_USERNAME" ] && [ "$value" = "device" ]; } || { [ "$key" = "MQTT_PASSWORD" ] && [ "$value" = "device123" ]; }; then
      error "必填环境变量 $key 缺失或仍为占位值（不会打印其内容）"
    fi
  done

  jwt_value="$(read_env_value JWT_SECRET)"
  if [ -n "$jwt_value" ] && [[ "$jwt_value" != *"请修改"* ]] && [ "${#jwt_value}" -lt 32 ]; then
    error "JWT_SECRET 长度不足 32 个字符"
  fi

  gateway_auth_key="$(read_env_value GATEWAY_AUTH_KEY)"
  if [ -n "$gateway_auth_key" ] && [[ "$gateway_auth_key" != *"PLEASE_CHANGE"* ]]; then
    if [ "${#gateway_auth_key}" -lt 32 ]; then
      error "GATEWAY_AUTH_KEY 长度不足 32 个字符"
    fi
    if printf '%s' "$gateway_auth_key" | LC_ALL=C grep -q '[^ -~]'; then
      error "GATEWAY_AUTH_KEY 必须只包含 ASCII 字符"
    fi
  fi

  rabbitmq_password="$(read_env_value RABBITMQ_PASSWORD)"
  if [ -n "$rabbitmq_password" ] && [[ "$rabbitmq_password" != *"请修改"* ]] && [ "${#rabbitmq_password}" -lt 16 ]; then
    error "RABBITMQ_PASSWORD 长度不足 16 个字符"
  fi

  rabbitmq_user="$(read_env_value RABBITMQ_USER)"
  if [ "$rabbitmq_user" = "guest" ]; then
    error "RABBITMQ_USER 不得使用 guest"
  fi

  # 生产凭据即使非占位值也不能过短，避免部署门禁被“任意非空字符串”绕过。
  for key in PG_PASSWORD REDIS_PASSWORD MQTT_PASSWORD SEQ_ADMIN_PASSWORD GRAFANA_PASSWORD; do
    value="$(read_env_value "$key")"
    if [ -n "$value" ] && [[ "$value" != *"请修改"* ]] && [ "${#value}" -lt 16 ]; then
      error "$key 长度不足 16 个字符"
    fi
  done

  # 种子账户会直接获得登录能力，不能只校验非空；应用启动时也会执行同样的门禁。
  for key in SEED_ADMIN_PASSWORD SEED_LEAD_PASSWORD SEED_TECH_PASSWORD SEED_OPERATOR_PASSWORD SEED_VIEWER_PASSWORD; do
    value="$(read_env_value "$key")"
    if [ -n "$value" ] && [[ "$value" != *"请修改"* ]] && [[ "$value" != *"PLEASE_CHANGE"* ]] && [[ "$value" != *"CHANGE_ME"* ]] && [[ "$value" != *"change-me"* ]] && [ "${#value}" -lt 16 ]; then
      error "$key 长度不足 16 个字符"
    fi
  done

  frontend_url="$(read_env_value FRONTEND_URL)"
  if [ -n "$frontend_url" ] && [[ "$frontend_url" != https://* ]]; then
    error "FRONTEND_URL 必须使用 HTTPS"
  fi

  s3_sync="$(read_env_value S3_SYNC)"
  if [[ "$s3_sync" =~ ^([Tt][Rr][Uu][Ee]|1)$ ]]; then
    s3_bucket="$(read_env_value S3_BUCKET)"
    if [ -z "$s3_bucket" ]; then
      error "S3_SYNC 已开启，但 S3_BUCKET 未配置"
    elif [[ "$s3_bucket" != s3://* ]]; then
      error "S3_BUCKET 必须使用 s3:// 开头的目标地址"
    fi
  fi

  rabbitmq_image="$(read_env_value RABBITMQ_IMAGE)"
  if [ -n "$rabbitmq_image" ] && [[ "$rabbitmq_image" != *@sha256:* ]]; then
    error "RABBITMQ_IMAGE 必须使用带 digest 的固定镜像引用"
  fi

  tenant2_account="$(read_env_value SEED_TENANT2_ACCOUNT)"
  if [[ "$tenant2_account" =~ ^([Tt][Rr][Uu][Ee]|1)$ ]]; then
    tenant2_password="$(read_env_value SEED_TENANT2_PASSWORD)"
    if [ -z "$tenant2_password" ] || [[ "$tenant2_password" == *"请修改"* ]] || [ "$tenant2_password" = "Tenant2@123" ]; then
      error "SEED_TENANT2_ACCOUNT 已开启，但 SEED_TENANT2_PASSWORD 缺失或仍为公开默认值"
    elif [[ "$tenant2_password" == *"PLEASE_CHANGE"* ]] || [[ "$tenant2_password" == *"CHANGE_ME"* ]] || [[ "$tenant2_password" == *"change-me"* ]] || [ "${#tenant2_password}" -lt 16 ]; then
      error "SEED_TENANT2_PASSWORD 不得使用占位值且长度至少 16 个字符"
    fi
  fi

  # Compose 的 bind mount 文件缺失会把错误推迟到容器启动阶段；部署门禁可显式
  # 开启此检查，在任何镜像拉取或容器重启前确认生产运行时文件已经就位。
  if [ "$CHECK_RUNTIME_FILES" = true ]; then
    RUNTIME_FILES=(
      "ssl/cert.pem"
      "ssl/key.pem"
      "mqtt-certs/ca.crt"
      "mqtt-certs/server.crt"
      "mqtt-certs/server.key"
      "mosquitto_passwd/passwd"
      "mosquitto.prod.conf"
      "rabbitmq/rabbitmq.conf"
      "rabbitmq/definitions.json"
      "rabbitmq/start.sh"
      "prometheus.yml"
      "prometheus/rules.yml"
      "alertmanager.yml"
      "grafana/provisioning/datasources/prometheus.yml"
      "grafana/provisioning/dashboards/dashboard.yml"
    )
    for relative_path in "${RUNTIME_FILES[@]}"; do
      if [ ! -f "$SCRIPT_DIR/$relative_path" ]; then
        error "运行时文件缺失：$relative_path"
      fi
    done
  fi
fi

if [ "$ERRORS" -gt 0 ]; then
  printf '环境变量校验失败：共 %s 个问题，请修复后重新运行。\n' "$ERRORS" >&2
  exit 1
fi

printf '环境变量校验通过：%s\n' "$ENV_FILE"
