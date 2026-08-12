import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'auth.login': '登录',
      'common.next': '下一页',
      'common.previous': '上一页',
      'register.title': '注册新租户',
      'register.step1Title': '选择套餐',
      'register.step2Title': '填写企业信息',
      'register.step3Title': '创建管理员账户',
      'register.selectPlanHint': '选择适合您企业的套餐',
      'register.tenantName': '企业名称',
      'register.tenantNamePlaceholder': '例如：青岛西海岸新区塑料制品厂',
      'register.tenantNameMin': '企业名称至少 2 个字符',
      'register.slug': '企业标识',
      'register.slugPlaceholder': '例如：qd-plastic',
      'register.slugMin': '企业标识至少 2 个字符',
      'register.slugPattern': '企业标识格式不正确',
      'register.slugHint': '用于登录地址，仅支持小写字母、数字和连字符',
      'register.hasAccount': '已有账户？',
      'register.maxDevices': '最大设备数',
      'register.maxUsers': '最大用户数',
      'register.dataRetention': '数据保留',
      'register.free': '免费',
      'register.month': '月',
      'subscription.days': '天',
    }[key] ?? key),
  }),
}));

vi.mock('../../hooks/useRegister', () => ({
  usePlans: () => ({
    data: [{
      planId: 'trial',
      displayName: '试用版',
      description: '14 天免费试用',
      maxDevices: 5,
      maxUsers: 3,
      dataRetentionDays: 7,
      isFree: true,
      monthlyPrice: 0,
    }],
    isLoading: false,
  }),
  useRegister: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: (state: { setAuth: () => void }) => unknown) =>
    selector({ setAuth: vi.fn() }),
}));

vi.mock('../../lib/tokenExpiry', () => ({
  persistTokenExpiry: vi.fn(),
}));

describe('RegisterPage 表单无障碍反馈', () => {
  it('企业信息校验失败时应将错误关联到对应输入框', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /试用版/ }));
    await user.click(screen.getByRole('button', { name: '下一页' }));
    await user.click(screen.getByRole('button', { name: '下一页' }));

    const tenantName = screen.getByLabelText('企业名称');
    const slug = screen.getByLabelText('企业标识');
    expect(tenantName).toHaveAttribute('aria-invalid', 'true');
    expect(tenantName).toHaveAttribute('aria-describedby', 'tenantName-error');
    expect(slug).toHaveAttribute('aria-invalid', 'true');
    expect(slug).toHaveAttribute('aria-describedby', 'slug-error');
    expect(screen.getByText('企业名称至少 2 个字符')).toHaveAttribute('id', 'tenantName-error');
    expect(screen.getByText('企业名称至少 2 个字符')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('企业标识至少 2 个字符')).toHaveAttribute('id', 'slug-error');
    expect(screen.getByText('企业标识至少 2 个字符')).toHaveAttribute('role', 'alert');
  });
});
