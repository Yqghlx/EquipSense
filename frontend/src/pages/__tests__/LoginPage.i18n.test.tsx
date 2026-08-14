import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const mockNavigate = vi.fn();
const mockSetAuth = vi.fn();
let mockLocationState: Record<string, unknown> = { mfaChallengeToken: 'challenge-001' };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ state: mockLocationState }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../lib/api', () => ({
  default: { post: vi.fn() },
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: (state: { setAuth: typeof mockSetAuth; user: null }) => unknown) => selector({ setAuth: mockSetAuth, user: null }),
}));

vi.mock('../../lib/tokenExpiry', () => ({
  persistTokenExpiry: vi.fn(),
}));

vi.mock('../../components/auth/ChangePasswordDialog', () => ({
  ChangePasswordDialog: () => null,
}));

vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr-code') },
}));

const mockedPost = vi.mocked(api.post);

beforeEach(() => {
  vi.clearAllMocks();
  mockLocationState = { mfaChallengeToken: 'challenge-001' };
});

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

  it('密码登录成功后应保存认证信息并按来源地址跳转', async () => {
    mockLocationState = { from: '/alerts' };
    mockedPost.mockResolvedValueOnce({
      data: {
        mfaRequired: false,
        mfaEnrollmentRequired: false,
        expiresIn: 900,
        userInfo: { username: 'operator', displayName: 'Operator', mustChangePassword: false },
      },
    } as never);
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    await user.type(screen.getByLabelText('Username'), 'operator');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(mockedPost).toHaveBeenCalledWith('/auth/login', { username: 'operator', password: 'password' });
    expect(mockSetAuth).toHaveBeenCalledWith(expect.objectContaining({ username: 'operator' }));
    expect(mockNavigate).toHaveBeenCalledWith('/alerts', { replace: true });
  });

  it('密码登录失败应展示翻译后的错误提示，MFA 返回按钮应回到密码阶段', async () => {
    mockedPost.mockRejectedValueOnce(new Error('invalid credentials'));
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await user.type(screen.getByLabelText('Username'), 'operator');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByText('auth.loginError')).toBeInTheDocument();

    mockedPost.mockResolvedValueOnce({
      data: {
        mfaRequired: true,
        mfaChallengeToken: 'challenge-002',
        userInfo: { username: 'operator', displayName: 'Operator' },
      },
    } as never);
    await user.click(screen.getByRole('button', { name: 'Login' }));
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('高权限首次登录应完成强制 MFA 注册并展示恢复码', async () => {
    mockLocationState = {
      from: '/dashboard',
      mfaEnrollmentToken: 'enrollment-001',
      mfaEnrollmentUserInfo: { username: 'admin', displayName: 'Admin' },
    };
    mockedPost
      .mockResolvedValueOnce({ data: { qrCodeUri: 'otpauth://totp/equipsense', secret: 'JBSWY3DPEHPK3PXP' } })
      .mockResolvedValueOnce({
        data: {
          userInfo: { username: 'admin', displayName: 'Admin' },
          expiresIn: 900,
          mfaRecoveryCodes: ['AAAA-BBBB-CCCC-DDDD', 'EEEE-FFFF-GGGG-HHHH'],
        },
      } as never);
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: 'mfa.enrollmentSetup' }));
    expect(screen.getByAltText('mfa.qrAlt')).toBeInTheDocument();
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    const code = screen.getByLabelText('mfa.codeLabel');
    await user.type(code, '12a3456');
    expect(code).toHaveValue('123456');
    await user.click(screen.getByRole('button', { name: 'mfa.enrollmentConfirm' }));
    expect(screen.getByText('AAAA-BBBB-CCCC-DDDD')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'mfa.recoveryCodesContinue' }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
