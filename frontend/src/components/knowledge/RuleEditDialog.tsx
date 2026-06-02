import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { useUpdateKnowledgeRule } from '../../hooks/useKnowledge';
import ConditionEditor, { parseConditions, serializeConditions } from './ConditionEditor';
import type { KnowledgeRule, ConditionItem, UpdateKnowledgeRuleRequest } from '../../types';

/** 规则编辑对话框属性 */
interface RuleEditDialogProps {
  /** 要编辑的规则（null 表示关闭） */
  rule: KnowledgeRule | null;
  /** 对话框关闭回调 */
  onClose: () => void;
}

/**
 * 规则编辑对话框组件
 *
 * 使用 shadcn/ui Dialog，打开时从 rule 属性初始化表单。
 * 提交时仅发送变更过的字段，附带变更说明。
 */
export default function RuleEditDialog({ rule, onClose }: RuleEditDialogProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateKnowledgeRule();
  const isOpen = rule !== null;

  // 表单状态
  const [name, setName] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [conditions, setConditions] = useState('');
  const [structuredConditions, setStructuredConditions] = useState<ConditionItem[]>([]);
  const [conclusion, setConclusion] = useState('');
  const [recommendedActions, setRecommendedActions] = useState('');
  const [checkSteps, setCheckSteps] = useState('');
  const [confidenceWeight, setConfidenceWeight] = useState(0.8);
  const [changeSummary, setChangeSummary] = useState('');
  /** 是否使用结构化条件编辑器 */
  const [useStructured, setUseStructured] = useState(false);

  /** 当 rule 变化时初始化表单 */
  useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDeviceType(rule.deviceType);
      setConditions(rule.conditions);
      setConclusion(rule.conclusion);
      setRecommendedActions(rule.recommendedActions ?? '');
      setCheckSteps(rule.checkSteps ?? '');
      setConfidenceWeight(rule.confidenceWeight);
      setChangeSummary('');

      // 尝试解析为结构化条件
      const parsed = parseConditions(rule.conditions);
      if (parsed.length > 0) {
        setStructuredConditions(parsed);
        setUseStructured(true);
      } else {
        setStructuredConditions([]);
        setUseStructured(false);
      }
    }
  }, [rule]);

  /** 结构化条件变更处理 */
  const handleStructuredChange = useCallback(
    (newConditions: ConditionItem[]) => {
      setStructuredConditions(newConditions);
      setConditions(serializeConditions(newConditions));
    },
    [],
  );

  /** 提交表单 */
  const handleSubmit = () => {
    if (!rule) return;

    // 构造变更请求，仅发送有变化的字段
    const request: UpdateKnowledgeRuleRequest = {};
    let hasChanges = false;

    if (name !== rule.name) { request.name = name; hasChanges = true; }
    if (deviceType !== rule.deviceType) { request.deviceType = deviceType; hasChanges = true; }
    if (conditions !== rule.conditions) { request.conditions = conditions; hasChanges = true; }
    if (conclusion !== rule.conclusion) { request.conclusion = conclusion; hasChanges = true; }
    if (recommendedActions !== (rule.recommendedActions ?? '')) { request.recommendedActions = recommendedActions; hasChanges = true; }
    if (checkSteps !== (rule.checkSteps ?? '')) { request.checkSteps = checkSteps; hasChanges = true; }
    if (confidenceWeight !== rule.confidenceWeight) { request.confidenceWeight = confidenceWeight; hasChanges = true; }

    if (changeSummary) {
      request.changeSummary = changeSummary;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    updateMutation.mutate(
      { id: rule.id, ...request },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            {t('knowledge.editDialog.title')}
          </DialogTitle>
          <DialogDescription>{t('knowledge.editDialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 规则名称 */}
          <div className="space-y-2">
            <Label>{t('knowledge.editDialog.ruleName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* 设备类型 */}
          <div className="space-y-2">
            <Label>{t('knowledge.editDialog.deviceType')}</Label>
            <Input value={deviceType} onChange={(e) => setDeviceType(e.target.value)} />
          </div>

          {/* 触发条件 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('knowledge.editDialog.conditions')}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUseStructured(!useStructured)}
                className="text-xs"
              >
                {useStructured
                  ? t('knowledge.editDialog.switchToText')
                  : t('knowledge.editDialog.switchToStructured')}
              </Button>
            </div>
            {useStructured ? (
              <ConditionEditor
                conditions={structuredConditions}
                onChange={handleStructuredChange}
              />
            ) : (
              <Textarea
                rows={3}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
            )}
          </div>

          {/* 结论 */}
          <div className="space-y-2">
            <Label>{t('knowledge.editDialog.conclusion')}</Label>
            <Textarea
              rows={3}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
            />
          </div>

          {/* 推荐措施 */}
          <div className="space-y-2">
            <Label>{t('knowledge.editDialog.recommendedActions')}</Label>
            <Textarea
              rows={3}
              value={recommendedActions}
              onChange={(e) => setRecommendedActions(e.target.value)}
            />
          </div>

          {/* 检查步骤 */}
          <div className="space-y-2">
            <Label>{t('knowledge.editDialog.checkSteps')}</Label>
            <Textarea
              rows={3}
              value={checkSteps}
              onChange={(e) => setCheckSteps(e.target.value)}
            />
          </div>

          {/* 置信度权重 */}
          <div className="space-y-2">
            <Label>{t('knowledge.editDialog.confidenceWeight')}</Label>
            <div className="flex items-center gap-3">
              <Input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={confidenceWeight}
                onChange={(e) => setConfidenceWeight(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12 text-right">
                {(confidenceWeight * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* 变更说明 */}
          <div className="space-y-2">
            <Label>{t('knowledge.editDialog.changeSummary')}</Label>
            <Input
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder={t('knowledge.editDialog.changeSummaryPlaceholder')}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
