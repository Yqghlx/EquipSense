import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/** 数据质量五维度评分 */
export interface DataQualityDimensions {
  completeness: number;
  accuracy: number;
  timeliness: number;
  consistency: number;
  validity: number;
}

/** 单指标数据质量报告 */
export interface DataQualityReport {
  deviceId: string;
  metric: string;
  score: number;
  dimensions: DataQualityDimensions;
  sampleCount: number;
  calculatedAt: string;
}

/** 设备所有指标数据质量概览 */
export interface DataQualityOverview {
  deviceId: string;
  overallScore: number;
  metrics: DataQualityReport[];
}

/** 查询单指标数据质量 */
export function useDataQuality(deviceId: string, metric?: string) {
  return useQuery({
    queryKey: ['data-quality', deviceId, metric],
    queryFn: async () => {
      const params = metric ? `?metric=${metric}` : '';
      const { data } = await api.get<DataQualityReport>(`/data-quality/${deviceId}${params}`);
      return data;
    },
    enabled: !!deviceId && !!metric,
    staleTime: 5 * 60 * 1000,
  });
}

/** 查询设备所有指标数据质量概览 */
export function useDataQualityOverview(deviceId: string) {
  return useQuery({
    queryKey: ['data-quality-overview', deviceId],
    queryFn: async () => {
      const { data } = await api.get<DataQualityOverview>(`/data-quality/${deviceId}/overview`);
      return data;
    },
    enabled: !!deviceId,
    staleTime: 5 * 60 * 1000,
  });
}
