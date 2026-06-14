import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface TrendAnalysisResult {
  deviceId: string;
  metric: string;
  currentValue: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
  trendSlope: number;
  changeRatePercent: number;
  threshold: number | null;
  daysToThreshold: number | null;
  willExceedThreshold: boolean;
  trendDirection: string;
  dataPoints: number;
  analyzedAt: string;
}

/** 分析指定设备的指定指标趋势 */
export function useTrendAnalysis(deviceId: string | null, metric: string | null) {
  return useQuery({
    queryKey: ['trend-analysis', deviceId, metric],
    queryFn: async () => {
      const { data } = await api.get<TrendAnalysisResult>(`/trend-analysis/${deviceId}/${metric}`);
      return data;
    },
    enabled: !!deviceId && !!metric,
  });
}

/** 获取所有趋势预警（7天内会超阈值的） */
export function useTrendWarnings() {
  return useQuery({
    queryKey: ['trend-analysis', 'warnings'],
    queryFn: async () => {
      const { data } = await api.get<TrendAnalysisResult[]>('/trend-analysis/warnings');
      return data;
    },
    staleTime: 60_000,
  });
}
