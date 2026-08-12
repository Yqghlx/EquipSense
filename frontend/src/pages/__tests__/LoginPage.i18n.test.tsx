import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import api from '../../lib/api';

const translations: Record<string, string> = {
  'auth.login': 'Login',
  'auth.loginSubtitle': 'Sign in to EquipSense',
  'auth.username': 'Username',
  'auth.password': 'Password',
  'auth.usernameRequired': 'Username is required',
  'auth.passwordRequired': 'Password is required',
  'auth.forgotPassword': 'Forgot password?',
  'register.noAccount': "Don't have an account?",
  'register.title': 'Register',
  'mfa.title': 'Multi-factor authentication',
  'mfa.loginDesc': 'Enter the code from your Authenticator app.',
  'mfa.loginUser': 'User',
  'mfa.loginCodeLabel': 'Verification or recovery code',
  'mfa.loginCodePlaceholder': 'Enter code',
  'mfa.codeOrRecoveryCodeInvalid': 'Enter a valid code',
  'mfa.verify': 'Verify',
  'common.previous': 'Previous',
  'common.loading': 'Loading...',
  'mfa.codeError': 'Invalid verification code. Check your authenticator time and retry.',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ state: { mfaChallengeToken: 'challenge-001' } }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../lib/api', () => ({
  default: { post: vi.fn() },
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: (state: { setAuth: () => void }) => unknown) => selector({ setAuth: vi.fn() }),
}));

vi.mock('../../lib/tokenExpiry', () => ({
  persistTokenExpiry: vi.fn(),
}));

vi.mock('../../components/auth/ChangePasswordDialog', () => ({
  ChangePasswordDialog: () => null,
}));

const mockedPost = vi.mocked(api.post);

describe('登录页 MFA 英文错误提示', () => {
  it('密码登录必填校验错误应关联到对应输入框', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-describedby', 'login-username-error');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-describedby', 'login-password-error');
    expect(screen.getByText('Username is required')).toHaveAttribute('id', 'login-username-error');
    expect(screen.getByText('Username is required')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Password is required')).toHaveAttribute('id', 'login-password-error');
    expect(screen.getByText('Password is required')).toHaveAttribute('role', 'alert');
  });

  it('MFA 验证码校验错误应关联到对应输入框', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        mfaRequired: true,
        mfaChallengeToken: 'challenge-001',
        userInfo: { username: 'operator', displayName: 'Operator' },
      },
    } as never);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Username'), 'operator');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    const codeInput = screen.getByLabelText('Verification or recovery code');
    expect(codeInput).toHaveAttribute('aria-invalid', 'true');
    expect(codeInput).toHaveAttribute('aria-describedby', 'mfa-code-error');
    expect(screen.getByText('Enter a valid code')).toHaveAttribute('id', 'mfa-code-error');
    expect(screen.getByText('Enter a valid code')).toHaveAttribute('role', 'alert');
  });

  it('MFA 验证失败时应使用翻译资源而不是硬编码中文', async () => {
    mockedPost
      .mockResolvedValueOnce({
        data: {
          mfaRequired: true,
          mfaChallengeToken: 'challenge-001',
          userInfo: { username: 'operator', displayName: 'Operator' },
        },
      } as never)
      .mockRejectedValueOnce(new Error('invalid code'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Username'), 'operator');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    const codeInput = screen.getByLabelText('Verification or recovery code');
    expect(codeInput).toHaveValue('');
    await user.type(codeInput, '123456');
    expect(codeInput).toHaveValue('123456');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    expect(await screen.findByText('Invalid verification code. Check your authenticator time and retry.')).toBeInTheDocument();
    expect(screen.queryByText('验证码错误，请检查 authenticator 应用中的时间是否准确')).not.toBeInTheDocument();
  });
});
