#!/bin/sh
set -e

# 从连接字符串解析 PG 主机
PGHOST=$(echo "$ConnectionStrings__Default" | sed -n 's/.*Host=\([^;]*\).*/\1/p')

echo "等待 PostgreSQL 就绪 (${PGHOST:-postgres})..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if nc -z "${PGHOST:-postgres}" 5432 2>/dev/null; then
        echo "PostgreSQL 已就绪"
        break
    fi
    attempt=$((attempt + 1))
    echo "PostgreSQL 未就绪，2 秒后重试 ($attempt/$max_attempts)..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "错误：等待 PostgreSQL 超时"
    exit 1
fi

echo "启动应用（自动迁移由应用代码执行）..."
exec dotnet EquipAI.WebAPI.dll
