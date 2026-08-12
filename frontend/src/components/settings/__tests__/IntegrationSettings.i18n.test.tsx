import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntegrationSettings } from '../IntegrationSettings';
import * as useIntegration from '../../../hooks/useIntegration';
import type { IntegrationsMap } from '../../../types/integration';

/** 外部集成配置测试使用的英文翻译。 */
const translations: Record<string, string> = {
  'common.loading': 'Loading...',
  'settings.integration': 'External integrations',
  'settings.integrationDesc': 'Configure work order integrations with external systems',
  'settings.integrations.tabs.dingtalk': 'DingTalk',
  'settings.integrations.tabs.feishu': 'Feishu',
  'settings.integrations.tabs.webhook': 'Webhook',
  'settings.integrations.tabs.eam': 'EAM',
  'settings.integrations.enabled': 'Enabled',
  'settings.integrations.disabled': 'Disabled',
  'settings.integrations.testing': 'Testing...',
  'settings.integrations.testConnection': 'Test connection',
  'settings.integrations.disable': 'Disable',
  'settings.integrations.enableAndSave': 'Enable and save',
  'settings.integrations.dingtalk.webhookUrl': 'Webhook URL *',
  'settings.integrations.dingtalk.secret': 'Signing secret (optional)',
  'settings.integrations.dingtalk.messageType': 'Message type',
  'settings.integrations.dingtalk.actionCard': 'ActionCard (recommended)',
  'settings.integrations.dingtalk.markdown': 'Markdown',
  'settings.integrations.dingtalk.detailUrl': 'Work order detail URL template (optional)',
  'settings.integrations.feishu.webhookUrl': 'Bot Webhook URL (recommended, simple mode)',
  'settings.integrations.feishu.apiModeNote': 'The following fields configure API mode (required for approval instances):',
  'settings.integrations.feishu.appId': 'App ID',
  'settings.integrations.feishu.appSecret': 'App Secret',
  'settings.integrations.feishu.approvalCode': 'Approval definition code (optional, used to create approval instances)',
  'settings.integrations.feishu.approvalPlaceholder': 'Get from Feishu approval management',
  'settings.integrations.webhook.url': 'Webhook URL *',
  'settings.integrations.webhook.secret': 'Signing secret (optional; adds X-EquipSense-Signature header)',
  'settings.integrations.webhook.bodyTemplate': 'Body template (optional, supports variable interpolation)',
  'settings.integrations.webhook.variables': 'Available variables:',
  'settings.integrations.eam.systemType': 'EAM system type',
  'settings.integrations.eam.maximo': 'IBM Maximo',
  'settings.integrations.eam.sapPm': 'SAP PM',
  'settings.integrations.eam.custom': 'Custom REST API',
  'settings.integrations.eam.endpoint': 'REST API endpoint *',
  'settings.integrations.eam.apiKey': 'API Key',
  'settings.integrations.eam.basicAuth': 'or Basic Auth',
  'settings.integrations.test.duration': 'Duration: {{duration}}ms',
  'settings.integrations.test.failed': 'Test failed: {{message}}',
  'settings.integrations.test.unknownError': 'Unknown error',
  'settings.getFromFeishu': 'Get from Feishu approval management',
  'auth.username': 'Username',
  'auth.password': 'Password',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const value = translations[key] ?? key;
      return value.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? `{{${name}}}`));
    },
  }),
}));

vi.mock('../../../hooks/useIntegration', () => ({
  useIntegrations: vi.fn(),
  useUpdateIntegration: vi.fn(),
  useTestIntegration: vi.fn(),
}));

const existingIntegrations: IntegrationsMap = {
  dingtalk: {
    enabled: true,
    webhookUrl: 'https://oapi.dingtalk.com/…',
    secret: '[已配置]',
    messageType: 'markdown',
    detailUrlTemplate: 'https://equipsense.app/work-orders/{{workOrderId}}',
  },
  feishu: {
    enabled: false,
    webhookUrl: 'https://open.feishu.cn/…',
    appId: 'cli_existing',
    appSecret: '[已配置]',
    approvalCode: 'approval-existing',
  },
  webhook: {
    enabled: true,
    url: 'https://example.com/…',
    secret: '[已配置]',
    bodyTemplate: '{"event":"work_order.created"}',
  },
  eam: {
    enabled: false,
    type: 'maximo',
    endpoint: 'https://maximo.example.com/…',
    apiKey: '[已配置]',
    username: 'eam-user',
    password: '[已配置]',
  },
};

const mockUpdate = vi.fn();
const mockTest = vi.fn();

/** 配置外部集成 hooks 的默认测试返回值。 */
const mockHooks = (integrations: IntegrationsMap = existingIntegrations) => {
  vi.mocked(useIntegration.useIntegrations).mockReturnValue({
    data: integrations,
    isLoading: false,
  } as ReturnType<typeof useIntegration.useIntegrations>);
  vi.mocked(useIntegration.useUpdateIntegration).mockReturnValue({
    mutate: mockUpdate,
    isPending: false,
  } as unknown as ReturnType<typeof useIntegration.useUpdateIntegration>);
  vi.mocked(useIntegration.useTestIntegration).mockReturnValue({
    mutate: mockTest,
    isPending: false,
    data: undefined,
    isError: false,
  } as unknown as ReturnType<typeof useIntegration.useTestIntegration>);
};

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks();
});

describe('外部集成配置英文界面与回填', () => {
  it('应显示英文标签并回填已有钉钉配置', () => {
    render(<IntegrationSettings />);

    expect(screen.getByText('External integrations')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'DingTalk' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Feishu' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Webhook' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'EAM' })).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('markdown');
    expect(screen.getByDisplayValue(existingIntegrations.dingtalk?.detailUrlTemplate ?? '')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test connection' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disable' })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[\u3400-\u9fff]/);
  });

  it('禁用已配置集成时应保留回填后的配置', async () => {
    const user = userEvent.setup();

    render(<IntegrationSettings />);
    await user.click(screen.getByRole('button', { name: 'Disable' }));

    expect(mockUpdate).toHaveBeenCalledWith({
      type: 'dingtalk',
      enabled: false,
      config: JSON.stringify({
        webhookUrl: '',
        secret: '',
        messageType: existingIntegrations.dingtalk?.messageType,
        detailUrlTemplate: existingIntegrations.dingtalk?.detailUrlTemplate,
      }),
    });
  });

  it('集成摘要变化时应重置表单草稿，避免沿用其他租户配置', () => {
    let currentIntegrations = existingIntegrations;
    vi.mocked(useIntegration.useIntegrations).mockImplementation(() => ({
      data: currentIntegrations,
      isLoading: false,
    } as ReturnType<typeof useIntegration.useIntegrations>));

    const { rerender } = render(<IntegrationSettings />);
    expect(screen.getByDisplayValue(existingIntegrations.dingtalk?.detailUrlTemplate ?? '')).toBeInTheDocument();

    currentIntegrations = {
      ...existingIntegrations,
      dingtalk: {
        ...existingIntegrations.dingtalk,
        enabled: false,
        messageType: 'actionCard',
        detailUrlTemplate: 'https://other-tenant.example/work-orders/{{workOrderId}}',
      },
    };
    rerender(<IntegrationSettings />);

    expect(screen.getByDisplayValue('https://other-tenant.example/work-orders/{{workOrderId}}')).toBeInTheDocument();
    expect(screen.queryByDisplayValue(existingIntegrations.dingtalk?.detailUrlTemplate ?? '')).not.toBeInTheDocument();
  });

  it('切换四类集成时应提供英文配置字段', async () => {
    const user = userEvent.setup();

    render(<IntegrationSettings />);

    await user.click(screen.getByRole('tab', { name: 'Feishu' }));
    expect(screen.getByText('Bot Webhook URL (recommended, simple mode)')).toBeInTheDocument();
    expect(screen.getByText('The following fields configure API mode (required for approval instances):')).toBeInTheDocument();
    expect(screen.getByText('Approval definition code (optional, used to create approval instances)')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Webhook' }));
    expect(screen.getByText('Signing secret (optional; adds X-EquipSense-Signature header)')).toBeInTheDocument();
    expect(screen.getByText('Body template (optional, supports variable interpolation)')).toBeInTheDocument();
    expect(screen.getByText(/Available variables:/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'EAM' }));
    expect(screen.getByText('EAM system type')).toBeInTheDocument();
    expect(screen.getByText('or Basic Auth')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('maximo');
    expect(document.body.textContent).not.toMatch(/[\u3400-\u9fff]/);
  });
});
