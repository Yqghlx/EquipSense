#!/usr/bin/env bash

# 使用与 Compose 相同的启动脚本，在临时容器中验证 RabbitMQ 初始化顺序。
# 容器不映射端口、不挂载数据卷，测试结束后只删除本脚本创建的临时容器。
set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd -- "${script_dir}/.." && pwd)"
image="${RABBITMQ_SMOKE_IMAGE:-rabbitmq:4.3.4-management-alpine}"
username="${RABBITMQ_SMOKE_USERNAME:-equipai_smoke}"
password="${RABBITMQ_SMOKE_PASSWORD:-equipai_smoke_password_123456}"
container="equipsense-rabbitmq-startup-smoke-$$"

清理() {
  docker rm -f "${container}" >/dev/null 2>&1 || true
}

trap 清理 EXIT

docker run -d \
  --name "${container}" \
  -e "RABBITMQ_DEFAULT_USER=${username}" \
  -e "RABBITMQ_DEFAULT_PASS=${password}" \
  -v "${project_dir}/docker/rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro" \
  -v "${project_dir}/docker/rabbitmq/definitions.json:/etc/rabbitmq/definitions.json:ro" \
  -v "${project_dir}/docker/rabbitmq/start.sh:/usr/local/bin/equipai-rabbitmq-start.sh:ro" \
  --entrypoint /bin/bash "${image}" \
  /usr/local/bin/equipai-rabbitmq-start.sh >/dev/null

ready=false
for _ in {1..60}; do
  if docker exec "${container}" rabbitmq-diagnostics -q check_running >/dev/null 2>&1; then
    ready=true
    break
  fi

  running="$(docker inspect --format '{{.State.Running}}' "${container}" 2>/dev/null || true)"
  if [[ "${running}" != "true" ]]; then
    docker logs "${container}"
    exit 1
  fi
  sleep 1
done

if [[ "${ready}" != "true" ]]; then
  docker logs "${container}"
  echo "RabbitMQ smoke test 在 60 秒内未就绪" >&2
  exit 1
fi

vhosts="$(docker exec "${container}" rabbitmqctl list_vhosts --silent)"
grep -Fqx -- "/" <<<"${vhosts}"

users="$(docker exec "${container}" rabbitmqctl list_users --silent | awk '{print $1}')"
grep -Fqx -- "${username}" <<<"${users}"

policies="$(docker exec "${container}" rabbitmqctl list_policies -p / --formatter json)"
[[ "${policies}" == *'equipai-v2-at-least-once-dlx'* ]]
[[ "${policies}" == *'at-least-once'* ]]
[[ "${policies}" == *'reject-publish'* ]]

echo "RabbitMQ 启动冒烟测试通过：vhost、凭证和 v2 policy 均已就绪。"
