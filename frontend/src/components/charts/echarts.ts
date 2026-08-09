import * as echarts from 'echarts/core';
import {
  GaugeChart,
  LineChart,
  PieChart,
  RadarChart,
} from 'echarts/charts';
import {
  GraphicComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

/**
 * 注册项目实际使用的 ECharts 图表与组件。
 *
 * 直接从 `echarts/core` 入口导入并按需注册，避免引入完整图表包；
 * 这样首个图表页面仍能使用相同的 React 包装器，但浏览器下载体积更小。
 */
echarts.use([
  LineChart,
  PieChart,
  GaugeChart,
  RadarChart,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export { echarts };
