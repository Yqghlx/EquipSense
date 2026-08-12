import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { ChangePasswordDialog } from '../ChangePasswordDialog';

const translations: Record<string, string> = {
  'auth.changePassword': '修改密码',
  'auth.forceChangePasswordHint': '首次登录必须修改密码',
  'auth.currentPassword': '当前密码',
  'auth.newPassword': '新密码',
  'auth.confirmPassword': '确认密码',
  'auth.currentPasswordRequired': '请输入当前密码',
  'auth.newPasswordMin': '新密码至少 8 位',
  'auth.confirmPasswordRequired': '请再次输入密码',
  'auth.passwordMismatch': '两次输入的密码不一致',
  'common.save': '保存',
  'common.loading': '加载中',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('../../../lib/api', () => ({
  default: { post: vi.fn() },
}));

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: null; setAuth: () => void }) => unknown) =>
    selector({ user: null, setAuth: vi.fn() }),
}));

vi.mock('../../../lib/tokenExpiry', () => ({
  persistTokenExpiry: vi.fn(),
}));

describe('ChangePasswordDialog 表单无障碍反馈', () => {
  it('必填校验错误应关联到对应输入框', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordDialog forced />);

    await user.click(screen.getByRole('button', { name: '保存' }));

    const currentPassword = screen.getByLabelText('当前密码');
    const newPassword = screen.getByLabelText('新密码');
    const confirmPassword = screen.getByLabelText('确认密码');
    expect(currentPassword).toHaveAttribute('aria-invalid', 'true');
    expect(currentPassword).toHaveAttribute('aria-describedby', 'change-password-current-error');
    expect(newPassword).toHaveAttribute('aria-invalid', 'true');
    expect(newPassword).toHaveAttribute('aria-describedby', 'change-password-new-error');
    expect(confirmPassword).toHaveAttribute('aria-invalid', 'true');
    expect(confirmPassword).toHaveAttribute('aria-describedby', 'change-password-confirm-error');
    expect(screen.getByText('请输入当前密码')).toHaveAttribute('id', 'change-password-current-error');
    expect(screen.getByText('请输入当前密码')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('新密码至少 8 位')).toHaveAttribute('id', 'change-password-new-error');
    expect(screen.getByText('新密码至少 8 位')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('请再次输入密码')).toHaveAttribute('id', 'change-password-confirm-error');
    expect(screen.getByText('请再次输入密码')).toHaveAttribute('role', 'alert');
  });
});
