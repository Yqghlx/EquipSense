#!/bin/sh
# Nginx 启动时用环境变量替换模板中的占位符
envsubst '${BACKEND_URL} ${SSL_CERT_PATH} ${SSL_KEY_PATH}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf \
    && mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf
