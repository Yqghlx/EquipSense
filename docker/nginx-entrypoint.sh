#!/bin/sh
# Nginx 启动时用环境变量替换模板中的占位符
# BACKEND_URL 在 docker-compose 中定义，默认指向后端服务
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf \
    && mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf
