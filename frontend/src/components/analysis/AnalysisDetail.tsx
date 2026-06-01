import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ConfidenceMeter } from './ConfidenceMeter';
import type { Analysis } from '../../types';

interface AnalysisDetailProps {
  /** 分析结果数据 */
  analysis: Analysis;
}

/** 分析级别对应的中文标签 */
const levelLabels: Record<string, string> = {
  L1: 'L1 — 规则匹配',
  L2: 'L2 — 统计分析',
  L3: 'L3 — LLM 深度分析',
};

/** 分析状态对应的中文标签 */
const statusLabels: Record<string, string> = {
  pending: '等待中',
  running: '分析中',
  completed: '已完成',
  failed: '失败',
};

/**
 * 分析详情展开面板组件
 *
 * 展示分析结果的完整信息，包括：
 * - 级别和状态徽章
 * - 置信度仪表盘 + 数据质量评分
 * - 根因分析结论
 * - 建议措施
 */
export function AnalysisDetail({ analysis }: AnalysisDetailProps) {
  return (
    <div className="space-y-4">
      {/* 级别、状态、耗时 */}
      <div className="flex items-center gap-2">
        <Badge variant="outline">{levelLabels[analysis.level] ?? analysis.level}</Badge>
        <Badge variant="outline">{statusLabels[analysis.status] ?? analysis.status}</Badge>
        {analysis.processingTimeMs && (
          <span className="text-xs text-muted-foreground">耗时 {analysis.processingTimeMs}ms</span>
        )}
      </div>

      {/* 置信度仪表盘 */}
      {analysis.confidence != null && (
        <Card>
          <CardContent className="flex items-center gap-6 p-4">
            <ConfidenceMeter confidence={analysis.confidence} size="sm" />
            <div>
              <p className="text-sm font-medium">置信度</p>
              <p className="text-2xl font-bold">{Math.round(analysis.confidence * 100)}%</p>
              {analysis.dataQualityScore != null && (
                <p className="text-xs text-muted-foreground">数据质量评分: {Math.round(analysis.dataQualityScore * 100)}%</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 根因分析 */}
      {analysis.rootCause && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">根因分析</p>
            <p className="text-sm whitespace-pre-wrap">{analysis.rootCause}</p>
          </CardContent>
        </Card>
      )}

      {/* 建议措施 */}
      {analysis.suggestion && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">建议措施</p>
            <p className="text-sm whitespace-pre-wrap">{analysis.suggestion}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
