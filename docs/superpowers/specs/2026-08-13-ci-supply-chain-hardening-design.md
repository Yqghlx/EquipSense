# CI 发布供应链加固设计

## 背景

当前 `.github/workflows/ci.yml` 的 `docker` 和 `release` job 先用 `load: true` 构建并扫描本地镜像，再用第二次 Buildx 调用重新构建并推送。两次构建没有 digest 绑定，扫描结果无法严格证明最终 GHCR 制品的内容。

版本发布还在同一个拥有 `packages: write` 的 job 中创建 GitHub Release，但该 job 只有 `contents: read`，会在镜像写入 GHCR 后留下 Release 创建失败的部分发布状态。两份 workflow 的 Action 引用也仍大量使用可移动 major tag。

## 设计

1. 保留质量门禁和本地镜像构建流程。三张镜像通过 Trivy 后，使用 runner 上已经扫描的本地标签逐个执行 `docker image push`，删除第二轮 Buildx；因此扫描对象和推送对象是同一个本地 image ID。
2. 保留 `release` job 负责版本镜像发布，仅授予 `contents: read` 与 `packages: write`。新增独立 `create-release` job，仅授予 `contents: write`，并依赖 `release`；`deploy` 同时依赖两者的成功结果。
3. 在 `ci.yml` 和 `codeql.yml` 顶层声明 `permissions: contents: read`，所有 Action 引用固定到对应官方仓库的完整 commit SHA，并保留 `# vX` 注释供 Dependabot 更新。涉及生产 SSH 私钥、GHCR 写权限和 CodeQL SARIF 写权限的 Action 也必须固定。
4. 生产脚本契约测试必须验证：两个镜像 job 都直接推送已扫描标签、没有扫描后第二次 `build-push-action`；Release 创建 job 权限与依赖正确；所有 Action 引用均为完整 40 位 SHA；现有质量门禁顺序保持不变。

## 非目标

- 不改变 `latest`、semver 标签和部署回滚语义。
- 不在本批次升级 .NET SDK 或修复 `.slnx` 文件。
- 不把 `contents: write` 扩大到镜像构建 job。

## 验收标准

- CI 契约测试在旧 workflow 上先失败，在新 workflow 上通过。
- `ci.yml` 与 `codeql.yml` 的每个 `uses:` 引用均为官方仓库完整 SHA。
- YAML 解析、Shell 语法、生产脚本 CI 契约测试和现有相关测试通过。
- 审计文档准确记录修复后的 Action 数量、权限边界和剩余风险。
