import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UsersPage from '../UsersPage';
import { useUsers, useCreateUser, useDeactivateUser, useChangeUserRole } from '../../hooks/useUsers';

const translations: Record<string, string> = {
  'users.title': 'User Management',
  'users.description': 'Manage user accounts, roles and status in this tenant',
  'users.createUser': 'Create User',
  'users.searchPlaceholder': 'Search username/name...',
  'users.changeRole': 'Change role',
  'users.username': 'Username',
  'users.displayName': 'Name',
  'users.role': 'Role',
  'users.email': 'Email',
  'users.status': 'Status',
  'users.active': 'Active',
  'users.deactivate': 'Deactivate',
  'users.createdAt': 'Created At',
  'users.roles.systemAdmin': 'System Admin',
  'users.roles.maintenanceLead': 'Maintenance Lead',
  'users.roles.technician': 'Technician',
  'users.roles.operator': 'Operator',
  'users.roles.viewer': 'Viewer',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('../../hooks/useUsers', () => ({
  useUsers: vi.fn(),
  useCreateUser: vi.fn(),
  useDeactivateUser: vi.fn(),
  useChangeUserRole: vi.fn(),
}));

const mockedUseUsers = vi.mocked(useUsers);
const mockedUseCreateUser = vi.mocked(useCreateUser);
const mockedUseDeactivateUser = vi.mocked(useDeactivateUser);
const mockedUseChangeUserRole = vi.mocked(useChangeUserRole);

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseUsers.mockReturnValue({
    data: {
      items: [{
        id: 'user-1',
        username: 'operator',
        displayName: 'Operator',
        role: 'Technician',
        email: 'operator@example.com',
        phone: '',
        isActive: true,
        createdAt: '2026-08-12T00:00:00Z',
      }],
      total: 1,
      page: 1,
      pageSize: 20,
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useUsers>);
  mockedUseCreateUser.mockReturnValue({ isPending: false, mutateAsync: vi.fn() } as unknown as ReturnType<typeof useCreateUser>);
  mockedUseDeactivateUser.mockReturnValue({ isPending: false, mutateAsync: vi.fn() } as unknown as ReturnType<typeof useDeactivateUser>);
  mockedUseChangeUserRole.mockReturnValue({ isPending: false, mutate: vi.fn() } as unknown as ReturnType<typeof useChangeUserRole>);
});

describe('用户管理英文界面', () => {
  it('角色下拉应使用英文翻译资源而不是中文常量', () => {
    render(<UsersPage />);

    expect(screen.getByRole('option', { name: 'System Admin' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Maintenance Lead' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Technician' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Operator' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Viewer' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '系统管理员' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '维保主管' })).not.toBeInTheDocument();
  });
});
