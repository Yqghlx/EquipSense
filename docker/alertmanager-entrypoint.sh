#!/bin/sh
# Alertmanager 启动包装器：把外部 Webhook 地址写入临时受限文件，避免把
# URL 直接硬编码在仓库配置中。未配置 Webhook 时，告警仍保留在 Alertmanager，
# 但不会尝试访问 localhost 等错误地址。

set -eu

template_path="/etc/alertmanager/alertmanager.yml.template"
config_path="/tmp/equipai-alertmanager.yml"
webhook_file="/tmp/equipai-alert-webhook-url"
webhook_url="${ALERT_WEBHOOK_URL:-}"

if [ ! -r "$template_path" ]; then
  echo "错误：Alertmanager 配置模板不存在：$template_path" >&2
  exit 1
fi

if [ -n "$webhook_url" ]; then
  case "$webhook_url" in
    http://*|https://*)
      ;;
    *)
      echo "错误：ALERT_WEBHOOK_URL 必须使用 http:// 或 https://" >&2
      exit 1
      ;;
  esac

  # URL 会写入独立文件，禁止换行，避免 url_file 读取到多个值。
  newline='
'
  carriage_return="$(printf '\r')"
  case "$webhook_url" in
    *"$newline"*|*"$carriage_return"*)
      echo "错误：ALERT_WEBHOOK_URL 含有不安全字符" >&2
      exit 1
      ;;
  esac

  umask 077
  printf '%s\n' "$webhook_url" > "$webhook_file"
  default_receiver="webhook-default"
  critical_receiver="webhook-critical"
  warning_receiver="webhook-warning"
  webhook_config="    webhook_configs:\n      - url_file: $webhook_file\n        send_resolved: true\n        max_alerts: 100\n        timeout: 10s"
  echo "Alertmanager 外部 Webhook 已启用"
else
  rm -f "$webhook_file"
  default_receiver="dev-null"
  critical_receiver="dev-null"
  warning_receiver="dev-null"
  # 生产环境没有配置通知地址时必须显式降级为 dev-null，不能静默请求本机端口。
  webhook_config="    # 未配置 ALERT_WEBHOOK_URL，告警仅保留在 Alertmanager"
  echo "警告：未配置 ALERT_WEBHOOK_URL，外部告警通知已禁用" >&2
fi

# 使用 awk 替换固定标记，避免 envsubst 把 Alertmanager 模板中的其他内容误解析。
awk \
  -v default_receiver="$default_receiver" \
  -v critical_receiver="$critical_receiver" \
  -v warning_receiver="$warning_receiver" \
  -v webhook_config="$webhook_config" '
  {
    gsub(/__ALERTMANAGER_DEFAULT_RECEIVER__/, default_receiver)
    gsub(/__ALERTMANAGER_CRITICAL_RECEIVER__/, critical_receiver)
    gsub(/__ALERTMANAGER_WARNING_RECEIVER__/, warning_receiver)
  }
  /^__ALERTMANAGER_WEBHOOK_CONFIG__$/ {
    printf "%s\n", webhook_config
    next
  }
  { print }
' "$template_path" > "$config_path"

chmod 600 "$config_path"
exec /bin/alertmanager "$@"
