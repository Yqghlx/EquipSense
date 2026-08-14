import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
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
  'common.search': 'Search',
  'common.create': 'Create',
  'common.cancel': 'Cancel',
  'common.previous': 'Previous',
  'common.next': 'Next',
  'common.totalItems': '{{count}} items',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>, options?: Record<string, unknown>) => {
      const template = translations[key] ?? (typeof fallback === 'string' ? fallback : key);
      const values = typeof fallback === 'object' && fallback !== null ? fallback : options;
      return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(values?.[name] ?? ('{{' + name + '}}')));
    },
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

afterEach(() => {
  vi.unstubAllGlobals();
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

  it('搜索、角色变更和停用操作应调用对应 mutation', async () => {
    const user = userEvent.setup();
    render(<UsersPage />);
    const changeRole = vi.mocked(useChangeUserRole).mock.results[0]?.value as { mutate: ReturnType<typeof vi.fn> };
    const deactivateUser = vi.mocked(useDeactivateUser).mock.results[0]?.value as { mutateAsync: ReturnType<typeof vi.fn> };

    await user.type(screen.getByPlaceholderText('Search username/name...'), 'pump');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(mockedUseUsers.mock.lastCall?.[0]).toMatchObject({ page: 1, keyword: 'pump' });

    await user.selectOptions(screen.getByTitle('Change role'), 'Viewer');
    expect(changeRole.mutate).toHaveBeenCalledWith({ id: 'user-1', role: 'Viewer' });

    vi.stubGlobal('confirm', vi.fn(() => true));
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(deactivateUser.mutateAsync).toHaveBeenCalledWith('user-1');
  });

  it('创建用户对话框应提交完整表单并关闭', async () => {
    const user = userEvent.setup();
    render(<UsersPage />);
    const createUser = vi.mocked(useCreateUser).mock.results[0]?.value as { mutateAsync: ReturnType<typeof vi.fn> };

    await user.click(screen.getByRole('button', { name: 'Create User' }));
    const dialog = screen.getByRole('dialog');
    const textboxes = within(dialog).getAllByRole('textbox');
    await user.type(textboxes[0], 'new-technician');
    const password = dialog.querySelector('input[type="password"]');
    expect(password).not.toBeNull();
    await user.type(password as HTMLInputElement, 'StrongPassword!123');
    await user.type(textboxes[1], 'New Technician');
    await user.type(textboxes[2], 'new@example.com');
    await user.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(createUser.mutateAsync).toHaveBeenCalledWith({
      username: 'new-technician',
      password: 'StrongPassword!123',
      displayName: 'New Technician',
      role: 'Technician',
      email: 'new@example.com',
      phone: '',
    });
  });

  it('超过一页时应支持翻页并把新页码传给查询 Hook', async () => {
    const user = userEvent.setup();
    mockedUseUsers.mockReturnValue({
      data: {
        items: [{
          id: 'user-1',
          username: 'operator',
          displayName: '',
          role: 'Viewer',
          email: '',
          phone: '',
          isActive: false,
          createdAt: '2026-08-12T00:00:00Z',
        }],
        total: 41,
        page: 1,
        pageSize: 20,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useUsers>);
    render(<UsersPage />);

    expect(screen.getByText('41 items')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(mockedUseUsers.mock.lastCall?.[0]).toMatchObject({ page: 2, keyword: '' });
  });
});
