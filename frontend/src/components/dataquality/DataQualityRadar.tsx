import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { DataQualityDimensions } from '../../hooks/useDataQuality';

interface DataQualityRadarProps {
  dimensions: DataQualityDimensions;
  overallScore: number;
}

/**
 * 数据质量雷达图组件
 *
 * 以五维雷达图展示数据质量各维度评分，
 * 中心显示综合评分。
 */
export function DataQualityRadar({ dimensions, overallScore }: DataQualityRadarProps) {
  const { t } = useTranslation();

  const option = {
    tooltip: { trigger: 'item' as const },
    radar: {
      indicator: [
        { name: t('dataquality.completeness'), max: 1 },
        { name: t('dataquality.accuracy'), max: 1 },
        { name: t('dataquality.timeliness'), max: 1 },
        { name: t('dataquality.consistency'), max: 1 },
        { name: t('dataquality.validity'), max: 1 },
      ],
      shape: 'polygon' as const,
      splitNumber: 4,
      axisName: { color: '#666', fontSize: 11 },
    },
    series: [{
      type: 'radar' as const,
      data: [{
        value: [
          dimensions.completeness,
          dimensions.accuracy,
          dimensions.timeliness,
          dimensions.consistency,
          dimensions.validity,
        ],
        areaStyle: { color: 'rgba(59, 130, 246, 0.2)' },
        lineStyle: { color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
      }],
    }],
    graphic: [{
      type: 'text' as const,
      left: 'center',
      top: 'center',
      style: {
        text: `${Math.round(overallScore * 100)}%`,
        fontSize: 28,
        fontWeight: 'bold',
        fill: overallScore >= 0.8 ? '#22c55e' : overallScore >= 0.6 ? '#eab308' : '#ef4444',
      },
    }],
  };

  return <ReactECharts option={option} style={{ height: 260 }} />;
}
