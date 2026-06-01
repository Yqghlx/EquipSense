import { Badge } from '../ui/badge';

/** 优先级对应的样式映射 */
const priorityStyles: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

/** 优先级对应的中文标签 */
const priorityLabels: Record<string, string> = {
  critical: '紧急',
  high: '高',
  normal: '普通',
  low: '低',
};

interface PriorityBadgeProps {
  /** 优先级（critical / high / normal / low） */
  priority: string;
}

/**
 * 工单优先级徽章组件
 *
 * 根据优先级显示不同颜色的标签：
 * - critical → 红色
 * - high → 橙色
 * - normal → 蓝色
 * - low → 灰色
 */
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge variant="outline" className={priorityStyles[priority] ?? ''}>
      {priorityLabels[priority] ?? priority}
    </Badge>
  );
}
