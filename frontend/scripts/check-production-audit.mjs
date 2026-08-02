import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const allowedAdvisory = "https://github.com/advisories/GHSA-qwww-vcr4-c8h2";
const allowedPackages = new Set(["react-router", "react-router-dom"]);

/**
 * 读取已安装依赖的实际版本，避免只检查 package.json 的范围声明。
 * CI 使用 npm ci 后执行此脚本，因此这里校验的是 lockfile 最终解析出的版本。
 */
function readInstalledVersion(packageName) {
  const packagePath = resolve("node_modules", packageName, "package.json");
  try {
    return JSON.parse(readFileSync(packagePath, "utf8")).version;
  } catch (error) {
    console.error(`无法读取已安装依赖 ${packageName} 的版本：${error.message}`);
    process.exit(1);
  }
}

/**
 * npm audit 在发现漏洞时会以退出码 1 结束，但 JSON 报告仍然写入标准输出。
 * 这里保留报告内容，以便对已评估的例外做精确匹配。
 */
function runAudit() {
  try {
    return JSON.parse(
      execFileSync("npm", ["audit", "--omit=dev", "--json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"],
      }),
    );
  } catch (error) {
    const output = error.stdout?.toString() ?? "";
    try {
      return JSON.parse(output);
    } catch {
      console.error("npm audit 未返回可解析的 JSON 报告，阻断流水线。\n", output);
      process.exit(1);
    }
  }
}

const report = runAudit();
const vulnerabilities = Object.entries(report.vulnerabilities ?? {});
const blockingVulnerabilities = vulnerabilities.filter(([, vulnerability]) =>
  ["high", "critical"].includes(vulnerability.severity),
);

if (blockingVulnerabilities.length === 0) {
  console.log("生产依赖审计通过：没有发现 high/critical 漏洞。");
  process.exit(0);
}

const routerVersion = readInstalledVersion("react-router");
const routerDomVersion = readInstalledVersion("react-router-dom");
const isPinnedToLatestStableRouterLine =
  /^7\.18\.\d+$/.test(routerVersion) && /^7\.18\.\d+$/.test(routerDomVersion);

/**
 * 当前版本的 React Router 公告仅影响不稳定的 RSC API。
 * EquipSense 使用 BrowserRouter SPA，不引入 RSC；这里仍要求包名、版本和公告 URL
 * 全部匹配，防止将未来出现的其他漏洞误归入这个例外。
 */
function isApprovedRouterException([packageName, vulnerability]) {
  if (!allowedPackages.has(packageName) || !isPinnedToLatestStableRouterLine) {
    return false;
  }

  const advisoryUrls = vulnerability.via
    .filter((entry) => typeof entry === "object" && entry !== null)
    .map((entry) => entry.url)
    .filter(Boolean);
  const packageReferences = vulnerability.via.filter((entry) => typeof entry === "string");
  const routerRootVulnerability = report.vulnerabilities?.["react-router"];
  const routerRootHasAllowedAdvisory = routerRootVulnerability?.via
    ?.filter((entry) => typeof entry === "object" && entry !== null)
    .some((entry) => entry.url === allowedAdvisory);

  return (
    (advisoryUrls.length > 0
      ? advisoryUrls.every((url) => url === allowedAdvisory)
      : packageName === "react-router-dom" &&
        packageReferences.includes("react-router") &&
        routerRootHasAllowedAdvisory) &&
    packageReferences.every((name) => allowedPackages.has(name))
  );
}

const unexpectedVulnerabilities = blockingVulnerabilities.filter(
  (entry) => !isApprovedRouterException(entry),
);

if (unexpectedVulnerabilities.length > 0) {
  console.error("发现未登记的生产依赖 high/critical 漏洞，阻断流水线：");
  for (const [packageName, vulnerability] of unexpectedVulnerabilities) {
    console.error(`- ${packageName}: ${vulnerability.severity}`);
  }
  process.exit(1);
}

console.warn(
  `生产依赖审计保留 1 项已登记例外：react-router ${routerVersion} / ` +
    `react-router-dom ${routerDomVersion} 的 RSC-only 公告 ${allowedAdvisory}。` +
    "当前应用使用 BrowserRouter SPA，不使用不稳定 RSC API；待 DOM 包提供修复版本后重新评估。",
);
