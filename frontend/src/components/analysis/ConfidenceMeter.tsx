import { GaugeChart } from '../charts/GaugeChart';

interface ConfidenceMeterProps {
  /** 置信度值（0-1） */
  confidence: number;
  /** 尺寸：sm 用于列表展开，md 用于独立展示 */
  size?: 'sm' | 'md';
}

/**
 * 置信度仪表盘组件
 *
 * 将 0-1 的置信度值转换为百分比，并通过颜色直观展示：
 * - >= 80% → 绿色（高置信度）
 * - >= 50% → 黄色（中等置信度）
 * - < 50% → 红色（低置信度）
 */
export function ConfidenceMeter({ confidence, size = 'md' }: ConfidenceMeterProps) {
  const percentage = Math.round(confidence * 100);
  const color = percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444';
  const height = size === 'sm' ? 120 : 200;

  return <GaugeChart value={percentage} color={color} height={height} />;
}
