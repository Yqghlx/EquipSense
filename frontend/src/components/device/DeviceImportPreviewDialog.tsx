import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import {
  useDeviceImportPreview,
  useImportDevices,
  downloadImportTemplate,
} from '../../hooks/useDevices';
import type { DeviceImportPreviewResult, ImportResult } from '../../types';
import { getCriticalityLabel, getDeviceTypeLabel } from '../../utils/labels';
import { AxiosError } from 'axios';

/** 设备导入预览对话框属性 */
interface DeviceImportPreviewDialogProps {
  /** 是否打开对话框 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 待导入的文件 */
  file: File | null;
}

/** 对话框步骤状态 */
type ImportStep = 'previewing' | 'previewed' | 'importing' | 'done' | 'error';

/**
 * 设备导入预览对话框
 *
 * 上传 CSV/JSON 设备清单后先展示预览结果（有效数据 + 错误列表），
 * 用户确认后再执行实际导入。包含错误状态展示和模板下载。
 */
export default function DeviceImportPreviewDialog({ open, onClose, file }: DeviceImportPreviewDialogProps) {
  const { t } = useTranslation();
  const previewMutation = useDeviceImportPreview();
  const importMutation = useImportDevices();
  const [previewResult, setPreviewResult] = useState<DeviceImportPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<ImportStep>('previewing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** 发起预览请求 */
  const handlePreview = () => {
    if (!file) return;
    setStep('previewing');
    setErrorMessage(null);
    previewMutation.mutate(file, {
      onSuccess: (data) => {
        setPreviewResult(data);
        setStep('previewed');
      },
      onError: (err) => {
        setErrorMessage(extractErrorMessage(err));
        setStep('error');
      },
    });
  };

  /** 确认导入 */
  const handleImport = () => {
    if (!file) return;
    setStep('importing');
    setErrorMessage(null);
    importMutation.mutate(file, {
      onSuccess: (data) => {
        setImportResult(data);
        setStep('done');
      },
      onError: (err) => {
        setErrorMessage(extractErrorMessage(err));
        setStep('error');
      },
    });
  };

  /** 关闭并重置所有状态 */
  const handleClose = () => {
    setPreviewResult(null);
    setImportResult(null);
    setStep('previewing');
    setErrorMessage(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            {t('device.importPreview.title', '批量导入设备')}
          </DialogTitle>
          <DialogDescription>
            {step === 'done'
              ? t('device.importPreview.doneDescription', '导入完成')
              : t('device.importPreview.description', '预览文件内容，确认无误后执行导入')}
          </DialogDescription>
        </DialogHeader>

        {/* 预览阶段 */}
        {step === 'previewing' && !previewResult && (
          <div className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">
              {file ? file.name : t('common.noData', '无数据')}
              {file && <span className="ml-2 text-xs text-muted-foreground">({formatFileSize(file.size)})</span>}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={handlePreview} disabled={!file || previewMutation.isPending}>
                {previewMutation.isPending
                  ? t('common.loading', '解析中...')
                  : t('device.importPreview.startPreview', '开始预览')}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadImportTemplate}>
                <Download className="mr-2 h-4 w-4" />
                {t('device.importPreview.downloadTemplate', '下载模板')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('device.importPreview.supportFormat', '支持 CSV、JSON 格式，最大 5MB、10,000 行')}
            </p>
          </div>
        )}

        {/* 预览结果展示 */}
        {previewResult && (step === 'previewed' || step === 'importing') && (
          <div className="space-y-4">
            {/* 统计摘要 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">{t('device.importPreview.totalRows', '总行数')}:</span>
                <Badge variant="outline">{previewResult.totalRows}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">{t('device.importPreview.validCount', '有效')}:</span>
                <Badge variant="default" className="bg-green-600">{previewResult.validCount}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">{t('device.importPreview.errorCount', '错误')}:</span>
                <Badge variant="destructive">{previewResult.errorCount}</Badge>
              </div>
            </div>

            {/* 有效数据预览表格 */}
            {previewResult.validItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">{t('device.importPreview.validItems', '有效数据预览')}</h4>
                <div className="max-h-48 overflow-y-auto border rounded-md">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left">#</th>
                        <th className="px-2 py-1 text-left">{t('device.importPreview.deviceCode', '设备编码')}</th>
                        <th className="px-2 py-1 text-left">{t('device.importPreview.deviceName', '设备名称')}</th>
                        <th className="px-2 py-1 text-left">{t('device.importPreview.deviceType', '类型')}</th>
                        <th className="px-2 py-1 text-left">{t('device.importPreview.manufacturer', '制造商')}</th>
                        <th className="px-2 py-1 text-left">{t('device.importPreview.criticality', '关键等级')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewResult.validItems.slice(0, 20).map((item) => (
                        <tr key={item.rowNumber} className="border-t hover:bg-muted/50">
                          <td className="px-2 py-1">{item.rowNumber}</td>
                          <td className="px-2 py-1 font-mono">{item.deviceCode}</td>
                          <td className="px-2 py-1">{item.name}</td>
                          <td className="px-2 py-1">{getDeviceTypeLabel(t, item.type)}</td>
                          <td className="px-2 py-1">{item.manufacturer || '-'}</td>
                          <td className="px-2 py-1">{getCriticalityLabel(t, item.criticality || 'Normal')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewResult.validItems.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-1 border-t">
                      {t('device.importPreview.moreItems', '还有 {{count}} 条数据未显示', { count: previewResult.validItems.length - 20 })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 错误列表 */}
            {previewResult.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-destructive">
                  {t('device.importPreview.errors', '校验错误')}（{previewResult.errors.length}）
                </h4>
                <div className="max-h-40 overflow-y-auto border border-destructive/30 rounded-md bg-destructive/5 p-2 space-y-1">
                  {previewResult.errors.map((err, i) => (
                    <p key={i} className="text-xs">
                      <span className="font-medium">#{err.rowNumber}:</span> {err.message}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel', '取消')}
              </Button>
              <Button
                onClick={handleImport}
                disabled={previewResult.validCount === 0 || importMutation.isPending}
              >
                {importMutation.isPending
                  ? t('common.loading', '导入中...')
                  : t('device.importPreview.confirmImport', '确认导入 {{count}} 台设备', { count: previewResult.validCount })}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* 导入完成结果 */}
        {step === 'done' && importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">{t('device.importPreview.imported', '已导入')}: <strong>{importResult.imported}</strong></span>
              </div>
              {importResult.skipped > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">{t('device.importPreview.skipped', '已跳过')}: {importResult.skipped}</span>
                </div>
              )}
              {importResult.failed > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{t('device.importPreview.failed', '失败')}: {importResult.failed}</span>
                </div>
              )}
            </div>

            {importResult.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-destructive/30 rounded-md bg-destructive/5 p-2 space-y-1">
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-xs">
                    <span className="font-medium">#{err.rowNumber}:</span> {err.message}
                  </p>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>{t('common.confirm', '确定')}</Button>
            </DialogFooter>
          </div>
        )}

        {/* 错误状态 */}
        {step === 'error' && errorMessage && (
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-medium">{t('device.importPreview.errorTitle', '操作失败')}</span>
            </div>
            <p className="text-sm text-muted-foreground bg-destructive/5 border border-destructive/30 rounded-md p-3">
              {errorMessage}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel', '关闭')}
              </Button>
              <Button onClick={() => setStep(previewResult ? 'previewed' : 'previewing')}>
                {t('common.retry', '重试')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** 从 AxiosError 中提取用户可读的错误信息 */
function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return '未知错误';
}

/** 格式化文件大小 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
