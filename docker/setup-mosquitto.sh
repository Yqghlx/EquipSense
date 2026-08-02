#!/usr/bin/env bash
# =============================================================================
# setup-mosquitto.sh — 创建 Mosquitto MQTT Broker 的用户密码文件
# =============================================================================
#
# 用途：为生产环境的 Mosquitto 生成密码文件，配合 mosquitto.prod.conf 使用。
#       生产环境禁用匿名访问（allow_anonymous false），必须通过密码文件认证。
#
# 使用方式：
#   cd docker && ./setup-mosquitto.sh
#   cd docker && ./setup-mosquitto.sh <用户名> <密码>
#
# 用户名和密码必须通过命令行参数、环境变量或 docker/.env 提供，脚本不再内置公开默认值。
# =============================================================================

set -euo pipefail

# 脚本所在目录（即 docker/）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASSWD_DIR="${SCRIPT_DIR}/mosquitto_passwd"
PASSWD_FILE="${PASSWD_DIR}/passwd"

# 从命令行参数或环境变量读取。
USERNAME="${1:-${MQTT_USERNAME:-}}"
PASSWORD="${2:-${MQTT_PASSWORD:-}}"

# setup.sh 会在密码文件缺失时调用本脚本，此时优先从同目录 .env 读取，避免把密码打印到日志。
ENV_FILE="${SCRIPT_DIR}/.env"
if [ -f "${ENV_FILE}" ]; then
    [ -n "${USERNAME}" ] || USERNAME="$(awk -F= '$1 == "MQTT_USERNAME" {print substr($0, index($0, "=") + 1); exit}' "${ENV_FILE}")"
    [ -n "${PASSWORD}" ] || PASSWORD="$(awk -F= '$1 == "MQTT_PASSWORD" {print substr($0, index($0, "=") + 1); exit}' "${ENV_FILE}")"
fi

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Mosquitto 密码文件配置工具${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

if [ -z "${USERNAME}" ] || [ -z "${PASSWORD}" ]; then
    echo -e "${RED}错误：必须配置 MQTT_USERNAME 和 MQTT_PASSWORD，脚本不提供默认凭据${NC}" >&2
    exit 1
fi

if [[ "${USERNAME}" == *"请修改"* || "${PASSWORD}" == *"请修改"* || "${USERNAME}" == "device" || "${PASSWORD}" == "device123" ]]; then
    echo -e "${RED}错误：MQTT_USERNAME/MQTT_PASSWORD 仍是占位值或公开默认值，请先修改 docker/.env${NC}" >&2
    exit 1
fi

# 创建密码文件目录
mkdir -p "${PASSWD_DIR}"

# 检查是否已有密码文件，如果有则备份
if [ -f "${PASSWD_FILE}" ]; then
    BACKUP_FILE="${PASSWD_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}检测到已有密码文件，备份到 ${BACKUP_FILE}${NC}"
    cp "${PASSWD_FILE}" "${BACKUP_FILE}"
fi

# 尝试使用 mosquitto_passwd 命令（如果系统已安装 mosquitto）
if command -v mosquitto_passwd &> /dev/null; then
    echo -e "${GREEN}使用 mosquitto_passwd 命令创建密码文件${NC}"

    # 创建新密码文件并添加用户
    # -c：创建新文件（会覆盖已有文件）
    # -b：批处理模式（从命令行参数读取密码，非交互式）
    mosquitto_passwd -c -b "${PASSWD_FILE}" "${USERNAME}" "${PASSWORD}"

    echo -e "${GREEN}已创建用户: ${USERNAME}${NC}"
else
    echo -e "${YELLOW}未找到 mosquitto_passwd 命令，使用替代方案...${NC}"
    echo -e "${YELLOW}提示：可通过 'apt install mosquitto-clients' 或 'brew install mosquitto' 安装${NC}"
    echo ""

    # 替代方案：使用 openssl 生成 PBKDF2 哈希密码
    # Mosquitto 2.x 支持 $7$ 格式（PBKDF2-SHA512）
    if command -v openssl &> /dev/null; then
        echo -e "${YELLOW}使用 openssl 生成密码哈希${NC}"

        # 生成盐值（16 字节，十六进制编码）
        SALT=$(openssl rand -hex 16)
        # 迭代次数（Mosquitto 默认 10000）
        ITERATIONS=10000
        # 生成 PBKDF2-SHA512 哈希
        HASH=$(echo -n "${PASSWORD}" | openssl kdf -keylen 64 -kdfopt digest:SHA512 \
            -kdfopt pass:"${PASSWORD}" -kdfopt salt:"${SALT}" \
            -kdfopt iter:${ITERATIONS} 2>/dev/null | head -1 || \
            openssl passwd -6 "${PASSWORD}" 2>/dev/null || \
            echo "")

        if [ -z "${HASH}" ]; then
            # 如果 PBKDF2 不可用，尝试使用 Docker 容器中的 mosquitto_passwd
            if command -v docker &> /dev/null; then
                echo -e "${YELLOW}使用 Docker 容器生成密码哈希${NC}"
                docker run --rm -v "${PASSWD_DIR}":/work \
                    eclipse-mosquitto:2 \
                    mosquitto_passwd -c -b /work/passwd "${USERNAME}" "${PASSWORD}"
            else
                echo -e "${RED}错误：无法生成密码哈希。${NC}"
                echo -e "${RED}请安装以下任一工具：${NC}"
                echo -e "${RED}  1. mosquitto-clients（推荐）${NC}"
                echo -e "${RED}  2. Docker（使用容器内 mosquitto_passwd）${NC}"
                exit 1
            fi
        else
            # 写入密码文件
            echo "${USERNAME}:${HASH}" > "${PASSWD_FILE}"
        fi
    elif command -v docker &> /dev/null; then
        echo -e "${YELLOW}使用 Docker 容器生成密码哈希${NC}"
        docker run --rm -v "${PASSWD_DIR}":/work \
            eclipse-mosquitto:2 \
            mosquitto_passwd -c -b /work/passwd "${USERNAME}" "${PASSWORD}"
    else
        echo -e "${RED}错误：未找到 openssl 或 docker，无法生成密码哈希${NC}"
        echo -e "${RED}请安装 openssl 或 Docker 后重试${NC}"
        exit 1
    fi
fi

# 设置密码文件权限（仅所有者可读写，mosquitto 容器内进程需要可读）
chmod 600 "${PASSWD_FILE}" 2>/dev/null || true

# 验证密码文件
if [ -f "${PASSWD_FILE}" ] && [ -s "${PASSWD_FILE}" ]; then
    echo ""
    echo -e "${GREEN}密码文件创建成功！${NC}"
    echo -e "  文件路径: ${PASSWD_FILE}"
    echo -e "  用户列表: $(cut -d: -f1 "${PASSWD_FILE}" | tr '\n' ' ')"
    echo ""
    echo -e "${YELLOW}⚠️  密码文件包含敏感信息，请勿提交到版本控制系统。${NC}"
else
    echo -e "${RED}错误：密码文件创建失败${NC}"
    exit 1
fi

# 提示添加更多用户
echo ""
echo -e "${GREEN}如需添加更多用户，可执行：${NC}"
echo "  mosquitto_passwd -b ${PASSWD_FILE} <用户名> <密码>"
echo "  # 或者使用 Docker："
echo "  docker run --rm -v ${PASSWD_DIR}:/work eclipse-mosquitto:2 mosquitto_passwd -b /work/passwd <用户名> <密码>"
