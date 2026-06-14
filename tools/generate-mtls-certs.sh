#!/usr/bin/env bash
#
# 生成 mTLS 双向认证所需的自签名证书
#
# 用途：边缘网关与后端之间的双向 TLS 认证
# 产出：
#   ca.crt          — CA 根证书（后端 + 边缘网关都需信任）
#   server.crt      — 后端服务端证书
#   server.key      — 后端服务端私钥
#   client.crt      — 边缘网关客户端证书
#   client.key      — 边缘网关客户端私钥
#
# 使用方式：
#   mkdir -p docker/certs && cd docker/certs
#   bash ../../tools/generate-mtls-certs.sh
#
set -euo pipefail

CERT_DIR="${1:-.}"
DAYS=3650  # 10 年有效期（开发环境）

cd "$CERT_DIR"
echo "=== 生成 mTLS 证书（输出到 $CERT_DIR）==="

# 1. 生成 CA 根证书
openssl req -x509 -newkey rsa:4096 -sha256 -days "$DAYS" -nodes \
  -keyout ca.key -out ca.crt \
  -subj "/CN=EquipSense-mTLS-CA/O=EquipSense" 2>/dev/null

# 2. 生成服务端证书（后端用，含 SAN）
openssl req -newkey rsa:2048 -nodes \
  -keyout server.key -out server.csr \
  -subj "/CN=backend/O=EquipSense" 2>/dev/null

cat > server-ext.cnf << EOF
subjectAltName = DNS:backend, DNS:localhost, IP:127.0.0.1
extendedKeyUsage = serverAuth
EOF

openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt -days "$DAYS" -sha256 -extfile server-ext.cnf 2>/dev/null

# 3. 生成客户端证书（边缘网关用）
openssl req -newkey rsa:2048 -nodes \
  -keyout client.key -out client.csr \
  -subj "/CN=edge-gateway/O=EquipSense" 2>/dev/null

cat > client-ext.cnf << EOF
extendedKeyUsage = clientAuth
EOF

openssl x509 -req -in client.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out client.crt -days "$DAYS" -sha256 -extfile client-ext.cnf 2>/dev/null

# 4. 清理 CSR 和临时文件
rm -f server.csr client.csr server-ext.cnf client-ext.cnf *.srl

# 5. 设置权限（私钥仅 owner 可读）
chmod 600 *.key

echo ""
echo "✅ mTLS 证书生成完成："
echo "   CA:         ca.crt + ca.key"
echo "   服务端:     server.crt + server.key（部署到后端）"
echo "   客户端:     client.crt + client.key（部署到边缘网关）"
echo ""
echo "部署说明："
echo "   后端容器挂载: server.crt + server.key + ca.crt"
echo "   边缘网关挂载: client.crt + client.key + ca.crt"
echo "   后端 Kestrel 配置: RequireClientCertificate=RequireCertificate"
echo "   边缘网关 HttpClient: 携带 client.crt + 信任 ca.crt"
