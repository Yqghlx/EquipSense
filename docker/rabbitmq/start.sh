#!/usr/bin/env bash

# RabbitMQ 启动编排：先完成节点启动和凭证初始化，再导入版本控制的 broker 定义。
# 这样 definitions.json 可以保持无密码，同时兼容全新节点和已有数据卷。
set -Eeuo pipefail

# 官方镜像的入口脚本只有在参数是 rabbitmq-server 时才会自动降权；本脚本作为
# command 运行时需要显式切换到 rabbitmq 用户，避免 broker 以 root 身份运行。
if [[ "$(id -u)" == "0" ]]; then
  exec su-exec rabbitmq /bin/bash "$BASH_SOURCE" "$@"
fi

: "${RABBITMQ_DEFAULT_USER:?必须设置 RABBITMQ_DEFAULT_USER}"
: "${RABBITMQ_DEFAULT_PASS:?必须设置 RABBITMQ_DEFAULT_PASS}"

broker_pid=""

停止Broker() {
  if [[ -n "${broker_pid}" ]] && kill -0 "${broker_pid}" 2>/dev/null; then
    kill -TERM "${broker_pid}" 2>/dev/null || true
  fi
}

trap 停止Broker TERM INT EXIT

rabbitmq-server &
broker_pid=$!

# 必须等待节点真正可用后再执行 CLI 操作；否则导入定义会与启动阶段竞争。
# rabbitmqctl await_startup 在节点尚未注册到 epmd 时会立即失败，因此使用
# check_running 轮询；ping 只代表 Erlang 节点可达，不代表 Rabbit 应用已启动。
# 同时在 broker 子进程异常退出时立即把真实退出码交给容器编排器。
broker_ready=false
for _ in {1..300}; do
  if rabbitmq-diagnostics -q check_running >/dev/null 2>&1; then
    broker_ready=true
    break
  fi

  if ! kill -0 "${broker_pid}" 2>/dev/null; then
    wait "${broker_pid}" || true
    exit 1
  fi

  sleep 1
done

if [[ "${broker_ready}" != "true" ]]; then
  echo "RabbitMQ 在 300 秒内未完成启动" >&2
  exit 1
fi

vhosts="$(rabbitmqctl list_vhosts --silent)"
if ! grep -Fqx -- "/" <<<"${vhosts}"; then
  rabbitmqctl add_vhost /
fi

users="$(rabbitmqctl list_users --silent | awk '{print $1}')"
if ! grep -Fqx -- "${RABBITMQ_DEFAULT_USER}" <<<"${users}"; then
  rabbitmqctl add_user "${RABBITMQ_DEFAULT_USER}" "${RABBITMQ_DEFAULT_PASS}"
fi

# 即使数据卷来自旧部署，也确保当前应用账号拥有目标 vhost 的最小业务权限。
rabbitmqctl set_permissions -p / "${RABBITMQ_DEFAULT_USER}" ".*" ".*" ".*"

# definitions 只包含 vhost 和策略，不包含用户密码；导入操作幂等且可重复执行。
rabbitmqctl import_definitions /etc/rabbitmq/definitions.json

wait "${broker_pid}"
