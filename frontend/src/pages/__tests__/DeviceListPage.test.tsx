import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DeviceListPage from '../DeviceListPage';
import {
  useCreateDevice,
  useDeleteDevice,
  useDevices,
  useUpdateDevice,
} from '../../hooks/useDevices';
import { usePermission } from '../../hooks/usePermission';
import { toast } from 'sonner';
import type { Device } from '../../types';

const mockedToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: mockedToast,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/useDevices', () => ({
  useDevices: vi.fn(),
  useCreateDevice: vi.fn(),
  useUpdateDevice: vi.fn(),
  useDeleteDevice: vi.fn(),
  exportDevicesCsv: vi.fn(),
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: vi.fn(),
}));

vi.mock('../../components/device/DeviceForm', () => ({
  DeviceForm: ({
    onSubmit,
    onCancel,
    loading,
  }: {
    onSubmit: (data: { deviceCode: string; name: string; type: string }) => Promise<void> | void;
    onCancel: () => void;
    loading?: boolean;
  }) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({ deviceCode: 'PUMP-001', name: '一号水泵', type: 'pump' });
      }}
    >
      <button type="submit">{loading ? 'common.loading' : 'common.save'}</button>
      <button type="button" onClick={onCancel}>common.cancel</button>
    </form>
  ),
}));

vi.mock('../../components/device/DeviceQuickRegisterDialog', () => ({
  DeviceQuickRegisterDialog: () => null,
}));

vi.mock('../../components/device/DeviceImportPreviewDialog', () => ({
  default: () => null,
}));

vi.mock('../../components/ui/ExportButton', () => ({
  default: ({ onExport }: { onExport: () => Promise<void> }) => (
    <button type="button" onClick={() => { void onExport(); }}>common.export</button>
  ),
}));

const mockedUseDevices = vi.mocked(useDevices);
const mockedUseCreateDevice = vi.mocked(useCreateDevice);
const mockedUseUpdateDevice = vi.mocked(useUpdateDevice);
const mockedUseDeleteDevice = vi.mocked(useDeleteDevice);
const mockedUsePermission = vi.mocked(usePermission);

const device = {
  id: 'device-001',
  deviceCode: 'PUMP-001',
  name: '一号水泵',
  type: 'pump',
  status: 'Online',
} as Device;

const fullPermission = {
  canRead: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canExecute: false,
  canConfigure: false,
  canApprove: false,
  canTriggerAI: false,
  canManage: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockReset();
  mockedUsePermission.mockReturnValue(fullPermission);
  mockedUseDevices.mockReturnValue({
    data: { items: [device], total: 1, page: 1, pageSize: 20 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useDevices>);
  mockedUseCreateDevice.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(device),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateDevice>);
  mockedUseUpdateDevice.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(device),
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateDevice>);
  mockedUseDeleteDevice.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteDevice>);
});

describe('DeviceListPage', () => {
  it('创建设备失败时应提示错误并保留新建弹窗', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue(new Error('quota exceeded'));
    mockedUseCreateDevice.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateDevice>);
    render(<DeviceListPage />);

    await user.click(screen.getByRole('button', { name: /common.create/ }));
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('device.saveFailed');
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeInTheDocument();
  });

  it('创建设备成功时应提示成功并关闭弹窗', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(device);
    mockedUseCreateDevice.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateDevice>);
    render(<DeviceListPage />);

    await user.click(screen.getByRole('button', { name: /common.create/ }));
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('device.saveSuccess');
    });
    expect(screen.queryByRole('button', { name: 'common.save' })).not.toBeInTheDocument();
  });

  it('删除失败时应提示错误而不是静默结束', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue(new Error('conflict'));
    mockedUseDeleteDevice.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteDevice>);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DeviceListPage />);

    const deleteButton = screen.getByRole('button', { name: 'common.delete' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('device-001');
      expect(toast.error).toHaveBeenCalledWith('device.deleteFailed');
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('编辑设备成功时应提示成功', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(device);
    mockedUseUpdateDevice.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateDevice>);
    render(<DeviceListPage />);

    await user.click(screen.getByRole('button', { name: 'common.edit' }));
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('device.saveSuccess');
    });
  });

  it('取消删除确认时不应发请求', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn();
    mockedUseDeleteDevice.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteDevice>);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<DeviceListPage />);

    await user.click(screen.getByRole('button', { name: 'common.delete' }));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('应支持搜索和分页', async () => {
    const user = userEvent.setup();
    mockedUseDevices.mockReturnValue({
      data: { items: [device], total: 41, page: 1, pageSize: 20 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDevices>);
    render(<DeviceListPage />);

    await user.type(screen.getByPlaceholderText('common.search...'), 'PUMP');
    await waitFor(() => {
      expect(mockedUseDevices).toHaveBeenCalledWith(expect.objectContaining({
        page: 1,
        pageSize: 20,
        keyword: 'PUMP',
      }));
    });
    expect(screen.getByText('PUMP-001')).toBeInTheDocument();
    expect(screen.getByText('device.types.pump')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'common.next' }));
    await user.click(screen.getByRole('button', { name: 'common.previous' }));
    expect(screen.getByText('common.totalItems')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'common.export' }));
    await user.click(screen.getByText('PUMP-001'));
    expect(mockNavigate).toHaveBeenCalledWith('/devices/device-001');

    await user.click(screen.getByRole('button', { name: /device.quickRegister.open/ }));
    await user.click(screen.getByRole('button', { name: /common.create/ }));
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));

    const viewButton = screen.getByRole('button', { name: 'common.view' });
    expect(viewButton).toHaveAccessibleName('common.view');
    expect(screen.getByRole('button', { name: 'common.edit' })).toHaveAccessibleName('common.edit');
    expect(screen.getByRole('button', { name: 'common.delete' })).toHaveAccessibleName('common.delete');
    await user.click(viewButton);
    expect(mockNavigate).toHaveBeenCalledWith('/devices/device-001');

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /device.import/ }));
    fireEvent.change(fileInput, { target: { files: [new File(['a'], 'devices.csv', { type: 'text/csv' })] } });
  });

  it('加载中和空列表应分别显示忙碌与空态', () => {
    mockedUseDevices.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDevices>);
    const view = render(<DeviceListPage />);
    expect(screen.getByText('common.loading')).toBeInTheDocument();

    mockedUseDevices.mockReturnValue({
      data: { items: [], total: 0, page: 1, pageSize: 20 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDevices>);
    view.rerender(<DeviceListPage />);
    expect(screen.getByText('common.noData')).toBeInTheDocument();
  });

  it('列表加载失败时应显示错误态而不是空数据', () => {
    mockedUseDevices.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDevices>);
    render(<DeviceListPage />);

    expect(screen.getByText('common.loadFailed')).toBeInTheDocument();
    expect(screen.queryByText('common.noData')).not.toBeInTheDocument();
  });

  it('搜索时应把关键词交给接口，而不是只过滤当前页', async () => {
    const user = userEvent.setup();
    render(<DeviceListPage />);

    await user.type(screen.getByPlaceholderText('common.search...'), 'ZZZ');

    await waitFor(() => {
      expect(mockedUseDevices).toHaveBeenCalledWith(expect.objectContaining({
        keyword: 'ZZZ',
        page: 1,
      }));
    });
    // 服务端返回的当前页仍应展示，证明不再做客户端二次过滤
    expect(screen.getByText('PUMP-001')).toBeInTheDocument();
  });
});
