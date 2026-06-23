#!/bin/sh
# Nginx 启动时用环境变量替换模板中的占位符
envsubst '${BACKEND_URL} ${SSL_CERT_PATH} ${SSL_KEY_PATH}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf \
    && mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf

# =============================================================================
# 安全检测：默认自签名证书警告
# =============================================================================
#
# EquipSense 源码公开仓库（github.com/yqghlx/equipsense）随附一对默认的自签名
# 证书（CN=localhost）。这意味着：
#   1. 私钥（key.pem）在 GitHub 公开可见，任何人都能下载
#   2. 用此默认证书部署的 HTTPS 流量可被任何拿到私钥的人解密（中间人攻击）
#   3. 浏览器也会显示"不安全"警告
#
# 修复方式：客户首次部署时运行 docker/setup.sh 生成自己的证书，或手动调用
# docker/generate-cert.sh <域名> 生成。生产环境强烈推荐用 Let's Encrypt。
#
# 此处检测到默认证书时输出明显警告到 stderr（容器日志可见）。
CERT_PATH="${SSL_CERT_PATH:-/etc/nginx/ssl/cert.pem}"

if [ -f "${CERT_PATH}" ]; then
    # 检查证书 CN / Subject 是否为默认的 localhost
    CERT_CN=$(openssl x509 -in "${CERT_PATH}" -noout -subject 2>/dev/null \
        | sed -n 's/.*CN\s*=\s*\([^/,]*\).*/\1/p' | tr -d ' ')

    if [ "${CERT_CN}" = "localhost" ] || [ -z "${CERT_CN}" ]; then
        cat >&2 <<'EOF'

============================================================
⚠️  安全警告：检测到默认自签名证书（CN=localhost）

此证书的私钥在公开 GitHub 仓库可见，使用此证书的 HTTPS 流量
可能被中间人解密。请按以下任一方式替换：

1. 开发/测试环境（生成自己的自签名证书）：
   cd docker && ./generate-cert.sh <你的域名或IP>

2. 生产环境（推荐 Let's Encrypt）：
   certbot certonly --standalone -d your-domain.com
   然后在 .env 中将 SSL_CERT_PATH 指向：
   /etc/letsencrypt/live/your-domain.com/fullchain.pem
   SSL_KEY_PATH 指向：
   /etc/letsencrypt/live/your-domain.com/privkey.pem

3. 或在 .env 中将 SSL_CERT_PATH/SSL_KEY_PATH 指向你购买的
   商业证书路径

详见 docker/setup.sh 和 docker/generate-cert.sh。
============================================================

EOF
    fi
fi
