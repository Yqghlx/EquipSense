#!/usr/bin/env bash
# 等待 HTTP 端点真正可用，供 CI 启动后台服务后执行就绪门禁。

set -uo pipefail

URL="${1:?请提供待探测的 HTTP URL}"
MAX_ATTEMPTS="${2:-45}"
INTERVAL_SECONDS="${3:-2}"
SERVICE_NAME="${4:-服务}"

for ((attempt = 1; attempt <= MAX_ATTEMPTS; attempt++)); do
  if curl --fail --silent --show-error --max-time 5 "$URL" >/dev/null 2>&1; then
    echo "${SERVICE_NAME}已就绪"
    exit 0
  fi

  echo "等待${SERVICE_NAME}启动... (${attempt}/${MAX_ATTEMPTS})"
  sleep "$INTERVAL_SECONDS"
done

echo "等待${SERVICE_NAME}启动超时：${URL}" >&2
exit 1
