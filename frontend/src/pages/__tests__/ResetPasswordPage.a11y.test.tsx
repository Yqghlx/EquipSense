import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from '../ResetPasswordPage';

const translations: Record<string, string> = {
  'auth.resetPassword': 'Reset password',
  'auth.resetPasswordHint': 'Enter your new password',
  'auth.newPassword': 'New password',
  'auth.confirmPassword': 'Confirm new password',
  'auth.passwordMin': 'Password must be at least 8 characters',
  'auth.confirmPasswordRequired': 'Please confirm your password',
  'auth.passwordMismatch': 'Passwords do not match',
  'auth.resetTokenMissing': 'Reset link is invalid',
  'auth.requestResetAgain': 'Request another reset',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('../../lib/api', () => ({
  default: { post: vi.fn() },
}));

describe('ResetPasswordPage 表单无障碍反馈', () => {
  it('密码校验错误应关联到对应输入框', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/reset-password?token=reset-token']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Reset password' }));

    const newPassword = screen.getByLabelText('New password');
    const confirmPassword = screen.getByLabelText('Confirm new password');
    expect(newPassword).toHaveAttribute('aria-invalid', 'true');
    expect(newPassword).toHaveAttribute('aria-describedby', 'reset-password-new-error');
    expect(confirmPassword).toHaveAttribute('aria-invalid', 'true');
    expect(confirmPassword).toHaveAttribute('aria-describedby', 'reset-password-confirm-error');
    expect(screen.getByText('Password must be at least 8 characters')).toHaveAttribute('id', 'reset-password-new-error');
    expect(screen.getByText('Password must be at least 8 characters')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Please confirm your password')).toHaveAttribute('id', 'reset-password-confirm-error');
    expect(screen.getByText('Please confirm your password')).toHaveAttribute('role', 'alert');
  });
});
