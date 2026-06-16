import { Badge } from '../ui/badge';
import { useTranslation } from 'react-i18next';

/** 告警严重级别对应的样式映射 */
const severityStyles: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

interface SeverityBadgeProps {
  /** 严重级别（critical / high / normal / low） */
  severity: string;
}

/**
 * 告警严重级别徽章组件
 *
 * 根据告警严重级别显示不同颜色的标签，颜色映射：
 * - critical → 红色
 * - high → 橙色
 * - normal → 蓝色
 * - low → 灰色
 */
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={severityStyles[severity] ?? ''}>
      {t(`alert.${severity.toLowerCase()}` as 'alert.critical' | 'alert.high' | 'alert.normal' | 'alert.low')}
    </Badge>
  );
}
