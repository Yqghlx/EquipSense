import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useIntegrations, useUpdateIntegration, useTestIntegration } from '../../hooks/useIntegration';
import type { IntegrationsMap } from '../../types/integration';

/**
 * 外部集成配置面板
 *
 * 支持四种外部集成：
 * 1. 钉钉 — 自定义机器人 Webhook + ActionCard 消息
 * 2. 飞书 — 机器人 Webhook / API 消息 + 审批实例
 * 3. Webhook — 通用 HTTP POST + 变量插值 + 签名
 * 4. EAM — Maximo REST API 工单同步
 *
 * 每种集成可独立启用/禁用，配置连接参数，并测试连接。
 */
export function IntegrationSettings() {
  const { t } = useTranslation();
  const { data: integrations, isLoading } = useIntegrations();
  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>;
  }

  // 配置摘要变化时重新挂载表单，避免切换租户后沿用上一个租户的非敏感草稿。
  const integrationSnapshotKey = JSON.stringify(integrations ?? {});
  return <IntegrationSettingsForm key={integrationSnapshotKey} integrations={integrations} />;
}

/**
 * 外部集成配置表单。
 *
 * 将表单拆出加载壳层，使脱敏配置在表单首次挂载时初始化，避免在 effect 中同步
 * setState 造成级联渲染，也避免把凭证占位符误当成可编辑的真实值。
 */
function IntegrationSettingsForm({ integrations }: { integrations?: IntegrationsMap }) {
  const { t } = useTranslation();
  const updateMutation = useUpdateIntegration();
  const testMutation = useTestIntegration();
  const [activeTab, setActiveTab] = useState('dingtalk');

  // 钉钉配置状态：仅回填非敏感字段，凭证和 URL 由用户重新输入时才更新。
  const [dingtalk, setDingtalk] = useState(() => ({
    webhookUrl: '',
    secret: '',
    messageType: integrations?.dingtalk?.messageType ?? 'actionCard',
    detailUrlTemplate: integrations?.dingtalk?.detailUrlTemplate ?? '',
  }));

  // 飞书配置状态：App ID 和审批定义不是服务端凭证，可以安全回填。
  const [feishu, setFeishu] = useState(() => ({
    webhookUrl: '',
    appId: integrations?.feishu?.appId ?? '',
    appSecret: '',
    approvalCode: integrations?.feishu?.approvalCode ?? '',
  }));

  // Webhook 配置状态：Body 模板不包含服务端凭证，可以安全回填。
  const [webhook, setWebhook] = useState(() => ({
    url: '',
    secret: '',
    bodyTemplate: integrations?.webhook?.bodyTemplate ?? '',
  }));

  // EAM 配置状态：系统类型和用户名可以回填，端点与凭证保持空白。
  const [eam, setEam] = useState(() => ({
    type: integrations?.eam?.type ?? 'maximo',
    endpoint: '',
    apiKey: '',
    username: integrations?.eam?.username ?? '',
    password: '',
  }));

  /** 保存集成配置 */
  const handleSave = (type: string, config: object, enabled: boolean) => {
    updateMutation.mutate({
      type,
      enabled,
      config: JSON.stringify(config),
    });
  };

  /** 测试集成连接 */
  const handleTest = (type: string) => {
    testMutation.mutate(type);
  };

  const dingtalkEnabled = integrations?.dingtalk?.enabled ?? false;
  const feishuEnabled = integrations?.feishu?.enabled ?? false;
  const webhookEnabled = integrations?.webhook?.enabled ?? false;
  const eamEnabled = integrations?.eam?.enabled ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.integration')}</CardTitle>
        <CardDescription>{t('settings.integrationDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="dingtalk">{t('settings.integrations.tabs.dingtalk')}</TabsTrigger>
            <TabsTrigger value="feishu">{t('settings.integrations.tabs.feishu')}</TabsTrigger>
            <TabsTrigger value="webhook">{t('settings.integrations.tabs.webhook')}</TabsTrigger>
            <TabsTrigger value="eam">{t('settings.integrations.tabs.eam')}</TabsTrigger>
          </TabsList>

          {/* 钉钉集成 */}
          <TabsContent value="dingtalk" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={dingtalkEnabled ? "default" : "outline"}>
                  {dingtalkEnabled ? t('settings.integrations.enabled') : t('settings.integrations.disabled')}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('dingtalk')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? t('settings.integrations.testing') : t('settings.integrations.testConnection')}
                </Button>
                <Button
                  size="sm"
                  variant={dingtalkEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('dingtalk', dingtalk, !dingtalkEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {dingtalkEnabled ? t('settings.integrations.disable') : t('settings.integrations.enableAndSave')}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t('settings.integrations.dingtalk.webhookUrl')}</Label>
                <Input
                  placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                  value={dingtalk.webhookUrl}
                  onChange={(e) => setDingtalk({ ...dingtalk, webhookUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.integrations.dingtalk.secret')}</Label>
                <Input
                  type="password"
                  placeholder="SEC..."
                  value={dingtalk.secret}
                  onChange={(e) => setDingtalk({ ...dingtalk, secret: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.integrations.dingtalk.messageType')}</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={dingtalk.messageType}
                  onChange={(e) => setDingtalk({
                    ...dingtalk,
                    messageType: e.target.value as 'actionCard' | 'markdown',
                  })}
                >
                  <option value="actionCard">{t('settings.integrations.dingtalk.actionCard')}</option>
                  <option value="markdown">{t('settings.integrations.dingtalk.markdown')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('settings.integrations.dingtalk.detailUrl')}</Label>
                <Input
                  placeholder="https://equipsense.app/work-orders/{{workOrderId}}"
                  value={dingtalk.detailUrlTemplate}
                  onChange={(e) => setDingtalk({ ...dingtalk, detailUrlTemplate: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          {/* 飞书集成 */}
          <TabsContent value="feishu" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Badge variant={feishuEnabled ? "default" : "outline"}>
                {feishuEnabled ? t('settings.integrations.enabled') : t('settings.integrations.disabled')}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('feishu')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? t('settings.integrations.testing') : t('settings.integrations.testConnection')}
                </Button>
                <Button
                  size="sm"
                  variant={feishuEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('feishu', feishu, !feishuEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {feishuEnabled ? t('settings.integrations.disable') : t('settings.integrations.enableAndSave')}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t('settings.integrations.feishu.webhookUrl')}</Label>
                <Input
                  placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                  value={feishu.webhookUrl}
                  onChange={(e) => setFeishu({ ...feishu, webhookUrl: e.target.value })}
                />
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">{t('settings.integrations.feishu.apiModeNote')}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('settings.integrations.feishu.appId')}</Label>
                  <Input
                    placeholder="cli_xxxxxxxx"
                    value={feishu.appId}
                    onChange={(e) => setFeishu({ ...feishu, appId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.integrations.feishu.appSecret')}</Label>
                  <Input
                    type="password"
                    value={feishu.appSecret}
                    onChange={(e) => setFeishu({ ...feishu, appSecret: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('settings.integrations.feishu.approvalCode')}</Label>
                <Input
                  placeholder={t('settings.integrations.feishu.approvalPlaceholder')}
                  value={feishu.approvalCode}
                  onChange={(e) => setFeishu({ ...feishu, approvalCode: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Webhook 集成 */}
          <TabsContent value="webhook" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Badge variant={webhookEnabled ? "default" : "outline"}>
                {webhookEnabled ? t('settings.integrations.enabled') : t('settings.integrations.disabled')}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('webhook')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? t('settings.integrations.testing') : t('settings.integrations.testConnection')}
                </Button>
                <Button
                  size="sm"
                  variant={webhookEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('webhook', webhook, !webhookEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {webhookEnabled ? t('settings.integrations.disable') : t('settings.integrations.enableAndSave')}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t('settings.integrations.webhook.url')}</Label>
                <Input
                  placeholder="https://your-server.com/api/webhook"
                  value={webhook.url}
                  onChange={(e) => setWebhook({ ...webhook, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.integrations.webhook.secret')}</Label>
                <Input
                  type="password"
                  value={webhook.secret}
                  onChange={(e) => setWebhook({ ...webhook, secret: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.integrations.webhook.bodyTemplate')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('settings.integrations.webhook.variables')} {'{{workOrder.code}}'}, {'{{workOrder.title}}'}, {'{{workOrder.priority}}'}, {'{{workOrder.status}}'}, {'{{timestamp}}'}
                </p>
                <textarea
                  className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm font-mono"
                  placeholder={'{"event": "work_order.created", "code": "{{workOrder.code}}", "title": "{{workOrder.title}}"}'}
                  value={webhook.bodyTemplate}
                  onChange={(e) => setWebhook({ ...webhook, bodyTemplate: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>

          {/* EAM 集成 */}
          <TabsContent value="eam" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Badge variant={eamEnabled ? "default" : "outline"}>
                {eamEnabled ? t('settings.integrations.enabled') : t('settings.integrations.disabled')}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('eam')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? t('settings.integrations.testing') : t('settings.integrations.testConnection')}
                </Button>
                <Button
                  size="sm"
                  variant={eamEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('eam', eam, !eamEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {eamEnabled ? t('settings.integrations.disable') : t('settings.integrations.enableAndSave')}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t('settings.integrations.eam.systemType')}</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={eam.type}
                  onChange={(e) => setEam({
                    ...eam,
                    type: e.target.value as 'maximo' | 'sap_pm' | 'custom',
                  })}
                >
                  <option value="maximo">{t('settings.integrations.eam.maximo')}</option>
                  <option value="sap_pm">{t('settings.integrations.eam.sapPm')}</option>
                  <option value="custom">{t('settings.integrations.eam.custom')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t('settings.integrations.eam.endpoint')}</Label>
                <Input
                  placeholder="https://maximo.example.com/maximo/oslc"
                  value={eam.endpoint}
                  onChange={(e) => setEam({ ...eam, endpoint: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('settings.integrations.eam.apiKey')}</Label>
                  <Input
                    type="password"
                    value={eam.apiKey}
                    onChange={(e) => setEam({ ...eam, apiKey: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.integrations.eam.basicAuth')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={t('auth.username')}
                      value={eam.username}
                      onChange={(e) => setEam({ ...eam, username: e.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder={t('auth.password')}
                      value={eam.password}
                      onChange={(e) => setEam({ ...eam, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* 测试结果显示 */}
        {testMutation.data && (
          <div className={`mt-4 rounded-lg border p-3 ${testMutation.data.success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <p className={`text-sm font-medium ${testMutation.data.success ? 'text-green-600' : 'text-red-600'}`}>
              {testMutation.data.message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('settings.integrations.test.duration', { duration: testMutation.data.durationMs })}
            </p>
            {testMutation.data.details && (
              <pre className="mt-2 rounded bg-muted p-2 text-xs overflow-x-auto">
                {testMutation.data.details}
              </pre>
            )}
          </div>
        )}

        {testMutation.isError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-sm text-red-600">
              {t('settings.integrations.test.failed', {
                message: (testMutation.error as Error)?.message || t('settings.integrations.test.unknownError'),
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
