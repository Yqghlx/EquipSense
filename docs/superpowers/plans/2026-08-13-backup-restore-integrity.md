# 备份批次完整性与恢复前门禁实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为每次备份生成可验证的批次清单，并让生产确认恢复在任何数据变更前拒绝串批次或被篡改的文件。

**Architecture:** `backup.sh` 在现有组件备份成功后生成原子 TSV 清单，记录批次、组件、文件名、大小和 SHA-256；`restore.sh` 在 dry-run/confirm 前解析固定字段并校验传入文件，确认恢复无清单时必须显式 `--legacy`。隔离演练使用清单完成真实 Docker 恢复，脚本行为测试覆盖拒绝路径。

**Tech Stack:** Bash、Docker Compose、PostgreSQL/TimescaleDB、AWS CLI（可选 S3）、现有 production-scripts-test。

## Global Constraints

- 不读取、修改或提交真实 `docker/.env`、生产数据库、对象存储和证书。
- 所有新增注释、日志、文档和错误信息使用简体中文。
- 清单只作为完整性校验，不声称提供加密签名；生产备份访问仍依赖密钥管理和对象存储权限。
- 保留历史 `.sql.gz` 和无清单备份，但确认恢复必须显式使用 `--legacy`。
- 清单文件不得被 `source`；所有字段必须经过格式、路径和长度验证。

---

### Task 1: 固化清单格式和恢复前拒绝行为测试

**Files:**
- Modify: `tests/scripts/production-scripts-test.sh`
- Test fixture helpers: same file near `create_restore_fixtures`

**Interfaces:**
- Produces the required behavior for `backup.sh --` generated `backup-manifest_*.tsv` and `restore.sh --manifest PATH`.
- Uses `--legacy` only for existing confirm fixtures that intentionally exercise the backward-compatible path.

- [ ] **Step 1: Add a fixture helper that writes a valid manifest from existing files**

The helper must use `sha256sum` when available and `shasum -a 256` otherwise, emit only the fixed TSV fields, set mode 600, and accept optional Redis input.

- [ ] **Step 2: Add a failing test for a tampered artifact**

Create a valid manifest, mutate `attachments.tar.gz`, run `restore.sh` without `--confirm`, and assert a non-zero result containing `SHA-256` while a fake Docker command is not called.

- [ ] **Step 3: Add a failing test for a mixed batch**

Create two attachment archives, point `--attachments-backup` to the second while the manifest names the first, and assert a non-zero result containing `批次清单` before Docker invocation.

- [ ] **Step 4: Add a failing test for confirm without a manifest**

Use the existing confirm fixture without `--manifest` and assert it fails before `docker compose`; add `--legacy` to the existing positive legacy test so backward compatibility is explicit.

- [ ] **Step 5: Run the focused script tests and verify they fail for the missing implementation**

Run: `bash tests/scripts/production-scripts-test.sh`

Expected: the new assertions fail because backup does not yet create/consume the manifest and restore does not yet require `--legacy`.

- [ ] **Step 6: Commit the failing tests**

```bash
git add tests/scripts/production-scripts-test.sh
git commit -m "test(backup): define manifest integrity gates"
```

### Task 2: Generate atomic backup batch manifests

**Files:**
- Modify: `docker/backup.sh`
- Test: `tests/scripts/production-scripts-test.sh`

**Interfaces:**
- `backup.sh` produces `backup-manifest_<TIMESTAMP>.tsv` only when all enabled artifacts and their existing format checks pass.
- Artifact rows use `artifact<TAB><type><TAB><basename><TAB><bytes><TAB><sha256>`.

- [ ] **Step 1: Add a portable SHA-256 helper and validate it before backup execution**

Prefer `sha256sum`, fall back to `shasum -a 256`, and fail with a Chinese message if neither exists.

- [ ] **Step 2: Add manifest generation after component backups and before remote sync**

Write to `backup-manifest_${TIMESTAMP}.tsv.tmp.$$`, include `format` and `batch_id`, append only files in `BACKUP_FILES`, validate the digest format, then `chmod 600` and atomically `mv` to the final name. A failed write or digest must set `BACKUP_SUCCESS=false` and remove the temporary/final manifest.

- [ ] **Step 3: Include manifests in retention cleanup and S3 synchronization**

Add `backup-manifest_*.tsv` to cleanup and `aws s3 sync` include filters. Do not sync any manifest when local backup is incomplete.

- [ ] **Step 4: Add tests for successful manifest and failed manifest prerequisites**

Assert the manifest has the expected three fixed fields, artifact names, positive sizes, 64-character lowercase hex digests, mode 600, and no credential values. Add a fake hash-tool failure case that returns non-zero.

- [ ] **Step 5: Run the focused script tests and verify they pass**

Run: `bash tests/scripts/production-scripts-test.sh`

Expected: all backup manifest tests and existing backup tests pass.

- [ ] **Step 6: Commit the backup implementation**

```bash
git add docker/backup.sh tests/scripts/production-scripts-test.sh
git commit -m "feat(backup): record verifiable batch manifest"
```

### Task 3: Validate manifests before restore side effects

**Files:**
- Modify: `docker/restore.sh`
- Test: `tests/scripts/production-scripts-test.sh`

**Interfaces:**
- New options: `--manifest PATH` and `--legacy`.
- `--manifest` is validated before `print_plan` completes; `--confirm` without a manifest fails unless `--legacy` is present.

- [ ] **Step 1: Add option parsing and usage text**

Resolve `--manifest` to an absolute path, require private mode 400/600, and reject simultaneous invalid states such as `--legacy` plus a manifest.

- [ ] **Step 2: Implement fixed-field manifest parsing**

Validate version, batch ID, unique artifact types, single-level safe basenames, positive decimal sizes, and 64-character lowercase hex digests. Never execute or evaluate manifest content.

- [ ] **Step 3: Verify every supplied artifact against the manifest**

Compare basename, byte count, and SHA-256 before any Docker command. Require database and non-skipped attachment rows; validate Redis only when `--redis-backup` is provided. Reject missing, extra, or mismatched files with non-zero output.

- [ ] **Step 4: Gate confirm mode and preserve explicit legacy compatibility**

Allow a no-manifest dry-run to print the historical plan, but require `--legacy` for no-manifest `--confirm`; label the plan as legacy. Manifest validation errors must occur before restore lock, Docker, AWS, or service stop.

- [ ] **Step 5: Run focused restore tests and verify they pass**

Run: `bash tests/scripts/production-scripts-test.sh`

Expected: tampered, mixed, malformed, and missing-manifest cases fail before Docker; manifest-backed and explicit legacy confirm cases pass.

- [ ] **Step 6: Commit the restore implementation**

```bash
git add docker/restore.sh tests/scripts/production-scripts-test.sh
git commit -m "feat(restore): verify batch manifest before mutation"
```

### Task 4: Upgrade the real isolated rehearsal and runbooks

**Files:**
- Modify: `tests/backup-restore-rehearsal.sh`
- Modify: `docs/OPS_RUNBOOK.md`
- Modify: `docs/evaluation/S09-风险登记册.md`
- Modify: `docs/LANDING_READINESS_REPORT.md`

**Interfaces:**
- The rehearsal discovers `backup-manifest_*.tsv`, passes `--manifest`, and verifies restored database and attachment markers.
- The runbook describes same-batch selection, manifest hash checks, legacy boundary, and RTO/RPO evidence.

- [ ] **Step 1: Pass the generated manifest in the isolated Docker rehearsal**

Fail if the manifest is absent; do not silently fall back to legacy mode.

- [ ] **Step 2: Add runbook acceptance and failure-handling steps**

Document manifest permissions, checksum verification, pre-mutation boundary, explicit legacy mode, and evidence fields without exposing passwords or recovery codes.

- [ ] **Step 3: Update risk and readiness evidence**

Record the code-side mitigation while keeping real production credentials, object-storage permissions, and production-equivalent rehearsal as deployment-side prerequisites.

- [ ] **Step 4: Run syntax, script, and Docker rehearsal checks**

Run:

```bash
bash -n docker/backup.sh docker/restore.sh tests/backup-restore-rehearsal.sh
bash tests/scripts/production-scripts-test.sh
bash tests/backup-restore-rehearsal.sh
```

Expected: syntax and script tests pass; Docker rehearsal passes when the Docker engine is available, otherwise report the environmental prerequisite without weakening the script gate.

- [ ] **Step 5: Commit the rehearsal and evidence**

```bash
git add tests/backup-restore-rehearsal.sh docs/OPS_RUNBOOK.md docs/evaluation/S09-风险登记册.md docs/LANDING_READINESS_REPORT.md
git commit -m "docs(ops): close backup restore integrity rehearsal"
```

### Task 5: Final verification

**Files:**
- Read-only verification of all changed files and current worktree.

- [ ] **Step 1: Run `git diff --check` and confirm no secrets are present**

Search only changed files for credential-like fixture values and ensure they are test-local placeholders, not production values.

- [ ] **Step 2: Run the repository production gates**

Run `bash tests/scripts/production-scripts-test.sh`, relevant backend tests if touched, and the current environment validator without modifying `docker/.env`.

- [ ] **Step 3: Record remaining external blockers honestly**

Keep the 27 real deployment credential/certificate blockers explicit; do not mark the overall product goal complete until deployment-side evidence is supplied and verified.

