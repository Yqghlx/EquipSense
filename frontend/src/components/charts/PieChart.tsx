import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../hooks/useTheme';

/** 饼图数据项 */
interface PieDataItem {
  /** 分类名称 */
  name: string;
  /** 数值 */
  value: number;
  /** 自定义颜色（可选，不传则使用默认色板） */
  color?: string;
}

interface PieChartProps {
  /** 图表标题 */
  title?: string;
  /** 饼图数据 */
  data: PieDataItem[];
  /** 图表高度（像素） */
  height?: number;
}

/** 默认色板 */
const defaultColors = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6'];

/**
 * 环形饼图组件
 *
 * 用于展示分类占比（如告警级别分布、设备状态统计）。
 * 支持亮色/暗色主题自适应，悬停时显示标签。
 */
export function PieChart({ title, data, height = 300 }: PieChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const option = {
    backgroundColor: 'transparent',
    title: title
      ? { text: title, textStyle: { color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 14 } }
      : undefined,
    tooltip: {
      trigger: 'item' as const,
      backgroundColor: isDark ? '#1e293b' : '#fff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    legend: {
      bottom: 0,
      textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 },
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: isDark ? '#0f172a' : '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color ?? defaultColors[i % defaultColors.length] },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
