import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardPenLine, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Textarea } from '../ui/textarea';
import {
  useCreateFmeaEntry,
  useFmeaKnowledgeRuleOptions,
  useUpdateFmeaEntry,
  type CreateFmeaEntryRequest,
  type FmeaEntry,
} from '../../hooks/useFmea';
import { calculateFmeaRpn, getFmeaRpnColor, isValidFmeaRating } from '../../lib/fmeaRisk';

/** FMEA 表单弹窗属性。 */
export interface FmeaFormDialogProps {
  /** 是否显示弹窗。 */
  open: boolean;
  /** 编辑中的条目；null 表示新建。 */
  entry: FmeaEntry | null;
  /** 弹窗开关状态变化回调。 */
  onOpenChange: (open: boolean) => void;
}

/** 表单内部使用字符串保存输入，避免空值被数字控件提前转换。 */
interface FmeaFormValues {
  deviceType: string;
  failureMode: string;
  cause: string;
  effect: string;
  detection: string;
  recommendedAction: string;
  severity: string;
  occurrence: string;
  detectability: string;
  knowledgeRuleId: string;
}

type FmeaFormField = keyof FmeaFormValues;
type FmeaFormErrors = Partial<Record<FmeaFormField, string>>;

/** 与后端 DTO StringLength 约束保持一致。 */
const fmeaFieldMaxLengths = {
  deviceType: 100,
  failureMode: 200,
  cause: 500,
  effect: 500,
  detection: 500,
  recommendedAction: 1000,
} as const;

/** 选择器中的特殊值，用于把可选关联清空为 null。 */
const noKnowledgeRuleValue = '__none__';

const emptyFormValues: FmeaFormValues = {
  deviceType: '',
  failureMode: '',
  cause: '',
  effect: '',
  detection: '',
  recommendedAction: '',
  severity: '',
  occurrence: '',
  detectability: '',
  knowledgeRuleId: '',
};

/** 将 API 条目转换为可编辑的表单值。 */
function toFormValues(entry: FmeaEntry | null): FmeaFormValues {
  if (!entry) return { ...emptyFormValues };

  return {
    deviceType: entry.deviceType,
    failureMode: entry.failureMode,
    cause: entry.cause,
    effect: entry.effect,
    detection: entry.detection,
    recommendedAction: entry.recommendedAction,
    severity: String(entry.severity),
    occurrence: String(entry.occurrence),
    detectability: String(entry.detectability),
    knowledgeRuleId: entry.knowledgeRuleId ?? '',
  };
}

interface FieldErrorProps {
  id: string;
  message?: string;
}

/** 输出与输入控件关联的可访问错误提示。 */
function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

/** 延迟规则选项查询，避免用户输入设备类型时每个字符都触发网络请求。 */
function useDebouncedValue(value: string, delayMs: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debouncedValue;
}

/**
 * FMEA 表单弹窗外壳。
 *
 * 使用打开状态和条目 ID 组成稳定 key，让切换条目时由 React 重新初始化内部草稿，
 * 避免在 effect 中同步 setState 导致级联渲染，也防止不同设备的故障信息串用。
 */
export default function FmeaFormDialog(props: FmeaFormDialogProps) {
  const formKey = `${props.open ? 'open' : 'closed'}-${props.entry?.id ?? 'new'}`;
  return <FmeaFormDialogContent key={formKey} {...props} />;
}

/** FMEA 新建/编辑表单，统一处理风险评分、校验和 API 提交。 */
function FmeaFormDialogContent({ open, entry, onOpenChange }: FmeaFormDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateFmeaEntry();
  const updateMutation = useUpdateFmeaEntry();
  const [values, setValues] = useState<FmeaFormValues>(() => toFormValues(entry));
  const [errors, setErrors] = useState<FmeaFormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const lookupDeviceType = useDebouncedValue(values.deviceType.trim(), 250);
  const knowledgeRuleQuery = useFmeaKnowledgeRuleOptions(
    {
      deviceType: lookupDeviceType || undefined,
      selectedRuleId: entry?.knowledgeRuleId ?? undefined,
    },
    { enabled: open },
  );

  const isPending = createMutation.isPending || updateMutation.isPending;
  const ratingsAreValid = [values.severity, values.occurrence, values.detectability]
    .every(isValidFmeaRating);
  const rpn = ratingsAreValid
    ? calculateFmeaRpn(Number(values.severity), Number(values.occurrence), Number(values.detectability))
    : null;

  /** 更新输入并即时清除该字段的旧错误。 */
  const updateField = (field: FmeaFormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitError(undefined);
  };

  /** 清空本地草稿，确保关闭后再次打开时从当前条目重新初始化。 */
  const resetForm = () => {
    setValues({ ...emptyFormValues });
    setErrors({});
    setSubmitError(undefined);
  };

  /** 校验必填文本和 1-10 的风险评分。 */
  const validate = (): FmeaFormErrors => {
    const nextErrors: FmeaFormErrors = {};
    const requiredTextFields: Array<[
      keyof Pick<FmeaFormValues, 'deviceType' | 'failureMode' | 'cause' | 'effect' | 'detection' | 'recommendedAction'>,
      string,
      string,
      number,
    ]> = [
      ['deviceType', 'fmea.deviceTypeRequired', 'fmea.deviceTypeTooLong', fmeaFieldMaxLengths.deviceType],
      ['failureMode', 'fmea.failureModeRequired', 'fmea.failureModeTooLong', fmeaFieldMaxLengths.failureMode],
      ['cause', 'fmea.causeRequired', 'fmea.causeTooLong', fmeaFieldMaxLengths.cause],
      ['effect', 'fmea.effectRequired', 'fmea.effectTooLong', fmeaFieldMaxLengths.effect],
      ['detection', 'fmea.detectionRequired', 'fmea.detectionTooLong', fmeaFieldMaxLengths.detection],
      ['recommendedAction', 'fmea.recommendedActionRequired', 'fmea.recommendedActionTooLong', fmeaFieldMaxLengths.recommendedAction],
    ];

    requiredTextFields.forEach(([field, requiredMessageKey, tooLongMessageKey, maxLength]) => {
      const value = values[field].trim();
      if (!value) {
        nextErrors[field] = t(requiredMessageKey);
      } else if (value.length > maxLength) {
        nextErrors[field] = t(tooLongMessageKey);
      }
    });

    const ratingFields: Array<[keyof Pick<FmeaFormValues, 'severity' | 'occurrence' | 'detectability'>, string]> = [
      ['severity', 'fmea.severityRequired'],
      ['occurrence', 'fmea.occurrenceRequired'],
      ['detectability', 'fmea.detectabilityRequired'],
    ];

    ratingFields.forEach(([field, requiredMessageKey]) => {
      if (!isValidFmeaRating(values[field])) {
        nextErrors[field] = values[field].trim() ? t('fmea.ratingInvalid') : t(requiredMessageKey);
      }
    });

    return nextErrors;
  };

  /** 组装租户安全的 FMEA 请求，空的可选规则 ID 不发送。 */
  const buildRequest = (): CreateFmeaEntryRequest => {
    const request: CreateFmeaEntryRequest = {
      deviceType: values.deviceType.trim(),
      failureMode: values.failureMode.trim(),
      cause: values.cause.trim(),
      effect: values.effect.trim(),
      detection: values.detection.trim(),
      recommendedAction: values.recommendedAction.trim(),
      severity: Number(values.severity),
      occurrence: Number(values.occurrence),
      detectability: Number(values.detectability),
    };
    const knowledgeRuleId = values.knowledgeRuleId.trim();
    if (knowledgeRuleId) request.knowledgeRuleId = knowledgeRuleId;
    return request;
  };

  /** 提交新建或编辑请求；失败时保留当前草稿供用户修正重试。 */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(undefined);
    if (Object.keys(nextErrors).length > 0) return;

    const request = buildRequest();
    try {
      if (entry) {
        await updateMutation.mutateAsync({ id: entry.id, request });
      } else {
        await createMutation.mutateAsync(request);
      }
      resetForm();
      onOpenChange(false);
    } catch {
      setSubmitError(t('fmea.submitFailed'));
    }
  };

  /** 关闭时清理草稿，再通知父页面收起弹窗。 */
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent closeLabel={t('common.close')} className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPenLine className="h-5 w-5" />
            {t(entry ? 'fmea.edit' : 'fmea.create')}
          </DialogTitle>
          <DialogDescription>{t('fmea.formDescription')}</DialogDescription>
        </DialogHeader>

        {submitError && (
          <div role="alert" aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <section aria-labelledby="fmea-failure-info-title" className="space-y-4">
            <h2 id="fmea-failure-info-title" className="text-sm font-semibold">
              {t('fmea.failureInfo')}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fmea-device-type">{t('fmea.deviceType')}</Label>
                <Input
                  id="fmea-device-type"
                  maxLength={fmeaFieldMaxLengths.deviceType}
                  value={values.deviceType}
                  onChange={(event) => updateField('deviceType', event.target.value)}
                  aria-invalid={errors.deviceType ? 'true' : undefined}
                  aria-describedby={errors.deviceType ? 'fmea-device-type-error' : undefined}
                  autoComplete="off"
                />
                <FieldError id="fmea-device-type-error" message={errors.deviceType} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fmea-failure-mode">{t('fmea.failureMode')}</Label>
                <Input
                  id="fmea-failure-mode"
                  maxLength={fmeaFieldMaxLengths.failureMode}
                  value={values.failureMode}
                  onChange={(event) => updateField('failureMode', event.target.value)}
                  aria-invalid={errors.failureMode ? 'true' : undefined}
                  aria-describedby={errors.failureMode ? 'fmea-failure-mode-error' : undefined}
                  autoComplete="off"
                />
                <FieldError id="fmea-failure-mode-error" message={errors.failureMode} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fmea-cause">{t('fmea.cause')}</Label>
                <Textarea
                  id="fmea-cause"
                  maxLength={fmeaFieldMaxLengths.cause}
                  rows={3}
                  value={values.cause}
                  onChange={(event) => updateField('cause', event.target.value)}
                  aria-invalid={errors.cause ? 'true' : undefined}
                  aria-describedby={errors.cause ? 'fmea-cause-error' : undefined}
                />
                <FieldError id="fmea-cause-error" message={errors.cause} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fmea-effect">{t('fmea.effect')}</Label>
                <Textarea
                  id="fmea-effect"
                  maxLength={fmeaFieldMaxLengths.effect}
                  rows={3}
                  value={values.effect}
                  onChange={(event) => updateField('effect', event.target.value)}
                  aria-invalid={errors.effect ? 'true' : undefined}
                  aria-describedby={errors.effect ? 'fmea-effect-error' : undefined}
                />
                <FieldError id="fmea-effect-error" message={errors.effect} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fmea-detection">{t('fmea.detection')}</Label>
                <Textarea
                  id="fmea-detection"
                  maxLength={fmeaFieldMaxLengths.detection}
                  rows={3}
                  value={values.detection}
                  onChange={(event) => updateField('detection', event.target.value)}
                  aria-invalid={errors.detection ? 'true' : undefined}
                  aria-describedby={errors.detection ? 'fmea-detection-error' : undefined}
                />
                <FieldError id="fmea-detection-error" message={errors.detection} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fmea-recommended-action">{t('fmea.recommendedAction')}</Label>
                <Textarea
                  id="fmea-recommended-action"
                  maxLength={fmeaFieldMaxLengths.recommendedAction}
                  rows={3}
                  value={values.recommendedAction}
                  onChange={(event) => updateField('recommendedAction', event.target.value)}
                  aria-invalid={errors.recommendedAction ? 'true' : undefined}
                  aria-describedby={errors.recommendedAction ? 'fmea-recommended-action-error' : undefined}
                />
                <FieldError id="fmea-recommended-action-error" message={errors.recommendedAction} />
              </div>
            </div>
          </section>

          <section aria-labelledby="fmea-risk-score-title" className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="fmea-risk-score-title" className="text-sm font-semibold">
                  {t('fmea.riskScore')}
                </h2>
                <p className="text-xs text-muted-foreground">{t('fmea.riskScoreDescription')}</p>
              </div>
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <span>{t('fmea.rpnPreview')}: {rpn ?? '—'}</span>
                {rpn !== null && <Badge className={getFmeaRpnColor(rpn)}>{rpn}</Badge>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="fmea-severity">{t('fmea.severity')}</Label>
                <Input
                  id="fmea-severity"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  inputMode="numeric"
                  value={values.severity}
                  onChange={(event) => updateField('severity', event.target.value)}
                  aria-invalid={errors.severity ? 'true' : undefined}
                  aria-describedby={errors.severity ? 'fmea-severity-error' : undefined}
                />
                <FieldError id="fmea-severity-error" message={errors.severity} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fmea-occurrence">{t('fmea.occurrence')}</Label>
                <Input
                  id="fmea-occurrence"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  inputMode="numeric"
                  value={values.occurrence}
                  onChange={(event) => updateField('occurrence', event.target.value)}
                  aria-invalid={errors.occurrence ? 'true' : undefined}
                  aria-describedby={errors.occurrence ? 'fmea-occurrence-error' : undefined}
                />
                <FieldError id="fmea-occurrence-error" message={errors.occurrence} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fmea-detectability">{t('fmea.detectability')}</Label>
                <Input
                  id="fmea-detectability"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  inputMode="numeric"
                  value={values.detectability}
                  onChange={(event) => updateField('detectability', event.target.value)}
                  aria-invalid={errors.detectability ? 'true' : undefined}
                  aria-describedby={errors.detectability ? 'fmea-detectability-error' : undefined}
                />
                <FieldError id="fmea-detectability-error" message={errors.detectability} />
              </div>
            </div>
          </section>

          <div className="space-y-2">
            <Label htmlFor="fmea-knowledge-rule-id">{t('fmea.knowledgeRuleId')}</Label>
            <Select
              value={values.knowledgeRuleId || noKnowledgeRuleValue}
              onValueChange={(value) => {
                if (value == null) return;
                updateField(
                  'knowledgeRuleId',
                  String(value) === noKnowledgeRuleValue ? '' : String(value),
                );
              }}
            >
              <SelectTrigger id="fmea-knowledge-rule-id" className="w-full">
                <SelectValue placeholder={t('fmea.knowledgeRulePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noKnowledgeRuleValue}>
                  {t('fmea.noKnowledgeRule')}
                </SelectItem>
                {knowledgeRuleQuery.data?.map((rule) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.name} · {rule.deviceType}
                    {rule.isSystemPreset ? ` · ${t('fmea.systemPreset')}` : ''}
                    {!rule.enabled ? ` · ${t('fmea.disabledRule')}` : ''}
                  </SelectItem>
                ))}
                {values.knowledgeRuleId
                  && !knowledgeRuleQuery.data?.some((rule) => rule.id === values.knowledgeRuleId)
                  && (
                    <SelectItem value={values.knowledgeRuleId}>
                      {t('fmea.unavailableSelectedRule')}
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {knowledgeRuleQuery.isLoading
                ? t('fmea.knowledgeRuleLoading')
                : knowledgeRuleQuery.isError
                  ? t('fmea.knowledgeRuleLoadFailed')
                  : t('fmea.knowledgeRuleHint')}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
