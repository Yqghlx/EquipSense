#!/bin/sh
# Nginx 启动时用环境变量替换模板中的占位符
envsubst '${BACKEND_URL} ${SSL_CERT_PATH} ${SSL_KEY_PATH}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf \
    && mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf

# =============================================================================
# 安全检测：Production 拒绝自签名证书
# =============================================================================
#
# 历史版本曾把自签名证书（CN=localhost）随源码提交到公开仓库，导致私钥泄露。
# 现已修正：仓库不再内置任何证书；开发/测试环境可由 generate-cert.sh 生成临时证书，
# 生产环境则必须在部署前提供 CA 签发的证书。入口脚本也要自行 fail-closed，不能依赖
# 宿主机先运行 setup.sh；否则直接执行 docker compose up 仍可能把开发证书带到公网。
# 自签名证书的问题：
#   1. 无 CA 签名，浏览器会显示"不安全"警告
#   2. 不提供任何身份认证，易被中间人冒充
#
# 非 Production 环境保留警告，方便开发者发现误用；Production 检测到自签名或缺失证书时直接退出。
APP_ENVIRONMENT="${APP_ENVIRONMENT:-Production}"
CERT_PATH="${SSL_CERT_PATH:-/etc/nginx/ssl/cert.pem}"

if [ ! -f "${CERT_PATH}" ]; then
    if [ "${APP_ENVIRONMENT}" = "Production" ]; then
        echo "Nginx 生产环境禁止在缺少 TLS 证书时启动：${CERT_PATH}" >&2
        exit 1
    fi
    echo "⚠️ Nginx TLS 证书不存在：${CERT_PATH}" >&2
else
    # 比较完整 Subject/Issuer，而不是只看 CN；正式证书也可能使用 localhost 之外的任意域名。
    CERT_SUBJECT=$(openssl x509 -in "${CERT_PATH}" -noout -subject -nameopt RFC2253 2>/dev/null \
        | sed -n 's/^subject=//p')
    CERT_ISSUER=$(openssl x509 -in "${CERT_PATH}" -noout -issuer -nameopt RFC2253 2>/dev/null \
        | sed -n 's/^issuer=//p')

    if [ -z "${CERT_SUBJECT}" ] || [ -z "${CERT_ISSUER}" ]; then
        if [ "${APP_ENVIRONMENT}" = "Production" ]; then
            echo "Nginx 生产环境禁止在无法解析 TLS 证书时启动：${CERT_PATH}" >&2
            exit 1
        fi
        echo "⚠️ 无法解析 Nginx TLS 证书：${CERT_PATH}" >&2
    elif [ "${CERT_SUBJECT}" = "${CERT_ISSUER}" ]; then
        if [ "${APP_ENVIRONMENT}" = "Production" ]; then
            cat >&2 <<'EOF'

============================================================
❌ Nginx 生产环境禁止使用自签名证书

请将 SSL_CERT_PATH / SSL_KEY_PATH 指向受信任 CA 签发的证书和私钥，
并在重新启动服务前执行：
  bash docker/validate-env.sh docker/.env --check-runtime-files
============================================================

EOF
            exit 1
        fi

        cat >&2 <<'EOF'

============================================================
⚠️  安全警告：检测到自签名证书

此证书没有受信任 CA 签名，使用此证书的 HTTPS 流量可能被中间人冒充。
开发环境可使用 docker/generate-cert.sh 生成临时证书；生产环境必须使用
受信任 CA 签发的证书。详见 docker/setup.sh。
============================================================

EOF
    fi
fi
