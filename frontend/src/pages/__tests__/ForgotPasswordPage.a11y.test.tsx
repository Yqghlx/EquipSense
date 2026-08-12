import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from '../ForgotPasswordPage';

const translations: Record<string, string> = {
  'auth.forgotPassword': 'Forgot password',
  'auth.forgotPasswordHint': 'Enter your registered email and we will send a reset link',
  'auth.email': 'Email',
  'auth.emailPlaceholder': 'Enter email',
  'auth.emailRequired': 'Email is required',
  'auth.emailInvalid': 'Email format is invalid',
  'auth.sendResetLink': 'Send reset link',
  'auth.backToLogin': 'Back to login',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('../../lib/api', () => ({
  default: { post: vi.fn() },
}));

describe('ForgotPasswordPage 表单无障碍反馈', () => {
  it('邮箱必填错误应关联到对应输入框', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    const email = screen.getByLabelText('Email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-describedby', 'forgot-password-email-error');
    expect(screen.getByText('Email is required')).toHaveAttribute('id', 'forgot-password-email-error');
    expect(screen.getByText('Email is required')).toHaveAttribute('role', 'alert');
  });
});
