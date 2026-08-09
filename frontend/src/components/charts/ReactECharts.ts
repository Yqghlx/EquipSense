/**
 * 只引入 echarts-for-react 的核心包装器，避免其默认入口同时引入完整 ECharts 包。
 * 具体图表能力由 ./echarts.ts 按需注册。
 */
export { default } from 'echarts-for-react/esm/core';
