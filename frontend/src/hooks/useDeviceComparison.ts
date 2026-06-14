import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface DeviceMetricSummary {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  averageValue: number;
  minValue: number;
  maxValue: number;
  latestValue: number;
  dataPointCount: number;
  zScore: number;
  isOutlier: boolean;
}

export interface DeviceComparisonResult {
  deviceType: string;
  metric: string;
  hours: number;
  groupMean: number;
  groupStdDev: number;
  devices: DeviceMetricSummary[];
  message: string | null;
}

export function useDeviceComparison(params: {
  deviceType?: string;
  metric?: string;
  hours?: number;
}) {
  return useQuery({
    queryKey: ['device-comparison', params],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.deviceType) search.set('deviceType', params.deviceType);
      if (params.metric) search.set('metric', params.metric);
      if (params.hours) search.set('hours', String(params.hours));
      const { data } = await api.get<DeviceComparisonResult>(`/device-comparison?${search}`);
      return data;
    },
    enabled: !!params.deviceType && !!params.metric,
  });
}
