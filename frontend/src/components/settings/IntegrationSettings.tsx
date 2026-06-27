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
  const updateMutation = useUpdateIntegration();
  const testMutation = useTestIntegration();
  const [activeTab, setActiveTab] = useState('dingtalk');

  // 钉钉配置状态
  const [dingtalk, setDingtalk] = useState({
    webhookUrl: '', secret: '', messageType: 'actionCard', detailUrlTemplate: '',
  });

  // 飞书配置状态
  const [feishu, setFeishu] = useState({
    webhookUrl: '', appId: '', appSecret: '', approvalCode: '',
  });

  // Webhook 配置状态
  const [webhook, setWebhook] = useState({
    url: '', secret: '', bodyTemplate: '',
  });

  // EAM 配置状态
  const [eam, setEam] = useState({
    type: 'maximo', endpoint: '', apiKey: '', username: '', password: '',
  });

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

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-8">{t('common.loading')}</p>;
  }

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
            <TabsTrigger value="dingtalk">钉钉</TabsTrigger>
            <TabsTrigger value="feishu">飞书</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="eam">EAM</TabsTrigger>
          </TabsList>

          {/* 钉钉集成 */}
          <TabsContent value="dingtalk" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={dingtalkEnabled ? "default" : "outline"}>
                  {dingtalkEnabled ? '已启用' : '未启用'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('dingtalk')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={dingtalkEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('dingtalk', dingtalk, !dingtalkEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {dingtalkEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Webhook URL *</Label>
                <Input
                  placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
                  value={dingtalk.webhookUrl}
                  onChange={(e) => setDingtalk({ ...dingtalk, webhookUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>加签密钥（可选）</Label>
                <Input
                  type="password"
                  placeholder="SEC..."
                  value={dingtalk.secret}
                  onChange={(e) => setDingtalk({ ...dingtalk, secret: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>消息类型</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={dingtalk.messageType}
                  onChange={(e) => setDingtalk({ ...dingtalk, messageType: e.target.value })}
                >
                  <option value="actionCard">ActionCard（推荐）</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>工单详情页 URL 模板（可选）</Label>
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
                {feishuEnabled ? '已启用' : '未启用'}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('feishu')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={feishuEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('feishu', feishu, !feishuEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {feishuEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>机器人 Webhook URL（推荐，简单模式）</Label>
                <Input
                  placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                  value={feishu.webhookUrl}
                  onChange={(e) => setFeishu({ ...feishu, webhookUrl: e.target.value })}
                />
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">以下为 API 模式配置（如需审批实例则必填）：</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>App ID</Label>
                  <Input
                    placeholder="cli_xxxxxxxx"
                    value={feishu.appId}
                    onChange={(e) => setFeishu({ ...feishu, appId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>App Secret</Label>
                  <Input
                    type="password"
                    value={feishu.appSecret}
                    onChange={(e) => setFeishu({ ...feishu, appSecret: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>审批定义 Code（可选，用于创建审批实例）</Label>
                <Input
                  placeholder={t("settings.getFromFeishu", "从飞书审批管理中获取")}
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
                {webhookEnabled ? '已启用' : '未启用'}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('webhook')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={webhookEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('webhook', webhook, !webhookEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {webhookEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Webhook URL *</Label>
                <Input
                  placeholder="https://your-server.com/api/webhook"
                  value={webhook.url}
                  onChange={(e) => setWebhook({ ...webhook, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>签名密钥（可选，设置后自动添加 X-EquipSense-Signature 头）</Label>
                <Input
                  type="password"
                  value={webhook.secret}
                  onChange={(e) => setWebhook({ ...webhook, secret: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Body 模板（可选，支持变量插值）</Label>
                <p className="text-xs text-muted-foreground">
                  可用变量: {'{{workOrder.code}}'}, {'{{workOrder.title}}'}, {'{{workOrder.priority}}'}, {'{{workOrder.status}}'}, {'{{timestamp}}'}
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
                {eamEnabled ? '已启用' : '未启用'}
              </Badge>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest('eam')}
                  disabled={testMutation.isPending}
                >
                  {testMutation.isPending ? '测试中...' : '测试连接'}
                </Button>
                <Button
                  size="sm"
                  variant={eamEnabled ? "destructive" : "default"}
                  onClick={() => handleSave('eam', eam, !eamEnabled)}
                  disabled={updateMutation.isPending}
                >
                  {eamEnabled ? '禁用' : '启用并保存'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>EAM 系统类型</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={eam.type}
                  onChange={(e) => setEam({ ...eam, type: e.target.value })}
                >
                  <option value="maximo">IBM Maximo</option>
                  <option value="sap_pm">SAP PM</option>
                  <option value="custom">自定义 REST API</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>REST API 端点 *</Label>
                <Input
                  placeholder="https://maximo.example.com/maximo/oslc"
                  value={eam.endpoint}
                  onChange={(e) => setEam({ ...eam, endpoint: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={eam.apiKey}
                    onChange={(e) => setEam({ ...eam, apiKey: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>或 Basic Auth</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder={t("auth.username", "用户名")}
                      value={eam.username}
                      onChange={(e) => setEam({ ...eam, username: e.target.value })}
                    />
                    <Input
                      type="password"
                      placeholder={t("auth.password", "密码")}
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
              耗时: {testMutation.data.durationMs}ms
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
            <p className="text-sm text-red-600">测试失败: {(testMutation.error as Error)?.message || '未知错误'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
