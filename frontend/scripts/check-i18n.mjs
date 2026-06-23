#!/usr/bin/env node
/**
 * i18n 键覆盖检查脚本
 *
 * 用途：扫描 src 下所有 .tsx 的 t('key') 调用，核对每个键在 zh.json / en.json 中是否存在。
 *       缺失键会直接在前端显示原始键名（如 "device.importPreview.title"）或回退到
 *       硬编码中文（英文用户看中文），是客户演示的失分点。
 *
 * 运行：node scripts/check-i18n.mjs    （或 npm run check:i18n）
 * 退出码：有缺失键返回 1（可在 CI 中作为门禁），无缺失返回 0。
 *
 * 注意：仅扫描静态字符串键 t('a.b.c')，无法识别动态拼接的键（如 t(`a.${var}`)），
 *       这类键需开发者自行确保翻译存在。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('../src', import.meta.url).pathname;
const ZH = JSON.parse(readFileSync(new URL('../src/i18n/zh.json', import.meta.url), 'utf-8'));
const EN = JSON.parse(readFileSync(new URL('../src/i18n/en.json', import.meta.url), 'utf-8'));

/** 递归收集目录下所有 .tsx 文件 */
function collectTsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...collectTsFiles(full));
    else if (extname(full) === '.tsx') out.push(full);
  }
  return out;
}

/** 按 dotted path 检查嵌套键是否存在 */
function hasKey(obj, dotted) {
  let cur = obj;
  for (const part of dotted.split('.')) {
    if (cur && typeof cur === 'object' && part in cur) cur = cur[part];
    else return false;
  }
  return true;
}

// 匹配 t('key') / t("key") 的静态键（含 t('key', ...) 带参形式）
const KEY_RE = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;

const keyToFiles = new Map();
for (const file of collectTsFiles(ROOT)) {
  const text = readFileSync(file, 'utf-8');
  let m;
  while ((m = KEY_RE.exec(text)) !== null) {
    const key = m[1];
    if (!keyToFiles.has(key)) keyToFiles.set(key, file.replace(ROOT + '/', ''));
  }
}

const missingZh = [];
const missingEn = [];
for (const key of [...keyToFiles.keys()].sort()) {
  if (!hasKey(ZH, key)) missingZh.push(key);
  if (!hasKey(EN, key)) missingEn.push(key);
}

const totalKeys = keyToFiles.size;
if (missingZh.length === 0 && missingEn.length === 0) {
  console.log(`✓ i18n 覆盖完整：${totalKeys} 个键在 zh.json / en.json 中均存在`);
  process.exit(0);
}

console.error(`✗ i18n 覆盖不完整（共扫描 ${totalKeys} 个键）：`);
if (missingZh.length) {
  console.error(`\n  zh.json 缺失 ${missingZh.length} 个：`);
  for (const k of missingZh) console.error(`    ${k}  <- ${keyToFiles.get(k)}`);
}
if (missingEn.length) {
  console.error(`\n  en.json 缺失 ${missingEn.length} 个：`);
  for (const k of missingEn) console.error(`    ${k}  <- ${keyToFiles.get(k)}`);
}
process.exit(1);
