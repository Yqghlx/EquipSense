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
    "TOTP_ENCRYPTION_KEY"
    "PII_ENCRYPTION_KEY"
    "AUTOMAPPER_LICENSE_KEY"
    "GATEWAY_AUTH_KEY"
    "GATEWAY_TENANT_ID"
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
    if [ -z "$value" ] \
      || [[ "$value" == *"请修改"* ]] \
      || [[ "$value" == *"PLEASE_CHANGE"* ]] \
      || [[ "$value" == *"CHANGE_ME"* ]] \
      || [[ "$value" == *"SET_VIA_ENVIRONMENT"* ]] \
      || { [ "$key" = "MQTT_USERNAME" ] && [ "$value" = "device" ]; } \
      || { [ "$key" = "MQTT_PASSWORD" ] && [ "$value" = "device123" ]; }; then
      error "必填环境变量 $key 缺失或仍为占位值（不会打印其内容）"
    fi
  done

  # Compose 对重复键采用最后一项，容易让旧配置静默覆盖新凭据或域名。
  # 只报告变量名，不输出任何值，避免校验日志泄露敏感信息。
  duplicate_env_keys="$(awk -F= '
    /^[A-Za-z_][A-Za-z0-9_]*=/ { counts[$1]++ }
    END { for (key in counts) if (counts[key] > 1) print key }
  ' "$ENV_FILE")"
  while IFS= read -r env_key; do
    if [ -n "$env_key" ]; then
      error "$env_key 重复定义"
    fi
  done <<< "$duplicate_env_keys"

  # Compose 会采用重复键的最后一项；如果旧配置尾部残留 Development，
  # 生产专用的 MFA、许可证和安全策略可能被绕过，因此显式拒绝非 Production。
  aspnet_environment="$(read_env_value ASPNETCORE_ENVIRONMENT)"
  if [ -n "$aspnet_environment" ] && [ "$aspnet_environment" != "Production" ]; then
    error "ASPNETCORE_ENVIRONMENT 必须为 Production"
  fi

  jwt_value="$(read_env_value JWT_SECRET)"
  if [ -n "$jwt_value" ] && [[ "$jwt_value" != *"请修改"* ]] && [ "${#jwt_value}" -lt 32 ]; then
    error "JWT_SECRET 长度不足 32 个字符"
  fi

  # 限流参数由 Compose 传入应用配置；在重启服务前先校验，避免错误值把发布失败推迟到运行态。
  for key in RATE_LIMITING_PERMIT_LIMIT RATE_LIMITING_AUTH_PERMIT_LIMIT RATE_LIMITING_TENANT_PERMIT_LIMIT; do
    value="$(read_env_value "$key")"
    if [ -n "$value" ] && ! [[ "$value" =~ ^[1-9][0-9]*$ ]]; then
      error "$key 必须是大于 0 的整数"
    fi
  done

  rate_limiting_window="$(read_env_value RATE_LIMITING_WINDOW)"
  if [ -n "$rate_limiting_window" ] && ! [[ "$rate_limiting_window" =~ ^[0-9]{2}:[0-9]{2}:[0-9]{2}$ ]]; then
    error "RATE_LIMITING_WINDOW 必须是 hh:mm:ss 格式"
  fi

  totp_encryption_key="$(read_env_value TOTP_ENCRYPTION_KEY)"
  if [ -n "$totp_encryption_key" ] && [[ "$totp_encryption_key" != *"请修改"* ]] && ! [[ "$totp_encryption_key" =~ ^[A-Za-z0-9+/]{43}=$ ]]; then
    error "TOTP_ENCRYPTION_KEY 必须是 Base64 编码的 32 字节密钥"
  fi

  pii_encryption_key="$(read_env_value PII_ENCRYPTION_KEY)"
  if [ -n "$pii_encryption_key" ] && [[ "$pii_encryption_key" != *"请修改"* ]] && ! [[ "$pii_encryption_key" =~ ^[A-Za-z0-9+/]{43}=$ ]]; then
    error "PII_ENCRYPTION_KEY 必须是 Base64 编码的 32 字节密钥"
  fi

  automapper_license_key="$(read_env_value AUTOMAPPER_LICENSE_KEY)"
  if [ -n "$automapper_license_key" ] \
    && [[ "$automapper_license_key" != *"请修改"* ]] \
    && [[ "$automapper_license_key" != *"PLEASE_CHANGE"* ]] \
    && [ "${#automapper_license_key}" -lt 32 ]; then
    error "AUTOMAPPER_LICENSE_KEY 长度不足 32 个字符"
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

  machine_auth_api_key="$(read_env_value AUTH_MACHINE_API_KEY)"
  if [ -n "$machine_auth_api_key" ]; then
    if [[ "$machine_auth_api_key" == *"请修改"* ]] || [[ "$machine_auth_api_key" == *"PLEASE_CHANGE"* ]] || [[ "$machine_auth_api_key" == *"CHANGE_ME"* ]] || [[ "$machine_auth_api_key" == *"SET_VIA_ENVIRONMENT"* ]]; then
      error "AUTH_MACHINE_API_KEY 仍为占位值"
    fi
    if [ "${#machine_auth_api_key}" -lt 32 ]; then
      error "AUTH_MACHINE_API_KEY 长度不足 32 个字符"
    fi
    if printf '%s' "$machine_auth_api_key" | LC_ALL=C grep -q '[^ -~]'; then
      error "AUTH_MACHINE_API_KEY 必须只包含 ASCII 字符"
    fi
  fi

  gateway_tenant_id="$(read_env_value GATEWAY_TENANT_ID)"
  if [ -n "$gateway_tenant_id" ] \
    && [[ "$gateway_tenant_id" != *"请修改"* ]] \
    && [[ "$gateway_tenant_id" != *"PLEASE_CHANGE"* ]] \
    && [[ "$gateway_tenant_id" != *"CHANGE_ME"* ]] \
    && ! [[ "$gateway_tenant_id" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
    error "GATEWAY_TENANT_ID 必须是有效的 UUID"
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

  # 不同组件和不同账户必须使用独立凭据；复用同一值会让一次泄露横向扩大影响面。
  # 只报告变量名，绝不把凭据值写入日志。空值和占位值交给前面的必填校验处理。
  is_placeholder_credential() {
    local value="$1"
    [ -z "$value" ] \
      || [[ "$value" == *"请修改"* ]] \
      || [[ "$value" == *"PLEASE_CHANGE"* ]] \
      || [[ "$value" == *"CHANGE_ME"* ]] \
      || [[ "$value" == *"SET_VIA_ENVIRONMENT"* ]] \
      || [[ "$value" == *"change-me"* ]]
  }

  credential_keys=(
    "PG_PASSWORD"
    "REDIS_PASSWORD"
    "RABBITMQ_PASSWORD"
    "MQTT_PASSWORD"
    "SEQ_ADMIN_PASSWORD"
    "GRAFANA_PASSWORD"
    "SEED_ADMIN_PASSWORD"
    "SEED_LEAD_PASSWORD"
    "SEED_TECH_PASSWORD"
    "SEED_OPERATOR_PASSWORD"
    "SEED_VIEWER_PASSWORD"
    "JWT_SECRET"
    "TOTP_ENCRYPTION_KEY"
    "PII_ENCRYPTION_KEY"
    "GATEWAY_AUTH_KEY"
    "AUTH_MACHINE_API_KEY"
    "LLM_API_KEY"
    "SMTP_PASSWORD"
    "VAPID__PRIVATEKEY"
    "EVALUATION_INGESTION_API_KEY"
    "S3_SECRET_ACCESS_KEY"
    "FILE_STORAGE_S3_SECRET_KEY"
  )
  seen_credential_keys=()
  seen_credential_values=()
  for key in "${credential_keys[@]}"; do
    value="$(read_env_value "$key")"
    if is_placeholder_credential "$value"; then
      continue
    fi
    for index in "${!seen_credential_keys[@]}"; do
      if [ "$value" = "${seen_credential_values[$index]}" ]; then
        error "$key 与 ${seen_credential_keys[$index]} 不得复用同一凭据"
        break
      fi
    done
    seen_credential_keys+=("$key")
    seen_credential_values+=("$value")
  done

  frontend_url="$(read_env_value FRONTEND_URL)"
  if [ -n "$frontend_url" ] && [[ "$frontend_url" != https://* ]]; then
    error "FRONTEND_URL 必须使用 HTTPS"
  fi

  # Alertmanager 外部通知是可选能力，但一旦配置必须使用 HTTPS/HTTP URL，
  # 避免启动后把告警投递到错误地址或因模板破坏导致通知服务失效。
  alert_webhook_url="$(read_env_value ALERT_WEBHOOK_URL)"
  if [ -n "$alert_webhook_url" ]; then
    case "$alert_webhook_url" in
      http://*|https://*)
        ;;
      *)
        error "ALERT_WEBHOOK_URL 必须使用 http:// 或 https://"
        ;;
    esac
    if [[ "$alert_webhook_url" == *$'\n'* ]] || [[ "$alert_webhook_url" == *$'\r'* ]]; then
      error "ALERT_WEBHOOK_URL 含有不安全字符"
    fi
  fi

  jaeger_span_storage_type="$(read_env_value JAEGER_SPAN_STORAGE_TYPE)"
  if [ -n "$jaeger_span_storage_type" ] && ! [[ "$jaeger_span_storage_type" =~ ^(badger|memory|opensearch|elasticsearch|cassandra|grpc|blackhole)$ ]]; then
    error "JAEGER_SPAN_STORAGE_TYPE 不是支持的 Jaeger 存储类型"
  fi
  if [ "${aspnet_environment:-Production}" = "Production" ] && [ "$jaeger_span_storage_type" = "memory" ]; then
    error "生产环境禁止使用内存 Jaeger 存储，请改用 badger 或外部存储"
  fi
  jaeger_badger_ephemeral="$(read_env_value JAEGER_BADGER_EPHEMERAL)"
  if [ -n "$jaeger_badger_ephemeral" ] && ! [[ "$jaeger_badger_ephemeral" =~ ^([Tt][Rr][Uu][Ee]|[Ff][Aa][Ll][Ss][Ee]|0|1)$ ]]; then
    error "JAEGER_BADGER_EPHEMERAL 必须是 true 或 false"
  fi
  if [ "${aspnet_environment:-Production}" = "Production" ] \
    && [ "$jaeger_span_storage_type" = "badger" ] \
    && [[ "$jaeger_badger_ephemeral" =~ ^([Tt][Rr][Uu][Ee]|1)$ ]]; then
    error "生产环境 JAEGER_BADGER_EPHEMERAL 必须为 false"
  fi

  # 附件存储默认是本地卷；启用 S3 时必须在 Compose 注入完整且安全的对象存储配置。
  # 自定义端点不能使用 HTTP，避免附件凭据和工单文件在网络中明文传输。
  file_storage_provider="$(read_env_value FILE_STORAGE_PROVIDER)"
  file_storage_provider="$(printf '%s' "${file_storage_provider:-Local}" | tr '[:lower:]' '[:upper:]')"
  case "$file_storage_provider" in
    LOCAL)
      ;;
    S3)
      file_storage_bucket="$(read_env_value FILE_STORAGE_S3_BUCKET)"
      file_storage_region="$(read_env_value FILE_STORAGE_S3_REGION)"
      file_storage_endpoint="$(read_env_value FILE_STORAGE_S3_ENDPOINT)"
      file_storage_access_key="$(read_env_value FILE_STORAGE_S3_ACCESS_KEY)"
      file_storage_secret_key="$(read_env_value FILE_STORAGE_S3_SECRET_KEY)"
      file_storage_prefix="$(read_env_value FILE_STORAGE_S3_KEY_PREFIX)"

      if [ -z "$file_storage_bucket" ]; then
        error "FILE_STORAGE_PROVIDER=S3 时必须配置 FILE_STORAGE_S3_BUCKET"
      elif [[ "$file_storage_bucket" == */* || "$file_storage_bucket" == *\\* || "$file_storage_bucket" =~ [[:space:]] ]]; then
        error "FILE_STORAGE_S3_BUCKET 不能包含路径分隔符或空白字符"
      fi
      if [ -z "$file_storage_region" ]; then
        error "FILE_STORAGE_PROVIDER=S3 时必须配置 FILE_STORAGE_S3_REGION"
      fi
      if [ -n "$file_storage_endpoint" ]; then
        case "$file_storage_endpoint" in
          https://*)
            ;;
          http://*)
            error "生产 FILE_STORAGE_S3_ENDPOINT 必须使用 HTTPS"
            ;;
          *)
            error "FILE_STORAGE_S3_ENDPOINT 必须使用 http:// 或 https://"
            ;;
        esac
        if is_placeholder_credential "$file_storage_access_key" || is_placeholder_credential "$file_storage_secret_key"; then
          error "配置 FILE_STORAGE_S3_ENDPOINT 时必须配置有效的 FILE_STORAGE_S3_ACCESS_KEY 和 FILE_STORAGE_S3_SECRET_KEY"
        fi
      elif [ -n "$file_storage_access_key" ] || [ -n "$file_storage_secret_key" ]; then
        if [ -z "$file_storage_access_key" ] || [ -z "$file_storage_secret_key" ]; then
          error "FILE_STORAGE_S3_ACCESS_KEY 和 FILE_STORAGE_S3_SECRET_KEY 必须同时配置"
        fi
      fi
      if [ -n "$file_storage_prefix" ]; then
        if [[ "$file_storage_prefix" == /* || "$file_storage_prefix" == */* ]] || [[ "$file_storage_prefix" == *\\* || "$file_storage_prefix" == *//* || "$file_storage_prefix" == . || "$file_storage_prefix" == .. || "$file_storage_prefix" == */../* ]]; then
          error "FILE_STORAGE_S3_KEY_PREFIX 必须是安全的相对对象键前缀"
        fi
      fi
      ;;
    *)
      error "FILE_STORAGE_PROVIDER 仅支持 Local 或 S3"
      ;;
  esac

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
      "alertmanager-entrypoint.sh"
      "grafana/provisioning/datasources/prometheus.yml"
      "grafana/provisioning/dashboards/dashboard.yml"
    )
    for relative_path in "${RUNTIME_FILES[@]}"; do
      if [ ! -f "$SCRIPT_DIR/$relative_path" ]; then
        error "运行时文件缺失：$relative_path"
      fi
    done

    if ! command -v openssl >/dev/null 2>&1; then
      error "运行时证书校验需要 openssl，但当前系统未安装"
    else
      check_runtime_certificate() {
        local path="$1"
        local description="$2"
        local require_issued_certificate="${3:-false}"
        local certificate_identity
        local subject
        local issuer
        if [ ! -s "$path" ]; then
          error "$description 为空或缺失"
          return 1
        fi
        if ! openssl x509 -in "$path" -noout >/dev/null 2>&1; then
          error "$description 不是有效的 X.509 证书"
          return 1
        fi
        if ! openssl x509 -checkend 2592000 -noout -in "$path" >/dev/null 2>&1; then
          error "$description 已过期或将在 30 天内过期"
          return 1
        fi
        if [ "$require_issued_certificate" = true ] \
          && [ "${aspnet_environment:-Production}" = "Production" ]; then
          # 生产叶子证书必须由 CA 签发；开发自签名证书不能因为有效期和主机名
          # 都正确就混入公网或跨主机部署。MQTT CA 根证书本身不走此检查。
          if ! certificate_identity="$(openssl x509 -in "$path" -noout -subject -issuer -nameopt RFC2253 2>/dev/null)"; then
            error "$description 无法读取证书签发者信息"
            return 1
          fi
          subject="$(printf '%s\n' "$certificate_identity" | sed -n 's/^subject=//p')"
          issuer="$(printf '%s\n' "$certificate_identity" | sed -n 's/^issuer=//p')"
          if [ -n "$subject" ] && [ "$subject" = "$issuer" ]; then
            error "${description}不得使用自签名证书"
            return 1
          fi
        fi
        return 0
      }

      check_runtime_private_key() {
        local path="$1"
        local description="$2"
        if [ ! -s "$path" ]; then
          error "$description 为空或缺失"
          return 1
        fi
        if ! openssl pkey -in "$path" -noout >/dev/null 2>&1; then
          error "$description 不是有效的私钥"
          return 1
        fi
        return 0
      }

      check_runtime_key_pair() {
        local certificate_path="$1"
        local key_path="$2"
        local description="$3"
        local certificate_fingerprint
        local key_fingerprint

        if ! certificate_fingerprint="$({
          openssl x509 -in "$certificate_path" -pubkey -noout 2>/dev/null \
            | openssl pkey -pubin -outform DER 2>/dev/null \
            | openssl dgst -sha256 2>/dev/null
        })"; then
          error "$description 无法读取证书公钥"
          return 1
        fi
        if ! key_fingerprint="$({
          openssl pkey -in "$key_path" -pubout 2>/dev/null \
            | openssl pkey -pubin -outform DER 2>/dev/null \
            | openssl dgst -sha256 2>/dev/null
        })"; then
          error "$description 无法读取私钥公钥"
          return 1
        fi
        if [ -z "$certificate_fingerprint" ] || [ "$certificate_fingerprint" != "$key_fingerprint" ]; then
          error "$description 证书与私钥不匹配"
          return 1
        fi
        return 0
      }

      check_runtime_certificate_host() {
        local certificate_path="$1"
        local host="$2"
        local error_message="$3"
        local certificate_text
        local san_line
        local san_entries
        local common_name
        local wildcard_host=""

        if [ -z "$host" ]; then
          error "$error_message（主机名为空）"
          return 1
        fi

        if ! certificate_text="$(openssl x509 -in "$certificate_path" -text -noout 2>/dev/null)"; then
          error "$error_message（无法读取证书名称）"
          return 1
        fi

        # LibreSSL 和部分旧版 OpenSSL 没有 x509 -checkhost，使用证书文本中的
        # SAN/CN 做兼容性校验；优先 SAN，只有证书没有 SAN 时才回退到 CN。
        san_line="$(printf '%s\n' "$certificate_text" | awk '/Subject Alternative Name:/{getline; print; exit}')"
        common_name="$(openssl x509 -in "$certificate_path" -noout -subject -nameopt RFC2253 2>/dev/null \
          | sed -n 's/^subject=.*CN=\([^,]*\).*$/\1/p' \
          | sed 's/^ *//; s/ *$//')"
        if [[ "$host" =~ [A-Za-z] && "$host" == *.* ]]; then
          wildcard_host="*.${host#*.}"
        fi

        if [ -n "$san_line" ]; then
          # SAN 是逗号分隔的条目，必须按完整条目匹配，避免
          # DNS:example.com.evil 被错误地当成 DNS:example.com。
          san_entries="$(printf '%s\n' "$san_line" | tr ',' '\n' | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
          if printf '%s\n' "$san_entries" | grep -Fqx "DNS:${host}" \
            || { [ -n "$wildcard_host" ] && printf '%s\n' "$san_entries" | grep -Fqx "DNS:${wildcard_host}"; } \
            || printf '%s\n' "$san_entries" | grep -Fqx "IP Address:${host}"; then
            return 0
          fi
        elif [ "$common_name" = "$host" ] || { [ -n "$wildcard_host" ] && [ "$common_name" = "$wildcard_host" ]; }; then
          return 0
        fi

        if [ -z "$san_line" ] && [ -z "$common_name" ]; then
          error "$error_message（证书缺少 SAN/CN）"
        else
          error "$error_message"
        fi
        return 1
      }

      ssl_certificate="$SCRIPT_DIR/ssl/cert.pem"
      ssl_key="$SCRIPT_DIR/ssl/key.pem"
      mqtt_ca_certificate="$SCRIPT_DIR/mqtt-certs/ca.crt"
      mqtt_server_certificate="$SCRIPT_DIR/mqtt-certs/server.crt"
      mqtt_server_key="$SCRIPT_DIR/mqtt-certs/server.key"

      ssl_certificate_valid=false
      ssl_key_valid=false
      mqtt_ca_certificate_valid=false
      mqtt_server_certificate_valid=false
      mqtt_server_key_valid=false

      check_runtime_certificate "$ssl_certificate" "Nginx TLS 证书" true && ssl_certificate_valid=true
      check_runtime_private_key "$ssl_key" "Nginx TLS 私钥" && ssl_key_valid=true
      if [ "$ssl_certificate_valid" = true ] && [ "$ssl_key_valid" = true ]; then
        if ! check_runtime_key_pair "$ssl_certificate" "$ssl_key" "Nginx TLS"; then
          :
        fi
        frontend_url="$(read_env_value FRONTEND_URL)"
        frontend_host="${frontend_url#https://}"
        frontend_host="${frontend_host%%/*}"
        frontend_host="$(printf '%s' "$frontend_host" | sed -E 's/:[0-9]+$//; s/^\[//; s/\]$//')"
        if ! check_runtime_certificate_host "$ssl_certificate" "$frontend_host" "Nginx TLS 证书与 FRONTEND_URL 主机名不匹配"; then
          :
        fi
      fi

      check_runtime_certificate "$mqtt_ca_certificate" "MQTT CA 证书" && mqtt_ca_certificate_valid=true
      check_runtime_certificate "$mqtt_server_certificate" "MQTT 服务端证书" true && mqtt_server_certificate_valid=true
      check_runtime_private_key "$mqtt_server_key" "MQTT 服务端私钥" && mqtt_server_key_valid=true
      if [ "$mqtt_ca_certificate_valid" = true ] && [ "$mqtt_server_certificate_valid" = true ]; then
        if ! openssl verify -CAfile "$mqtt_ca_certificate" "$mqtt_server_certificate" >/dev/null 2>&1; then
          error "MQTT 服务端证书未通过配置的 CA 链校验"
        fi
      fi
      if [ "$mqtt_server_certificate_valid" = true ] && [ "$mqtt_server_key_valid" = true ]; then
        if ! check_runtime_key_pair "$mqtt_server_certificate" "$mqtt_server_key" "MQTT 服务端"; then
          :
        fi
        if ! check_runtime_certificate_host "$mqtt_server_certificate" "mosquitto" "MQTT 服务端证书未包含 mosquitto 主机名"; then
          :
        fi
      fi

      mqtt_username="$(read_env_value MQTT_USERNAME)"
      mqtt_password_file="$SCRIPT_DIR/mosquitto_passwd/passwd"
      if [ ! -s "$mqtt_password_file" ]; then
        error "Mosquitto 密码文件为空或缺失"
      elif [ -n "$mqtt_username" ] \
        && ! awk -F: -v expected="$mqtt_username" '$1 == expected { found = 1 } END { exit found ? 0 : 1 }' "$mqtt_password_file"; then
        error "Mosquitto 密码文件未配置 .env 中的 MQTT_USERNAME"
      fi
    fi
  fi
fi

if [ "$ERRORS" -gt 0 ]; then
  printf '环境变量校验失败：共 %s 个问题，请修复后重新运行。\n' "$ERRORS" >&2
  exit 1
fi

printf '环境变量校验通过：%s\n' "$ENV_FILE"
