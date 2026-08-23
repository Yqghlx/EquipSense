/**
 * 工单附件上传组件
 *
 * 支持拖拽上传、文件列表展示、下载和删除操作。
 * 限制文件大小 20MB，允许图片/PDF/文档/压缩包。
 */
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Upload, FileText, Download, Trash2, Paperclip, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  useWorkOrderAttachments,
  useUploadAttachment,
  useDeleteAttachment,
  formatFileSize,
} from '@/hooks/useWorkOrderAttachments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AttachmentUploadProps {
  workOrderId: string;
  /** 当前用户是否有操作权限（上传/删除） */
  canEdit?: boolean;
}

export default function AttachmentUpload({ workOrderId, canEdit = false }: AttachmentUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const {
    data: attachments,
    isLoading,
    isError,
    refetch,
  } = useWorkOrderAttachments(workOrderId);
  const uploadMutation = useUploadAttachment(workOrderId);
  const deleteMutation = useDeleteAttachment(workOrderId);
  const attachmentList = attachments ?? [];
  const attachmentsFailed = isError && attachments == null;

  // 处理文件选择；每个文件独立回调，失败时必须 toast，避免静默吞掉。
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        uploadMutation.mutate(file, {
          onSuccess: () => toast.success(t('workOrders.uploadSuccess')),
          onError: () => toast.error(t('workOrders.uploadFailed')),
        });
      });
    },
    [t, uploadMutation]
  );

  // 拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // 下载附件
  const handleDownload = (attachmentId: string) => {
    const baseUrl = import.meta.env.DEV ? '' : '';
    window.open(
      `${baseUrl}/api/v1/work-orders/${workOrderId}/attachments/${attachmentId}/download`,
      '_blank'
    );
  };

  /** 删除附件；失败时必须提示，避免用户以为已经删掉。 */
  const handleDelete = (attachmentId: string) => {
    deleteMutation.mutate(attachmentId, {
      onSuccess: () => toast.success(t('workOrders.deleteSuccess')),
      onError: () => toast.error(t('workOrders.deleteFailed')),
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Paperclip className="h-4 w-4" />
          {t('workOrders.attachments', '附件')} ({attachmentList.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 上传区域 */}
        {canEdit && (
          <div
            className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t('workOrders.dragToUpload', '拖拽文件到此处或点击上传')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {t('workOrders.uploadHint', '支持图片、PDF、文档、压缩包，最大 20MB')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.txt,.csv"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {/* 上传进度 */}
        {uploadMutation.isPending && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {t('workOrders.uploading', '正在上传...')}
          </p>
        )}

        {/* 附件列表 */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('common.loading', '加载中...')}</p>
        ) : attachmentsFailed ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <p className="text-sm text-muted-foreground">{t('common.loadFailed')}</p>
            <Button variant="outline" size="sm" onClick={() => { void refetch(); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.retry')}
            </Button>
          </div>
        ) : attachmentList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('workOrders.noAttachments', '暂无附件')}
          </p>
        ) : (
          <ul className="space-y-2">
            {attachmentList.map((att) => (
              <li
                key={att.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm" title={att.fileName}>
                    {att.fileName}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatFileSize(att.fileSize)}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDownload(att.id)}
                    title={t('common.download', '下载')}
                    aria-label={t('common.download', '下载')}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(att.id)}
                      disabled={deleteMutation.isPending}
                      title={t('common.delete', '删除')}
                      aria-label={t('common.delete', '删除')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
