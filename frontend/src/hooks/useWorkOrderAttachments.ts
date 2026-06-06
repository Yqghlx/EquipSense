/**
 * 工单附件上传 hook
 *
 * 提供 TanStack Query 操作：获取附件列表、上传、下载、删除。
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/** 附件 DTO（与后端 WorkOrderAttachmentDto 对应） */
export interface WorkOrderAttachment {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

/** 获取工单附件列表 */
export function useWorkOrderAttachments(workOrderId: string | undefined) {
  return useQuery({
    queryKey: ['work-orders', workOrderId, 'attachments'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderAttachment[]>(
        `/work-orders/${workOrderId}/attachments`
      );
      return data;
    },
    enabled: !!workOrderId,
  });
}

/** 上传附件 */
export function useUploadAttachment(workOrderId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<WorkOrderAttachment>(
        `/work-orders/${workOrderId}/attachments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['work-orders', workOrderId, 'attachments'],
      });
    },
  });
}

/** 删除附件 */
export function useDeleteAttachment(workOrderId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(
        `/work-orders/${workOrderId}/attachments/${attachmentId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['work-orders', workOrderId, 'attachments'],
      });
    },
  });
}

/** 格式化文件大小 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
