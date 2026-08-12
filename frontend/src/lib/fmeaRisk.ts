/** 计算 FMEA 风险优先数。 */
export function calculateFmeaRpn(severity: number, occurrence: number, detectability: number): number {
  return severity * occurrence * detectability;
}

/** 判断输入是否为 1 到 10 之间的整数评分。 */
export function isValidFmeaRating(value: string): boolean {
  if (!/^\d+$/.test(value)) return false;

  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 10;
}

/** 返回与 FMEA 列表一致的 RPN 风险色阶。 */
export function getFmeaRpnColor(rpn: number): string {
  if (rpn >= 200) return 'bg-red-500/10 text-red-700';
  if (rpn >= 100) return 'bg-orange-500/10 text-orange-700';
  return 'bg-yellow-500/10 text-yellow-700';
}
