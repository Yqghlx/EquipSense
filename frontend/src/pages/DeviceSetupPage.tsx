import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Cpu } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useDeviceTemplates, useQuickRegister } from '../hooks/useDeviceConfig';
import { useAuthStore } from '../stores/authStore';
import type { DeviceTypeTemplate } from '../types';

/** 向导步骤枚举 */
type WizardStep = 'selectType' | 'basicInfo' | 'alertRules';

/** 告警规则表单行 */
interface AlertRuleRow {
  metric: string;
  threshold: number;
  severity: string;
}

/**
 * 设备配置向导页面
 *
 * 三步式引导流程：
 * 1. 选择设备类型 — 从模板列表中选择或跳过
 * 2. 设备基本信息 — 填写编码、名称等
 * 3. 告警规则配置 — 配置默认告警规则（可选）
 */
export default function DeviceSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const quickRegister = useQuickRegister();

  /** 向导当前步骤 */
  const [step, setStep] = useState<WizardStep>('selectType');
  /** 选中的设备类型模板 */
  const [selectedTemplate, setSelectedTemplate] = useState<DeviceTypeTemplate | null>(null);
  /** 行业筛选 */
  const [industryFilter, setIndustryFilter] = useState<string>('');
  /** 设备基本信息 */
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  /** 告警规则列表 */
  const [alertRules, setAlertRules] = useState<AlertRuleRow[]>([]);
  /** 提交中的错误信息 */
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: templates, isLoading: templatesLoading } = useDeviceTemplates(industryFilter || undefined);

  // =========================================================================
  // 步骤导航
  // =========================================================================

  const steps: { key: WizardStep; label: string; index: number }[] = [
    { key: 'selectType', label: t('deviceSetup.stepSelectType'), index: 0 },
    { key: 'basicInfo', label: t('deviceSetup.stepBasicInfo'), index: 1 },
    { key: 'alertRules', label: t('deviceSetup.stepAlertRules'), index: 2 },
  ];

  const currentStepIndex = steps.find((s) => s.key === step)!.index;

  /** 前进到下一步 */
  const goNext = () => {
    if (step === 'selectType') setStep('basicInfo');
    else if (step === 'basicInfo') setStep('alertRules');
  };

  /** 后退到上一步 */
  const goBack = () => {
    if (step === 'alertRules') setStep('basicInfo');
    else if (step === 'basicInfo') setStep('selectType');
  };

  // =========================================================================
  // 表单验证
  // =========================================================================

  /** 当前步骤是否可以继续 */
  const canProceed = (): boolean => {
    if (step === 'selectType') return true; // 选择设备类型是可选的
    if (step === 'basicInfo') return deviceCode.trim().length > 0;
    return true; // 告警规则可选
  };

  // =========================================================================
  // 告警规则增删
  // =========================================================================

  /** 添加一条空告警规则 */
  const addAlertRule = () => {
    setAlertRules((prev) => [...prev, { metric: '', threshold: 0, severity: 'High' }]);
  };

  /** 删除指定索引的告警规则 */
  const removeAlertRule = (index: number) => {
    setAlertRules((prev) => prev.filter((_, i) => i !== index));
  };

  /** 更新指定索引的告警规则字段 */
  const updateAlertRule = (index: number, field: keyof AlertRuleRow, value: string | number) => {
    setAlertRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule)),
    );
  };

  // =========================================================================
  // 提交注册
  // =========================================================================

  /** 提交快速注册请求 */
  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await quickRegister.mutateAsync({
        tenantId: user?.id ? (JSON.parse(localStorage.getItem('user') || '{}') as { tenantId?: string }).tenantId ?? '' : '',
        deviceCode: deviceCode.trim(),
        name: deviceName.trim() || undefined,
        deviceType: selectedTemplate?.name || undefined,
        defaultAlertRules: alertRules.filter((r) => r.metric.trim().length > 0).map((r) => ({
          metric: r.metric,
          threshold: r.threshold,
          severity: r.severity,
        })),
      });
      navigate('/devices');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('common.error');
      setSubmitError(message);
    }
  };

  // =========================================================================
  // 渲染：步骤进度指示器
  // =========================================================================

  const renderStepper = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, idx) => (
        <div key={s.key} className="flex items-center gap-2">
          {/* 步骤圆圈 */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
              idx < currentStepIndex
                ? 'bg-primary text-primary-foreground'
                : idx === currentStepIndex
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {idx < currentStepIndex ? <Check className="h-4 w-4" /> : idx + 1}
          </div>
          {/* 步骤标签 */}
          <span className={`text-sm ${idx === currentStepIndex ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
            {s.label}
          </span>
          {/* 连接线（最后一步不显示） */}
          {idx < steps.length - 1 && <div className="w-12 h-0.5 bg-muted mx-2" />}
        </div>
      ))}
    </div>
  );

  // =========================================================================
  // 渲染：步骤1 — 选择设备类型
  // =========================================================================

  const renderSelectType = () => (
    <div className="space-y-6">
      {/* 行业筛选 */}
      <div className="flex items-center gap-4">
        <Label className="whitespace-nowrap">{t('deviceSetup.industryFilter')}</Label>
        <Select value={industryFilter} onValueChange={(v) => { if (v != null) setIndustryFilter(v === '__all__' ? '' : v); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('deviceSetup.allIndustries')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t('deviceSetup.allIndustries')}</SelectItem>
            <SelectItem value="manufacturing">{t('deviceSetup.industryManufacturing')}</SelectItem>
            <SelectItem value="energy">{t('deviceSetup.industryEnergy')}</SelectItem>
            <SelectItem value="chemical">{t('deviceSetup.industryChemical')}</SelectItem>
            <SelectItem value="logistics">{t('deviceSetup.industryLogistics')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 模板卡片列表 */}
      {templatesLoading ? (
        <div className="py-16 text-center text-muted-foreground">{t('common.loading')}</div>
      ) : !templates || templates.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t('common.noData')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <Card
              key={tmpl.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate?.id === tmpl.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTemplate(selectedTemplate?.id === tmpl.id ? null : tmpl)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{tmpl.name}</CardTitle>
                </div>
                {tmpl.industry && (
                  <CardDescription>
                    <Badge variant="secondary" className="text-xs">{tmpl.industry}</Badge>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {tmpl.parameters && Object.keys(tmpl.parameters).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('deviceSetup.parametersCount', { count: Object.keys(tmpl.parameters).length })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 选中提示 */}
      <p className="text-sm text-muted-foreground text-center">
        {selectedTemplate
          ? t('deviceSetup.selectedTemplate', { name: selectedTemplate.name })
          : t('deviceSetup.noTemplateSelected')}
      </p>
    </div>
  );

  // =========================================================================
  // 渲染：步骤2 — 设备基本信息
  // =========================================================================

  const renderBasicInfo = () => (
    <div className="max-w-md mx-auto space-y-6">
      {/* 如果已选模板，显示模板信息 */}
      {selectedTemplate && (
        <div className="rounded-md border bg-muted/50 p-4">
          <p className="text-sm font-medium">{t('deviceSetup.appliedTemplate')}</p>
          <p className="text-sm text-muted-foreground">{selectedTemplate.name}</p>
        </div>
      )}

      {/* 设备编码（必填） */}
      <div className="space-y-2">
        <Label htmlFor="deviceCode">{t('deviceSetup.deviceCode')} *</Label>
        <Input
          id="deviceCode"
          placeholder={t('deviceSetup.deviceCodePlaceholder')}
          value={deviceCode}
          onChange={(e) => setDeviceCode(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t('deviceSetup.deviceCodeHint')}</p>
      </div>

      {/* 设备名称（选填） */}
      <div className="space-y-2">
        <Label htmlFor="deviceName">{t('deviceSetup.deviceName')}</Label>
        <Input
          id="deviceName"
          placeholder={t('deviceSetup.deviceNamePlaceholder')}
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
        />
      </div>
    </div>
  );

  // =========================================================================
  // 渲染：步骤3 — 告警规则配置
  // =========================================================================

  const renderAlertRules = () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <p className="text-sm text-muted-foreground mb-4">{t('deviceSetup.alertRulesHint')}</p>

      {/* 告警规则列表 */}
      {alertRules.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground border rounded-md border-dashed">
          {t('deviceSetup.noAlertRules')}
        </div>
      ) : (
        <div className="space-y-3">
          {alertRules.map((rule, idx) => (
            <div key={idx} className="flex items-end gap-3 p-3 border rounded-md">
              {/* 指标名称 */}
              <div className="flex-1 space-y-1">
                <Label className="text-xs">{t('alertrule.metric')}</Label>
                <Input
                  placeholder={t('alertrule.metric')}
                  value={rule.metric}
                  onChange={(e) => updateAlertRule(idx, 'metric', e.target.value)}
                />
              </div>
              {/* 阈值 */}
              <div className="w-28 space-y-1">
                <Label className="text-xs">{t('alertrule.threshold')}</Label>
                <Input
                  type="number"
                  value={rule.threshold}
                  onChange={(e) => updateAlertRule(idx, 'threshold', Number(e.target.value))}
                />
              </div>
              {/* 严重级别 */}
              <div className="w-32 space-y-1">
                <Label className="text-xs">{t('alertrule.alertLevel')}</Label>
                <Select
                  value={rule.severity}
                  onValueChange={(v) => { if (v) updateAlertRule(idx, 'severity', v); }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">{t('alert.critical')}</SelectItem>
                    <SelectItem value="High">{t('alert.high')}</SelectItem>
                    <SelectItem value="Normal">{t('alert.normal')}</SelectItem>
                    <SelectItem value="Low">{t('alert.low')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* 删除按钮 */}
              <Button variant="ghost" size="icon" onClick={() => removeAlertRule(idx)} className="shrink-0">
                <span className="text-destructive text-sm">X</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 添加规则按钮 */}
      <Button variant="outline" onClick={addAlertRule} className="w-full">
        + {t('deviceSetup.addAlertRule')}
      </Button>
    </div>
  );

  // =========================================================================
  // 主渲染
  // =========================================================================

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* 页头 */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/devices')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t('deviceSetup.title')}</h1>
      </div>

      {/* 步骤进度指示器 */}
      {renderStepper()}

      {/* 步骤内容 */}
      <Card>
        <CardContent className="pt-6">
          {step === 'selectType' && renderSelectType()}
          {step === 'basicInfo' && renderBasicInfo()}
          {step === 'alertRules' && renderAlertRules()}
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {submitError && (
        <div className="mt-4 rounded-md bg-destructive/10 text-destructive text-sm p-3">
          {submitError}
        </div>
      )}

      {/* 底部导航按钮 */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={goBack} disabled={step === 'selectType'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.previous')}
        </Button>

        {step === 'alertRules' ? (
          <Button onClick={handleSubmit} disabled={quickRegister.isPending}>
            {quickRegister.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('deviceSetup.submitRegister')}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!canProceed()}>
            {t('common.next')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
