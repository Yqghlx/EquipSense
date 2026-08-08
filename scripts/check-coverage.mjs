#!/usr/bin/env node
/**
 * 后端覆盖率门禁脚本（纯 Node，无 .NET 工具依赖）
 *
 * 读取合并后的 Cobertura XML，按程序集断言阈值。覆盖率只升不降（ratchet 棘轮机制）：
 *
 *   - EquipAI.Core          80%  （领域核心，测试充分，对标 roadmap 80% 目标）
 *   - EquipAI.Application   78%  （业务逻辑，已接近 81%，留 3pp 波动余量）
 *   - EquipAI.WebAPI        50%  （Controller 层，集成测试覆盖；部分 Controller 未覆盖）
 *   - EquipAI.EdgeGateway   28%  （边缘网关，独立部署，主要由集成/E2E 间接覆盖）
 *   - EquipAI.Infrastructure 从门禁豁免 — EF 迁移/仓储等基础设施由集成测试保证，
 *                              迁移类已从采集排除，剩余仓储覆盖率受 DB 集成测试影响大、波动大
 *   - EquipAI.Simulator     从门禁豁免 — 测试辅助工具，非生产代码
 *
 * 程序集低于阈值 → 退出码 1，CI 红；并列出缺口，方便定位补测。
 *
 * 用法：
 *   node scripts/check-coverage.mjs <path-to-merged-cobertura.xml>
 *   node scripts/check-coverage.mjs                 # 默认读取 coverage-merged/Cobertura.xml
 *
 * 由 .github/workflows/ci.yml backend job 调用。
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// ── 门禁配置：程序集 → 行覆盖率下限（百分比） ──────────────────────────
// 阈值来源：合并 unit + integration 覆盖率基线（2026-08-08），
// 取当前值下浮 1-3pp 作为余量，防止测试增删导致的小幅波动误伤。
// 提升覆盖率后应相应上调这些值（棘轮只升不降）。
const THRESHOLDS = {
  'EquipAI.Core': 80,          // 基线 84.9%
  'EquipAI.Application': 78,   // 基线 81.1%
  'EquipAI.WebAPI': 50,        // 基线 55.5%
  'EquipAI.EdgeGateway': 28,   // 基线 32.3%
};

// ── Cobertura XML 解析 ─────────────────────────────────────────────
function parseCobertura(xmlPath) {
  const xml = readFileSync(xmlPath, 'utf8');

  const packages = [...xml.matchAll(/<package\s+name="([^"]+)"[^>]*line-rate="([0-9.]+)"[^>]*>/g)]
    .map((m) => ({
      name: m[1],
      lineRate: Math.round(parseFloat(m[2]) * 1000) / 10, // 保留 1 位小数
    }));

  if (packages.length === 0) {
    throw new Error(`未在 ${xmlPath} 中解析到 <package> 节点，Cobertura XML 格式异常`);
  }

  const globalMatch = xml.match(/<coverage\s+[^>]*line-rate="([0-9.]+)"/);
  const globalLineRate = globalMatch ? Math.round(parseFloat(globalMatch[1]) * 1000) / 10 : null;

  return { packages, globalLineRate };
}

// ── 主逻辑 ──────────────────────────────────────────────────────────
function main() {
  const xmlPath = process.argv[2] || 'coverage-merged/Cobertura.xml';

  if (!existsSync(xmlPath)) {
    console.error(`✗ 覆盖率报告不存在: ${xmlPath}`);
    console.error('  请先运行 [dotnet test --collect] 并用 reportgenerator 合并。');
    process.exit(2);
  }

  const { packages, globalLineRate } = parseCobertura(xmlPath);
  const pkgMap = new Map(packages.map((p) => [p.name, p.lineRate]));

  console.log('━'.repeat(64));
  console.log('  覆盖率门禁检查（Cobertura → 按程序集）');
  console.log('━'.repeat(64));
  console.log(`  全局行覆盖率: ${globalLineRate ?? 'N/A'}%`);
  console.log('');

  let failures = 0;
  console.log('  程序集                       现值     阈值    结果');
  console.log('  ' + '─'.repeat(54));

  for (const [pkg, threshold] of Object.entries(THRESHOLDS)) {
    const actual = pkgMap.get(pkg);
    if (actual === undefined) {
      console.log(`  ${pkg.padEnd(28)}   N/A     ${String(threshold).padStart(3)}%   ⚠️  未采集（跳过）`);
      continue;
    }
    const pass = actual >= threshold;
    const gap = (actual - threshold).toFixed(1);
    const sign = actual >= threshold ? '+' : '';
    const mark = pass ? '✓' : '✗';
    console.log(
      `  ${pkg.padEnd(28)}   ${actual.toFixed(1).padStart(5)}%   ${String(threshold).padStart(3)}%   ${mark}  (${sign}${gap}pp)`
    );
    if (!pass) failures++;
  }

  // 豁免说明（仅展示，不门禁）
  console.log('');
  console.log('  豁免程序集（不门禁，原因见脚本头注释）:');
  for (const exempt of ['EquipAI.Infrastructure', 'EquipAI.Simulator']) {
    const actual = pkgMap.get(exempt);
    console.log(`    ${exempt.padEnd(28)} ${(actual ?? 'N/A').toFixed ? (actual ?? 0).toFixed(1) + '%' : 'N/A'}`);
  }

  console.log('');
  if (failures === 0) {
    console.log('  ✅ 覆盖率门禁通过');
    process.exit(0);
  } else {
    console.log(`  ❌ ${failures} 个程序集低于阈值，请补充测试或下调阈值（仅限合理理由）`);
    process.exit(1);
  }
}

main();
