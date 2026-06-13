import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/** 按故障类型分类的统计 */
export interface FaultTypeStat {
  faultType: string;
  total: number;
  hit: number;
  missed: number;
}

/** 单条故障的评估详情 */
export interface EvaluationDetail {
  faultType: string;
  expectedRootCause: string;
  aiRootCause?: string;
  analysisLevel?: number;
  confidence?: number;
  /** true=命中, false=有分析但不匹配, null=无分析（漏报） */
  matched: boolean | null;
  injectedAt: string;
}

/** 评估结果 */
export interface EvaluationResult {
  totalFaults: number;
  matchedCount: number;
  mismatchedCount: number;
  missedCount: number;
  hitRate: number;
  byFaultType: FaultTypeStat[];
  details: EvaluationDetail[];
}

/**
 * AI 诊断评估查询 Hook
 *
 * 查询 ground truth 与 analyses 表的对比结果。
 * 不传 runId 时评估全部批次。
 */
export function useEvaluation(runId?: string) {
  return useQuery({
    queryKey: ['evaluation', runId],
    queryFn: async () => {
      const params = runId ? `?runId=${encodeURIComponent(runId)}` : '';
      const { data } = await api.get<EvaluationResult>(`/evaluation/result${params}`);
      return data;
    },
    // 评估数据非高频变化，5 分钟刷新一次
    staleTime: 5 * 60 * 1000,
  });
}
