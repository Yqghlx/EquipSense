import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { useDeviceTemplates, useQuickRegister } from '../../hooks/useDeviceConfig';
import { parseTemplateArray, type JsonRecord } from '../../lib/deviceTemplatePreview';
import type { QuickRegisterRequest } from '../../types';

interface DeviceQuickRegisterDialogProps {
  /** 是否打开快速注册弹窗。 */
  open: boolean;
  /** 弹窗开关状态变化回调。 */
  onOpenChange: (open: boolean) => void;
}

interface FormErrors {
  template?: boolean;
  deviceCode?: boolean;
  name?: boolean;
}

/** 从动态 JSON 字段中读取非空文本。 */
function readString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/** 从动态 JSON 字段中读取有限数字。 */
function readNumber(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** 读取模板字段中的规则数组，兼容直接数组和带 rules 包装的 JSON。 */
function readRules(value: unknown): readonly JsonRecord[] {
  const directRules = parseTemplateArray(value, 'defaultAlarmRules');
  return directRules.length > 0 ? directRules : parseTemplateArray(value, 'rules');
}

/** 从 Axios/Fetch 风格异常中提取后端错误编码。 */
function readApiErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const response = (error as { response?: unknown }).response;
  if (typeof response !== 'object' || response === null) return undefined;
  const data = (response as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) return undefined;
  const code = (data as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * 模板驱动的设备快速注册弹窗。
 *
 * 预览数据只用于帮助现场确认；提交时仅发送模板 ID、设备档案和显式的规则开关，
 * 由服务端重新读取模板并在事务内创建设备与告警规则，避免客户端篡改模板配置。
 */
export function DeviceQuickRegisterDialog({ open, onOpenChange }: DeviceQuickRegisterDialogProps) {
  const { t } = useTranslation();
  const templatesQuery = useDeviceTemplates();
  const quickRegister = useQuickRegister();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [deviceCode, setDeviceCode] = useState('');
  const [name, setName] = useState('');
  const [applyRules, setApplyRules] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();

  const templates = templatesQuery.data ?? [];
  const effectiveTemplateId = selectedTemplateId || templates[0]?.id || '';
  const selectedTemplate = templates.find((template) => template.id === effectiveTemplateId) ?? templates[0];
  const metrics = selectedTemplate ? parseTemplateArray(selectedTemplate.parameters, 'metrics') : [];
  const rules = selectedTemplate ? readRules(selectedTemplate.defaultAlarmRules) : [];

  /** 清空当前输入，避免关闭后再次打开时残留上一次的设备身份。 */
  const resetForm = () => {
    setSelectedTemplateId('');
    setDeviceCode('');
    setName('');
    setApplyRules(false);
    setErrors({});
    setSubmitError(undefined);
  };

  /** 处理弹窗开关，同时在关闭时清理未提交的草稿。 */
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  /** 提交模板注册契约，服务端负责重新解析模板和创建关联规则。 */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FormErrors = {
      template: !effectiveTemplateId,
      deviceCode: !deviceCode.trim(),
      name: !name.trim(),
    };
    setErrors(nextErrors);
    setSubmitError(undefined);

    if (nextErrors.template || nextErrors.deviceCode || nextErrors.name) return;

    const request: QuickRegisterRequest = {
      templateId: effectiveTemplateId,
      deviceCode: deviceCode.trim(),
      name: name.trim(),
      applyDefaultAlarmRules: applyRules,
    };

    try {
      await quickRegister.mutateAsync(request);
      toast.success(t('device.quickRegister.submitSuccess'));
      resetForm();
      onOpenChange(false);
    } catch (error: unknown) {
      const errorCode = readApiErrorCode(error);
      if (errorCode === 'DUPLICATE_CODE') {
        setSubmitError(t('device.quickRegister.duplicateCode'));
      } else if (errorCode === 'TEMPLATE_NOT_FOUND') {
        setSubmitError(t('device.quickRegister.templateNotFound'));
      } else if (errorCode === 'TEMPLATE_RULES_INVALID') {
        setSubmitError(t('device.quickRegister.templateRulesInvalid'));
      } else {
        setSubmitError(t('device.quickRegister.submitFailed'));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('device.quickRegister.title')}</DialogTitle>
          <DialogDescription>{t('device.quickRegister.description')}</DialogDescription>
        </DialogHeader>

        {templatesQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('device.quickRegister.loadingTemplates')}
          </div>
        ) : templatesQuery.isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <p className="text-sm text-muted-foreground">{t('device.quickRegister.loadFailed')}</p>
              <Button variant="outline" size="sm" onClick={() => templatesQuery.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('device.quickRegister.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t('device.quickRegister.noTemplates')}
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="quick-register-template">{t('device.quickRegister.template')}</Label>
                <Select
                  value={effectiveTemplateId}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedTemplateId(value);
                      setErrors((current) => ({ ...current, template: false }));
                      setSubmitError(undefined);
                    }
                  }}
                >
                  <SelectTrigger
                    id="quick-register-template"
                    aria-invalid={errors.template ? 'true' : undefined}
                    aria-describedby={errors.template ? 'quick-register-template-error' : undefined}
                    className="w-full"
                  >
                    <SelectValue placeholder={t('device.quickRegister.templatePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}{template.industry ? ` · ${template.industry}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.template && (
                  <p id="quick-register-template-error" role="alert" className="text-sm text-destructive">
                    {t('device.quickRegister.templateRequired')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-register-device-code">{t('device.quickRegister.deviceCode')}</Label>
                <Input
                  id="quick-register-device-code"
                  value={deviceCode}
                  onChange={(event) => {
                    setDeviceCode(event.target.value);
                    setErrors((current) => ({ ...current, deviceCode: false }));
                    setSubmitError(undefined);
                  }}
                  placeholder={t('device.quickRegister.deviceCodePlaceholder')}
                  aria-invalid={errors.deviceCode ? 'true' : undefined}
                  aria-describedby={errors.deviceCode ? 'quick-register-device-code-error' : undefined}
                  autoComplete="off"
                />
                {errors.deviceCode && (
                  <p id="quick-register-device-code-error" role="alert" className="text-sm text-destructive">
                    {t('device.quickRegister.deviceCodeRequired')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quick-register-name">{t('device.quickRegister.name')}</Label>
                <Input
                  id="quick-register-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setErrors((current) => ({ ...current, name: false }));
                    setSubmitError(undefined);
                  }}
                  placeholder={t('device.quickRegister.namePlaceholder')}
                  aria-invalid={errors.name ? 'true' : undefined}
                  aria-describedby={errors.name ? 'quick-register-name-error' : undefined}
                  autoComplete="off"
                />
                {errors.name && (
                  <p id="quick-register-name-error" role="alert" className="text-sm text-destructive">
                    {t('device.quickRegister.nameRequired')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{t('device.quickRegister.metrics')}</CardTitle>
                  <CardDescription>{selectedTemplate?.name ?? '-'}</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('device.quickRegister.noMetrics')}</p>
                  ) : (
                    <div className="space-y-2">
                      {metrics.map((metric, index) => {
                        const label = readString(metric, 'displayName') ?? readString(metric, 'name') ?? `Metric ${index + 1}`;
                        const nameValue = readString(metric, 'name');
                        const unit = readString(metric, 'unit');
                        const range = metric.range;
                        const rangeRecord = typeof range === 'object' && range !== null && !Array.isArray(range)
                          ? range as JsonRecord
                          : undefined;
                        const min = rangeRecord ? readNumber(rangeRecord, 'min') : undefined;
                        const max = rangeRecord ? readNumber(rangeRecord, 'max') : undefined;
                        return (
                          <div key={`${nameValue ?? label}-${index}`} className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{label}</p>
                              {nameValue && nameValue !== label && <p className="truncate text-xs text-muted-foreground">{nameValue}</p>}
                            </div>
                            <span className="shrink-0 text-right text-xs text-muted-foreground">
                              {unit ?? '-'}{min !== undefined && max !== undefined ? ` · ${min}–${max}` : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>{t('device.quickRegister.recommendedRules')}</CardTitle>
                  <CardDescription>{t('device.quickRegister.rulesDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {rules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('device.quickRegister.noRules')}</p>
                  ) : (
                    <div className="space-y-2">
                      {rules.map((rule, index) => {
                        const ruleName = readString(rule, 'name') ?? readString(rule, 'metric') ?? `Rule ${index + 1}`;
                        const metric = readString(rule, 'metric');
                        const operator = readString(rule, 'operator') ?? '>';
                        const threshold = readNumber(rule, 'threshold');
                        const severity = readString(rule, 'severity');
                        return (
                          <div key={`${ruleName}-${index}`} className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{ruleName}</p>
                              <p className="text-xs text-muted-foreground">
                                {metric ?? '-'} {operator} {threshold ?? '-'}
                              </p>
                            </div>
                            {severity && <Badge variant="outline">{severity}</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3 rounded-xl border border-amber-300/70 bg-amber-50/70 p-4 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/20 dark:text-amber-100">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="quick-register-apply-rules">{t('device.quickRegister.applyRules')}</Label>
                  <p className="text-xs text-amber-800/80 dark:text-amber-200/80">{t('device.quickRegister.applyRulesDescription')}</p>
                </div>
                <Switch
                  id="quick-register-apply-rules"
                  checked={applyRules}
                  onCheckedChange={setApplyRules}
                  aria-label={t('device.quickRegister.applyRules')}
                />
              </div>
              <p className="text-sm font-medium">{t('device.quickRegister.processWarning')}</p>
            </div>

            {submitError && (
              <p role="alert" aria-live="polite" className="text-sm text-destructive">
                {submitError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={quickRegister.isPending}>
                {quickRegister.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {quickRegister.isPending ? t('common.loading') : t('device.quickRegister.submit')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
