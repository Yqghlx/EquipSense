#!/usr/bin/env bash
# 生产脚本回归测试：验证初始化失败保护和附件备份闭环。

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/equipsense-production-scripts.XXXXXX")"

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

fail() {
  echo "测试失败：$*" >&2
  exit 1
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  [[ "$haystack" == *"$needle"* ]] || fail "输出中缺少：$needle"
}

test_setup_rejects_new_placeholder_env() {
  local case_dir="$TEST_ROOT/setup"
  mkdir -p "$case_dir"
  cp "$PROJECT_ROOT/docker/setup.sh" "$case_dir/setup.sh"
  cp "$PROJECT_ROOT/docker/.env.example" "$case_dir/.env.example"

  # 新版 setup.sh 会在复制模板后调用验证器；测试复制验证器时兼容旧代码，
  # 这样当前版本会因为继续生成证书而失败，证明测试确实能捕获回归。
  if [[ -f "$PROJECT_ROOT/docker/validate-env.sh" ]]; then
    cp "$PROJECT_ROOT/docker/validate-env.sh" "$case_dir/validate-env.sh"
  fi

  local output
  local result_code
  set +e
  output="$(cd "$case_dir" && bash ./setup.sh 2>&1)"
  result_code=$?
  set -e

  [[ "$result_code" -ne 0 ]] || fail "占位 .env 不应让 setup.sh 成功"
  [[ -f "$case_dir/.env" ]] || fail "setup.sh 应保留生成的 .env 模板供用户编辑"
  [[ ! -d "$case_dir/ssl" ]] || fail "凭据未通过时不应继续生成 TLS 文件"
  [[ ! -d "$case_dir/mqtt-certs" ]] || fail "凭据未通过时不应继续生成 MQTT 证书"
  assert_contains "$output" "必填环境变量 PG_PASSWORD"
}

test_backup_includes_attachments() {
  local case_dir="$TEST_ROOT/backup"
  local fake_attachment_root="$case_dir/fake-attachments"
  local backup_dir="$case_dir/backups"
  mkdir -p "$case_dir/bin" "$fake_attachment_root"

  cp "$PROJECT_ROOT/docker/backup.sh" "$case_dir/backup.sh"
  printf '%s\n' '附件备份测试文件' > "$fake_attachment_root/report.txt"
  printf '%s\n' \
    'PG_PASSWORD=test-password' \
    'PG_CONTAINER=fake-postgres' \
    'BACKUP_REDIS=false' \
    'BACKUP_ATTACHMENTS=true' \
    "BACKUP_DIR=$backup_dir" > "$case_dir/.env"

  # 只模拟 Docker 的两个只读导出动作，压缩和归档仍使用真实工具，
  # 这样测试验证的是备份脚本产生的实际文件，而不是 mock 的调用次数。
  printf '%s\n' \
    '#!/usr/bin/env bash' \
    'set -euo pipefail' \
    'case "${1:-}" in' \
    '  ps) printf "fake-postgres\\n" ;;' \
    '  exec)' \
    '    if [[ "$*" == *"pg_dump"* ]]; then printf "CREATE TABLE backup_test;\\n"; exit 0; fi' \
    '    if [[ "$*" == *"tar"* ]]; then tar -C "$FAKE_ATTACHMENTS_ROOT" -czf - .; exit 0; fi' \
    '    exit 1 ;;' \
    '  *) exit 1 ;;' \
    'esac' > "$case_dir/bin/docker"
  chmod +x "$case_dir/bin/docker"

  PATH="$case_dir/bin:$PATH" \
    FAKE_ATTACHMENTS_ROOT="$fake_attachment_root" \
    bash "$case_dir/backup.sh" > "$case_dir/backup.log" 2>&1

  local sql_file
  local attachment_file
  sql_file="$(find "$backup_dir" -name '*.sql.gz' -print -quit)"
  attachment_file="$(find "$backup_dir" -name 'attachments_*.tar.gz' -print -quit)"
  [[ -n "$sql_file" ]] || fail "应生成 PostgreSQL 备份"
  [[ -n "$attachment_file" ]] || fail "应生成工单附件备份"
  gzip -t "$sql_file"
  tar -tzf "$attachment_file" | grep -q 'report.txt' || fail "附件归档中缺少测试文件"
}

case "${1:-all}" in
  setup)
    test_setup_rejects_new_placeholder_env
    ;;
  backup)
    test_backup_includes_attachments
    ;;
  all)
    test_setup_rejects_new_placeholder_env
    test_backup_includes_attachments
    ;;
  *)
    fail "用法：$0 [setup|backup|all]"
    ;;
esac
echo "生产脚本测试通过"
