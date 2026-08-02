#!/usr/bin/env bash
# =============================================================================
# generate-mqtt-cert.sh — 生成 Mosquitto TLS 证书
# =============================================================================
#
# 默认生成一套本地开发/测试证书，供生产 Compose 的 TLS listener 启动使用。
# 生产环境应替换为正式 CA 签发的 server.crt/server.key，并保留对应 ca.crt。
#
# 使用方式：
#   cd docker && ./generate-mqtt-cert.sh [Broker 主机名] [有效期天数]
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${SCRIPT_DIR}/mqtt-certs"
PRIVATE_DIR="${SCRIPT_DIR}/mqtt-ca"
DOMAIN="${1:-mosquitto}"
DAYS="${2:-365}"

CA_KEY="${PRIVATE_DIR}/ca.key"
CA_CERT="${CERT_DIR}/ca.crt"
SERVER_KEY="${CERT_DIR}/server.key"
SERVER_CSR="${PRIVATE_DIR}/server.csr"
SERVER_CERT="${CERT_DIR}/server.crt"
SERIAL_FILE="${PRIVATE_DIR}/ca.srl"
EXT_FILE="${PRIVATE_DIR}/server-ext.cnf"

if ! command -v openssl >/dev/null 2>&1; then
    echo "错误：未找到 openssl，无法生成 MQTT TLS 证书" >&2
    exit 1
fi

mkdir -p "${CERT_DIR}" "${PRIVATE_DIR}"

if [[ -f "${CA_CERT}" && -f "${SERVER_CERT}" && -f "${SERVER_KEY}" ]]; then
    echo "MQTT TLS 证书已存在，跳过生成：${CERT_DIR}"
    exit 0
fi

echo "正在为 MQTT Broker ${DOMAIN} 生成 TLS 证书..."

openssl req -x509 -nodes -newkey rsa:4096 \
    -days "${DAYS}" \
    -keyout "${CA_KEY}" \
    -out "${CA_CERT}" \
    -subj "/C=CN/O=EquipSense/OU=MQTT-CA/CN=EquipSense MQTT CA" \
    2>/dev/null

openssl req -new -nodes -newkey rsa:2048 \
    -keyout "${SERVER_KEY}" \
    -out "${SERVER_CSR}" \
    -subj "/C=CN/O=EquipSense/OU=MQTT/CN=${DOMAIN}" \
    2>/dev/null

cat >"${EXT_FILE}" <<EOF
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:${DOMAIN},DNS:mosquitto,DNS:localhost,IP:127.0.0.1
EOF

openssl x509 -req \
    -in "${SERVER_CSR}" \
    -CA "${CA_CERT}" \
    -CAkey "${CA_KEY}" \
    -CAcreateserial \
    -CAserial "${SERIAL_FILE}" \
    -out "${SERVER_CERT}" \
    -days "${DAYS}" \
    -sha256 \
    -extfile "${EXT_FILE}" \
    2>/dev/null

chmod 600 "${CA_KEY}" "${SERVER_KEY}"
chmod 644 "${CA_CERT}" "${SERVER_CERT}"
rm -f "${SERVER_CSR}" "${SERIAL_FILE}" "${EXT_FILE}"

echo "MQTT TLS 证书生成完成：${CERT_DIR}"
echo "注意：这套证书适用于开发/测试；生产环境请替换为正式证书。"
