/**
 * 比较后端枚举字符串与前端期望状态。
 *
 * 后端 DTO 通过 `Enum.ToString()` 输出 PascalCase（如 Active / Closed），
 * 页面里很容易误写成小写字面量，导致操作按钮永不出现。
 * 统一忽略大小写和首尾空白，避免把真实状态当成“不可操作”。
 */
export function matchesStatus(actual: string | null | undefined, expected: string): boolean {
  return (actual ?? '').trim().toLowerCase() === expected.trim().toLowerCase();
}

/**
 * 判断实际状态是否匹配任意一个期望值。
 */
export function matchesAnyStatus(actual: string | null | undefined, expected: readonly string[]): boolean {
  return expected.some((value) => matchesStatus(actual, value));
}
