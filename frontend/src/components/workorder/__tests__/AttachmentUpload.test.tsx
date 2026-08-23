import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import AttachmentUpload from '../AttachmentUpload';
import {
  useDeleteAttachment,
  useUploadAttachment,
  useWorkOrderAttachments,
} from '@/hooks/useWorkOrderAttachments';
import { toast } from 'sonner';

const translations: Record<string, string> = {
  'workOrders.attachments': 'Attachments',
  'workOrders.dragToUpload': 'Drag files here or click to upload',
  'workOrders.uploadHint': 'Images, PDF, docs, archives. Max 20MB each',
  'workOrders.uploading': 'Uploading...',
  'workOrders.noAttachments': 'No attachments',
  'workOrders.uploadSuccess': 'Attachment uploaded',
  'workOrders.uploadFailed': 'Failed to upload the attachment',
  'workOrders.deleteSuccess': 'Attachment deleted',
  'workOrders.deleteFailed': 'Failed to delete the attachment',
  'common.loading': 'Loading',
  'common.loadFailed': 'Failed to load data',
  'common.retry': 'Retry',
  'common.download': 'Download',
  'common.delete': 'Delete',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/hooks/useWorkOrderAttachments', () => ({
  useWorkOrderAttachments: vi.fn(),
  useUploadAttachment: vi.fn(),
  useDeleteAttachment: vi.fn(),
  formatFileSize: (bytes: number) => `${bytes} B`,
}));

const mockedUseWorkOrderAttachments = vi.mocked(useWorkOrderAttachments);
const mockedUseUploadAttachment = vi.mocked(useUploadAttachment);
const mockedUseDeleteAttachment = vi.mocked(useDeleteAttachment);

const sampleAttachment = {
  id: 'att-1',
  fileName: 'report.pdf',
  contentType: 'application/pdf',
  fileSize: 1024,
  uploadedBy: 'user-1',
  createdAt: '2026-08-14T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseWorkOrderAttachments.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useWorkOrderAttachments>);
  mockedUseUploadAttachment.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUploadAttachment>);
  mockedUseDeleteAttachment.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteAttachment>);
});

describe('工单附件上传反馈', () => {
  it('加载失败时应展示可重试错误而不是暂无附件', async () => {
    const refetch = vi.fn();
    mockedUseWorkOrderAttachments.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useWorkOrderAttachments>);

    render(<AttachmentUpload workOrderId="wo-1" />);

    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.queryByText('No attachments')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /Retry/ }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('成功且为空时应显示空态', () => {
    render(<AttachmentUpload workOrderId="wo-1" />);

    expect(screen.getByText('No attachments')).toBeInTheDocument();
    expect(screen.queryByText('Failed to load data')).not.toBeInTheDocument();
  });

  it('上传成功时应提示成功', async () => {
    const user = userEvent.setup();
    const uploadMutate = vi.fn((_file: File, options?: { onSuccess?: () => void }) => options?.onSuccess?.());
    mockedUseUploadAttachment.mockReturnValue({
      mutate: uploadMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUploadAttachment>);

    const { container } = render(<AttachmentUpload workOrderId="wo-1" canEdit />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'photo.png', { type: 'image/png' });
    await user.upload(input, file);

    expect(uploadMutate).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    expect(toast.success).toHaveBeenCalledWith('Attachment uploaded');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('上传失败时应提示错误', async () => {
    const user = userEvent.setup();
    const uploadMutate = vi.fn((_file: File, options?: { onError?: () => void }) => options?.onError?.());
    mockedUseUploadAttachment.mockReturnValue({
      mutate: uploadMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUploadAttachment>);

    const { container } = render(<AttachmentUpload workOrderId="wo-1" canEdit />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'photo.png', { type: 'image/png' });
    await user.upload(input, file);

    expect(toast.error).toHaveBeenCalledWith('Failed to upload the attachment');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('删除失败时应提示错误而不是静默结束', async () => {
    const user = userEvent.setup();
    const deleteMutate = vi.fn((_id: string, options?: { onError?: () => void }) => options?.onError?.());
    mockedUseWorkOrderAttachments.mockReturnValue({
      data: [sampleAttachment],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWorkOrderAttachments>);
    mockedUseDeleteAttachment.mockReturnValue({
      mutate: deleteMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteAttachment>);

    render(<AttachmentUpload workOrderId="wo-1" canEdit />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteMutate).toHaveBeenCalledWith(
      'att-1',
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    expect(toast.error).toHaveBeenCalledWith('Failed to delete the attachment');
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('删除成功时应提示成功', async () => {
    const user = userEvent.setup();
    const deleteMutate = vi.fn((_id: string, options?: { onSuccess?: () => void }) => options?.onSuccess?.());
    mockedUseWorkOrderAttachments.mockReturnValue({
      data: [sampleAttachment],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWorkOrderAttachments>);
    mockedUseDeleteAttachment.mockReturnValue({
      mutate: deleteMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteAttachment>);

    render(<AttachmentUpload workOrderId="wo-1" canEdit />);
    expect(screen.getByRole('button', { name: 'Download' })).toHaveAccessibleName('Download');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAccessibleName('Delete');
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(toast.success).toHaveBeenCalledWith('Attachment deleted');
    expect(toast.error).not.toHaveBeenCalled();
  });
});
