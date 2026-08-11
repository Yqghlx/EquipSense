#!/usr/bin/env bash
# =============================================================================
# setup.sh — EquipSense Docker 环境一键配置脚本
# =============================================================================
#
# 用途：生产环境首次部署前执行此脚本，完成所有必要的环境准备工作：
#   1. 从模板创建 .env 配置文件（如果不存在）
#   2. 确认生产 TLS/MQTT 证书已预置（本脚本不会生成自签名证书）
#   3. 创建 Mosquitto MQTT Broker 密码文件
#   4. 验证所有必需文件是否存在且配置正确
#
# 使用方式：
#   cd docker && ./setup.sh
#
# 前置条件：
#   - 已安装 Docker 和 Docker Compose
#   - 已安装 openssl（macOS / Linux 通常预装）
# =============================================================================

set -euo pipefail

# 脚本所在目录（即 docker/）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 错误计数器
ERRORS=0

# =============================================================================
# 辅助函数
# =============================================================================

# 打印带颜色的步骤标题
step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 打印成功消息
success() {
    echo -e "  ${GREEN}[✓]${NC} $1"
}

# 打印警告消息
warn() {
    echo -e "  ${YELLOW}[!]${NC} $1"
}

# 打印错误消息并递增错误计数
error() {
    echo -e "  ${RED}[✗]${NC} $1"
    ((ERRORS++)) || true
}

# =============================================================================
# 步骤 1：检查前置依赖
# =============================================================================

step "步骤 1/5：检查前置依赖"

# 检查 Docker
if command -v docker &> /dev/null; then
    success "Docker 已安装: $(docker --version)"
else
    error "未找到 Docker，请先安装 Docker Engine"
    error "  安装指南：https://docs.docker.com/engine/install/"
fi

# 检查 Docker Compose
if docker compose version &> /dev/null 2>&1; then
    success "Docker Compose 已安装: $(docker compose version)"
elif command -v docker-compose &> /dev/null; then
    success "Docker Compose (独立版) 已安装: $(docker-compose --version)"
else
    error "未找到 Docker Compose，请先安装"
fi

# 检查 openssl
if command -v openssl &> /dev/null; then
    success "OpenSSL 已安装: $(openssl version)"
else
    error "未找到 openssl，请先安装 OpenSSL"
fi

# =============================================================================
# 步骤 2：创建 .env 配置文件
# =============================================================================

step "步骤 2/5：配置环境变量 (.env)"

ENV_FILE="${SCRIPT_DIR}/.env"
ENV_EXAMPLE="${SCRIPT_DIR}/.env.example"

read_env_value() {
    local key="$1"
    local line
    line=$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 || true)
    printf '%s' "${line#*=}"
}

if [ -f "${ENV_FILE}" ]; then
    success ".env 文件已存在: ${ENV_FILE}"
else
    if [ -f "${ENV_EXAMPLE}" ]; then
        echo -e "  ${YELLOW}正在从 .env.example 创建 .env 文件...${NC}"
        cp "${ENV_EXAMPLE}" "${ENV_FILE}"
        chmod 600 "${ENV_FILE}"
        success "已创建 .env 文件: ${ENV_FILE}"
        warn "⚠️  请立即编辑 .env 文件，修改所有密码和密钥！"
        warn "  运行以下命令编辑配置：nano ${ENV_FILE}"
        warn "  至少需要修改以下配置项："
        warn "    - PG_PASSWORD（PostgreSQL 密码）"
        warn "    - REDIS_PASSWORD（Redis 密码）"
        warn "    - JWT_SECRET（JWT 签名密钥，至少 32 字符）"
        warn "    - GRAFANA_PASSWORD（Grafana 管理员密码）"
    else
        error ".env.example 模板文件不存在: ${ENV_EXAMPLE}"
        exit 1
    fi
fi

# 即使用户已有 .env，也统一收紧权限；随后在生成任何证书或 MQTT 密码文件前
# 一次性校验全部凭据，避免首次运行用占位配置产生“看似成功”的半成品环境。
chmod 600 "${ENV_FILE}"
if [ ! -f "${SCRIPT_DIR}/validate-env.sh" ]; then
    error "缺少环境变量校验器: ${SCRIPT_DIR}/validate-env.sh"
    exit 1
fi

# validate-env.sh 是 Production-only 门禁；这里提前给出明确错误，避免
# Development/Testing 配置先走到证书生成逻辑后才得到令人困惑的校验失败。
environment_name="$(read_env_value ASPNETCORE_ENVIRONMENT)"
environment_name="${environment_name:-Production}"
if [ "${environment_name}" != "Production" ]; then
    error "setup.sh 仅支持 Production；Development/Testing 请直接使用 docker-compose.dev.yml，并按需运行 generate-cert.sh/generate-mqtt-cert.sh"
    exit 1
fi

if ! bash "${SCRIPT_DIR}/validate-env.sh" "${ENV_FILE}"; then
    error "环境变量校验未通过，请编辑 ${ENV_FILE} 后重新运行 setup.sh"
    exit 1
fi

# 生产环境必须由部署者预置 CA 签发的 TLS/MQTT 文件；任何缺失都在
# 生成密码文件或启动容器前失败，绝不自动生成开发证书。
if [ ! -s "${SCRIPT_DIR}/ssl/cert.pem" ] ||
   [ ! -s "${SCRIPT_DIR}/ssl/key.pem" ] ||
   [ ! -s "${SCRIPT_DIR}/mqtt-certs/ca.crt" ] ||
   [ ! -s "${SCRIPT_DIR}/mqtt-certs/server.crt" ] ||
   [ ! -s "${SCRIPT_DIR}/mqtt-certs/server.key" ]; then
    error "生产环境禁止自动生成自签名 TLS/MQTT 证书，请先配置正式证书和私钥后重新运行 setup.sh"
    exit 1
fi

# =============================================================================
# 步骤 3：生成 TLS 证书
# =============================================================================

step "步骤 3/5：确认生产 TLS 证书"

SSL_DIR="${SCRIPT_DIR}/ssl"
CERT_FILE="${SSL_DIR}/cert.pem"
KEY_FILE="${SSL_DIR}/key.pem"

if [ -f "${CERT_FILE}" ] && [ -f "${KEY_FILE}" ]; then
    success "TLS 证书已存在"

    # 显示证书有效期信息
    if openssl x509 -checkend 2592000 -noout -in "${CERT_FILE}" 2>/dev/null; then
        # 证书在未来 30 天内有效
        CERT_EXPIRY=$(openssl x509 -enddate -noout -in "${CERT_FILE}" 2>/dev/null | cut -d= -f2)
        success "证书有效期至: ${CERT_EXPIRY}"
    else
        warn "TLS 证书即将过期或已过期，建议重新生成"
        echo -e "  运行以下命令重新生成：${SCRIPT_DIR}/generate-cert.sh"
    fi
else
    error "生产 TLS 证书或私钥缺失；请先预置 CA 签发的文件后重新运行 setup.sh"
    exit 1
fi

# 生产 Compose 的 Mosquitto 使用 8883/TLS，需要单独的 Broker 证书和 CA。
MQTT_CERT_DIR="${SCRIPT_DIR}/mqtt-certs"
if [ -f "${MQTT_CERT_DIR}/ca.crt" ] && [ -f "${MQTT_CERT_DIR}/server.crt" ] && [ -f "${MQTT_CERT_DIR}/server.key" ]; then
    success "MQTT TLS 证书已存在"
else
    error "生产 MQTT TLS 证书或私钥缺失；请先预置证书文件后重新运行 setup.sh"
    exit 1
fi

echo -e "  ${GREEN}生产 TLS/MQTT 证书已找到，最终有效期、主机名、CA 链和私钥匹配将在运行时门禁中校验。${NC}"

# =============================================================================
# 步骤 4：配置 Mosquitto 密码
# =============================================================================

step "步骤 4/5：配置 Mosquitto MQTT 认证"

PASSWD_DIR="${SCRIPT_DIR}/mosquitto_passwd"
PASSWD_FILE="${PASSWD_DIR}/passwd"

if [ -f "${PASSWD_FILE}" ] && [ -s "${PASSWD_FILE}" ]; then
    success "Mosquitto 密码文件已存在: ${PASSWD_FILE}"

    # 统计用户数量
    USER_COUNT=$(grep -c "^[^#]" "${PASSWD_FILE}" 2>/dev/null || echo "0")
    success "已配置 ${USER_COUNT} 个用户"

    # 列出用户名（不含密码哈希）
    USER_LIST=$(cut -d: -f1 "${PASSWD_FILE}" 2>/dev/null | tr '\n' ' ')
    success "用户列表: ${USER_LIST}"

    # 仅检查文件存在还不够：如果 .env 的 MQTT_USERNAME 与密码文件不一致，
    # Mosquitto 会正常启动，但后端/边缘网关会持续认证失败，形成隐蔽的遥测中断。
    if [ -f "${ENV_FILE}" ]; then
        mqtt_username=$(read_env_value "MQTT_USERNAME")
        if [ -n "${mqtt_username}" ] && ! grep -q "^${mqtt_username}:" "${PASSWD_FILE}"; then
            error "Mosquitto 密码文件不包含 .env 中的 MQTT_USERNAME（请重新运行 setup-mosquitto.sh）"
        fi
    fi
else
    echo -e "  ${YELLOW}Mosquitto 密码文件不存在或为空，正在创建...${NC}"

    # 调用密码配置脚本
    if [ -f "${SCRIPT_DIR}/setup-mosquitto.sh" ]; then
        bash "${SCRIPT_DIR}/setup-mosquitto.sh"
        success "Mosquitto 密码文件创建完成"
    else
        error "无法创建 Mosquitto 密码文件：缺少 ${SCRIPT_DIR}/setup-mosquitto.sh"
    fi
fi

# =============================================================================
# 步骤 5：验证所有必需文件
# =============================================================================

step "步骤 5/5：验证配置文件完整性"

# 定义所有必需文件列表
# 格式："文件路径|描述"
REQUIRED_FILES=(
    ".env|.env 环境变量配置"
    ".env.example|.env 模板文件"
    "docker-compose.yml|Docker Compose 主配置"
    "docker-compose.dev.yml|Docker Compose 开发环境配置"
    "validate-env.sh|环境变量校验器"
    "mosquitto.conf|Mosquitto 开发环境配置"
    "mosquitto.prod.conf|Mosquitto 生产环境配置"
    "mqtt-certs/ca.crt|MQTT CA 证书"
    "mqtt-certs/server.crt|MQTT 服务端证书"
    "mqtt-certs/server.key|MQTT 服务端私钥"
    "mosquitto_passwd/passwd|Mosquitto 密码文件"
    "nginx.conf|Nginx 反向代理配置"
    "prometheus.yml|Prometheus 指标采集配置"
    "ssl/cert.pem|TLS 证书"
    "ssl/key.pem|TLS 私钥"
    "Dockerfile.backend|后端 Dockerfile"
    "Dockerfile.frontend|前端 Dockerfile"
    "entrypoint.sh|后端入口脚本"
    "nginx-entrypoint.sh|Nginx 入口脚本"
    "grafana/provisioning/datasources/prometheus.yml|Grafana 数据源配置"
    "grafana/provisioning/dashboards/dashboard.yml|Grafana 仪表盘配置"
)

# 逐个检查文件是否存在
echo ""
for ITEM in "${REQUIRED_FILES[@]}"; do
    FILE_PATH="${SCRIPT_DIR}/${ITEM%%|*}"
    FILE_DESC="${ITEM##*|}"

    if [ -f "${FILE_PATH}" ]; then
        success "${FILE_DESC}: ${FILE_PATH}"
    else
        error "${FILE_DESC} 不存在: ${FILE_PATH}"
    fi
done

# 检查宿主机上需要直接运行的脚本是否可执行。
# nginx-entrypoint.sh 由 Dockerfile.frontend 在镜像构建阶段 chmod，不能在宿主机上改动仓库文件权限。
echo ""
echo -e "  ${BLUE}检查脚本文件可执行权限...${NC}"
EXECUTABLE_SCRIPTS=(
    "generate-cert.sh"
    "generate-mqtt-cert.sh"
    "setup-mosquitto.sh"
    "setup.sh"
    "entrypoint.sh"
    "backup.sh"
)

for SCRIPT_NAME in "${EXECUTABLE_SCRIPTS[@]}"; do
    SCRIPT_PATH="${SCRIPT_DIR}/${SCRIPT_NAME}"
    if [ -f "${SCRIPT_PATH}" ]; then
        if [ -x "${SCRIPT_PATH}" ]; then
            success "${SCRIPT_NAME} — 可执行"
        else
            warn "${SCRIPT_NAME} — 不可执行，正在修复权限..."
            chmod +x "${SCRIPT_PATH}"
            if [ -x "${SCRIPT_PATH}" ]; then
                success "${SCRIPT_NAME} — 权限已修复"
            else
                error "${SCRIPT_NAME} — 权限修复失败"
            fi
        fi
    fi
done

# 环境变量通过后，证书和运行时 bind mount 文件才刚刚生成或确认存在；
# 在报告“配置验证全部通过”前必须再次执行完整运行时门禁，避免已有过期、
# 主机名不匹配或证书私钥不匹配的文件仅被 warning 后继续部署。
if ! bash "${SCRIPT_DIR}/validate-env.sh" "${ENV_FILE}" --check-runtime-files; then
    error "运行时文件或 TLS/MQTT 证书校验未通过，请修复后重新运行 setup.sh"
    exit 1
fi

# =============================================================================
# 输出最终结果
# =============================================================================

echo ""
echo -e "${GREEN}========================================${NC}"
if [ ${ERRORS} -eq 0 ]; then
    echo -e "${GREEN}  配置验证全部通过！${ERRORS} 个错误${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}环境准备完成，可以启动服务：${NC}"
    echo "  开发环境（仅基础设施）："
    echo "    cd \"${SCRIPT_DIR}\" && DEV_PG_PASSWORD='<本地开发密码>' docker compose --env-file .env -f docker-compose.dev.yml up -d"
    echo ""
    echo "  生产环境（全套服务）："
    echo "    cd \"${SCRIPT_DIR}\" && docker compose --env-file .env -f docker-compose.yml up -d"
    echo ""
    echo -e "${YELLOW}注意事项：${NC}"
    echo "  1. 首次启动前请确认 .env 文件中的密码和密钥已修改"
    echo "  2. 生产 TLS/MQTT 证书必须由受信任 CA 签发并定期轮换"
    echo "  3. Mosquitto 用户密码来自 .env 中的 MQTT_USERNAME/MQTT_PASSWORD"
    echo "  4. Grafana 默认管理员: admin（密码见 .env 中 GRAFANA_PASSWORD）"
else
    echo -e "${RED}  配置验证发现 ${ERRORS} 个错误${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${RED}请修复以上错误后再启动服务。${NC}"
    exit 1
fi
