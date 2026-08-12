import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { UserFormDialog } from '../UserFormDialog';

const translations: Record<string, string> = {
  'settings.user.createUser': 'Create user',
  'settings.user.createUserDesc': 'Create a user account',
  'settings.username': 'Username',
  'auth.password': 'Password',
  'settings.roleLabel': 'Role',
  'settings.user.displayName': 'Display name',
  'settings.user.email': 'Email',
  'settings.user.phone': 'Phone',
  'settings.user.usernamePlaceholder': 'Enter username',
  'settings.user.passwordPlaceholder': 'Enter password',
  'settings.user.displayNamePlaceholder': 'Enter display name',
  'settings.user.emailPlaceholder': 'Enter email',
  'settings.user.phonePlaceholder': 'Enter phone',
  'settings.user.usernameMin': 'Username must be at least 3 characters',
  'settings.user.passwordMin': 'Password must be at least 8 characters',
  'settings.user.emailInvalid': 'Email format is invalid',
  'settings.role.viewer': 'Viewer',
  'settings.role.systemAdmin': 'System Admin',
  'settings.role.maintenanceLead': 'Maintenance Lead',
  'settings.role.technician': 'Technician',
  'settings.role.operator': 'Operator',
  'common.cancel': 'Cancel',
  'common.create': 'Create',
  'common.loading': 'Loading',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

describe('UserFormDialog 表单无障碍反馈', () => {
  it('创建用户时的校验错误应关联到对应输入框', async () => {
    const user = userEvent.setup();
    render(
      <UserFormDialog
        open
        user={null}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const username = screen.getByLabelText(/Username/);
    const password = screen.getByLabelText(/Password/);
    const email = screen.getByLabelText('Email');
    expect(username).toHaveAttribute('aria-invalid', 'true');
    expect(username).toHaveAttribute('aria-describedby', 'user-form-username-error');
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAttribute('aria-describedby', 'user-form-password-error');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-describedby', 'user-form-email-error');
    expect(screen.getByText('Username must be at least 3 characters')).toHaveAttribute('id', 'user-form-username-error');
    expect(screen.getByText('Username must be at least 3 characters')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Password must be at least 8 characters')).toHaveAttribute('id', 'user-form-password-error');
    expect(screen.getByText('Password must be at least 8 characters')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Email format is invalid')).toHaveAttribute('id', 'user-form-email-error');
    expect(screen.getByText('Email format is invalid')).toHaveAttribute('role', 'alert');
  });
});
