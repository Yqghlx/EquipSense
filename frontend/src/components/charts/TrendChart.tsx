import ReactECharts from 'echarts-for-react';
import { useTheme } from '../../hooks/useTheme';

interface TrendChartProps {
  /** 图表标题 */
  title?: string;
  /** 时序数据点 */
  data: Array<{ time: string; value: number }>;
  /** 折线颜色（十六进制） */
  color?: string;
  /** 图表高度（像素） */
  height?: number;
}

/**
 * 趋势折线图组件
 *
 * 用于展示设备指标随时间变化的趋势，支持亮色/暗色主题自适应。
 * 采用平滑曲线 + 渐变面积填充，视觉效果清晰直观。
 */
export function TrendChart({ title, data, color = '#3b82f6', height = 300 }: TrendChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const option = {
    backgroundColor: 'transparent',
    title: title
      ? { text: title, textStyle: { color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 14 } }
      : undefined,
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: isDark ? '#1e293b' : '#fff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    },
    grid: { left: 50, right: 20, top: title ? 40 : 20, bottom: 30 },
    xAxis: {
      type: 'time' as const,
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
    },
    series: [
      {
        type: 'line' as const,
        data: data.map((d) => [d.time, d.value]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '05' },
            ],
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
