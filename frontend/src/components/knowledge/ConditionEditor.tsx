/* eslint-disable react-refresh/only-export-components */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { ConditionItem } from '../../types';

/** 支持的运算符列表 */
const OPERATORS = ['>', '>=', '<', '<=', '==', '!='] as const;

/**
 * 解析 JSON 条件字符串为条件项数组
 *
 * 如果 JSON 解析失败或格式不符，返回空数组。
 */
export function parseConditions(json: string): ConditionItem[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ConditionItem =>
        typeof item === 'object' &&
        typeof item.metric === 'string' &&
        typeof item.operator === 'string' &&
        typeof item.threshold === 'number',
    );
  } catch {
    return [];
  }
}

/**
 * 将条件项数组序列化为 JSON 字符串
 */
export function serializeConditions(conditions: ConditionItem[]): string {
  return JSON.stringify(conditions, null, 2);
}

/** 条件编辑器属性 */
interface ConditionEditorProps {
  /** 当前条件列表 */
  conditions: ConditionItem[];
  /** 条件变更回调 */
  onChange: (conditions: ConditionItem[]) => void;
}

/**
 * 条件编辑器组件
 *
 * 将 JSON 条件数组转换为可编辑的表单字段，每个条件包含指标名、运算符和阈值。
 * 支持动态增删条件行。
 */
export default function ConditionEditor({ conditions, onChange }: ConditionEditorProps) {
  const { t } = useTranslation();

  /** 添加一个空条件行 */
  const handleAdd = useCallback(() => {
    onChange([...conditions, { metric: '', operator: '>', threshold: 0 }]);
  }, [conditions, onChange]);

  /** 删除指定索引的条件行 */
  const handleRemove = useCallback(
    (index: number) => {
      onChange(conditions.filter((_, i) => i !== index));
    },
    [conditions, onChange],
  );

  /** 更新指定索引条件的某个字段 */
  const handleUpdate = useCallback(
    (index: number, field: keyof ConditionItem, value: string | number) => {
      const updated = conditions.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      );
      onChange(updated);
    },
    [conditions, onChange],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{t('knowledge.conditionEditor.title')}</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          {t('knowledge.conditionEditor.addCondition')}
        </Button>
      </div>

      {conditions.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          {t('knowledge.conditionEditor.emptyHint')}
        </p>
      )}

      {conditions.map((condition, index) => (
        <div key={index} className="flex items-center gap-2">
          {/* 指标名称 */}
          <Input
            className="flex-1"
            placeholder={t('knowledge.conditionEditor.metricPlaceholder')}
            value={condition.metric}
            onChange={(e) => handleUpdate(index, 'metric', e.target.value)}
          />

          {/* 运算符选择 */}
          <Select
            value={condition.operator}
            onValueChange={(val) => handleUpdate(index, 'operator', val ?? '>')}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 阈值 */}
          <Input
            className="w-24"
            type="number"
            placeholder={t('knowledge.conditionEditor.thresholdPlaceholder')}
            value={condition.threshold}
            onChange={(e) => handleUpdate(index, 'threshold', Number(e.target.value))}
          />

          {/* 删除按钮 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemove(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
