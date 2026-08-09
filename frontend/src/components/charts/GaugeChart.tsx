import ReactECharts from './ReactECharts';
import { useTheme } from '../../hooks/useTheme';
import { echarts } from './echarts';

interface GaugeChartProps {
  /** 当前值 */
  value: number;
  /** 最大值（默认 100） */
  max?: number;
  /** 仪表盘标题（显示在下方） */
  title?: string;
  /** 进度条颜色（十六进制） */
  color?: string;
  /** 图表高度（像素） */
  height?: number;
}

/**
 * 仪表盘组件
 *
 * 用于展示设备健康度、数据质量评分等百分比/数值指标。
 * 采用进度条样式，无指针，视觉简洁。
 */
export function GaugeChart({ value, max = 100, title, color = '#3b82f6', height = 200 }: GaugeChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge' as const,
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max,
        progress: { show: true, width: 12, itemStyle: { color } },
        axisLine: { lineStyle: { width: 12, color: [[1, isDark ? '#1e293b' : '#e2e8f0']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: !!title, offsetCenter: [0, '70%'], fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' },
        detail: {
          valueAnimation: true,
          fontSize: 24,
          fontWeight: 'bold',
          color: isDark ? '#e2e8f0' : '#1e293b',
          offsetCenter: [0, '30%'],
          formatter: `{value}${max === 100 ? '%' : ''}`,
        },
        data: [{ value, name: title }],
      },
    ],
  };

  return <ReactECharts echarts={echarts} option={option} style={{ height }} />;
}
