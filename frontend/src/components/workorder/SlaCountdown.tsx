import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 已结束的工单状态 — 这些状态不显示 SLA 倒计时（无意义）
 *
 * Why: 工单完成后剩余时间是负数（已逾期）或正数（按时完成），
 *   但都对运维没有指导价值。已完成的工单应该看的是「实际完成时间 vs 截止时间」的偏差，
 *   那是另一个维度的统计指标，不属于本组件职责。
 */
const TERMINAL_STATUSES = new Set([
  'completed',
  'accepted',
  'closed',
  'cancelled',
  'rejected',
]);

/**
 * 剩余时间分桶粒度（决定显示「天 / 小时 / 分钟」）
 *
 * 设计原则：工业现场用户需要一眼看懂。
 *   - 剩余 ≥ 1 天 → 用「天」为单位（小时精度对长周期无意义）
 *   - 剩余 ≥ 1 小时 → 用「小时」为单位（分钟变化太快，频繁刷新无价值）
 *   - 剩余 < 1 小时 → 用「分钟」为单位（精确度足够，提示尽快处理）
 */
type RemainderBucket = 'days' | 'hours' | 'minutes' | 'overdue';

interface SlaCountdownProps {
  /** 工单截止时间（UTC ISO 字符串），null 表示未设置截止时间 */
  dueDate?: string | null;
  /** 工单创建时间（用于计算总时长，决定剩余百分比基线） */
  createdAt: string;
  /** 工单当前状态，已结束状态（completed/closed/...）不渲染倒计时 */
  status: string;
  /**
   * 已结束状态下是否回退显示原始日期
   * Why: 列表页紧凑布局可以隐藏（默认 false），详情页有标签不能空白（设 true）
   */
  showRawDateWhenTerminal?: boolean;
}

/**
 * 工单 SLA 倒计时组件
 *
 * 显示工单距截止时间的剩余时长，根据剩余比例和是否逾期用颜色区分：
 *   - 已逾期（dueDate < now）→ 红色 +「逾期 X」
 *   - 剩余 < 20%（紧急）→ 红色
 *   - 剩余 20-50%（警告）→ 橙色
 *   - 剩余 > 50%（正常）→ 绿色
 *
 * 组件每 60 秒自动刷新一次（用 useState + setInterval），保证临近逾期时颜色及时变化。
 * 不使用 react-i18next 的实时更新机制，避免每次 i18n 变化都触发渲染。
 */
export function SlaCountdown({ dueDate, createdAt, status, showRawDateWhenTerminal = false }: SlaCountdownProps) {
  const { t } = useTranslation();
  // now 作为状态而非直接调用 Date.now() — 既满足 react-hooks/purity 规则
  // （render 函数不能调用不纯函数），也保证 60 秒后重新计算剩余时间
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // 工业现场用户对分钟级精度足够，60 秒刷新平衡了实时性和性能
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // 已结束的工单不显示倒计时
  if (TERMINAL_STATUSES.has(status)) {
    if (!showRawDateWhenTerminal) return null;
    if (!dueDate) return <span className="text-sm text-muted-foreground">-</span>;
    return <span className="text-sm text-muted-foreground">{new Date(dueDate).toLocaleString()}</span>;
  }

  // 未设置截止时间的工单无法计算 SLA
  if (!dueDate) return <span className="text-sm text-muted-foreground">-</span>;

  const due = new Date(dueDate).getTime();
  const created = new Date(createdAt).getTime();
  const totalDuration = due - created;
  const remainingMs = due - now;

  // 总时长异常（dueDate 早于 createdAt）— 视为已逾期
  if (totalDuration <= 0) {
    return (
      <span className="text-sm font-medium text-red-600 dark:text-red-400">
        {t('workorder.slaOverdue', { time: formatDuration(Math.abs(remainingMs), 'overdue', t) })}
      </span>
    );
  }

  // 已逾期
  if (remainingMs <= 0) {
    return (
      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
        {t('workorder.slaOverdue', { time: formatDuration(Math.abs(remainingMs), 'overdue', t) })}
      </span>
    );
  }

  // 计算剩余比例 = 剩余时长 / 总时长（用于颜色分档）
  const remainingRatio = remainingMs / totalDuration;
  const bucket: RemainderBucket = pickBucket(remainingMs);
  const text = formatDuration(remainingMs, bucket, t);

  // 颜色分档：< 20% 红色 / 20-50% 橙色 / > 50% 绿色
  let colorClass: string;
  if (remainingRatio < 0.2) {
    colorClass = 'text-red-600 dark:text-red-400 font-semibold';
  } else if (remainingRatio < 0.5) {
    colorClass = 'text-orange-600 dark:text-orange-400 font-medium';
  } else {
    colorClass = 'text-green-600 dark:text-green-400';
  }

  return (
    <span className={`text-sm ${colorClass}`}>
      {t('workorder.slaRemaining', { time: text })}
    </span>
  );
}

/**
 * 根据剩余毫秒数选择合适的显示粒度
 */
function pickBucket(remainingMs: number): RemainderBucket {
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;
  if (remainingMs >= oneDay) return 'days';
  if (remainingMs >= oneHour) return 'hours';
  return 'minutes';
}

/**
 * 将毫秒数格式化为人类可读的时长字符串（带 i18n）
 *
 * @param ms 毫秒数（绝对值，正数）
 * @param bucket 显示粒度
 */
function formatDuration(ms: number, bucket: RemainderBucket, t: (k: string, o?: Record<string, unknown>) => string): string {
  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;
  const oneDay = 24 * oneHour;

  switch (bucket) {
    case 'days':
      // 向上取整 — 剩 1.2 天时显示「2 天」让用户提前准备
      return t('workorder.slaDays', { count: Math.ceil(ms / oneDay) });
    case 'hours':
      return t('workorder.slaHours', { count: Math.ceil(ms / oneHour) });
    case 'minutes':
      // 不足 1 分钟时显示「< 1 分钟」，避免显示 0
      return t('workorder.slaMinutes', { count: Math.max(1, Math.ceil(ms / oneMinute)) });
    case 'overdue':
      // 逾期显示按粒度递进 — 同 pickBucket 逻辑
      if (ms >= oneDay) return t('workorder.slaDays', { count: Math.floor(ms / oneDay) });
      if (ms >= oneHour) return t('workorder.slaHours', { count: Math.floor(ms / oneHour) });
      return t('workorder.slaMinutes', { count: Math.floor(ms / oneMinute) });
  }
}
