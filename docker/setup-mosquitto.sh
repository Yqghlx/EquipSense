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
#   cd docker && MQTT_USERNAME=<用户名> ./setup-mosquitto.sh
#
# 用户名可通过第一个参数、环境变量或 docker/.env 提供；密码只能通过环境变量或
# docker/.env 提供，随后仅经标准输入交给 mosquitto_passwd，禁止作为命令行参数传递。
# =============================================================================

set -euo pipefail
umask 077

# 脚本所在目录（即 docker/）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PASSWD_DIR="${SCRIPT_DIR}/mosquitto_passwd"
PASSWD_FILE="${PASSWD_DIR}/passwd"

# 从命令行参数或环境变量读取。
if [ "$#" -gt 1 ]; then
    echo "错误：禁止通过命令行参数传递 MQTT 密码；请使用 docker/.env 或 MQTT_PASSWORD 环境变量" >&2
    exit 1
fi

USERNAME="${1:-${MQTT_USERNAME:-}}"
PASSWORD="${MQTT_PASSWORD:-}"

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

# 密码文件包含可离线破解的认证哈希；拒绝符号链接，避免脚本或容器工具
# 跟随未审计目标写入或覆盖其它路径。
if [ -L "${PASSWD_FILE}" ]; then
    echo -e "${RED}错误：拒绝写入符号链接密码文件: ${PASSWD_FILE}${NC}" >&2
    exit 1
fi

# 检查是否已有密码文件，如果有则备份
if [ -f "${PASSWD_FILE}" ]; then
    BACKUP_FILE="${PASSWD_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}检测到已有密码文件，备份到 ${BACKUP_FILE}${NC}"
    cp "${PASSWD_FILE}" "${BACKUP_FILE}"
fi

# 密码只通过标准输入传递给官方工具，禁止使用 -b 将明文密码放进进程参数。
# 官方工具会交互式读取两次密码（输入和确认），因此这里显式提供两行 stdin。
if command -v mosquitto_passwd &> /dev/null; then
    echo -e "${GREEN}使用 mosquitto_passwd 命令创建密码文件${NC}"

    if ! printf '%s\n%s\n' "${PASSWORD}" "${PASSWORD}" \
        | mosquitto_passwd -c "${PASSWD_FILE}" "${USERNAME}"; then
        echo -e "${RED}错误：mosquitto_passwd 无法创建密码文件${NC}" >&2
        exit 1
    fi

    echo -e "${GREEN}已创建用户: ${USERNAME}${NC}"
elif command -v docker &> /dev/null; then
    echo -e "${YELLOW}未找到本机 mosquitto_passwd，使用固定版本 Docker 工具生成密码哈希${NC}"
    if ! printf '%s\n%s\n' "${PASSWORD}" "${PASSWORD}" \
        | docker run --rm -i -v "${PASSWD_DIR}":/work \
            eclipse-mosquitto:2@sha256:a908c65cc8e67ec9d292ef27c2c0360dbaaee7eb1b935cdd194e67697f15dea1 \
            mosquitto_passwd -c /work/passwd "${USERNAME}"; then
        echo -e "${RED}错误：Docker 中的 mosquitto_passwd 无法创建密码文件${NC}" >&2
        exit 1
    fi
else
    echo -e "${RED}错误：未找到 mosquitto_passwd 或 Docker，无法安全生成密码哈希${NC}" >&2
    echo -e "${RED}请安装 mosquitto-clients，或启动 Docker 后重试${NC}" >&2
    exit 1
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
echo "  mosquitto_passwd ${PASSWD_FILE} <用户名>"
echo "  # 按提示输入密码，不要把密码写入命令行参数"
echo "  # 或者使用 Docker："
echo "  docker run --rm -it -v ${PASSWD_DIR}:/work eclipse-mosquitto:2@sha256:a908c65cc8e67ec9d292ef27c2c0360dbaaee7eb1b935cdd194e67697f15dea1 mosquitto_passwd /work/passwd <用户名>"
