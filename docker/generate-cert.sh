#!/usr/bin/env bash
# =============================================================================
# generate-cert.sh — 生成本地开发/测试用的自签名 TLS 证书
# =============================================================================
#
# 用途：为 Nginx 反向代理生成自签名证书，仅用于开发和测试环境。
#
# 生产环境注意事项：
#   ⚠️  请勿在生产环境使用自签名证书！请使用以下方式之一获取正式证书：
#     1. Let's Encrypt（免费，推荐）：配合 certbot 自动续期
#        - 安装 certbot：apt install certbot
#        - 获取证书：certbot certonly --standalone -d your-domain.com
#        - 证书路径：/etc/letsencrypt/live/your-domain.com/fullchain.pem
#     2. 云服务商免费证书（阿里云、腾讯云等提供免费 DV 证书）
#     3. 购买商业 SSL 证书
#
# 使用方式：
#   cd docker && ./generate-cert.sh
#
# 生成的文件：
#   ssl/cert.pem — TLS 证书（公钥 + 证书链）
#   ssl/key.pem  — TLS 私钥（请妥善保管，不要提交到版本控制）
# =============================================================================

set -euo pipefail

# 脚本所在目录（即 docker/）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="${SCRIPT_DIR}/ssl"

# 证书配置
DOMAIN="${1:-localhost}"
DAYS="${2:-365}"        # 证书有效期（天）
KEY_LENGTH=2048         # 密钥长度

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  EquipSense TLS 证书生成工具${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 openssl 是否可用
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}错误：未找到 openssl 命令，请先安装 OpenSSL${NC}"
    exit 1
fi

# 创建 ssl 目录（如果不存在）
mkdir -p "${SSL_DIR}"

# 备份已有证书
if [ -f "${SSL_DIR}/cert.pem" ] || [ -f "${SSL_DIR}/key.pem" ]; then
    BACKUP_DIR="${SSL_DIR}/backup/$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}检测到已有证书，备份到 ${BACKUP_DIR}${NC}"
    mkdir -p "${BACKUP_DIR}"
    [ -f "${SSL_DIR}/cert.pem" ] && cp "${SSL_DIR}/cert.pem" "${BACKUP_DIR}/"
    [ -f "${SSL_DIR}/key.pem" ] && cp "${SSL_DIR}/key.pem" "${BACKUP_DIR}/"
fi

echo -e "域名/主机名: ${GREEN}${DOMAIN}${NC}"
echo -e "有效期: ${GREEN}${DAYS} 天${NC}"
echo ""

# 生成自签名证书
# 说明：
#   - x509：直接生成自签名证书（无需 CA）
#   - nodes：私钥不加密（方便 Nginx 自动加载，无需手动输入密码）
#   - newkey：同时生成 RSA 私钥
#   - subj：通过命令行指定证书主题信息，避免交互式输入
echo -e "${YELLOW}正在生成自签名 TLS 证书...${NC}"

openssl req -x509 \
    -nodes \
    -days "${DAYS}" \
    -newkey "rsa:${KEY_LENGTH}" \
    -keyout "${SSL_DIR}/key.pem" \
    -out "${SSL_DIR}/cert.pem" \
    -subj "/C=CN/ST=Shanghai/L=Shanghai/O=EquipSense-Dev/OU=Development/CN=${DOMAIN}" \
    -addext "subjectAltName=DNS:${DOMAIN},DNS:*.${DOMAIN},IP:127.0.0.1,IP:::1"

# 设置私钥文件权限（仅所有者可读写）
chmod 600 "${SSL_DIR}/key.pem"
# 证书文件权限（所有者读写，其他人只读）
chmod 644 "${SSL_DIR}/cert.pem"

# 验证生成的证书
echo ""
echo -e "${YELLOW}验证证书信息：${NC}"
openssl x509 -in "${SSL_DIR}/cert.pem" -noout -subject -dates -issuer

echo ""
echo -e "${GREEN}证书生成完成！${NC}"
echo -e "  证书文件: ${SSL_DIR}/cert.pem"
echo -e "  私钥文件: ${SSL_DIR}/key.pem"
echo ""
echo -e "${YELLOW}⚠️  注意：此证书为自签名证书，仅用于开发/测试环境。${NC}"
echo -e "${YELLOW}   浏览器访问时会提示不安全连接，请手动信任。${NC}"
echo -e "${YELLOW}   生产环境请使用 Let's Encrypt 或购买正式证书。${NC}"
